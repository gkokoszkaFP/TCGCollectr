# REST API Plan

## Overview

This document defines the REST API endpoints for TCGCollectr, a Trading Card Game collection management application. The API is built with Astro 5 server endpoints using TypeScript and integrates with Supabase for data persistence and authentication.

**Base URL:** `/api`

**Authentication:** Supabase Auth (JWT tokens via cookies/headers)

**Content Type:** `application/json`

---

## 1. Resources

| Resource           | Database Table(s)                       | Description                             |
| ------------------ | --------------------------------------- | --------------------------------------- |
| TCG Types          | `tcg_types`                             | Trading card game types                 |
| Sets               | `sets`                                  | Card sets/expansions                    |
| Cards              | `cards`, `card_prices`                  | Card catalog with pricing               |
| Rarities           | `rarities`                              | Card rarity lookup values               |
| Conditions         | `card_conditions`                       | Card condition lookup values            |
| Grading Companies  | `grading_companies`                     | Professional grading companies          |
| Collection Entries | `collection_entries`                    | User's card collection                  |
| User Lists         | `user_lists`, `list_entries`            | Custom organization lists               |
| User Profile       | `user_profiles`                         | User profile information                |
| Import Jobs        | `import_jobs`                           | Admin: data import tracking             |

---

## 2. Endpoints

### 2.1 TCG Types

#### GET `/api/tcg-types`

Retrieve all available TCG types.

**Authentication:** None required

**Query Parameters:** None

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "code": "pokemon",
      "name": "Pokémon TCG"
    }
  ]
}
```

**Success Codes:**
- `200 OK` - TCG types retrieved successfully

**Error Codes:**
- `500 Internal Server Error` - Database error

---

### 2.2 Sets

#### GET `/api/sets`

Retrieve all card sets with optional filtering and pagination.

**Authentication:** None required

**Query Parameters:**

| Parameter   | Type    | Required | Description                                      |
| ----------- | ------- | -------- | ------------------------------------------------ |
| `tcgTypeId` | integer | No       | Filter by TCG type ID                            |
| `series`    | string  | No       | Filter by series name                            |
| `search`    | string  | No       | Search by set name                               |
| `sortBy`    | string  | No       | Sort field: `name`, `releaseDate` (default)      |
| `sortOrder` | string  | No       | Sort direction: `asc`, `desc` (default)          |
| `page`      | integer | No       | Page number (default: 1)                         |
| `limit`     | integer | No       | Items per page: 20, 30, 50 (default: 20)         |

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "tcgTypeId": 1,
      "externalId": "sv1",
      "name": "Scarlet & Violet",
      "series": "Scarlet & Violet",
      "releaseDate": "2023-03-31",
      "totalCards": 258,
      "logoUrl": "https://...",
      "symbolUrl": "https://..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 150,
    "totalPages": 8
  }
}
```

**Success Codes:**
- `200 OK` - Sets retrieved successfully

**Error Codes:**
- `400 Bad Request` - Invalid query parameters
- `500 Internal Server Error` - Database error

---

#### GET `/api/sets/:setId`

Retrieve a specific set by ID.

**Authentication:** None required

**Path Parameters:**

| Parameter | Type | Description     |
| --------- | ---- | --------------- |
| `setId`   | uuid | Set identifier  |

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "tcgTypeId": 1,
    "externalId": "sv1",
    "name": "Scarlet & Violet",
    "series": "Scarlet & Violet",
    "releaseDate": "2023-03-31",
    "totalCards": 258,
    "logoUrl": "https://...",
    "symbolUrl": "https://...",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

**Success Codes:**
- `200 OK` - Set retrieved successfully

**Error Codes:**
- `400 Bad Request` - Invalid set ID format
- `404 Not Found` - Set not found
- `500 Internal Server Error` - Database error

---

### 2.3 Cards

#### GET `/api/cards`

Retrieve cards with filtering, search, and pagination.

**Authentication:** None required

**Query Parameters:**

