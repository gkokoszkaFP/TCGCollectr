# API Endpoint Implementation Plan: GET /api/profile

## 1. Endpoint Overview

Retrieve the authenticated user's profile including onboarding status, favorites, aggregated card count, and timestamps.

## 2. Request Details

- HTTP Method: GET
- URL: `/api/profile`
- Headers:
  - Required: `Authorization: Bearer <access_token>`
- Path Params: none
- Query Params: none
- Request Body: none

## 3. Request/Response Types

- DTOs
  - `ProfileDTO`: `{ id: string; onboarding_completed: boolean; favorite_type?: string | null; favorite_set?: string | null; total_cards_count: number; created_at: string; updated_at: string; }`
  - `ErrorResponse`: `{ error: { code: string; message: string; details?: Record<string, unknown> } }`
- Command models: none (read-only endpoint)

## 4. Response Details

- 200 OK: `ProfileDTO`
- 401 UNAUTHORIZED: missing or invalid bearer token
- 404 NOT_FOUND: profile row not found for user
- 500 INTERNAL_ERROR: unhandled server or Supabase failure
- Headers: `Content-Type: application/json`; add `Cache-Control: no-store` to prevent caching sensitive data

## 5. Data Flow

1. Middleware injects `supabase` into `context.locals`.
2. Validate presence of Authorization header; call `supabase.auth.getUser()`.
3. If auth error or no user, return 401.
4. Fetch profile by `id = user.id` from `profiles` table.
5. Fetch `total_cards_count` via aggregate `sum(quantity)` on `user_cards` filtered by `user_id`.
   - Prefer single query using Postgres RPC/view or CTE; fallback to two Supabase queries if needed.
6. If profile missing, return 404.
7. Shape data into `ProfileDTO` and return 200 with no-store header.

## 6. Security Considerations

- Enforce bearer token via `supabase.auth.getUser()`; do not rely solely on header presence.
- RLS on `profiles` and `user_cards` must restrict rows to owner; keep filters by `user_id`.
- Do not expose service_role; use server-side `context.locals.supabase`.
- Avoid caching: set `Cache-Control: no-store`.
- Minimal surface (no body/query); still validate header format to reduce misuse.

## 7. Error Handling

- 401: missing Authorization header, invalid token, or auth error.
- 404: profile not found.
- 500: Supabase query error or unexpected exception; log with context (user id when available) and return generic error payload.
- Consistent payload: `{ "error": { "code": "UNAUTHORIZED|NOT_FOUND|INTERNAL_ERROR", "message": "..." } }`.

## 8. Performance Considerations

- Prefer single SQL call (RPC/view) to retrieve profile plus card count to reduce latency.
- Ensure indexes: `profiles.id` (PK) and `user_cards.user_id` (existing by design).
- Small payload; no pagination; avoid N+1 queries.

## 9. Implementation Steps

1. Ensure `ProfileDTO` exists in `src/types.ts`; add if missing.
2. Add service `src/lib/services/profile.service.ts`:
   - `getProfileWithTotals(supabase, userId): Promise<ProfileDTO | null>`
   - Implement aggregate card count via RPC/view or two-step query; map to DTO; handle and propagate errors.
3. Create API route `src/pages/api/profile.ts`:
   - `export const prerender = false;`
   - Get supabase from `context.locals`; authenticate via `auth.getUser()`; return 401 on failure.
   - Call service; if null → 404; else return 200 with JSON and `Cache-Control: no-store`.
   - Catch exceptions; log; return 500 with standard error payload.
4. Optional: add RPC/view in Supabase migrations to join profile with aggregated `user_cards` for single call (if not already present).
5. Testing (future): unit-test service with mocked Supabase client; integration test API route for 401/404/200 paths.
