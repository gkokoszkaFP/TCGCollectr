# TCGCollectr Database Schema

## Overview

This document defines the PostgreSQL database schema for TCGCollectr, a Trading Card Game collection management application. The schema is designed for Supabase and implements Row Level Security (RLS) for data protection.

---

## 1. Tables

<db-plan-tables>
**[db-plan-tables.md](./db-plan-tables.md)**
</db-plan-tables>

## 2. Relationships

<db-plan-relationships>
**[db-plan-relationships.md](./db-plan-relationships.md)**
</db-plan-relationships>

## 3. Indexes

### Catalog Performance Indexes

```sql
-- Sets: Sort by release date (US-007)
create index idx_sets_release_date on sets (tcg_type_id, release_date desc nulls last);

-- Sets: Search by name
create index idx_sets_name on sets using gin (to_tsvector('english', name));

-- Cards: Composite index for set browsing and card number sorting (US-008)
create index idx_cards_set_number on cards (set_id, card_number);

-- Cards: Full-text search on card name (FR-002, US-009)
create index idx_cards_name_search on cards using gin (to_tsvector('english', name));

-- Cards: Filter by rarity (US-010)
create index idx_cards_rarity on cards (rarity_id) where rarity_id is not null;

-- Cards: Filter by card type
create index idx_cards_type on cards (card_type) where card_type is not null;

-- Cards: External ID lookups for import upserts
create index idx_cards_external_id on cards (tcg_type_id, external_id);
```

### Pricing Indexes

```sql
-- Card prices: Lookup by card
create index idx_card_prices_card on card_prices (card_id);

-- Card prices: Filter by fetched date for freshness
create index idx_card_prices_fetched on card_prices (fetched_at desc);
```

### Collection Indexes

```sql
-- Collection entries: User's collection queries (primary access pattern)
create index idx_collection_user on collection_entries (user_id);

-- Collection entries: User + card lookups (US-031 duplicate detection)
create index idx_collection_user_card on collection_entries (user_id, card_id);

-- User lists: User's lists
create index idx_user_lists_user on user_lists (user_id);

-- List entries: List contents
create index idx_list_entries_list on list_entries (list_id);

-- List entries: Find lists containing an entry
create index idx_list_entries_entry on list_entries (collection_entry_id);
```

### Cache Indexes

```sql
-- API cache: Expiration-based eviction
create index idx_api_cache_expires on api_cache (expires_at);
```

### Admin Indexes

```sql
-- Import jobs: Status filtering and date sorting (FR-008, US-025)
create index idx_import_jobs_status on import_jobs (status, created_at desc);
```

---

## 4. Views

### Collection Summary Views

#### `collection_set_summary`

Provides per-set collection statistics for a user's collection view.

```sql
create or replace view collection_set_summary as
select
  ce.user_id,
  s.id as set_id,
  s.name as set_name,
  s.total_cards as set_total_cards,
  count(distinct ce.card_id) as owned_unique_cards,
  sum(ce.quantity) as owned_total_cards,
  round(
    (count(distinct ce.card_id)::numeric / nullif(s.total_cards, 0)) * 100,
    1
  ) as completion_percentage
from collection_entries ce
join cards c on c.id = ce.card_id
join sets s on s.id = c.set_id
group by ce.user_id, s.id, s.name, s.total_cards;
```

#### `collection_value_view`

Provides total collection value calculation (US-016).

```sql
create or replace view collection_value_view as
select
  ce.user_id,
  count(*) as total_entries,
  sum(ce.quantity) as total_cards,
  sum(ce.quantity * coalesce(cp.price, 0)) as total_market_value,
  sum(ce.quantity * coalesce(ce.purchase_price, 0)) as total_purchase_cost,
  sum(ce.quantity * coalesce(cp.price, 0)) - sum(ce.quantity * coalesce(ce.purchase_price, 0)) as total_profit_loss
from collection_entries ce
left join lateral (
  select price
  from card_prices
  where card_id = ce.card_id
    and price_type = 'market'
  order by fetched_at desc
  limit 1
) cp on true
group by ce.user_id;
```

---

## 5. Row Level Security (RLS) Policies

### Enable RLS on User-Scoped Tables

```sql
-- Enable RLS
alter table user_profiles enable row level security;
alter table collection_entries enable row level security;
alter table user_lists enable row level security;
alter table list_entries enable row level security;
```

