# TCGCollectr MVP - Product Requirements Document

> **Document Version:** 1.0
> **Last Updated:** 2026-01-10
> **Status:** Ready for Development

---

## Product Overview

**Product Name:** TCGCollectr
**Product Type:** Trading Card Game Collection Management Application
**MVP Focus:** Pokémon TCG (architecture supports future TCG expansion)

**Problem Statement:** Storing and checking TCG cards for personal use is cumbersome – collectors need sufficiently comprehensive but not overwhelming information about their cards.

**Target Users:** Pokémon TCG collectors who need a simple, comprehensive way to track their card collections, view market prices, and organize their cards.

**Core Value Proposition:** A free, easy-to-use platform that provides up-to-date card information and pricing while allowing personal collection management with condition tracking and custom organization.

---

## MVP Scope Boundaries

### In Scope
- `[FEAT-001]` through `[FEAT-008]` - Core Features
- `[US-001]` through `[US-017]` - User Stories
- `[DB-001]` through `[DB-008]` - Database Tables
- `[API-001]` through `[API-014]` - API Endpoints
- `[UI-001]` through `[UI-008]` - UI Screens

### Out of Scope (Post-MVP)
- `[POST-001]` Collection export (CSV/JSON)
- `[POST-002]` "New Cards" section
- `[POST-003]` PWA offline support
- `[POST-004]` Public profiles
- `[POST-005]` Social authentication
- `[POST-006]` Currency selector
- `[POST-007]` Multi-language support
- `[POST-008]` Email digest for new sets

### Explicitly Excluded
- OCR card scanning
- Paid APIs integration
- Non-Pokémon TCGs
- Advanced price trend analysis
- Marketplace/selling features

---

## Tech Stack

```json
{
  "frontend": {
    "framework": "Astro 5",
    "ui_library": "React 19",
    "language": "TypeScript 5",
    "styling": "Tailwind 4",
    "components": "Shadcn/ui"
  },
  "backend": {
    "platform": "Supabase",
    "auth": "Supabase Auth",
    "database": "PostgreSQL (via Supabase)",
    "functions": "Supabase Edge Functions",
    "scheduling": "pg_cron"
  },
  "data_sources": {
    "primary": "tcgcsv.com (CSV)",
    "supplementary": "pokemontcg.io (API)"
  }
}
```

---

## Features & Requirements

### [FEAT-001] Card Catalog
**Priority:** P0
**Description:** Browsable catalog of ~15,000+ Pokémon cards organized by sets

**Acceptance Criteria:**
- [ ] Display all Pokémon card sets from CSV data
- [ ] Cards organized within sets with card count displayed
- [ ] Set list loads in <1 second
- [ ] Supports filtering by rarity, type, price range

**Dependencies:** `[DB-002]`, `[DB-003]`
**Blocks:** `[FEAT-002]`, `[FEAT-005]`

**Files to Create/Modify:**
- `src/pages/index.astro` - Home page with set list
- `src/pages/sets/[id].astro` - Set detail page
- `src/components/SetCard.tsx` - Set display component
- `src/components/CardGrid.tsx` - Card grid component
- `src/lib/services/setService.ts` - Set data service

---

### [FEAT-002] Search System
**Priority:** P0
**Description:** Multi-faceted search by card name, set name, card number, Pokémon name

**Acceptance Criteria:**
- [ ] Search returns results in <200ms (first 20 cards)
- [ ] Supports card name, set name, card number, Pokémon name
- [ ] Returns paginated results (20-50 per page)
- [ ] Displays "No results found" for empty searches
- [ ] Search input has debounce (300ms)

**Dependencies:** `[DB-003]`, `[DB-004]`
**Blocks:** None

**Files to Create/Modify:**
- `src/pages/api/cards/search.ts` - Search API endpoint
- `src/components/SearchBar.tsx` - Search input component
- `src/pages/search.astro` - Search results page
- `src/lib/services/cardService.ts` - Card search service

---

### [FEAT-003] User Collections
**Priority:** P0
**Description:** Add/remove cards with quantity tracking and condition assessment

