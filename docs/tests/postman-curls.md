# Postman cURL Commands - Profile API

Minimal cURL commands for manual testing in Postman.

## Setup

- Base URL: `http://localhost:3000`
- Supabase: `npx supabase start`
- Dev server: `npm run dev`

## GET /api/profile Test Cases

### 1. Success - Valid Token

```bash
curl -X GET http://localhost:3000/api/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

Expected: 200 OK with ProfileDTO

### 2. Unauthorized - Missing Header

```bash
curl -X GET http://localhost:3000/api/profile \
  -H "Content-Type: application/json"
```

Expected: 401 UNAUTHORIZED

### 3. Unauthorized - Invalid Token

```bash
curl -X GET http://localhost:3000/api/profile \
  -H "Authorization: Bearer invalid_token" \
  -H "Content-Type: application/json"
```

Expected: 401 UNAUTHORIZED

### 4. Not Found - Profile Missing

```bash
curl -X GET http://localhost:3000/api/profile \
  -H "Authorization: Bearer VALID_TOKEN_WITHOUT_PROFILE" \
  -H "Content-Type: application/json"
```

Expected: 404 NOT_FOUND

## Notes

- Replace `YOUR_ACCESS_TOKEN` with actual token from login
- `Cache-Control: no-store` header present in 200 responses
- Copy-paste directly into Postman

## Troubleshooting

**If you get 404 "Profile not found" with a valid token:**

The profile row doesn't exist in the database. The issue is likely that the auto-create trigger didn't fire.

**Step 1: Check if user exists**

1. Open Supabase Studio: `http://127.0.0.1:54323`
2. Go to **SQL Editor** (bottom left)
3. Run this query to find your user ID:
   ```sql
   SELECT id, email FROM auth.users LIMIT 5;
   ```
4. Copy the `id` (UUID) of your test user

**Step 2: Check if profile exists** 5. Run this query (replace `USER_ID` with the UUID from step 4):

```sql
SELECT * FROM profiles WHERE id = 'USER_ID';
```

6. If no rows returned, the profile wasn't created

**Step 3: Create profile manually or re-register**

Option A - Manual insert (one-time fix):

```sql
INSERT INTO profiles (id, created_at, updated_at)
VALUES ('USER_ID', now(), now());
```

Option B - Clean re-register (best practice):

1.  Delete the test user from `auth.users` table
2.  Re-register via `/api/auth/register`
3.  Trigger should auto-create profile this time

## PATCH /api/profile Test Cases

### 1. Success - Update onboarding_completed

```bash
curl -X PATCH http://localhost:3000/api/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"onboarding_completed": true}'
```

Expected: 200 OK with updated ProfileDTO

### 2. Success - Update favorite_type

```bash
curl -X PATCH http://localhost:3000/api/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"favorite_type": "water"}'
```

Expected: 200 OK with updated ProfileDTO

### 3. Success - Update favorite_set

```bash
curl -X PATCH http://localhost:3000/api/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"favorite_set": "sv05"}'
```

Expected: 200 OK with updated ProfileDTO (replace `sv05` with valid set ID)

### 4. Success - Update multiple fields

```bash
curl -X PATCH http://localhost:3000/api/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"onboarding_completed": true, "favorite_type": "fire", "favorite_set": "sv04"}'
```

Expected: 200 OK with updated ProfileDTO

### 5. Success - Clear favorite_type by setting to null

```bash
curl -X PATCH http://localhost:3000/api/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"favorite_type": null}'
```

Expected: 200 OK with ProfileDTO (favorite_type cleared)

### 6. Success - Clear favorite_set by setting to null

```bash
curl -X PATCH http://localhost:3000/api/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"favorite_set": null}'
```

Expected: 200 OK with ProfileDTO (favorite_set cleared)

### 7. Validation Error - Invalid favorite_type

```bash
curl -X PATCH http://localhost:3000/api/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"favorite_type": "invalid_type"}'
```

Expected: 400 VALIDATION_ERROR with message about invalid type

### 8. Validation Error - Non-existent favorite_set

```bash
curl -X PATCH http://localhost:3000/api/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"favorite_set": "nonexistent_set_id"}'
```

Expected: 400 VALIDATION_ERROR with message about set not found

### 9. Validation Error - Empty payload (no fields provided)

```bash
curl -X PATCH http://localhost:3000/api/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected: 400 VALIDATION_ERROR with message about at least one field required

### 10. Validation Error - Invalid JSON

```bash
curl -X PATCH http://localhost:3000/api/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{invalid json'
```

Expected: 400 VALIDATION_ERROR with message about invalid JSON

### 11. Unauthorized - Missing Authorization header

```bash
curl -X PATCH http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -d '{"favorite_type": "water"}'
```

Expected: 401 UNAUTHORIZED

### 12. Unauthorized - Invalid token

```bash
curl -X PATCH http://localhost:3000/api/profile \
  -H "Authorization: Bearer invalid_token" \
  -H "Content-Type: application/json" \
  -d '{"favorite_type": "water"}'
```

Expected: 401 UNAUTHORIZED

### 13. Not Found - Profile missing

```bash
curl -X PATCH http://localhost:3000/api/profile \
  -H "Authorization: Bearer VALID_TOKEN_WITHOUT_PROFILE" \
  -H "Content-Type: application/json" \
  -d '{"favorite_type": "water"}'
