# TCGCollectr Database Schema

## 1. Tables and Columns

**[db-plan-tables.md](./db-plan-tables.md)**

## 2. Relationships

**[db-plan-relationships.md](./db-plan-relationships.md)**

## 3. Indexes

### Primary Indexes for Performance

```sql
-- Index on user_id for quick collection lookups
CREATE INDEX idx_user_cards_user_id ON user_cards(user_id);

-- Composite index for wishlisted cards filtering
CREATE INDEX idx_user_cards_user_wishlisted ON user_cards(user_id, wishlisted);

-- Index on card_id for card update queries
CREATE INDEX idx_user_cards_card_id ON user_cards(card_id);

-- Index on set_id for filtering cards by set
CREATE INDEX idx_cards_set_id ON cards(set_id);

-- GIN index for efficient array type filtering
CREATE INDEX idx_cards_types ON cards USING GIN(types);

-- Text search index for card name partial matching
CREATE INDEX idx_cards_name_search ON cards USING GIN(name gin_trgm_ops);

-- Index on created_at for analytics queries and cleanup
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);

-- Index for analytics event type filtering
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);

-- Index for finding user analytics
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
```

### Index Rationale

| Index                           | Query Pattern                    | Benefit                                        |
| ------------------------------- | -------------------------------- | ---------------------------------------------- |
| idx_user_cards_user_id          | Collection view, statistics      | Quick retrieval of all user's cards            |
| idx_user_cards_user_wishlisted  | Wishlist filter                  | Fast filtered wishlist queries                 |
| idx_user_cards_card_id          | Update/sync operations           | Efficient card lookup in collections           |
| idx_cards_set_id                | Filter by set                    | Fast set-based card browsing                   |
| idx_cards_types                 | Filter by type                   | Efficient Pokémon type filtering               |
| idx_cards_name_search           | Search by name                   | Fast partial name matching with trigrams       |
| idx_analytics_events_created_at | Retention cleanup, recent events | Quick deletion of old events, recent analytics |
| idx_analytics_events_type       | Analytics dashboards             | Fast filtering by event type                   |
| idx_analytics_events_user_id    | User activity tracking           | Quick retrieval of user-specific analytics     |

---

## 4. Row-Level Security (RLS) Policies

RLS is enabled on all tables to ensure user data isolation. All policies follow the principle of least privilege.

### profiles Table

```sql
-- Allow users to view their own profile
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Deletion handled via CASCADE from auth.users
```

**Rationale**: Users should only access their own profile data. Profile deletion is automatic when auth user is deleted.

### user_cards Table

```sql
-- Allow users to view their own collection
CREATE POLICY "user_cards_select_own"
  ON user_cards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to insert cards into their collection
CREATE POLICY "user_cards_insert_own"
  ON user_cards FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own collection entries
CREATE POLICY "user_cards_update_own"
  ON user_cards FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete from their own collection
CREATE POLICY "user_cards_delete_own"
  ON user_cards FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

**Rationale**: Complete isolation between users' collections. Each user can only manage their own collection data.

### cards Table

```sql
-- Allow authenticated users to view all cards
CREATE POLICY "cards_select_authenticated"
  ON cards FOR SELECT
  TO authenticated
  USING (true);

-- Allow unauthenticated users to view all cards (for public browsing)
CREATE POLICY "cards_select_anon"
  ON cards FOR SELECT
  TO anon
  USING (true);

-- Service role can manage card data (for API syncing)
-- (Service role automatically bypasses RLS)
```

**Rationale**: Card data is public and read-only for users. Only service role can update/insert cards when syncing from TCGDex API.

### sets Table

```sql
-- Allow all users to view all sets
CREATE POLICY "sets_select_public"
  ON sets FOR SELECT
  TO public
  USING (true);

-- Service role can manage set data (for API syncing)
-- (Service role automatically bypasses RLS)
```

**Rationale**: Set data is public and read-only for users. Only service role manages set data.

### analytics_events Table

```sql
-- Allow users to insert their own events
CREATE POLICY "analytics_events_insert_own"
  ON analytics_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Allow service role to query all events (for analytics dashboards)
-- (Service role automatically bypasses RLS)
```

**Rationale**: Users can only log their own events. Analytics dashboards accessed via service role queries.

---

## 5. Triggers and Functions

### Auto-update `updated_at` Timestamp

```sql
-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply to cards
CREATE TRIGGER update_cards_updated_at
  BEFORE UPDATE ON cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply to sets