**Acceptance Criteria:**
- [ ] Authenticated users can add cards to collection
- [ ] Quantity tracking with increment/decrement (min: 1)
- [ ] Condition selection from predefined scale
- [ ] Optional professional grade entry (PSA/BGS/CGC 1-10)
- [ ] Purchase price field (USD, optional)
- [ ] Notes field (max 500 characters)
- [ ] Remove card from collection with confirmation

**Dependencies:** `[FEAT-001]`, `[AUTH-001]`, `[DB-005]`
**Blocks:** `[FEAT-004]`

**Files to Create/Modify:**
- `src/pages/api/collection/cards.ts` - Collection CRUD endpoints
- `src/pages/collection.astro` - Collection page
- `src/components/AddToCollectionModal.tsx` - Add card modal
- `src/components/CollectionCard.tsx` - Collection item display
- `src/lib/services/collectionService.ts` - Collection service

---

### [FEAT-004] Custom Lists
**Priority:** P1
**Description:** Up to 10 named collections per user (e.g., "Trade Binder", "For Sale")

**Acceptance Criteria:**
- [ ] Create named list (max 50 characters)
- [ ] Limit of 10 lists per user (MVP)
- [ ] Assign/unassign cards to lists
- [ ] View cards filtered by list
- [ ] Delete list (cards remain in collection)
- [ ] Display list card count

**Dependencies:** `[FEAT-003]`, `[DB-006]`, `[DB-007]`
**Blocks:** None

**Files to Create/Modify:**
- `src/pages/api/lists.ts` - Lists CRUD endpoints
- `src/components/ListManager.tsx` - List management UI
- `src/components/ListSelector.tsx` - List assignment component
- `src/lib/services/listService.ts` - List service

---

### [FEAT-005] Card Details
**Priority:** P0
**Description:** Display metadata, artwork, market price with timestamp

**Acceptance Criteria:**
- [ ] Display card metadata (name, set, number, rarity, type)
- [ ] Show card artwork from pokemontcg.io (lazy loaded)
- [ ] Display placeholder for missing artwork
- [ ] Show market price in USD with "Last updated" timestamp
- [ ] Show "Limited information available" when API data missing
- [ ] Contextual action: "Add to Collection" (guest/non-owner) or "Your Collection" panel (owner)

**Dependencies:** `[DB-003]`, `[DB-004]`
**Blocks:** None

**Files to Create/Modify:**
- `src/pages/cards/[id].astro` - Card detail page
- `src/components/CardDetail.tsx` - Card detail component
- `src/components/PriceDisplay.tsx` - Price with timestamp
- `src/components/CollectionPanel.tsx` - Owner's collection info

---

### [FEAT-006] User Accounts
**Priority:** P0
**Description:** Email/password authentication with email verification

**Acceptance Criteria:**
- [ ] Register with email/password
- [ ] Email verification required before full access
- [ ] Login with email/password
- [ ] Password reset via email
- [ ] Logout functionality
- [ ] Profile page with account settings
- [ ] Account deletion with 30-day soft-delete
- [ ] Clear warning before deletion

**Dependencies:** `[DB-001]`
**Blocks:** `[FEAT-003]`, `[FEAT-004]`

**Files to Create/Modify:**
- `src/pages/login.astro` - Login page
- `src/pages/register.astro` - Registration page
- `src/pages/profile.astro` - Profile/settings page
- `src/components/AuthForm.tsx` - Auth form component
- `src/lib/services/authService.ts` - Auth service wrapper

---

### [FEAT-007] Data Import
**Priority:** P0
**Description:** Automated daily CSV import from tcgcsv.com

**Acceptance Criteria:**
- [ ] Automated daily import at 4:00 AM UTC
- [ ] Incremental updates (upsert, not full replace)
- [ ] Import job logging with success/failure counts
- [ ] Error details captured for failed records
- [ ] New sets/cards automatically available
- [ ] Manual import trigger for admins

**Dependencies:** `[DB-003]`, `[DB-004]`, `[DB-008]`
**Blocks:** `[FEAT-001]`

**Files to Create/Modify:**
- `supabase/functions/import-csv/index.ts` - Edge Function
- `src/lib/services/importService.ts` - Import logic
- `supabase/migrations/XXX_create_import_jobs.sql` - Import tracking

---

### [FEAT-008] Admin Panel
**Priority:** P1
**Description:** View import logs, trigger imports, view statistics

