-- Migration: Create sets table
-- Purpose: Store Pokémon TCG sets/expansions metadata cached from TCGDex API
-- Affected tables: sets (new)
-- Special considerations: Public read access, service role manages updates via API sync

-- Create sets table
create table sets (
  id text primary key,
  name text not null unique,
  series text,
  total_cards integer not null,
  release_date date,
  logo_url text,
  symbol_url text,
  tcg_type text default 'pokemon' not null,
  last_synced_at timestamptz default now() not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable row level security
alter table sets enable row level security;

-- Policy: Allow all users (authenticated and unauthenticated) to view all sets
-- Rationale: Set data is public reference data that all users need to browse
create policy "sets_select_public"
  on sets for select
  to public
  using (true);

-- Service role can manage set data via API syncing (automatically bypasses RLS)
-- No explicit INSERT/UPDATE/DELETE policies needed for service role