| Parameter    | Type    | Required | Description                                       |
| ------------ | ------- | -------- | ------------------------------------------------- |
| `setId`      | uuid    | No       | Filter by set ID                                  |
| `tcgTypeId`  | integer | No       | Filter by TCG type ID                             |
| `rarityId`   | integer | No       | Filter by rarity ID                               |
| `cardType`   | string  | No       | Filter by card type (Pokémon, Trainer, Energy)    |
| `priceMin`   | number  | No       | Minimum market price (USD)                        |
| `priceMax`   | number  | No       | Maximum market price (USD)                        |
| `search`     | string  | No       | Full-text search (card name, Pokémon name)        |
| `sortBy`     | string  | No       | Sort field: `name`, `cardNumber`, `price`         |
| `sortOrder`  | string  | No       | Sort direction: `asc` (default), `desc`           |
| `page`       | integer | No       | Page number (default: 1)                          |
| `limit`      | integer | No       | Items per page: 20, 30, 50 (default: 20)          |

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "setId": "uuid",
      "externalId": "sv1-1",
      "name": "Sprigatito",
      "cardNumber": "1",
      "rarity": {
        "id": 1,
        "code": "common",
        "name": "Common"
      },
      "cardType": "Pokémon",
      "imageSmallUrl": "https://...",
      "price": {
        "market": 0.25,
        "currency": "USD",
        "lastUpdated": "2024-01-01T04:00:00Z"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 258,
    "totalPages": 13
  }
}
```

**Success Codes:**
- `200 OK` - Cards retrieved successfully

**Error Codes:**
- `400 Bad Request` - Invalid query parameters
- `500 Internal Server Error` - Database error

---

#### GET `/api/cards/:cardId`

Retrieve detailed information for a specific card. Fetches supplementary data from pokemontcg.io API on-demand if not cached.

**Authentication:** None required

**Path Parameters:**

| Parameter | Type | Description      |
| --------- | ---- | ---------------- |
| `cardId`  | uuid | Card identifier  |

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "tcgTypeId": 1,
    "setId": "uuid",
    "set": {
      "id": "uuid",
      "name": "Scarlet & Violet",
      "series": "Scarlet & Violet"
    },
    "externalId": "sv1-1",
    "name": "Sprigatito",
    "cardNumber": "1",
    "rarity": {
      "id": 1,
      "code": "common",
      "name": "Common"
    },
    "cardType": "Pokémon",
    "supertype": "Pokémon",
    "subtypes": ["Basic"],
    "hp": 60,
    "types": ["Grass"],
    "evolvesFrom": null,
    "abilities": null,
    "attacks": [
      {
        "name": "Bite",
        "cost": ["Grass"],
        "damage": "20",
        "text": ""
      }
    ],
    "weaknesses": [{"type": "Fire", "value": "×2"}],
    "resistances": null,
    "retreatCost": ["Colorless"],
    "rules": null,
    "artist": "Kouki Saitou",
    "flavorText": "Its fluffy fur is...",
    "imageSmallUrl": "https://...",
    "imageLargeUrl": "https://...",
    "price": {
      "market": 0.25,
      "low": 0.10,
      "mid": 0.20,
      "high": 0.50,
      "currency": "USD",
      "lastUpdated": "2024-01-01T04:00:00Z"
    },
    "apiDataFetched": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

**Success Codes:**
- `200 OK` - Card retrieved successfully

**Error Codes:**
- `400 Bad Request` - Invalid card ID format
- `404 Not Found` - Card not found
- `500 Internal Server Error` - Database error

---

#### GET `/api/cards/search`

Fast search endpoint for card name, set name, card number, and Pokémon name. Optimized for <200ms response time.

**Authentication:** None required

**Query Parameters:**

| Parameter | Type    | Required | Description                              |
| --------- | ------- | -------- | ---------------------------------------- |
| `q`       | string  | Yes      | Search query (min 2 characters)          |
| `limit`   | integer | No       | Max results (default: 20, max: 50)       |

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Pikachu",
      "cardNumber": "25",
      "setName": "Base Set",
      "imageSmallUrl": "https://...",
      "price": 15.00
    }
  ],
  "meta": {
    "query": "pikachu",
    "resultCount": 20,
    "hasMore": true
  }
}
```

**Success Codes:**
- `200 OK` - Search completed successfully

**Error Codes:**
- `400 Bad Request` - Missing or invalid query parameter
- `500 Internal Server Error` - Search error

---

### 2.4 Lookup Data (Rarities, Conditions, Grading Companies)

#### GET `/api/rarities`

Retrieve all rarity values.

**Authentication:** None required

**Query Parameters:**

| Parameter   | Type    | Required | Description              |
| ----------- | ------- | -------- | ------------------------ |
| `tcgTypeId` | integer | No       | Filter by TCG type ID    |

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "tcgTypeId": 1,
      "code": "common",
      "name": "Common",
      "sortOrder": 1
    }
  ]
}
```

**Success Codes:**
- `200 OK` - Rarities retrieved successfully

**Error Codes:**
- `500 Internal Server Error` - Database error

---

#### GET `/api/conditions`

Retrieve all card condition values.

**Authentication:** None required

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "code": "mint",
      "name": "Mint",
      "sortOrder": 1
    },
    {
      "id": 2,
      "code": "near_mint",
      "name": "Near Mint",
      "sortOrder": 2
    }
  ]
}
```

