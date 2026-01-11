/**
 * Data Transfer Objects (DTOs) and Command Models for TCGCollectr API
 *
 * This file contains all type definitions for API requests and responses.
 * All DTOs are derived from database entity types defined in database.types.ts
 */

import type { Tables } from "./db/database.types";

// =============================================================================
// AUTHENTICATION DTOs
// =============================================================================

/**
 * Request body for user registration
 */
export interface RegisterRequestDTO {
  email: string;
  password: string;
}

/**
 * Request body for user login
 */
export interface LoginRequestDTO {
  email: string;
  password: string;
}

/**
 * User information returned in authentication responses
 * Based on Supabase Auth User model
 */
export interface AuthUserDTO {
  id: string;
  email: string;
}

/**
 * Session information returned in authentication responses
 * Based on Supabase Auth Session model
 */
export interface AuthSessionDTO {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

/**
 * Complete authentication response including user and session data
 */
export interface AuthResponseDTO {
  user: AuthUserDTO;
  session: AuthSessionDTO;
}

/**
 * Request body for password reset
 */
export interface ResetPasswordRequestDTO {
  email: string;
}

/**
 * Request body for updating password
 */
export interface UpdatePasswordRequestDTO {
  password: string;
}

/**
 * Command model for user registration
 * Encapsulates all data needed for registration processing
 */
export interface RegisterCommand {
  email: string;
  password: string;
  ipAddress: string;
  userAgent?: string;
}

/**
 * Command model for user login
 * Encapsulates all data needed for login processing
 */
export interface LoginCommand {
  email: string;
  password: string;
  ipAddress: string;
  userAgent?: string;
}

/**
 * Command model for password reset request
 * Encapsulates all data needed for reset password processing
 */
export interface ResetPasswordCommand {
  email: string;
  ipAddress: string;
  userAgent?: string;
  redirectTo: string;
}

// =============================================================================
// PROFILE DTOs
// =============================================================================

/**
 * User profile response
 * Derived from: Tables<'profiles'>
 */
export type ProfileDTO = Tables<"profiles">;

/**
 * Request body for updating user profile
 * Derived from: Partial pick of profile updatable fields
 */
export interface UpdateProfileRequestDTO {
  onboarding_completed?: boolean;
  favorite_type?: string | null;
  favorite_set?: string | null;
}

// =============================================================================
// SET DTOs
// =============================================================================

/**
 * Card set response for list views
 * Derived from: Tables<'sets'> with selected fields
 */
export type SetDTO = Omit<Tables<"sets">, "created_at" | "updated_at" | "last_synced_at" | "tcg_type">;

/**
 * Detailed card set response including sync metadata
 * Derived from: Tables<'sets'> with tcg_type excluded
 */
export type SetDetailDTO = Omit<Tables<"sets">, "tcg_type">;

/**
 * Set completion progress for a specific user
 * Computed from set data and user collection
 */
export interface SetCompletionDTO {
  set_id: string;
  set_name: string;
  total_cards: number;
  owned_cards: number;
  completion_percentage: number;
}

// =============================================================================
// CARD DTOs
// =============================================================================

/**
 * Card response for list views
 * Derived from: Tables<'cards'> with selected fields
 */
export type CardDTO = Omit<Tables<"cards">, "created_at" | "updated_at" | "last_synced_at" | "tcg_type">;

/**
 * Detailed card response including set information and sync metadata
 * Derived from: Tables<'cards'> + nested SetDTO
 */
export interface CardDetailDTO extends Omit<Tables<"cards">, "tcg_type"> {
  set: SetDTO;
}

/**
 * Query parameters for card search and filtering
 */
export interface CardSearchQueryDTO {
  page?: number;
  limit?: number;
  sort?: "name" | "card_number" | "rarity";
  order?: "asc" | "desc";
  search?: string;
  set_id?: string;
  types?: string;
  rarity?: string;
}

// =============================================================================
// USER CARDS (COLLECTION) DTOs
// =============================================================================

/**
 * User collection entry response
 * Derived from: Tables<'user_cards'> excluding user_id (implied by auth context)
 */
export type UserCardDTO = Omit<Tables<"user_cards">, "user_id">;

/**
 * User collection entry with nested card information
 * Derived from: UserCardDTO + CardDTO
 */
export interface UserCardWithCardDTO extends UserCardDTO {
  card: CardDTO;
}

/**
 * Request body for adding a card to collection
 * Derived from: TablesInsert<'user_cards'> with required fields
 */
export interface AddUserCardRequestDTO {
  card_id: string;
  variant: string;
  quantity?: number;
}

/**
 * Request body for updating a collection entry
 * Derived from: Partial pick of user_cards updatable fields
 */
export interface UpdateUserCardRequestDTO {
  quantity?: number;
  wishlisted?: boolean;
}

/**
 * Query parameters for collection filtering and pagination
 */
export interface CollectionQueryDTO {
  page?: number;
  limit?: number;
  sort?: "name" | "created_at" | "quantity";
  order?: "asc" | "desc";
  set_id?: string;
  variant?: string;
  wishlisted?: boolean;
  search?: string;
}

// =============================================================================
// COLLECTION STATISTICS DTOs
// =============================================================================

/**
 * Most collected set information
 * Computed from user collection data
 */
export interface MostCollectedSetDTO {
  id: string;
  name: string;
  owned: number;
  total: number;
}

/**
 * Overall collection statistics
 * Computed from user collection data
 */
export interface CollectionStatsDTO {
  total_cards: number;
  unique_cards: number;
  wishlisted_count: number;
  sets_with_cards: number;
  most_collected_set: MostCollectedSetDTO | null;
}

/**
 * Set completion statistics for a specific set
 * Computed from set data and user collection
 */
export interface SetCompletionStatsDTO {
  set_id: string;
  set_name: string;
  series: string | null;
  total_cards: number;
  owned_cards: number;
  completion_percentage: number;
}

// =============================================================================
// EXPORT DTOs
// =============================================================================

/**
 * Row format for CSV export of collection
 */
export interface ExportCardRowDTO {
  card_id: string;
  name: string;
  set: string;
  card_number: string;
  rarity: string | null;
  quantity: number;
  variant: string;
  wishlisted: boolean;
}

// =============================================================================
// ANALYTICS DTOs
// =============================================================================

/**
 * Request body for tracking analytics events
 * Derived from: TablesInsert<'analytics_events'>
 */
export interface AnalyticsEventRequestDTO {
  event_type: string;
  event_data?: Record<string, unknown>;
}

/**
 * Analytics event response
 * Derived from: Tables<'analytics_events'> with selected fields
 */
export type AnalyticsEventResponseDTO = Pick<Tables<"analytics_events">, "id" | "event_type" | "created_at">;

// =============================================================================
// COMMON / UTILITY DTOs
// =============================================================================

/**
 * Pagination metadata for list responses
 */
export interface PaginationDTO {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
}

/**
 * Base query parameters for pagination and sorting
 */
export interface PaginationQueryDTO {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

/**
 * Generic paginated response wrapper
 * @template T - The type of data items in the response
 */
export interface PaginatedResponseDTO<T> {
  data: T[];
  pagination: PaginationDTO;
}

/**
 * Error response structure
 */
export interface ErrorResponseDTO {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Standard success message response
 */
export interface MessageResponseDTO {
  message: string;
}

// =============================================================================
// TYPE GUARDS AND VALIDATORS
// =============================================================================

/**
 * Valid card variant types
 */
export type CardVariant = "normal" | "reverse" | "holo" | "firstEdition";

/**
 * Valid sort orders
 */
export type SortOrder = "asc" | "desc";

/**
 * Supported analytics event types
 */
export type AnalyticsEventType =
  | "user_registered"
  | "user_login"
  | "password_reset_requested"
  | "card_added"
  | "card_removed"
  | "card_viewed"
  | "search_performed"
  | "collection_exported";
