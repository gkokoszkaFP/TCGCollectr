# REST API Plan

## 1. Resources

- **Cards (`cards`, `rarities`, `sets`, `card_prices`, `price_sources`)**: Canonical Pokémon catalog enriched with rarity, set, and pricing metadata.
- **Sets (`sets`)**: Metadata for card groupings, used for filters and grouping collection views.
- **Card Conditions (`card_conditions`)**: Lookup values for condition selection and validation.
- **Collections (`collection_entries`)**: User-owned cards with quantities, conditions, and acquisition metadata.
- **Collection Summaries (`collection_set_summary`, `collection_value_view`)**: Aggregated per-user stats for totals and per-set counts.
- **External Cache Status (`api_cache`)**: Tracks freshness of upstream API data for banners and debugging.
- **Profile (`auth.users` + summaries)**: Authenticated user profile metrics derived from Supabase Auth and summary views.

## 2. Endpoints

### Cards

- **GET /api/cards**
  - Description: Search and list cards with filters, pagination, and price metadata.
  - Query: `q` (fuzzy name), `setId`, `setExternalId`, `cardNumber`, `rarityId`, `type`, `page` (default 1), `pageSize` (default 24, max 100), `sort` (`set|name|number`), `order` (`asc|desc`).
  - Response:
    ```json
    {
      "data": [
        {
          "id": "uuid",
          "name": "Pikachu",
          "cardNumber": "58/102",
          "numberSort": 58,
          "set": { "id": "uuid", "name": "Base Set", "abbreviation": "BS" },
          "rarity": { "id": "uuid", "displayName": "Common" },
          "images": { "small": "https://...", "large": "https://..." },
          "types": ["Electric"],
          "marketPrice": { "amount": 12.5, "currency": "USD", "source": "tcgp", "lastSeenAt": "2026-01-10T00:00:00Z" }
        }
      ],
      "meta": {
        "page": 1,
        "pageSize": 24,
        "totalPages": 42,
        "totalItems": 1000,
        "cacheExpiresAt": "2026-01-11T00:00:00Z"
      }
    }
    ```
  - Success: `200 OK`.
  - Errors: `400 INVALID_FILTER`, `503 CATALOG_UNAVAILABLE`.

- **GET /api/cards/{cardId}**
  - Description: Fetch a single card by UUID; optional `externalId` query for cards not yet synced.
  - Query: `externalId` (mutually exclusive with path ID).
  - Response mirrors single `data` object from list plus `priceHistory` array (latest N entries) when requested via `includePriceHistory=true`.
  - Success: `200 OK`.
  - Errors: `404 CARD_NOT_FOUND`, `503 EXTERNAL_SOURCE_DOWN`.

- **GET /api/cards/autocomplete**
  - Description: Lightweight name search for instant suggestions.
  - Query: `q` (required, min 2 chars), `setId` optional, `limit` (default 8, max 20).
  - Response:
    ```json
    {
      "data": [{ "id": "uuid", "name": "Pikachu", "cardNumber": "58/102", "set": "Base Set" }]
    }
    ```
  - Success: `200 OK`.
  - Errors: `400 QUERY_TOO_SHORT`.

### Sets

- **GET /api/sets**
  - Description: List sets for filters and navigation.
  - Query: `tcgType` (default `pokemon`), `search`, `page`, `pageSize`, `sort` (`releaseDate|name`).
  - Response includes `data` array with `id`, `name`, `abbreviation`, `releaseDate`, `totalCards`, `symbolUrl`, `logoUrl`.
  - Success: `200 OK`.
  - Errors: `400 INVALID_TCG_TYPE`.

- **GET /api/sets/{setId}**
  - Description: Fetch metadata plus aggregated stats (card count cached vs total, last sync timestamp).
  - Success: `200 OK`.
  - Errors: `404 SET_NOT_FOUND`.

### Card Conditions

