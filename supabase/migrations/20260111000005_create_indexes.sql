-- Migration: Create indexes for performance optimization
-- Purpose: Support efficient queries across all tables
-- Affected tables: user_cards, cards, sets, analytics_events
-- Special considerations: GIN indexes for array types, trigram extension for text search

-- Enable pg_trgm extension for trigram-based text search
create extension if not exists pg_trgm;

-- Index on user_id for quick collection lookups
create index idx_user_cards_user_id on user_cards(user_id);

-- Composite index for wishlisted cards filtering
create index idx_user_cards_user_wishlisted on user_cards(user_id, wishlisted);

-- Index on card_id for card update queries during syncing
create index idx_user_cards_card_id on user_cards(card_id);

-- Index on set_id for filtering cards by set
create index idx_cards_set_id on cards(set_id);

-- GIN index for efficient Pokémon type array filtering
-- Rationale: Supports fast filtering by types (e.g., "where 'grass' = any(types)")
create index idx_cards_types on cards using gin(types);

-- GIN index with trigram operator for card name partial matching
-- Rationale: Enables fast substring search on card names (e.g., "Pikachu%")
-- Requires pg_trgm extension which is typically available on Supabase
create index idx_cards_name_search on cards using gin(name gin_trgm_ops);

-- Index on created_at for analytics queries and retention cleanup
create index idx_analytics_events_created_at on analytics_events(created_at);

-- Index for analytics event type filtering
create index idx_analytics_events_type on analytics_events(event_type);

-- Index for finding user analytics
create index idx_analytics_events_user_id on analytics_events(user_id);