**Acceptance Criteria:**
- [ ] View import job history (last 30 days)
- [ ] Display success/failure counts per job
- [ ] Manual CSV import trigger button
- [ ] Aggregate statistics: total users, total cards in collections
- [ ] Admin-only access via role check
- [ ] Supabase dashboard as fallback for direct DB access

**Dependencies:** `[AUTH-001]`, `[DB-008]`
**Blocks:** None

**Files to Create/Modify:**
- `src/pages/admin/index.astro` - Admin dashboard
- `src/pages/api/admin/import.ts` - Manual import trigger
- `src/pages/api/admin/stats.ts` - Statistics endpoint
- `src/pages/api/admin/import-logs.ts` - Import logs endpoint

---

## User Stories

### Collection Management

#### [US-001] Search Cards
**As a** collector
**I want to** search for cards by name or set
**So that** I can quickly find specific cards

**Acceptance Criteria:**
- [ ] Search input visible on all pages
- [ ] Results appear within 200ms
- [ ] Can search by card name, set name, card number, Pokémon name

**Linked Features:** `[FEAT-002]`

---

#### [US-002] Browse Sets
**As a** collector
**I want to** browse cards by set
**So that** I can explore what's available

**Acceptance Criteria:**
- [ ] Sets displayed on home page
- [ ] Click set to view all cards within
- [ ] Card count shown per set

**Linked Features:** `[FEAT-001]`

---

#### [US-003] Add Card to Collection
**As a** collector
**I want to** add cards to my collection with quantity and condition
**So that** I can track what I own

**Acceptance Criteria:**
- [ ] "Add to Collection" button on card detail
- [ ] Modal for quantity, condition, notes
- [ ] Confirmation message on success

**Linked Features:** `[FEAT-003]`

---

#### [US-004] View Collection Value
**As a** collector
**I want to** see the current market price of my cards
**So that** I can understand my collection's value

**Acceptance Criteria:**
- [ ] Price displayed per card
- [ ] Total collection value on collection page
- [ ] Price update timestamp visible

**Linked Features:** `[FEAT-003]`, `[FEAT-005]`

---

#### [US-005] Organize with Lists
**As a** collector
**I want to** organize cards into custom lists
**So that** I can separate my trade binder from my main collection

**Acceptance Criteria:**
- [ ] Create/delete custom lists
- [ ] Assign cards to lists
- [ ] Filter collection by list

**Linked Features:** `[FEAT-004]`

---

#### [US-006] Track Purchase Price
**As a** collector
**I want to** record my purchase price
**So that** I can track my investment vs. current value

**Acceptance Criteria:**
- [ ] Purchase price field when adding card
- [ ] Display purchase price in collection view
- [ ] Compare to current market price

**Linked Features:** `[FEAT-003]`

---

#### [US-007] Add Notes
**As a** collector
**I want to** add notes to my cards
**So that** I can remember where I got them or their trade status

**Acceptance Criteria:**
- [ ] Notes field (500 char max)
- [ ] Notes visible in collection detail
- [ ] Edit notes after adding

**Linked Features:** `[FEAT-003]`

---

#### [US-008] Record Professional Grades
**As a** collector
**I want to** record professional grades for my graded cards
**So that** I can track their certified condition

**Acceptance Criteria:**
- [ ] Optional grade company selection (PSA/BGS/CGC)
- [ ] Grade value input (1-10)
- [ ] Validation for valid grade ranges

**Linked Features:** `[FEAT-003]`

---

### Browsing & Discovery

#### [US-009] View Card Details
**As a** user
**I want to** view any card's details without adding it to my collection
**So that** I can research before buying

**Acceptance Criteria:**
- [ ] Card detail page accessible without login
- [ ] Full card information displayed
- [ ] No collection actions for guests

**Linked Features:** `[FEAT-005]`

---

#### [US-010] Filter Cards
**As a** user
**I want to** filter cards by rarity, type, and price range
**So that** I can find cards matching my criteria

**Acceptance Criteria:**
- [ ] Filter controls on set view
- [ ] Multiple filters combinable
- [ ] Clear filters option

**Linked Features:** `[FEAT-001]`

---

