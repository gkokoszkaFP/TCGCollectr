# TCGCollectr Database Schema

1. **List of Tables**

### tcg_types

| Column       | Type        | Constraints            |
| ------------ | ----------- | ---------------------- |
| code         | text        | primary key            |
| display_name | text        | not null               |
| is_active    | boolean     | not null default true  |
| created_at   | timestamptz | not null default now() |

### rarities

| Column       | Type        | Constraints                                           |
| ------------ | ----------- | ----------------------------------------------------- |
| id           | uuid        | primary key default gen_random_uuid()                 |
| tcg_type     | text        | not null references tcg_types(code) on update cascade |
| slug         | text        | not null unique                                       |
| display_name | text        | not null                                              |
| sort_order   | smallint    | not null default 0                                    |
| created_at   | timestamptz | not null default now()                                |

### sets

| Column         | Type        | Constraints                                           |
| -------------- | ----------- | ----------------------------------------------------- |
| id             | uuid        | primary key default gen_random_uuid()                 |
| tcg_type       | text        | not null references tcg_types(code) on update cascade |
| external_id    | text        | not null unique                                       |
| name           | text        | not null                                              |
| abbreviation   | text        | not null                                              |
| series         | text        |                                                       |
| release_date   | date        |                                                       |
| total_cards    | integer     | not null default 0                                    |
| symbol_url     | text        |                                                       |
| logo_url       | text        |                                                       |
| last_synced_at | timestamptz |                                                       |
| created_at     | timestamptz | not null default now()                                |
| updated_at     | timestamptz | not null default now()                                |

### cards

| Column                          | Type                         | Constraints                                                                                                  |
| ------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------ |
| id                              | uuid                         | primary key default gen_random_uuid()                                                                        |
| tcg_type                        | text                         | not null references tcg_types(code) on update cascade                                                        |
| set_id                          | uuid                         | not null references sets(id) on delete cascade                                                               |
| external_id                     | text                         | not null unique                                                                                              |
| name                            | text                         | not null                                                                                                     |
| card_number                     | text                         | not null                                                                                                     |
| number_sort                     | integer                      | generated always as (coalesce(nullif(regexp_replace(card_number, '\\D', '', 'g'), ''), '0')::integer) stored |
| rarity_id                       | uuid                         | references rarities(id) on update cascade                                                                    |
| supertype                       | text                         |                                                                                                              |
| subtypes                        | text[]                       | not null default '{}'                                                                                        |
| types                           | text[]                       | not null default '{}'                                                                                        |
| hp                              | integer                      |                                                                                                              |
| artist                          | text                         |                                                                                                              |
| flavor_text                     | text                         |                                                                                                              |
| legalities                      | jsonb                        |                                                                                                              |
| image_small_url                 | text                         |                                                                                                              |
| image_large_url                 | text                         |                                                                                                              |
| created_at                      | timestamptz                  | not null default now()                                                                                       |
| updated_at                      | timestamptz                  | not null default now()                                                                                       |
| CONSTRAINT cards_unique_per_set | unique (set_id, card_number) |

### price_sources

| Column       | Type        | Constraints            |
| ------------ | ----------- | ---------------------- |
| code         | text        | primary key            |
| display_name | text        | not null               |
| data_url     | text        |                        |
| priority     | smallint    | not null default 0     |
| is_active    | boolean     | not null default true  |
| created_at   | timestamptz | not null default now() |

### card_prices

| Column                    | Type                                | Constraints                                               |
| ------------------------- | ----------------------------------- | --------------------------------------------------------- |
| card_id                   | uuid                                | not null references cards(id) on delete cascade           |
| price_source              | text                                | not null references price_sources(code) on update cascade |
| currency_code             | char(3)                             | not null default 'USD'                                    |
| market_price              | numeric(12,2)                       | not null                                                  |
| low_price                 | numeric(12,2)                       |                                                           |
| high_price                | numeric(12,2)                       |                                                           |
| last_seen_at              | timestamptz                         | not null default now()                                    |
| source_payload            | jsonb                               |                                                           |
| created_at                | timestamptz                         | not null default now()                                    |
| CONSTRAINT card_prices_pk | primary key (card_id, price_source) |

### card_conditions

| Column      | Type        | Constraints            |
| ----------- | ----------- | ---------------------- |
| code        | text        | primary key            |
| label       | text        | not null               |
| description | text        |                        |
| sort_order  | smallint    | not null default 0     |
| is_default  | boolean     | not null default false |
| created_at  | timestamptz | not null default now() |

### collection_entries

| Column         | Type          | Constraints                                           |
| -------------- | ------------- | ----------------------------------------------------- |
| id             | bigint        | primary key generated always as identity              |
| user_id        | uuid          | not null references auth.users(id) on delete cascade  |
| card_id        | uuid          | not null references cards(id) on delete cascade       |
| set_id         | uuid          | not null references sets(id) on update cascade        |
| tcg_type       | text          | not null references tcg_types(code) on update cascade |
| condition_code | text          | references card_conditions(code) on update cascade    |
| quantity       | integer       | not null check (quantity > 0)                         |
| acquired_at    | date          |                                                       |
| purchase_price | numeric(12,2) |                                                       |
| notes          | text          |                                                       |
| created_at     | timestamptz   | not null default now()                                |
| updated_at     | timestamptz   | not null default now()                                |

