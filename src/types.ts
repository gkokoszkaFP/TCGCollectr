/**
 * Data Transfer Objects (DTOs) and Command Models
 *
 * This file contains type definitions for data structures used in API communication.
 * All DTOs are derived from database entity types defined in src/db/database.types.ts
 */

import type { Tables } from "./db/database.types";

// ============================================================================
// Base Entity Types (Extracted from Database)
// ============================================================================

type Card = Tables<"cards">;
type Set = Tables<"sets">;
type Rarity = Tables<"rarities">;
type CardPrice = Tables<"card_prices">;
type CardCondition = Tables<"card_conditions">;
type CollectionEntry = Tables<"collection_entries">;
type PriceSource = Tables<"price_sources">;
type ApiCache = Tables<"api_cache">;

// ============================================================================
// Card DTOs
// ============================================================================

/**
 * Minimal set information for card listings
 */
export interface SetSummaryDTO {
  id: string;
  name: string;
  abbreviation: string;
}

/**
 * Minimal rarity information for card listings
 */
export interface RaritySummaryDTO {
  id: string;
  displayName: string;
}

/**
 * Card image URLs
 */
export interface CardImagesDTO {
  small: string | null;
  large: string | null;
}

/**
 * Market price information with source attribution
 */
export interface MarketPriceDTO {
  amount: number;
  currency: string;
  source: string;
  lastSeenAt: string;
}

/**
 * Complete card DTO for list and detail views
 * Includes nested set, rarity, images, and pricing information
 */
export interface CardDTO {
  id: Card["id"];
  name: Card["name"];
  cardNumber: Card["card_number"];
  numberSort: Card["number_sort"];
  set: SetSummaryDTO;
  rarity: RaritySummaryDTO | null;
  images: CardImagesDTO;
  types: Card["types"];
  subtypes?: Card["subtypes"];
  supertype?: Card["supertype"];
  hp?: Card["hp"];
  artist?: Card["artist"];
  marketPrice?: MarketPriceDTO;
}

/**
 * Lightweight card DTO for autocomplete/search suggestions
 */
export interface CardAutocompleteDTO {
  id: Card["id"];
  name: Card["name"];
  cardNumber: Card["card_number"];
  set: string; // Set name only for compact display
}

/**
 * Price history entry for detailed card view
 */
export interface CardPriceHistoryDTO {
  date: string;
  marketPrice: number;
  lowPrice: number | null;
  highPrice: number | null;
  source: string;
}

// ============================================================================
// Set DTOs
// ============================================================================

/**
 * Complete set DTO with metadata
 */
export interface SetDTO {
  id: Set["id"];
  name: Set["name"];
  abbreviation: Set["abbreviation"];
  releaseDate: Set["release_date"];
  series: Set["series"];
  totalCards: Set["total_cards"];
  symbolUrl: Set["symbol_url"];
  logoUrl: Set["logo_url"];
  tcgType: Set["tcg_type"];
}

/**
 * Set detail DTO with aggregated stats
 */
export interface SetDetailDTO extends SetDTO {
  cachedCardCount: number;
  lastSyncedAt: Set["last_synced_at"];
}

// ============================================================================
// Card Condition DTOs
// ============================================================================

/**
 * Card condition lookup DTO
 */
export interface CardConditionDTO {
  code: CardCondition["code"];
  label: CardCondition["label"];
  description: CardCondition["description"];
  isDefault: CardCondition["is_default"];
}

// ============================================================================
// Collection Entry DTOs
// ============================================================================

/**
 * Condition information for collection entry
 */
export interface CollectionEntryConditionDTO {
  code: string;
  label: string;
}

/**
 * Simplified card information within collection entry
 */
export interface CollectionEntryCardDTO {
  name: string;
  cardNumber: string;
  set: SetSummaryDTO;
  rarity: string | null;
  marketPrice: number | null;
  imageSmallUrl: string | null;
}

/**
 * Timestamp information for collection entry
 */
export interface CollectionEntryTimestampsDTO {
  createdAt: string;
  updatedAt: string;
}

/**
 * Calculated totals for collection entry
 */
export interface CollectionEntryTotalsDTO {
  estimatedValue: number;
}

/**
 * Complete collection entry DTO
 */
export interface CollectionEntryDTO {
  id: CollectionEntry["id"];
  cardId: CollectionEntry["card_id"];
  quantity: CollectionEntry["quantity"];
  condition: CollectionEntryConditionDTO | null;
  card: CollectionEntryCardDTO;
  totals: CollectionEntryTotalsDTO;
  timestamps: CollectionEntryTimestampsDTO;
  acquiredAt?: CollectionEntry["acquired_at"];
  purchasePrice?: CollectionEntry["purchase_price"];
  notes?: CollectionEntry["notes"];
}

/**
 * Collection set summary DTO
 */
export interface CollectionSetSummaryDTO {
  set: SetSummaryDTO;
  uniqueCards: number;
  totalQuantity: number;
  estimatedValue: number;
}

/**
 * Collection value summary DTO
 */
