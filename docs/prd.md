# Product Requirements Document (PRD) - TCGCollectr

## 1. Product Overview

TCGCollectr is a Progressive Web Application (PWA) designed to help Pokémon Trading Card Game collectors manage and track their card collections. The application provides a simple, comprehensive tool that balances detailed card information with ease of use.

### Vision

Create the go-to solution for Pokémon TCG collectors who want a straightforward way to track their cards without the complexity of existing solutions.

### Tech Stack

| Layer    | Technology                           |
| -------- | ------------------------------------ |
| Frontend | Astro 5 + React 19 + TypeScript 5    |
| Styling  | Tailwind 4 + Shadcn/ui               |
| Backend  | Supabase (Auth, Database, Analytics) |
| API      | TCGDex (free, open-source)           |
| Platform | Responsive PWA, mobile-first         |

### Timeline

8-12 weeks development cycle with the following phases:

- Card browsing functionality first
- Authentication system second
- Collection management third
- Polish and beta testing final

## 2. User Problem

### Problem Statement

Pokémon TCG collectors lack a simple, comprehensive tool to track their card collections. Current solutions present significant challenges:

1. Overly complex interfaces that overwhelm casual collectors
2. Too little information for serious collectors to make informed decisions
3. No balance between essential card data and detailed specifications
4. Difficulty accessing collection data across devices
5. No way to track set completion progress

### Target Users

- Primary: Pokémon TCG collectors who want to catalog their physical cards
- Secondary: Collectors interested in tracking set completion
- Tertiary: Casual browsers exploring the Pokémon TCG catalog

### User Needs

| Need                    | Priority |
| ----------------------- | -------- |
| Quick card lookup       | HIGH     |
| Track owned cards       | HIGH     |
| Mobile access           | HIGH     |
| Set completion tracking | MEDIUM   |
| Wishlist management     | MEDIUM   |
| Data export             | MEDIUM   |

## 3. Functional Requirements

### FR-01: User Authentication

| Attribute | Details                                |
| --------- | -------------------------------------- |
| Priority  | HIGH                                   |
| Provider  | Supabase Auth                          |
| Method    | Email/password only                    |
| Fields    | Email, password (minimal registration) |

Requirements:

- Email/password registration
- Session persistence across browser sessions
- Secure logout clearing all session data
- Password reset via email

### FR-02: Card Browsing

| Attribute   | Details                    |
| ----------- | -------------------------- |
| Priority    | HIGH                       |
| Access      | Public (no login required) |
| Data Source | TCGDex API                 |

Search capabilities:

- Search by card name
- Filter by set name
- Filter by Pokémon type

Navigation:

- Pagination with lazy loading
- Set-based navigation as primary method

Card display (tiered information):

- Essential (default): name, set, card number, rarity, image
- Expanded (on-demand): HP, attacks, weaknesses, retreat cost, evolution info

### MVP Data Sync Strategy (TCGDex)

For the MVP we will not run background jobs or scheduled syncs. Instead, data for sets and cards will be populated on-demand by the public API using the following pattern:

- Read from the local database first (fast path).
- If a requested set or card is missing, the API will fetch it synchronously from the TCGDex API and upsert the record into the local database before returning the response (seed-on-read).
- Required environment variables: `TCGDEX_URL`, `SUPABASE_URL`, and a server-only `SUPABASE_SERVICE_KEY` for upserts.
- Tradeoffs: first request for an uncached resource may be slower; implement lightweight rate limiting to prevent abuse and enumeration; ensure service keys remain server-side only.
- Rationale: avoids operational overhead of background jobs for MVP while ensuring the DB eventually contains requested resources and supports offline viewing.

### FR-03: Collection Management

| Attribute | Details                  |
| --------- | ------------------------ |
| Priority  | HIGH                     |
| Access    | Authenticated users only |
| Limit     | 10,000 cards per user    |

Features:

- Add cards to collection with quantity and variant
- Variants supported: normal, reverse, holo, firstEdition
- Update card quantities
- Remove cards from collection
- Duplicate card+variant increases quantity automatically
- Visual indicator for quantity > 1

