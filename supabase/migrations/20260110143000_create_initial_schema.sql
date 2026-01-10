-- migration: create initial tcgcollectr schema
-- purpose: establish complete database schema for trading card game collection management
-- affected: all core tables, indexes, views, functions, triggers, and rls policies
-- considerations: this is the foundation migration - all subsequent migrations will build upon this schema

-- =============================================================================
-- 1. catalog tables - tcg types and card data
-- =============================================================================

-- -----------------------------------------------------------------------------
-- tcg_types: lookup table for trading card game types
-- supports future multi-tcg expansion beyond pokemon
-- -----------------------------------------------------------------------------
create table tcg_types (
  id smallint primary key generated always as identity,
  code varchar(20) not null unique,
  name varchar(100) not null,
  created_at timestamptz not null default now()
);

-- seed initial data with pokemon tcg
insert into tcg_types (code, name) values ('pokemon', 'Pokémon TCG');

-- -----------------------------------------------------------------------------
-- sets: card sets/expansions imported from tcgcsv.com
-- represents releases like "base set", "scarlet & violet", etc.
-- -----------------------------------------------------------------------------
create table sets (
  id uuid primary key default gen_random_uuid(),
  tcg_type_id smallint not null references tcg_types(id),
  external_id varchar(50) not null,
  name varchar(255) not null,
  series varchar(255),
  release_date date,
  total_cards integer,
  logo_url text,
  symbol_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tcg_type_id, external_id)
);

-- -----------------------------------------------------------------------------
-- rarities: lookup table for card rarity values
-- examples: common, uncommon, rare, ultra rare, etc.
-- -----------------------------------------------------------------------------
create table rarities (
  id smallint primary key generated always as identity,
  tcg_type_id smallint not null references tcg_types(id),
  code varchar(50) not null,
  name varchar(100) not null,
  sort_order smallint not null default 0,
  unique (tcg_type_id, code)
);

-- -----------------------------------------------------------------------------
-- cards: card catalog imported from tcgcsv.com with pokemontcg.io supplementary data
-- core catalog table containing all card details
-- -----------------------------------------------------------------------------
create table cards (
  id uuid primary key default gen_random_uuid(),
  tcg_type_id smallint not null references tcg_types(id),
  set_id uuid not null references sets(id) on delete cascade,
  external_id varchar(50) not null,
  name varchar(255) not null,
  card_number varchar(20) not null,
  rarity_id smallint references rarities(id),
  card_type varchar(50),
  supertype varchar(50),
  subtypes text[],
  hp smallint,
  types text[],
  evolves_from varchar(100),
  abilities jsonb,
  attacks jsonb,
  weaknesses jsonb,
  resistances jsonb,
  retreat_cost text[],
  rules text[],
  artist varchar(255),
  flavor_text text,
  image_small_url text,
  image_large_url text,
  api_data_fetched boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tcg_type_id, external_id)
);

-- =============================================================================
-- 2. pricing tables - market data from multiple sources
-- =============================================================================

-- -----------------------------------------------------------------------------
-- price_sources: lookup table for price data sources
-- tracks where pricing data originates (tcgplayer, pokemontcg.io, etc.)
-- -----------------------------------------------------------------------------
create table price_sources (
  id smallint primary key generated always as identity,
  code varchar(50) not null unique,
  name varchar(100) not null,
  url text
);

-- seed initial price sources
insert into price_sources (code, name, url) values
  ('tcgcsv', 'TCGPlayer (via tcgcsv.com)', 'https://tcgcsv.com'),
  ('pokemontcg', 'pokemontcg.io', 'https://pokemontcg.io');

-- -----------------------------------------------------------------------------
-- card_prices: market pricing data for cards
-- supports multiple price types (market, low, mid, high) from various sources
-- -----------------------------------------------------------------------------
create table card_prices (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references cards(id) on delete cascade,
  price_source_id smallint not null references price_sources(id),
  price_type varchar(50) not null default 'market',
  price numeric(10,2),
  currency char(3) not null default 'USD',
  fetched_at timestamptz not null default now(),
  unique (card_id, price_source_id, price_type)
);

-- =============================================================================
-- 3. user collection tables - user data and card ownership
-- =============================================================================

