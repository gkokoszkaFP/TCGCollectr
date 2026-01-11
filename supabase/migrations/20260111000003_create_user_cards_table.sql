-- Migration: Create user_cards table
-- Purpose: Store user's collection entries with variants and quantities
-- Affected tables: user_cards (new), profiles (foreign key), cards (foreign key)
-- Special considerations: Cascades on user deletion, RESTRICT on card deletion, complex triggers for limit enforcement

-- Create user_cards table
create table user_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  card_id text not null references cards(id) on delete restrict,
  variant text not null check (variant in ('normal', 'reverse', 'holo', 'firstEdition')),
  quantity integer not null default 1 check (quantity >= 1 and quantity <= 1000),
  wishlisted boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(user_id, card_id, variant)
);

-- Enable row level security
alter table user_cards enable row level security;

-- Policy: Allow authenticated users to view their own collection
create policy "user_cards_select_own"
  on user_cards for select
  to authenticated
  using (auth.uid() = user_id);

-- Policy: Allow authenticated users to insert cards into their collection
create policy "user_cards_insert_own"
  on user_cards for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Policy: Allow authenticated users to update their own collection entries
create policy "user_cards_update_own"
  on user_cards for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policy: Allow authenticated users to delete from their own collection
create policy "user_cards_delete_own"
  on user_cards for delete
  to authenticated
  using (auth.uid() = user_id);

-- Rationale for RLS policies:
-- Complete isolation between users' collections with least privilege principle.
-- Each user can only view, insert, update, and delete their own collection data.
-- No access to other users' collections enforced at database level.