CREATE TRIGGER update_sets_updated_at
  BEFORE UPDATE ON sets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply to user_cards
CREATE TRIGGER update_user_cards_updated_at
  BEFORE UPDATE ON user_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Auto-create Profile on User Registration

```sql
-- Function to create profile when user is registered
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, created_at, updated_at)
  VALUES (NEW.id, NOW(), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on auth.users insert
CREATE TRIGGER create_profile_on_auth_user_insert
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_user();
```

**Rationale**: Ensures every authenticated user automatically has a profile, preventing orphaned auth records.

### Update Profiles total_cards_count

```sql
-- Function to update total_cards_count in profiles
CREATE OR REPLACE FUNCTION update_user_total_cards_count()
RETURNS TRIGGER AS $$
DECLARE
  new_total INT;
BEGIN
  -- Calculate total cards for the user
  SELECT COALESCE(SUM(quantity), 0) INTO new_total
  FROM user_cards
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);

  -- Update profile with new total
  UPDATE profiles
  SET total_cards_count = new_total
  WHERE id = COALESCE(NEW.user_id, OLD.user_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger on user_cards insert
CREATE TRIGGER update_total_cards_on_insert
  AFTER INSERT ON user_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_user_total_cards_count();

-- Trigger on user_cards update
CREATE TRIGGER update_total_cards_on_update
  AFTER UPDATE ON user_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_user_total_cards_count();

-- Trigger on user_cards delete
CREATE TRIGGER update_total_cards_on_delete
  AFTER DELETE ON user_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_user_total_cards_count();
```

**Rationale**: Maintains accurate denormalized counter to efficiently check the 10,000 card limit without expensive `SUM()` queries.

### Prevent Exceeding Card Limit

```sql
-- Function to prevent adding cards beyond 10,000 limit
CREATE OR REPLACE FUNCTION check_card_limit()
RETURNS TRIGGER AS $$
DECLARE
  new_total INT;
BEGIN
  -- Calculate what the total would be after this operation
  SELECT COALESCE(SUM(quantity), 0) INTO new_total
  FROM user_cards
  WHERE user_id = NEW.user_id AND id != COALESCE(OLD.id, '00000000-0000-0000-0000-000000000000');

  new_total := new_total + NEW.quantity;

  -- Raise error if exceeds limit
  IF new_total > 10000 THEN
    RAISE EXCEPTION 'Card limit exceeded: user % has % cards (max 10000)',
      NEW.user_id, new_total;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on user_cards insert or update
CREATE TRIGGER enforce_card_limit
  BEFORE INSERT OR UPDATE ON user_cards
  FOR EACH ROW
  EXECUTE FUNCTION check_card_limit();
```

**Rationale**: Database-level enforcement of the 10,000 card limit prevents accidental violations.

---

## 6. Design Decisions and Rationale

### Card Caching Strategy

- **Decision**: Cache card metadata in `cards` table rather than fetching from TCGDex API on every request
- **Rationale**:
  - Enables offline support (FR-07) for viewing collections
  - Reduces API dependency on TCGDex
  - Improves performance for card display
  - Essential card data (name, image, rarity) cached; users still search against cache
  - `last_synced_at` timestamp tracks freshness; manual refresh in MVP, automated post-MVP

### Variant Handling

- **Decision**: Use single TEXT field with CHECK constraint for variant type
- **Rationale**:
  - Supports four variants: normal, reverse, holo, firstEdition
  - CHECK constraint maintains data integrity
  - Composite unique key `(user_id, card_id, variant)` prevents duplicates
  - Same card with different variants stored as separate `user_cards` entries
  - More flexible than ENUM type for future variant additions

### Quantity Constraints

- **Decision**: CHECK constraints: `quantity >= 1 AND quantity <= 1000`
- **Rationale**:
  - Prevents invalid states (0 or negative quantity)
  - Per-variant limit of 1000 copies (reasonable maximum for physical cards)
  - 10,000 card total limit enforced via trigger
  - Allows for realistic collecting scenarios

### Wishlist Implementation (MVP)

- **Decision**: Single `wishlisted BOOLEAN` column on `user_cards` for owned cards only
- **Rationale**:
  - MVP focuses on tracking owned cards with wishlist flag
  - Separate `wishlists` table for unowned wishlisted cards deferred to post-MVP
  - Simpler schema and queries
  - Users can wishlist cards they own via collection interface
  - Post-MVP can add comprehensive wishlist system