#### [US-011] Check Price Freshness
**As a** user
**I want to** see when price data was last updated
**So that** I know if the information is current

**Acceptance Criteria:**
- [ ] "Last updated" timestamp on prices
- [ ] "Data may be outdated" indicator for stale cache

**Linked Features:** `[FEAT-005]`

---

### Account Management

#### [US-012] Quick Onboarding
**As a** new user
**I want to** quickly understand how to use the app
**So that** I can start adding cards immediately

**Acceptance Criteria:**
- [ ] Welcome modal after first login
- [ ] Highlights: Browse, Search, Add to Collection
- [ ] Skippable modal

**Linked Features:** `[FEAT-006]`

---

#### [US-013] Delete Account
**As a** user
**I want to** delete my account and data
**So that** I can exercise my privacy rights

**Acceptance Criteria:**
- [ ] Delete account option in profile
- [ ] Clear warning about data loss
- [ ] 30-day soft-delete period

**Linked Features:** `[FEAT-006]`

---

#### [US-014] Recover Account
**As a** user
**I want to** have a 30-day recovery period after deletion
**So that** I can change my mind

**Acceptance Criteria:**
- [ ] Soft-delete for 30 days
- [ ] Login during period restores account
- [ ] Permanent deletion after 30 days

**Linked Features:** `[FEAT-006]`

---

### Administration

#### [US-015] Monitor Imports
**As an** admin
**I want to** view import job logs
**So that** I can monitor data synchronization health

**Acceptance Criteria:**
- [ ] Import history visible
- [ ] Success/failure counts
- [ ] Error details accessible

**Linked Features:** `[FEAT-008]`

---

#### [US-016] Trigger Import
**As an** admin
**I want to** manually trigger CSV imports
**So that** I can refresh data on demand

**Acceptance Criteria:**
- [ ] Manual import button
- [ ] Confirmation before trigger
- [ ] Progress/status feedback

**Linked Features:** `[FEAT-008]`

---

#### [US-017] View Statistics
**As an** admin
**I want to** see aggregate user statistics
**So that** I can track platform growth

**Acceptance Criteria:**
- [ ] Total registered users (excluding soft-deleted)
- [ ] Total cards in all collections
- [ ] Stats refresh on page load

**Linked Features:** `[FEAT-008]`

---

## Database Schema

### [DB-001] profiles
**Description:** User profile data extending Supabase Auth

```json
{
  "table": "profiles",
  "columns": {
    "id": { "type": "uuid", "primary": true, "references": "auth.users.id" },
    "role": { "type": "text", "default": "user", "enum": ["user", "admin"] },
    "subscription_tier": { "type": "text", "default": "free" },
    "feature_flags": { "type": "jsonb", "default": "{}" },
    "created_at": { "type": "timestamptz", "default": "now()" },
    "updated_at": { "type": "timestamptz", "default": "now()" },
    "deleted_at": { "type": "timestamptz", "nullable": true }
  },
  "indexes": ["role", "deleted_at"],
  "rls": {
    "select": "auth.uid() = id OR role = 'admin'",
    "update": "auth.uid() = id",
    "delete": "auth.uid() = id"
  }
}
```

**Migration File:** `supabase/migrations/001_create_profiles.sql`

---

### [DB-002] tcg_games
**Description:** TCG game types for future expansion

```json
{
  "table": "tcg_games",
  "columns": {
    "id": { "type": "uuid", "primary": true, "default": "gen_random_uuid()" },
    "name": { "type": "text", "not_null": true },
    "code": { "type": "text", "unique": true, "not_null": true }
  },
  "seed_data": [
    { "name": "Pokémon TCG", "code": "pokemon" }
  ]
}
```

**Migration File:** `supabase/migrations/002_create_tcg_games.sql`

---

### [DB-003] sets
**Description:** Card sets/expansions

```json
{
  "table": "sets",
  "columns": {
    "id": { "type": "uuid", "primary": true, "default": "gen_random_uuid()" },
    "tcg_id": { "type": "uuid", "references": "tcg_games.id", "not_null": true },
    "code": { "type": "text", "not_null": true },
    "name": { "type": "text", "not_null": true },
    "release_date": { "type": "date", "nullable": true },
    "card_count": { "type": "integer", "default": 0 },
    "created_at": { "type": "timestamptz", "default": "now()" }
  },
  "indexes": ["tcg_id", "code", "name"],
  "unique_constraints": ["tcg_id", "code"]
}
```