**Success Codes:**
- `200 OK` - Conditions retrieved successfully

**Error Codes:**
- `500 Internal Server Error` - Database error

---

#### GET `/api/grading-companies`

Retrieve all professional grading companies.

**Authentication:** None required

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "code": "PSA",
      "name": "Professional Sports Authenticator",
      "minGrade": 1.0,
      "maxGrade": 10.0
    }
  ]
}
```

**Success Codes:**
- `200 OK` - Grading companies retrieved successfully

**Error Codes:**
- `500 Internal Server Error` - Database error

---

### 2.5 Collection Entries

#### GET `/api/collection`

Retrieve the authenticated user's card collection.

**Authentication:** Required

**Query Parameters:**

| Parameter     | Type    | Required | Description                               |
| ------------- | ------- | -------- | ----------------------------------------- |
| `listId`      | uuid    | No       | Filter by list ID                         |
| `setId`       | uuid    | No       | Filter by set ID                          |
| `conditionId` | integer | No       | Filter by condition ID                    |
| `search`      | string  | No       | Search within collection (card name)      |
| `sortBy`      | string  | No       | Sort: `name`, `dateAdded`, `value`        |
| `sortOrder`   | string  | No       | Sort direction: `asc`, `desc` (default)   |
| `page`        | integer | No       | Page number (default: 1)                  |
| `limit`       | integer | No       | Items per page: 20, 30, 50 (default: 20)  |

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "card": {
        "id": "uuid",
        "name": "Pikachu",
        "cardNumber": "25",
        "setName": "Base Set",
        "imageSmallUrl": "https://...",
        "rarity": "Rare"
      },
      "condition": {
        "id": 2,
        "code": "near_mint",
        "name": "Near Mint"
      },
      "quantity": 2,
      "grading": {
        "company": {
          "id": 1,
          "code": "PSA",
          "name": "Professional Sports Authenticator"
        },
        "value": 9.5
      },
      "purchasePrice": 100.00,
      "currentPrice": 150.00,
      "notes": "First edition",
      "lists": [
        {"id": "uuid", "name": "Trade Binder"}
      ],
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 150,
    "totalPages": 8
  },
  "summary": {
    "totalEntries": 150,
    "totalCards": 275,
    "totalMarketValue": 5000.00,
    "totalPurchaseCost": 3500.00,
    "currency": "USD"
  }
}
```

**Success Codes:**
- `200 OK` - Collection retrieved successfully

**Error Codes:**
- `401 Unauthorized` - Authentication required
- `500 Internal Server Error` - Database error

---

#### POST `/api/collection`

Add a card to the authenticated user's collection.

**Authentication:** Required

**Request Body:**

```json
{
  "cardId": "uuid",
  "conditionId": 2,
  "quantity": 1,
  "gradingCompanyId": 1,
  "gradeValue": 9.5,
  "purchasePrice": 100.00,
  "notes": "First edition"
}
```

**Validation Rules:**
- `cardId` (required): Valid UUID, card must exist
- `conditionId` (required): Valid condition ID
- `quantity` (required): Integer > 0
- `gradingCompanyId` (optional): Valid grading company ID
- `gradeValue` (optional): Number 1.0-10.0, required if `gradingCompanyId` provided
- `purchasePrice` (optional): Number >= 0
- `notes` (optional): String, max 500 characters

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "cardId": "uuid",
    "conditionId": 2,
    "quantity": 1,
    "gradingCompanyId": 1,
    "gradeValue": 9.5,
    "purchasePrice": 100.00,
    "notes": "First edition",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "message": "Card added to collection successfully"
}
```

**Success Codes:**
- `201 Created` - Card added to collection

**Error Codes:**
- `400 Bad Request` - Validation error (details in response)
- `401 Unauthorized` - Authentication required
- `404 Not Found` - Card or condition not found
- `409 Conflict` - Duplicate entry (same card, condition, grade combination)
- `500 Internal Server Error` - Database error

---

#### GET `/api/collection/:entryId`

Retrieve a specific collection entry.

**Authentication:** Required

**Path Parameters:**

| Parameter | Type | Description              |
| --------- | ---- | ------------------------ |
| `entryId` | uuid | Collection entry ID      |

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "card": {
      "id": "uuid",
      "name": "Pikachu",
      "cardNumber": "25",
      "setId": "uuid",
      "setName": "Base Set",
      "imageSmallUrl": "https://...",
      "imageLargeUrl": "https://...",
      "rarity": "Rare"
    },
    "condition": {
      "id": 2,
      "code": "near_mint",
      "name": "Near Mint"
    },
    "quantity": 2,
    "grading": {
      "company": {
        "id": 1,
        "code": "PSA",
        "name": "Professional Sports Authenticator"
      },
      "value": 9.5
    },
    "purchasePrice": 100.00,
    "currentPrice": 150.00,
    "notes": "First edition",
    "lists": [
      {"id": "uuid", "name": "Trade Binder"}
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

**Success Codes:**
- `200 OK` - Entry retrieved successfully

**Error Codes:**
- `400 Bad Request` - Invalid entry ID format
- `401 Unauthorized` - Authentication required
- `404 Not Found` - Entry not found or not owned by user
- `500 Internal Server Error` - Database error

---

#### PATCH `/api/collection/:entryId`

Update a collection entry.

**Authentication:** Required

**Path Parameters:**

| Parameter | Type | Description              |
| --------- | ---- | ------------------------ |
| `entryId` | uuid | Collection entry ID      |

**Request Body:** (all fields optional)

```json
{
  "conditionId": 1,
  "quantity": 3,
  "gradingCompanyId": 1,
  "gradeValue": 10.0,
  "purchasePrice": 150.00,
  "notes": "Updated notes"
}
```

**Validation Rules:**
- Same as POST, but all fields optional
- At least one field must be provided
- Grade company required if grade value provided (and vice versa)
- Setting both `gradingCompanyId` and `gradeValue` to `null` removes grading info

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "conditionId": 1,
    "quantity": 3,
    "gradingCompanyId": 1,
    "gradeValue": 10.0,
    "purchasePrice": 150.00,
    "notes": "Updated notes",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "message": "Collection entry updated successfully"
}
```

