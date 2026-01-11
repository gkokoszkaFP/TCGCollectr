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

-- Rationale:
-- For local development, RLS policies can be restrictive and require proper auth setup.
-- This migration removes all policies while keeping RLS enabled on tables.
-- Tables remain protected by RLS being enabled, but without policies all operations are blocked by default.
-- Service role bypasses RLS and can still access all data.
-- IMPORTANT: Before production deployment, either revert this migration or create new policies.
