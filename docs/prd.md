# Product Requirements Document (PRD) - TCGCollectr

## 1. Product Overview

TCGCollectr is a Trading Card Game collection management application designed for Pokémon TCG collectors who need a simple, comprehensive way to track their card collections, view market prices, and organize their cards.

The application provides:

- A browsable catalog of 15,000+ Pokémon cards organized by sets
- Personal collection management with quantity and condition tracking
- Up-to-date market pricing from tcgcsv.com with supplementary data from pokemontcg.io
- Custom list organization for different purposes (e.g., trade binder, for sale)
- User accounts with email/password authentication

The MVP focuses exclusively on Pokémon TCG with an architecture that supports future expansion to other trading card games.

### Tech Stack

| Layer                | Technology                |
| -------------------- | ------------------------- |
| Frontend Framework   | Astro 5                   |
| UI Library           | React 19                  |
| Language             | TypeScript 5              |
| Styling              | Tailwind 4                |
| Components           | Shadcn/ui                 |
| Backend              | Supabase                  |
| Authentication       | Supabase Auth             |
| Database             | PostgreSQL (via Supabase) |
| Serverless Functions | Supabase Edge Functions   |
| Scheduling           | pg_cron                   |
| Primary Data Source  | tcgcsv.com (CSV)          |
| Supplementary Data   | pokemontcg.io (API)       |

### Data Source Responsibilities

| Source                  | Data Provided                                                            | Update Frequency                     |
| ----------------------- | ------------------------------------------------------------------------ | ------------------------------------ |
| **tcgcsv.com (CSV)**    | Card catalog (sets, cards, card numbers), market pricing                 | Daily automated import (4:00 AM UTC) |
| **pokemontcg.io (API)** | Detailed card attributes (types, abilities, HP, etc.), card artwork URLs | On-demand with 24-hour cache         |

**Data merge strategy:**

- CSV data is the source of truth for card identity and pricing
- API data supplements with detailed attributes when available
- API data fetched lazily on card detail view (not during import)
- When data conflicts, CSV pricing takes precedence; API details supplement

### Image Hosting Strategy

Card images are **hotlinked directly** from pokemontcg.io CDN URLs stored in the database:

- Zero storage and bandwidth cost for MVP
- Image URLs obtained from pokemontcg.io API responses
- Placeholder image displayed when URL unavailable (FR-005)
- Lazy loading implemented for performance
- Strategy may be revisited post-MVP if reliability issues arise

## 2. User Problem

Storing and checking TCG cards for personal use is cumbersome. Collectors struggle with:

1. Tracking what cards they own across multiple sets and expansions
2. Knowing the current market value of their collection
3. Organizing cards for different purposes (personal collection, trades, sales)
4. Finding comprehensive but not overwhelming information about specific cards
5. Recording card conditions and professional grades for graded cards
6. Remembering purchase prices to track investment vs. current value

TCGCollectr solves these problems by providing a free, easy-to-use platform that combines:

- Comprehensive card database with daily price updates
- Personal collection tracking with condition and grade recording
- Custom organization through user-defined lists
- Clean, accessible interface that presents essential information without overwhelming users

## 3. Functional Requirements

### FR-001: Card Catalog

- Display all Pokémon card sets from imported CSV data
- Organize cards within sets with card count displayed per set
- Set list must load in under 1 second
- Support filtering by rarity, type, and price range
- Provide paginated card views (20-50 cards per page)

### FR-002: Search System

- Search by card name, set name, card number, and Pokémon name
- Return search results in under 200ms (first 20 cards)
- Implement debounced search input (300ms delay)
- Display paginated results with "No results found" for empty searches

### FR-003: User Collections

- Allow authenticated users to add/remove cards from their collection
- Track quantity per card with increment/decrement controls (minimum: 1)
- Support condition selection from predefined scale (mint, near_mint, excellent, good, played, poor)
- Optional professional grade entry (PSA/BGS/CGC with values 1-10)
- Optional purchase price field (USD)
- Notes field (maximum 500 characters)
- Display confirmation before removing cards from collection

### FR-004: Custom Lists

- Allow up to 10 named lists per user (MVP limit)
- List names limited to 50 characters
- Support assigning/unassigning cards to multiple lists
- Filter collection view by list
- Deleting a list does not remove cards from collection
- Display card count per list

### FR-005: Card Details