**Success Codes:**
- `200 OK` - Entry updated successfully

**Error Codes:**
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Authentication required
- `404 Not Found` - Entry not found or not owned by user
- `409 Conflict` - Update would create duplicate entry
- `500 Internal Server Error` - Database error

---

#### DELETE `/api/collection/:entryId`

Remove a card from the collection.

**Authentication:** Required

**Path Parameters:**

| Parameter | Type | Description              |
| --------- | ---- | ------------------------ |
| `entryId` | uuid | Collection entry ID      |

**Response:**

```json
{
  "message": "Card removed from collection successfully"
}
```

**Success Codes:**
- `200 OK` - Entry deleted successfully

**Error Codes:**
- `400 Bad Request` - Invalid entry ID format
- `401 Unauthorized` - Authentication required
- `404 Not Found` - Entry not found or not owned by user
- `500 Internal Server Error` - Database error

---

#### GET `/api/collection/summary`

Get collection statistics summary.

**Authentication:** Required

**Response:**

```json
{
  "data": {
    "totalEntries": 150,
    "totalCards": 275,
    "uniqueCards": 150,
    "totalMarketValue": 5000.00,
    "totalPurchaseCost": 3500.00,
    "totalProfitLoss": 1500.00,
    "currency": "USD",
    "setCompletions": [
      {
        "setId": "uuid",
        "setName": "Base Set",
        "totalCards": 102,
        "ownedCards": 50,
        "completionPercentage": 49.0
      }
    ]
  }
}
```

**Success Codes:**
- `200 OK` - Summary retrieved successfully

**Error Codes:**
- `401 Unauthorized` - Authentication required
- `500 Internal Server Error` - Database error

---

### 2.6 User Lists

#### GET `/api/lists`

Retrieve the authenticated user's custom lists.

**Authentication:** Required

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Trade Binder",
      "sortOrder": 1,
      "cardCount": 25,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "totalLists": 3,
    "maxLists": 10
  }
}
```

**Success Codes:**
- `200 OK` - Lists retrieved successfully

**Error Codes:**
- `401 Unauthorized` - Authentication required
- `500 Internal Server Error` - Database error

---

#### POST `/api/lists`

Create a new custom list.

**Authentication:** Required

**Request Body:**

```json
{
  "name": "For Sale"
}
```

**Validation Rules:**
- `name` (required): String, 1-50 characters, unique per user
- User must have fewer than 10 lists

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "name": "For Sale",
    "sortOrder": 4,
    "cardCount": 0,
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "message": "List created successfully"
}
```

**Success Codes:**
- `201 Created` - List created successfully

**Error Codes:**
- `400 Bad Request` - Validation error (name too long, empty)
- `401 Unauthorized` - Authentication required
- `409 Conflict` - List name already exists for user
- `422 Unprocessable Entity` - Maximum list limit (10) reached
- `500 Internal Server Error` - Database error

---

#### GET `/api/lists/:listId`

Retrieve a specific list with its entries.

**Authentication:** Required

**Path Parameters:**

| Parameter | Type | Description      |
| --------- | ---- | ---------------- |
| `listId`  | uuid | List identifier  |

**Query Parameters:**

