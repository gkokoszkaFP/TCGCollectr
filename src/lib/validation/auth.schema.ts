/**
 * Validation schemas for authentication endpoints
 *
 * This module defines Zod schemas for validating authentication-related requests.
 * These schemas enforce business rules for email format, password strength, and
 * ensure data consistency before processing authentication operations.
 */

import { z } from "zod";

/**
 * Password validation regex
 * Requires at least one uppercase, one lowercase, one digit, and one symbol
 */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

/**
 * Validation schema for user registration
 *
 * Rules:
 * - Email: must be valid email format, trimmed, max 254 chars, normalized to lowercase
 * - Password: 12-72 chars, must contain uppercase, lowercase, digit, and symbol
 */
export const registerSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email({ message: "Invalid email format" })
    .max(254, { message: "Email must not exceed 254 characters" })
    .toLowerCase()
    .transform((val) => val.toLowerCase()),
  password: z
    .string({ required_error: "Password is required" })
    .min(12, { message: "Password must be at least 12 characters" })
    .max(72, { message: "Password must not exceed 72 characters" })
    .regex(PASSWORD_REGEX, {
      message: "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one symbol",
    }),
});

/**
 * Validation schema for user login
 *
 * Rules:
 * - Email: must be valid email format, trimmed, normalized to lowercase
 * - Password: required string (no complexity check on login)
 */
export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email({ message: "Invalid email format" })
    .toLowerCase()
    .transform((val) => val.toLowerCase()),
  password: z.string({ required_error: "Password is required" }),
});

/**
 * Validation schema for password reset request
 *
 * Rules:
 * - Email: must be valid email format, trimmed, normalized to lowercase
 */
export const resetPasswordSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email({ message: "Invalid email format" })
    .toLowerCase()
    .transform((val) => val.toLowerCase()),
});

/**
 * Validation schema for password update
 *
 * Rules:
 * - Password: 12-72 chars, must contain uppercase, lowercase, digit, and symbol
 */
export const updatePasswordSchema = z.object({
  password: z
    .string({ required_error: "Password is required" })
    .min(12, { message: "Password must be at least 12 characters" })
    .max(72, { message: "Password must not exceed 72 characters" })
    .regex(PASSWORD_REGEX, {
      message: "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one symbol",
    }),
});

/**
 * Inferred TypeScript types from schemas
 */
export type RegisterSchema = z.infer<typeof registerSchema>;
export type LoginSchema = z.infer<typeof loginSchema>;
export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordSchema = z.infer<typeof updatePasswordSchema>;
