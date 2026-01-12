/**
 * TCGDex API integration for on-demand seeding
 *
 * This module implements the MVP seed-on-read pattern for card sets.
 * When the sets table is empty, the first request triggers a bulk fetch
 * from TCGDex and upserts all sets into the database.
 *
 * Design notes:
 * - Uses service-role client for upserting (bypasses RLS)
 * - Implements in-memory concurrency prevention to avoid duplicate bulk seeds
 * - Maps TCGDex response format to database schema
 * - Rate-limited by middleware (see rate-limit.service.ts)
 */

import type { SupabaseClient } from "../../db/supabase.client";

/**
 * TCGDex API response shape for a single set
 * Based on official TCGDex documentation: https://tcgdex.dev/docs/en/
 */
interface TCGDexSet {
  id: string;
  name: string;
  series?: string | null;
  total?: number;
  releaseDate?: string | null;
  logo?: string | null;
  symbol?: string | null;
  tcgType?: string;
}

/**
 * Database row format for sets table
 */
interface SetInsertRow {
  id: string;
  name: string;
  series: string | null;
  total_cards: number;
  release_date: string | null;
  logo_url: string | null;
  symbol_url: string | null;
  tcg_type: string;
  last_synced_at: string;
}

/**
 * In-memory flag to prevent concurrent bulk seeding operations
 * Shared state across requests during the same process lifetime
 */
let isSeedingInProgress = false;

/**
 * Map TCGDex API response format to database insert format
 *
 * @param tcgdexSets - Array of sets from TCGDex API
 * @returns Array of rows ready for database insertion
 */
function mapTCGDexToDatabase(tcgdexSets: TCGDexSet[]): SetInsertRow[] {
  const now = new Date().toISOString();

  return tcgdexSets.map((set) => ({
    id: set.id,
    name: set.name,
    series: set.series || null,
    total_cards: set.total || 0,
    release_date: set.releaseDate || null,
    logo_url: set.logo || null,
    symbol_url: set.symbol || null,
    tcg_type: set.tcgType || "pokemon",
    last_synced_at: now,
  }));
}

/**
 * Fetch all sets from TCGDex API
 *
 * @param tcgdexUrl - Base URL of TCGDex API (e.g., https://api.tcgdex.net/v2/en)
 * @returns Array of sets from TCGDex
 * @throws Error if fetch fails or returns non-200 status
 */
async function fetchSetsFromTCGDex(tcgdexUrl: string): Promise<TCGDexSet[]> {
  const url = `${tcgdexUrl}/sets`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const message = `TCGDex API error: ${response.status} ${response.statusText} (${url})`;
    throw new Error(message);
  }

  const data = (await response.json()) as TCGDexSet[];

  if (!Array.isArray(data)) {
    throw new Error("TCGDex API returned invalid response format (expected array)");
  }

  return data;
}

/**
 * Upsert sets into the database using service-role client
 *
 * @param serviceRoleClient - Supabase service-role client (bypasses RLS)
 * @param sets - Array of set rows to upsert
 * @returns Number of sets inserted/updated
 * @throws Error if upsert fails
 */
async function upsertSetsToDatabase(serviceRoleClient: SupabaseClient, sets: SetInsertRow[]): Promise<number> {
  if (sets.length === 0) {
    return 0;
  }

  const { error } = await serviceRoleClient.from("sets").upsert(sets, { onConflict: "id" });

  if (error) {
    throw new Error(`Database upsert failed: ${error.message}`);
  }

  return sets.length;
}

/**
 * Perform bulk seeding from TCGDex API to database
 *
 * Implements on-demand seed-on-read pattern:
 * 1. Fetch all sets from TCGDex API
 * 2. Map to database format
 * 3. Upsert all sets into the database
 * 4. Return count of seeded sets
 *
 * Prevents concurrent bulk seeds with in-memory flag to avoid
 * redundant API calls and database operations.
 *
 * @param serviceRoleClient - Supabase service-role client (must have write access)
 * @param tcgdexUrl - Base URL of TCGDex API
 * @returns Object with status and count of seeded sets
 * @throws Error if TCGDex fetch or database upsert fails
 *
 * @example
 * ```typescript
 * const result = await seedSetsFromTCGDex(
 *   serviceRoleClient,
 *   "https://api.tcgdex.net/v2/en"
 * );
 * console.log(`Seeded ${result.seededCount} sets`);
 * ```
 */
export async function seedSetsFromTCGDex(
  serviceRoleClient: SupabaseClient,
  tcgdexUrl: string
): Promise<{ seededCount: number; message: string }> {
  // Prevent concurrent seeding operations
  if (isSeedingInProgress) {
    return {
      seededCount: 0,
      message: "Seeding already in progress; request will wait for completion",
    };
  }

  isSeedingInProgress = true;

  try {
    // Step 1: Fetch from TCGDex
    // eslint-disable-next-line no-console
    console.log("[Seeding] Fetching sets from TCGDex API...");
    const tcgdexSets = await fetchSetsFromTCGDex(tcgdexUrl);

    if (tcgdexSets.length === 0) {
      return {
        seededCount: 0,
        message: "TCGDex returned empty sets list",
      };
    }

    // Step 2: Map to database format
    const dbSets = mapTCGDexToDatabase(tcgdexSets);

    // Step 3: Upsert to database
    // eslint-disable-next-line no-console
    console.log(`[Seeding] Upserting ${dbSets.length} sets to database...`);
    const seededCount = await upsertSetsToDatabase(serviceRoleClient, dbSets);

    // eslint-disable-next-line no-console
    console.log(`[Seeding] Successfully seeded ${seededCount} sets`);

    return {
      seededCount,
      message: `Successfully seeded ${seededCount} sets from TCGDex`,
    };
  } finally {
    isSeedingInProgress = false;
  }
}
