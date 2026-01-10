# API Endpoint Implementation Plan: GET /api/cards

## 1. Endpoint Overview
- Provide catalog search for TCG cards across sets with fuzzy matching, filtering, and pagination.
- Surface lightweight card metadata plus latest market price snapshot for each card.
- Ensure the response always reflects cached/known data even when upstream catalog or pricing feeds are degraded; expose cache expiry in metadata.

## 2. Request Details
- **HTTP Method**: GET
- **URL**: /api/cards
- **Query Parameters**:
  - Required: none (endpoint must function without filters)
  - Optional Filters:
    - `q`: trimmed string, fuzzy match against `cards.name`, min length 2 to avoid full table scans.
    - `setId`: UUID referencing `sets.id` (validate via regex + existence check when provided).
    - `setExternalId`: text referencing `sets.external_id`; mutually exclusive with `setId`.
    - `cardNumber`: text, normalize by uppercasing and trimming; compare against `cards.card_number`.
    - `rarityId`: UUID referencing `rarities.id`.
    - `type`: enum constrained to known `cards.types` values (derive from `tcg_types` table or config list).
  - Optional Pagination & Sorting:
    - `page`: integer ≥ 1 (default 1).
    - `pageSize`: integer between 1 and 100 (default 24).
    - `sort`: enum `set | name | number`; default `name`.
    - `order`: enum `asc | desc`; default `asc`.
- **Validation Strategy**:
  - Define `CardsSearchQuerySchema` (Zod) enforcing formats, exclusivity (`setId` XOR `setExternalId`), and clamping page/pageSize.
  - Reject invalid combinations with 400/`INVALID_FILTER`, returning field-specific `details` for front-end handling.

## 3. Response Details
- **Primary DTOs**: `PaginatedCardResponseDTO`, `CardDTO`, `SetSummaryDTO`, `RaritySummaryDTO`, `CardImagesDTO`, `MarketPriceDTO`, `PaginationMetaDTO`, `ErrorResponseDTO` (from [src/types.ts](src/types.ts)).
- **Success (200)**: JSON payload matching specification with `data` array of `CardDTO` and `meta` describing pagination plus `cacheExpiresAt` (24h TTL from cache or derived from price data).
- **Failure Codes**:
  - 400 `INVALID_FILTER` for schema violations or conflicting parameters.
  - 503 `CATALOG_UNAVAILABLE` when Supabase catalog queries fail or cache miss occurs while upstream data source is down.
  - 500 for uncaught exceptions (mapped to generic `CATALOG_UNAVAILABLE` or `STATUS_UNAVAILABLE` depending on utility helpers).

## 4. Data Flow
- Step 1: Astro API route (`src/pages/api/cards/index.ts`) reads query params, normalizes values, and validates with Zod schema.
- Step 2: Controller delegates to `CardCatalogService.searchCards(query, { supabase })` housed in `src/lib/services/cardCatalog.ts`.
- Step 3: Service composes Supabase query:
  - Base table `cards` joined with `sets` (select `id,name,abbreviation`) and `rarities` (left join for optional data).
  - Apply filters: `set_id`, `sets.external_id`, `rarity_id`, `types @> ARRAY[type]`, `card_number ILIKE`, fuzzy match via `similarity(name, q)` or `name ILIKE %q%` leveraging `idx_cards_name_trgm`.
  - Sorting: map `sort` to columns (`sets.name`, `cards.name`, `cards.number_sort`) with safe whitelisting; append `order`.
  - Pagination: offset = `(page-1)*pageSize`, limit = `pageSize`.