### FR-04: Wishlist

| Attribute | Details                  |
| --------- | ------------------------ |
| Priority  | MEDIUM                   |
| Access    | Authenticated users only |

Features:

- Toggle wishlist flag on any card
- Filter collection to show only wishlisted cards
- Display wishlist count on dashboard

### FR-05: Collection Statistics

| Attribute | Details                  |
| --------- | ------------------------ |
| Priority  | MEDIUM                   |
| Access    | Authenticated users only |

Statistics displayed:

- Total cards in collection (sum of quantities)
- Unique card count
- Set completion percentage (X/Y cards = Z%)

### FR-06: Data Export

| Attribute | Details |
| --------- | ------- |
| Priority  | MEDIUM  |
| Format    | CSV     |

Export includes:

- card_id, name, set, card number, rarity, quantity, variant, wishlist status
- Filename includes timestamp
- Immediate download trigger

### FR-07: Offline Support

| Attribute | Details              |
| --------- | -------------------- |
| Priority  | MEDIUM               |
| Strategy  | Graceful degradation |

Features:

- Cached collection viewable when offline
- Clear notification when API/search unavailable
- Essential card data cached in database for offline viewing

### FR-08: Performance Requirements

| Metric            | Target      |
| ----------------- | ----------- |
| Initial page load | < 3 seconds |
| Search response   | < 1 second  |
| Image loading     | Lazy loaded |
| Loading states    | Skeleton UI |

### FR-09: Rate Limiting

| Action         | Limit          |
| -------------- | -------------- |
| Card additions | 100 per minute |
| Searches       | 60 per minute  |

### FR-10: Accessibility

- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Proper color contrast ratios
- Visible focus indicators

## 4. Product Boundaries

### In Scope (MVP)

- Pokémon TCG cards only
- Email/password authentication
- Card browsing and search
- Personal collection management
- Quantity and variant tracking
- Wishlist functionality
- Set completion tracking
- CSV export
- Offline collection viewing
- English language only
- Responsive PWA design

### Out of Scope (MVP)

| Feature                  | Reason                                 |
| ------------------------ | -------------------------------------- |
| Paid APIs                | Cost constraint                        |
| Non-Pokémon cards        | Scope limitation                       |
| Price/trend analysis     | Complexity, requires paid data         |
| Camera/OCR scanning      | Technical complexity                   |
| Marketplace links        | Out of core scope                      |
| TCGCSV offline import    | Deferred feature                       |
| Admin dashboard          | Not needed for MVP                     |
| Multiple languages       | i18n-ready structure, content deferred |
| Condition grading        | Post-MVP feature                       |
| Social features          | Post-MVP feature                       |
| Native mobile apps       | PWA approach chosen                    |
| Advanced sorting options | Post-MVP feature                       |
| Collection sharing       | Post-MVP feature                       |
| Trading features         | Post-MVP feature                       |

## 5. User Stories

### Authentication

US-001
Title: User Registration
Description: As a new user, I want to register with my email and password so that I can create an account and save my card collection.
Acceptance Criteria:

- Registration form displays email and password fields
- Password must meet minimum security requirements
- Email validation confirms proper format
- Successful registration creates user account in database
- User receives confirmation and is logged in automatically
- Duplicate email addresses are rejected with clear error message

US-002
Title: User Login
Description: As a registered user, I want to log in with my email and password so that I can access my saved collection.
Acceptance Criteria:

- Login form displays email and password fields
- Invalid credentials show clear error message
- Successful login redirects to user dashboard
- Session persists across browser sessions until logout
- Failed login attempts are rate-limited

US-003
Title: User Logout
Description: As a logged-in user, I want to log out so that my account is secure on shared devices.
Acceptance Criteria:

- Logout button is visible when user is authenticated
- Clicking logout clears all session data
- User is redirected to homepage after logout
- Protected routes become inaccessible after logout

US-004
Title: Password Reset
Description: As a user who forgot my password, I want to reset it via email so that I can regain access to my account.
Acceptance Criteria:

