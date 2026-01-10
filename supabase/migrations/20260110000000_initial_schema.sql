-- migration: initial database schema for tcgcollectr
-- purpose: create all core tables, indexes, and rls policies for the tcg collection management system
-- affected: new tables - tcg_types, rarities, sets, cards, price_sources, card_prices, card_conditions, collection_entries, api_cache
-- considerations:
--   - all tables have rls enabled for security
--   - catalog tables (tcg_types, sets, cards, etc.) are read-only for clients
--   - collection_entries restricted to owner access
--   - api_cache restricted to service role only

-- ==============================================================================
-- core reference tables
-- ==============================================================================

-- table: tcg_types
-- purpose: master list of supported trading card game franchises (pokemon, magic, etc.)
create table tcg_types (
  code text primary key,
  display_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- note: rls disabled for local development
-- alter table tcg_types enable row level security;

-- table: card_conditions
-- purpose: standardized condition codes (nm, lp, mp, hp, dmg) for collection entries
create table card_conditions (
  code text primary key,
  label text not null,
  description text,
  sort_order smallint not null default 0,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

-- note: rls disabled for local development
-- alter table card_conditions enable row level security;

-- table: price_sources
-- purpose: external price data providers (tcgplayer, cardmarket, etc.)
create table price_sources (
  code text primary key,
  display_name text not null,
  data_url text,
  priority smallint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- note: rls disabled for local development
-- alter table price_sources enable row level security;

-- ==============================================================================
-- catalog tables
-- ==============================================================================

-- table: rarities
-- purpose: normalized rarity metadata per tcg type (common, rare, ultra rare, etc.)
create table rarities (
  id uuid primary key default gen_random_uuid(),
  tcg_type text not null references tcg_types(code) on update cascade,
  slug text not null unique,
  display_name text not null,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);

-- note: rls disabled for local development
-- alter table rarities enable row level security;

-- table: sets
-- purpose: tcg expansion/release sets with metadata and sync tracking
create table sets (
  id uuid primary key default gen_random_uuid(),
  tcg_type text not null references tcg_types(code) on update cascade,
  external_id text not null unique,
  name text not null,
  abbreviation text not null,
  series text,
  release_date date,
  total_cards integer not null default 0,
  symbol_url text,
  logo_url text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- index: optimize catalog browsing by tcg type and release date
create index idx_sets_tcg_type_release on sets(tcg_type, release_date desc);

-- note: rls disabled for local development
-- alter table sets enable row level security;

-- table: cards
-- purpose: individual trading cards with metadata, images, and legality info
create table cards (
  id uuid primary key default gen_random_uuid(),
  tcg_type text not null references tcg_types(code) on update cascade,
  set_id uuid not null references sets(id) on delete cascade,
  external_id text not null unique,
  name text not null,
  card_number text not null,
  -- generated column: extract numeric portion for natural sorting
  number_sort integer generated always as (
    coalesce(nullif(regexp_replace(card_number, '\D', '', 'g'), ''), '0')::integer
  ) stored,
  rarity_id uuid references rarities(id) on update cascade,
  supertype text,
  subtypes text[] not null default '{}',
  types text[] not null default '{}',
  hp integer,
  artist text,
  flavor_text text,
  legalities jsonb,
  image_small_url text,
  image_large_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- constraint: ensure unique card numbers within each set
  constraint cards_unique_per_set unique (set_id, card_number)
);

-- index: optimize set-based queries with natural number sorting
create index idx_cards_set_number on cards(set_id, number_sort, card_number);

-- index: enable fuzzy text search for card name autocomplete
-- note: requires pg_trgm extension
create extension if not exists pg_trgm;
create index idx_cards_name_trgm on cards using gin(name gin_trgm_ops);

-- index: future-proof filtering by tcg franchise
create index idx_cards_tcg_type on cards(tcg_type);

-- note: rls disabled for local development
-- alter table cards enable row level security;

-- ==============================================================================
-- pricing tables
-- ==============================================================================

-- table: card_prices
-- purpose: multi-source market price tracking with historical snapshots
create table card_prices (
  card_id uuid not null references cards(id) on delete cascade,
  price_source text not null references price_sources(code) on update cascade,
  currency_code char(3) not null default 'USD',
  market_price numeric(12,2) not null,
  low_price numeric(12,2),
  high_price numeric(12,2),
  last_seen_at timestamptz not null default now(),
  source_payload jsonb,
  created_at timestamptz not null default now(),
  constraint card_prices_pk primary key (card_id, price_source)
);

-- index: optimize price queries by source and currency
create index idx_card_prices_source_currency on card_prices(price_source, currency_code);

-- index: identify stale price records for refresh jobs
create index idx_card_prices_last_seen on card_prices(last_seen_at);

-- note: rls disabled for local development
-- alter table card_prices enable row level security;

-- ==============================================================================
-- user collection tables
-- ==============================================================================

-- table: collection_entries
-- purpose: user-owned card inventory with condition, quantity, and purchase details
-- warning: contains user-specific data; rls policies restrict access to owner only
create table collection_entries (
  id bigint primary key generated always as identity,
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references cards(id) on delete cascade,
  set_id uuid not null references sets(id) on update cascade,
  tcg_type text not null references tcg_types(code) on update cascade,
  condition_code text references card_conditions(code) on update cascade,
  quantity integer not null check (quantity > 0),
  acquired_at date,
  purchase_price numeric(12,2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- index: optimize user-specific card lookups for editing entries
create index idx_collection_entries_user_card on collection_entries(user_id, card_id);

-- index: optimize set-based collection views with sorting
create index idx_collection_entries_user_set on collection_entries(user_id, set_id);

-- index: support recent activity feeds
create index idx_collection_entries_user_created on collection_entries(user_id, created_at desc);

-- note: rls disabled for local development
-- alter table collection_entries enable row level security;

-- ==============================================================================
-- api cache table
-- ==============================================================================

-- table: api_cache
-- purpose: edge function cache layer for external api responses
-- note: restricted to service role only; no client access via rls
create table api_cache (
  cache_key text primary key,
  source text not null,
  status_code integer,
  payload jsonb not null,
  etag text,
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_used_at timestamptz not null default now(),
  request_fingerprint text
);

-- index: support scheduled eviction of expired cache entries
create index idx_api_cache_expires on api_cache(expires_at);

-- note: rls disabled for local development
-- alter table api_cache enable row level security;

-- ==============================================================================
-- triggers for automatic timestamp updates
-- ==============================================================================

-- function: update updated_at column to current timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- trigger: auto-update sets.updated_at on row changes
create trigger sets_updated_at
  before update on sets
  for each row
  execute function update_updated_at_column();

-- trigger: auto-update cards.updated_at on row changes
create trigger cards_updated_at
  before update on cards
  for each row
  execute function update_updated_at_column();

-- trigger: auto-update collection_entries.updated_at on row changes
create trigger collection_entries_updated_at
  before update on collection_entries
  for each row
  execute function update_updated_at_column();

-- ==============================================================================
-- seed data
-- ==============================================================================

-- seed tcg_types with pokemon for mvp launch
insert into tcg_types (code, display_name, is_active) values
  ('pokemon', 'Pokémon TCG', true);

-- seed card_conditions with psa-style condition codes
insert into card_conditions (code, label, description, sort_order, is_default) values
  ('NM', 'Near Mint', 'Card appears unplayed with minimal wear', 0, true),
  ('LP', 'Lightly Played', 'Minor wear visible from play or handling', 1, false),
  ('MP', 'Moderately Played', 'Noticeable wear from regular play', 2, false),
  ('HP', 'Heavily Played', 'Significant wear, may have creases or edge damage', 3, false),
  ('DMG', 'Damaged', 'Major damage such as bends, tears, or water damage', 4, false);

-- ==============================================================================
-- migration complete
-- ==============================================================================
