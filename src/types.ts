/**
 * Data Transfer Objects (DTOs) and Command Models for TCGCollectr API
 *
 * This file contains type definitions for data exchanged between the API and clients.
 * All types are derived from database entity definitions in database.types.ts.
 */

import type { Database } from "./db/database.types";

// ============================================================================
// Database Entity Type Aliases
// ============================================================================

type DbTcgType = Database["public"]["Tables"]["tcg_types"]["Row"];
type DbSet = Database["public"]["Tables"]["sets"]["Row"];
type DbCard = Database["public"]["Tables"]["cards"]["Row"];
type DbCardPrice = Database["public"]["Tables"]["card_prices"]["Row"];
type DbRarity = Database["public"]["Tables"]["rarities"]["Row"];
type DbCondition = Database["public"]["Tables"]["card_conditions"]["Row"];
type DbGradingCompany = Database["public"]["Tables"]["grading_companies"]["Row"];
type DbCollectionEntry = Database["public"]["Tables"]["collection_entries"]["Row"];
type DbUserList = Database["public"]["Tables"]["user_lists"]["Row"];
type DbListEntry = Database["public"]["Tables"]["list_entries"]["Row"];
type DbUserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];
type DbImportJob = Database["public"]["Tables"]["import_jobs"]["Row"];
type DbPriceSource = Database["public"]["Tables"]["price_sources"]["Row"];

// ============================================================================
// Response DTOs
// ============================================================================

/**
 * TCG Type DTO - represents a trading card game type (e.g., Pokemon, Magic)
 * GET /api/tcg-types
 */
export interface TcgTypeDto {
  id: DbTcgType["id"];
  code: DbTcgType["code"];
  name: DbTcgType["name"];
}

/**
 * Set DTO (List View) - represents a card set/expansion in list views
 * GET /api/sets
 */
export interface SetListDto {
  id: DbSet["id"];
  externalId: DbSet["external_id"];
  name: DbSet["name"];
  series: DbSet["series"];
  releaseDate: DbSet["release_date"];
  totalCards: DbSet["total_cards"];
  symbolUrl: DbSet["symbol_url"];
  logoUrl: DbSet["logo_url"];
  tcgType: Pick<DbTcgType, "id" | "name" | "code">;
}

/**
 * Set DTO (Detail View) - represents a card set/expansion with full details
 * GET /api/sets/:setId
 */
export interface SetDetailDto extends SetListDto {
  createdAt: DbSet["created_at"];
  updatedAt: DbSet["updated_at"];
}

/**
 * Card Price DTO - represents market price data for a card
 */
export interface CardPriceDto {
  id: DbCardPrice["id"];
  price: DbCardPrice["price"];
  currency: DbCardPrice["currency"];
  priceType: DbCardPrice["price_type"];
  lastUpdated: DbCardPrice["fetched_at"];
  source: Pick<DbPriceSource, "id" | "name" | "code">;
}

/**
 * Card DTO (List View) - represents a card in list/search views
 * GET /api/cards
 */
export interface CardListDto {
  id: DbCard["id"];
  externalId: DbCard["external_id"];
  name: DbCard["name"];
  cardNumber: DbCard["card_number"];
  imageSmallUrl: DbCard["image_small_url"];
  imageLargeUrl: DbCard["image_large_url"];
  supertype: DbCard["supertype"];
  subtypes: DbCard["subtypes"];
  types: DbCard["types"];
  hp: DbCard["hp"];
  rarity: Pick<DbRarity, "id" | "name" | "code"> | null;
  set: Pick<DbSet, "id" | "name" | "series" | "symbol_url">;
  marketPrice: CardPriceDto | null;
}

/**
 * Card Attack DTO - represents a card attack/move
 */
export interface CardAttackDto {
  name: string;
  cost: string[];
  damage: string;
  text: string;
  convertedEnergyCost: number;
}

/**
 * Card Ability DTO - represents a card ability
 */
export interface CardAbilityDto {
  name: string;
  text: string;
  type: string;
}

/**
 * Card Weakness/Resistance DTO - represents a type advantage/disadvantage
 */
export interface CardTypeEffectDto {
  type: string;
  value: string;
}

/**
 * Card DTO (Detail View) - represents a card with full details
 * GET /api/cards/:cardId
 */
export interface CardDetailDto extends CardListDto {
  artist: DbCard["artist"];
  flavorText: DbCard["flavor_text"];
  evolvesFrom: DbCard["evolves_from"];
  retreatCost: DbCard["retreat_cost"];
  rules: DbCard["rules"];
  abilities: CardAbilityDto[] | null;
  attacks: CardAttackDto[] | null;
  weaknesses: CardTypeEffectDto[] | null;
  resistances: CardTypeEffectDto[] | null;
  createdAt: DbCard["created_at"];
  updatedAt: DbCard["updated_at"];
}

/**
 * Card Search Result DTO - optimized result for search endpoint
 * GET /api/cards/search
 */
