# API Endpoint Implementation Plan: POST /api/auth/login

## 1. Endpoint Overview

- Authenticates an existing Supabase user using email and password, issuing a fresh access/refresh token pair so the client can call subsequent protected endpoints.
- Lives under Astro API route [src/pages/api/auth/login.ts](src/pages/api/auth/login.ts) (new) and uses the shared Supabase client from `context.locals.supabase`.
- Mirrors the registration endpoint’s JSON error envelope, adds IP-based rate limiting, and records successful logins in `analytics_events` for behavioral metrics.

## 2. Request Details

- HTTP Method: POST
- URL Structure: /api/auth/login
- Headers:
  - `Content-Type: application/json`
  - `Accept: application/json`
  - `Authorization: Bearer <token>` (optional – only used to detect already-authenticated sessions if we choose to short-circuit the flow)
- Rate limiting: reuse `ensureRateLimit` from [src/lib/services/rate-limit.service.ts](src/lib/services/rate-limit.service.ts) with `limit: 5`, `windowMs: 900000`, and key template `login:${clientIp}`. Include `Retry-After` seconds when blocked.
- Request Body (validated via [src/lib/validation/auth.schema.ts](src/lib/validation/auth.schema.ts)):
  ```json
  {
    "email": "user@example.com",
    "password": "securePassword123"
  }
  ```
- Used Types:
  - `LoginRequestDTO`, `AuthResponseDTO`, `AuthUserDTO`, `AuthSessionDTO`, `ErrorResponseDTO` from [src/types.ts](src/types.ts).
  - New `LoginCommand` (email, password, ipAddress, userAgent) to be added beside `RegisterCommand` for service-level input.

## 3. Response Details

- 200 OK → `AuthResponseDTO` payload with `user` and `session` objects, headers `Cache-Control: no-store`, `Content-Type: application/json`.
- 400 BAD REQUEST → `ErrorResponseDTO` with `VALIDATION_ERROR` (malformed JSON, schema failures) or `ALREADY_AUTHENTICATED` (if we prevent redundant logins).
- 401 UNAUTHORIZED → `ErrorResponseDTO` with `INVALID_CREDENTIALS` when Supabase rejects the credentials or when MFA/disabled user status is surfaced.
- 429 TOO MANY REQUESTS → `ErrorResponseDTO` with `RATE_LIMIT_EXCEEDED`, include `Retry-After`.
- 500 INTERNAL SERVER ERROR → `ErrorResponseDTO` with `INTERNAL_ERROR` for unexpected Supabase/network failures.
- Response body never exposes if email exists, avoiding enumeration.

## 4. Data Flow

1. **Bootstrap:** Astro handler obtains `request`, `locals.supabase`, derives client IP via the same helper used in registration (inspect `x-forwarded-for`, `x-real-ip`, fallback).
2. **Rate limit:** Use `ensureRateLimit` with key `login:${ip}`; block with 429 if exhausted.
3. **Auth state check (optional):** Call `getCurrentUser(supabase)` from [src/lib/services/auth.service.ts](src/lib/services/auth.service.ts); if a user is already authenticated, either return a 200 with their session or a 400 instructing logout-first (decision documented in code comments).
4. **Parse body:** `await request.json()` inside try/catch; invalid JSON => 400 `VALIDATION_ERROR`.
5. **Validate:** Run `loginSchema.safeParse(body)`; convert field errors into `{ fields: { email: [...], password: [...] } }` metadata on the error response.
6. **Build command:** Create `LoginCommand` with normalized email/password plus `ipAddress` and optional `userAgent`.
7. **Service call:** Invoke new `loginUser(command, supabase)` which wraps `supabase.auth.signInWithPassword`. Service maps Supabase errors to `AuthErrorCodes.INVALID_CREDENTIALS`, `AuthErrorCodes.INTERNAL_ERROR`, etc., ensuring consistent DTO output.
8. **Analytics (fire-and-forget):** After successful login, asynchronously insert a `user_login` row into `analytics_events` via Supabase; hash IP with the existing `hashString` helper to avoid storing raw addresses.
9. **Respond:** Return JSON serialized `AuthResponseDTO`, set `Cache-Control: no-store` and `Vary: Origin` if needed for SSR caching hygiene.