**Migration File:** `supabase/migrations/003_create_sets.sql`

---

### [DB-004] cards
**Description:** Individual card data

```json
{
  "table": "cards",
  "columns": {
    "id": { "type": "uuid", "primary": true, "default": "gen_random_uuid()" },
    "set_id": { "type": "uuid", "references": "sets.id", "not_null": true },
    "card_number": { "type": "text", "not_null": true },
    "name": { "type": "text", "not_null": true },
    "rarity": { "type": "text", "nullable": true },
    "card_type": { "type": "text", "nullable": true },
    "image_url": { "type": "text", "nullable": true },
    "pokemon_name": { "type": "text", "nullable": true },
    "market_price_usd": { "type": "decimal(10,2)", "nullable": true },
    "price_updated_at": { "type": "timestamptz", "nullable": true },
    "api_data": { "type": "jsonb", "nullable": true },
    "created_at": { "type": "timestamptz", "default": "now()" },
    "updated_at": { "type": "timestamptz", "default": "now()" }
  },
  "indexes": ["set_id", "name", "card_number", "pokemon_name", "rarity", "card_type"],
  "unique_constraints": ["set_id", "card_number"],
  "full_text_search": ["name", "pokemon_name"]
}
```

**Migration File:** `supabase/migrations/004_create_cards.sql`

---

### [DB-005] user_cards
**Description:** User's collection entries

```json
{
  "table": "user_cards",
  "columns": {
    "id": { "type": "uuid", "primary": true, "default": "gen_random_uuid()" },
    "user_id": { "type": "uuid", "references": "profiles.id", "not_null": true },
    "card_id": { "type": "uuid", "references": "cards.id", "not_null": true },
    "quantity": { "type": "integer", "default": 1, "check": "quantity >= 1" },
    "condition": { "type": "text", "enum": ["mint", "near_mint", "excellent", "good", "played", "poor"] },
    "grade_company": { "type": "text", "nullable": true, "enum": ["PSA", "BGS", "CGC"] },
    "grade_value": { "type": "decimal(3,1)", "nullable": true, "check": "grade_value >= 1 AND grade_value <= 10" },
    "purchase_price_usd": { "type": "decimal(10,2)", "nullable": true },
    "notes": { "type": "text", "nullable": true, "max_length": 500 },
    "created_at": { "type": "timestamptz", "default": "now()" },
    "updated_at": { "type": "timestamptz", "default": "now()" }
  },
  "indexes": ["user_id", "card_id"],
  "unique_constraints": ["user_id", "card_id"],
  "rls": {
    "select": "auth.uid() = user_id",
    "insert": "auth.uid() = user_id",
    "update": "auth.uid() = user_id",
    "delete": "auth.uid() = user_id"
  }
}
```

**Migration File:** `supabase/migrations/005_create_user_cards.sql`

---

### [DB-006] user_lists
**Description:** User's custom lists

```json
{
  "table": "user_lists",
  "columns": {
    "id": { "type": "uuid", "primary": true, "default": "gen_random_uuid()" },
    "user_id": { "type": "uuid", "references": "profiles.id", "not_null": true },
    "name": { "type": "text", "not_null": true, "max_length": 50 },
    "created_at": { "type": "timestamptz", "default": "now()" }
  },
  "indexes": ["user_id"],
  "constraints": {
    "max_lists_per_user": "COUNT(*) <= 10 per user_id"
  },
  "rls": {
    "select": "auth.uid() = user_id",
    "insert": "auth.uid() = user_id",
    "update": "auth.uid() = user_id",
    "delete": "auth.uid() = user_id"
  }
}
```

**Migration File:** `supabase/migrations/006_create_user_lists.sql`

---

### [DB-007] user_card_lists
**Description:** Junction table for cards in lists

```json
{
  "table": "user_card_lists",
  "columns": {
    "user_card_id": { "type": "uuid", "references": "user_cards.id", "not_null": true },
    "list_id": { "type": "uuid", "references": "user_lists.id", "not_null": true }
  },
  "primary_key": ["user_card_id", "list_id"],
  "rls": {
    "all": "EXISTS (SELECT 1 FROM user_cards WHERE id = user_card_id AND user_id = auth.uid())"
  }
}
```