-- -----------------------------------------------------------------------------
-- card_conditions: lookup table for card condition values
-- standardized condition scale from mint to poor
-- -----------------------------------------------------------------------------
create table card_conditions (
  id smallint primary key generated always as identity,
  code varchar(20) not null unique,
  name varchar(50) not null,
  sort_order smallint not null default 0
);

-- seed condition values (fr-003 condition scale)
insert into card_conditions (code, name, sort_order) values
  ('mint', 'Mint', 1),
  ('near_mint', 'Near Mint', 2),
  ('excellent', 'Excellent', 3),
  ('good', 'Good', 4),
  ('played', 'Played', 5),
  ('poor', 'Poor', 6);

-- -----------------------------------------------------------------------------
-- grading_companies: lookup table for professional grading companies
-- supports psa, bgs, cgc grading integration
-- -----------------------------------------------------------------------------
create table grading_companies (
  id smallint primary key generated always as identity,
  code varchar(10) not null unique,
  name varchar(100) not null,
  min_grade numeric(3,1) not null default 1.0,
  max_grade numeric(3,1) not null default 10.0
);

-- seed grading companies (fr-003)
insert into grading_companies (code, name) values
  ('PSA', 'Professional Sports Authenticator'),
  ('BGS', 'Beckett Grading Services'),
  ('CGC', 'Certified Guaranty Company');

-- -----------------------------------------------------------------------------
-- user_profiles: extended user profile information
-- references supabase auth.users with additional app-specific fields
-- -----------------------------------------------------------------------------
create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name varchar(100),
  avatar_url text,
  is_admin boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- collection_entries: user card collection entries
-- represents owned cards with quantity, condition, and optional grading info
-- allows multiple entries per user/card for different conditions/grades
-- -----------------------------------------------------------------------------
create table collection_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references cards(id) on delete cascade,
  condition_id smallint not null references card_conditions(id),
  quantity integer not null default 1 check (quantity > 0),
  grading_company_id smallint references grading_companies(id),
  grade_value numeric(3,1) check (grade_value is null or (grade_value >= 1.0 and grade_value <= 10.0)),
  purchase_price numeric(10,2) check (purchase_price is null or purchase_price >= 0),
  notes varchar(500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- ensure grade company is required if grade value is provided (us-019)
  constraint grade_company_required check (
    (grade_value is null and grading_company_id is null) or
    (grade_value is not null and grading_company_id is not null)
  ),
  -- allow multiple entries per user/card for different conditions (decision 3)
  unique (user_id, card_id, condition_id, grading_company_id, grade_value)
);

-- -----------------------------------------------------------------------------
-- user_lists: custom user-defined lists for organizing collection
-- fr-004: max 10 lists per user (enforced by trigger)
-- -----------------------------------------------------------------------------
create table user_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name varchar(50) not null,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

