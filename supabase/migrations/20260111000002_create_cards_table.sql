-- Migration: Create cards table
-- Purpose: Store card metadata cached from TCGDex API for offline support and fast browsing
-- Affected tables: cards (new), sets (foreign key reference)
-- Special considerations: References sets, public read access, service role manages updates

-- Create cards table
create table cards (
  id text primary key,
  set_id text not null references sets(id) on delete restrict,
  name text not null,
  card_number text not null,
  rarity text,
  types text[],
  hp integer,
  image_url_small text,
  image_url_large text,
  tcg_type text default 'pokemon' not null,
  last_synced_at timestamptz default now() not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable row level security
alter table cards enable row level security;

-- Policy: Allow authenticated users to view all cards
-- Rationale: Card data is public reference data for authenticated users
create policy "cards_select_authenticated"
  on cards for select
  to authenticated
  using (true);

-- Policy: Allow unauthenticated users to view all cards
-- Rationale: Allow public browsing of cards without authentication
create policy "cards_select_anon"
  on cards for select
  to anon
  using (true);

-- Service role can manage card data via API syncing (automatically bypasses RLS)
-- Cards are read-only for users; only service role performs INSERT/UPDATE/DELETE
