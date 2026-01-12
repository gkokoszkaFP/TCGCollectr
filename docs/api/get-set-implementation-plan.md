<analysis>
1. Summary

- Endpoint: GET /api/sets/:setId — returns a single card set by its unique identifier.
- Public read-only endpoint; no authentication required.
- Returns 200 with Set resource JSON, 404 when not found.

2. Parameters

- Required path parameter: `setId` (string)
- No query parameters or request body.

3. DTOs and Command Models

- `SetDTO` — response shape (id, name, series, total_cards, release_date, logo_url, symbol_url, last_synced_at, created_at, updated_at)
- `GetSetByIdCommand` — { setId: string }

4. Service extraction

- Use the existing `src/lib/services/sets.service.ts`. Add or ensure a `getSetById(setId: string)` method that:
  - Queries Supabase `sets` table by primary key
  - Selects only the fields required by `SetDTO`
  - Returns `SetDTO | null` or throws on unexpected DB error

5. Input validation

- Validate `setId` using Zod: `z.string().min(1).regex(/^[A-Za-z0-9._-]+$/)` (allow letters, numbers, dot, underscore, dash).
- On validation failure return 400 with `VALIDATION_ERROR`.

6. Error logging

- There is no dedicated `errors` table in the current schema. Recommended approach:
  - Write structured server logs (stdout/stderr) with correlation id
  - Optionally insert a lightweight anonymized analytics event to `analytics_events` with `event_type = 'api_error'` for monitoring (avoid PII)

7. Security threats & mitigations

- Enumeration/DoS: apply rate limiting at middleware level.
- Injection: use Supabase client parameterized queries; validate `setId` strictly.
- Information leak: do not return raw DB error messages; return standardized error codes.
- Caching risk: set permissive public caching but ensure stale-if-revalidate strategy and proper `Cache-Control`.

8. Error scenarios

- 400 VALIDATION_ERROR — invalid `setId` format
- 404 NOT_FOUND — set with `setId` not found
- 500 INTERNAL_ERROR — unexpected DB/third-party error
  </analysis>

# API Endpoint Implementation Plan: GET /api/sets/:setId

## 1. Endpoint Overview

Brief description: Retrieve a single card set by its unique identifier. This is a public, read-only endpoint used by clients to display set metadata (name, series, total cards, artwork URLs, and timestamps).

## 2. Request Details

- HTTP Method: GET
- URL Structure: /api/sets/:setId
- Parameters:
  - Required: `setId` (path) — unique set identifier (string)
  - Optional: none
- Request Body: none

## 3. Used Types

- `SetDTO` (response)
  - `id`: string
  - `name`: string
  - `series`: string | null
  - `total_cards`: number
  - `release_date`: string | null (ISO date)
  - `logo_url`: string | null
  - `symbol_url`: string | null
  - `last_synced_at`: string | null (ISO datetime)
  - `created_at`: string (ISO datetime)
  - `updated_at`: string (ISO datetime)

- `GetSetByIdCommand`
  - `setId`: string

## 4. Response Details

- Success (200 OK)
  - Body: `SetDTO` JSON (see example in API spec)
- Not Found (404 NOT_FOUND)
  - Body: `{ "error": { "code": "NOT_FOUND", "details": {} } }`
- Validation Error (400 VALIDATION_ERROR)
  - Body: `{ "error": { "code": "VALIDATION_ERROR", "details": { "message": "Invalid setId" } } }`
- Server Error (500 INTERNAL_ERROR)
  - Body: `{ "error": { "code": "INTERNAL_ERROR", "details": {} } }`

Headers:

- `Cache-Control`: `public, max-age=86400, stale-while-revalidate=60` (sets are cacheable server-side and CDN for 24 hours)
- `Content-Type`: `application/json`

## 5. Data Flow

1. Client issues GET /api/sets/:setId.
2. Request passes through global middleware (`src/middleware/index.ts`) which attaches `context.locals.supabase` client.
3. Route handler validates `setId` using Zod.
4. Handler calls `setsService.getSetById(setId)`.
   - Service runs a parameterized Supabase query to `sets` table, selects required columns and uses `.single()`.
5. If a row is returned, map DB columns to `SetDTO` and return 200.
6. If no row, return 404 NOT_FOUND.
7. On DB/client error, log error and return 500.

Notes about implementation details:

- Query only the columns required by `SetDTO` to keep payloads small and use indexes (primary key lookup).
- Use `single()` to ensure a single row or `null` result, and handle `error` field returned by Supabase client.

## 6. Security Considerations

- Authentication: Not required (public read).
- Authorization: Not applicable.
- Input validation: Strict `setId` validation to prevent malformed input and limit characters.
- Rate limiting: Ensure read endpoints are rate limited globally (middleware) to mitigate enumeration and DoS.
- RLS: `sets` table is public read; ensure RLS policies allow authenticated and anon reads only for permitted columns.
- Data exposure: Do not reveal internal DB errors to clients. Return standardized error codes.

## 7. Error Handling

- Validation failure:
  - Detect via Zod validation in handler
  - Return 400 with `VALIDATION_ERROR` and details
- Not found:
  - If `getSetById` returns null -> 404 `NOT_FOUND`
- External/DB error:
  - Catch Supabase errors, log them (structured logs + optional analytics event), then return 500 `INTERNAL_ERROR`
- Unexpected mapping error:
  - Treat as 500 and include correlation id in response for support (do not include stack traces)

Example error response format (consistent across API):

```json
{
  "error": {
    "code": "NOT_FOUND",
    "details": {}
  }
}
```

## 8. Performance

- Primary-key lookup is cheap and should be fast. Ensure the `id` column is indexed (primary key).
- Select only required columns to reduce network overhead.
- Add server/edge caching (24h) with `Cache-Control` headers; invalidate or refresh when `last_synced_at` changes.
- Add metrics around endpoint latency and request count (use existing analytics or monitoring stack).

## 9. Implementation Steps

1. Add Zod validation schema
   - File: `src/lib/validation/sets.schema.ts`
   - Export `getSetParamsSchema = z.object({ setId: z.string().min(1).regex(/^[A-Za-z0-9._-]+$/) })`

2. Update or add service method
   - File: `src/lib/services/sets.service.ts`
   - Add `async function getSetById(supabase, setId: string): Promise<SetDTO | null>`
   - Implementation:
     - `const { data, error } = await supabase.from('sets').select('id,name,series,total_cards,release_date,logo_url,symbol_url,last_synced_at,created_at,updated_at').eq('id', setId).single();`
     - If `error` and `error.code !== 'PGRST116'` (or check for no_rows) then throw; if no row, return `null`.

3. Create API route file
   - File: `src/pages/api/sets/[setId].ts`
   - Use Astro Server Endpoint pattern
   - `export const prerender = false;`
   - Validate `setId` with `getSetParamsSchema`; return 400 on validation error.
   - Call `context.locals.supabase` and `setsService.getSetById`.
   - Return 200 with JSON mapped to `SetDTO` or 404.
   - Set response headers: `Cache-Control: public, max-age=86400, stale-while-revalidate=60`

4. Logging & monitoring
   - Add structured error logs with correlation id (UUID) to make debugging easier.
   - Optionally insert an `analytics_events` record for server errors with `event_type = 'api_error'` and `event_data` containing `endpoint`, `status`, `correlation_id`, and anonymized details.

5. Tests
   - Add unit tests for `sets.service.getSetById` mocking Supabase responses (success, not found, DB error).
   - Add integration test for API route returning 200 and 404.

6. Documentation
   - Save this plan as `docs/api/get-set-implementation-plan.md` (this file).
   - Update `docs/api-plan.md` reference if necessary.

7. Rollout
   - Deploy to staging, run smoke tests and verify caching headers and response shape.
   - Monitor logs and metrics for errors or elevated latency.

## Appendix — Example Handler (pseudo-code)

```ts
// src/pages/api/sets/[setId].ts
export const prerender = false;
import { getSetParamsSchema } from "@/lib/validation/sets.schema";
import { getSetById } from "@/lib/services/sets.service";

export async function get(context) {
  const { params } = context;
  const parse = getSetParamsSchema.safeParse(params);
  if (!parse.success) {
    return new Response(JSON.stringify({ error: { code: "VALIDATION_ERROR", details: {} } }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const { setId } = parse.data;
  try {
    const set = await getSetById(context.locals.supabase, setId);
    if (!set) {
      return new Response(JSON.stringify({ error: { code: "NOT_FOUND", details: {} } }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify(set), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=60",
      },
    });
  } catch (err) {
    // log err with correlation id
    return new Response(JSON.stringify({ error: { code: "INTERNAL_ERROR", details: {} } }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
```

---

End of plan.
