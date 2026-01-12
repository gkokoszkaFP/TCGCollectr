<analysis>
1. Summary of API specification

- Endpoint: `GET /api/sets` — returns paginated list of card sets.
- Supports query params: `page`, `limit`, `sort`, `order`, `search`, `series`.
- Default pagination: page=1, limit=20, maximum limit 100.

2. Required and optional parameters

- Required: none.
- Optional query parameters:
  - `page` (integer, >=1)
  - `limit` (integer, 1..100)
  - `sort` (one of `name`, `release_date`, `series`)
  - `order` (`asc` or `desc`)
  - `search` (string, partial match against set name)
  - `series` (string, exact match)

3. DTOs and Command Models

- `GetSetsQuery` DTO for validated query params.
- `SetListItemDTO` for each set in `data` array (id, name, series, total_cards, release_date, logo_url, symbol_url).
- `PaginationDTO` for pagination meta (page, limit, total_items, total_pages).

4. Service extraction

- Implement (or reuse) a `sets.service.ts` in `src/lib/services/` exposing `listSets(params)` that accepts validated query and returns `{data, pagination}`.
- Service responsibilities: build SQL query, apply filters, sort, paginate, fetch total count, map DB fields to DTOs.

5. Input validation

- Use Zod schema `GetSetsQuerySchema` in `src/lib/validation/sets.schema.ts`.
- Validate types, ranges, enum values; coerce numeric strings to numbers where appropriate.
- Enforce `limit` <= 100 and `page` >= 1, `order` lowercased to `asc|desc`.

6. Error logging

- No specific `errors` table exists in schema. Log server-side errors to structured logs and a monitoring system (Sentry) where available.
- Validation errors return 400 with `VALIDATION_ERROR` code and are not stored.

7. Security threats

- SQL injection: mitigate by using parameterized queries via Supabase client and query builder.
- Excessive paging (high offsets): potential DoS; enforce `limit` cap and apply rate limiting for search endpoints.
- Information exposure: sets are public so no auth needed; ensure fields returned are only those intended.

8. Error scenarios and status codes

- Invalid query params → 400 `VALIDATION_ERROR`.
- Invalid sort/order values → 400 `VALIDATION_ERROR`.
- Unexpected server error (DB down, query error) → 500 `INTERNAL_ERROR`.
  </analysis>

# API Endpoint Implementation Plan: GET /api/sets

## 1. Endpoint Overview

- Purpose: Return a paginated, filterable list of available card sets for browsing and search UI.
- Public endpoint: no authentication required.
- **MVP Seeding Strategy**: Follows on-demand seed-on-read pattern (see `docs/prd.md` "MVP Data Sync Strategy" and `docs/api-plan.md` "Addendum: On-demand seeding behavior").
- **Required Environment Variables**:
  - `SUPABASE_URL` — Supabase project URL
  - `SUPABASE_KEY` — Supabase anon/public key (for reads)
  - `SUPABASE_SERVICE_KEY` — Supabase service role key (server-only, for upserts)
  - `TCGDEX_URL` — TCGDex API base URL (e.g., `https://api.tcgdex.net/v2/en`)

## 2. Request Details

- HTTP Method: GET
- URL Structure: `/api/sets`
- Parameters:
  - Required: none
  - Optional:
    - `page` (integer, default: 1) — 1-indexed page number
    - `limit` (integer, default: 20, max: 100) — items per page
    - `sort` (string, default: `name`) — allowed: `name`, `release_date`, `series`
    - `order` (string, default: `asc`) — allowed: `asc`, `desc`
    - `search` (string) — partial, case-insensitive filter against set `name`
    - `series` (string) — exact match filter on `series`
- Request Body: none

## 3. Used Types

- `GetSetsQuery` (DTO) — shape after validation:
  - `page: number`, `limit: number`, `sort: 'name'|'release_date'|'series'`, `order: 'asc'|'desc'`, `search?: string`, `series?: string`