export interface CardSearchResultDto {
  id: DbCard["id"];
  name: DbCard["name"];
  cardNumber: DbCard["card_number"];
  imageSmallUrl: DbCard["image_small_url"];
  setName: DbSet["name"];
  setSeries: DbSet["series"];
  setSymbolUrl: DbSet["symbol_url"];
  tcgTypeName: DbTcgType["name"];
}

/**
 * Rarity DTO - represents a card rarity level
 * GET /api/rarities
 */
export interface RarityDto {
  id: DbRarity["id"];
  code: DbRarity["code"];
  name: DbRarity["name"];
  sortOrder: DbRarity["sort_order"];
  tcgTypeId: DbRarity["tcg_type_id"];
}

/**
 * Condition DTO - represents a card condition grade
 * GET /api/conditions
 */
export interface ConditionDto {
  id: DbCondition["id"];
  code: DbCondition["code"];
  name: DbCondition["name"];
  description: string;
  sortOrder: DbCondition["sort_order"];
}

/**
 * Grading Company DTO - represents a professional card grading company
 * GET /api/grading-companies
 */
export interface GradingCompanyDto {
  id: DbGradingCompany["id"];
  code: DbGradingCompany["code"];
  name: DbGradingCompany["name"];
  minGrade: DbGradingCompany["min_grade"];
  maxGrade: DbGradingCompany["max_grade"];
}

/**
 * Collection Entry DTO (List View) - represents a card in user's collection
 * GET /api/collection
 */
export interface CollectionEntryListDto {
  id: DbCollectionEntry["id"];
  quantity: DbCollectionEntry["quantity"];
  condition: Pick<DbCondition, "id" | "name" | "code">;
  gradingCompany: Pick<DbGradingCompany, "id" | "name" | "code"> | null;
  gradeValue: DbCollectionEntry["grade_value"];
  purchasePrice: DbCollectionEntry["purchase_price"];
  notes: DbCollectionEntry["notes"];
  dateAdded: DbCollectionEntry["created_at"];
  lastUpdated: DbCollectionEntry["updated_at"];
  card: CardListDto;
}

/**
 * Collection Entry DTO (Detail View) - represents a collection entry with full card details
 * GET /api/collection/:entryId
 */
export interface CollectionEntryDetailDto extends Omit<CollectionEntryListDto, "card"> {
  card: CardDetailDto;
  estimatedValue: number;
}

/**
 * Collection Summary DTO - represents aggregate collection statistics
 * GET /api/collection/summary
 */
export interface CollectionSummaryDto {
  totalEntries: number;
  totalCards: number;
  totalMarketValue: number;
  totalPurchaseCost: number;
  totalProfitLoss: number;
  topSets: {
    setId: string;
    setName: string;
    ownedUniqueCards: number;
    ownedTotalCards: number;
    setTotalCards: number;
    completionPercentage: number;
  }[];
  valueByCondition: {
    conditionId: number;
    conditionName: string;
    totalValue: number;
    cardCount: number;
  }[];
  gradedCardsValue: number;
  ungradedCardsValue: number;
}

/**
 * User List DTO (without entries) - represents a custom user list
 * GET /api/lists
 */
export interface UserListDto {
  id: DbUserList["id"];
  name: DbUserList["name"];
  sortOrder: DbUserList["sort_order"];
  entryCount: number;
  totalValue: number;
  createdAt: DbUserList["created_at"];
  updatedAt: DbUserList["updated_at"];
}

/**
 * User List with Entries DTO - represents a list with its collection entries
 * GET /api/lists/:listId
 */
