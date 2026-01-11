-- Migration: Create profiles table
-- Purpose: Store user profile information linked to Supabase auth users
-- Affected tables: profiles (new), auth.users (foreign key reference)
-- Special considerations: Cascades on user deletion, auto-created via trigger

-- Create profiles table
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  onboarding_completed boolean default false not null,
  favorite_type text,
  favorite_set text,
  total_cards_count integer default 0 not null check (total_cards_count >= 0 and total_cards_count <= 10000),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable row level security
alter table profiles enable row level security;

-- Policy: Allow authenticated users to view their own profile
create policy "profiles_select_own"
  on profiles for select
  to authenticated
  using (auth.uid() = id);

-- Policy: Allow authenticated users to update their own profile
create policy "profiles_update_own"
  on profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Rationale for RLS policies:
-- Users should only access and modify their own profile data.
-- Profile deletion is automatically handled via CASCADE when auth.users record is deleted.
-- No INSERT policy needed since profiles are auto-created via trigger.
-- No DELETE policy needed since deletion is handled automatically.
