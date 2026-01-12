# REST API Plan

## 1. Resources

| Resource         | Database Table     | Description                                      |
| ---------------- | ------------------ | ------------------------------------------------ |
| Profiles         | `profiles`         | User profile information and preferences         |
| Sets             | `sets`             | Pokémon TCG sets/expansions                      |
| Cards            | `cards`            | Card metadata cached from TCGDex API             |
| User Cards       | `user_cards`       | User's collection entries with variants/quantity |
| Analytics Events | `analytics_events` | User action tracking for metrics                 |

---

## 2. Endpoints

### 2.1 Authentication

Authentication is handled by Supabase Auth. The API endpoints below document the expected flow.

#### POST /api/auth/register

Register a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (201 Created):**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "expires_at": 1234567890
  }
}
```

**Error Responses:**

| Status | Code                | Message                             |
| ------ | ------------------- | ----------------------------------- |
| 400    | VALIDATION_ERROR    | Invalid email format                |
| 400    | VALIDATION_ERROR    | Password does not meet requirements |
| 409    | EMAIL_EXISTS        | Email address already registered    |
| 429    | RATE_LIMIT_EXCEEDED | Too many registration attempts      |

---

#### POST /api/auth/login

Authenticate an existing user.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "expires_at": 1234567890
  }
}
```

**Error Responses:**

| Status | Code                | Message                     |
| ------ | ------------------- | --------------------------- |
| 400    | VALIDATION_ERROR    | Email and password required |
| 401    | INVALID_CREDENTIALS | Invalid email or password   |
| 429    | RATE_LIMIT_EXCEEDED | Too many login attempts     |

---

#### POST /api/auth/logout

Revoke the current user's session and log them out.

**Description:**

- Invalidates the current Supabase session by revoking the supplied access token
- Forces credential rotation on the next client request
- Tracks logout event in analytics (anonymized IP hash)
- Prevents response caching via `Cache-Control: no-store` header

**Headers:**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
None

**Response (200 OK):**

```json
{
  "message": "Successfully logged out"
}
```

**Response Headers:**

- `Cache-Control: no-store` - Prevents caching of auth state
- `Content-Type: application/json`

**Error Responses:**

| Status | Code             | Message                                            | Description                                           |
| ------ | ---------------- | -------------------------------------------------- | ----------------------------------------------------- |
| 400    | VALIDATION_ERROR | Authorization header is required with Bearer token | Missing or malformed Authorization header             |
| 401    | UNAUTHORIZED     | Token is invalid or expired                        | Token rejected by Supabase or session already revoked |
| 500    | INTERNAL_ERROR   | An unexpected error occurred during logout         | Server error, check logs for details                  |

**Notes:**

- The `Authorization` header is required and must follow the format: `Bearer <token>`
- Session revocation is synchronous; the access token becomes invalid immediately
- Analytics events are tracked asynchronously and do not block the response
- IP addresses are hashed (SHA-256) before storage for privacy compliance
- No sensitive data is echoed in error responses

---

#### POST /api/auth/reset-password

Request a password reset email.

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**

```json
{
  "message": "Password reset email sent"
}
```

**Error Responses:**

| Status | Code                | Message                 |
| ------ | ------------------- | ----------------------- |
| 400    | VALIDATION_ERROR    | Invalid email format    |
| 429    | RATE_LIMIT_EXCEEDED | Too many reset attempts |

---

#### POST /api/auth/update-password

Update password using reset token.

**Request Body:**

```json
{
  "password": "newSecurePassword123"
}
```

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "message": "Password updated successfully"
}
```

**Error Responses:**

| Status | Code             | Message                             |
| ------ | ---------------- | ----------------------------------- |
| 400    | VALIDATION_ERROR | Password does not meet requirements |
| 401    | UNAUTHORIZED     | Invalid or expired token            |

---

### 2.2 Profiles

#### GET /api/profile

Get the current user's profile.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "id": "uuid",
  "onboarding_completed": false,
  "favorite_type": "fire",
  "favorite_set": "sv04.5",
  "total_cards_count": 150,
  "created_at": "2026-01-11T10:00:00Z",
  "updated_at": "2026-01-11T10:00:00Z"
}
```