- "Forgot password" link is visible on login page
- User enters email address to request reset
- Reset email is sent within 1 minute
- Reset link expires after 24 hours
- User can set new password via reset link
- User is logged in after successful password reset

### Card Browsing

US-005
Title: Browse Cards Without Login
Description: As a visitor, I want to browse all Pokémon cards without creating an account so that I can explore the catalog before committing.
Acceptance Criteria:

- Card catalog is accessible without authentication
- Search functionality works for unauthenticated users
- Card details are viewable without login
- "Add to Collection" prompts login for unauthenticated users

US-006
Title: Search Cards by Name
Description: As a user, I want to search for cards by name so that I can quickly find specific cards.
Acceptance Criteria:

- Search input field is prominently displayed
- Search executes on form submission or after typing delay
- Results display within 1 second
- Partial name matches are included in results
- No results state displays helpful message
- Search query is preserved in URL for sharing

US-007
Title: Filter Cards by Set
Description: As a user, I want to filter cards by set name so that I can browse cards from a specific expansion.
Acceptance Criteria:

- Set filter dropdown/selector is available
- Sets are listed alphabetically or by release date
- Selecting a set filters results to only that set
- Filter can be combined with search
- Clear filter option is available
- Current filter is visually indicated

US-008
Title: Filter Cards by Pokémon Type
Description: As a user, I want to filter cards by Pokémon type so that I can find cards of a specific element.
Acceptance Criteria:

- Type filter options display all Pokémon types
- Selecting a type filters results accordingly
- Filter can be combined with search and set filter
- Type icons are used for visual clarity
- Multiple type selection is possible

US-009
Title: View Card Details
Description: As a user, I want to view detailed card information so that I can learn more about a specific card.
Acceptance Criteria:

- Clicking a card opens detail view
- Essential info displayed by default: name, set, number, rarity, image
- Expandable section shows: HP, attacks, weaknesses, retreat cost
- Card image displays at larger size
- Close/back option returns to previous view
- Card image loads from TCGDex CDN

US-010
Title: Navigate Card Results with Pagination
Description: As a user, I want to navigate through large result sets with pagination so that I can browse without performance issues.
Acceptance Criteria:

- Results are paginated with reasonable page size
- Current page indicator is visible
- Previous/next navigation works correctly
- Lazy loading loads more results on scroll
- Total result count is displayed

US-011
Title: Set-Based Navigation
Description: As a user, I want to navigate cards by set as the primary method so that I can explore complete sets.
Acceptance Criteria:

- Sets list is accessible from main navigation
- Sets display with name and card count
- Selecting a set shows all cards in that set
- Set completion percentage shown for logged-in users

### Collection Management

US-012
Title: Add Card to Collection
Description: As an authenticated user, I want to add a card to my collection so that I can track cards I own.
Acceptance Criteria:

- "Add to Collection" button visible on card detail
- Button only active for authenticated users
- Modal/form allows specifying quantity (default: 1)
- Modal/form allows selecting variant (default: normal)
- Success toast confirms card was added
- Card appears in user's collection immediately

US-013
Title: Specify Card Variant
Description: As a user, I want to specify the variant of my card so that I can track different versions accurately.
Acceptance Criteria:

- Variant options displayed: normal, reverse, holo, firstEdition
- Only one variant selectable per addition
- Same card can exist with different variants
- Variant is displayed in collection view

US-014
Title: Update Card Quantity
Description: As a user, I want to update the quantity of a card in my collection so that I can track duplicates.
Acceptance Criteria:

- Quantity is editable from collection view
- Quantity can be increased or decreased
- Quantity cannot be set below 1 (use remove instead)
- Changes save immediately
- Visual confirmation of quantity update

US-015
Title: Handle Duplicate Card Addition
Description: As a user, when I add a card I already own with the same variant, I want the quantity to increase so that I don't have duplicate entries.
Acceptance Criteria:

- Adding existing card+variant increases quantity by specified amount
- User is notified that quantity was updated (not new entry created)
- Unique constraint on user_id + card_id + variant enforced

