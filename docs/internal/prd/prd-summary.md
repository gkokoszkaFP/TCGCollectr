# TCGCollectr MVP - PRD Planning Summary

> **Generated**: 2026-01-11
> **Status**: Ready for Development
> **Format**: Agentic AI Optimized

---

<conversation_summary>

<decisions>

## Confirmed Decisions

| ID  | Category      | Decision                                                                                                          | Priority |
| --- | ------------- | ----------------------------------------------------------------------------------------------------------------- | -------- |
| D01 | Search        | Multi-faceted search: card name, set name, Pokémon type                                                           | HIGH     |
| D02 | Display       | Tiered info: essential (name, set, number, rarity, image) default; expandable (HP, attacks, weaknesses) on-demand | HIGH     |
| D03 | Analytics     | Supabase built-in analytics for: account creation, card added, login timestamps                                   | MEDIUM   |
| D04 | Auth          | Email/password only via Supabase Auth; minimal registration fields                                                | HIGH     |
| D05 | Collection    | Quantity tracking per card + variant support; NO condition grading                                                | HIGH     |
| D06 | Caching       | Cache essential card data in DB for offline collection viewing                                                    | HIGH     |
| D07 | Timeline      | 8-12 weeks; card browsing first, then auth                                                                        | HIGH     |
| D08 | Navigation    | Pagination + lazy loading; set-based navigation primary                                                           | HIGH     |
| D09 | Metrics       | Measure against all registered users; organic growth via communities                                              | MEDIUM   |
| D10 | Organization  | Single flat collection + wishlist flag only                                                                       | HIGH     |
| D11 | Platform      | Responsive PWA; mobile-first approach                                                                             | HIGH     |
| D12 | Offline       | Graceful degradation; cached collection viewable when API unavailable                                             | MEDIUM   |
| D13 | Limits        | 10,000 cards/user; display collection statistics                                                                  | MEDIUM   |
| D14 | Export        | CSV export feature included in MVP                                                                                | MEDIUM   |
| D15 | Retention     | No auto-deletion; policy in Terms of Service                                                                      | LOW      |
| D16 | Duplicates    | Increase quantity for same card+variant; visible indicator for qty > 1                                            | HIGH     |
| D17 | Gamification  | Set completion percentage tracking                                                                                | MEDIUM   |
| D18 | Wishlist      | Simple flag + filter; wishlist count on dashboard                                                                 | MEDIUM   |
| D19 | Onboarding    | Minimal: register → optional preference → search with "Add your first card!"                                      | MEDIUM   |
| D20 | Images        | Hotlink TCGDex CDN + lazy loading                                                                                 | HIGH     |
| D21 | Language      | English only; i18n-ready codebase structure                                                                       | MEDIUM   |
| D22 | Performance   | <3s page load, <1s search; skeleton loading states                                                                | HIGH     |
| D23 | Accessibility | WCAG 2.1 Level AA compliance                                                                                      | HIGH     |
| D24 | Feedback      | Simple mailto: link for support                                                                                   | LOW      |
| D25 | Rate Limiting | 100 additions/min, 60 searches/min per user                                                                       | MEDIUM   |

</decisions>

<matched_recommendations>

## Implementation Recommendations

### API Integration

```yaml
provider: TCGDex
base_url: https://api.tcgdex.net/v2/en
cdn_url: https://assets.tcgdex.net
rate_limit: Respect API limits; implement client-side caching
```

### Card Data Fields

```yaml
essential_fields:
  - id: "unique card identifier (e.g., swsh3-136)"
  - localId: "card number within set"
  - name: "card name"
  - image: "card image URL"
  - category: "Pokemon | Trainer | Energy"
  - rarity: "Common | Uncommon | Rare | etc."
  - set.name: "set name"
  - set.id: "set identifier"

expanded_fields:
  - hp: "hit points (number)"
  - types: "array of types"
  - attacks: "array of {cost, name, effect, damage}"
  - weaknesses: "array of {type, value}"
  - retreat: "retreat cost (number)"
  - evolveFrom: "evolution source"
  - stage: "Basic | Stage1 | Stage2"
  - description: "flavor text"

variant_options:
  - normal
  - reverse
  - holo
  - firstEdition
```

### Database Schema

```sql
-- Core collection table
CREATE TABLE user_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  card_id TEXT NOT NULL,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  variant TEXT DEFAULT 'normal' CHECK (variant IN ('normal', 'reverse', 'holo', 'firstEdition')),
  is_wishlist BOOLEAN DEFAULT FALSE,
  cached_name TEXT NOT NULL,
  cached_set_name TEXT NOT NULL,
  cached_local_id TEXT NOT NULL,
  cached_image_url TEXT,
  cached_rarity TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, card_id, variant)
);

-- Enable RLS
ALTER TABLE user_cards ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX idx_user_cards_user_id ON user_cards(user_id);
CREATE INDEX idx_user_cards_card_id ON user_cards(card_id);
CREATE INDEX idx_user_cards_wishlist ON user_cards(user_id, is_wishlist) WHERE is_wishlist = TRUE;
```

