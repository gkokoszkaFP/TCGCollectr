/**
 * Profile service for retrieving user profile data
 *
 * This module provides business logic for profile operations using Supabase.
 * It handles profile retrieval with aggregated card counts and ensures
 * proper error handling and data mapping.
 */

import type { ProfileDTO, ErrorResponseDTO, UpdateProfileRequestDTO } from "../../types";
import type { SupabaseClient } from "../../db/supabase.client";

/**
 * Error codes for profile operations
 */
export const ProfileErrorCodes = {
  NOT_FOUND: "NOT_FOUND",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
} as const;

/**
 * Custom error class for profile operations
 */
export class ProfileServiceError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ProfileServiceError";
  }

  toErrorResponse(): ErrorResponseDTO {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}

/**
 * Fetch user profile with aggregated card count
 *
 * This function:
 * 1. Queries the profiles table for the given user ID
 * 2. Calculates total card count from user_cards table
 * 3. Maps the response to ProfileDTO format
 * 4. Handles missing profiles or database errors
 *
 * @param supabase - Supabase client instance from context.locals
 * @param userId - The user ID to fetch the profile for
 * @returns ProfileDTO with user profile and aggregated card count, or null if not found
 * @throws ProfileServiceError for database errors
 *
 * @example
 * try {
 *   const profile = await getProfileWithTotals(supabase, userId);
 *   if (!profile) {
 *     return new Response(JSON.stringify({ error: { code: "NOT_FOUND", message: "Profile not found" } }), { status: 404 });
 *   }
 *   return new Response(JSON.stringify(profile), { status: 200 });
 * } catch (error) {
 *   if (error instanceof ProfileServiceError) {
 *     return new Response(JSON.stringify(error.toErrorResponse()), { status: error.statusCode });
 *   }
 *   throw error;
 * }
 */
export async function getProfileWithTotals(supabase: SupabaseClient, userId: string): Promise<ProfileDTO | null> {
  try {
    // Fetch the user's profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    // Handle Supabase errors
    if (profileError) {
      // PGRST116 is the "no rows found" error code
      if (profileError.code === "PGRST116") {
        return null;
      }

      // Log the actual error for debugging
      const errorDetails = {
        code: profileError.code,
        message: profileError.message,
        details: profileError.details,
        userId,
      };

      // Log to server console for debugging
      // eslint-disable-next-line no-console
      console.error("Profile query error:", errorDetails);

      throw new ProfileServiceError(ProfileErrorCodes.INTERNAL_ERROR, "Failed to fetch profile", 500, errorDetails);
    }

    // If profile doesn't exist, return null
    if (!profile) {
      // eslint-disable-next-line no-console
      console.error("Profile query returned null for userId:", userId);
      return null;
    }

    // Fetch the total card count from user_cards table
    const { data: cardCountResult, error: cardCountError } = await supabase
      .from("user_cards")
      .select("quantity", { count: "exact" })
      .eq("user_id", userId);

    // Handle card count query errors (non-critical; provide default)
    if (cardCountError) {
      // Use the database's total_cards_count field as fallback
      return profile;
    }

    // Calculate total quantity from all user cards
    const totalCardsCount = cardCountResult?.reduce((sum, card) => sum + (card.quantity || 0), 0) || 0;

    // Return profile with updated total_cards_count from aggregation
    return {
      ...profile,
      total_cards_count: totalCardsCount,
    };
  } catch (error) {
    // Re-throw ProfileServiceError
    if (error instanceof ProfileServiceError) {
      throw error;
    }

    // Handle unexpected errors
    throw new ProfileServiceError(
      ProfileErrorCodes.INTERNAL_ERROR,
      "An unexpected error occurred while fetching profile",
      500,
      { error: error instanceof Error ? error.message : "Unknown error" }
    );
  }
}

/**
 * Update user profile with partial fields
 *
 * This function:
 * 1. Validates that the favorite_set (if provided) exists in the sets table
 * 2. Builds a payload containing only provided fields
 * 3. Explicitly sets null values for fields to be cleared
 * 4. Updates the profile row in the database
 * 5. Rehydrates total_cards_count by recalculating from user_cards
 * 6. Handles missing profiles or database errors
 *
 * @param supabase - Supabase client instance from context.locals
 * @param userId - The user ID to update the profile for
 * @param payload - Partial profile update data (UpdateProfileRequestDTO)
 * @returns ProfileDTO with updated profile and recalculated card count, or null if not found
 * @throws ProfileServiceError for validation or database errors
 *
 * @example
 * try {
 *   const updated = await updateProfile(supabase, userId, {
 *     onboarding_completed: true,
 *     favorite_type: "water"
 *   });
 *   if (!updated) {
 *     return new Response(JSON.stringify({ error: { code: "NOT_FOUND", message: "Profile not found" } }), { status: 404 });
 *   }
 *   return new Response(JSON.stringify(updated), { status: 200 });
 * } catch (error) {
 *   if (error instanceof ProfileServiceError) {
 *     return new Response(JSON.stringify(error.toErrorResponse()), { status: error.statusCode });
 *   }
 *   throw error;
 * }
 */