### Addendum: On-demand seeding behavior (MVP)

For GET endpoints that return card or set metadata (for example: `GET /api/sets/:setId`, `GET /api/cards/:cardId`, `GET /api/sets`), the MVP implementation MUST follow this on-demand seeding flow:

1. Attempt a read from the local database using the public/anon Supabase client injected by middleware.
2. If the resource is not found, make a synchronous request to the TCGDex API (`TCGDEX_URL`) to fetch the resource.

- If TCGDex returns 404, return 404 to the client.
- If TCGDex returns a valid payload, upsert the record into the appropriate table (`sets` or `cards`) using a server-only Supabase service-role client (`SUPABASE_SERVICE_KEY`).

3. Return the (now-cached) row to the client with headers: `Cache-Control: public, max-age=86400, stale-while-revalidate=60`.

Requirements and notes:

- Keep `SUPABASE_SERVICE_KEY` strictly server-side (CI/hosting secrets). Never expose it to clients.
- Validate path params (Zod recommended) before DB or upstream calls.
- Apply per-endpoint rate limiting via middleware to protect upstream TCGDex and to reduce enumeration risk.
- Standardize error responses and avoid leaking upstream or DB internals.
- This on-demand approach replaces background syncing for MVP; introduce background jobs later to proactively refresh stale records and reduce first-request latency.

**Error Responses:**

| Status | Code         | Message           |
| ------ | ------------ | ----------------- |
| 401    | UNAUTHORIZED | Not authenticated |
| 404    | NOT_FOUND    | Profile not found |

---

#### PATCH /api/profile

Update the current user's profile.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "onboarding_completed": true,
  "favorite_type": "water",
  "favorite_set": "sv05"
}
```

**Response (200 OK):**

```json
{
  "id": "uuid",
  "onboarding_completed": true,
  "favorite_type": "water",
  "favorite_set": "sv05",
  "total_cards_count": 150,
  "created_at": "2026-01-11T10:00:00Z",
  "updated_at": "2026-01-11T12:00:00Z"
}
```

**Error Responses:**

| Status | Code             | Message                     |
| ------ | ---------------- | --------------------------- |
| 400    | VALIDATION_ERROR | Invalid favorite_type value |
| 401    | UNAUTHORIZED     | Not authenticated           |
| 404    | NOT_FOUND        | Profile not found           |

---

### 2.3 Sets

#### GET /api/sets

Get all available card sets with pagination.

**Query Parameters:**

| Parameter | Type    | Default | Description                                  |
| --------- | ------- | ------- | -------------------------------------------- |
| page      | integer | 1       | Page number (1-indexed)                      |
| limit     | integer | 20      | Items per page (max: 100)                    |
| sort      | string  | name    | Sort field: `name`, `release_date`, `series` |
| order     | string  | asc     | Sort order: `asc`, `desc`                    |
| search    | string  | -       | Filter by set name (partial match)           |
| series    | string  | -       | Filter by series name (exact match)          |

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "sv04.5",
      "name": "Surging Sparks",
      "series": "Scarlet & Violet",
      "total_cards": 191,
      "release_date": "2024-11-08",
      "logo_url": "https://cdn.tcgdex.net/sets/sv/sv04.5/logo.png",
      "symbol_url": "https://cdn.tcgdex.net/sets/sv/sv04.5/symbol.png"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_items": 150,
    "total_pages": 8
  }
}
```

**Error Responses:**

| Status | Code             | Message                       |
| ------ | ---------------- | ----------------------------- |
| 400    | VALIDATION_ERROR | Invalid pagination parameters |

---

#### GET /api/sets/:setId

Get a specific set by ID.

**Path Parameters:**

| Parameter | Type   | Description           |
| --------- | ------ | --------------------- |
| setId     | string | Unique set identifier |

**Response (200 OK):**

