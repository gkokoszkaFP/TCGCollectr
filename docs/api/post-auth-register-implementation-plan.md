# API Endpoint Implementation Plan: POST /api/auth/register

## 1. Endpoint Overview

- Create a Supabase-backed registration endpoint that provisions a new auth user, ensures the linked `profiles` row is created by existing trigger logic, and returns the normalized user and session payload expected by the client.
- Enforce validation, rate limiting, and structured error responses so clients receive deterministic feedback for invalid credentials, duplicate accounts, or infrastructure issues.

## 2. Request Details

- HTTP Method: POST
- URL Structure: `/api/auth/register`
- Headers: `Content-Type: application/json`
- Required Parameters (request body):
  - `email` — string, must satisfy `z.string().trim().email().max(254)` and be normalized to lowercase before persistence.
  - `password` — string, must satisfy `z.string().min(12).max(72)` and include at least one uppercase letter, one lowercase letter, one digit, and one symbol to meet project security baselines.
- Optional Parameters: none (future-safe schema should strip unknown keys).
- Request Body Schema (`RegisterRequestDTO`):

```json
{
  "email": "user@example.com",
  "password": "securePassword123!"
}
```

- Validation Strategy: define `registerSchema` with Zod inside `src/lib/validation/auth.schema.ts`; reuse in tests and route to avoid divergence.

## 3. Used Types

- `RegisterRequestDTO` — inbound payload contract.
- `AuthUserDTO` / `AuthSessionDTO` — components of the happy-path response.
- `AuthResponseDTO` — wrapper returned on success.
- `ErrorResponseDTO` — standardized error envelope with `code`, `message`, and optional `details`.
- Command Model: `RegisterCommand` (new) encapsulating `email`, `password`, and contextual metadata such as `ipAddress` for rate limiting and analytics logging; lives beside the service implementation.

## 4. Response Details

- 201 Created — returns `AuthResponseDTO` with `user` (id, email) and `session` (access token, refresh token, expiry). No PII beyond email should be echoed.
- 400 Bad Request — `ErrorResponseDTO` with codes like `VALIDATION_ERROR` when Zod parsing fails or Supabase rejects weak passwords.
- 401 Unauthorized — not expected for registration but reserved if future middleware requires anonymous-only access and a logged-in user hits the route.
- 409 Conflict — `ErrorResponseDTO` with `EMAIL_EXISTS` when Supabase reports that the email is already registered.
- 429 Too Many Requests — `ErrorResponseDTO` with `RATE_LIMIT_EXCEEDED` when the per-IP limit is surpassed.
- 500 Internal Server Error — `ErrorResponseDTO` with `INTERNAL_ERROR` for unhandled Supabase or network failures (tokens never included in error payloads).

## 5. Data Flow

1. Astro server receives POST request; endpoint exports `prerender = false` and `export const POST` in `src/pages/api/auth/register.ts`.
2. Apply a lightweight IP-based rate limiter (e.g., token bucket stored in KV/edge cache or in-memory fallback for dev) using helper `ensureRateLimit({ key: ip, limit, window })`; fail fast with 429 if exceeded.
3. Parse JSON body with `await request.json()` and validate via `registerSchema.safeParse`. On failure, return 400 with detailed field errors in `details`.
4. Build a `RegisterCommand` (normalized email, raw password, requester IP, user agent).
5. Call `AuthService.registerUser(command)` (new module under `src/lib/services/auth.service.ts`) which wraps `context.locals.supabase.auth.signUp({ email, password })`, handles Supabase error normalization, and maps the response to DTOs.
6. On success, service waits for Supabase trigger `create_profile_on_user_registration` to insert `profiles` entry (no manual insert required) and returns the `user` + `session` pair.
7. Endpoint optionally records a `user_registered` analytics event via `context.locals.supabase.from("analytics_events")` with anonymized metadata (ip hash, user agent) to support funnel tracking.
8. Respond with 201 and JSON body conforming to `AuthResponseDTO`. Suppress sensitive headers and ensure `Cache-Control: no-store`.