US-016
Title: Remove Card from Collection
Description: As a user, I want to remove a card from my collection so that I can correct mistakes or update my inventory.
Acceptance Criteria:

- Remove/delete option available on collection card view
- Confirmation prompt prevents accidental deletion
- Card is removed from database immediately
- Success toast confirms removal
- Collection view updates without refresh

US-017
Title: View Collection
Description: As a user, I want to view all cards in my collection so that I can see what I own.
Acceptance Criteria:

- Collection page displays all user's cards
- Cards display as grid with images
- Each card shows: name, set, quantity, variant
- Quantity > 1 has visible indicator
- Empty collection shows helpful prompt to add cards
- Collection loads within 3 seconds

US-018
Title: Collection Card Limit
Description: As a user, I should be prevented from exceeding 10,000 cards so that system performance is maintained.
Acceptance Criteria:

- Warning displayed when approaching limit (9,500+ cards)
- Error displayed when limit would be exceeded
- User cannot add cards beyond limit
- Clear message explains the limit

### Wishlist

US-019
Title: Add Card to Wishlist
Description: As a user, I want to mark a card as wishlisted so that I can track cards I want to acquire.
Acceptance Criteria:

- Wishlist toggle (heart icon or similar) on card view
- Toggle works from both catalog and collection views
- Wishlisted cards have visual indicator
- Wishlist status persists in database
- Toggle is instant with optimistic UI update

US-020
Title: View Wishlist
Description: As a user, I want to filter my view to show only wishlisted cards so that I can see what I want to acquire.
Acceptance Criteria:

- Wishlist filter option in collection view
- Filter shows only cards with wishlist flag
- Can toggle filter on/off easily
- Wishlist count displayed on dashboard

US-021
Title: Remove Card from Wishlist
Description: As a user, I want to remove a card from my wishlist so that I can update my wants.
Acceptance Criteria:

- Clicking wishlist toggle removes wishlist flag
- Card remains in collection if owned
- UI updates immediately

### Collection Statistics

US-022
Title: View Collection Statistics
Description: As a user, I want to see statistics about my collection so that I can understand my progress.
Acceptance Criteria:

- Statistics displayed on dashboard/collection page
- Total card count (sum of all quantities) displayed
- Unique card count displayed
- Statistics update in real-time when collection changes

US-023
Title: View Set Completion Progress
Description: As a user, I want to see my completion percentage for each set so that I can track my collecting goals.
Acceptance Criteria:

- Set completion shows format: "X/Y cards (Z%)"
- Calculation based on unique cards, not quantities
- Sets with 0 cards owned not prominently displayed
- Progress bar or visual indicator for percentage

### Data Export

US-024
Title: Export Collection to CSV
Description: As a user, I want to export my collection to CSV so that I can backup my data or use it elsewhere.
Acceptance Criteria:

- Export button visible on collection page
- Click triggers immediate file download
- CSV includes: card_id, name, set, card number, rarity, quantity, variant, wishlist
- Filename includes timestamp: collection_YYYYMMDD_HHMMSS.csv
- Large collections export within reasonable time

### Offline Support

US-025
Title: View Collection Offline
Description: As a user, I want to view my collection when offline so that I can reference my cards without internet.
Acceptance Criteria:

- Cached collection data available offline
- User can see their cards without network
- Clear indication when viewing cached data
- No crashes when network unavailable

US-026
Title: Offline Search Notification
Description: As a user, I want to be notified when search is unavailable so that I understand the limitation.
Acceptance Criteria:

- Clear notification when API is unreachable
- Message explains that search requires internet
- Cached collection remains accessible
- Notification dismissible but non-intrusive

### Onboarding

US-027
Title: New User Onboarding
Description: As a new user, I want a simple onboarding flow so that I can start using the app quickly.
Acceptance Criteria:

- After registration, optional preference selection (favorite type/set)
- Redirect to search page after onboarding
- "Add your first card!" prompt displayed for empty collections
- Onboarding skippable
- Onboarding state tracked to not repeat

