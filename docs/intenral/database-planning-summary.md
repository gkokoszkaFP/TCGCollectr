<conversation_summary>

# Database Planning Summary - TCGCollectr

## Decisions

1. **Separate tables for card data sources**: Use a single `cards` table for CSV data (source of truth) and a separate `card_details_cache` table for pokemontcg.io API data with `fetched_at` timestamp for 24-hour TTL management.

2. **User collection modeling**: Allow multiple entries of the same card per user using a surrogate UUID primary key on `user_cards`. This supports different conditions/grades for the same card (e.g., "2 mint copies and 1 PSA 10 graded copy").

3. **Separate sets table**: Create a `sets` table with `(id, name, series, release_date, total_cards, logo_url, symbol_url)` referenced via `set_id` foreign key in `cards`.

4. **List assignments**: Implement many-to-many relationship via `user_card_lists` junction table with `(user_card_id, list_id)`. Cascade delete from junction table when list is deleted, but preserve `user_cards`.

5. **Grade storage**: Store grades in `user_cards` with `grade_company` (enum: 'PSA', 'BGS', 'CGC') and `grade_value` (DECIMAL(2,1), range 1.0-10.0) with CHECK constraint requiring company when value is provided.

6. **Soft-delete mechanism**: Add `deleted_at` timestamp to `profiles` table. RLS policies filter soft-deleted users. pg_cron job permanently deletes after 30-day grace period.

7. **Indexing strategy**: GIN index with pg_trgm on `cards(name)`, B-tree indexes on `set_id`, `card_number`, `rarity`, `price_usd`, composite index on `(set_id, card_number)`, and indexes on `user_cards(user_id)` and `user_lists(user_id)`.

8. **Import job logging**: `import_jobs` table with status enum ('running', 'success', 'failed', 'partial'), JSONB error_details, triggered_by enum, and 30-day retention via pg_cron.

9. **Admin role management**: Use Supabase Auth custom claims (`raw_app_meta_data->>'role' = 'admin'`) with database-level RLS enforcement.

10. **Price storage**: Current prices only with `price_usd` (DECIMAL(10,2)) and `price_updated_at` timestamp. No historical tracking for MVP.

11. **Card identifier strategy**: Use tcgcsv.com unique identifier as primary key for `cards` table. Store `pokemontcg_id` as separate nullable column for API cache linking.

12. **Condition enum**: PostgreSQL ENUM `card_condition` with values: `mint`, `near_mint`, `excellent`, `good`, `played`, `poor`.

13. **Cache table structure**: `card_details_cache` with `card_id` (PK), `data` (JSONB), extracted `image_url_small`/`image_url_large`, `fetched_at`, and computed `expires_at`.

14. **User lists constraints**: VARCHAR(50) name limit, partial unique index on `(user_id, LOWER(name))` for case-insensitive uniqueness.

15. **Profiles table**: Links to `auth.users(id)` with ON DELETE CASCADE, contains `deleted_at`, `created_at`, `updated_at`. Auto-created via trigger on user signup.

16. **Price precision**: DECIMAL(10,2) for all price fields with CHECK constraints preventing negative values.

17. **Sets metadata**: Include `series` for grouping, indexes on `release_date` and `series`.

18. **RLS policies**: Granular policies per table - public read for catalog, own-records-only for user data, admin-only for import_jobs, service-role for cache writes.

19. **List limit enforcement**: Database trigger function to enforce 10-list maximum per user at database level.

---

## Matched Recommendations

1. **Data architecture**: Separation of concerns between source-of-truth CSV data and cached API data enables clean imports and independent cache refresh cycles.

2. **Flexible collection tracking**: Surrogate key approach on `user_cards` provides maximum flexibility for collectors with varied tracking needs.

3. **Normalized set data**: Dedicated `sets` table improves query performance for set listings and enables efficient filtering.

4. **Proper junction tables**: `user_card_lists` junction table correctly models many-to-many relationship with appropriate cascade behavior.

5. **Type-safe enums**: PostgreSQL ENUMs for `card_condition`, `grade_company`, `import_status`, and `trigger_type` provide validation and storage efficiency.

6. **Soft-delete with grace period**: `profiles.deleted_at` pattern with pg_cron cleanup balances data protection with user recovery needs.

7. **Search-optimized indexing**: GIN + pg_trgm for fuzzy search, strategic B-tree indexes for filtering, composite indexes for common access patterns.

8. **Audit-ready import logging**: JSONB error_details provides flexibility for debugging while structured columns enable reporting.

9. **Database-enforced authorization**: RLS policies eliminate need for application-level auth checks, reducing security vulnerabilities.

10. **Trigger-based business rules**: Database triggers for list limits and profile creation ensure consistency regardless of data entry point.

---

## Database Planning Summary

### Main Requirements

The TCGCollectr MVP requires a PostgreSQL database supporting:

- **Card catalog**: 15,000+ Pokémon cards with daily price updates from tcgcsv.com
- **Supplementary data**: On-demand card details from pokemontcg.io with 24-hour caching
- **User collections**: Personal card tracking with quantity, condition, grades, purchase prices, and notes
- **Custom organization**: Up to 10 named lists per user with multi-list card assignments
- **Authentication**: Email/password auth via Supabase with soft-delete and 30-day recovery
- **Administration**: Import monitoring, manual triggers, and platform statistics

### Key Entities and Relationships

```
┌─────────────┐       ┌─────────────────────┐
│    sets     │       │  card_details_cache │
│─────────────│       │─────────────────────│
│ id (PK)     │       │ card_id (PK, FK)    │
│ name        │       │ data (JSONB)        │
│ series      │       │ image_url_small     │
│ release_date│       │ image_url_large     │
│ total_cards │       │ fetched_at          │
│ logo_url    │       │ expires_at          │
│ symbol_url  │       └──────────┬──────────┘
└──────┬──────┘                  │
       │                         │
       │ 1:N                     │ 1:1
       ▼                         ▼
┌─────────────────────────────────────────┐
│                 cards                    │
│─────────────────────────────────────────│
│ id (PK) - tcgcsv identifier             │
│ set_id (FK)                             │
│ pokemontcg_id                           │
│ name, card_number, rarity, type         │
│ price_usd, price_updated_at             │
└──────────────────┬──────────────────────┘
                   │
                   │ 1:N
                   ▼
┌─────────────────────────────────────────┐
│              user_cards                  │
│─────────────────────────────────────────│
│ id (PK) - UUID                          │
│ user_id (FK to auth.users)              │
│ card_id (FK)                            │
│ quantity, condition (ENUM)              │
│ grade_company, grade_value              │
│ purchase_price, notes                   │
└──────────────────┬──────────────────────┘
                   │
                   │ N:M
                   ▼
┌─────────────────────────────────────────┐
│           user_card_lists                │
│─────────────────────────────────────────│
│ user_card_id (FK)                       │
│ list_id (FK)                            │
└──────────────────┬──────────────────────┘
                   │
                   │ N:1
                   ▼
┌─────────────────────────────────────────┐
│              user_lists                  │
│─────────────────────────────────────────│
│ id (PK) - UUID                          │
│ user_id (FK)                            │
│ name (VARCHAR 50, unique per user)      │
└─────────────────────────────────────────┘

┌─────────────┐       ┌─────────────────────┐
│  profiles   │       │    import_jobs      │
│─────────────│       │─────────────────────│
│ id (PK, FK) │       │ id (PK)             │
│ deleted_at  │       │ started_at          │
│ created_at  │       │ completed_at        │
│ updated_at  │       │ status (ENUM)       │
└─────────────┘       │ total_records       │
                      │ success/failure_cnt │
                      │ error_details (JSON)│
                      │ triggered_by (ENUM) │
                      │ admin_user_id       │
                      └─────────────────────┘
```

### Security Considerations

1. **Row Level Security (RLS)**: All tables have RLS enabled with granular policies:
   - Public catalog (sets, cards, cache): Read-only for all users
   - User data (user_cards, user_lists): Own records only via `auth.uid() = user_id`
   - Admin tables (import_jobs): Admin role check via JWT claims
   - Service operations: Service role for imports and cache updates

2. **Soft-delete isolation**: RLS policies JOIN to `profiles` to exclude soft-deleted users from all queries

3. **Database-level validation**:
   - CHECK constraints for grade requirements and price ranges
   - Trigger-enforced list limits
   - ENUM types prevent invalid values

4. **Admin access**: Enforced via `auth.jwt()->>'role' = 'admin'` in RLS, not application code

### Scalability Considerations

1. **Indexing for performance**: Strategic indexes support sub-200ms search requirement
2. **Efficient caching**: 24-hour TTL on API cache reduces external API calls
3. **Upsert imports**: Incremental daily updates avoid full table rebuilds
4. **JSONB flexibility**: Cache table uses JSONB for schema evolution without migrations
5. **Retention policies**: 30-day cleanup of import logs and deleted accounts via pg_cron

---

## Unresolved Issues

1. **tcgcsv.com identifier format**: Need to confirm exact format of card identifiers from tcgcsv.com CSV files to finalize `cards.id` column type and format.

2. **Full-text search implementation**: Decision pending on whether to use pg_trgm GIN indexes alone or add `tsvector` columns for comprehensive full-text search across card names and Pokémon names.

3. **Series grouping source**: Need to determine if series information is available in tcgcsv.com data or must be manually maintained/sourced elsewhere.

4. **Edge Function authentication**: Need to confirm how Edge Functions will authenticate to update `card_details_cache` (service role key vs. custom auth).

5. **Import failure handling**: Define retry strategy for failed imports and whether partial imports should be rolled back or committed.
   </conversation_summary>
