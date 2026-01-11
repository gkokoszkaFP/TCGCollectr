# API Endpoint Implementation Plan: POST /api/auth/update-password

## 1. Endpoint Overview

Update a user's password using the Supabase password reset (recovery) token delivered via email. Endpoint accepts the recovery access token in the `Authorization` header and a new password in the body, validates strength, and updates the password through Supabase Auth. Responds with a success message on completion.

## 2. Request Details

- HTTP Method: POST
- URL: /api/auth/update-password
- Headers:
  - Authorization: Bearer <access_token> (recovery token from Supabase email link)
  - Content-Type: application/json
- Body:
  - `{ "password": "string" }`
- Validation (reuse `updatePasswordSchema` from [src/lib/validation/auth.schema.ts](src/lib/validation/auth.schema.ts)):
  - Required `password` string, length 12-72, must include uppercase, lowercase, digit, and symbol.
- DTOs / Commands:
  - Request DTO: `UpdatePasswordRequestDTO` (new password).
  - No additional command model needed; derive payload after validation.

## 3. Response Details

- 200: `{ "message": "Password updated successfully" }`
- 400: Validation failure (missing/malformed JSON or password policy violation).
- 401: Token invalid or expired (Supabase rejects recovery token).
- 500: Unexpected server or Supabase error.
- Headers: `Content-Type: application/json`, `Cache-Control: no-store`.

## 4. Data Flow

1. Mark route `prerender = false`.
2. Extract `Authorization` header; ensure `Bearer <token>` format. If missing/malformed, return 400 `VALIDATION_ERROR`.
3. Parse JSON body safely; on parse failure return 400 `VALIDATION_ERROR` with details.
4. Validate body against `updatePasswordSchema`; map field errors to standard error response.
5. Set Supabase auth session with the recovery token (e.g., `supabase.auth.setSession({ access_token: token, refresh_token: token })`) so subsequent auth calls use the provided token. If session setup fails, return 401 `UNAUTHORIZED`.
6. Optionally call `supabase.auth.getUser(token)` to confirm token validity and extract `user.id`; failure yields 401.
7. Call `supabase.auth.updateUser({ password })` to perform the password update under the recovery session. On Supabase error, map messages containing "expired", "invalid", or "not allowed" to 401; otherwise map to 500 with generic message.
8. Return 200 success payload. Consider fire-and-forget analytics event `password_reset_completed` if added later (non-blocking).

## 5. Security Considerations

- Require and validate Bearer token; do not proceed without it.
- Do not echo token or raw Supabase errors; use generic messages.
- Enforce strong password policy via shared schema to avoid weaker inputs.
- Set `Cache-Control: no-store` to prevent caching of auth responses.
- Log only masked/contextual data on errors (no tokens/passwords). Use console error for now, or future logging sink.
- Keep endpoint available only over HTTPS in production (handled by platform).

## 6. Error Handling

- Invalid/missing Authorization header → 400 `VALIDATION_ERROR` with guidance.
- Invalid JSON body → 400 `VALIDATION_ERROR`.
- Password fails schema → 400 `VALIDATION_ERROR` with field errors.
- Supabase rejects token (expired/invalid) → 401 `UNAUTHORIZED`.
- Supabase rejects update for other reasons → 500 `INTERNAL_ERROR` with generic message.
- Wrap unexpected exceptions → 500 with standard error envelope; log server-side.

## 7. Performance

- Lightweight operation (single Supabase call). No DB table access.
- No caching; explicit `no-store` header.
- No heavy CPU work; no pagination or IO loops. Rate limiting optional but not mandated by spec (can reuse `ensureRateLimit` if desired).

## 8. Implementation Steps

1. Create handler at `src/pages/api/auth/update-password.ts`; export `prerender = false`.
2. Read and validate `Authorization` header; extract bearer token or return 400.
3. Parse `request.json()` safely; on failure return 400.
4. Validate body with `updatePasswordSchema`; map errors to standard error response helper (`createErrorResponse`).
5. Set Supabase session with the recovery token and verify using `auth.getUser(token)`; on failure return 401.
6. Call `supabase.auth.updateUser({ password })`; map Supabase errors to 401 (invalid/expired token) or 500 (other).
7. Return 200 JSON success message with `Cache-Control: no-store`.
8. Add minimal logging for unexpected errors (mask sensitive fields); optionally fire-and-forget analytics event.
9. Add tests (if applicable) to cover: missing header, bad JSON, weak password, invalid token (mocked), successful update.