- Step 4: Fetch prices via lateral join or second query against `card_prices` filtered to highest-priority `price_sources` (use `priority` ordering). Choose approach based on performance testing; initial plan: subquery selecting most recent active price per card (window function `row_number()`).
- Step 5: Compute total count via `.select('*', { count: 'exact', head: true })` to fill `meta.totalItems`; derive `totalPages`.
- Step 6: Determine cache metadata:
  - Attempt to read `api_cache` row keyed by normalized query fingerprint to reuse cached `cacheExpiresAt`.
  - On miss, compute `cacheExpiresAt = now + 24h` and optionally upsert payload asynchronously (fire-and-forget) if response size acceptable.
- Step 7: Map DB rows to DTOs (ensure snake_case → camelCase) and return `PaginatedCardResponseDTO`.

## 5. Security Considerations
- Supabase RLS already allows `anon` reads on catalog tables; ensure API route uses `context.locals.supabase` (anon key) rather than service role to preserve enforced policies.
- Sanitize and whitelist sorting columns to prevent SQL injection or unexpected index scans.
- Enforce strict `pageSize` caps and short query timeout to mitigate enumeration and DoS attempts.
- Monitor request logs for high-frequency access; integrate edge rate limiting later if abuse detected.
- Never expose internal UUIDs unless needed (set + rarity IDs already public per schema).
- When caching, avoid storing sensitive data—only catalog payloads.

## 6. Error Handling
- Validation failures → throw typed error with code `INVALID_FILTER`; respond 400 including `details` (offending fields).
- Supabase query errors or upstream cache dependency failures → map to 503 `CATALOG_UNAVAILABLE`; surface `message` advising retry.
- Empty results are not errors; return `data: []` with 200 and `totalItems = 0`.
- Timeouts/unknown exceptions → log structured context (requestId, filters) via shared logger/helper; return 503 to avoid leaking stack traces.
- If cache write fails, log warning but proceed with fresh response to avoid user impact.
- No dedicated error table exists; rely on application logs and Supabase function logs. If future error table introduced, insert there within catch block before responding.

## 7. Performance
- Use existing indexes (`idx_cards_name_trgm`, `idx_cards_set_number`) to satisfy search + sorting.
- Limit selected columns to those needed for DTOs to reduce payload size.
- Consider memoizing allowed `types` list in memory to avoid repeated DB introspection.
- Batch price lookup via window function to prevent N+1 queries.
- Cache identical responses for 24h in `api_cache` with hashed fingerprint of normalized query params; include `expires_at` to support eviction job.
- Monitor query plan in Supabase dashboard; add composite index on `(rarity_id, number_sort)` if profiling shows filter hotspots.

## 8. Implementation Steps
1. **Scaffold route**: Create `src/pages/api/cards/index.ts`; set `export const prerender = false` and import Zod, DTO helpers, and `createErrorResponse` utility from `src/lib/utils.ts`.
2. **Define schema & types**: Add `CardsSearchQuerySchema` and inferred `CardsSearchQuery` type in a new file `src/lib/validation/cards.ts` for reuse; enforce defaults/exclusive filters.
3. **Implement service**: Add `CardCatalogService` in `src/lib/services/cardCatalog.ts` with `searchCards()` handling query composition, price join, pagination metadata, and cache lookups/writes (reuse `api_cache` helper if available, otherwise add `ApiCacheRepository`).
4. **Map DB rows → DTOs**: Create mapper functions (`mapCardRowToDTO`, `mapMarketPrice`, `buildPaginationMeta`) returning structures defined in `src/types.ts`.
5. **Wire controller**: In the API route, parse query params, call service, and return `json(response, { status: 200 })`. Catch known errors to send 400/503 responses using `ErrorResponseDTO` shape.
6. **Add tests**: Write unit tests for schema validation and service query builder (mock Supabase client). If Playwright/API tests exist, add success/invalid filter cases to guard contract.
7. **Instrumentation**: Ensure logger captures `requestId`, applied filters, result count, and cache hit/miss for observability.
8. **Docs & monitoring**: Update API reference (this plan) and, if needed, README sections describing query capabilities. Configure Supabase query statistics dashboard alert for slow queries to revisit indexes.