- Display card metadata (name, set, number, rarity, type) from CSV data
- Show detailed card attributes (types, abilities, HP) from pokemontcg.io API when available
- Show card artwork via hotlinked pokemontcg.io CDN URLs with lazy loading
- Display placeholder image when artwork URL unavailable
- Show market price in USD (from CSV) with "Last updated" timestamp
- Display "Limited information available" when API data is missing
- Show contextual actions based on user state (guest vs. authenticated)

### FR-006: User Accounts

- Registration with email and password
- Email verification required before full access
- Login with email and password
- Password reset via email
- Logout functionality
- Profile page with account settings
- Account deletion with clear warning and 30-day soft-delete period
- Account recovery during soft-delete period by logging in

### FR-007: Data Import

- Automated daily CSV import from tcgcsv.com at 4:00 AM UTC
- Incremental updates using upsert (not full replace)
- Import job logging with success/failure counts
- Error details captured for failed records
- New sets and cards automatically available after import
- Manual import trigger for administrators

### FR-008: Admin Panel

- View import job history (last 30 days)
- Display success/failure counts per import job
- Manual CSV import trigger button
- Aggregate statistics: total users, total cards in collections
- Admin-only access enforced via role check

## 4. Product Boundaries

### In Scope (MVP)

- Pokémon TCG card catalog and browsing
- Multi-faceted search (card name, set name, card number, Pokémon name)
- User registration and authentication (email/password)
- Personal collection management with quantity and condition tracking
- Professional grade recording (PSA, BGS, CGC)
- Purchase price tracking
- Custom lists for organization (up to 10 per user)
- Market price display with timestamps
- Daily automated data import from tcgcsv.com
- Supplementary card data from pokemontcg.io API
- Admin dashboard for import monitoring and statistics
- Responsive web design

### Out of Scope (Post-MVP)

- Collection export (CSV/JSON format)
- "New Cards" section highlighting recent additions
- Progressive Web App (PWA) offline support
- Public user profiles
- Social authentication (Google, Facebook, etc.)
- Currency selector for non-USD prices
- Multi-language support
- Email digest notifications for new sets

### Explicitly Excluded

- OCR card scanning via camera
- Paid API integrations
- Non-Pokémon trading card games
- Advanced price trend analysis and historical charts
- Marketplace or selling features
- Redirect links to external sellers (eBay, Amazon, etc.)

## 5. User Stories

### Authentication and Account Management

#### US-001: User Registration

ID: US-001
Title: Register for an Account
Description: As a new user, I want to register for an account with my email and password so that I can save my card collection.

Acceptance Criteria:

- Registration form accepts email and password
- Password meets minimum security requirements (8+ characters)
- Email verification is sent upon registration
- User cannot access collection features until email is verified
- Duplicate email addresses are rejected with clear error message
- Success message displayed after registration

---

#### US-002: User Login

ID: US-002
Title: Log into Account
Description: As a registered user, I want to log into my account so that I can access my saved collection.

Acceptance Criteria:

- Login form accepts email and password
- Invalid credentials display appropriate error message
- Successful login redirects to collection page
- "Remember me" option persists session
- Login rate limiting prevents brute force attacks

---

#### US-003: Password Reset

ID: US-003
Title: Reset Forgotten Password
Description: As a user who forgot my password, I want to reset it via email so that I can regain access to my account.

Acceptance Criteria:

- "Forgot password" link available on login page
- Password reset email sent within 1 minute
- Reset link expires after 24 hours
- New password must meet security requirements
- Confirmation message after successful reset

---

#### US-004: User Logout

ID: US-004
Title: Log out of Account
Description: As a logged-in user, I want to log out of my account so that I can secure my session on shared devices.

Acceptance Criteria:

- Logout option accessible from header/navigation
- Session cleared upon logout
- User redirected to home page after logout
- Confirmation that logout was successful

---

#### US-005: Delete Account

ID: US-005
Title: Delete My Account
Description: As a user, I want to delete my account and all associated data so that I can exercise my privacy rights.

Acceptance Criteria:

- Delete account option in profile settings
- Clear warning about permanent data loss after 30 days
- Confirmation dialog requires explicit user action
- Account enters soft-delete state immediately
- All collection data marked for deletion
- Email confirmation sent about deletion

---

#### US-006: Recover Deleted Account

