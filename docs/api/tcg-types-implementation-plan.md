# API Endpoint Implementation Plan: GET /api/tcg-types

## 1. Endpoint Overview

This endpoint retrieves all available Trading Card Game (TCG) types from the database. It serves as a lookup endpoint for TCG types that will be used throughout the application to categorize cards, sets, and other resources. No authentication is required as TCG types are public reference data.

**Purpose:** Provide a list of all supported TCG types (e.g., Pokémon TCG) for use in UI dropdowns, filters, and data categorization.

## 2. Request Details

- **HTTP Method:** GET
- **URL Structure:** `/api/tcg-types`
- **Authentication:** None required (public endpoint)
- **Query Parameters:** None
- **Request Body:** None

## 3. Used Types

### Response DTO

```typescript
// Already defined in src/types.ts
export interface TcgTypeDto {
  id: DbTcgType["id"]; // smallint
  code: DbTcgType["code"]; // varchar(20)
  name: DbTcgType["name"]; // varchar(100)
}
```

### API Response Wrapper

```typescript
interface TcgTypesResponse {
  data: TcgTypeDto[];
}
```

**Note:** No validation schema needed as this endpoint accepts no input parameters.

## 4. Response Details

### Success Response (200 OK)

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

**Status Code:** 200 OK

**Response Structure:**

- `data`: Array of TCG type objects
- Each object contains `id`, `code`, and `name` fields
- Array may be empty if no TCG types exist (unlikely in practice)

### Error Response (500 Internal Server Error)

```json
{
  "error": "Database error occurred while retrieving TCG types"
}
```

**Status Code:** 500 Internal Server Error

## 5. Data Flow

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Client    │────────▶│   Astro     │────────▶│   Service   │────────▶│  Supabase   │
│             │  Request │  API Route  │  Call   │   Layer     │  Query  │  Database   │
└─────────────┘         └─────────────┘         └─────────────┘         └─────────────┘
                               │                       │                       │
                               │                       │                       │
                               ▼                       ▼                       ▼
┌─────────────┐         ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Client    │◀────────│   Astro     │◀────────│   Service   │◀────────│  Supabase   │
│             │ Response│  API Route  │  DTO    │   Layer     │  Rows   │  Database   │
└─────────────┘         └─────────────┘         └─────────────┘         └─────────────┘
```

### Detailed Steps:

1. **Request Reception:** Astro API route receives GET request at `/api/tcg-types`
2. **Database Query:** Service layer queries `tcg_types` table via Supabase client from `context.locals.supabase`
3. **Data Transformation:** Map database rows to `TcgTypeDto` format (convert snake_case to camelCase if needed)
4. **Response Formation:** Wrap DTO array in response object with `data` property
5. **Response Delivery:** Return JSON response with appropriate status code

### Database Query

```typescript
const { data, error } = await supabase.from("tcg_types").select("id, code, name").order("id", { ascending: true });
```

**Note:**

- Query excludes `created_at` timestamp as it's not needed in the API response
- Results ordered by `id` for consistent ordering
- No RLS policies needed as this is public reference data

## 6. Security Considerations

### Authentication & Authorization

- **No authentication required** - TCG types are public reference data
- **No authorization checks needed** - All users (including anonymous) can access this data
- **RLS policies:** Table should have a public read policy allowing anonymous access

### Data Validation

- **No input validation needed** - Endpoint accepts no parameters
- **Output sanitization:** Not required as data comes from controlled database seeding

### Potential Threats & Mitigations

1. **Database Injection:**
   - Risk: None (no user input)
   - Mitigation: N/A

2. **Unauthorized Access:**
   - Risk: None (public endpoint by design)
   - Mitigation: N/A

3. **Data Exposure:**
   - Risk: Low (public reference data only)
   - Mitigation: Only expose necessary fields (`id`, `code`, `name`), exclude `created_at`

4. **DDoS/Rate Limiting:**
   - Risk: Medium (public endpoint without authentication)
   - Mitigation: Consider implementing rate limiting at CDN/gateway level for production

## 7. Error Handling

### Potential Error Scenarios

| Error Type                  | HTTP Status | Error Message                                        | Handling Strategy                                  |
| --------------------------- | ----------- | ---------------------------------------------------- | -------------------------------------------------- |
| Database connection failure | 500         | "Database error occurred while retrieving TCG types" | Log error, return generic error message            |
| Query execution failure     | 500         | "Database error occurred while retrieving TCG types" | Log error details, return generic error message    |
| Empty result set            | 200         | Return `{ data: [] }`                                | Return success with empty array (not an error)     |
| Unexpected exception        | 500         | "An unexpected error occurred"                       | Log full error stack, return generic error message |

### Error Response Format

```typescript
interface ErrorResponse {
  error: string;
}
```

### Error Logging Strategy

- Log all database errors with full details (query, error message, timestamp)
- Include request context (method, URL, timestamp)
- Do NOT expose internal error details to client
- Consider structured logging format (JSON) for easier parsing

### Implementation Pattern

```typescript
try {
  const { data, error } = await service.getTcgTypes();

  if (error) {
    // Log error with details
    console.error("[API Error]", {
      endpoint: "/api/tcg-types",
      error: error.message,
      timestamp: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ error: "Database error occurred while retrieving TCG types" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ data }), { status: 200, headers: { "Content-Type": "application/json" } });
} catch (error) {
  // Log unexpected errors
  console.error("[Unexpected Error]", error);

  return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}
