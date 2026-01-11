/**
 * POST /api/auth/update-password
 *
 * Password update endpoint that allows users to update their password using a recovery token.
 * The recovery token is obtained from a password reset email sent via reset-password endpoint.
 *
 * Features:
 * - Bearer token validation from Authorization header
 * - Password strength validation with Zod
 * - Supabase Auth session setup with recovery token
 * - Password update through authenticated session
 * - Comprehensive error handling for token validity and password policy
 * - Explicit no-store cache control for sensitive auth operations
 *
 * Response codes:
 * - 200: Password updated successfully
 * - 400: Validation error (missing/malformed header or invalid password)
 * - 401: Invalid or expired recovery token
 * - 500: Internal server error
 */

import type { APIContext } from "astro";
import { updatePasswordSchema } from "../../../lib/validation/auth.schema";
import { createErrorResponse, parseBearerToken } from "../../../lib/utils/api-helpers";
import type { UpdatePasswordRequestDTO } from "../../../types";

// Disable static prerendering for this API route
export const prerender = false;

/**
 * Error codes for update password endpoint
 */
enum UpdatePasswordErrorCodes {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  UNAUTHORIZED = "UNAUTHORIZED",
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

/**
 * POST handler for updating user password with recovery token
 */
export async function POST(context: APIContext): Promise<Response> {
  const { request, locals } = context;
  const supabase = locals.supabase;

  try {
    // Step 1: Extract and validate Authorization header
    const authHeader = request.headers.get("Authorization");
    const token = parseBearerToken(authHeader);

    if (!token) {
      return createErrorResponse(
        UpdatePasswordErrorCodes.VALIDATION_ERROR,
        "Missing or invalid Authorization header. Expected format: 'Bearer <token>'",
        400,
        { field: "Authorization" }
      );
    }

    // Step 2: Parse and validate request body
    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch {
      return createErrorResponse(UpdatePasswordErrorCodes.VALIDATION_ERROR, "Invalid JSON in request body", 400);
    }

    const validationResult = updatePasswordSchema.safeParse(requestBody);
    if (!validationResult.success) {
      const fieldErrors: Record<string, string[]> = {};
      validationResult.error.errors.forEach((error) => {
        const field = error.path.join(".");
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        fieldErrors[field].push(error.message);
      });

      return createErrorResponse(UpdatePasswordErrorCodes.VALIDATION_ERROR, "Validation failed", 400, {
        fields: fieldErrors,
      });
    }

    const updateRequest: UpdatePasswordRequestDTO = {
      password: validationResult.data.password,
    };

    // Step 3: Set Supabase auth session with recovery token
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: token,
    });

    if (sessionError) {
      // eslint-disable-next-line no-console
      console.error("Session setup failed:", sessionError.message);
      return createErrorResponse(UpdatePasswordErrorCodes.UNAUTHORIZED, "Invalid or expired token", 401);
    }

    // Verify token validity by fetching user
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      // eslint-disable-next-line no-console
      console.error("Token verification failed:", userError?.message || "User not found");
      return createErrorResponse(UpdatePasswordErrorCodes.UNAUTHORIZED, "Invalid or expired token", 401);
    }

    // Step 4: Update password through Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({
      password: updateRequest.password,
    });

    if (updateError) {
      // Map specific Supabase error messages to appropriate status codes
      const errorMessage = updateError.message.toLowerCase();
      if (
        errorMessage.includes("expired") ||
        errorMessage.includes("invalid") ||
        errorMessage.includes("not allowed")
      ) {
        // eslint-disable-next-line no-console
        console.error("Password update rejected by Supabase:", updateError.message);
        return createErrorResponse(UpdatePasswordErrorCodes.UNAUTHORIZED, "Invalid or expired token", 401);
      }

      // Generic server error for unexpected Supabase errors
      // eslint-disable-next-line no-console
      console.error("Unexpected password update error:", updateError.message);
      return createErrorResponse(
        UpdatePasswordErrorCodes.INTERNAL_ERROR,
        "An unexpected error occurred while updating password",
        500
      );
    }

    // Step 5: Return success response
    return new Response(
      JSON.stringify({
        message: "Password updated successfully",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("Unexpected error in update-password endpoint:", error);
    return createErrorResponse(
      UpdatePasswordErrorCodes.INTERNAL_ERROR,
      "An unexpected error occurred during password update",
      500
    );
  }
}