ID: US-006
Title: Recover Account Within Grace Period
Description: As a user who deleted my account, I want a 30-day recovery period so that I can restore my account if I change my mind.

Acceptance Criteria:

- Logging in during 30-day period restores account
- All collection data restored upon recovery
- Message displayed explaining account was restored
- After 30 days, account and data permanently deleted

---

### Card Browsing and Discovery

#### US-007: Browse Card Sets

ID: US-007
Title: Browse Cards by Set
Description: As a collector, I want to browse cards organized by set so that I can explore what cards are available in each expansion.

Acceptance Criteria:

- Home page displays list of all card sets
- Sets show name, release date, and card count
- Clicking a set navigates to set detail page
- Set list loads in under 1 second
- Sets are sortable by name or release date

---

#### US-008: View Cards in Set

ID: US-008
Title: View All Cards in a Set
Description: As a collector, I want to view all cards within a specific set so that I can see the complete contents of an expansion.

Acceptance Criteria:

- Set detail page shows all cards in the set
- Cards displayed in a grid layout
- Card thumbnails show name and number
- Pagination controls for sets with many cards
- Option to change cards per page (20, 30, 50)

---

#### US-009: Search for Cards

ID: US-009
Title: Search Cards by Multiple Criteria
Description: As a collector, I want to search for cards by name, set, number, or Pokémon so that I can quickly find specific cards.

Acceptance Criteria:

- Search input visible on all pages
- Search supports card name, set name, card number, Pokémon name
- Results appear within 200ms
- Search input has 300ms debounce
- Results are paginated
- "No results found" message for empty results

---

#### US-010: Filter Cards

ID: US-010
Title: Filter Cards by Attributes
Description: As a collector, I want to filter cards by rarity, type, and price range so that I can find cards matching specific criteria.

Acceptance Criteria:

- Filter controls available on set view and search results
- Filter by rarity (common, uncommon, rare, etc.)
- Filter by card type
- Filter by price range (min/max)
- Multiple filters can be combined
- "Clear filters" option resets all filters
- Filter state preserved during pagination

---

#### US-011: View Card Details

ID: US-011
Title: View Complete Card Information
Description: As a user, I want to view detailed information about any card so that I can research cards before purchasing or trading.

Acceptance Criteria:

- Card detail page accessible without authentication
- Displays card name, set, number, rarity, type
- Shows card artwork (lazy loaded)
- Placeholder image shown when artwork unavailable
- Market price displayed with "Last updated" timestamp
- "Limited information available" shown when data incomplete
- Guest users see "Add to Collection" prompt
- Authenticated users see collection status

---

#### US-012: Check Price Freshness

ID: US-012
Title: Verify Price Data Currency
Description: As a user, I want to see when price data was last updated so that I can assess if the information is current.

Acceptance Criteria:

- "Last updated" timestamp displayed with all prices
- Timestamp shows relative time (e.g., "2 hours ago")
- Visual indicator for stale data (older than 24 hours)
- Hover/tap shows exact timestamp

---

### Collection Management

#### US-013: Add Card to Collection

ID: US-013
Title: Add Card to My Collection
Description: As a collector, I want to add cards to my collection with quantity and condition so that I can track what I own.

Acceptance Criteria:

- "Add to Collection" button on card detail page (authenticated users)
- Modal opens for entering card details
- Quantity field with increment/decrement controls (min: 1)
- Condition dropdown with predefined options
- Optional professional grade fields (company, value)
- Optional purchase price field (USD)
- Optional notes field (500 character limit)
- Success confirmation message after adding
- Card appears in collection immediately

---

#### US-014: Update Collection Entry

ID: US-014
Title: Edit Card in Collection
Description: As a collector, I want to update the details of a card in my collection so that I can correct information or change condition.

Acceptance Criteria:

- Edit button on collection card entries
- All fields editable (quantity, condition, grade, price, notes)
- Changes saved with confirmation message
- Cancel option discards changes
- Updated timestamp reflects edit time

---

#### US-015: Remove Card from Collection

ID: US-015
Title: Remove Card from Collection
Description: As a collector, I want to remove cards from my collection so that I can keep my collection accurate when I sell or trade cards.

Acceptance Criteria:

- Remove/delete button on collection entries
- Confirmation dialog before removal
- Card removed from all associated lists
- Success message after removal
- Collection total updates immediately

---

#### US-016: View Collection Value

