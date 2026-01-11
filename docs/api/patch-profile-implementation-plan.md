# API Endpoint Implementation Plan: PATCH /api/profile

## 1. Endpoint Overview

Patch allows the authenticated user to mutate their own profile fields such as onboarding completion, favorite Pokémon type, or preferred set without creating new resources. The endpoint keeps auditing fields (`updated_at`) in sync and returns the full `ProfileDTO` payload along with the denormalized `total_cards_count`.

## 2. Request Details

- HTTP Method: PATCH
- URL: `/api/profile`
- Headers:
  - Required: `Authorization: Bearer <access_token>`
  - Optional: standard `Content-Type: application/json`
- Parameters: none (all inputs live in the body)
- Request Body:
  ```json
  {
    "onboarding_completed": true,
    "favorite_type": "water",
    "favorite_set": "sv05"
  }
  ```

  - Validation schema (new `UpdateProfileRequestDTO`/`updateProfileSchema`):
    - `onboarding_completed` &ndash; optional boolean flag
    - `favorite_type` &ndash; optional string that must match one of the canonical Pokémon TCG types (`fire`, `water`, `grass`, `lightning`, `psychic`, `fighting`, `darkness`, `metal`, `fairy`, `dragon`, `colorless`, `unknown`) or `null`
    - `favorite_set` &ndash; optional trimmed string that must match an existing `sets.id` or `null`
    - `refine` to require at least one updatable field (`onboarding_completed`, `favorite_type`, or `favorite_set`) so empty payloads return 400 with `VALIDATION_ERROR`
    - Additional guard: disallow non-JSON payloads by checking `request.json()` success and returning 400 for parse errors.

## 3. Response Details

- DTOs in play:
  - `UpdateProfileRequestDTO` (input)
  - `ProfileDTO` (output, derived from `Tables<'profiles'>`)
  - `ErrorResponseDTO` for structured errors
- Success response (200): updated `ProfileDTO` showing every column including recalculated `total_cards_count`, `created_at`, and `updated_at` timestamps.
- Error responses:
  - 400 `VALIDATION_ERROR` when body fails validation, favorite type is not one of the allowed values, `favorite_set` refers to a nonexistent set, or no fields were supplied.
  - 401 `UNAUTHORIZED` when auth header missing, malformed, or token invalid/expired.
  - 404 `NOT_FOUND` when there is no profile row for the authenticated user.
  - 500 `INTERNAL_ERROR` for unexpected Supabase failures; the payload should omit internal stack traces and include a generic message plus structured details for observability tools.
- Headers: respond with `Content-Type: application/json` and `Cache-Control: no-store` to keep profile data from being cached.

## 4. Data Flow

1. Middleware ensures `context.locals.supabase` exists (Supabase client bound to request).
2. `PATCH` handler parses the `Authorization` header and calls `supabase.auth.getUser()` (mirrors the existing GET logic) to retrieve the authenticated user ID; return 401 if verification fails.
3. Parse and validate the JSON body against `updateProfileSchema`; reject invalid payloads (including favorite type/set validation) with a structured 400 error.
4. If `favorite_set` is provided and not `null`, run `supabase.from('sets').select('id').eq('id', favorite_set).maybeSingle()` to confirm the set exists; if absent, emit 400 `VALIDATION_ERROR` referencing `favorite_set`.
5. Call a new service method such as `updateProfile(supabase, userId, validatedPayload)`:
   - Build a PATCH payload containing only provided keys and explicitly set `null` for fields set to `null`.
   - Execute `supabase.from('profiles').update(payload).eq('id', userId).select('*').single()` so Supabase returns the updated row and honors RLS.
   - Handle `PGRST116` (no row) by returning `null`, which the handler maps to 404.
   - On success, rehydrate `total_cards_count` by invoking the existing `getProfileWithTotals` helper (or by summing `user_cards` inside the same service) to ensure the denormalized counter reflects the latest state.
6. Handler returns 200 with the updated `ProfileDTO`; for consistent formatting reuse `createErrorResponse` for errors and set cache-control header on success/400 responses.

## 5. Security Considerations

- Authorization:
  - Enforce bearer token parsing/format verification (`parseBearerToken` helper or inline logic) before touching Supabase.
  - Avoid using the service role key; rely on `context.locals.supabase` created via middleware.