**Migration File:** `supabase/migrations/007_create_user_card_lists.sql`

---

### [DB-008] import_jobs
**Description:** CSV import job tracking

```json
{
  "table": "import_jobs",
  "columns": {
    "id": { "type": "uuid", "primary": true, "default": "gen_random_uuid()" },
    "started_at": { "type": "timestamptz", "default": "now()" },
    "completed_at": { "type": "timestamptz", "nullable": true },
    "status": { "type": "text", "enum": ["running", "completed", "failed"] },
    "records_processed": { "type": "integer", "default": 0 },
    "records_created": { "type": "integer", "default": 0 },
    "records_updated": { "type": "integer", "default": 0 },
    "errors_count": { "type": "integer", "default": 0 },
    "error_details": { "type": "jsonb", "nullable": true }
  },
  "indexes": ["started_at", "status"],
  "rls": {
    "select": "EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')"
  }
}
```

**Migration File:** `supabase/migrations/008_create_import_jobs.sql`

---

## API Endpoints

### Public Endpoints (No Auth)

#### [API-001] GET /api/sets
**Description:** List all card sets
**Response:** `{ sets: Set[], total: number }`

#### [API-002] GET /api/sets/:id/cards
**Description:** Get cards in a set with pagination
**Query Params:** `page`, `limit`, `rarity`, `type`, `priceMin`, `priceMax`
**Response:** `{ cards: Card[], total: number, page: number }`

#### [API-003] GET /api/cards/:id
**Description:** Get card details
**Response:** `{ card: CardDetail }`

#### [API-004] GET /api/cards/search
**Description:** Search cards
**Query Params:** `q`, `page`, `limit`
**Response:** `{ cards: Card[], total: number, page: number }`

### Authenticated Endpoints

#### [API-005] GET /api/collection
**Description:** Get user's collection
**Auth:** Required
**Query Params:** `listId`, `page`, `limit`
**Response:** `{ cards: UserCard[], total: number, totalValue: number }`

#### [API-006] POST /api/collection/cards
**Description:** Add card to collection
**Auth:** Required
**Body:** `{ cardId, quantity, condition, gradeCompany?, gradeValue?, purchasePrice?, notes? }`
**Response:** `{ userCard: UserCard }`

#### [API-007] PATCH /api/collection/cards/:id
**Description:** Update collection entry
**Auth:** Required
**Body:** `{ quantity?, condition?, gradeCompany?, gradeValue?, purchasePrice?, notes? }`
**Response:** `{ userCard: UserCard }`

#### [API-008] DELETE /api/collection/cards/:id
**Description:** Remove card from collection
**Auth:** Required
**Response:** `{ success: true }`

#### [API-009] GET /api/lists
**Description:** Get user's lists
**Auth:** Required
**Response:** `{ lists: List[] }`

#### [API-010] POST /api/lists
**Description:** Create a list
**Auth:** Required
**Body:** `{ name }`
**Response:** `{ list: List }`

#### [API-011] DELETE /api/lists/:id
**Description:** Delete a list
**Auth:** Required
**Response:** `{ success: true }`

### Admin Endpoints

#### [API-012] POST /api/admin/import
**Description:** Trigger CSV import
**Auth:** Admin only
**Response:** `{ jobId: string, status: "started" }`

#### [API-013] GET /api/admin/import-logs
**Description:** Get import history
**Auth:** Admin only
**Query Params:** `limit` (default: 30)
**Response:** `{ jobs: ImportJob[] }`

#### [API-014] GET /api/admin/stats
**Description:** Get aggregate statistics
**Auth:** Admin only
**Response:** `{ totalUsers: number, totalCardsInCollections: number, totalUniqueCards: number }`

---

## UI Screens

### [UI-001] Home / Browse Sets
**Route:** `/`
**Components:** `SetGrid`, `SearchBar`, `FilterControls`
**Responsive:** 1-4 column grid based on viewport

### [UI-002] Set View
**Route:** `/sets/[id]`
**Components:** `CardGrid`, `FilterControls`, `Pagination`

