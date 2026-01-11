# API Endpoint Implementation Plan: POST /api/auth/logout

## 1. Endpoint Overview

- Invalidates the current Supabase session by revoking the supplied access token (and refreshing credentials behind it) to force credential rotation on the next client request.
- Lives under [src/pages/api/auth/logout.ts](src/pages/api/auth/logout.ts) with `export const prerender = false` so the route is always served via the server runtime and can access `context.locals.supabase`.
- Relies on shared helpers such as [src/lib/utils/api-helpers.ts](src/lib/utils/api-helpers.ts) for bearer parsing/error envelopes and [src/lib/services/auth.service.ts](src/lib/services/auth.service.ts) for the Supabase interaction.

## 2. Request Details

- HTTP Method: POST
- URL Structure: /api/auth/logout
- Headers:
  - `Authorization: Bearer <access_token>` (required, extracts the Supabase JWT)
  - `Accept: application/json` / `Content-Type: application/json` (optional but recommended for consistency)
- Request Body: none
- Rate limiting: route is idempotent but should reuse `ensureRateLimit` when abuse is observed (extra headroom already provided by Supabase auth throttling).

## 3. Response Details

- 200 OK → `MessageResponseDTO` from [src/types.ts](src/types.ts) with `{ "message": "Successfully logged out" }` to indicate the session is no longer valid. Include `Cache-Control: no-store`.
- 400 BAD REQUEST → `ErrorResponseDTO` with `code: "VALIDATION_ERROR"` when the `Authorization` header is missing, malformed, or does not contain a Bearer token.
- 401 UNAUTHORIZED → `ErrorResponseDTO` with a new `AuthErrorCodes.UNAUTHORIZED` (add to [src/lib/services/auth.service.ts](src/lib/services/auth.service.ts)) when the token is rejected by Supabase during `logoutUser`, covering expired or tampered tokens.
- 500 INTERNAL SERVER ERROR → `ErrorResponseDTO` with `AuthErrorCodes.INTERNAL_ERROR` for unexpected Supabase/network failures; no tokens or sensitive details are echoed.

## 4. Data Flow

1. Astro handler reads `request` and `locals.supabase`. Response caching is prevented via `Cache-Control: no-store` so tokens never linger in caches.
2. Extract the `Authorization` header, validate the `Bearer` prefix, and strip whitespace; respond 400 if the header is missing or malformed.
3. Invoke a new helper (e.g., `parseBearerToken`) to centralize the Bearer parsing logic and keep the handler clean.
4. Pass the raw JWT into `logoutUser(token, supabase)` inside [src/lib/services/auth.service.ts](src/lib/services/auth.service.ts). That helper should call `supabase.auth.setAuth(token)` (or the equivalent `signOut` call that forwards the token via the client) and then `supabase.auth.signOut()` or the REST logout endpoint to revoke it.
5. After Supabase confirms the session was revoked, fire-and-forget a `user_logout` row into `analytics_events` (reuse `hashString` from [src/lib/utils/api-helpers.ts](src/lib/utils/api-helpers.ts) to anonymize the IP) so downstream metrics can track churn without storing raw IPs.
6. Return the success message; error paths are handled via `createErrorResponse` so the payload always matches the shared envelope.

## 5. Security Considerations

- Require the `Authorization` header and refuse unauthenticated requests; there is no public access.
- Rely on Supabase’s JWT validation inside `logoutUser` to detect tampered/expired tokens before responding with 401.
- Prevent caching of the response by adding `Cache-Control: no-store` (and optionally `Vary: Origin`) so intermediate proxies never store auth state.
- Consider invoking `auth.admin.invalidateUserSessions(userId)` when a valid session is identified so a malicious token replay is further dampened; extract the user ID via `supabase.auth.getUser()` before invalidating other sessions.
- Use the hashed IP from `hashString` instead of storing raw addresses when writing to `analytics_events` to stay compliant with data minimization requirements.

## 6. Error Handling

| Scenario                                    | Detection                                                                 | Status / Code            | Notes                                                                                      |
| ------------------------------------------- | ------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------ |
| Missing or malformed `Authorization` header | Bearer parsing helper fails (empty header, missing prefix)                | 400 / `VALIDATION_ERROR` | Return `details` explaining the required format to keep client UI consistent.              |
| Invalid or expired token                    | `logoutUser` receives `AuthServiceError` after Supabase rejects the token | 401 / `UNAUTHORIZED`     | Keep message generic (`Token is invalid or expired`) and do not reveal Supabase internals. |
| Supabase or network failure                 | Unexpected exception in `logoutUser` (e.g., network timeout)              | 500 / `INTERNAL_ERROR`   | Log stack trace and request metadata to the server log; avoid adding to analytics.         |

All error responses reuse `createErrorResponse` to match the project-wide envelope defined in [src/lib/utils/api-helpers.ts](src/lib/utils/api-helpers.ts).

## 7. Performance Considerations

- Only one Supabase API call (`signOut` or REST logout) executes per request; no database writes or reads beyond the analytics insert.
- Analytics events are inserted asynchronously so that latency-critical paths remain fast; the handler should not await the insert longer than necessary and should swallow insert failures.
- If the rate of logout calls spikes (e.g., for session rotation), consider moving the Bearer parsing helper to a shared module so it can be reused by other auth endpoints without reprocessing the header string.

## 8. Implementation Steps

1. Extend `AuthErrorCodes` inside [src/lib/services/auth.service.ts](src/lib/services/auth.service.ts) to include `UNAUTHORIZED` (and optionally `MISSING_TOKEN` if the service is expected to throw when no token is provided).
2. Add a `logoutUser(token: string, supabase: SupabaseClient): Promise<void>` helper alongside `registerUser`/`loginUser` that calls `supabase.auth.setAuth(token)` or the REST `/auth/v1/logout` endpoint and normalizes Supabase responses into `AuthServiceError` instances.
3. Create [src/pages/api/auth/logout.ts](src/pages/api/auth/logout.ts) with `export const prerender = false`. Use `getClientIp` and `createErrorResponse` from [src/lib/utils/api-helpers.ts](src/lib/utils/api-helpers.ts) to maintain consistent headers/body formatting, and call `logoutUser` with the parsed token. On success, insert a hashed `user_logout` row into `analytics_events` (same pattern as the login/register endpoints).
4. Ensure the new route parses the `Authorization` header, rejects missing/invalid Bearer tokens with 400 `VALIDATION_ERROR`, and surfaces Supabase errors as `ErrorResponseDTO` using `createErrorResponse`.
5. Write targeted tests (unit or integration) covering:
   - Successful logout (200) when a valid token is provided.
   - Missing header (400) and invalid token (401) paths.
   - Supabase failures (500) so the error envelope is still honored.
6. Document the route in `docs/api-plan.md` if additional context is needed beyond this implementation plan (e.g., specify logging/monitoring expectations).
