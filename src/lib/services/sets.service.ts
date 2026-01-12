/**
 * Sets service for retrieving card sets with filtering and pagination
 *
 * This module provides business logic for sets operations using Supabase.
 * It handles paginated listing with optional filtering by search text and series,
 * sorting, and proper error handling.
 *
 * On-demand Seeding (MVP Pattern):
 * Before returning sets from the database, this service checks if the sets table
 * is empty. If empty, it triggers a bulk seed from TCGDex API using the
 * service-role client before serving results.
 */

import type { PaginatedResponseDTO, SetDTO, SetDetailDTO, PaginationDTO } from "../../types";
import type { SupabaseClient } from "../../db/supabase.client";
import type { GetSetsQuery } from "../validation/sets.schema";
import { seedSetsFromTCGDex } from "./seed-from-tcgdex";

/**
 * Error codes for sets operations
 */
export const SetsErrorCodes = {
  NOT_FOUND: "NOT_FOUND",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
} as const;

/**
 * Custom error class for sets operations
 */
export class SetsServiceError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "SetsServiceError";
  }
}

/**
 * Map database sort parameter to actual column name
 *
 * @param sort - The sort parameter from validated query
 * @returns The database column name for sorting
 */
function mapSortToColumn(sort: string): string {
  const sortMap: Record<string, string> = {
    name: "name",
    release_date: "release_date",
    series: "series",
  };

  return sortMap[sort] || "name";
}

/**
 * Check if sets table is empty and trigger seeding if needed
 *
 * Implements on-demand seed-on-read pattern:
 * 1. Query count of sets in the database using anon client
 * 2. If count is 0, fetch all sets from TCGDex and upsert them
 * 3. If TCGDex fails, throw error (cannot serve empty data)
 *
 * @param anonClient - Supabase anon client for read-only count query
 * @param serviceRoleClient - Supabase service-role client for upsert operations
 * @param tcgdexUrl - Base URL of TCGDex API
 * @throws SetsServiceError if seeding fails or TCGDex API is unavailable
 */