- RLS:
  - `profiles` table already enforces per-user updates; the query filters on `id = user.id`.
  - When reading from `sets`, use SELECT only to confirm existence without exposing sensitive data.
- Input hardening:
  - `favorite_type` is validated against a closed list to prevent arbitrary string injection.
  - `favorite_set` is constrained to existing IDs, stopping attackers from referencing unrelated rows.
  - `onboarding_completed` is strictly boolean to avoid SQL injection via type coercion.
- Logging:
  - Log failed payloads/auth attempts via structured `console.error` (include `userId`, `favorite_set` value, request ID if available) since there is no dedicated error table; observability pipeline will pick up these logs.
- Headers:
  - `Cache-Control: no-store` on both success and error responses to keep sensitive profile data client-specific.

## 6. Error Handling

- Invalid JSON input & missing fields → 400 `VALIDATION_ERROR`; respond with details about which field failed `updateProfileSchema`.
- `favorite_type` not in allowed set → 400 `VALIDATION_ERROR` referencing the invalid type.
- `favorite_set` supplied but not found → 400 `VALIDATION_ERROR` referencing the missing set ID.
- No updatable fields supplied → 400 `VALIDATION_ERROR` explaining that at least one of `onboarding_completed`, `favorite_type`, or `favorite_set` is required.
- Missing/malformed Authorization header → 401 `UNAUTHORIZED` with message guiding the client to include `Bearer <token>`.
- Auth token invalid/expired → 401 `UNAUTHORIZED` (propagated from `supabase.auth.getUser()`).
- Profile row absent even after auth → 404 `NOT_FOUND` with message `Profile not found for authenticated user`.
- Supabase update/query failure → 500 `INTERNAL_ERROR` with sanitized details; propagate as `ProfileServiceError` to keep handler logic uniform.

## 7. Performance

- Update touches only the `profiles` row for the authenticated user; index on `id` guarantees constant-time lookups.
- Validating `favorite_set` incurs one extra indexed lookup on `sets.id`; acceptable because plan will hit cache/new set exact match and the table is small.
- Recomputing `total_cards_count` reuses existing aggregation logic; if it becomes expensive, consider materializing the count in a view or using the denormalized `total_cards_count` field directly instead of running the aggregate.
- Response payload remains compact (single profile row) and uses `Cache-Control: no-store` to minimize client caching issues.

## 8. Implementation Steps

1. **Validation layer**
   - Create `src/lib/validation/profile.schema.ts` (or extend existing module) with `updateProfileSchema`:
     - Define `favoriteTypeEnum` and accept `null` (or undefined). Normalize strings to lowercase.
     - Use `.refine(payload => Object.keys(payload).length > 0)` to ensure at least one field is present.
     - Export `UpdateProfileSchema` type for handler inference.
2. **Service logic**
   - Extend `src/lib/services/profile.service.ts` with `updateProfile(supabase, userId, payload)`:
     - Extract only provided keys, explicitly allow `null` values, and run `supabase.from('profiles').update(payload)`.
     - Before updating, if `favorite_set` is a string, verify set exists via `sets.id` and throw a `ProfileServiceError` with code `VALIDATION_ERROR` if not.
     - Handle Supabase errors by throwing `ProfileServiceError` (e.g., `INTERNAL_ERROR`) so the handler can translate them into HTTP responses.
     - After update, call `getProfileWithTotals` (existing helper) to return the DTO with refreshed `total_cards_count`.
3. **API route**
   - In `src/pages/api/profile.ts`, add a `PATCH` export:
     - Reuse authorization logic from `GET` (consider factoring into a helper to avoid duplication).
     - Parse JSON body safely; run `updateProfileSchema.safeParse` to guard inputs.
     - Call `updateProfile` with validated payload and handle `null` (profile not found) vs. DTO.
     - Return 200 with `Cache-Control: no-store` and the DTO; use `createErrorResponse` for all error paths.
4. **Observability & tooling**
   - Ensure errors thrown from the service include context (`userId`, attempted values) and log them via `console.error` before sending responses.
   - Add unit/integration tests for:
     - Validation (bad favorite_type or favorite_set)
     - Successful update (partial fields, clearing favorite_set)
     - Authentication failure/ profile missing.
   - Update OpenAPI/Docs if maintained elsewhere (e.g., README or API docs) to reflect PATCH semantics and error table.
