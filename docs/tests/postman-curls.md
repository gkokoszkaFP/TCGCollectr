# Postman cURL Commands - GET /api/profile

Minimal cURL commands for manual testing in Postman.

## Setup

- Base URL: `http://localhost:3000`
- Supabase: `npx supabase start`
- Dev server: `npm run dev`

## Test Cases

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

**Step 2: Check if profile exists**
5. Run this query (replace `USER_ID` with the UUID from step 4):
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
   1. Delete the test user from `auth.users` table
   2. Re-register via `/api/auth/register` 
   3. Trigger should auto-create profile this time