-- -----------------------------------------------------------------------------
-- list_entries: junction table linking collection entries to user lists
-- implements many-to-many relationship between lists and collection entries
-- -----------------------------------------------------------------------------
create table list_entries (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references user_lists(id) on delete cascade,
  collection_entry_id uuid not null references collection_entries(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (list_id, collection_entry_id)
);

-- =============================================================================
-- 4. api caching tables - external api response caching
-- =============================================================================

-- -----------------------------------------------------------------------------
-- api_cache: cache for pokemontcg.io api responses
-- 24-hour ttl per tech stack requirements
-- -----------------------------------------------------------------------------
create table api_cache (
  id uuid primary key default gen_random_uuid(),
  endpoint_key varchar(255) not null unique,
  payload jsonb not null,
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null
);

-- =============================================================================
-- 5. import and admin tables - data import job tracking
-- =============================================================================

-- -----------------------------------------------------------------------------
-- import_jobs: import job tracking for admin monitoring
-- fr-007, fr-008: track csv import status and progress
-- -----------------------------------------------------------------------------
create table import_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type varchar(50) not null,
  status varchar(20) not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
  started_at timestamptz,
  completed_at timestamptz,
  total_records integer not null default 0,
  success_count integer not null default 0,
  failure_count integer not null default 0,
  error_details jsonb,
  triggered_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- =============================================================================
-- 6. indexes for query performance optimization
-- =============================================================================

-- catalog performance indexes
-- sets: sort by release date (us-007)
create index idx_sets_release_date on sets (tcg_type_id, release_date desc nulls last);

-- sets: search by name
create index idx_sets_name on sets using gin (to_tsvector('english', name));

-- cards: composite index for set browsing and card number sorting (us-008)
create index idx_cards_set_number on cards (set_id, card_number);

-- cards: full-text search on card name (fr-002, us-009)
create index idx_cards_name_search on cards using gin (to_tsvector('english', name));

-- cards: filter by rarity (us-010)
create index idx_cards_rarity on cards (rarity_id) where rarity_id is not null;

-- cards: filter by card type
create index idx_cards_type on cards (card_type) where card_type is not null;

-- cards: external id lookups for import upserts
create index idx_cards_external_id on cards (tcg_type_id, external_id);

-- pricing indexes
-- card prices: lookup by card
create index idx_card_prices_card on card_prices (card_id);

-- card prices: filter by fetched date for freshness
create index idx_card_prices_fetched on card_prices (fetched_at desc);

-- collection indexes
-- collection entries: user's collection queries (primary access pattern)
create index idx_collection_user on collection_entries (user_id);

-- collection entries: user + card lookups (us-031 duplicate detection)
create index idx_collection_user_card on collection_entries (user_id, card_id);

-- user lists: user's lists
create index idx_user_lists_user on user_lists (user_id);

-- list entries: list contents
create index idx_list_entries_list on list_entries (list_id);

-- list entries: find lists containing an entry
create index idx_list_entries_entry on list_entries (collection_entry_id);

-- cache indexes
-- api cache: expiration-based eviction
create index idx_api_cache_expires on api_cache (expires_at);

-- admin indexes
-- import jobs: status filtering and date sorting (fr-008, us-025)
create index idx_import_jobs_status on import_jobs (status, created_at desc);

-- =============================================================================
-- 7. views for collection statistics and value calculations
-- =============================================================================

-- -----------------------------------------------------------------------------
-- collection_set_summary: per-set collection statistics
-- provides completion percentage and card counts for user collection view
-- -----------------------------------------------------------------------------
create or replace view collection_set_summary as
select
  ce.user_id,
  s.id as set_id,
  s.name as set_name,
  s.total_cards as set_total_cards,
  count(distinct ce.card_id) as owned_unique_cards,
  sum(ce.quantity) as owned_total_cards,
  round(
    (count(distinct ce.card_id)::numeric / nullif(s.total_cards, 0)) * 100,
    1
  ) as completion_percentage
from collection_entries ce
join cards c on c.id = ce.card_id
join sets s on s.id = c.set_id
group by ce.user_id, s.id, s.name, s.total_cards;

-- -----------------------------------------------------------------------------
-- collection_value_view: total collection value calculation
-- us-016: provides market value, purchase cost, and profit/loss metrics
-- -----------------------------------------------------------------------------
create or replace view collection_value_view as
select
  ce.user_id,
  count(*) as total_entries,
  sum(ce.quantity) as total_cards,
  sum(ce.quantity * coalesce(cp.price, 0)) as total_market_value,
  sum(ce.quantity * coalesce(ce.purchase_price, 0)) as total_purchase_cost,
  sum(ce.quantity * coalesce(cp.price, 0)) - sum(ce.quantity * coalesce(ce.purchase_price, 0)) as total_profit_loss
from collection_entries ce
left join lateral (
  select price
  from card_prices
  where card_id = ce.card_id
    and price_type = 'market'
  order by fetched_at desc
  limit 1
) cp on true
group by ce.user_id;

-- =============================================================================
-- 8. database functions and triggers
-- =============================================================================

-- -----------------------------------------------------------------------------
-- handle_new_user: automatically create user profile on signup
-- triggered when new user is created in auth.users
-- -----------------------------------------------------------------------------
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- -----------------------------------------------------------------------------
-- update_updated_at_column: automatically update updated_at timestamp
-- generic trigger function for maintaining updated_at columns
-- -----------------------------------------------------------------------------
create or replace function update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- apply updated_at trigger to relevant tables
create trigger update_sets_updated_at
  before update on sets
  for each row execute procedure update_updated_at_column();

create trigger update_cards_updated_at
  before update on cards
  for each row execute procedure update_updated_at_column();

create trigger update_user_profiles_updated_at
  before update on user_profiles
  for each row execute procedure update_updated_at_column();

create trigger update_collection_entries_updated_at
  before update on collection_entries
  for each row execute procedure update_updated_at_column();

create trigger update_user_lists_updated_at
  before update on user_lists
  for each row execute procedure update_updated_at_column();

-- -----------------------------------------------------------------------------
-- check_user_list_limit: enforce maximum 10 lists per user
-- fr-004: prevents users from creating more than 10 custom lists
-- -----------------------------------------------------------------------------
create or replace function check_user_list_limit()
returns trigger
language plpgsql
as $$
declare
  list_count integer;
begin
  select count(*) into list_count
  from user_lists
  where user_id = new.user_id;

  if list_count >= 10 then
    raise exception 'Maximum number of lists (10) reached for this user';
  end if;

  return new;
end;
$$;

create trigger enforce_user_list_limit
  before insert on user_lists
  for each row execute procedure check_user_list_limit();

-- -----------------------------------------------------------------------------
-- cleanup_expired_api_cache: remove expired cache entries
-- helper function for cache maintenance (can be called by scheduled job)
-- -----------------------------------------------------------------------------
create or replace function cleanup_expired_api_cache()
returns integer
language plpgsql
as $$
declare
  deleted_count integer;
begin
  delete from api_cache where expires_at < now();
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

-- =============================================================================
-- 9. row level security (rls) policies
-- =============================================================================

-- -----------------------------------------------------------------------------
-- enable rls on all tables
-- public catalog tables allow anonymous read access
-- user-scoped tables restrict access to authenticated users
-- -----------------------------------------------------------------------------

-- public catalog tables - readable by anonymous and authenticated users
alter table tcg_types enable row level security;
alter table sets enable row level security;
alter table cards enable row level security;
alter table rarities enable row level security;
alter table price_sources enable row level security;
alter table card_conditions enable row level security;
alter table grading_companies enable row level security;
alter table card_prices enable row level security;

-- user-scoped tables - require authentication
alter table user_profiles enable row level security;
alter table collection_entries enable row level security;
alter table user_lists enable row level security;
alter table list_entries enable row level security;

-- admin tables - admin-only access
alter table import_jobs enable row level security;

-- -----------------------------------------------------------------------------
-- tcg_types: public read access
-- rationale: tcg types are reference data needed for catalog browsing
-- behavior: allows all users (anonymous and authenticated) to read tcg types
-- -----------------------------------------------------------------------------
create policy "tcg_types_select_anon"
  on tcg_types for select
  to anon
  using (true);

create policy "tcg_types_select_authenticated"
  on tcg_types for select
  to authenticated
  using (true);

-- -----------------------------------------------------------------------------
-- sets: public read access
-- rationale: set catalog is public reference data
-- behavior: allows all users to browse and search card sets
-- -----------------------------------------------------------------------------
create policy "sets_select_anon"
  on sets for select
  to anon
  using (true);

create policy "sets_select_authenticated"
  on sets for select
  to authenticated
  using (true);

-- -----------------------------------------------------------------------------
-- cards: public read access
-- rationale: card catalog is public reference data
-- behavior: allows all users to browse and search cards
-- -----------------------------------------------------------------------------
create policy "cards_select_anon"
  on cards for select
  to anon
  using (true);

create policy "cards_select_authenticated"
  on cards for select
  to authenticated
  using (true);

-- -----------------------------------------------------------------------------
-- rarities: public read access
-- rationale: rarity values are reference data for filtering
-- behavior: allows all users to view rarity options
-- -----------------------------------------------------------------------------
create policy "rarities_select_anon"
  on rarities for select
  to anon
  using (true);

create policy "rarities_select_authenticated"
  on rarities for select
  to authenticated
  using (true);

-- -----------------------------------------------------------------------------
-- price_sources: public read access
-- rationale: price source information helps users understand pricing data
-- behavior: allows all users to view available price sources
-- -----------------------------------------------------------------------------
create policy "price_sources_select_anon"
  on price_sources for select
  to anon
  using (true);

create policy "price_sources_select_authenticated"
  on price_sources for select
  to authenticated
  using (true);

-- -----------------------------------------------------------------------------
-- card_conditions: public read access
-- rationale: condition values are reference data for collection management
-- behavior: allows all users to view condition options
-- -----------------------------------------------------------------------------
create policy "card_conditions_select_anon"
  on card_conditions for select
  to anon
  using (true);

create policy "card_conditions_select_authenticated"
  on card_conditions for select
  to authenticated
  using (true);

-- -----------------------------------------------------------------------------
-- grading_companies: public read access
-- rationale: grading company information is reference data
-- behavior: allows all users to view grading company options
-- -----------------------------------------------------------------------------
create policy "grading_companies_select_anon"
  on grading_companies for select
  to anon
  using (true);

create policy "grading_companies_select_authenticated"
  on grading_companies for select
  to authenticated
  using (true);

-- -----------------------------------------------------------------------------
-- card_prices: public read access
-- rationale: pricing data is public market information
-- behavior: allows all users to view card pricing for valuation
-- -----------------------------------------------------------------------------
create policy "card_prices_select_anon"
  on card_prices for select
  to anon
  using (true);

create policy "card_prices_select_authenticated"
  on card_prices for select
  to authenticated
  using (true);

-- -----------------------------------------------------------------------------
-- user_profiles: authenticated users can manage their own profile
-- rationale: users need full crud access to their profile data
-- behavior: restricts access to user's own profile record
-- -----------------------------------------------------------------------------
create policy "user_profiles_select_own"
  on user_profiles for select
  to authenticated
  using (id = auth.uid());

create policy "user_profiles_insert_own"
  on user_profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "user_profiles_update_own"
  on user_profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "user_profiles_delete_own"
  on user_profiles for delete
  to authenticated
  using (id = auth.uid());

-- -----------------------------------------------------------------------------
-- collection_entries: authenticated users can manage their own collection
-- rationale: users need full crud access to their collection entries
-- behavior: restricts access to user's own collection entries only
-- -----------------------------------------------------------------------------
create policy "collection_entries_select_own"
  on collection_entries for select
  to authenticated
  using (user_id = auth.uid());

create policy "collection_entries_insert_own"
  on collection_entries for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "collection_entries_update_own"
  on collection_entries for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "collection_entries_delete_own"
  on collection_entries for delete
  to authenticated
  using (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- user_lists: authenticated users can manage their own lists
-- rationale: users need full crud access to organize their collection
-- behavior: restricts access to user's own lists only (max 10 enforced by trigger)
-- -----------------------------------------------------------------------------
create policy "user_lists_select_own"
  on user_lists for select
  to authenticated
  using (user_id = auth.uid());

create policy "user_lists_insert_own"
  on user_lists for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "user_lists_update_own"
  on user_lists for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "user_lists_delete_own"
  on user_lists for delete
  to authenticated
  using (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- list_entries: authenticated users can manage entries in their own lists
-- rationale: users need crud access to add/remove cards from their lists
-- behavior: restricts access through ownership check on parent user_lists table
-- -----------------------------------------------------------------------------
create policy "list_entries_select_own"
  on list_entries for select
  to authenticated
  using (
    exists (
      select 1 from user_lists ul
      where ul.id = list_entries.list_id
        and ul.user_id = auth.uid()
    )
  );

create policy "list_entries_insert_own"
  on list_entries for insert
  to authenticated
  with check (
    exists (
      select 1 from user_lists ul
      where ul.id = list_entries.list_id
        and ul.user_id = auth.uid()
    )
  );

create policy "list_entries_delete_own"
  on list_entries for delete
  to authenticated
  using (
    exists (
      select 1 from user_lists ul
      where ul.id = list_entries.list_id
        and ul.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- import_jobs: admin-only access for monitoring data imports
-- rationale: only administrators should view/trigger import operations
-- behavior: restricts access to users with is_admin flag in user_profiles
-- -----------------------------------------------------------------------------
create policy "import_jobs_select_admin"
  on import_jobs for select
  to authenticated
  using (
    exists (
      select 1 from user_profiles up
      where up.id = auth.uid()
        and up.is_admin = true
    )
  );

create policy "import_jobs_insert_admin"
  on import_jobs for insert
  to authenticated
  with check (
    exists (
      select 1 from user_profiles up
      where up.id = auth.uid()
        and up.is_admin = true
    )
  );