- **GET /api/card-conditions**
  - Description: Retrieve available condition codes sorted by `sort_order`, indicating default.
  - Response sample:
    ```json
    {
      "data": [{ "code": "NM", "label": "Near Mint", "description": "Minimal wear", "isDefault": true }]
    }
    ```
  - Success: `200 OK`.

### Collections (auth required)

- **GET /api/collection/entries**
  - Description: Paginated view of authenticated user’s collection entries grouped/sorted for UI.
  - Query: `setId`, `rarityId`, `search`, `page`, `pageSize` (default 20, max 100), `sort` (`set|number|createdAt`), `order`.
  - Response:
    ```json
    {
      "data": [
        {
          "id": 123,
          "cardId": "uuid",
          "quantity": 2,
          "condition": { "code": "NM", "label": "Near Mint" },
          "card": {
            "name": "Pikachu",
            "cardNumber": "58/102",
            "set": { "id": "uuid", "name": "Base Set" },
            "rarity": "Common",
            "marketPrice": 12.5,
            "imageSmallUrl": "https://..."
          },
          "totals": {
            "estimatedValue": 25.0
          },
          "timestamps": { "createdAt": "2026-01-09T12:00:00Z", "updatedAt": "2026-01-10T14:00:00Z" }
        }
      ],
      "meta": {
        "page": 1,
        "pageSize": 20,
        "totalItems": 200,
        "grouping": "set",
        "sort": "set"
      }
    }
    ```
  - Success: `200 OK`.
  - Errors: `401 UNAUTHENTICATED`, `503 VALUATION_PENDING` (if price service down, still return data with warning array).

- **POST /api/collection/entries**
  - Description: Add card(s) to authenticated user collection; supports duplicate handling.
  - Request:
    ```json
    {
      "cardId": "uuid",
      "quantity": 2,
      "conditionCode": "NM",
      "acquiredAt": "2025-12-01",
      "purchasePrice": 15.0,
      "notes": "Pulled from booster",
      "duplicationStrategy": "increment" // or "separate"
    }
    ```
  - Response: Created entry object plus `collectionValueDelta`.
  - Success: `201 CREATED`.
  - Errors: `400 INVALID_QUANTITY`, `400 INVALID_CONDITION`, `409 ENTRY_EXISTS` (when `duplicationStrategy=separate` but identical entry already exists), `503 CARD_SYNC_REQUIRED`.

- **PATCH /api/collection/entries/{entryId}**
  - Description: Update quantity, condition, or metadata; supports optimistic concurrency via `If-Unmodified-Since` header.
  - Request body accepts subset of fields from POST; quantity must remain > 0.
  - Success: `200 OK` with updated entry.
  - Errors: `404 ENTRY_NOT_FOUND`, `412 PRECONDITION_FAILED` (stale version).

- **DELETE /api/collection/entries/{entryId}**
  - Description: Remove entry after confirmation.
  - Response includes `{ "deleted": true, "collectionValueDelta": -25.0 }`.
  - Success: `200 OK`.
  - Errors: `404 ENTRY_NOT_FOUND`.

### Collection Summaries

- **GET /api/collection/summary**
  - Description: Returns grouped counts per set using `collection_set_summary` (filters `setId`, `tcgType`).
  - Response sample:
    ```json
    {
      "data": [
        {
          "set": { "id": "uuid", "name": "Base Set" },
          "uniqueCards": 42,
          "totalQuantity": 60,
          "estimatedValue": 1234.56
        }
      ],
      "meta": { "lastRefreshedAt": "2026-01-10T02:00:00Z" }
    }
    ```
  - Success: `200 OK`.

- **GET /api/collection/value**
  - Description: Returns totals from `collection_value_view`, including fallback messaging if prices missing.
  - Response: `{ "totalEstimatedValue": 3456.78, "totalCards": 250, "cardsWithoutPrice": 12 }`.
  - Success: `200 OK`.

