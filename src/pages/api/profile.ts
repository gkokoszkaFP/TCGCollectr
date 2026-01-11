/**
 * GET /api/profile
 *
 * Retrieve the authenticated user's profile including onboarding status,
 * favorite card type/set, aggregated card count, and timestamps.
 *
 * Features:
 * - Bearer token authentication via Authorization header
 * - Supabase Auth integration for user verification
 * - Aggregated card count calculation from user_cards table
 * - No-store cache header for sensitive user data
 * - Comprehensive error handling with standardized responses
 *
 * Response codes:
 * - 200: Profile retrieved successfully
 * - 401: Missing or invalid bearer token
 * - 404: Profile not found for authenticated user
 * - 500: Internal server error
 */

import type { APIContext } from "astro";
import { getProfileWithTotals, ProfileServiceError } from "../../lib/services/profile.service";
import { createErrorResponse } from "../../lib/utils/api-helpers";
import type { SupabaseClient } from "../../db/supabase.client";

// Disable static prerendering for this API route
export const prerender = false;

/**
 * GET handler for user profile retrieval
 *
 * @param context - Astro APIContext containing request, locals, and response utilities
 * @returns Response with profile data (200), unauthorized error (401), not found (404), or server error (500)
 */
export async function GET(context: APIContext): Promise<Response> {
  const { request, locals } = context;
  const supabase = locals.supabase as SupabaseClient;

  try {
    // Step 1: Extract and validate Authorization header
    const authHeader = request.headers.get("Authorization");

    if (!authHeader) {
      return createErrorResponse("UNAUTHORIZED", "Missing Authorization header", 401);
    }

    // Verify the header format (should be "Bearer <token>")
    if (!authHeader.startsWith("Bearer ")) {
      return createErrorResponse("UNAUTHORIZED", "Invalid Authorization header format", 401);
    }

    // Step 2: Authenticate user via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData?.user) {
      return createErrorResponse("UNAUTHORIZED", "Invalid or expired token", 401);
    }

    const userId = authData.user.id;

    // Step 3: Fetch profile with aggregated card count
    // eslint-disable-next-line no-console
    console.log("Fetching profile for userId:", userId);
    try {
      const profile = await getProfileWithTotals(supabase, userId);

      // Handle profile not found
      if (!profile) {
        return createErrorResponse("NOT_FOUND", "Profile not found for authenticated user", 404);
      }

      // Step 4: Return successful response with no-store cache header
      return new Response(JSON.stringify(profile), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      });
    } catch (serviceError) {
      // Handle profile service errors
      if (serviceError instanceof ProfileServiceError) {
        return new Response(JSON.stringify(serviceError.toErrorResponse()), {
          status: serviceError.statusCode,
          headers: {
            "Content-Type": "application/json",
          },
        });
      }

      // Log and return unexpected service errors
      if (serviceError instanceof Error) {
        return createErrorResponse("INTERNAL_ERROR", serviceError.message, 500, {
          error: serviceError.message,
        });
      }

      throw serviceError;
    }
  } catch {
    // Return generic server error response for unexpected errors
    return createErrorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