```

Expected: 404 NOT_FOUND

## GET /api/sets Test Cases

Public endpoint for retrieving paginated list of card sets.

### 1. Success - Default pagination

```bash
curl -X GET "http://localhost:3000/api/sets" \
  -H "Content-Type: application/json"
```

Expected: 200 OK with paginated sets data (page 1, limit 20, sorted by name asc)

### 2. Success - Custom pagination

```bash
curl -X GET "http://localhost:3000/api/sets?page=2&limit=50" \
  -H "Content-Type: application/json"
```

Expected: 200 OK with page 2 of 50 items per page

### 3. Success - Sorted by release date (newest first)

```bash
curl -X GET "http://localhost:3000/api/sets?sort=release_date&order=desc" \
  -H "Content-Type: application/json"
```

Expected: 200 OK sorted by release_date descending

### 4. Success - Search filter

```bash
curl -X GET "http://localhost:3000/api/sets?search=base" \
  -H "Content-Type: application/json"
```

Expected: 200 OK with sets containing "base" in name

### 5. Success - Series filter

```bash
curl -X GET "http://localhost:3000/api/sets?series=Gym%20Heroes" \
  -H "Content-Type: application/json"
```

Expected: 200 OK with sets from "Gym Heroes" series

### 6. Success - Combined filters

```bash
curl -X GET "http://localhost:3000/api/sets?search=base&sort=release_date&order=desc&limit=10" \
  -H "Content-Type: application/json"
```

Expected: 200 OK with 10 sets containing "base", sorted by release_date descending

### 7. Validation Error - Invalid page

```bash
curl -X GET "http://localhost:3000/api/sets?page=0" \
  -H "Content-Type: application/json"
```

Expected: 400 VALIDATION_ERROR with "page must be an integer >= 1"

### 8. Validation Error - Invalid limit

```bash
curl -X GET "http://localhost:3000/api/sets?limit=200" \
  -H "Content-Type: application/json"
```

Expected: 400 VALIDATION_ERROR with "limit must be between 1 and 100"

### 9. Validation Error - Invalid sort

```bash
curl -X GET "http://localhost:3000/api/sets?sort=invalid" \
  -H "Content-Type: application/json"
```

Expected: 400 VALIDATION_ERROR

### 10. Validation Error - Invalid order

```bash
curl -X GET "http://localhost:3000/api/sets?order=invalid" \
  -H "Content-Type: application/json"
```

Expected: 400 VALIDATION_ERROR

### 11. Success - Empty search results

```bash
curl -X GET "http://localhost:3000/api/sets?search=nonexistent" \
  -H "Content-Type: application/json"
```

Expected: 200 OK with empty data array and pagination showing total_items: 0

## GET /api/sets/:setId Test Cases

Public endpoint for retrieving a single card set by its unique identifier.

### 1. Success - Valid set ID

```bash
curl -X GET "http://localhost:3000/api/sets/base1" \
  -H "Content-Type: application/json"
```

Expected: 200 OK with SetDetailDTO including full metadata (id, name, series, total_cards, release_date, logo_url, symbol_url, last_synced_at, created_at, updated_at)

### 2. Success - Another valid set ID

```bash
curl -X GET "http://localhost:3000/api/sets/sv04pt" \
  -H "Content-Type: application/json"
```

Expected: 200 OK with SetDetailDTO for Scarlet & Violet Set 4 Paradox Rift

### 3. Not Found - Non-existent set ID

```bash
curl -X GET "http://localhost:3000/api/sets/nonexistent_set" \
  -H "Content-Type: application/json"
```

Expected: 404 NOT_FOUND with error response

### 4. Validation Error - Empty setId

```bash
curl -X GET "http://localhost:3000/api/sets/" \
  -H "Content-Type: application/json"
```

Expected: 404 (Astro route not matched)

### 5. Validation Error - Invalid characters in setId

```bash
curl -X GET "http://localhost:3000/api/sets/set%23123" \
  -H "Content-Type: application/json"
```

Expected: 400 VALIDATION_ERROR with message about invalid setId format

### 6. Validation Error - Special characters not allowed

```bash
curl -X GET "http://localhost:3000/api/sets/set@123" \
  -H "Content-Type: application/json"
```

Expected: 400 VALIDATION_ERROR

### 7. Success - setId with allowed special characters

```bash
curl -X GET "http://localhost:3000/api/sets/set_123-v2.0" \
  -H "Content-Type: application/json"
```

Expected: 200 OK if set exists, or 404 NOT_FOUND if it doesn't (but format is valid)

### 8. Verify Cache-Control headers

```bash
curl -X GET "http://localhost:3000/api/sets/base1" \
  -H "Content-Type: application/json" \
  -i
```

Expected: 200 OK with header `Cache-Control: public, max-age=86400, stale-while-revalidate=60`

## Notes

- Replace set IDs with actual IDs from your database (query `/api/sets` to discover available sets)
- Valid setId format: letters, numbers, dots (.), underscores (\_), dashes (-)
- Response includes full set metadata: `last_synced_at`, `created_at`, `updated_at` (useful for sync tracking)
- `Cache-Control: public, max-age=86400, stale-while-revalidate=60` allows CDN caching for 24 hours
- Copy-paste directly into Postman