| Parameter  | Type    | Required | Description                               |
| ---------- | ------- | -------- | ----------------------------------------- |
| `page`     | integer | No       | Page number (default: 1)                  |
| `limit`    | integer | No       | Items per page (default: 20)              |

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "name": "Trade Binder",
    "sortOrder": 1,
    "entries": [
      {
        "id": "uuid",
        "collectionEntryId": "uuid",
        "card": {
          "id": "uuid",
          "name": "Pikachu",
          "cardNumber": "25",
          "setName": "Base Set",
          "imageSmallUrl": "https://..."
        },
        "condition": "Near Mint",
        "quantity": 2
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 25,
    "totalPages": 2
  }
}
```

**Success Codes:**
- `200 OK` - List retrieved successfully

**Error Codes:**
- `400 Bad Request` - Invalid list ID format
- `401 Unauthorized` - Authentication required
- `404 Not Found` - List not found or not owned by user
- `500 Internal Server Error` - Database error

---

#### PATCH `/api/lists/:listId`

Update a list's name or sort order.

**Authentication:** Required

**Path Parameters:**

| Parameter | Type | Description      |
| --------- | ---- | ---------------- |
| `listId`  | uuid | List identifier  |

**Request Body:**

```json
{
  "name": "Trading Cards",
  "sortOrder": 2
}
```

**Validation Rules:**
- `name` (optional): String, 1-50 characters, unique per user
- `sortOrder` (optional): Integer >= 0

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "name": "Trading Cards",
    "sortOrder": 2,
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "message": "List updated successfully"
}
```

**Success Codes:**
- `200 OK` - List updated successfully

**Error Codes:**
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Authentication required
- `404 Not Found` - List not found or not owned by user
- `409 Conflict` - List name already exists for user
- `500 Internal Server Error` - Database error

---

#### DELETE `/api/lists/:listId`

Delete a custom list. Cards remain in collection.

**Authentication:** Required

**Path Parameters:**

| Parameter | Type | Description      |
| --------- | ---- | ---------------- |
| `listId`  | uuid | List identifier  |

**Response:**

```json
{
  "message": "List deleted successfully"
}
```

**Success Codes:**
- `200 OK` - List deleted successfully

**Error Codes:**
- `400 Bad Request` - Invalid list ID format
- `401 Unauthorized` - Authentication required
- `404 Not Found` - List not found or not owned by user
- `500 Internal Server Error` - Database error

---

#### POST `/api/lists/:listId/entries`

Add collection entries to a list.

**Authentication:** Required

**Path Parameters:**

| Parameter | Type | Description      |
| --------- | ---- | ---------------- |
| `listId`  | uuid | List identifier  |

**Request Body:**

```json
{
  "collectionEntryIds": ["uuid1", "uuid2"]
}
```

**Validation Rules:**
- `collectionEntryIds` (required): Array of valid collection entry UUIDs
- All entries must belong to the authenticated user
- Entries already in list are skipped (no error)

**Response:**

```json
{
  "data": {
    "addedCount": 2,
    "skippedCount": 0
  },
  "message": "Entries added to list successfully"
}
```

**Success Codes:**
- `200 OK` - Entries added successfully

**Error Codes:**
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Authentication required
- `404 Not Found` - List or collection entries not found
- `500 Internal Server Error` - Database error

---

#### DELETE `/api/lists/:listId/entries/:entryId`

Remove a collection entry from a list.

**Authentication:** Required

**Path Parameters:**

| Parameter | Type | Description              |
| --------- | ---- | ------------------------ |
| `listId`  | uuid | List identifier          |
| `entryId` | uuid | Collection entry ID      |

**Response:**

```json
{
  "message": "Entry removed from list successfully"
}
```

**Success Codes:**
- `200 OK` - Entry removed from list successfully

**Error Codes:**
- `400 Bad Request` - Invalid ID format
- `401 Unauthorized` - Authentication required
- `404 Not Found` - List, entry, or list membership not found
- `500 Internal Server Error` - Database error

---

### 2.7 User Profile

#### GET `/api/profile`

Retrieve the authenticated user's profile.

**Authentication:** Required

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "displayName": "CardCollector",
    "avatarUrl": "https://...",
    "isAdmin": false,
    "emailVerified": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

**Success Codes:**
- `200 OK` - Profile retrieved successfully

**Error Codes:**
- `401 Unauthorized` - Authentication required
- `500 Internal Server Error` - Database error

---

#### PATCH `/api/profile`

Update the authenticated user's profile.

**Authentication:** Required

**Request Body:**

```json
{
  "displayName": "NewName",
  "avatarUrl": "https://..."
}
```

