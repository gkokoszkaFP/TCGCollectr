---
applyTo: "**/*.astro,src/middleware/**,src/layouts/**"
---

# Astro Guidelines

## Core Principles

- Leverage View Transitions API for smooth page transitions (use ClientRouter)
- Use content collections with type safety for blog posts, documentation, etc.
- Use image optimization with the Astro Image integration
- Implement hybrid rendering with server-side rendering where needed
- Use Astro.cookies for server-side cookie management
- Leverage import.meta.env for environment variables

## Server Endpoints and API Routes

- Leverage Server Endpoints for API routes
- Use POST, GET - uppercase format for endpoint handlers
- Use `export const prerender = false` for API routes
- Use zod for input validation in API routes
- Extract logic into services in `src/lib/services`
- Use supabase from context.locals in Astro routes instead of importing supabaseClient directly

## Middleware

- Implement middleware for request/response modification
- Middleware should be defined in `src/middleware/index.ts`
- Use middleware to inject Supabase client into context.locals

## Anti-patterns

### Astro Anti-patterns to Avoid

- Don't use client:load for all components - prefer client:visible, client:idle, or client:only
- Avoid importing heavy libraries in static Astro components
- Don't fetch data in components when you can use Astro's top-level await in pages
- Avoid using framework components (React) when Astro components are sufficient
- Don't forget to set `prerender = false` for dynamic API routes
