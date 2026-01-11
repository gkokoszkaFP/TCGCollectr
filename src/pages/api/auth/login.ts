/**
 * POST /api/auth/login
 *
 * User login endpoint that authenticates existing Supabase Auth users.
 *
 * Features:
 * - IP-based rate limiting (5 requests per 15 minutes)
 * - Email and password validation with Zod
 * - Prevents duplicate logins by authenticated users
 * - Analytics event tracking for successful logins
 * - Comprehensive error handling with standardized responses
 *
 * Response codes:
 * - 200: Login successful, returns user and session data
 * - 400: Validation error or already authenticated
 * - 401: Invalid credentials
 * - 429: Rate limit exceeded
 * - 500: Internal server error
 */

import type { APIContext } from "astro";
import { loginSchema } from "../../../lib/validation/auth.schema";
import { ensureRateLimit } from "../../../lib/services/rate-limit.service";
import { loginUser, getCurrentUser, AuthServiceError, AuthErrorCodes } from "../../../lib/services/auth.service";
import type { LoginCommand } from "../../../types";
import type { SupabaseClient } from "../../../db/supabase.client";
import { getClientIp, createErrorResponse, hashString } from "../../../lib/utils/api-helpers";

// Disable static prerendering for this API route
export const prerender = false;

/**
 * Rate limiting configuration for login endpoint
 * 5 requests per 15 minutes per IP address (stricter than registration)
 */
const RATE_LIMIT_CONFIG = {
  limit: 5,
  windowMs: 900000, // 15 minutes
};

/**
 * POST handler for user login
 */
export async function POST(context: APIContext): Promise<Response> {
  const { request, locals } = context;
  const supabase = locals.supabase;

  try {
    // Step 1: Extract client IP and apply rate limiting
    const clientIp = getClientIp(request);
    const rateLimitResult = ensureRateLimit({
      key: `login:${clientIp}`,
      ...RATE_LIMIT_CONFIG,
    });

    if (!rateLimitResult.allowed) {
      return createErrorResponse("RATE_LIMIT_EXCEEDED", "Too many login attempts. Please try again later.", 429, {
        retryAfter: rateLimitResult.retryAfter || 900, // 15 minutes in seconds
      });
    }

    // Step 2: Check if user is already authenticated (optional flow)
    // This prevents creating duplicate sessions but can be disabled if needed
    const currentUserId = await getCurrentUser(supabase);
    if (currentUserId) {
      return createErrorResponse(
        AuthErrorCodes.ALREADY_AUTHENTICATED,
        "You are already authenticated. Please log out before logging in again.",
        400
      );
    }

    // Step 3: Parse and validate request body
    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch {
      return createErrorResponse(AuthErrorCodes.VALIDATION_ERROR, "Invalid JSON in request body", 400);
    }

    const validationResult = loginSchema.safeParse(requestBody);
    if (!validationResult.success) {
      const fieldErrors: Record<string, string[]> = {};
      validationResult.error.errors.forEach((error) => {
        const field = error.path.join(".");
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        fieldErrors[field].push(error.message);
      });

      return createErrorResponse(AuthErrorCodes.VALIDATION_ERROR, "Validation failed", 400, { fields: fieldErrors });
    }

    // Step 4: Build LoginCommand
    const command: LoginCommand = {
      email: validationResult.data.email,
      password: validationResult.data.password,
      ipAddress: clientIp,
      userAgent: request.headers.get("user-agent") || undefined,
    };

    // Step 5: Login user via AuthService
    const authResponse = await loginUser(command, supabase);

    // Step 6: Track analytics event (fire-and-forget)
    trackLoginEvent(supabase, authResponse.user.id, clientIp, command.userAgent).catch(() => {
      // Silently ignore analytics tracking errors
    });

    // Step 7: Return success response
    return new Response(JSON.stringify(authResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    // Handle AuthServiceError
    if (error instanceof AuthServiceError) {
      return new Response(JSON.stringify(error.toErrorResponse()), {
        status: error.statusCode,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      });
    }

    // Handle unexpected errors
    return createErrorResponse(AuthErrorCodes.INTERNAL_ERROR, "An unexpected error occurred during login", 500);
  }
}

/**
 * Track login analytics event
 * This is a fire-and-forget operation that should not block the login response
 */
async function trackLoginEvent(
  supabase: SupabaseClient,
  userId: string,
  ipAddress: string,
  userAgent?: string
): Promise<void> {
  // Create anonymized IP hash for privacy
  const ipHash = await hashString(ipAddress);

  await supabase.from("analytics_events").insert({
    user_id: userId,
    event_type: "user_login",
    event_data: {
      ip_hash: ipHash,
      user_agent: userAgent,
      timestamp: new Date().toISOString(),
    },
  });
}