- `SetListItemDTO` — `{ id: string, name: string, series: string, total_cards: number, release_date: string, logo_url?: string, symbol_url?: string }`
- `PaginationDTO` — `{ page: number, limit: number, total_items: number, total_pages: number }`

## 4. Response Details

- Success (200 OK):

```json
{
  "data": [
    /* SetListItemDTO[] */
  ],
  "pagination": {
    /* PaginationDTO */
  }
}
```

- Error responses:
  - 400 `VALIDATION_ERROR` — invalid query params
  - 500 `INTERNAL_ERROR` — unexpected server error

Response headers:

- `Cache-Control` may be set to a short public TTL (e.g., `public, max-age=60`) to reduce load for repeated requests.

## 5. Data Flow

1. Incoming request hits `src/pages/api/sets.ts` (Astro server endpoint).
2. Endpoint extracts query params and runs them through `GetSetsQuerySchema` (Zod) for validation and coercion.
3. **On-demand seeding check** (MVP pattern):
   - Query total count from `sets` table using `context.locals.supabase` (anon client).
   - If count is 0 (empty DB), trigger bulk seed:
     a) Fetch all sets from TCGDex API (`GET {TCGDEX_URL}/sets`).
     b) Map TCGDex response to DB row format (id, name, series, total_cards, release_date, logo_url, symbol_url, last_synced_at).
     c) Upsert all sets into `sets` table using service-role client (`SUPABASE_SERVICE_KEY`).
     d) Log seeding event (count of sets inserted).
   - If TCGDex fetch fails, return 500 `INTERNAL_ERROR` (cannot serve empty data).
4. Call `setsService.listSets(validatedParams)` which:
   - Builds SQL with parameterized values:
     - WHERE clauses for `search` (ILIKE %search%) and `series` (exact match).
     - ORDER BY mapped `sort` to DB column (e.g., `name`, `release_date`, `series`).
     - LIMIT = `limit`, OFFSET = `(page - 1) * limit`.
   - Executes two queries (recommended for clarity):
     a) `SELECT COUNT(1) FROM sets WHERE ...` → `total_items`.
     b) `SELECT id, name, series, total_cards, release_date, logo_url, symbol_url FROM sets WHERE ... ORDER BY ... LIMIT ... OFFSET ...` → rows.
   - Map DB rows to `SetListItemDTO`.
   - Compute `total_pages = Math.ceil(total_items / limit)`.
5. Endpoint returns `{ data, pagination }` with status 200.

Notes on DB access:

- Use Supabase client from `context.locals.supabase` per `astro.instructions.md`.
- Prefer parameterized queries via Supabase's query builder or raw SQL with bindings to avoid injection.

## 6. Security Considerations

- Authentication: not required (public read).
- Authorization: none needed for sets data.
- Input validation: strict Zod validation to avoid invalid values and to coerce types.
- SQL injection: parameterized queries and no direct string concatenation.
- Rate limiting: ensure middleware applies search rate limits (see `rate-limit.service.ts`). Critical for seeding path to prevent abuse.
- Caching: add short public caching headers to reduce load; ensure not to cache personalized content.
- **Service key protection**: `SUPABASE_SERVICE_KEY` must remain server-only. Never import or expose in client bundles. Use only in Astro server endpoints.
- **TCGDex upstream protection**: Rate-limit the seeding path to avoid hammering TCGDex API. Consider a simple in-memory flag to prevent concurrent bulk seeds.

## 7. Error Handling

- Validation errors:
  - Cause: bad `page`, `limit`, invalid `sort` or `order` value
  - Response: 400, body `{ "error": { "code": "VALIDATION_ERROR", "details": { ... } } }`

- Not found: not applicable — empty `data` array returned for no matches (after seeding attempt).

- Database / unexpected error:
  - Response: 500, body `{ "error": { "code": "INTERNAL_ERROR" } }`
  - Action: log error with request context (query params) to server logs and error monitoring.