export interface UserListWithEntriesDto extends UserListDto {
  entries: CollectionEntryListDto[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

/**
 * User Profile DTO - represents user profile information
 * GET /api/profile
 */
export interface UserProfileDto {
  id: DbUserProfile["id"];
  displayName: DbUserProfile["display_name"];
  avatarUrl: DbUserProfile["avatar_url"];
  isAdmin: DbUserProfile["is_admin"];
  createdAt: DbUserProfile["created_at"];
  updatedAt: DbUserProfile["updated_at"];
}

/**
 * Import Job DTO (List View) - represents a data import job
 * GET /api/admin/import-jobs
 */
export interface ImportJobListDto {
  id: DbImportJob["id"];
  jobType: DbImportJob["job_type"];
  status: DbImportJob["status"];
  totalRecords: DbImportJob["total_records"];
  successCount: DbImportJob["success_count"];
  failureCount: DbImportJob["failure_count"];
  createdAt: DbImportJob["created_at"];
  startedAt: DbImportJob["started_at"];
  completedAt: DbImportJob["completed_at"];
}

/**
 * Import Job DTO (Detail View) - represents a job with full error details
 * GET /api/admin/import-jobs/:jobId
 */
export interface ImportJobDetailDto extends ImportJobListDto {
  errorDetails: DbImportJob["error_details"];
  triggeredBy: DbImportJob["triggered_by"];
}

/**
 * Admin Statistics DTO - represents platform-wide statistics
 * GET /api/admin/statistics
 */
export interface AdminStatisticsDto {
  users: {
    total: number;
    activeLastWeek: number;
    activeLastMonth: number;
    newThisMonth: number;
  };
  collections: {
    totalEntries: number;
    totalCards: number;
    totalMarketValue: number;
    averageCollectionSize: number;
  };
  catalog: {
    totalSets: number;
    totalCards: number;
    lastPriceUpdate: string;
  };
  imports: {
    lastSuccessfulImport: string;
    pendingJobs: number;
    failedJobsLast24h: number;
  };
}

// ============================================================================
// Command Models (Request Bodies)
// ============================================================================

/**
 * Add to Collection Command - request body for adding a card to collection
 * POST /api/collection
 */
export interface AddToCollectionCommand {
  cardId: DbCollectionEntry["card_id"];
  conditionId: DbCollectionEntry["condition_id"];
  quantity: DbCollectionEntry["quantity"];
  gradingCompanyId?: DbCollectionEntry["grading_company_id"];
  gradeValue?: DbCollectionEntry["grade_value"];
  purchasePrice?: DbCollectionEntry["purchase_price"];
  notes?: DbCollectionEntry["notes"];
}

/**
 * Update Collection Entry Command - request body for updating a collection entry
 * PATCH /api/collection/:entryId
 */
export interface UpdateCollectionEntryCommand {
  conditionId?: DbCollectionEntry["condition_id"];
  quantity?: DbCollectionEntry["quantity"];
  gradingCompanyId?: DbCollectionEntry["grading_company_id"] | null;
  gradeValue?: DbCollectionEntry["grade_value"] | null;
  purchasePrice?: DbCollectionEntry["purchase_price"];
  notes?: DbCollectionEntry["notes"];
}

/**
 * Create List Command - request body for creating a custom list
 * POST /api/lists
 */
export interface CreateListCommand {
  name: DbUserList["name"];
}

/**
 * Update List Command - request body for updating a list
 * PATCH /api/lists/:listId
 */
export interface UpdateListCommand {
  name?: DbUserList["name"];
  sortOrder?: DbUserList["sort_order"];
}

/**
 * Add Entries to List Command - request body for adding collection entries to a list
 * POST /api/lists/:listId/entries
 */
export interface AddEntriesToListCommand {
  collectionEntryIds: string[];
}

/**
 * Update Profile Command - request body for updating user profile
 * PATCH /api/profile
 */
export interface UpdateProfileCommand {
  displayName?: DbUserProfile["display_name"];
  avatarUrl?: DbUserProfile["avatar_url"] | null;
}

/**
 * Register Command - request body for user registration
 * POST /api/auth/register
 */
export interface RegisterCommand {
  email: string;
  password: string;
}

/**
 * Login Command - request body for user login
 * POST /api/auth/login
 */
export interface LoginCommand {
  email: string;
  password: string;
}

/**
 * Forgot Password Command - request body for password reset request
 * POST /api/auth/forgot-password
 */
export interface ForgotPasswordCommand {
  email: string;
}

/**
 * Reset Password Command - request body for password reset
 * POST /api/auth/reset-password
 */
export interface ResetPasswordCommand {
  token: string;
  password: string;
}

/**
 * Trigger Import Job Command - request body for triggering an import job
 * POST /api/admin/import-jobs
 */
export interface TriggerImportJobCommand {
  jobType: DbImportJob["job_type"];
}

// ============================================================================
// Common Response Wrappers
// ============================================================================

/**
 * Standard API success response wrapper
 */
export interface ApiSuccessResponse<T> {
  data: T;
  message?: string;
}

/**
 * Standard API error response wrapper
 */
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    timestamp: string;
  };
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

// ============================================================================
// Query Parameter Types
// ============================================================================

/**
 * Common pagination query parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Common sorting query parameters
 */
export interface SortingParams {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Query parameters for GET /api/sets
 */
export interface GetSetsQueryParams extends PaginationParams, SortingParams {
  tcgTypeId?: number;
  series?: string;
  search?: string;
}

/**
 * Query parameters for GET /api/cards
 */
export interface GetCardsQueryParams extends PaginationParams, SortingParams {
  setId?: string;
  tcgTypeId?: number;
  rarityId?: number;
  cardType?: string;
  priceMin?: number;
  priceMax?: number;
  search?: string;
}

/**
 * Query parameters for GET /api/cards/search
 */
export interface SearchCardsQueryParams {
  q: string;
  limit?: number;
}

/**
 * Query parameters for GET /api/rarities
 */
export interface GetRaritiesQueryParams {
  tcgTypeId?: number;
}

/**
 * Query parameters for GET /api/collection
 */
export interface GetCollectionQueryParams extends PaginationParams, SortingParams {
  listId?: string;
  setId?: string;
  conditionId?: number;
  search?: string;
}

/**
 * Query parameters for GET /api/admin/import-jobs
 */
export interface GetImportJobsQueryParams extends PaginationParams {
  status?: "pending" | "running" | "completed" | "failed";
}
