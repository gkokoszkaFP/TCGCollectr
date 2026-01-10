-- migration: disable rls policies for local development
-- purpose: turn off row level security for easier local development and testing
-- affected: all tables with rls enabled in previous migration
-- considerations: this is for local development only - rls should be re-enabled for production

-- =============================================================================
-- drop all rls policies created in initial schema migration
-- =============================================================================

-- tcg_types policies
drop policy if exists "tcg_types_select_anon" on tcg_types;
drop policy if exists "tcg_types_select_authenticated" on tcg_types;

-- sets policies
drop policy if exists "sets_select_anon" on sets;
drop policy if exists "sets_select_authenticated" on sets;

-- cards policies
drop policy if exists "cards_select_anon" on cards;
drop policy if exists "cards_select_authenticated" on cards;

-- rarities policies
drop policy if exists "rarities_select_anon" on rarities;
drop policy if exists "rarities_select_authenticated" on rarities;

-- price_sources policies
drop policy if exists "price_sources_select_anon" on price_sources;
drop policy if exists "price_sources_select_authenticated" on price_sources;

-- card_conditions policies
drop policy if exists "card_conditions_select_anon" on card_conditions;
drop policy if exists "card_conditions_select_authenticated" on card_conditions;

-- grading_companies policies
drop policy if exists "grading_companies_select_anon" on grading_companies;
drop policy if exists "grading_companies_select_authenticated" on grading_companies;

-- card_prices policies
drop policy if exists "card_prices_select_anon" on card_prices;
drop policy if exists "card_prices_select_authenticated" on card_prices;

-- user_profiles policies
drop policy if exists "user_profiles_select_own" on user_profiles;
drop policy if exists "user_profiles_insert_own" on user_profiles;
drop policy if exists "user_profiles_update_own" on user_profiles;
drop policy if exists "user_profiles_delete_own" on user_profiles;

-- collection_entries policies
drop policy if exists "collection_entries_select_own" on collection_entries;
drop policy if exists "collection_entries_insert_own" on collection_entries;
drop policy if exists "collection_entries_update_own" on collection_entries;
drop policy if exists "collection_entries_delete_own" on collection_entries;

-- user_lists policies
drop policy if exists "user_lists_select_own" on user_lists;
drop policy if exists "user_lists_insert_own" on user_lists;
drop policy if exists "user_lists_update_own" on user_lists;
drop policy if exists "user_lists_delete_own" on user_lists;

-- list_entries policies
drop policy if exists "list_entries_select_own" on list_entries;
drop policy if exists "list_entries_insert_own" on list_entries;
drop policy if exists "list_entries_delete_own" on list_entries;

-- import_jobs policies
drop policy if exists "import_jobs_select_admin" on import_jobs;
drop policy if exists "import_jobs_insert_admin" on import_jobs;

-- =============================================================================
-- disable rls on all tables
-- =============================================================================

-- public catalog tables
alter table tcg_types disable row level security;
alter table sets disable row level security;
alter table cards disable row level security;
alter table rarities disable row level security;
alter table price_sources disable row level security;
alter table card_conditions disable row level security;
alter table grading_companies disable row level security;
alter table card_prices disable row level security;

-- user-scoped tables
alter table user_profiles disable row level security;
alter table collection_entries disable row level security;
alter table user_lists disable row level security;
alter table list_entries disable row level security;

-- admin tables
alter table import_jobs disable row level security;
