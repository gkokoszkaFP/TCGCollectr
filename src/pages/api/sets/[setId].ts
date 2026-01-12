/**
 * GET /api/sets/:setId
 *
 * Retrieve a single card set by its unique identifier.
 *
 * This is a public, read-only endpoint that returns complete set metadata including
 * sync timestamps and artwork URLs. Results are cacheable at CDN layer.
 *
 * Path Parameters:
 * - setId (required) - unique set identifier (letters, numbers, dot, underscore, dash)
 *
 * Response codes:
 * - 200: Set retrieved successfully with full metadata
 * - 400: Invalid setId format
 * - 404: Set with the given ID not found
 * - 500: Internal server error
 *
 * Response headers:
 * - Cache-Control: public, max-age=86400, stale-while-revalidate=60
 *   Sets data is stable and cached for 24 hours; can serve stale data up to 60 seconds
 * - Content-Type: application/json
 *
 * Example requests:
 * - GET /api/sets/base1 → Base Set details
 * - GET /api/sets/sv04pt → Scarlet & Violet Set 4 Paradox Rift details
 *
 * Error Response Examples:
 * - 404 Not Found: { "error": { "code": "NOT_FOUND", "details": {} } }
 * - 400 Validation Error: { "error": { "code": "VALIDATION_ERROR", "details": { "message": "Invalid setId" } } }
 */

import type { APIContext } from "astro";
import { getSetById, SetsErrorCodes, SetsServiceError } from "@/lib/services/sets.service";
import { getSetParamsSchema } from "@/lib/validation/sets.schema";
import { createErrorResponse } from "@/lib/utils/api-helpers";
import type { SupabaseClient } from "@/db/supabase.client";

// Disable static prerendering for this API route (dynamic content)
export const prerender = false;

/**
 * GET handler for retrieving a single set by ID
 *
 * Implements the read-only public endpoint pattern:
 * 1. Validates the setId path parameter using Zod schema
 * 2. Calls the service to fetch the set from Supabase
 * 3. Returns the complete set with metadata or appropriate error
 * 4. Sets cache headers to allow CDN caching of results
 *
 * @param context - Astro APIContext containing request and route params
 * @returns Response with set data (200), validation error (400), not found (404), or server error (500)
 */
export async function GET(context: APIContext): Promise<Response> {
  const { params, locals } = context;
  const supabase = locals.supabase as SupabaseClient;

  try {
    // Step 1: Validate path parameter using Zod schema
    const validationResult = getSetParamsSchema.safeParse({ setId: params.setId });

    if (!validationResult.success) {
      const details = validationResult.error.flatten().fieldErrors;
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid setId format. Must contain only letters, numbers, dots, underscores, or dashes.",
        400,
        { message: "Invalid setId", errors: details }
      );
    }

    const { setId } = validationResult.data;

    // Step 2: Call service to fetch set by ID
    const set = await getSetById(supabase, setId);

    // Step 3: Handle not found case
    if (!set) {
      return createErrorResponse(SetsErrorCodes.NOT_FOUND, "Set not found", 404);
    }

    // Step 4: Return successful response with cache headers
    return new Response(JSON.stringify(set), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    // Handle known service errors
    if (error instanceof SetsServiceError) {
      return createErrorResponse(
        (error as SetsServiceError).code,
        (error as SetsServiceError).message,
        (error as SetsServiceError).statusCode,
        (error as SetsServiceError).details
      );
    }

    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("Unexpected error in GET /api/sets/:setId:", error);
    return createErrorResponse(
      SetsErrorCodes.INTERNAL_ERROR,
      "An unexpected error occurred while retrieving the set",
      500
    );
  }
}