### Profile

- **GET /api/profile/summary**
  - Description: Combines user profile info (email, display name) with `collection_value_view` and `collection_set_summary` highlights.
  - Response includes `recentActivity` (latest collection entry timestamps) and `themePreference` placeholder (stored client-side but echoed when present).
  - Success: `200 OK`.
  - Errors: `401 UNAUTHENTICATED`.

### External Status & Health

- **GET /api/status/external**
  - Description: Surface health of upstream APIs and cache TTL for FR-031 banner.
  - Response:
    ```json
    {
      "data": {
        "pokemontcg": {
          "status": "healthy",
          "lastSuccessAt": "2026-01-10T00:00:00Z",
          "cacheExpiresAt": "2026-01-11T00:00:00Z"
        },
        "justtcg": { "status": "degraded", "lastError": "Timeout" }
      }
    }
    ```
  - Success: `200 OK`.
  - Errors: `503 STATUS_UNAVAILABLE` (if cache empty).

## 3. Authentication and Authorization

- **Mechanism**: Supabase Auth JWT (email/password + magic link). Tokens stored in HttpOnly cookies, verified via Astro middleware injecting `context.locals.supabase`.
- **Collection endpoints**: Require `authenticated` role; rely on Supabase Row Level Security so queries execute with user context (`auth.uid()`), ensuring users only access their own `collection_entries` and derived views.
- **Catalog endpoints**: Public read access mapped to `anon` role policies allowing SELECT on catalog tables; still rate-limited per IP.
- **Rate Limiting**: Middleware enforces sliding window (e.g., 60 requests/min per IP for catalog, 30/min for collection) with 429 responses containing `Retry-After` header.
- **Edge Function Secrets**: External sync endpoints (not exposed to clients) use service role key stored server-side; never returned via API.

## 4. Validation and Business Logic

- **Cards**: `cardId` must exist; `cardNumber` may contain alphanumerics but `numberSort` derived server-side. Responses expose both values so UI can display `58/102` while sorting by integer.
- **Card Search Filters**: `pageSize` capped at 100 to avoid table scans; `q` sanitized and minimum length 2 to align with trigram index efficiency.
- **Collection Entries**:
  - `quantity` integer > 0 (enforced via schema check and API validation with descriptive error message).
  - `conditionCode` must exist in `card_conditions`; default to record where `is_default = true` if omitted.
  - `cardId` must belong to `pokemon` `tcg_type` until multi-TCG is enabled; API checks `cards.tcg_type`.
  - Duplicate submissions handled via `duplicationStrategy`: `increment` adds to existing entry quantity, `separate` creates independent entry (only allowed when no exact match on `card_id + condition_code`).
  - Optimistic concurrency supported via `updated_at`; PATCH requests include `If-Unmodified-Since` header; server compares to stored timestamp.
- **Price Calculations**: `estimatedValue = quantity * market_price` where $market\_price$ uses preferred source order (highest priority active `price_sources`). When price unavailable, entry flagged and excluded from total; response includes `cardsWithoutPrice` counts.
- **Pagination & Sorting**: All list endpoints return `meta` object (page, pageSize, totalItems, sort); server enforces `page >= 1`. Sorting defaults: cards by `set` asc then `numberSort`, collection entries by `set` asc then `numberSort` to satisfy FR-019 and FR-020.
- **Caching Logic**: `cacheExpiresAt` values derived from `api_cache.expires_at`; when expired, endpoints return `warnings` array instructing UI to show banner while still delivering stale data when possible.
- **Error Format**: Uniform structure `{ "error": { "code": "INVALID_QUANTITY", "message": "Quantity must be at least 1", "details": { ... } } }` to satisfy FR-032/FR-033.
- **Profile Summary**: Pulls from `collection_value_view` + `collection_set_summary`; ensures totals refreshed via Supabase cron (documented metadata `lastRefreshedAt`).
