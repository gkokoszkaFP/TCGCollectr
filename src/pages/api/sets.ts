/**
 * GET /api/sets
 *
 * Retrieve a paginated, filterable list of available card sets for browsing.
 *
 * This is a public endpoint that supports:
 * - Pagination with configurable page size (1-100 items per page)
 * - Sorting by name, release_date, or series
 * - Filtering by partial set name match (search) or exact series match
 * - Ascending/descending sort order
 *
 * Query Parameters:
 * - page (optional, default: 1) - 1-indexed page number, must be >= 1
 * - limit (optional, default: 20) - items per page, must be 1-100
 * - sort (optional, default: 'name') - one of: name, release_date, series
 * - order (optional, default: 'asc') - one of: asc, desc
 * - search (optional) - partial case-insensitive match against set name
 * - series (optional) - exact match against series field
 *
 * Response codes:
 * - 200: Sets retrieved successfully with pagination metadata
 * - 400: Invalid query parameters (validation error)
 * - 500: Internal server error
 *
 * Response headers:
 * - Cache-Control: public, max-age=60 (sets data is stable and can be cached)
 *
 * Example requests:
 * - GET /api/sets → all sets, page 1, 20 per page, sorted by name ascending
 * - GET /api/sets?page=2&limit=50 → page 2, 50 per page
 * - GET /api/sets?sort=release_date&order=desc → sorted by newest releases first
 * - GET /api/sets?search=base → sets with "base" in the name
 * - GET /api/sets?series=Gym%20Heroes → sets from "Gym Heroes" series
 */

import type { APIContext } from "astro";

import { listSets, SetsServiceError, SetsErrorCodes } from "../../lib/services/sets.service";
import { getSetsQuerySchema, type GetSetsQuery } from "../../lib/validation/sets.schema";
import { createErrorResponse } from "../../lib/utils/api-helpers";
import type { SupabaseClient } from "../../db/supabase.client";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";

// Disable static prerendering for this API route (dynamic content)
export const prerender = false;

/**
 * GET handler for paginated sets listing
 *
 * This endpoint implements the MVP on-demand seeding pattern:
 * - If sets table is empty, automatically fetches from TCGDex API
 * - Caches results to avoid repeated upstream calls
 * - Uses service-role client for seeding (bypasses RLS)
 *
 * Required environment variables:
 * - SUPABASE_URL: Supabase project URL
 * - SUPABASE_KEY: Supabase anon key (for reads)
 * - SUPABASE_SERVICE_KEY: Supabase service role key (server-only, for seeding upserts)
 * - TCGDEX_URL: TCGDex API base URL (e.g., https://api.tcgdex.net/v2/en)
 *
 * @param context - Astro APIContext containing request and locals
 * @returns Response with paginated sets (200), validation error (400), or server error (500)
 */
export async function GET(context: APIContext): Promise<Response> {
  const { request, locals } = context;
  const anonClient = locals.supabase as SupabaseClient;

  try {
    // Step 1: Validate required environment variables for seeding
    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_KEY;
    const tcgdexUrl = import.meta.env.TCGDEX_URL;

    if (!supabaseUrl || !supabaseServiceKey || !tcgdexUrl) {
      // eslint-disable-next-line no-console
      console.error("Missing required environment variables for seeding", {
        SUPABASE_URL: !!supabaseUrl,
        SUPABASE_SERVICE_KEY: !!supabaseServiceKey,
        TCGDEX_URL: !!tcgdexUrl,
      });

      return createErrorResponse(
        SetsErrorCodes.INTERNAL_ERROR,
        "Server is not properly configured for seeding. Please contact the administrator.",
        500
      );
    }

    // Step 2: Create service-role client for seeding operations
    const serviceRoleClient = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // Step 3: Extract and parse query parameters from URL
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());

    // Step 4: Validate query parameters using Zod schema
    const validationResult = getSetsQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      const details = validationResult.error.flatten().fieldErrors;
      return createErrorResponse("VALIDATION_ERROR", "Invalid query parameters", 400, details);
    }

    const params: GetSetsQuery = validationResult.data;

    // Step 5: Call service to fetch and process sets (includes seeding check)
    const result = await listSets(anonClient, serviceRoleClient, tcgdexUrl, params);

    // Step 6: Return successful response with cache headers
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (error) {
    // Handle known service errors
    if (error instanceof SetsServiceError) {
      return createErrorResponse(error.code, error.message, error.statusCode, error.details);
    }

    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("Unexpected error in GET /api/sets:", error);
    return createErrorResponse(SetsErrorCodes.INTERNAL_ERROR, "An unexpected error occurred", 500);
  }
}