- TCGDex fetch failure (during seeding):
  - Cause: TCGDex API unavailable, rate-limited, or returns unexpected response.
  - Response: 500, body `{ "error": { "code": "INTERNAL_ERROR", "details": { "message": "Unable to fetch sets data" } } }`
  - Action: log upstream error details; do not expose raw TCGDex errors to client.

## 8. Performance

- Pagination strategy: offset pagination with LIMIT/OFFSET is acceptable for sets (relatively small dataset). If dataset grows, consider keyset pagination.
- Indexing: ensure indexes on columns used in filters/sorts, e.g., `name` (text pattern index if many searches), `series`, and `release_date`.
- Count query optimization: if `sets` table is large, consider approximate counts or caching total_items for common queries.
- Caching: short TTL HTTP caching and CDN caching for public responses.

## 9. Implementation Steps

1. Add validation schema `src/lib/validation/sets.schema.ts` with Zod:
   - `page: z.coerce.number().int().min(1).default(1)`
   - `limit: z.coerce.number().int().min(1).max(100).default(20)`
   - `sort: z.enum(['name','release_date','series']).default('name')`
   - `order: z.enum(['asc','desc']).default('asc')`
   - `search: z.string().optional()`
   - `series: z.string().optional()`

2. Add TCGDex sync helper `src/lib/services/tcgdex-sync.service.ts`:
   - Export `async seedAllSets(supabaseServiceClient)` that:
     a) Fetches `GET {TCGDEX_URL}/sets` and maps response to DB row format.
     b) Upserts all sets into `sets` table with `onConflict: 'id'`.
     c) Sets `last_synced_at` to current timestamp.
     d) Returns count of upserted rows.
   - Keep this file server-only (no client imports).

3. Add service `src/lib/services/sets.service.ts` with `async listSets(params, supabase)`:
   - Build parameterized queries as described in Data Flow.
   - Use `context.locals.supabase` (Astro middleware) when called from endpoint.

4. Implement endpoint `src/pages/api/sets.ts`:
   - `export const prerender = false;` per Astro API rules.
   - Parse `context.request.url` query params via `new URL(request.url)` and `Object.fromEntries()`.
   - Validate using `GetSetsQuerySchema.parse()` and handle Zod errors with 400 response.
   - **On-demand seeding**: Check if `sets` table is empty; if so, create service-role client and call `seedAllSets()`.
   - Call `setsService.listSets()` and return JSON response with 200.
   - Set `Cache-Control: public, max-age=60, stale-while-revalidate=30` header.

5. Add unit tests for validation and service SQL generation (Jest):
   - Test `limit` caps, `page` coercion, invalid `sort`/`order`.
   - Test `search` and `series` filters produce correct WHERE clauses (mock supabase client).

6. Add integration test for endpoint returning expected shape and pagination meta.

7. Ensure `supabase/migrations` includes indexes used by sorts/filters; if missing, add migration to create indexes on `series` and `release_date`.

8. Monitoring and logging:
   - Hook errors to existing logging/monitoring (Sentry) and add structured logs including sanitized query params.

9. Documentation:
   - Update API docs (`docs/api-plan.md`) if any contract fields change.

## Example SQL (parameterized)

-- Count
SELECT count(1) as total_items
FROM sets
WHERE ($1::text IS NULL OR name ILIKE '%' || $1 || '%')
AND ($2::text IS NULL OR series = $2);

-- Rows
SELECT id, name, series, total*cards, release_date, logo_url, symbol_url
FROM sets
WHERE ($1::text IS NULL OR name ILIKE '%' || $1 || '%')
AND ($2::text IS NULL OR series = $2)
ORDER BY /* mapped sort column _/ $3 /_ direction \_/
LIMIT $4 OFFSET $5;

Replace `$1..$5` with bound parameters: `search`, `series`, mapped `sort` expression (safe mapping, not direct substitution), `limit`, `offset`.

---

If you want, I can now implement the `sets` service and endpoint files, add the Zod schema, and run tests — tell me which to start first.