### Denormalized Counter

- **Decision**: `total_cards_count` column on `profiles` table
- **Rationale**:
  - Efficient limit checking without expensive `SUM(quantity)` aggregations
  - Maintained via triggers on `user_cards` table
  - Supports fast queries for approaching/exceeding limit warnings
  - Trade-off: minimal storage overhead (1 INT per user) vs. query performance

### Timestamp Tracking

- **Decision**: Include `created_at` and `updated_at` on all tables; `last_synced_at` on cache tables
- **Rationale**:
  - `created_at`/`updated_at` support audit trail and analytics
  - `last_synced_at` tracks when card/set data was last refreshed from API
  - Auto-updated via triggers (except `last_synced_at`, set by service role)
  - Supports analytics requirements and cache freshness tracking

### Cascade Behavior

- **Decision**: CASCADE on user-related tables, RESTRICT on master data
  - `profiles` → `auth.users`: CASCADE
  - `user_cards` → `profiles`: CASCADE
  - `user_cards` → `cards`: RESTRICT
  - `cards` → `sets`: RESTRICT
- **Rationale**:
  - Cascading user deletion removes all related data automatically
  - RESTRICT on master data (cards, sets) prevents accidental deletion if referenced
  - Maintains referential integrity while enabling safe user data cleanup

### RLS Policy Granularity

- **Decision**: Separate policies per operation (SELECT, INSERT, UPDATE, DELETE) and role
- **Rationale**:
  - Granular control following least privilege principle
  - Different rules per operation (e.g., INSERT requires auth.uid() match)
  - Public read access for cards/sets; authenticated-only for personal data
  - Easy to audit and maintain security boundaries

### Analytics Event Design

- **Decision**: Separate `analytics_events` table with JSONB event_data field
- **Rationale**:
  - Flexible schema for different event types without schema changes
  - Event-specific data stored as JSONB for future analysis
  - 90-day retention policy prevents unbounded growth
  - Supports success metrics tracking (card additions, searches, logins, etc.)
  - Null user_id allows anonymous event tracking

### No Partitioning for MVP

- **Decision**: Skip table partitioning despite potential growth
- **Rationale**:
  - 10,000 card limit per user creates predictable max data size
  - Partitioning adds operational complexity
  - Indexes sufficient for MVP performance targets
  - Reassess post-MVP if scaling beyond current limits

### Foreign Key Constraints

- **Decision**: Include all foreign keys with appropriate cascade behaviors
- **Rationale**:
  - Maintains referential integrity at database level
  - Prevents orphaned records
  - Supports cascading deletes for user cleanup
  - RESTRICT on master data prevents accidental deletion

---

## 7. Additional Notes

### TypeScript Type Generation

After migrations are applied, generate TypeScript definitions using:

```bash
supabase gen types typescript --local > src/db/database.types.ts
```

### Environment Variables Required

```
SUPABASE_URL=<your-supabase-project-url>
SUPABASE_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key-for-migrations>
```

### Database Limits and Quotas

- 10,000 cards per user (enforced by trigger)
- 1,000 copies per variant per user (CHECK constraint)
- 1,000 total unique cards × 4 variants = theoretical max 4,000 entries per user
- Actual max ~2,500 cards/user with realistic distribution

### Performance Targets

- Collection view load: < 3 seconds (1,000+ cards)
- Card search response: < 1 second (10,000+ cards)
- Add card to collection: < 500ms
- Update quantity: < 100ms
- All targets achievable with current indexing strategy

### Security Considerations

- Service role key used only for server-side operations (card sync, analytics)
- All user data access requires `auth.uid()` match
- Public cards/sets readable by all (supports unauthenticated browsing)
- Rate limiting handled at API/middleware layer, not database

### Future Extensibility

- `tcg_type` field supports multi-TCG expansion (Magic, Yu-Gi-Oh, etc.)
- JSONB `event_data` in analytics allows flexible event structures
- Wishlist separation to `wishlists` table planned for post-MVP
- Card sync automation via scheduled jobs planned for post-MVP

### Testing Recommendations

- Unit test each trigger function with edge cases
- Integration test full collection flow (add, update, remove, export)
- Load test with 1,000-10,000 cards per user
- Test RLS policies with different authentication states
- Verify cascade deletes work correctly with related data