### User Profiles Policies

```sql
-- Select: Users can read their own profile
create policy "user_profiles_select_own"
  on user_profiles for select
  to authenticated
  using (id = auth.uid());

-- Insert: Users can create their own profile
create policy "user_profiles_insert_own"
  on user_profiles for insert
  to authenticated
  with check (id = auth.uid());

-- Update: Users can update their own profile
create policy "user_profiles_update_own"
  on user_profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Delete: Users can delete their own profile (soft-delete handled at app level)
create policy "user_profiles_delete_own"
  on user_profiles for delete
  to authenticated
  using (id = auth.uid());
```

### Collection Entries Policies

```sql
-- Select: Users can read their own collection entries
create policy "collection_entries_select_own"
  on collection_entries for select
  to authenticated
  using (user_id = auth.uid());

-- Insert: Users can add entries to their own collection
create policy "collection_entries_insert_own"
  on collection_entries for insert
  to authenticated
  with check (user_id = auth.uid());

-- Update: Users can update their own collection entries
create policy "collection_entries_update_own"
  on collection_entries for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Delete: Users can remove entries from their own collection
create policy "collection_entries_delete_own"
  on collection_entries for delete
  to authenticated
  using (user_id = auth.uid());
```

### User Lists Policies

```sql
-- Select: Users can read their own lists
create policy "user_lists_select_own"
  on user_lists for select
  to authenticated
  using (user_id = auth.uid());

-- Insert: Users can create lists (limit enforced at application level)
create policy "user_lists_insert_own"
  on user_lists for insert
  to authenticated
  with check (user_id = auth.uid());

-- Update: Users can update their own lists
create policy "user_lists_update_own"
  on user_lists for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Delete: Users can delete their own lists
create policy "user_lists_delete_own"
  on user_lists for delete
  to authenticated
  using (user_id = auth.uid());
```

### List Entries Policies

```sql
-- Select: Users can read list entries for their own lists
create policy "list_entries_select_own"
  on list_entries for select
  to authenticated
  using (
    exists (
      select 1 from user_lists ul
      where ul.id = list_entries.list_id
        and ul.user_id = auth.uid()
    )
  );

-- Insert: Users can add entries to their own lists
create policy "list_entries_insert_own"
  on list_entries for insert
  to authenticated
  with check (
    exists (
      select 1 from user_lists ul
      where ul.id = list_entries.list_id
        and ul.user_id = auth.uid()
    )
  );

-- Delete: Users can remove entries from their own lists
create policy "list_entries_delete_own"
  on list_entries for delete
  to authenticated
  using (
    exists (
      select 1 from user_lists ul
      where ul.id = list_entries.list_id
        and ul.user_id = auth.uid()
    )
  );
```

### Public Catalog Access

```sql
-- Cards, sets, rarities are publicly readable (no authentication required)
-- These tables do NOT have RLS enabled as they are public catalog data

-- Card prices are publicly readable
alter table card_prices enable row level security;

create policy "card_prices_select_public"
  on card_prices for select
  to anon, authenticated
  using (true);

-- Sets are publicly readable
alter table sets enable row level security;

create policy "sets_select_public"
  on sets for select
  to anon, authenticated
  using (true);

-- Cards are publicly readable
alter table cards enable row level security;

create policy "cards_select_public"
  on cards for select
  to anon, authenticated
  using (true);

-- Rarities are publicly readable
alter table rarities enable row level security;

create policy "rarities_select_public"
  on rarities for select
  to anon, authenticated
  using (true);

-- TCG types are publicly readable
alter table tcg_types enable row level security;

create policy "tcg_types_select_public"
  on tcg_types for select
  to anon, authenticated
  using (true);

-- Price sources are publicly readable
alter table price_sources enable row level security;

create policy "price_sources_select_public"
  on price_sources for select
  to anon, authenticated
  using (true);

-- Card conditions are publicly readable
alter table card_conditions enable row level security;

create policy "card_conditions_select_public"
  on card_conditions for select
  to anon, authenticated
  using (true);

-- Grading companies are publicly readable
alter table grading_companies enable row level security;

create policy "grading_companies_select_public"
  on grading_companies for select
  to anon, authenticated
  using (true);
```

### Admin-Only Policies