```

## 8. Performance Considerations

### Current Performance Profile

- **Table Size:** Very small (initially 1 row, expected max ~10 rows)
- **Query Complexity:** Simple SELECT with no joins
- **Expected Response Time:** <10ms
- **Network Overhead:** Minimal payload (~50-200 bytes per TCG type)

### Optimization Strategies

1. **Database Level:**
   - No indexes needed beyond primary key (table is tiny)
   - Query already optimized (direct table scan is fastest for small tables)

2. **Application Level:**
   - **Client-side caching:** Implement long cache duration (24 hours+)
   - **CDN caching:** Configure cache headers for edge caching
   - **Response compression:** Enable gzip/brotli compression

3. **Caching Headers:**
   ```typescript
   headers: {
     "Content-Type": "application/json",
     "Cache-Control": "public, max-age=86400", // 24 hours
     "Vary": "Accept-Encoding"
   }
   ```

### Potential Bottlenecks

1. **Database Connection Pool:**
   - Risk: Low (simple query, small result set)
   - Mitigation: Use Supabase connection pooling (handled automatically)

2. **Cold Start (Edge Functions):**
   - Risk: N/A (endpoint should be in main API routes, not Edge Functions)
   - Mitigation: N/A

3. **Network Latency:**
   - Risk: Low (small payload)
   - Mitigation: CDN caching, proper cache headers

## 9. Implementation Steps

### Step 1: Create Service Layer

**File:** `src/lib/services/tcg-types.service.ts`

```typescript
import type { SupabaseClient } from "@/db/supabase.client";
import type { TcgTypeDto } from "@/types";

export class TcgTypesService {
  constructor(private supabase: SupabaseClient) {}

  async getTcgTypes(): Promise<{ data: TcgTypeDto[] | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .from("tcg_types")
        .select("id, code, name")
        .order("id", { ascending: true });

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error occurred"),
      };
    }
  }
}
```

### Step 2: Create API Route

**File:** `src/pages/api/tcg-types.ts`

```typescript
import type { APIRoute } from "astro";
import { TcgTypesService } from "@/lib/services/tcg-types.service";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    const service = new TcgTypesService(locals.supabase);
    const { data, error } = await service.getTcgTypes();

    if (error) {
      console.error("[API Error] /api/tcg-types:", {
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      return new Response(
        JSON.stringify({
          error: "Database error occurred while retrieving TCG types",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=86400",
        Vary: "Accept-Encoding",
      },
    });
  } catch (error) {
    console.error("[Unexpected Error] /api/tcg-types:", error);

    return new Response(
      JSON.stringify({
        error: "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
```

### Step 3: Verify Database RLS Policies

**Verify in Supabase Dashboard or migration files:**

```sql
-- Ensure RLS is enabled
alter table tcg_types enable row level security;

-- Policy for anonymous read access
create policy "tcg_types_select_public"
  on tcg_types for select
  to anon
  using (true);

-- Policy for authenticated read access
create policy "tcg_types_select_authenticated"
  on tcg_types for select
  to authenticated
  using (true);
```

**Note:** These policies should already exist from initial schema migration.

### Step 4: Test the Endpoint

1. **Manual Testing:**

   ```bash
   # Start development server
   npm run dev

   # Test endpoint
   curl http://localhost:4321/api/tcg-types
   ```

2. **Expected Response:**

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

3. **Verify Response Headers:**
   ```bash
   curl -I http://localhost:4321/api/tcg-types
   ```
   Should include:
   - `Content-Type: application/json`
   - `Cache-Control: public, max-age=86400`

### Step 5: Add Type Export (if needed)

**Verify in:** `src/types.ts`

The `TcgTypeDto` interface should already be defined. If not, add it:

```typescript
export interface TcgTypeDto {
  id: number;
  code: string;
  name: string;
}
```

### Step 6: Documentation & Comments

Add JSDoc comments to service methods:

```typescript
/**
 * Retrieves all available Trading Card Game types.
 *
 * @returns Promise resolving to array of TCG types or error
 * @example
 * const { data, error } = await service.getTcgTypes();
 * if (data) {
 *   console.log(data); // [{ id: 1, code: "pokemon", name: "Pokémon TCG" }]
 * }
 */
```

### Step 7: Integration Testing

Create test file (optional for MVP, recommended for production):

**File:** `src/pages/api/tcg-types.test.ts`

Test scenarios:

- Successfully retrieves TCG types
- Returns empty array when no TCG types exist
- Handles database errors gracefully
- Returns proper cache headers

### Step 8: Deployment Checklist

- [ ] Service layer created and tested
- [ ] API route implemented with proper error handling
- [ ] RLS policies verified in database
- [ ] Cache headers configured
- [ ] Error logging implemented
- [ ] Manual testing completed
- [ ] Types exported and documented
- [ ] Code reviewed and approved

---

## Summary

This endpoint is straightforward with minimal complexity:

- **No authentication** required (public data)
- **No input validation** needed (no parameters)
- **Simple database query** (single table, no joins)
- **Aggressive caching** recommended (data rarely changes)
- **Robust error handling** for database failures

The implementation follows the project's architectural patterns:

- Service layer for business logic
- Supabase client from `context.locals`
- Type safety with TypeScript interfaces
- Early error returns with proper logging