### Analytics Events

```yaml
events:
  - name: user_registered
    fields: [user_id, timestamp, source]
  - name: user_login
    fields: [user_id, timestamp]
  - name: card_added
    fields: [user_id, card_id, variant, quantity, timestamp]
  - name: card_removed
    fields: [user_id, card_id, timestamp]
  - name: card_viewed
    fields: [card_id, user_id?, timestamp]
  - name: search_performed
    fields: [query, filters, results_count, timestamp]
  - name: collection_exported
    fields: [user_id, card_count, timestamp]
```

### Performance Targets

```yaml
metrics:
  initial_page_load: "<3000ms"
  search_response: "<1000ms"
  image_lazy_load: true
  skeleton_loading: true
  service_worker: true
```

### Rate Limiting

```yaml
limits:
  card_additions:
    max: 100
    window: "1 minute"
    per: "user"
  searches:
    max: 60
    window: "1 minute"
    per: "user"
```

</matched_recommendations>

<prd_planning_summary>

## Product Definition

### Problem Statement

Pokémon TCG collectors lack a simple, comprehensive tool to track their card collections. Existing solutions are either too complex or don't provide the right balance of information.

### Solution

TCGCollectr is a Progressive Web Application that enables collectors to:

- Browse the complete Pokémon TCG catalog
- Track owned cards with quantities and variants
- Monitor set completion progress
- Access collection data on mobile devices

### Tech Stack

```yaml
frontend: Astro 5 + React 19 + TypeScript 5
styling: Tailwind 4 + Shadcn/ui
backend: Supabase (Auth, Database, Analytics)
api: TCGDex (free, open-source)
deployment: TBD (separate planning)
```

## Functional Requirements

### F1: Authentication

```yaml
id: F1
name: User Authentication
priority: HIGH
stories:
  - "As a user, I can register with email and password"
  - "As a user, I can log in to access my collection"
  - "As a user, I can log out securely"
acceptance_criteria:
  - Email/password registration works
  - Login persists across sessions
  - Logout clears session data
```

### F2: Card Browsing

```yaml
id: F2
name: Card Browsing
priority: HIGH
stories:
  - "As a visitor, I can browse cards without logging in"
  - "As a user, I can search by card name"
  - "As a user, I can filter by set"
  - "As a user, I can filter by Pokémon type"
acceptance_criteria:
  - Search returns results in <1 second
  - Pagination with lazy loading works
  - Set-based navigation available
  - Card details expandable on click
```

### F3: Collection Management

```yaml
id: F3
name: Collection Management
priority: HIGH
stories:
  - "As a user, I can add a card to my collection"
  - "As a user, I can specify quantity and variant"
  - "As a user, I can update card quantity"
  - "As a user, I can remove cards from collection"
acceptance_criteria:
  - Cards saved with quantity and variant
  - Duplicate card+variant increases quantity
  - Quantity > 1 clearly visible
  - Collection limit of 10,000 cards enforced
```

### F4: Wishlist

```yaml
id: F4
name: Wishlist
priority: MEDIUM
stories:
  - "As a user, I can mark any card as wishlist"
  - "As a user, I can filter to see only wishlisted cards"
  - "As a user, I can see my wishlist count on dashboard"
acceptance_criteria:
  - Toggle wishlist flag on any card
  - Filter shows only wishlisted cards
  - Count displayed on user dashboard
```

### F5: Collection Statistics

```yaml
id: F5
name: Collection Statistics
priority: MEDIUM
stories:
  - "As a user, I can see total cards in my collection"
  - "As a user, I can see set completion percentages"
  - "As a user, I can see unique card count"
acceptance_criteria:
  - Total quantity sum displayed
  - Unique cards count displayed
  - Set completion: "X/Y cards (Z%)"
```

### F6: Data Export

```yaml
id: F6
name: Data Export
priority: MEDIUM
stories:
  - "As a user, I can export my collection to CSV"
acceptance_criteria:
  - CSV includes: card_id, name, set, number, rarity, quantity, variant, wishlist
  - Download triggers immediately
  - File named with timestamp
```

### F7: Offline Support

```yaml
id: F7
name: Offline Support
priority: MEDIUM
stories:
  - "As a user, I can view my cached collection offline"
  - "As a user, I see a notification when API is unavailable"
acceptance_criteria:
  - Cached collection data viewable offline
  - Clear notification when search unavailable
  - Graceful degradation, no crashes
```

## Non-Functional Requirements

### NFR1: Performance

- Initial page load: <3 seconds (4G)
- Search response: <1 second
- Skeleton loading states implemented
- Lazy loading for images

### NFR2: Accessibility

- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Proper color contrast ratios
- Focus indicators visible

### NFR3: Security

- Supabase RLS policies on all tables
- Rate limiting enforced
- No sensitive data in localStorage
- HTTPS only

### NFR4: Scalability

- 10,000 cards per user limit
- Pagination for large result sets
- Indexed database queries

## Success Metrics

