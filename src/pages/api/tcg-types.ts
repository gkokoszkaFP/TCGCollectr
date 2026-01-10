import type { APIRoute } from "astro";
import { TcgTypesService } from "@/lib/services/tcg-types.service";

export const prerender = false;

/**
 * GET /api/tcg-types
 *
 * Retrieves all available Trading Card Game types.
 * This is a public endpoint that requires no authentication.
 *
 * @returns {200} Success - Returns array of TCG types
 * @returns {500} Internal Server Error - Database or unexpected error occurred
 *
 * @example
 * fetch('/api/tcg-types')
 *   .then(res => res.json())
 *   .then(data => console.log(data.data))
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    const service = new TcgTypesService(locals.supabase);
    const { data, error } = await service.getTcgTypes();

    if (error) {
      // eslint-disable-next-line no-console
      console.error("[API Error] /api/tcg-types:", {
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      return new Response(
        JSON.stringify({
          error: "Database error occurred while retrieving TCG types",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=86400",
        Vary: "Accept-Encoding",
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[Unexpected Error] /api/tcg-types:", error);

    return new Response(
      JSON.stringify({
        error: "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