```json
{
  "id": "sv04.5",
  "name": "Surging Sparks",
  "series": "Scarlet & Violet",
  "total_cards": 191,
  "release_date": "2024-11-08",
  "logo_url": "https://cdn.tcgdex.net/sets/sv/sv04.5/logo.png",
  "symbol_url": "https://cdn.tcgdex.net/sets/sv/sv04.5/symbol.png",
  "last_synced_at": "2026-01-10T00:00:00Z",
  "created_at": "2024-11-01T00:00:00Z",
  "updated_at": "2026-01-10T00:00:00Z"
}
```

**Error Responses:**

| Status | Code      | Message       |
| ------ | --------- | ------------- |
| 404    | NOT_FOUND | Set not found |

---

#### GET /api/sets/:setId/completion

Get user's completion progress for a specific set (authenticated).

**Headers:**

```
Authorization: Bearer <access_token>
```

**Path Parameters:**

| Parameter | Type   | Description           |
| --------- | ------ | --------------------- |
| setId     | string | Unique set identifier |

**Response (200 OK):**

```json
{
  "set_id": "sv04.5",
  "set_name": "Surging Sparks",
  "total_cards": 191,
  "owned_cards": 45,
  "completion_percentage": 23.56
}
```

**Error Responses:**

| Status | Code         | Message           |
| ------ | ------------ | ----------------- |
| 401    | UNAUTHORIZED | Not authenticated |
| 404    | NOT_FOUND    | Set not found     |

---

### 2.4 Cards

#### GET /api/cards

Search and browse cards with filtering and pagination.

**Query Parameters:**

| Parameter | Type    | Default | Description                                 |
| --------- | ------- | ------- | ------------------------------------------- |
| page      | integer | 1       | Page number (1-indexed)                     |
| limit     | integer | 20      | Items per page (max: 100)                   |
| sort      | string  | name    | Sort field: `name`, `card_number`, `rarity` |
| order     | string  | asc     | Sort order: `asc`, `desc`                   |
| search    | string  | -       | Search by card name (partial match)         |
| set_id    | string  | -       | Filter by set ID (exact match)              |
| types     | string  | -       | Filter by Pokémon types (comma-separated)   |
| rarity    | string  | -       | Filter by rarity (exact match)              |

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "sv04.5-1",
      "set_id": "sv04.5",
      "name": "Bulbasaur",
      "card_number": "1/191",
      "rarity": "◇",
      "types": ["grass"],
      "hp": 70,
      "image_url_small": "https://cdn.tcgdex.net/cards/sv/sv04.5/1/low.webp",
      "image_url_large": "https://cdn.tcgdex.net/cards/sv/sv04.5/1/high.webp"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_items": 191,
    "total_pages": 10
  }
}
```

**Error Responses:**

| Status | Code                | Message                       |
| ------ | ------------------- | ----------------------------- |
| 400    | VALIDATION_ERROR    | Invalid pagination parameters |
| 429    | RATE_LIMIT_EXCEEDED | Search rate limit exceeded    |

---

#### GET /api/cards/:cardId

Get a specific card by ID.

**Path Parameters:**

| Parameter | Type   | Description            |
| --------- | ------ | ---------------------- |
| cardId    | string | Unique card identifier |

**Response (200 OK):**

```json
{
  "id": "sv04.5-1",
  "set_id": "sv04.5",
  "name": "Bulbasaur",
  "card_number": "1/191",
  "rarity": "◇",
  "types": ["grass"],
  "hp": 70,
  "image_url_small": "https://cdn.tcgdex.net/cards/sv/sv04.5/1/low.webp",
  "image_url_large": "https://cdn.tcgdex.net/cards/sv/sv04.5/1/high.webp",
  "set": {
    "id": "sv04.5",
    "name": "Surging Sparks",
    "series": "Scarlet & Violet"
  },
  "last_synced_at": "2026-01-10T00:00:00Z",
  "created_at": "2024-11-01T00:00:00Z",
  "updated_at": "2026-01-10T00:00:00Z"
}
```

**Error Responses:**

| Status | Code      | Message        |
| ------ | --------- | -------------- |
| 404    | NOT_FOUND | Card not found |

---

### 2.5 User Cards (Collection)

#### GET /api/collection

Get the current user's card collection with filtering and pagination.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Query Parameters:**

| Parameter  | Type    | Default | Description                                                    |
| ---------- | ------- | ------- | -------------------------------------------------------------- |
| page       | integer | 1       | Page number (1-indexed)                                        |
| limit      | integer | 20      | Items per page (max: 100)                                      |
| sort       | string  | name    | Sort field: `name`, `created_at`, `quantity`                   |
| order      | string  | asc     | Sort order: `asc`, `desc`                                      |
| set_id     | string  | -       | Filter by set ID                                               |
| variant    | string  | -       | Filter by variant: `normal`, `reverse`, `holo`, `firstEdition` |
| wishlisted | boolean | -       | Filter by wishlist status                                      |
| search     | string  | -       | Search by card name                                            |

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "user-card-uuid",
      "card_id": "sv04.5-1",
      "variant": "normal",
      "quantity": 2,
      "wishlisted": false,
      "created_at": "2026-01-11T10:00:00Z",
      "updated_at": "2026-01-11T10:00:00Z",
      "card": {
        "id": "sv04.5-1",
        "name": "Bulbasaur",
        "set_id": "sv04.5",
        "card_number": "1/191",
        "rarity": "◇",
        "types": ["grass"],
        "image_url_small": "https://cdn.tcgdex.net/cards/sv/sv04.5/1/low.webp"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_items": 150,
    "total_pages": 8
  }
}
```

