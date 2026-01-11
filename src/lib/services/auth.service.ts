/**
 * Authentication service for user registration and login operations
 *
 * This module provides business logic for authentication operations using Supabase Auth.
 * It handles error normalization, response mapping to DTOs, and ensures consistent
 * error handling across all authentication endpoints.
 */

import type { AuthResponseDTO, ErrorResponseDTO, RegisterCommand, LoginCommand } from "../../types";
import type { SupabaseClient } from "../../db/supabase.client";

/**
 * Error codes for authentication operations
 */
export const AuthErrorCodes = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  EMAIL_EXISTS: "EMAIL_EXISTS",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  WEAK_PASSWORD: "WEAK_PASSWORD",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  ALREADY_AUTHENTICATED: "ALREADY_AUTHENTICATED",
  UNAUTHORIZED: "UNAUTHORIZED",
} as const;

/**
 * Custom error class for authentication operations
 */
export class AuthServiceError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AuthServiceError";
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
 * Register a new user with Supabase Auth
 *
 * This function:
 * 1. Calls Supabase auth.signUp with normalized email and password
 * 2. Waits for the profile trigger to create the profiles entry
 * 3. Maps the response to AuthResponseDTO format
 * 4. Normalizes Supabase errors to application error codes
 *
 * @param command - Registration command with validated email and password
 * @param supabase - Supabase client instance from context.locals
 * @returns AuthResponseDTO with user and session data
 * @throws AuthServiceError for various failure scenarios
 *
 * @example
 * try {
 *   const response = await AuthService.registerUser(command, supabase);
 *   return new Response(JSON.stringify(response), { status: 201 });
 * } catch (error) {
 *   if (error instanceof AuthServiceError) {
 *     return new Response(JSON.stringify(error.toErrorResponse()), {
 *       status: error.statusCode
 *     });
 *   }
 *   throw error;
 * }
 */
export async function registerUser(command: RegisterCommand, supabase: SupabaseClient): Promise<AuthResponseDTO> {
  try {
    // Call Supabase auth.signUp
    const { data, error } = await supabase.auth.signUp({
      email: command.email,
      password: command.password,
      options: {
        data: {
          ip_address: command.ipAddress,
          user_agent: command.userAgent,
        },
      },
    });

    // Handle Supabase errors
    if (error) {
      // Check for duplicate email error
      if (
        error.message.toLowerCase().includes("already registered") ||
        error.message.toLowerCase().includes("already exists") ||
        error.message.toLowerCase().includes("duplicate")
      ) {
        throw new AuthServiceError(
          AuthErrorCodes.EMAIL_EXISTS,
          "An account with this email address already exists",
          409
        );
      }

      // Check for weak password error
      if (
        error.message.toLowerCase().includes("password") &&
        (error.message.toLowerCase().includes("weak") ||
          error.message.toLowerCase().includes("short") ||
          error.message.toLowerCase().includes("must contain"))
      ) {
        throw new AuthServiceError(AuthErrorCodes.WEAK_PASSWORD, error.message, 400, { originalError: error.message });
      }

      // Generic Supabase error
      throw new AuthServiceError(AuthErrorCodes.INTERNAL_ERROR, "Failed to register user. Please try again.", 500, {
        originalError: error.message,
      });
    }

    // Validate that we got user and session data
    if (!data.user || !data.session) {
      throw new AuthServiceError(
        AuthErrorCodes.INTERNAL_ERROR,
        "Registration succeeded but session data is incomplete",
        500
      );
    }

    // Map to AuthResponseDTO
    const response: AuthResponseDTO = {
      user: {
        id: data.user.id,
        email: data.user.email || command.email,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at || 0,
      },
    };

    return response;
  } catch (error) {
    // Re-throw AuthServiceError as-is
    if (error instanceof AuthServiceError) {
      throw error;
    }

    // Handle unexpected errors
    throw new AuthServiceError(AuthErrorCodes.INTERNAL_ERROR, "An unexpected error occurred during registration", 500);
  }
}

/**
 * Check if a user is already authenticated
 *
 * @param supabase - Supabase client instance from context.locals
 * @returns User ID if authenticated, null otherwise
 */