## 6. Security Considerations

- **Authentication Context**: Endpoint must be accessible without an existing session; guard against logged-in users attempting to re-register by short-circuiting with 400 if `context.locals.supabase.auth.getUser()` already returns a user.
- **Password Handling**: Never log plaintext passwords; rely on Supabase Auth hashing. Enforce strong password schema before sending to Supabase to reduce error churn.
- **Rate Limiting & Abuse Prevention**: Enforce per-IP and optional per-email limits to mitigate credential stuffing or automated signups. Consider storing rate-limit counters in durable storage when deployed (e.g., Redis/Upstash) and fall back to in-memory for local dev.
- **Email Normalization**: Lowercase and trim the email to prevent duplicate accounts differing only by case.
- **Transport Security**: Ensure the endpoint is only served over HTTPS; reject `http` origins in production deployments via Astro middleware.
- **Token Exposure**: Strip tokens from logs and never echo refresh/access tokens beyond the response body. Encourage clients to store tokens securely (e.g., httpOnly cookies handled elsewhere).
- **CORS/CSRF**: Lock CORS origins to trusted frontends via Astro middleware and require `POST` with JSON to reduce CSRF risk.

## 7. Error Handling

- Validation errors: return 400 with `code: "VALIDATION_ERROR"` and include `details` array describing fields (email, password) to assist UI.
- Supabase weak password errors: Supabase returns `400` with message; map to 400 and surface sanitized message.
- Email already registered: Supabase error code `AuthApiError` with status 400; inspect message or code to map to 409 `EMAIL_EXISTS`.
- Rate limit exceeded: return 429 `RATE_LIMIT_EXCEEDED` and include `retryAfter` seconds in `details` for UI throttling.
- Unexpected Supabase/network failure: log via `console.error` (or centralized logger) with request correlation ID, then return 500 `INTERNAL_ERROR`.
- Error Logging: there is no dedicated error table; rely on server logs/observability stack. Only successful registrations should emit analytics events to avoid polluting telemetry with failures.

## 8. Performance Considerations

- Registration is I/O bound on Supabase Auth; keep handler lean (one auth call + optional analytics insert) to minimize latency.
- Rate limiter must be non-blocking; prefer pre-initialized singleton rather than instantiating per request.
- Avoid expensive hashing or duplicate database calls; Supabase already hashes passwords and triggers profile creation.
- Ensure analytics insert is non-blocking (fire-and-forget or awaited with timeout) to prevent slowing the happy path; wrap in try/catch and ignore failures.

## 9. Implementation Steps

1. **Validation Schema**: Add `registerSchema` in `src/lib/validation/auth.schema.ts` exporting both schema and inferred TypeScript type; include reusable password regex helper.
2. **Rate Limiter Utility**: Implement `ensureRateLimit` helper in `src/lib/services/rate-limit.service.ts` (or extend existing util) supporting sliding window counters keyed by IP + route.
3. **Auth Service**: Create `src/lib/services/auth.service.ts` with `registerUser(command: RegisterCommand, supabase: SupabaseClient)` that calls `supabase.auth.signUp`, normalizes errors, and maps results to DTOs.
4. **API Route**: Implement `src/pages/api/auth/register.ts` with `export const prerender = false` and `export async function POST(context)` using the schema, rate limiter, and service; ensure all returns follow `ErrorResponseDTO`/`AuthResponseDTO`.
5. **Analytics Hook**: Inside the route (post-success), insert a `user_registered` record into `analytics_events` capturing minimal metadata; failure should not change response.
6. **Logging**: Standardize structured logging for failures (include `requestId`, `ip`, `supabaseError.code`); keep out secrets.
7. **Tests**: Add unit tests for `registerSchema`, `AuthService.registerUser`, and any error-mapping helpers (mock Supabase client). Add integration test for the API route using a mocked Supabase client to cover 201, 400, 409, and 429 responses.
8. **Documentation & Monitoring**: Update API docs (this file) and, if applicable, postman/openapi definitions. Configure alerting for spikes in 429/500 responses once deployed.
