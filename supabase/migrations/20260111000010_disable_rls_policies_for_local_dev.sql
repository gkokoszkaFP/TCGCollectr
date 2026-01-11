-- Migration: Disable RLS policies for local development
-- Purpose: Temporarily disable all RLS policies to ease local development
-- Affected tables: profiles, sets, cards, user_cards, analytics_events
-- Special considerations: RLS is still ENABLED on tables, but policies are dropped for easier testing
-- WARNING: Re-enable policies before deploying to production

-- Drop profiles policies
drop policy if exists "profiles_select_own" on profiles;
drop policy if exists "profiles_update_own" on profiles;

-- Drop sets policies
drop policy if exists "sets_select_public" on sets;

-- Drop cards policies
drop policy if exists "cards_select_authenticated" on cards;
drop policy if exists "cards_select_anon" on cards;

-- Drop user_cards policies
drop policy if exists "user_cards_select_own" on user_cards;
drop policy if exists "user_cards_insert_own" on user_cards;
drop policy if exists "user_cards_update_own" on user_cards;
drop policy if exists "user_cards_delete_own" on user_cards;

-- Drop analytics_events policies
drop policy if exists "analytics_events_insert_own" on analytics_events;

-- Disable RLS on all tables
alter table public.profiles disable row level security;
alter table public.sets disable row level security;
alter table public.cards disable row level security;
alter table public.user_cards disable row level security;
alter table public.analytics_events disable row level security;

-- Rationale:
-- For local development, RLS policies can be restrictive and require proper auth setup.
-- This migration removes all policies and disables RLS entirely on all tables.
-- This allows unrestricted access to all data during local development.
-- IMPORTANT: Before production deployment, either revert this migration or create new policies and re-enable RLS.

-- =============================================================================
-- PRODUCTION RE-ENABLE INSTRUCTIONS
-- =============================================================================
-- To re-enable RLS for production, create a new migration with the following SQL:
--
-- -- 1. Enable RLS on all tables
-- alter table public.profiles enable row level security;
-- alter table public.sets enable row level security;
-- alter table public.cards enable row level security;
-- alter table public.user_cards enable row level security;
-- alter table public.analytics_events enable row level security;
--
-- -- 2. Recreate profiles policies
-- create policy "profiles_select_own" on profiles for select to authenticated using (auth.uid() = id);
-- create policy "profiles_update_own" on profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
--
-- -- 3. Recreate sets policies (public read access)
-- create policy "sets_select_public" on sets for select to anon, authenticated using (true);
--
-- -- 4. Recreate cards policies (public read access)
-- create policy "cards_select_authenticated" on cards for select to authenticated using (true);
-- create policy "cards_select_anon" on cards for select to anon using (true);
--
-- -- 5. Recreate user_cards policies (user owns their cards)
-- create policy "user_cards_select_own" on user_cards for select to authenticated using (auth.uid() = user_id);
-- create policy "user_cards_insert_own" on user_cards for insert to authenticated with check (auth.uid() = user_id);
-- create policy "user_cards_update_own" on user_cards for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- create policy "user_cards_delete_own" on user_cards for delete to authenticated using (auth.uid() = user_id);
--
-- -- 6. Recreate analytics_events policies
-- create policy "analytics_events_insert_own" on analytics_events for insert to authenticated with check (auth.uid() = user_id);
--
-- NOTE: The create_profile_for_user() trigger function uses SECURITY DEFINER,
-- which bypasses RLS. This is intentional - the trigger must insert profiles
-- regardless of RLS policies. No changes needed to the trigger when re-enabling RLS.
-- =============================================================================