export async function getCurrentUser(supabase: SupabaseClient): Promise<string | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id || null;
  } catch {
    return null;
  }
}

/**
 * Login a user with Supabase Auth
 *
 * This function:
 * 1. Calls Supabase auth.signInWithPassword with email and password
 * 2. Maps the response to AuthResponseDTO format
 * 3. Normalizes Supabase errors to application error codes
 *
 * @param command - Login command with validated email and password
 * @param supabase - Supabase client instance from context.locals
 * @returns AuthResponseDTO with user and session data
 * @throws AuthServiceError for various failure scenarios
 *
 * @example
 * try {
 *   const response = await loginUser(command, supabase);
 *   return new Response(JSON.stringify(response), { status: 200 });
 * } catch (error) {
 *   if (error instanceof AuthServiceError) {
 *     return new Response(JSON.stringify(error.toErrorResponse()), {
 *       status: error.statusCode
 *     });
 *   }
 *   throw error;
 * }
 */
export async function loginUser(command: LoginCommand, supabase: SupabaseClient): Promise<AuthResponseDTO> {
  try {
    // Call Supabase auth.signInWithPassword
    const { data, error } = await supabase.auth.signInWithPassword({
      email: command.email,
      password: command.password,
    });

    // Handle Supabase errors
    if (error) {
      // Check for invalid credentials error
      // Use generic message to prevent account enumeration
      if (
        error.message.toLowerCase().includes("invalid") ||
        error.message.toLowerCase().includes("credentials") ||
        error.message.toLowerCase().includes("not found") ||
        error.message.toLowerCase().includes("incorrect")
      ) {
        throw new AuthServiceError(AuthErrorCodes.INVALID_CREDENTIALS, "Invalid email or password", 401);
      }

      // Generic Supabase error
      throw new AuthServiceError(AuthErrorCodes.INTERNAL_ERROR, "Failed to authenticate user. Please try again.", 500, {
        originalError: error.message,
      });
    }

    // Validate that we got user and session data
    if (!data.user || !data.session) {
      throw new AuthServiceError(
        AuthErrorCodes.INTERNAL_ERROR,
        "Authentication succeeded but session data is incomplete",
        500
      );
    }

    // Map to AuthResponseDTO
    const response: AuthResponseDTO = {
      user: {
        id: data.user.id,
        email: data.user.email || command.email,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at || 0,
      },
    };

    return response;
  } catch (error) {
    // Re-throw AuthServiceError as-is
    if (error instanceof AuthServiceError) {
      throw error;
    }

    // Handle unexpected errors
    throw new AuthServiceError(
      AuthErrorCodes.INTERNAL_ERROR,
      "An unexpected error occurred during authentication",
      500
    );
  }
}

/**
 * Logout a user by revoking their Supabase session
 *
 * This function:
 * 1. Sets the auth token in the Supabase client
 * 2. Calls supabase.auth.signOut() to revoke the session
 * 3. Handles Supabase errors and maps them to application error codes
 *
 * @param token - JWT access token to revoke
 * @param supabase - Supabase client instance from context.locals
 * @returns Promise<void> on success
 * @throws AuthServiceError for invalid or expired tokens
 *
 * @example
 * try {
 *   await logoutUser(accessToken, supabase);
 *   return new Response(JSON.stringify({ message: "Successfully logged out" }), { status: 200 });
 * } catch (error) {
 *   if (error instanceof AuthServiceError) {
 *     return new Response(JSON.stringify(error.toErrorResponse()), {
 *       status: error.statusCode
 *     });
 *   }
 *   throw error;
 * }
 */
export async function logoutUser(token: string, supabase: SupabaseClient): Promise<void> {
  try {
    // Revoke the session using the access token
    const { error } = await supabase.auth.signOut({ scope: "global" });

    if (error) {
      // Treat any signOut error as an authorization error
      throw new AuthServiceError(AuthErrorCodes.UNAUTHORIZED, "Token is invalid or expired", 401);
    }
  } catch (error) {
    // Re-throw AuthServiceError as-is
    if (error instanceof AuthServiceError) {
      throw error;
    }

    // Handle unexpected errors
    throw new AuthServiceError(AuthErrorCodes.INTERNAL_ERROR, "An unexpected error occurred during logout", 500);
  }
}