**Error Responses:**

| Status | Code             | Message                  |
| ------ | ---------------- | ------------------------ |
| 400    | VALIDATION_ERROR | Invalid query parameters |
| 401    | UNAUTHORIZED     | Not authenticated        |

---

#### POST /api/collection

Add a card to the user's collection. If the card+variant already exists, quantity is increased.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "card_id": "sv04.5-1",
  "variant": "normal",
  "quantity": 1
}
```

**Response (201 Created):**

```json
{
  "id": "user-card-uuid",
  "card_id": "sv04.5-1",
  "variant": "normal",
  "quantity": 1,
  "wishlisted": false,
  "created_at": "2026-01-11T10:00:00Z",
  "updated_at": "2026-01-11T10:00:00Z",
  "card": {
    "id": "sv04.5-1",
    "name": "Bulbasaur",
    "set_id": "sv04.5",
    "card_number": "1/191",
    "rarity": "◇"
  }
}
```

**Response (200 OK) - When quantity updated:**

```json
{
  "id": "user-card-uuid",
  "card_id": "sv04.5-1",
  "variant": "normal",
  "quantity": 3,
  "wishlisted": false,
  "created_at": "2026-01-11T10:00:00Z",
  "updated_at": "2026-01-11T12:00:00Z",
  "message": "Quantity updated for existing card"
}
```

**Error Responses:**

| Status | Code                   | Message                                   |
| ------ | ---------------------- | ----------------------------------------- |
| 400    | VALIDATION_ERROR       | Invalid variant value                     |
| 400    | VALIDATION_ERROR       | Quantity must be between 1 and 1000       |
| 401    | UNAUTHORIZED           | Not authenticated                         |
| 404    | NOT_FOUND              | Card not found                            |
| 409    | CARD_LIMIT_EXCEEDED    | Collection limit of 10,000 cards exceeded |
| 409    | VARIANT_LIMIT_EXCEEDED | Variant limit of 1,000 copies exceeded    |
| 429    | RATE_LIMIT_EXCEEDED    | Card addition rate limit exceeded         |

---

#### GET /api/collection/:userCardId

Get a specific collection entry.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Path Parameters:**

| Parameter  | Type | Description                |
| ---------- | ---- | -------------------------- |
| userCardId | uuid | Unique collection entry ID |

**Response (200 OK):**

```json
{
  "id": "user-card-uuid",
  "card_id": "sv04.5-1",
  "variant": "normal",
  "quantity": 2,
  "wishlisted": false,
  "created_at": "2026-01-11T10:00:00Z",
  "updated_at": "2026-01-11T10:00:00Z",
  "card": {
    "id": "sv04.5-1",
    "name": "Bulbasaur",
    "set_id": "sv04.5",
    "card_number": "1/191",
    "rarity": "◇",
    "types": ["grass"],
    "hp": 70,
    "image_url_small": "https://cdn.tcgdex.net/cards/sv/sv04.5/1/low.webp",
    "image_url_large": "https://cdn.tcgdex.net/cards/sv/sv04.5/1/high.webp"
  }
}
```

**Error Responses:**

| Status | Code         | Message                    |
| ------ | ------------ | -------------------------- |
| 401    | UNAUTHORIZED | Not authenticated          |
| 403    | FORBIDDEN    | Access denied              |
| 404    | NOT_FOUND    | Collection entry not found |

---

#### PATCH /api/collection/:userCardId

Update a collection entry (quantity, wishlist status).

**Headers:**

```
Authorization: Bearer <access_token>
```

**Path Parameters:**

| Parameter  | Type | Description                |
| ---------- | ---- | -------------------------- |
| userCardId | uuid | Unique collection entry ID |

**Request Body:**

```json
{
  "quantity": 3,
  "wishlisted": true
}
```

**Response (200 OK):**

```json
{
  "id": "user-card-uuid",
  "card_id": "sv04.5-1",
  "variant": "normal",
  "quantity": 3,
  "wishlisted": true,
  "created_at": "2026-01-11T10:00:00Z",
  "updated_at": "2026-01-11T12:00:00Z"
}
```

**Error Responses:**

| Status | Code                | Message                                   |
| ------ | ------------------- | ----------------------------------------- |
| 400    | VALIDATION_ERROR    | Quantity must be between 1 and 1000       |
| 401    | UNAUTHORIZED        | Not authenticated                         |
| 403    | FORBIDDEN           | Access denied                             |
| 404    | NOT_FOUND           | Collection entry not found                |
| 409    | CARD_LIMIT_EXCEEDED | Collection limit of 10,000 cards exceeded |

---

#### DELETE /api/collection/:userCardId

Remove a card from the user's collection.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Path Parameters:**

| Parameter  | Type | Description                |
| ---------- | ---- | -------------------------- |
| userCardId | uuid | Unique collection entry ID |

**Response (204 No Content)**

**Error Responses:**

| Status | Code         | Message                    |
| ------ | ------------ | -------------------------- |
| 401    | UNAUTHORIZED | Not authenticated          |
| 403    | FORBIDDEN    | Access denied              |
| 404    | NOT_FOUND    | Collection entry not found |

---

### 2.6 Collection Statistics

#### GET /api/collection/stats

Get statistics about the user's collection.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "total_cards": 150,
  "unique_cards": 75,
  "wishlisted_count": 10,
  "sets_with_cards": 5,
  "most_collected_set": {
    "id": "sv04.5",
    "name": "Surging Sparks",
    "owned": 45,
    "total": 191
  }
}
```