### [UI-003] Card Detail
**Route:** `/cards/[id]`
**Components:** `CardDetail`, `PriceDisplay`, `AddToCollectionModal`, `CollectionPanel`

### [UI-004] My Collection
**Route:** `/collection`
**Auth:** Required
**Components:** `CollectionGrid`, `ListFilter`, `CollectionStats`

### [UI-005] Search Results
**Route:** `/search?q=`
**Components:** `CardGrid`, `SearchBar`, `Pagination`

### [UI-006] Profile
**Route:** `/profile`
**Auth:** Required
**Components:** `ProfileForm`, `DeleteAccountSection`

### [UI-007] Login / Register
**Routes:** `/login`, `/register`
**Components:** `AuthForm`

### [UI-008] Admin Dashboard
**Route:** `/admin`
**Auth:** Admin only
**Components:** `ImportLogs`, `StatsCards`, `ImportTrigger`

---

## Implementation Phases

### Phase 1: Foundation
**Duration:** Week 1-2
**Dependencies:** None

| ID | Task | Files |
|----|------|-------|
| `[DB-001]` | Create profiles table | `supabase/migrations/001_*.sql` |
| `[DB-002]` | Create tcg_games table | `supabase/migrations/002_*.sql` |
| `[DB-003]` | Create sets table | `supabase/migrations/003_*.sql` |
| `[DB-004]` | Create cards table | `supabase/migrations/004_*.sql` |
| `[AUTH-001]` | Configure Supabase Auth | `src/middleware/index.ts` |
| `[SEED-001]` | Create seed script | `scripts/seed-database.ts` |

### Phase 2: Core Features
**Duration:** Week 3-4
**Dependencies:** Phase 1

| ID | Task | Files |
|----|------|-------|
| `[FEAT-001]` | Card Catalog | `src/pages/index.astro`, `src/pages/sets/[id].astro` |
| `[FEAT-002]` | Search System | `src/pages/api/cards/search.ts`, `src/components/SearchBar.tsx` |
| `[FEAT-005]` | Card Details | `src/pages/cards/[id].astro`, `src/components/CardDetail.tsx` |
| `[API-001-004]` | Public API endpoints | `src/pages/api/*.ts` |

### Phase 3: User Features
**Duration:** Week 5-6
**Dependencies:** Phase 2

| ID | Task | Files |
|----|------|-------|
| `[DB-005]` | Create user_cards table | `supabase/migrations/005_*.sql` |
| `[DB-006]` | Create user_lists table | `supabase/migrations/006_*.sql` |
| `[DB-007]` | Create user_card_lists table | `supabase/migrations/007_*.sql` |
| `[FEAT-003]` | User Collections | `src/pages/collection.astro`, `src/pages/api/collection/*.ts` |
| `[FEAT-004]` | Custom Lists | `src/components/ListManager.tsx`, `src/pages/api/lists.ts` |
| `[FEAT-006]` | User Accounts | `src/pages/login.astro`, `src/pages/profile.astro` |

### Phase 4: Admin & Polish
**Duration:** Week 7-8
**Dependencies:** Phase 3

| ID | Task | Files |
|----|------|-------|
| `[DB-008]` | Create import_jobs table | `supabase/migrations/008_*.sql` |
| `[FEAT-007]` | Data Import | `supabase/functions/import-csv/index.ts` |
| `[FEAT-008]` | Admin Panel | `src/pages/admin/index.astro` |
| `[UI-007]` | Welcome Modal | `src/components/WelcomeModal.tsx` |
| `[ASSET-001]` | Placeholder Image | `public/images/card-placeholder.png` |

---

## Success Metrics

| Metric ID | Metric | Target | Query/Method |
|-----------|--------|--------|--------------|
| `[METRIC-001]` | User adoption | 90% users have ≥1 card | `SELECT COUNT(*) FROM profiles WHERE id IN (SELECT DISTINCT user_id FROM user_cards) AND deleted_at IS NULL` |
| `[METRIC-002]` | User retention | 75% login weekly | Weekly cohort on `auth.users.last_sign_in_at` |
| `[METRIC-003]` | Search performance | <200ms P95 | Server-side APM |
| `[METRIC-004]` | Page load time | <1s P95 | Client-side metrics |
| `[METRIC-005]` | Import success | >95% | `SELECT success_rate FROM import_jobs` |
| `[METRIC-006]` | API cache hit | >80% | Cache logging |

