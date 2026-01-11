/**
 * POST /api/auth/register
 *
 * User registration endpoint that creates a new Supabase Auth user and profile.
 *
 * Features:
 * - IP-based rate limiting (5 requests per minute)
 * - Email and password validation with Zod
 * - Prevents re-registration by authenticated users
 * - Analytics event tracking for successful registrations
 * - Comprehensive error handling with standardized responses
 *
 * Response codes:
 * - 201: Registration successful, returns user and session data
 * - 400: Validation error or already authenticated
 * - 409: Email already exists
 * - 429: Rate limit exceeded
 * - 500: Internal server error
 */

import type { APIContext } from "astro";
import { registerSchema } from "../../../lib/validation/auth.schema";
import { ensureRateLimit } from "../../../lib/services/rate-limit.service";
import { registerUser, getCurrentUser, AuthServiceError, AuthErrorCodes } from "../../../lib/services/auth.service";
import type { ErrorResponseDTO, RegisterCommand } from "../../../types";
import type { SupabaseClient } from "../../../db/supabase.client";

// Disable static prerendering for this API route
export const prerender = false;

/**
 * Rate limiting configuration for registration endpoint
 * 5 requests per minute per IP address
 */
const RATE_LIMIT_CONFIG = {
  limit: 5,
  windowMs: 60000, // 1 minute
};

/**
 * Extract client IP address from request headers
 * Handles various proxy headers and falls back to "unknown"
 */
function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

/**
 * Create standardized error response
 */
function createErrorResponse(
  code: string,
  message: string,
  statusCode: number,
  details?: Record<string, unknown>
): Response {
  const errorResponse: ErrorResponseDTO = {
    error: {
      code,
      message,
      details,
    },
  };

  return new Response(JSON.stringify(errorResponse), {
    status: statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

/**
 * POST handler for user registration
 */
export async function POST(context: APIContext): Promise<Response> {
  const { request, locals } = context;
  const supabase = locals.supabase;

  try {
    // Step 1: Extract client IP and apply rate limiting
    const clientIp = getClientIp(request);
    const rateLimitResult = ensureRateLimit({
      key: `register:${clientIp}`,
      ...RATE_LIMIT_CONFIG,
    });

    if (!rateLimitResult.allowed) {
      return createErrorResponse(
        "RATE_LIMIT_EXCEEDED",
        "Too many registration attempts. Please try again later.",
        429,
        {
          retryAfter: rateLimitResult.retryAfter || 60,
        }
      );
    }

    // Step 2: Check if user is already authenticated
    const currentUserId = await getCurrentUser(supabase);
    if (currentUserId) {
      return createErrorResponse(
        AuthErrorCodes.ALREADY_AUTHENTICATED,
        "You are already authenticated. Please log out before creating a new account.",
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

    const validationResult = registerSchema.safeParse(requestBody);
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

    // Step 4: Build RegisterCommand
    const command: RegisterCommand = {
      email: validationResult.data.email,
      password: validationResult.data.password,
      ipAddress: clientIp,
      userAgent: request.headers.get("user-agent") || undefined,
    };

    // Step 5: Register user via AuthService
    const authResponse = await registerUser(command, supabase);

    // Step 6: Track analytics event (fire-and-forget)
    trackRegistrationEvent(supabase, authResponse.user.id, clientIp, command.userAgent).catch(() => {
      // Silently ignore analytics tracking errors
    });

    // Step 7: Return success response
    return new Response(JSON.stringify(authResponse), {
      status: 201,
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
    return createErrorResponse(AuthErrorCodes.INTERNAL_ERROR, "An unexpected error occurred during registration", 500);
  }
}

/**
 * Track registration analytics event
 * This is a fire-and-forget operation that should not block the registration response
 */
async function trackRegistrationEvent(
  supabase: SupabaseClient,
  userId: string,
  ipAddress: string,
  userAgent?: string
): Promise<void> {
  // Create anonymized IP hash for privacy
  const ipHash = await hashString(ipAddress);

  await supabase.from("analytics_events").insert({
    user_id: userId,
    event_type: "user_registered",
    event_data: {
      ip_hash: ipHash,
      user_agent: userAgent,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Create a simple hash of a string for anonymization
 * Uses SubtleCrypto API for SHA-256 hashing
 */
async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