**Validation Rules:**
- `displayName` (optional): String, max 100 characters
- `avatarUrl` (optional): Valid URL string or null

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "displayName": "NewName",
    "avatarUrl": "https://...",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "message": "Profile updated successfully"
}
```

**Success Codes:**
- `200 OK` - Profile updated successfully

**Error Codes:**
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Authentication required
- `500 Internal Server Error` - Database error

---

#### DELETE `/api/profile`

Initiate account deletion (30-day soft delete).

**Authentication:** Required

**Response:**

```json
{
  "message": "Account scheduled for deletion. You have 30 days to recover your account by logging in."
}
```

**Success Codes:**
- `200 OK` - Account marked for deletion

**Error Codes:**
- `401 Unauthorized` - Authentication required
- `500 Internal Server Error` - Database error

---

### 2.8 Authentication

Authentication is handled via Supabase Auth. The following endpoints provide a thin wrapper for client-side convenience.

#### POST `/api/auth/register`

Register a new user account.

**Authentication:** None required

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Validation Rules:**
- `email` (required): Valid email format
- `password` (required): Minimum 8 characters

**Response:**

```json
{
  "data": {
    "userId": "uuid",
    "email": "user@example.com"
  },
  "message": "Registration successful. Please check your email to verify your account."
}
```

**Success Codes:**
- `201 Created` - Registration successful

**Error Codes:**
- `400 Bad Request` - Validation error
- `409 Conflict` - Email already registered
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Registration error

---

#### POST `/api/auth/login`

Authenticate user and create session.

**Authentication:** None required

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**

```json
{
  "data": {
    "userId": "uuid",
    "email": "user@example.com",
    "emailVerified": true
  },
  "message": "Login successful"
}
```

**Success Codes:**
- `200 OK` - Login successful

**Error Codes:**
- `400 Bad Request` - Missing credentials
- `401 Unauthorized` - Invalid credentials
- `403 Forbidden` - Email not verified
- `429 Too Many Requests` - Rate limit exceeded (brute force protection)
- `500 Internal Server Error` - Authentication error

---

#### POST `/api/auth/logout`

End the current session.

**Authentication:** Required

**Response:**

```json
{
  "message": "Logout successful"
}
```

**Success Codes:**
- `200 OK` - Logout successful

**Error Codes:**
- `500 Internal Server Error` - Logout error

---

#### POST `/api/auth/forgot-password`

Request password reset email.

**Authentication:** None required

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "message": "If an account exists with this email, a password reset link has been sent."
}
```

**Success Codes:**
- `200 OK` - Request processed (always returns 200 for security)

**Error Codes:**
- `400 Bad Request` - Invalid email format
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

---

#### POST `/api/auth/reset-password`

Reset password using token from email.

**Authentication:** None required (token-based)

**Request Body:**

```json
{
  "token": "reset-token-from-email",
  "password": "newSecurePassword123"
}
```

**Validation Rules:**
- `token` (required): Valid reset token
- `password` (required): Minimum 8 characters

**Response:**

```json
{
  "message": "Password reset successful. Please log in with your new password."
}
```

**Success Codes:**
- `200 OK` - Password reset successful

**Error Codes:**
- `400 Bad Request` - Validation error or invalid/expired token
- `500 Internal Server Error` - Server error

---

### 2.9 Admin Endpoints

#### GET `/api/admin/import-jobs`

Retrieve import job history (last 30 days).

**Authentication:** Required (Admin only)

**Query Parameters:**

| Parameter | Type    | Required | Description                                           |
| --------- | ------- | -------- | ----------------------------------------------------- |
| `status`  | string  | No       | Filter by status: pending, running, completed, failed |
| `page`    | integer | No       | Page number (default: 1)                              |
| `limit`   | integer | No       | Items per page (default: 20)                          |

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "jobType": "csv_import",
      "status": "completed",
      "startedAt": "2024-01-01T04:00:00Z",
      "completedAt": "2024-01-01T04:05:30Z",
      "duration": 330,
      "totalRecords": 15000,
      "successCount": 14995,
      "failureCount": 5,
      "errorDetails": null,
      "triggeredBy": null,
      "createdAt": "2024-01-01T04:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 30,
    "totalPages": 2
  }
}
```

**Success Codes:**
- `200 OK` - Jobs retrieved successfully

**Error Codes:**
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Admin access required
- `500 Internal Server Error` - Database error

---

#### GET `/api/admin/import-jobs/:jobId`

Retrieve details of a specific import job.

**Authentication:** Required (Admin only)

**Path Parameters:**

| Parameter | Type | Description        |
| --------- | ---- | ------------------ |
| `jobId`   | uuid | Import job ID      |

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "jobType": "csv_import",
    "status": "completed",
    "startedAt": "2024-01-01T04:00:00Z",
    "completedAt": "2024-01-01T04:05:30Z",
    "duration": 330,
    "totalRecords": 15000,
    "successCount": 14995,
    "failureCount": 5,
    "errorDetails": [
      {
        "row": 1234,
        "error": "Invalid card number format",
        "data": {"externalId": "invalid-id"}
      }
    ],
    "triggeredBy": {
      "id": "uuid",
      "displayName": "Admin User"
    },
    "createdAt": "2024-01-01T04:00:00Z"
  }
}
```