---

## Security Requirements

| ID | Requirement | Implementation |
|----|-------------|----------------|
| `[SEC-001]` | Authentication | Supabase Auth (email/password + verification) |
| `[SEC-002]` | Authorization | Row Level Security (RLS) on all tables |
| `[SEC-003]` | Role Management | `role` field in profiles |
| `[SEC-004]` | Rate Limiting | 100 requests/minute per user |
| `[SEC-005]` | Input Validation | Zod schemas on all endpoints |
| `[SEC-006]` | CSRF Protection | Supabase built-in |
| `[SEC-007]` | Soft Delete | 30-day retention via `deleted_at` |

---

## Configuration & Environment

### Environment Variables

```env
# Supabase
SUPABASE_URL=
SUPABASE_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# pokemontcg.io
POKEMON_TCG_API_KEY=

# App
PUBLIC_APP_URL=
```

### Feature Flags Schema

```json
{
  "export_csv": false,
  "export_json": false,
  "unlimited_lists": false,
  "advanced_filters": false,
  "ocr_scanning": false,
  "multi_source_pricing": false
}
```

---

## Enums & Constants

### Card Condition

```typescript
enum CardCondition {
  MINT = "mint",
  NEAR_MINT = "near_mint",
  EXCELLENT = "excellent",
  GOOD = "good",
  PLAYED = "played",
  POOR = "poor"
}
```

### Grade Company

```typescript
enum GradeCompany {
  PSA = "PSA",
  BGS = "BGS",
  CGC = "CGC"
}
```

### User Role

```typescript
enum UserRole {
  USER = "user",
  ADMIN = "admin"
}
```

### Import Status

```typescript
enum ImportStatus {
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed"
}
```

---

## Post-MVP Roadmap

| ID | Phase | Feature | Type | Priority |
|----|-------|---------|------|----------|
| `[POST-001]` | 1 | Collection export (CSV/JSON) | Premium | High |
| `[POST-002]` | 1 | "New Cards" section | Free | Medium |
| `[POST-003]` | 1 | Admin dashboard UI | Internal | Medium |
| `[POST-004]` | 2 | PWA offline support | Free | Medium |
| `[POST-005]` | 2 | Public profiles | Free | Low |
| `[POST-006]` | 2 | Social authentication | Free | Low |
| `[POST-007]` | 2 | Currency selector | Free | Low |
| `[POST-008]` | 3 | Multi-language support | Free | Low |
| `[POST-009]` | 3 | Email digest for new sets | Free | Low |
| `[POST-010]` | 3 | Missing card feedback form | Free | Low |
| `[POST-011]` | Premium | OCR card scanning | Paid | Future |
| `[POST-012]` | Premium | Multi-source pricing | Paid | Future |
| `[POST-013]` | Premium | Advanced filters | Paid | Future |
| `[POST-014]` | Premium | Unlimited custom lists | Paid | Future |

---

## Resolved Issues

All technical decisions have been finalized:

- ✅ `[RESOLVED-001]` CSV Schema - Document from tcgcsv.com before DB design
- ✅ `[RESOLVED-002]` pokemontcg.io API - 20,000 req/day, set-based batching
- ✅ `[RESOLVED-003]` Admin Identification - `role` field with RLS policies
- ✅ `[RESOLVED-004]` Import Scheduling - pg_cron at 4:00 AM UTC
- ✅ `[RESOLVED-005]` Error Notifications - DB logging (MVP), Resend (post-MVP)
- ✅ `[RESOLVED-006]` Placeholder Image - `/public/images/card-placeholder.png`
- ✅ `[RESOLVED-007]` Grade Validation - Enum + decimal (1.0-10.0)
- ✅ `[RESOLVED-008]` Soft-Delete Stats - `WHERE deleted_at IS NULL`
- ✅ `[RESOLVED-009]` Feature Flags - JSON column in profiles
- ✅ `[RESOLVED-010]` Initial Seeding - One-time documented script

---

**Document Status:** Complete and ready for development
