# API Endpoint Implementation Plan: POST /api/auth/reset-password

## 1. Endpoint Overview

Implement a POST endpoint that accepts an email address and leverages Supabase Auth to send a password reset email. The handler must normalize and validate input, enforce per-IP and per-email rate limits, prevent account enumeration by returning a generic success response, and route all Supabase interactions through the existing auth service for consistent error handling.

## 2. Request Details

- **HTTP Method**: POST
- **URL Structure**: `/api/auth/reset-password`
- **Headers**: `Content-Type: application/json`, `Accept: application/json`
- **Parameters**:
  - **Required (body)**: `email` — string, trimmed, valid email, max 254 chars, normalized to lowercase.
  - **Optional**: none. Strip unknown keys during validation to avoid over-posting.
- **Rate Limiting**:
  - Per-IP: 3 requests / 15 minutes via `ensureRateLimit({ key: ip, limit: 3, windowMs: 900000 })` before any expensive work.
  - Per-email: reuse token bucket keyed by `reset-password:{email}` to dampen credential stuffing (same limits as IP).
- **Request Body Schema**: reuse `resetPasswordSchema` from `src/lib/validation/auth.schema.ts` which already enforces trimmed, lowercase emails.

## 3. Used Types

- **Existing DTOs**:
  - `ResetPasswordRequestDTO` — inbound payload contract.
  - `MessageResponseDTO` — `{ message: string }` success payload.
  - `ErrorResponseDTO` — standardized error envelope for validation and rate limit responses.
- **Command Models**:
  - `ResetPasswordCommand` (new): `{ email: string; ipAddress: string; userAgent?: string; redirectTo: string; }` stored in `src/types.ts` alongside other commands.
- **Service Contracts**:
  - Extend `AuthServiceError`/`AuthErrorCodes` with `RESET_NOT_ALLOWED` if Supabase rejects request for policy reasons.
  - Add `requestPasswordReset(command: ResetPasswordCommand, supabase: SupabaseClient): Promise<void>` in `src/lib/services/auth.service.ts`.

## 4. Response Details

- **200 OK** — Always returned for valid requests (even if email does not exist) to prevent enumeration. Body: `{ "message": "Password reset email sent" }`.
- **400 Bad Request** — When `resetPasswordSchema` fails. Return `ErrorResponseDTO` with `code: "VALIDATION_ERROR"` and per-field messages.
- **429 Too Many Requests** — Rate limiter triggered. Return `ErrorResponseDTO` with `code: "RATE_LIMIT_EXCEEDED"`, include `details.retryAfter` and `Retry-After` header.
- **500 Internal Server Error** — Unexpected Supabase or infrastructure failure. Use `code: "INTERNAL_ERROR"`; log error details server-side only.

## 5. Data Flow

1. **Context Setup**: Endpoint exports `prerender = false` and `export const POST`. Obtain `supabase` from `context.locals`.
2. **Rate Limiting**: Compute caller IP (prefer `x-forwarded-for`, fallback to `request.headers.get("cf-connecting-ip")` or `context.clientAddress`). Run IP limiter, then email limiter once email is parsed.
3. **Validation**: `await request.json()` → `resetPasswordSchema.safeParse`. On failure, map issues to `ErrorResponseDTO`.
4. **Command Construction**: Normalize email (already lowercase from schema), attach `ipAddress`, `userAgent`, and determine `redirectTo` from config (`import.meta.env.PUBLIC_SITE_URL + "/reset-password"`).
5. **Service Call**: Invoke `requestPasswordReset(command, supabase)`. Service should call `supabase.auth.resetPasswordForEmail(command.email, { redirectTo: command.redirectTo, captchaToken?: ... })` and normalize Supabase errors.
6. **Side Effects**: Optionally enqueue analytics event (`event_type: "password_reset_requested"`) on success via `analytics_events` table (add enum entry if used). Failures should not block the response.
7. **Response**: Return `200` with `MessageResponseDTO`. Set `Cache-Control: no-store` and `Content-Type: application/json`.

## 6. Security Considerations

- **Email Enumeration Mitigation**: Always respond with 200 on valid shape, regardless of whether Supabase finds the email. Only validation or rate-limit errors expose non-200 statuses.
- **Rate Limiting**: Dual IP/email buckets to deter credential stuffing and automated abuse. Consider logging repeated offenders for further mitigation.
- **Transport & CSRF**: Rely on existing HTTPS enforcement and middleware that rejects non-POST or non-JSON requests. Ensure CORS is restricted to trusted origins.
- **Redirect Safety**: The `redirectTo` URL must be server-defined to prevent open redirect exploits.
- **Logging Hygiene**: Never log raw email addresses unless necessary; when logging errors include hashed email or truncated value.
- **Auth Context**: Allow both authenticated and unauthenticated users, but optionally short-circuit with 400 if a logged-in user requests reset for another account (future enhancement).

## 7. Error Handling

- **Validation Errors (400)**: Aggregate `zodError.flatten().fieldErrors` into `details`. Do not call Supabase when validation fails.
- **Rate Limit (429)**: Return standardized payload and set `Retry-After`. Include limiter metadata in logs for tracing.
- **Supabase Errors (500)**: Catch `AuthApiError` and map known cases: invalid email format → 400 (already filtered), service disabled → 500, network issues → 500. Wrap others in `AuthServiceError` with `INTERNAL_ERROR`.
- **Logging**: Use structured `console.error({ event: "reset_password_failed", code, emailHash, requestId })`. There is no dedicated error table per DB plan, so rely on observability stack.

## 8. Performance

- Single Supabase call; keep handler lightweight. Ensure rate-limiter maps are reused (module-level) to avoid reinitialization.
- Avoid awaiting analytics insert if it would delay response; either fire-and-forget with `void supabase.from(...);` inside `catch` or wrap with timeout.
- Parse JSON once and reuse parsed payload.
- Use streaming Response creation only if necessary; standard JSON is sufficient.

## 9. Implementation Steps

1. **Types**: Add `ResetPasswordCommand` and optional analytics event enum (`"password_reset_requested"`) in `src/types.ts`.
2. **Service Layer**: Implement `requestPasswordReset` in `auth.service.ts`, updating `AuthErrorCodes` if new codes introduced. Ensure errors translate to `AuthServiceError`.
3. **Endpoint**: Create `src/pages/api/auth/reset-password.ts` exporting `prerender = false` and `POST` handler using validation, rate limiter, and service.
4. **Rate Limiter Enhancements**: Expose ability to key by arbitrary string. Already supported; just ensure keys differentiate IP vs email.
5. **Analytics (optional)**: If tracking resets, update `AnalyticsEventType` and insert `analytics_events` row upon success.
6. **Testing**: Add unit tests for `requestPasswordReset` (mock Supabase) and route tests covering 200 (existing email + unknown email), 400 (invalid email), 429 (rate limit), and 500 (simulated Supabase failure).
7. **Docs**: Publish this plan (done) and update any public API reference/OpenAPI definitions with the new endpoint signature.
