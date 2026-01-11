# Database Planning Summary - TCGCollectr MVP

## Overview

This document summarizes the database planning decisions for TCGCollectr, a Pokémon TCG collection management PWA using Supabase (PostgreSQL) as the backend.

---

## Decisions

1. **Composite Unique Constraint**: Use composite unique constraint on `(user_id, card_id, variant)` in `user_cards` table to enforce duplicate handling via `ON CONFLICT ... DO UPDATE`.

2. **Card Data Caching**: Store essential card metadata (card_id, name, set_id, set_name, card_number, rarity, image_url) in a `cards` table for offline support and reduced API dependency.

3. **Variant Field Type**: Use `TEXT` field with `CHECK` constraint for variant values: `'normal'`, `'reverse'`, `'holo'`, `'firstEdition'`.

4. **Card Limit Enforcement**: Implement 10,000 card limit per user at database level (trigger) and API level. Use denormalized `total_cards_count` counter on `profiles` table.

5. **Wishlist Implementation**: Use `wishlisted BOOLEAN DEFAULT FALSE` column on `user_cards` table for owned cards only. Separate `wishlists` table for unowned cards deferred to post-MVP.

6. **Indexing Strategy**: Create indexes on `user_id`, `(user_id, wishlisted)`, GIN index on `name` with `pg_trgm` for partial matching, indexes on `set_id` and `types`.

7. **Set Completion Calculation**: Calculate on-demand for MVP using query-based approach. No pre-computation needed within 10,000 card limit.

8. **Row-Level Security**: Implement granular RLS policies per operation (SELECT, INSERT, UPDATE, DELETE) using `auth.uid()` for user data isolation.

9. **Profiles Table**: Link to `auth.users` with `ON DELETE CASCADE`. Include `onboarding_completed`, `favorite_type`, `favorite_set`, `total_cards_count`.

10. **Partitioning**: Not required for MVP given 10,000 card limit. Reassess post-MVP based on scaling needs.

11. **Cache Freshness Tracking**: Implement `last_synced_at TIMESTAMPTZ` on `cards` and `sets` tables. Manual user-triggered refresh only for MVP (no automated jobs).

12. **Multi-TCG Expansion**: Design for Pokémon TCG specifically but use generic naming (`cards`, `sets`, `user_cards`). Add `tcg_type TEXT DEFAULT 'pokemon'` for future expansion path.

13. **Timestamp Columns**: Include `created_at`, `updated_at` on all tables. Add `last_synced_at` on cache tables (`cards`, `sets`). Use triggers for auto-updating `updated_at`.

14. **Sets Table Structure**: Include `id`, `name`, `series`, `total_cards` (for completion %), `release_date`, `logo_url`, `symbol_url`, timestamps.

15. **Pokémon Types Storage**: Store as `TEXT[]` array on `cards` table with GIN index for efficient filtering.

16. **Deletion Strategy**: Use hard deletes for `user_cards` in MVP. CSV export provides user backup capability.

17. **Quantity Constraints**: Apply `CHECK (quantity >= 1)` and `CHECK (quantity <= 1000)` constraints. Default value is 1.

18. **Image Storage**: Store only TCGDex CDN URLs (`image_url_small`, `image_url_large`), not actual image files.

19. **Analytics Events**: Create `analytics_events` table with `event_type TEXT`, `user_id UUID`, `event_data JSONB`, `created_at TIMESTAMPTZ`.

20. **Foreign Key Cascades**: `profiles` → `auth.users` CASCADE, `user_cards` → `profiles` CASCADE, `user_cards` → `cards` RESTRICT, `cards` → `sets` RESTRICT.

---

## Matched Recommendations

1. **Data Integrity**: Composite unique constraint on `(user_id, card_id, variant)` with upsert pattern ensures no duplicate entries.

2. **Offline Support**: Cached card metadata in database enables offline collection viewing per FR-07.

3. **Type Safety**: CHECK constraint on variant provides flexibility for future additions while maintaining data integrity.

4. **Limit Enforcement**: Multi-layer enforcement (trigger + counter + API) provides robust protection against exceeding limits.

5. **Query Optimization**: Denormalized counter column eliminates expensive `SUM(quantity)` aggregations for limit checks.

6. **Performance**: Strategic indexing on frequently queried columns and GIN indexes for array/text search operations.

7. **Security**: Granular RLS policies per table and operation following Supabase best practices.

8. **Referential Integrity**: Appropriate CASCADE/RESTRICT behaviors maintain data consistency while enabling user data removal.

9. **Extensibility**: Generic naming and `tcg_type` column provide migration path without over-engineering MVP.

10. **Audit Trail**: Comprehensive timestamps support analytics requirements and cache management.

---

## Database Planning Summary

### Main Requirements

- **Authentication**: Supabase Auth integration with linked `profiles` table
- **Collection Management**: Track user-owned cards with quantity and variant
- **Wishlist**: Track desired cards (owned cards only for MVP)
- **Offline Support**: Cached card/set data for offline viewing
- **Set Completion**: Calculate progress as percentage of unique cards owned
- **Analytics**: Track user events for success metrics
- **Card Limit**: 10,000 cards per user maximum
- **Data Export**: Support CSV export of collection data