export interface CollectionValueDTO {
  totalEstimatedValue: number;
  totalCards: number;
  cardsWithoutPrice: number;
}

// ============================================================================
// Profile DTOs
// ============================================================================

/**
 * Recent activity summary
 */
export interface RecentActivityDTO {
  lastAddedAt: string | null;
  lastUpdatedAt: string | null;
}

/**
 * Profile summary DTO combining user and collection info
 */
export interface ProfileSummaryDTO {
  email: string;
  displayName: string | null;
  collectionValue: CollectionValueDTO;
  recentActivity: RecentActivityDTO;
  themePreference?: string;
}

// ============================================================================
// External Status DTOs
// ============================================================================

/**
 * Health status for external API sources
 */
export interface ExternalSourceStatusDTO {
  status: "healthy" | "degraded" | "unavailable";
  lastSuccessAt: string | null;
  cacheExpiresAt: string | null;
  lastError?: string;
}

/**
 * External status response DTO
 */
export interface ExternalStatusDTO {
  data: Record<string, ExternalSourceStatusDTO>;
}

// ============================================================================
// Pagination DTOs
// ============================================================================

/**
 * Pagination metadata
 */
export interface PaginationMetaDTO {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  cacheExpiresAt?: string;
}

/**
 * Paginated response wrapper for cards
 */
export interface PaginatedCardResponseDTO {
  data: CardDTO[];
  meta: PaginationMetaDTO;
}

/**
 * Paginated response wrapper for sets
 */
export interface PaginatedSetResponseDTO {
  data: SetDTO[];
  meta: PaginationMetaDTO;
}

/**
 * Collection entries pagination metadata with grouping info
 */
export interface CollectionPaginationMetaDTO extends PaginationMetaDTO {
  grouping?: string;
  sort?: string;
}

/**
 * Paginated response wrapper for collection entries
 */
export interface PaginatedCollectionEntryResponseDTO {
  data: CollectionEntryDTO[];
  meta: CollectionPaginationMetaDTO;
}

// ============================================================================
// Command Models (Request payloads)
// ============================================================================

/**
 * Duplication strategy for adding cards to collection
 */
export type DuplicationStrategy = "increment" | "separate";

/**
 * Command to create a new collection entry
 */
export interface CreateCollectionEntryCommand {
  cardId: string;
  quantity: number;
  conditionCode?: string;
  acquiredAt?: string;
  purchasePrice?: number;
  notes?: string;
  duplicationStrategy?: DuplicationStrategy;
}

/**
 * Command to update an existing collection entry
 * All fields are optional for partial updates
 */
export interface UpdateCollectionEntryCommand {
  quantity?: number;
  conditionCode?: string;
  acquiredAt?: string;
  purchasePrice?: number;
  notes?: string;
}

/**
 * Response for collection entry mutations including value delta
 */
export interface CollectionEntryMutationResponseDTO {
  entry: CollectionEntryDTO;
  collectionValueDelta: number;
}

/**
 * Response for collection entry deletion
 */
export interface CollectionEntryDeleteResponseDTO {
  deleted: boolean;
  collectionValueDelta: number;
}

// ============================================================================
// Error DTOs
// ============================================================================

/**
 * Standard error code type
 */
export type ErrorCode =
  | "INVALID_FILTER"
  | "CATALOG_UNAVAILABLE"
  | "CARD_NOT_FOUND"
  | "EXTERNAL_SOURCE_DOWN"
  | "QUERY_TOO_SHORT"
  | "INVALID_TCG_TYPE"
  | "SET_NOT_FOUND"
  | "UNAUTHENTICATED"
  | "VALUATION_PENDING"
  | "INVALID_QUANTITY"
  | "INVALID_CONDITION"
  | "ENTRY_EXISTS"
  | "CARD_SYNC_REQUIRED"
  | "ENTRY_NOT_FOUND"
  | "PRECONDITION_FAILED"
  | "STATUS_UNAVAILABLE";

/**
 * Standard error response structure
 */
export interface ErrorResponseDTO {
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Warning message structure for degraded service responses
 */
export interface WarningDTO {
  code: string;
  message: string;
}

// ============================================================================
// Query Parameter Types
// ============================================================================

/**
 * Card search and filter parameters
 */
export interface CardSearchParams {
  q?: string;
  setId?: string;
  setExternalId?: string;
  cardNumber?: string;
  rarityId?: string;
  type?: string;
  page?: number;
  pageSize?: number;
  sort?: "set" | "name" | "number";
  order?: "asc" | "desc";
}

/**
 * Set search and filter parameters
 */
export interface SetSearchParams {
  tcgType?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sort?: "releaseDate" | "name";
  order?: "asc" | "desc";
}

/**
 * Collection entry search and filter parameters
 */
export interface CollectionEntrySearchParams {
  setId?: string;
  rarityId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sort?: "set" | "number" | "createdAt";
  order?: "asc" | "desc";
}

/**
 * Autocomplete search parameters
 */
export interface AutocompleteSearchParams {
  q: string;
  setId?: string;
  limit?: number;
}