### Performance and UI

US-028
Title: Skeleton Loading States
Description: As a user, I want to see loading indicators so that I know content is being fetched.
Acceptance Criteria:

- Skeleton loaders display during data fetch
- Skeletons match approximate size of loaded content
- Smooth transition from skeleton to content
- No layout shift when content loads

US-029
Title: Lazy Load Images
Description: As a user, I want images to load progressively so that the page is usable before all images load.
Acceptance Criteria:

- Images load only when entering viewport
- Placeholder shown before image loads
- No broken image icons
- Images load from TCGDex CDN with caching

### Accessibility

US-030
Title: Keyboard Navigation
Description: As a user with accessibility needs, I want to navigate the app using only a keyboard so that I can use it without a mouse.
Acceptance Criteria:

- All interactive elements focusable via Tab
- Focus order is logical
- Focus indicators clearly visible
- Enter/Space activates buttons and links
- Escape closes modals and dropdowns

US-031
Title: Screen Reader Compatibility
Description: As a user with visual impairments, I want the app to work with screen readers so that I can access all functionality.
Acceptance Criteria:

- All images have alt text
- Form inputs have associated labels
- ARIA attributes used appropriately
- Announcements for dynamic content changes
- Heading hierarchy is logical

### Error Handling

US-032
Title: Form Validation Errors
Description: As a user, I want clear validation error messages so that I can fix input mistakes.
Acceptance Criteria:

- Errors displayed inline near relevant field
- Error messages are specific and actionable
- Errors clear when input is corrected
- Form submission prevented until errors resolved

US-033
Title: API Error Handling
Description: As a user, I want graceful error handling when the API fails so that I understand what went wrong.
Acceptance Criteria:

- Friendly error message displayed on API failure
- Retry option provided where appropriate
- App does not crash on API errors
- Error logged for debugging

### Feedback

US-034
Title: Submit Feedback
Description: As a user, I want to submit feedback about the app so that I can report issues or suggestions.
Acceptance Criteria:

- Feedback link visible in footer or menu
- Link opens email client with mailto: feedback@tcgcollectr.com
- Pre-filled subject line for bug reports

## 6. Success Metrics

### Primary Metrics

| Metric                           | Target | Measurement Method                                                |
| -------------------------------- | ------ | ----------------------------------------------------------------- |
| Users with cards in collection   | 90%    | COUNT(DISTINCT user_id with cards) / COUNT(all users)             |
| Weekly active users adding cards | 75%    | COUNT(users with card_added in last 7 days) / COUNT(active_users) |

### Performance Metrics

| Metric               | Target      | Measurement Method     |
| -------------------- | ----------- | ---------------------- |
| Initial page load    | < 3 seconds | Lighthouse Performance |
| Search response time | < 1 second  | P95 response time      |

### Analytics Events to Track

| Event               | Fields                                         |
| ------------------- | ---------------------------------------------- |
| user_registered     | user_id, timestamp, source                     |
| user_login          | user_id, timestamp                             |
| card_added          | user_id, card_id, variant, quantity, timestamp |
| card_removed        | user_id, card_id, timestamp                    |
| card_viewed         | card_id, user_id (optional), timestamp         |
| search_performed    | query, filters, results_count, timestamp       |
| collection_exported | user_id, card_count, timestamp                 |

### Beta Testing Plan

| Phase       | Week | Users  | Source                                      |
| ----------- | ---- | ------ | ------------------------------------------- |
| Alpha       | 8    | 5-10   | Friends and family                          |
| Closed Beta | 10   | 50-100 | r/PokemonTCG, r/pkmntcgcollections, Discord |
| Open Beta   | 12   | Public | Beta badge in UI                            |

### Success Criteria Validation

The MVP will be considered successful when:

1. 90% of registered users have added at least one card to their collection
2. 75% of active users log in at least once per week and add new cards
3. Page load times consistently under 3 seconds
4. Search responses consistently under 1 second
5. Zero critical security vulnerabilities
6. WCAG 2.1 Level AA compliance verified