ID: US-016
Title: See Total Collection Value
Description: As a collector, I want to see the current market value of my collection so that I can understand my total investment worth.

Acceptance Criteria:

- Total collection value displayed on collection page
- Value calculated from current market prices
- Individual card values shown per entry
- Value accounts for quantity (price × quantity)
- Last updated timestamp for price data

---

#### US-017: Track Purchase Price

ID: US-017
Title: Record Purchase Price
Description: As a collector, I want to record my purchase price for cards so that I can track my investment compared to current market value.

Acceptance Criteria:

- Purchase price field when adding/editing card
- Purchase price displayed in collection view
- Comparison to current market price visible
- Profit/loss indication per card
- Total investment shown on collection page

---

#### US-018: Add Notes to Cards

ID: US-018
Title: Add Notes to Collection Entries
Description: As a collector, I want to add notes to my cards so that I can remember where I acquired them or their trade status.

Acceptance Criteria:

- Notes field available when adding/editing card
- Maximum 500 characters enforced
- Character count displayed during input
- Notes visible in collection detail view
- Notes searchable within collection (future consideration)

---

#### US-019: Record Professional Grades

ID: US-019
Title: Record Graded Card Information
Description: As a collector, I want to record professional grades for my graded cards so that I can track their certified condition.

Acceptance Criteria:

- Optional grade company selection (PSA, BGS, CGC)
- Grade value input (1.0 to 10.0)
- Validation ensures valid grade ranges
- Grade company required if grade value entered
- Grade displayed prominently in collection view

---

### List Organization

#### US-020: Create Custom List

ID: US-020
Title: Create a Custom List
Description: As a collector, I want to create custom lists so that I can organize my collection for different purposes.

Acceptance Criteria:

- "Create list" option in collection management
- List name required (maximum 50 characters)
- List created successfully with confirmation
- New list appears in list selector
- Error if user already has 10 lists (MVP limit)

---

#### US-021: Add Card to List

ID: US-021
Title: Assign Card to Custom List
Description: As a collector, I want to assign cards to custom lists so that I can organize cards for trades or specific purposes.

Acceptance Criteria:

- List assignment option on collection entries
- Multi-select for assigning to multiple lists
- Card can belong to multiple lists simultaneously
- Visual indicator shows current list assignments
- Changes saved immediately

---

#### US-022: View Cards by List

ID: US-022
Title: Filter Collection by List
Description: As a collector, I want to filter my collection by list so that I can view only cards in a specific category.

Acceptance Criteria:

- List filter dropdown on collection page
- Selecting list shows only cards in that list
- "All cards" option shows complete collection
- Card count displayed per list
- Filter state preserved during pagination

---

#### US-023: Delete Custom List

ID: US-023
Title: Delete a Custom List
Description: As a collector, I want to delete custom lists I no longer need so that I can keep my organization manageable.

Acceptance Criteria:

- Delete option for each list
- Confirmation dialog before deletion
- Cards remain in collection after list deletion
- Success message after deletion
- List count updates immediately

---

### Onboarding

#### US-024: Quick Onboarding

ID: US-024
Title: Understand App Features Quickly
Description: As a new user, I want to quickly understand how to use the app so that I can start adding cards immediately.

Acceptance Criteria:

- Welcome modal appears after first login
- Modal highlights key features: Browse, Search, Add to Collection
- Step-by-step visual guide
- "Skip" option available to dismiss
- Modal does not appear on subsequent logins

---

### Administration

#### US-025: Monitor Import Jobs

ID: US-025
Title: View Import Job History
Description: As an admin, I want to view import job logs so that I can monitor data synchronization health.

Acceptance Criteria:

- Admin dashboard accessible only to admin users
- Import history shows last 30 days
- Each job shows: start time, duration, status
- Success/failure counts per job
- Error details accessible for failed jobs

---

#### US-026: Trigger Manual Import

ID: US-026
Title: Manually Trigger CSV Import
Description: As an admin, I want to manually trigger CSV imports so that I can refresh data on demand.

Acceptance Criteria:

- Manual import button on admin dashboard
- Confirmation dialog before triggering
- Progress indicator while import runs
- Success/failure notification when complete
- New import appears in job history

---

#### US-027: View Platform Statistics

ID: US-027
Title: See Aggregate Platform Statistics
Description: As an admin, I want to see aggregate user statistics so that I can track platform growth.

Acceptance Criteria:

- Statistics dashboard for admins
- Total registered users (excluding soft-deleted)
- Total cards in all collections
- Total unique cards tracked
- Statistics refresh on page load

---

### Edge Cases and Error Handling

#### US-028: Handle Missing Card Data

ID: US-028
Title: Gracefully Handle Incomplete Card Information
Description: As a user, I want to see appropriate messaging when card data is incomplete so that I understand the limitations.

Acceptance Criteria:

- "Limited information available" message for incomplete cards
- Placeholder image for missing artwork
- Price shows "N/A" when unavailable
- Card still functional for collection purposes

---

#### US-029: Handle Search with No Results

ID: US-029
Title: Display Empty Search Results Appropriately
Description: As a user, I want clear feedback when my search returns no results so that I can adjust my search terms.

Acceptance Criteria:

- "No results found" message displayed
- Suggestions for refining search provided
- Search input retains entered text
- Easy option to clear and try new search

---

#### US-030: Handle Network Errors

ID: US-030
Title: Gracefully Handle Network Connectivity Issues
Description: As a user, I want appropriate error messages when network issues occur so that I understand why actions failed.

Acceptance Criteria:

- Clear error message for network failures
- Retry option provided where appropriate
- User data not lost during error
- Error logged for debugging

---

#### US-031: Prevent Duplicate Collection Entries

ID: US-031
Title: Handle Adding Duplicate Cards
Description: As a collector, I want the system to handle duplicate card additions appropriately so that I don't accidentally create separate entries for the same card.

Acceptance Criteria:

- System detects if card already in collection
- Option to update quantity instead of creating duplicate
- Clear message explaining card already exists
- User can choose to edit existing entry

---

#### US-032: Handle List Limit Reached

ID: US-032
Title: Display List Limit Warning
Description: As a collector, I want to know when I've reached my list limit so that I understand why I cannot create more lists.

Acceptance Criteria:

- Clear message when 10-list limit reached
- Suggestion to delete unused lists
- Create list option disabled at limit
- Count of current lists displayed

---

#### US-033: Session Expiration Handling

ID: US-033
Title: Handle Expired Session Gracefully
Description: As a user, I want to be notified when my session expires so that I can re-authenticate and continue working.

Acceptance Criteria:

- Clear message when session expires
- Redirect to login page
- Return to previous page after re-login
- Unsaved changes warning if applicable

---

## 6. Success Metrics

### Primary Metrics

| Metric ID | Metric              | Target                                                     | Measurement Method                                    |
| --------- | ------------------- | ---------------------------------------------------------- | ----------------------------------------------------- |
| SM-001    | User Adoption Rate  | 90% of registered users have at least 1 card in collection | Database query: Users with cards ÷ Total active users |
| SM-002    | Weekly Active Users | 75% of users log in at least once per week                 | Weekly cohort analysis on last_sign_in_at             |

### Performance Metrics

| Metric ID | Metric               | Target         | Measurement Method              |
| --------- | -------------------- | -------------- | ------------------------------- |
| SM-003    | Search Response Time | < 200ms P95    | Server-side APM monitoring      |
| SM-004    | Page Load Time       | < 1 second P95 | Client-side performance metrics |
| SM-005    | API Cache Hit Rate   | > 80%          | Cache layer logging             |

### Data Quality Metrics

| Metric ID | Metric               | Target                   | Measurement Method               |
| --------- | -------------------- | ------------------------ | -------------------------------- |
| SM-006    | Import Success Rate  | > 95% successful imports | Import job status tracking       |
| SM-007    | Price Data Freshness | Updated daily            | Last import timestamp monitoring |

### Engagement Metrics

| Metric ID | Metric               | Target                                     | Measurement Method           |
| --------- | -------------------- | ------------------------------------------ | ---------------------------- |
| SM-008    | Cards per Collection | Average > 10 cards                         | Database query on user_cards |
| SM-009    | List Adoption        | > 30% of users create at least 1 list      | Database query on user_lists |
| SM-010    | Return Visit Rate    | > 50% return within 7 days of registration | Session analytics            |

### Reliability Metrics

| Metric ID | Metric        | Target           | Measurement Method        |
| --------- | ------------- | ---------------- | ------------------------- |
| SM-011    | System Uptime | > 99.5%          | Uptime monitoring service |
| SM-012    | Error Rate    | < 1% of requests | Server error logging      |
