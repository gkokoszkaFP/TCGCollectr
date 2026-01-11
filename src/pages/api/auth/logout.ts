/**
 * POST /api/auth/logout
 *
 * User logout endpoint that revokes the current Supabase session.
 *
 * Features:
 * - Requires Bearer token in Authorization header
 * - Revokes the session by invalidating the JWT
 * - Analytics event tracking for logouts
 * - Comprehensive error handling with standardized responses
 *
 * Response codes:
 * - 200: Logout successful
 * - 400: Validation error (missing or malformed Authorization header)
 * - 401: Unauthorized (token is invalid or expired)
 * - 500: Internal server error
 */

import type { APIContext } from "astro";
import { logoutUser, AuthServiceError, AuthErrorCodes } from "../../../lib/services/auth.service";
import type { SupabaseClient } from "../../../db/supabase.client";
import { getClientIp, createErrorResponse, hashString, parseBearerToken } from "../../../lib/utils/api-helpers";

// Disable static prerendering for this API route
export const prerender = false;

/**
 * POST handler for user logout
 */
export async function POST(context: APIContext): Promise<Response> {
  const { request, locals } = context;
  const supabase = locals.supabase;

  try {
    // Step 1: Extract and validate Authorization header
    const authHeader = request.headers.get("authorization");
    const token = parseBearerToken(authHeader);

    if (!token) {
      return createErrorResponse(
        AuthErrorCodes.VALIDATION_ERROR,
        "Authorization header is required with Bearer token",
        400,
        {
          required: "Authorization: Bearer <token>",
        }
      );
    }

    // Step 2: Logout user via AuthService
    await logoutUser(token, supabase);

    // Step 3: Track analytics event (fire-and-forget)
    const clientIp = getClientIp(request);
    trackLogoutEvent(supabase, clientIp, request.headers.get("user-agent") || undefined).catch(() => {
      // Silently ignore analytics tracking errors
    });

    // Step 4: Return success response
    return new Response(JSON.stringify({ message: "Successfully logged out" }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    // Handle AuthServiceError
    if (error instanceof AuthServiceError) {
      return new Response(JSON.stringify(error.toErrorResponse()), {
        status: error.statusCode,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      });
    }

    // Handle unexpected errors
    return createErrorResponse(AuthErrorCodes.INTERNAL_ERROR, "An unexpected error occurred during logout", 500);
  }
}

/**
 * Track logout analytics event
 * This is a fire-and-forget operation that should not block the logout response
 */
async function trackLogoutEvent(supabase: SupabaseClient, ipAddress: string, userAgent?: string): Promise<void> {
  // Create anonymized IP hash for privacy
  const ipHash = await hashString(ipAddress);

  await supabase.from("analytics_events").insert({
    event_type: "user_logout",
    event_data: {
      ip_hash: ipHash,
      user_agent: userAgent,
      timestamp: new Date().toISOString(),
    },
  });
}
