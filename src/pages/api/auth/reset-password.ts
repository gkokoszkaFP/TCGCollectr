/**
 * POST /api/auth/reset-password
 *
 * Request a password reset email for the provided email address.
 * Uses rate limiting (per-IP and per-email) to prevent abuse.
 * Always returns 200 on valid shape to prevent email enumeration.
 *
 * Rate Limits:
 * - Per-IP: 3 requests per 15 minutes
 * - Per-Email: 3 requests per 15 minutes
 *
 * @example
 * POST /api/auth/reset-password
 * Content-Type: application/json
 *
 * { "email": "user@example.com" }
 *
 * Response (200):
 * { "message": "Password reset email sent" }
 *
 * Response (400 - Validation Error):
 * {
 *   "error": {
 *     "code": "VALIDATION_ERROR",
 *     "message": "Invalid request",
 *     "details": { "email": ["Invalid email format"] }
 *   }
 * }
 *
 * Response (429 - Rate Limited):
 * {
 *   "error": {
 *     "code": "RATE_LIMIT_EXCEEDED",
 *     "message": "Too many requests",
 *     "details": { "retryAfter": 300 }
 *   }
 * }
 */

import type { APIContext } from "astro";
import { resetPasswordSchema } from "../../../lib/validation/auth.schema";
import { requestPasswordReset } from "../../../lib/services/auth.service";
import { ensureRateLimit } from "../../../lib/services/rate-limit.service";
import { getClientIp, createErrorResponse } from "../../../lib/utils/api-helpers";
import type { ResetPasswordCommand, MessageResponseDTO } from "../../../types";

// Disable static rendering for this endpoint
export const prerender = false;

/**
 * POST handler for password reset request
 *
 * Flow:
 * 1. Extract and normalize client IP
 * 2. Parse request body
 * 3. Validate against resetPasswordSchema
 * 4. Check IP-based rate limit (3 req / 15 min)
 * 5. Check email-based rate limit (3 req / 15 min)
 * 6. Build ResetPasswordCommand with config-based redirectTo
 * 7. Call auth service to trigger Supabase reset email
 * 8. Return 200 success (always, to prevent enumeration)
 * 9. Optionally track event in analytics (fire-and-forget)
 */
export async function POST(context: APIContext): Promise<Response> {
  try {
    // Step 1: Extract client IP
    const clientIp = getClientIp(context.request);
    const userAgent = context.request.headers.get("user-agent") || undefined;

    // Step 2: Parse request body
    let parsedBody: unknown;
    try {
      parsedBody = await context.request.json();
    } catch {
      return createErrorResponse("VALIDATION_ERROR", "Invalid JSON in request body", 400, {
        details: "Request body must be valid JSON",
      });
    }

    // Step 3: Validate input
    const validationResult = resetPasswordSchema.safeParse(parsedBody);
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      return createErrorResponse("VALIDATION_ERROR", "Invalid request parameters", 400, {
        details: fieldErrors,
      });
    }

    const { email } = validationResult.data;

    // Step 4: Check IP-based rate limit (3 requests per 15 minutes)
    const ipLimitResult = ensureRateLimit({
      key: `reset-password-ip:${clientIp}`,
      limit: 3,
      windowMs: 900000, // 15 minutes
    });

    if (!ipLimitResult.allowed) {
      return createErrorResponse(
        "RATE_LIMIT_EXCEEDED",
        "Too many password reset requests from your IP. Please try again later.",
        429,
        { retryAfter: ipLimitResult.retryAfter }
      );
    }

    // Step 5: Check email-based rate limit (3 requests per 15 minutes)
    const emailLimitResult = ensureRateLimit({
      key: `reset-password-email:${email}`,
      limit: 3,
      windowMs: 900000, // 15 minutes
    });

    if (!emailLimitResult.allowed) {
      return createErrorResponse(
        "RATE_LIMIT_EXCEEDED",
        "Too many password reset requests for this email. Please try again later.",
        429,
        { retryAfter: emailLimitResult.retryAfter }
      );
    }

    // Step 6: Build command with config-based redirectTo URL
    const siteUrl = import.meta.env.PUBLIC_SITE_URL || "http://localhost:3000";
    const redirectTo = `${siteUrl}/auth/reset-password-confirm`;

    const command: ResetPasswordCommand = {
      email,
      ipAddress: clientIp,
      userAgent,
      redirectTo,
    };

    // Step 7: Call auth service to trigger reset email
    // This silently handles errors to prevent enumeration
    await requestPasswordReset(command, context.locals.supabase);

    // Step 8: Return success response (always 200 to prevent enumeration)
    const response: MessageResponseDTO = {
      message: "Password reset email sent",
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error({
      event: "reset_password_endpoint_error",
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return createErrorResponse("INTERNAL_ERROR", "An unexpected error occurred. Please try again later.", 500);
  }
}