**Success Codes:**
- `200 OK` - Job retrieved successfully

**Error Codes:**
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Admin access required
- `404 Not Found` - Job not found
- `500 Internal Server Error` - Database error

---

#### POST `/api/admin/import-jobs`

Trigger a manual import job.

**Authentication:** Required (Admin only)

**Request Body:**

```json
{
  "jobType": "csv_import"
}
```

**Validation Rules:**
- `jobType` (required): Valid job type (e.g., `csv_import`)
- No job of same type can be currently running

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "jobType": "csv_import",
    "status": "pending",
    "createdAt": "2024-01-01T12:00:00Z"
  },
  "message": "Import job triggered successfully"
}
```

**Success Codes:**
- `202 Accepted` - Job queued successfully

**Error Codes:**
- `400 Bad Request` - Invalid job type
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Admin access required
- `409 Conflict` - Job of same type already running
- `500 Internal Server Error` - Server error

---

#### GET `/api/admin/statistics`

Retrieve aggregate platform statistics.

**Authentication:** Required (Admin only)

**Response:**

```json
{
  "data": {
    "users": {
      "total": 1500,
      "active": 1450,
      "softDeleted": 50,
      "newThisWeek": 25
    },
    "collections": {
      "totalEntries": 75000,
      "totalCards": 125000,
      "uniqueCardsTracked": 12000,
      "averageCardsPerUser": 86
    },
    "catalog": {
      "totalSets": 150,
      "totalCards": 15000,
      "lastImportAt": "2024-01-01T04:00:00Z",
      "pricesFreshnessHours": 8
    }
  }
}
```

**Success Codes:**
- `200 OK` - Statistics retrieved successfully

**Error Codes:**
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Admin access required
- `500 Internal Server Error` - Database error

---

## 3. Authentication and Authorization

### Authentication Mechanism

The API uses **Supabase Auth** with JWT tokens for authentication.

#### Token Handling

- **Access tokens** are short-lived JWTs (1 hour default)
- **Refresh tokens** are used to obtain new access tokens
- Tokens are stored in HTTP-only cookies for security
- The `Authorization: Bearer <token>` header is also supported

#### Session Management

- Sessions persist based on the "Remember me" preference (US-002)
- Sessions are invalidated on logout (US-004)
- Session expiration triggers re-authentication flow (US-033)

### Authorization Levels

| Level           | Description                                    | Access                                     |
| --------------- | ---------------------------------------------- | ------------------------------------------ |
| **Anonymous**   | Unauthenticated users                          | Read-only access to catalog, sets, cards   |
| **Authenticated** | Logged-in users with verified email          | Full collection and list management        |
| **Admin**       | Users with `is_admin = true` in user_profiles  | All above + admin endpoints                |

### Rate Limiting

| Endpoint Category | Rate Limit           | Window    |
| ----------------- | -------------------- | --------- |
| Authentication    | 5 requests           | 1 minute  |
| Search            | 30 requests          | 1 minute  |
| Collection Write  | 60 requests          | 1 minute  |
| General Read      | 100 requests         | 1 minute  |
| Admin Endpoints   | 30 requests          | 1 minute  |

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in window
- `X-RateLimit-Reset`: Unix timestamp when limit resets

### Security Headers

All responses include:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

---

## 4. Validation and Business Logic

### 4.1 Validation Rules by Resource

#### Collection Entries

| Field              | Type          | Validation                                                |
| ------------------ | ------------- | --------------------------------------------------------- |
| `cardId`           | UUID          | Required, must exist in cards table                       |
| `conditionId`      | Integer       | Required, must exist in card_conditions table             |
| `quantity`         | Integer       | Required, must be > 0                                     |
| `gradingCompanyId` | Integer       | Optional, must exist in grading_companies table           |
| `gradeValue`       | Decimal(3,1)  | Optional, range 1.0-10.0, required if company provided    |
| `purchasePrice`    | Decimal(10,2) | Optional, must be >= 0                                    |
| `notes`            | String        | Optional, max 500 characters                              |

**Business Rule:** If `gradeValue` is provided, `gradingCompanyId` must also be provided (US-019).

#### User Lists

| Field       | Type    | Validation                                  |
| ----------- | ------- | ------------------------------------------- |
| `name`      | String  | Required, 1-50 characters, unique per user  |
| `sortOrder` | Integer | Optional, >= 0                              |

**Business Rule:** Maximum 10 lists per user (FR-004).

#### Authentication

| Field      | Type   | Validation                      |
| ---------- | ------ | ------------------------------- |
| `email`    | String | Required, valid email format    |
| `password` | String | Required, minimum 8 characters  |

### 4.2 Business Logic Implementation

#### Duplicate Entry Handling (US-031)

When adding a card to collection:
1. Check if entry exists with same `user_id`, `card_id`, `condition_id`, `grading_company_id`, `grade_value`
2. If exists, return `409 Conflict` with option to update existing entry
3. Different conditions/grades create separate entries (by design)

#### Collection Value Calculation (US-016, US-017)

```
totalMarketValue = SUM(entry.quantity × card.marketPrice)
totalPurchaseCost = SUM(entry.quantity × entry.purchasePrice)
totalProfitLoss = totalMarketValue - totalPurchaseCost
```

Uses most recent `card_prices` record with `price_type = 'market'`.

#### List Limit Enforcement (FR-004, US-032)

Enforced at:
1. Database level: Trigger `check_user_list_limit()` 
2. API level: Check count before insert, return `422` if limit reached

#### Account Deletion Flow (US-005, US-006)

1. `DELETE /api/profile` sets `deleted_at = now()` (soft delete)
2. User can login within 30 days to restore (`deleted_at = null`)
3. Scheduled job permanently deletes accounts where `deleted_at < now() - interval '30 days'`

#### Price Data Freshness (US-012)

- Prices include `lastUpdated` timestamp from `card_prices.fetched_at`
- Frontend displays "Stale" indicator if > 24 hours old
- Daily import at 4:00 AM UTC keeps prices fresh (FR-007)

#### Search Performance (FR-002)

- Full-text search uses PostgreSQL GIN indexes
- Debounce at API level: return cached results if same query within 300ms
- Results limited to 20 by default for <200ms response time
- Search endpoint returns `hasMore` indicator for pagination

### 4.3 Error Response Format

All error responses follow a consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "quantity",
        "message": "Quantity must be greater than 0"
      }
    ]
  }
}
```