### Key Entities and Relationships

```
┌─────────────────┐       ┌─────────────────┐
│   auth.users    │       │      sets       │
│─────────────────│       │─────────────────│
│ id (PK)         │       │ id (PK)         │
└────────┬────────┘       │ name            │
         │                │ series          │
         │ 1:1            │ total_cards     │
         │ CASCADE        │ release_date    │
         ▼                │ logo_url        │
┌─────────────────┐       │ symbol_url      │
│    profiles     │       │ last_synced_at  │
│─────────────────│       │ created_at      │
│ id (PK, FK)     │       │ updated_at      │
│ created_at      │       └────────┬────────┘
│ updated_at      │                │
│ onboarding_done │                │ 1:N
│ favorite_type   │                │ RESTRICT
│ favorite_set    │                ▼
│ total_cards_cnt │       ┌─────────────────┐
└────────┬────────┘       │      cards      │
         │                │─────────────────│
         │                │ id (PK)         │
         │ 1:N            │ set_id (FK)     │
         │ CASCADE        │ name            │
         │                │ card_number     │
         ▼                │ rarity          │
┌─────────────────┐       │ types (TEXT[])  │
│   user_cards    │       │ image_url_small │
│─────────────────│       │ image_url_large │
│ id (PK)         │       │ tcg_type        │
│ user_id (FK)    │──────▶│ last_synced_at  │
│ card_id (FK)    │ N:1   │ created_at      │
│ variant         │RESTRICT│ updated_at      │
│ quantity        │       └─────────────────┘
│ wishlisted      │
│ created_at      │
│ updated_at      │
└─────────────────┘
         ▲
         │
         │ UNIQUE
         │
(user_id, card_id,
 variant)
                          ┌─────────────────┐
                          │ analytics_events│
                          │─────────────────│
                          │ id (PK)         │
                          │ event_type      │
                          │ user_id (FK)    │
                          │ event_data JSONB│
                          │ created_at      │
                          └─────────────────┘
```

### Security Concerns

| Table              | SELECT            | INSERT                | UPDATE            | DELETE            |
| ------------------ | ----------------- | --------------------- | ----------------- | ----------------- |
| `profiles`         | Own record only   | Own `auth.uid()` only | Own record only   | Via CASCADE       |
| `user_cards`       | Own records only  | Own `auth.uid()` only | Own records only  | Own records only  |
| `cards`            | All authenticated | Service role only     | Service role only | Restricted        |
| `sets`             | Public (all)      | Service role only     | Service role only | Restricted        |
| `analytics_events` | Service role only | Own `auth.uid()` only | None              | Service role only |

### Scalability Considerations

- **MVP Scope**: 10,000 cards/user limit makes partitioning unnecessary
- **Indexing**: Strategic indexes on query-heavy columns
- **Denormalization**: Counter column for efficient limit checking
- **Cache Strategy**: Manual refresh for MVP, consider automated sync post-MVP
- **Query Optimization**: On-demand calculations acceptable within limits

### Constraints Summary

| Table        | Constraint                                                 | Type                |
| ------------ | ---------------------------------------------------------- | ------------------- |
| `user_cards` | `(user_id, card_id, variant)`                              | UNIQUE              |
| `user_cards` | `quantity >= 1`                                            | CHECK               |
| `user_cards` | `quantity <= 1000`                                         | CHECK               |
| `user_cards` | `variant IN ('normal', 'reverse', 'holo', 'firstEdition')` | CHECK               |
| `cards`      | `tcg_type DEFAULT 'pokemon'`                               | DEFAULT             |
| `profiles`   | `total_cards_count <= 10000`                               | CHECK (via trigger) |

---

## Resolved Issues

1. **Wishlist for Unowned Cards**: MVP limits wishlist functionality to owned cards only (using `wishlisted` boolean on `user_cards` table). Separate `wishlists` table for unowned cards deferred to post-MVP.

2. **Card Sync Trigger**: MVP implements card-level refresh only. A "Refresh Card" button on card detail view re-syncs individual card data from TCGDex API, updating `last_synced_at` timestamp. Rate limited to once per hour per card. Set-level and global refresh features deferred to post-MVP as potential pro+ features.

3. **Analytics Retention**: 90-day retention policy for `analytics_events` table. Implement scheduled cleanup: `DELETE FROM analytics_events WHERE created_at < NOW() - INTERVAL '90 days'`. Manual trigger for MVP, automated cron post-MVP.

4. **Rate Limit Storage**: Handle rate limiting at API/middleware level only using in-memory tracking (Map with timestamps). No database storage needed for MVP single-instance deployment. Consider Redis or database table for distributed deployments post-MVP.

5. **Profile Creation Trigger**: Use database trigger for automatic profile creation on `auth.users` INSERT. Ensures profiles are always created regardless of user creation method and prevents orphaned auth users.

---

## Next Steps

1. Create database migration files in `supabase/migrations/`
2. Implement RLS policies for each table
3. Create database triggers for:
   - Auto-create profile on user registration
   - Auto-update `updated_at` timestamps
   - Enforce card limit via `total_cards_count`
4. Generate TypeScript types from schema
5. Test migrations locally with Supabase CLI
