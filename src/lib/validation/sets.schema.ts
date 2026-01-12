/**
 * Validation schemas for sets endpoints
 *
 * This module defines Zod schemas for validating query parameters for the sets listing endpoint.
 * These schemas enforce business rules including pagination boundaries, valid sort/order values,
 * and optional filtering parameters.
 */

import { z } from "zod";

/**
 * Valid sort options for sets listing
 */
export const VALID_SORT_OPTIONS = ["name", "release_date", "series"] as const;

/**
 * Valid order options
 */
export const VALID_ORDER_OPTIONS = ["asc", "desc"] as const;

/**
 * Validation schema for GET /api/sets query parameters
 *
 * Rules:
 * - page: optional positive integer, minimum 1 (defaults to 1)
 * - limit: optional integer between 1 and 100 (defaults to 20)
 * - sort: optional enum value from VALID_SORT_OPTIONS (defaults to 'name')
 * - order: optional enum value from VALID_ORDER_OPTIONS (defaults to 'asc')
 * - search: optional trimmed non-empty string for partial name matching
 * - series: optional trimmed non-empty string for exact series matching
 *
 * Type coercion is applied for numeric strings to prevent validation errors
 * from query string parameters which are always strings.
 */
export const getSetsQuerySchema = z.object({
  page: z
    .union([z.number(), z.string()])
    .transform((val) => {
      const num = typeof val === "string" ? parseInt(val, 10) : val;
      if (!Number.isInteger(num) || num < 1) {
        throw new Error("page must be an integer >= 1");
      }
      return num;
    })
    .default(1)
    .optional(),
  limit: z
    .union([z.number(), z.string()])
    .transform((val) => {
      const num = typeof val === "string" ? parseInt(val, 10) : val;
      if (!Number.isInteger(num) || num < 1 || num > 100) {
        throw new Error("limit must be an integer between 1 and 100");
      }
      return num;
    })
    .default(20)
    .optional(),
  sort: z.enum(VALID_SORT_OPTIONS).default("name").optional(),
  order: z
    .enum(VALID_ORDER_OPTIONS)
    .transform((val) => val.toLowerCase() as "asc" | "desc")
    .default("asc")
    .optional(),
  search: z.string().trim().min(1, "search must not be empty").optional(),
  series: z.string().trim().min(1, "series must not be empty").optional(),
});

/**
 * Type definition for validated query parameters
 * Inferred from the schema for type safety
 */
export type GetSetsQuery = z.infer<typeof getSetsQuerySchema>;

/**
 * Validation schema for GET /api/sets/:setId path parameter
 *
 * Rules:
 * - setId: required non-empty string matching set ID format (letters, numbers, dots, underscores, dashes)
 *   This prevents malformed input and SQL injection via parameterized queries
 */
export const getSetParamsSchema = z.object({
  setId: z
    .string()
    .min(1, "setId must not be empty")
    .regex(/^[A-Za-z0-9._-]+$/, "setId format is invalid"),
});

/**
 * Type definition for validated path parameters
 * Inferred from the schema for type safety
 */
export type GetSetParams = z.infer<typeof getSetParamsSchema>;