```sql
-- Import jobs: Only admins can read (FR-008, US-025)
alter table import_jobs enable row level security;

create policy "import_jobs_select_admin"
  on import_jobs for select
  to authenticated
  using (
    exists (
      select 1 from user_profiles up
      where up.id = auth.uid()
        and up.is_admin = true
    )
  );

-- Import jobs: Only admins can insert (manual trigger)
create policy "import_jobs_insert_admin"
  on import_jobs for insert
  to authenticated
  with check (
    exists (
      select 1 from user_profiles up
      where up.id = auth.uid()
        and up.is_admin = true
    )
  );
```

---

## 6. Database Functions

### User Profile Creation Trigger

Automatically create user profile when a new user signs up.

```sql
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
```

### Update Timestamp Trigger

Automatically update `updated_at` column on record changes.

```sql
create or replace function update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply to relevant tables
create trigger update_sets_updated_at
  before update on sets
  for each row execute procedure update_updated_at_column();

create trigger update_cards_updated_at
  before update on cards
  for each row execute procedure update_updated_at_column();

create trigger update_user_profiles_updated_at
  before update on user_profiles
  for each row execute procedure update_updated_at_column();

create trigger update_collection_entries_updated_at
  before update on collection_entries
  for each row execute procedure update_updated_at_column();

create trigger update_user_lists_updated_at
  before update on user_lists
  for each row execute procedure update_updated_at_column();
```

### User List Count Enforcement

Function to check list count limit (FR-004: max 10 lists).

```sql
create or replace function check_user_list_limit()
returns trigger
language plpgsql
as $$
declare
  list_count integer;
begin
  select count(*) into list_count
  from user_lists
  where user_id = new.user_id;

  if list_count >= 10 then
    raise exception 'Maximum number of lists (10) reached for this user';
  end if;

  return new;
end;
$$;

create trigger enforce_user_list_limit
  before insert on user_lists
  for each row execute procedure check_user_list_limit();
```

### API Cache Cleanup

Function to remove expired cache entries.

```sql
create or replace function cleanup_expired_api_cache()
returns integer
language plpgsql
as $$
declare
  deleted_count integer;
begin
  delete from api_cache where expires_at < now();
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;
```

---

## 7. Additional Notes

### Design Decisions

1. **UUID Primary Keys**: All main tables use UUIDs for primary keys to support distributed systems and avoid sequential ID exposure.

2. **TCG Type Column**: Added `tcg_type_id` to core tables (`sets`, `cards`, `rarities`) to support future multi-TCG expansion without schema changes.

3. **Soft Delete for Users**: `user_profiles.deleted_at` implements the 30-day grace period for account recovery (US-005, US-006).

4. **Lookup Tables**: Card conditions, grading companies, rarities, and price sources are normalized into lookup tables for data integrity and easy updates.

5. **Composite Unique Constraints**: `collection_entries` uses a composite unique constraint to allow multiple entries per user/card with different conditions/grades while preventing true duplicates.

6. **JSONB for Complex Data**: Card abilities, attacks, weaknesses, and resistances use JSONB to flexibly store complex nested data from the pokemontcg.io API.

7. **Cascading Deletes**: Foreign keys cascade on delete to `auth.users` to ensure orphaned data is removed when users are deleted.

8. **Materialized Views Consideration**: The views defined are regular views for simplicity. If performance issues arise with large collections, consider converting `collection_value_view` to a materialized view with periodic refresh.

### Performance Considerations

1. **Index Coverage**: Indexes are designed to cover the most common query patterns:
   - Set browsing (sorted by release date)
   - Card search (full-text on name)
   - Collection filtering (by user, card, list)

2. **Query Optimization**: Views pre-compute collection statistics to avoid complex aggregations in application code.

3. **Cache Strategy**: `api_cache` table supports the 24-hour TTL requirement with efficient expiration-based cleanup.

### Security Considerations

1. **RLS Enforcement**: Every user-scoped table has RLS enabled with policies checking `auth.uid()`.

2. **Admin Role**: Admin access is controlled via `user_profiles.is_admin` flag, checked in RLS policies for admin-only tables.

3. **Public Catalog**: Card catalog data is intentionally public (readable by anonymous users) as it's reference data, not user data.

4. **Cascading Security**: List entries inherit security through their relationship to user-owned lists.