**Error Responses:**

| Status | Code         | Message           |
| ------ | ------------ | ----------------- |
| 401    | UNAUTHORIZED | Not authenticated |

---

#### GET /api/collection/stats/sets

Get set completion statistics for the user.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Query Parameters:**

| Parameter     | Type    | Default | Description                     |
| ------------- | ------- | ------- | ------------------------------- |
| include_empty | boolean | false   | Include sets with 0 cards owned |

**Response (200 OK):**

```json
{
  "data": [
    {
      "set_id": "sv04.5",
      "set_name": "Surging Sparks",
      "series": "Scarlet & Violet",
      "total_cards": 191,
      "owned_cards": 45,
      "completion_percentage": 23.56
    },
    {
      "set_id": "sv05",
      "set_name": "Temporal Forces",
      "series": "Scarlet & Violet",
      "total_cards": 162,
      "owned_cards": 30,
      "completion_percentage": 18.52
    }
  ]
}
```

**Error Responses:**

| Status | Code         | Message           |
| ------ | ------------ | ----------------- |
| 401    | UNAUTHORIZED | Not authenticated |

---

### 2.7 Export

#### GET /api/collection/export

Export the user's collection as CSV.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```
Content-Type: text/csv
Content-Disposition: attachment; filename="collection_20260111_120000.csv"