| Metric           | Target | Query Logic                                                         |
| ---------------- | ------ | ------------------------------------------------------------------- |
| Users with cards | 90%    | `COUNT(DISTINCT user_id) WHERE card_added / COUNT(users)`           |
| Weekly retention | 75%    | `COUNT(users with card_added in last 7 days) / COUNT(active_users)` |
| Page load        | <3s    | Lighthouse Performance Score                                        |
| Search speed     | <1s    | P95 response time                                                   |

## User Flows

### Flow 1: New User Registration

```
1. Land on homepage
2. Click "Sign Up"
3. Enter email + password
4. (Optional) Select favorite type/set
5. Redirect to search with "Add your first card!" prompt
```

### Flow 2: Add Card to Collection

```
1. Search for card (name/set/type)
2. Click card in results
3. View card details
4. Click "Add to Collection"
5. Select quantity (default: 1)
6. Select variant (default: normal)
7. Confirm → Card added, toast notification
```

### Flow 3: View Collection

```
1. Navigate to "My Collection"
2. See grid of owned cards
3. Filter by: set, type, wishlist
4. See statistics summary
5. Click card for details/edit quantity
```

## Out of Scope (MVP)

```yaml
excluded:
  - Paid APIs
  - Non-Pokémon cards
  - Price/trend analysis
  - Camera/OCR scanning
  - Marketplace links
  - TCGCSV import
  - Admin dashboard
  - Multiple languages
  - Condition grading
  - Social features
  - Native mobile apps
  - Advanced sorting options
  - Collection sharing
  - Trading features
```

</prd_planning_summary>

<resolved_issues>

## Resolved Items

| ID  | Issue                             | Decision                                                          | Status   |
| --- | --------------------------------- | ----------------------------------------------------------------- | -------- |
| U01 | Deployment strategy               | Deferred to separate planning session                             | DEFERRED |
| U02 | Terms of Service / Privacy Policy | Use free template (Termly/iubenda) for MVP                        | RESOLVED |
| U03 | Email service provider            | Supabase built-in SMTP; feedback@tcgcollectr.com for support      | RESOLVED |
| U04 | Error monitoring solution         | Browser console + Supabase logs; add Sentry post-launch if needed | RESOLVED |
| U05 | Database backup strategy          | Supabase built-in: daily backups, 7-day retention                 | RESOLVED |
| U06 | Beta testing plan                 | Soft launch: Alpha (W8) → Closed Beta (W10) → Open Beta (W12)     | RESOLVED |
| U07 | Post-MVP roadmap                  | Prioritized: condition grading → sharing → i18n → prices → social | RESOLVED |

### U02: Legal Documents

```yaml
approach: template-based
provider: Termly or iubenda (free tier)
documents:
  - Terms of Service
  - Privacy Policy
key_points:
  - Data collection (email, collection data)
  - Third-party API usage (TCGDex)
  - No data selling
  - GDPR basics
```

### U03: Email Configuration

```yaml
provider: Supabase Built-in SMTP
features:
  - Registration confirmation
  - Password reset
cost: Free (low volume)
feedback_email: feedback@tcgcollectr.com
```

### U04: Error Monitoring

```yaml
mvp_approach:
  - Browser console logging
  - Supabase dashboard logs
  - Manual error reporting via feedback form
post_launch:
  - Add Sentry if error volume warrants
  - Free tier: 5K errors/month
```

### U05: Backup Strategy

```yaml
provider: Supabase Built-in
schedule: Daily automatic backups
retention: 7 days
manual_exports: Not required for MVP
disaster_recovery: Restore from Supabase dashboard
```

### U06: Beta Testing Plan

```yaml
phases:
  - name: Alpha
    week: 8
    users: 5-10
    source: Friends and family

  - name: Closed Beta
    week: 10
    users: 50-100
    source:
      - r/PokemonTCG
      - r/pkmntcgcollections
      - PokéBeach Discord
      - PokeGoldfish Discord

  - name: Open Beta
    week: 12
    users: Public
    label: "Beta" badge in UI

feedback_collection:
  - Google Form (linked from app)
  - GitHub Issues (bug reports)
```

### U07: Post-MVP Roadmap

```yaml
priority_order:
  - rank: 1
    feature: Condition grading
    effort: Medium
    impact: High
    rationale: Serious collectors need this

  - rank: 2
    feature: Collection sharing (public link)
    effort: Low
    impact: Medium
    rationale: Show off collections, viral potential

  - rank: 3
    feature: i18n (Spanish, Japanese first)
    effort: Medium
    impact: High
    rationale: Large international collector base

  - rank: 4
    feature: Price tracking integration
    effort: High
    impact: High
    rationale: Valuable but adds API costs

  - rank: 5
    feature: Social features (follow, trade)
    effort: High
    impact: Medium
    rationale: Community building, long-term retention
```

## Assumptions Made

1. TCGDex API will remain free and available
2. Supabase free tier sufficient for MVP launch
3. User base primarily English-speaking initially
4. No immediate need for real-time features
5. Card data accuracy from TCGDex is acceptable

</resolved_issues>

</conversation_summary>
