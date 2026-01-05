---
applyTo: "**/*.astro,src/middleware/**,src/layouts/**"
---

# Astro Guidelines

## ASTRO_CODING_STANDARDS

- Use Astro components (.astro) for static content and layout
- Implement framework components in {{framework_name}} only when interactivity is needed
- Leverage View Transitions API for smooth page transitions
- Use content collections with type safety for blog posts, documentation, etc.
- Implement middleware for request/response modification
- Use image optimization with the Astro Image integration
- Leverage Server Endpoints for API routes
- Implement hybrid rendering with server-side rendering where needed
- Use Astro.cookies for server-side cookie management
- Leverage import.meta.env for environment variables

## ASTRO_ISLANDS

- Use client:visible directive for components that should hydrate when visible in viewport
- Implement shared state with nanostores instead of prop drilling between islands
- Use content collections for type-safe content management of structured content
- Leverage client:media directive for components that should only hydrate at specific breakpoints
- Implement partial hydration strategies to minimize JavaScript sent to the client
- Use client:only for components that should never render on the server
- Leverage client:idle for non-critical UI elements that can wait until the browser is idle
- Implement client:load for components that should hydrate immediately
- Use Astro's transition:\* directives for view transitions between pages
- Leverage props for passing data from Astro to framework components

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
