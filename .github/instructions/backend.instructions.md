---
applyTo: "src/pages/api/**,src/db/**,src/middleware/**,supabase/migrations/**"
---

# Backend and Database Guidelines

## Supabase Integration

### General Principles

- Use Supabase for backend services, including authentication and database interactions
- Follow Supabase guidelines for security and performance
- Use Zod schemas to validate data exchanged with the backend
- Use supabase from context.locals in Astro routes instead of importing supabaseClient directly
- Use SupabaseClient type from `src/db/supabase.client.ts`, not from `@supabase/supabase-js`

### Prerequisites for Supabase Setup

Before integrating Supabase:

- Install the `@supabase/supabase-js` package
- Ensure `/supabase/config.toml` exists
- Ensure `/src/db/database.types.ts` contains correct database type definitions

### File Structure for Supabase

1. **Supabase Client** (`/src/db/supabase.client.ts`):

```ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
```

2. **Middleware** (`/src/middleware/index.ts`):

```ts
import { defineMiddleware } from "astro:middleware";
import { supabaseClient } from "../db/supabase.client.ts";

export const onRequest = defineMiddleware((context, next) => {
  context.locals.supabase = supabaseClient;
  return next();
});
```

3. **TypeScript Definitions** (`src/env.d.ts`):

```ts
/// <reference types="astro/client" />

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./db/database.types.ts";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### Using MCP for Supabase Documentation

For up-to-date Supabase API documentation and best practices, use the MCP library documentation tool:

```
@mcp resolve-library-id supabase
@mcp get-library-docs /supabase/supabase [topic]
```

This provides current documentation for Supabase features including:

- Authentication patterns
- Database queries and RLS policies
- Real-time subscriptions
- Storage operations
- Edge Functions

## Database Migrations

### Creating Migration Files

When creating database migrations in `supabase/migrations/`:

**Naming Convention:** `YYYYMMDDHHmmss_short_description.sql` (UTC time)

- Example: `20240906123045_create_profiles.sql`

### SQL Guidelines for Migrations

- Include header comment with metadata (purpose, affected tables, considerations)
- Write all SQL in lowercase
- Add thorough comments explaining each step
- Add copious comments for destructive operations (truncate, drop, alter)
- **ALWAYS enable Row Level Security (RLS)** on new tables, even for public access
- RLS Policies must be granular:
  - One policy per operation (select, insert, update, delete)
  - Separate policies for each role (`anon` and `authenticated`)
  - Include comments explaining rationale and behavior
  - For public access, policy can return `true`
- Ensure policies cover all relevant access scenarios based on table purpose

### Migration Example

```sql
-- Migration: Create user profiles table
-- Purpose: Store user profile information
-- Affected: New table 'profiles'

create table profiles (
  id uuid primary key references auth.users(id),
  username text unique not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table profiles enable row level security;

-- Policy: Allow authenticated users to view all profiles
create policy "profiles_select_authenticated"
  on profiles for select
  to authenticated
  using (true);

-- Policy: Allow users to insert their own profile
create policy "profiles_insert_own"
  on profiles for insert
  to authenticated
  with check (auth.uid() = id);
```

## Anti-patterns

### Backend Anti-patterns to Avoid

- Don't query database directly in components - use API routes
- Avoid exposing service_role key in frontend code
- Don't skip RLS policies - always enable them for security
- Avoid N+1 queries - use proper joins or batch queries
- Don't forget to validate input data with Zod schemas
- Avoid storing sensitive data in localStorage - use httpOnly cookies
- Don't bypass authentication checks in API routes