export async function updateProfile(
  supabase: SupabaseClient,
  userId: string,
  payload: UpdateProfileRequestDTO
): Promise<ProfileDTO | null> {
  try {
    // Step 1: Validate favorite_set if provided and not null
    if (payload.favorite_set !== undefined && payload.favorite_set !== null) {
      const { data: setExists, error: setError } = await supabase
        .from("sets")
        .select("id", { count: "exact" })
        .eq("id", payload.favorite_set)
        .maybeSingle();

      if (setError) {
        // eslint-disable-next-line no-console
        console.error("Set validation query error:", {
          code: setError.code,
          message: setError.message,
          userId,
          favorite_set: payload.favorite_set,
        });

        throw new ProfileServiceError(ProfileErrorCodes.INTERNAL_ERROR, "Failed to validate favorite_set", 500, {
          field: "favorite_set",
          code: setError.code,
        });
      }

      if (!setExists) {
        // eslint-disable-next-line no-console
        console.error("favorite_set not found:", {
          userId,
          favorite_set: payload.favorite_set,
        });

        throw new ProfileServiceError(
          ProfileErrorCodes.VALIDATION_ERROR,
          `Set with ID "${payload.favorite_set}" does not exist`,
          400,
          {
            field: "favorite_set",
            value: payload.favorite_set,
          }
        );
      }
    }

    // Step 2: Build update payload with only provided fields
    const updatePayload: Record<string, unknown> = {};

    if (payload.onboarding_completed !== undefined) {
      updatePayload.onboarding_completed = payload.onboarding_completed;
    }

    if (payload.favorite_type !== undefined) {
      updatePayload.favorite_type = payload.favorite_type; // Can be null to clear
    }

    if (payload.favorite_set !== undefined) {
      updatePayload.favorite_set = payload.favorite_set; // Can be null to clear
    }

    // Step 3: Update profile in database
    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update(updatePayload)
      .eq("id", userId)
      .select("*")
      .single();

    // Handle Supabase errors
    if (updateError) {
      // PGRST116 is the "no rows found" error code
      if (updateError.code === "PGRST116") {
        return null;
      }

      // Log the actual error for debugging
      const errorDetails = {
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        userId,
      };

      // eslint-disable-next-line no-console
      console.error("Profile update error:", errorDetails);

      throw new ProfileServiceError(ProfileErrorCodes.INTERNAL_ERROR, "Failed to update profile", 500, errorDetails);
    }

    // If profile doesn't exist, return null
    if (!updatedProfile) {
      // eslint-disable-next-line no-console
      console.error("Profile update returned null for userId:", userId);
      return null;
    }

    // Step 4: Rehydrate total_cards_count
    const { data: cardCountResult, error: cardCountError } = await supabase
      .from("user_cards")
      .select("quantity", { count: "exact" })
      .eq("user_id", userId);

    // Handle card count query errors (non-critical; use profile value as fallback)
    if (cardCountError) {
      // eslint-disable-next-line no-console
      console.warn("Card count aggregation warning:", {
        code: cardCountError.code,
        userId,
      });

      // Return profile with existing total_cards_count value
      return updatedProfile;
    }

    // Calculate total quantity from all user cards
    const totalCardsCount = cardCountResult?.reduce((sum, card) => sum + (card.quantity || 0), 0) || 0;

    // Return profile with updated total_cards_count from aggregation
    return {
      ...updatedProfile,
      total_cards_count: totalCardsCount,
    };
  } catch (error) {
    // Re-throw ProfileServiceError
    if (error instanceof ProfileServiceError) {
      throw error;
    }

    // Handle unexpected errors
    throw new ProfileServiceError(
      ProfileErrorCodes.INTERNAL_ERROR,
      "An unexpected error occurred while updating profile",
      500,
      { error: error instanceof Error ? error.message : "Unknown error" }
    );
  }
}