### api_cache

| Column              | Type        | Constraints            |
| ------------------- | ----------- | ---------------------- |
| cache_key           | text        | primary key            |
| source              | text        | not null               |
| status_code         | integer     |                        |
| payload             | jsonb       | not null               |
| etag                | text        |                        |
| fetched_at          | timestamptz | not null default now() |
| expires_at          | timestamptz | not null               |
| last_used_at        | timestamptz | not null default now() |
| request_fingerprint | text        |                        |

### Derived Views (read-only layer)

| Object                                     | Definition                                                                                                                                                                                               |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| collection_set_summary (materialized view) | Aggregates `collection_entries` joined to `sets`, `cards`, and `card_prices` to produce per-user counts (distinct cards, total quantity, set-level estimated value). Refresh via cron after price syncs. |
| collection_value_view (view)               | Per-user total estimated value (sum(quantity \* latest price)) plus card count, used for profile dashboard metrics.                                                                                      |

2. **Relationships Between Tables**

- `tcg_types` 1→N `sets`, `cards`, `rarities`, and `collection_entries` to support future multi-TCG expansion.
- `sets` 1→N `cards`; cascading deletes ensure orphaned cards are removed if a set is purged.
- `rarities` 1→N `cards` for normalized rarity metadata.
- `cards` 1→N `card_prices` and 1→N `collection_entries`.
- `price_sources` 1→N `card_prices`, allowing multiple market feeds per card.
- `auth.users` 1→N `collection_entries` via `user_id` FK with ON DELETE CASCADE to clean up data when a user is deleted.
- `card_conditions` 1→N `collection_entries` enabling consistent condition labels without ENUM migrations.
- `collection_entries` ↔ `card_prices` (via joins) supply derived valuations in views; no direct FK to keep price source optional.
- `api_cache` is independent, keyed by endpoint fingerprint, consumed by Edge Functions.

3. **Indexes**

- `cards`:
  - `idx_cards_set_number` on (set_id, number_sort, card_number) for grouping/sorting within sets.
  - `idx_cards_name_trgm` GIN index on `name gin_trgm_ops` for fuzzy search/autocomplete.
  - `idx_cards_tcg_type` on (tcg_type) to future-proof multi-franchise filters.
- `sets`:
  - `idx_sets_tcg_type_release` on (tcg_type, release_date DESC) for catalog browsing.
- `card_prices`:
  - `idx_card_prices_source_currency` on (price_source, currency_code) for cache invalidation and reporting.
  - `idx_card_prices_last_seen` on (last_seen_at) to find stale records.
- `collection_entries`:
  - `idx_collection_entries_user_card` on (user_id, card_id) for quick lookups when editing existing entries.
  - `idx_collection_entries_user_set` on (user_id, set_id, number_sort) using `number_sort` via join to `cards` materialized in view; consider `set_id` column to avoid extra join in pagination.
  - `idx_collection_entries_user_created` on (user_id, created_at DESC) for recent activity feeds.
- `api_cache`:
  - `idx_api_cache_expires` on (expires_at) to support eviction jobs.

4. **PostgreSQL Policies (RLS enabled on every table)**

- `tcg_types`, `sets`, `rarities`, `cards`, `card_prices`, `card_conditions`, `price_sources`:
  - Enable RLS; grant SELECT to `anon` and `authenticated` via policy `allow_catalog_read` (`using (true)`), no write policies (service role only).
- `collection_entries`:
  - Policy `own_entries_select` (SELECT) with `using (user_id = auth.uid())`.
  - Policy `own_entries_insert` (INSERT) with `with check (user_id = auth.uid())`.
  - Policy `own_entries_update` (UPDATE) with `using (user_id = auth.uid())` and `with check (user_id = auth.uid())`.
  - Policy `own_entries_delete` (DELETE) with `using (user_id = auth.uid())`.
- `collection_set_summary` / `collection_value_view`:
  - Add security barrier and RLS policies mirroring `collection_entries` by exposing `user_id` columns.
- `api_cache`:
  - Enable RLS; no policies for anon/auth. Only service role (Edge Functions) can read/write using Supabase service key, preventing exposure to clients.

5. **Additional Notes**

- Add triggers on `sets`, `cards`, and `collection_entries` to auto-update `updated_at` timestamps and to keep `collection_entries.set_id` + `tcg_type` synchronized with the referenced `cards` row.
- Seed `tcg_types` with `pokemon` (active) to support MVP, but schema allows more franchises without migrations.
- Populate `card_conditions` with PSA-style codes (NM, LP, MP, HP, DMG) and mark `NM` as default for UI preselection.
- Maintain materialized view refresh cadence: refresh `collection_set_summary` and `collection_value_view` after price syncs or on-demand via Supabase cron.
- Store pricing payload snapshots (`source_payload`) for auditability and to render price metadata when APIs are unavailable (aligns with 24-hour cache requirement).
- `api_cache` records should be pruned nightly using TTL (`expires_at`) to keep table size manageable; consider partitioning by month if growth warrants.
- `auth.users` is provisioned and fully managed by Supabase Auth, so no separate `users` table is required beyond referencing `auth.users(id)` in foreign keys such as `collection_entries.user_id`.