#### Error Codes

| Code                  | HTTP Status | Description                                |
| --------------------- | ----------- | ------------------------------------------ |
| `VALIDATION_ERROR`    | 400         | Request body failed validation             |
| `INVALID_PARAMETER`   | 400         | Invalid query or path parameter            |
| `UNAUTHORIZED`        | 401         | Authentication required                    |
| `FORBIDDEN`           | 403         | Insufficient permissions                   |
| `NOT_FOUND`           | 404         | Resource not found                         |
| `CONFLICT`            | 409         | Resource conflict (duplicate, etc.)        |
| `LIMIT_EXCEEDED`      | 422         | Business rule limit exceeded               |
| `RATE_LIMITED`        | 429         | Too many requests                          |
| `INTERNAL_ERROR`      | 500         | Unexpected server error                    |

---

## 5. API Versioning

The API currently does not use versioning (v1 is implicit). Future breaking changes will introduce versioned endpoints:

- `/api/v2/...` for breaking changes
- Original `/api/...` endpoints maintained for backwards compatibility

---

## 6. Implementation Notes

### Astro Server Endpoints

All endpoints are implemented as Astro server endpoints in `src/pages/api/`:

```typescript
// src/pages/api/cards/index.ts
export const prerender = false;

import { z } from "zod";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ locals, request }) => {
  const supabase = locals.supabase;
  // Implementation...
};
```

### Supabase Client Access

Access Supabase client via `context.locals.supabase` (injected by middleware):

```typescript
const { data, error } = await context.locals.supabase
  .from("cards")
  .select("*")
  .limit(20);
```

### Input Validation

Use Zod schemas for request validation:

```typescript
const createCollectionEntrySchema = z.object({
  cardId: z.string().uuid(),
  conditionId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  gradingCompanyId: z.number().int().positive().optional(),
  gradeValue: z.number().min(1).max(10).optional(),
  purchasePrice: z.number().nonnegative().optional(),
  notes: z.string().max(500).optional(),
});
```

### Response Helpers

Create consistent response helpers:

```typescript
// src/lib/api/responses.ts
export const successResponse = (data: unknown, status = 200) => 
  new Response(JSON.stringify({ data }), { status });

export const errorResponse = (code: string, message: string, status: number, details?: unknown) =>
  new Response(JSON.stringify({ error: { code, message, details } }), { status });
```