## 5. Security Considerations

- Enforce TLS (implicit in deployment) and never log raw passwords; ensure request parsing happens server-side only.
- Rate limiting plus Supabase’s own throttling mitigate brute-force and credential stuffing.
- Keep error messages generic (`Invalid email or password`) to avoid account enumeration.
- Return tokens in body only; ensure consumers store them securely (documented separately) and mark responses as non-cacheable.
- Hash IPs before storing analytics to reduce PII exposure, and avoid writing failed login attempts to analytics to prevent leaking invalid credentials.

## 6. Error Handling

| Scenario                                  | Detection                                                                       | Status / Code                 | Response Action                                                  |
| ----------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------- | ---------------------------------------------------------------- |
| Invalid JSON / missing fields             | `request.json()` throws or schema fails                                         | 400 / `VALIDATION_ERROR`      | Include field-level details and halt before service call.        |
| Rate limit exceeded                       | `ensureRateLimit` => `allowed: false`                                           | 429 / `RATE_LIMIT_EXCEEDED`   | Return retry-after metadata, no Supabase call.                   |
| User already authenticated (if blocked)   | `getCurrentUser` returns id                                                     | 400 / `ALREADY_AUTHENTICATED` | Advise logout-first to avoid mixed sessions.                     |
| Invalid credentials / disabled account    | `supabase.auth.signInWithPassword` error containing `Invalid login credentials` | 401 / `INVALID_CREDENTIALS`   | Mask specifics; do not log payload.                              |
| Supabase outage or missing session fields | Service detects missing `data.user` or `data.session`                           | 500 / `INTERNAL_ERROR`        | Include minimal diagnostics (`originalError`) for observability. |
| Analytics insert failure                  | `trackLoginEvent` rejected promise                                              | No status impact              | Log to console.debug; request already resolved.                  |

## 7. Performance

- Single Supabase auth call plus one non-blocking analytics insert ensures low latency.
- Reuse helper functions to avoid re-computing IP hashing logic; consider caching rate-limit buckets via existing in-memory map.
- Ensure handler streams minimal data (just JSON) and disables Astro SSR caching via `Cache-Control: no-store`.
- Future production deployments can swap in Redis-backed rate limiting without code changes due to `ensureRateLimit` abstraction.

## 8. Implementation Steps

1. **Define `LoginCommand`:** Add interface alongside `RegisterCommand` in [src/types.ts](src/types.ts) with email, password, ipAddress, userAgent?.
2. **Extend auth service:** In [src/lib/services/auth.service.ts](src/lib/services/auth.service.ts), implement `loginUser(command, supabase)` mirroring `registerUser` structure (call `supabase.auth.signInWithPassword`, normalize errors to `AuthErrorCodes.INVALID_CREDENTIALS`, validate presence of `data.session`).
3. **Shared helpers:** Optionally extract `getClientIp` and `createErrorResponse` into a small local utility module reused by both auth endpoints, or duplicate within the new route for now while noting the TODO.
4. **Create route handler:** Add [src/pages/api/auth/login.ts](src/pages/api/auth/login.ts) with `export const prerender = false`, rate limiting, JSON parsing, schema validation, command creation, service invocation, analytics tracking, and consistent headers.
5. **Analytics tracking:** Reuse `hashString` helper from the register route (extract to reusable utility if duplication becomes awkward) and insert `user_login` events with anonymized metadata.
6. **Testing & validation:** Manually (or via automated tests) verify scenarios: successful login, validation failure, invalid credentials, and rate limit exhaustion. Confirm error envelopes match spec and Supabase session data returns as expected.
