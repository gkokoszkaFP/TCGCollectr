/**
 * Validation schemas for profile endpoints
 *
 * This module defines Zod schemas for validating profile-related requests.
 * These schemas enforce business rules for profile updates including favorite type
 * validation against canonical Pokémon TCG types and set existence checks.
 */

import { z } from "zod";

/**
 * Valid Pokémon TCG card types
 * Based on official Pokémon TCG type definitions
 */
export const VALID_POKEMON_TYPES = [
  "fire",
  "water",
  "grass",
  "lightning",
  "psychic",
  "fighting",
  "darkness",
  "metal",
  "fairy",
  "dragon",
  "colorless",
  "unknown",
] as const;

/**
 * Validation schema for updating user profile
 *
 * Rules:
 * - onboarding_completed: optional boolean flag
 * - favorite_type: optional string that must match canonical Pokémon TCG types or null
 * - favorite_set: optional trimmed string that must reference existing set ID or null
 * - At least one updatable field must be provided (validated via refine)
 * - Empty payloads return validation error
 */
export const updateProfileSchema = z
  .object({
    onboarding_completed: z.boolean().optional(),
    favorite_type: z
      .string()
      .toLowerCase()
      .refine((val) => VALID_POKEMON_TYPES.includes(val as never), {
        message: `favorite_type must be one of: ${VALID_POKEMON_TYPES.join(", ")}`,
      })
      .optional()
      .nullable(),
    favorite_set: z.string().trim().optional().nullable(),
  })
  .refine(
    (data) => {
      // Ensure at least one field is provided
      return (
        data.onboarding_completed !== undefined || data.favorite_type !== undefined || data.favorite_set !== undefined
      );
    },
    {
      message: "At least one of onboarding_completed, favorite_type, or favorite_set must be provided",
    }
  );

/**
 * Inferred TypeScript type from schema
 */
export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;