async function ensureSetsAreSeeded(
  anonClient: SupabaseClient,
  serviceRoleClient: SupabaseClient,
  tcgdexUrl: string
): Promise<void> {
  try {
    // Check if sets table has any data
    const { count, error: countError } = await anonClient.from("sets").select("*", { count: "exact", head: true });

    if (countError) {
      throw new SetsServiceError(SetsErrorCodes.INTERNAL_ERROR, "Failed to check sets count", 500, {
        original_error: countError.message,
      });
    }

    // If sets exist, no seeding needed
    if ((count || 0) > 0) {
      return;
    }

    // Attempt to seed from TCGDex
    try {
      await seedSetsFromTCGDex(serviceRoleClient, tcgdexUrl);
    } catch (seedError) {
      throw new SetsServiceError(
        SetsErrorCodes.INTERNAL_ERROR,
        "Failed to seed sets from TCGDex API. The sets table is empty and initial data could not be loaded.",
        500,
        {
          seed_error: seedError instanceof Error ? seedError.message : String(seedError),
        }
      );
    }
  } catch (error) {
    // Re-throw SetsServiceError as-is
    if (error instanceof SetsServiceError) {
      throw error;
    }

    // Wrap unexpected errors
    throw new SetsServiceError(SetsErrorCodes.INTERNAL_ERROR, "Unexpected error during seeding check", 500, {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Fetch paginated list of card sets with optional filtering
 *
 * This function:
 * 1. Checks if sets table is empty and seeds from TCGDex if needed (on-demand pattern)
 * 2. Constructs WHERE clauses for search and series filtering
 * 3. Executes a count query to get total items matching filters
 * 4. Executes a data query with sorting, limit, and offset
 * 5. Maps database rows to SetDTO format
 * 6. Calculates pagination metadata (total_pages, etc.)
 * 7. Returns paginated response with data and pagination info
 *
 * @param anonClient - Supabase anon client (from context.locals)
 * @param serviceRoleClient - Supabase service-role client (for seeding only)
 * @param tcgdexUrl - Base URL of TCGDex API (e.g., https://api.tcgdex.net/v2/en)
 * @param params - Validated query parameters (page, limit, sort, order, search, series)
 * @returns PaginatedResponseDTO with array of SetDTO and pagination metadata
 * @throws SetsServiceError for database errors or seeding failures
 *
 * @example
 * ```typescript
 * const result = await listSets(
 *   anonClient,
 *   serviceRoleClient,
 *   "https://api.tcgdex.net/v2/en",
 *   {
 *     page: 1,
 *     limit: 20,
 *     sort: 'name',
 *     order: 'asc',
 *     search: 'base',
 *     series: undefined
 *   }
 * );
 *
 * console.log(result.data.length); // number of sets on this page
 * console.log(result.pagination.total_pages); // total pages available
 * ```
 */
export async function listSets(
  anonClient: SupabaseClient,
  serviceRoleClient: SupabaseClient,
  tcgdexUrl: string,
  params: GetSetsQuery
): Promise<PaginatedResponseDTO<SetDTO>> {
  const page: number = params.page ?? 1;
  const limit: number = params.limit ?? 20;
  const sort: string = params.sort ?? "name";
  const order: "asc" | "desc" = (params.order ?? "asc") as "asc" | "desc";
  const search: string | undefined = params.search;
  const series: string | undefined = params.series;

  const offset: number = (page - 1) * limit;
  const column: string = mapSortToColumn(sort);

  try {
    // Step 0: Check if sets are seeded; if not, seed from TCGDex
    await ensureSetsAreSeeded(anonClient, serviceRoleClient, tcgdexUrl);

    // Step 1: Build WHERE conditions as an array to apply with filter()
    let query = anonClient.from("sets").select("*", { count: "exact" });

    // Apply search filter (case-insensitive partial match on name)
    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    // Apply series filter (exact match)
    if (series) {
      query = query.eq("series", series);
    }

    // Step 2: Execute count query with filters
    const { count: totalItems, error: countError } = await query;

    if (countError) {
      throw new SetsServiceError(SetsErrorCodes.INTERNAL_ERROR, "Failed to count sets", 500, {
        original_error: countError.message,
      });
    }

    // Step 3: Build and execute data query with sorting, pagination
    let dataQuery = anonClient.from("sets").select("id, name, series, total_cards, release_date, logo_url, symbol_url");

    // Apply filters
    if (search) {
      dataQuery = dataQuery.ilike("name", `%${search}%`);
    }

    if (series) {
      dataQuery = dataQuery.eq("series", series);
    }

    // Apply sorting and pagination
    const { data: rows, error: dataError } = await dataQuery
      .order(column, { ascending: order === "asc" })
      .range(offset, offset + limit - 1);

    if (dataError) {
      throw new SetsServiceError(SetsErrorCodes.INTERNAL_ERROR, "Failed to fetch sets", 500, {
        original_error: dataError.message,
      });
    }

    // Step 4: Map rows to SetDTO (rows already contain required fields)
    const data: SetDTO[] = (rows || []).map((row) => ({
      id: row.id,
      name: row.name,
      series: row.series,
      total_cards: row.total_cards,
      release_date: row.release_date,
      logo_url: row.logo_url,
      symbol_url: row.symbol_url,
    }));

    // Step 5: Calculate pagination metadata
    const totalPages = Math.ceil((totalItems || 0) / limit);
    const pagination: PaginationDTO = {
      page,
      limit,
      total_items: totalItems || 0,
      total_pages: totalPages,
    };

    return { data, pagination };
  } catch (error) {
    // Re-throw SetsServiceError as-is
    if (error instanceof SetsServiceError) {
      throw error;
    }

    // Wrap unexpected errors
    throw new SetsServiceError(SetsErrorCodes.INTERNAL_ERROR, "Unexpected error while fetching sets", 500, {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Fetch a single card set by its unique identifier
 *
 * This function:
 * 1. Queries the sets table by primary key
 * 2. Selects only fields required by SetDetailDTO (including sync metadata)
 * 3. Returns the set or null if not found
 * 4. Throws SetsServiceError for database errors
 *
 * @param supabase - Supabase client (from context.locals)
 * @param setId - Unique set identifier (already validated)
 * @returns SetDetailDTO with full set data including timestamps, or null if not found
 * @throws SetsServiceError for database errors
 *
 * @example
 * ```typescript
 * const set = await getSetById(supabase, "base1");
 * if (set) {
 *   console.log(set.name);  // "Base Set"
 *   console.log(set.last_synced_at);  // "2024-01-10T12:00:00Z"
 * }
 * ```
 */
export async function getSetById(supabase: SupabaseClient, setId: string): Promise<SetDetailDTO | null> {
  try {
    // Query set by ID, selecting all fields except tcg_type
    const { data, error } = await supabase
      .from("sets")
      .select(
        "id, name, series, total_cards, release_date, logo_url, symbol_url, last_synced_at, created_at, updated_at"
      )
      .eq("id", setId)
      .single();

    // Handle "not found" case (Supabase returns error when .single() gets no rows)
    if (error) {
      // Code PGRST116 indicates "no rows found" - return null instead of throwing
      if (error.code === "PGRST116") {
        return null;
      }

      // Other errors should be treated as internal errors
      throw new SetsServiceError(SetsErrorCodes.INTERNAL_ERROR, "Failed to fetch set details", 500, {
        original_error: error.message,
        error_code: error.code,
      });
    }

    return data;
  } catch (error) {
    // Re-throw SetsServiceError as-is
    if (error instanceof SetsServiceError) {
      throw error;
    }

    // Wrap unexpected errors
    throw new SetsServiceError(SetsErrorCodes.INTERNAL_ERROR, "Unexpected error while fetching set details", 500, {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
