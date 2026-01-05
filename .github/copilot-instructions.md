# GitHub Copilot Instructions for TCGCollectr

This file provides a high-level overview of the project. For detailed, context-specific instructions, GitHub Copilot automatically loads additional instruction files from `.github/instructions/` based on the files you're working with.

## Project Overview

TCGCollectr is a Trading Card Game collection management application built with modern web technologies.

## Tech Stack

- Astro 5 (SSR framework)
- TypeScript 5
- React 19 (for interactive components)
- Tailwind 4 (styling)
- Shadcn/ui (component library)
- Supabase (backend & database)

## Instruction Files Structure

The project uses a multi-file instruction system for better organization and context-specific guidance:

- **[shared.instructions.md](instructions/shared.instructions.md)** - Core project structure, tech stack, key principles
- **[frontend.instructions.md](instructions/frontend.instructions.md)** - Styling (Tailwind), Accessibility (ARIA)
- **[astro.instructions.md](instructions/astro.instructions.md)** - Astro-specific patterns, API routes, middleware
- **[react.instructions.md](instructions/react.instructions.md)** - React hooks, patterns, component structure
- **[backend.instructions.md](instructions/backend.instructions.md)** - Supabase integration, database migrations, API security

## Quick Reference

### Key Principles

- Write concise, technical code with accurate examples
- Use functional, declarative programming patterns
- Handle errors early with guard clauses and early returns
- Use TypeScript interfaces over types
- Prioritize accessibility (ARIA attributes, semantic HTML)

### Common Patterns

```typescript
// API Route with validation
export const prerender = false;
import { z } from "zod";

// Use Supabase from context.locals
const { data } = await context.locals.supabase.from("table").select("*");
```

### Project Structure

```
src/
├── components/     # Astro (static) & React (interactive)
├── layouts/        # Page layouts
├── pages/          # Routes
│   └── api/        # API endpoints
├── lib/            # Services & helpers
├── db/             # Supabase client & types
└── middleware/     # Request/response handling
```

## Documentation Access

For up-to-date Supabase documentation, use MCP:

```
@mcp get-library-docs /supabase/supabase [topic]
```

## Notes

- GitHub Copilot automatically loads relevant instruction files based on file patterns
- Keep instruction files under 500 lines for optimal performance
- See individual instruction files for detailed, context-specific guidance
