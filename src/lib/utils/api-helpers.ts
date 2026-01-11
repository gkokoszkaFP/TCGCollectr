/**
 * Shared utility functions for API endpoints
 *
 * This module provides reusable helper functions for common API operations
 * including IP extraction, error response formatting, and data hashing.
 */

import type { ErrorResponseDTO } from "../../types";

/**
 * Extract client IP address from request headers
 * Handles various proxy headers and falls back to "unknown"
 *
 * @param request - Incoming request object
 * @returns Client IP address string
 */
export function getClientIp(request: Request): string {
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
 *
 * @param code - Error code for identification
 * @param message - Human-readable error message
 * @param statusCode - HTTP status code
 * @param details - Optional additional error details
 * @returns Response object with error payload
 */
export function createErrorResponse(
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
 * Create a SHA-256 hash of a string for anonymization
 * Useful for hashing IP addresses before storing in analytics
 *
 * @param input - String to hash
 * @returns Hexadecimal hash string
 */
export async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Parse and extract Bearer token from Authorization header
 * Returns null if header is missing or malformed
 *
 * @param authHeader - Authorization header value (e.g., "Bearer <token>")
 * @returns Token string or null if invalid
 */
export function parseBearerToken(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0]?.toLowerCase() !== "bearer") {
    return null;
  }

  const token = parts[1]?.trim();
  return token || null;
}
