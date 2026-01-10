-- migration: disable rls for local development
-- purpose: disable row level security on all tables to facilitate local api development
-- affected: tcg_types, card_conditions, price_sources, rarities, sets, cards, card_prices, collection_entries, api_cache
-- considerations:
--   - this is temporary for local development only
--   - rls will be re-enabled in a future migration before production deployment
--   - all policies are dropped to prevent any access restrictions during local testing

-- ==============================================================================
-- disable rls and drop policies on all tables
-- ==============================================================================

-- disable rls on tcg_types
alter table tcg_types disable row level security;
drop policy if exists "tcg_types_select_anon" on tcg_types;
drop policy if exists "tcg_types_select_authenticated" on tcg_types;

-- disable rls on card_conditions
alter table card_conditions disable row level security;
drop policy if exists "card_conditions_select_anon" on card_conditions;
drop policy if exists "card_conditions_select_authenticated" on card_conditions;

-- disable rls on price_sources
alter table price_sources disable row level security;
drop policy if exists "price_sources_select_anon" on price_sources;
drop policy if exists "price_sources_select_authenticated" on price_sources;

-- disable rls on rarities
alter table rarities disable row level security;
drop policy if exists "rarities_select_anon" on rarities;
drop policy if exists "rarities_select_authenticated" on rarities;

-- disable rls on sets
alter table sets disable row level security;
drop policy if exists "sets_select_anon" on sets;
drop policy if exists "sets_select_authenticated" on sets;

-- disable rls on cards
alter table cards disable row level security;
drop policy if exists "cards_select_anon" on cards;
drop policy if exists "cards_select_authenticated" on cards;

-- disable rls on card_prices
alter table card_prices disable row level security;
drop policy if exists "card_prices_select_anon" on card_prices;
drop policy if exists "card_prices_select_authenticated" on card_prices;

-- disable rls on collection_entries
alter table collection_entries disable row level security;
drop policy if exists "collection_entries_select_own" on collection_entries;
drop policy if exists "collection_entries_insert_own" on collection_entries;
drop policy if exists "collection_entries_update_own" on collection_entries;
drop policy if exists "collection_entries_delete_own" on collection_entries;

-- disable rls on api_cache
alter table api_cache disable row level security;

-- ==============================================================================
-- migration complete
-- ==============================================================================
