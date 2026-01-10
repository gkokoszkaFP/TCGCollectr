import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import type { TcgTypeDto } from "@/types";

/**
 * Service for managing TCG Types data
 * Handles retrieval of trading card game type information
 */
export class TcgTypesService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Retrieves all available Trading Card Game types.
   * Results are ordered by ID for consistent ordering.
   *
   * @returns Promise resolving to array of TCG types or error
   * @example
   * const { data, error } = await service.getTcgTypes();
   * if (data) {
   *   console.log(data); // [{ id: 1, code: "pokemon", name: "Pokémon TCG" }]
   * }
   */
  async getTcgTypes(): Promise<{ data: TcgTypeDto[] | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .from("tcg_types")
        .select("id, code, name")
        .order("id", { ascending: true });

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error occurred"),
      };
    }
  }
}