card_id,name,set,card_number,rarity,quantity,variant,wishlisted
sv04.5-1,Bulbasaur,Surging Sparks,1/191,◇,2,normal,false
sv04.5-25,Pikachu,Surging Sparks,25/191,◇,1,holo,true
```

**Error Responses:**

| Status | Code         | Message           |
| ------ | ------------ | ----------------- |
| 401    | UNAUTHORIZED | Not authenticated |

---

### 2.8 Analytics Events

#### POST /api/analytics/events

Track a user action for analytics.

**Headers:**

```
Authorization: Bearer <access_token>  (optional for anonymous events)
```

**Request Body:**

```json
{
  "event_type": "card_viewed",
  "event_data": {
    "card_id": "sv04.5-1",
    "source": "search"
  }
}
```

**Response (201 Created):**

```json
{
  "id": "event-uuid",
  "event_type": "card_viewed",
  "created_at": "2026-01-11T10:00:00Z"
}
```

**Error Responses:**

| Status | Code             | Message            |
| ------ | ---------------- | ------------------ |
| 400    | VALIDATION_ERROR | Invalid event_type |

**Supported Event Types:**

| Event Type          | Description                  | Required Data              |
| ------------------- | ---------------------------- | -------------------------- |
| user_registered     | User completed registration  | -                          |
| user_login          | User logged in               | -                          |
| card_added          | Card added to collection     | card_id, variant, quantity |
| card_removed        | Card removed from collection | card_id                    |
| card_viewed         | Card details viewed          | card_id                    |
| search_performed    | Search query executed        | query, filters             |
| collection_exported | Collection exported to CSV   | card_count                 |

---

## 3. Authentication and Authorization

### Authentication Mechanism

The API uses Supabase Auth with JWT tokens for authentication.

#### Token Flow

1. User authenticates via `/api/auth/login` or `/api/auth/register`
2. Supabase returns an `access_token` (JWT) and `refresh_token`
3. Client includes `access_token` in the `Authorization` header for subsequent requests
4. Tokens are verified on each request via Supabase middleware
5. Expired tokens can be refreshed using the `refresh_token`

#### Request Header

```
Authorization: Bearer <access_token>
```

### Authorization Rules

| Resource          | Anonymous | Authenticated | Notes                              |
| ----------------- | --------- | ------------- | ---------------------------------- |
| Sets (read)       | ✅        | ✅            | Public data                        |
| Cards (read)      | ✅        | ✅            | Public data                        |
| Cards (search)    | ✅        | ✅            | Rate limited                       |
| Profile           | ❌        | ✅ (own only) | RLS enforced                       |
| Collection        | ❌        | ✅ (own only) | RLS enforced                       |
| Collection Stats  | ❌        | ✅ (own only) | RLS enforced                       |
| Export            | ❌        | ✅ (own only) | RLS enforced                       |
| Analytics (write) | ✅        | ✅            | Anonymous events have null user_id |

### Row-Level Security (RLS)

All user data is protected by Supabase RLS policies:

- **profiles**: Users can only read/update their own profile
- **user_cards**: Users can only CRUD their own collection entries
- **cards/sets**: Public read access for all users
- **analytics_events**: Users can only insert events with their own user_id (or null)

### Session Management

- Sessions persist across browser sessions until explicit logout
- Access tokens expire after 1 hour (configurable in Supabase)
- Refresh tokens are used to obtain new access tokens
- Logout invalidates all session data

---

## 4. Validation and Business Logic

### 4.1 Input Validation

All input validation is performed using Zod schemas.

#### Authentication Validation

| Field    | Rules                        |
| -------- | ---------------------------- |
| email    | Valid email format, required |
| password | Min 8 characters, required   |

#### Profile Validation

| Field                | Rules                          |
| -------------------- | ------------------------------ |
| onboarding_completed | Boolean                        |
| favorite_type        | Optional string (Pokémon type) |
| favorite_set         | Optional string (valid set ID) |

#### Collection Entry Validation

| Field      | Rules                                                       |
| ---------- | ----------------------------------------------------------- |
| card_id    | Required, must exist in cards table                         |
| variant    | Required, enum: `normal`, `reverse`, `holo`, `firstEdition` |
| quantity   | Integer, range 1-1000, default 1                            |
| wishlisted | Boolean, default false                                      |

#### Pagination Validation

| Field | Rules                              |
| ----- | ---------------------------------- |
| page  | Integer, min 1, default 1          |
| limit | Integer, range 1-100, default 20   |
| sort  | Enum of allowed sort fields        |
| order | Enum: `asc`, `desc`, default `asc` |

### 4.2 Business Logic Implementation

#### Duplicate Card Handling (US-015)

When adding a card to collection:

1. Check if `user_id + card_id + variant` already exists
2. If exists: increment quantity by the specified amount
3. If not exists: create new user_card entry
4. Return appropriate response (200 for update, 201 for create)

```
POST /api/collection
- If card+variant exists → Update quantity, return 200
- If card+variant new → Create entry, return 201
```

#### Card Limit Enforcement (US-018)

Total card limit: 10,000 cards per user (sum of all quantities)

1. Before INSERT/UPDATE on user_cards, calculate new total
2. If new total > 10,000, reject with 409 CARD_LIMIT_EXCEEDED
3. Return warning when total > 9,500

Database trigger `check_card_limit()` enforces at DB level.

#### Per-Variant Limit

Per-variant limit: 1,000 copies per card+variant combination

1. Validate quantity constraint: `1 <= quantity <= 1000`
2. Reject with 409 VARIANT_LIMIT_EXCEEDED if exceeded

Database CHECK constraint enforces at DB level.

#### Set Completion Calculation (US-023)

```
completion_percentage = (unique_owned_cards / set.total_cards) * 100
```

- Based on unique cards, not quantities
- Different variants of same card count as one unique card

#### CSV Export Format (US-024)

Export includes the following columns:

```csv
card_id,name,set,card_number,rarity,quantity,variant,wishlisted
```

Filename format: `collection_YYYYMMDD_HHMMSS.csv`

### 4.3 Rate Limiting

| Action         | Limit        | Window     |
| -------------- | ------------ | ---------- |
| Card additions | 100 requests | 1 minute   |
| Search queries | 60 requests  | 1 minute   |
| Login attempts | 5 attempts   | 15 minutes |
| Password reset | 3 requests   | 1 hour     |
| Registration   | 5 requests   | 1 hour     |

Rate limiting is implemented at the middleware level using request tracking.

### 4.4 Error Response Format

All API errors follow a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

#### Standard Error Codes

| Code                   | HTTP Status | Description                              |
| ---------------------- | ----------- | ---------------------------------------- |
| VALIDATION_ERROR       | 400         | Request body or params failed validation |
| UNAUTHORIZED           | 401         | Missing or invalid authentication        |
| FORBIDDEN              | 403         | Authenticated but not authorized         |
| NOT_FOUND              | 404         | Resource does not exist                  |
| EMAIL_EXISTS           | 409         | Email already registered                 |
| CARD_LIMIT_EXCEEDED    | 409         | 10,000 card limit exceeded               |
| VARIANT_LIMIT_EXCEEDED | 409         | 1,000 per-variant limit exceeded         |
| RATE_LIMIT_EXCEEDED    | 429         | Too many requests                        |
| INTERNAL_ERROR         | 500         | Unexpected server error                  |

### 4.5 Caching Strategy

| Resource   | Cache Strategy                   | TTL      |
| ---------- | -------------------------------- | -------- |
| Sets       | Cache on server, refresh daily   | 24 hours |
| Cards      | Cache on server, refresh daily   | 24 hours |
| Collection | No cache (real-time)             | -        |
| Stats      | Short cache, invalidate on write | 5 min    |

Card and set data is cached in the database (`last_synced_at` timestamp). External TCGDex API is used for syncing, not direct user queries.
