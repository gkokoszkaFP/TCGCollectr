# AI Rules for TCGCollectr

Trading Card Game collection management application.

## Tech Stack

- Astro 5
- TypeScript 5
- React 19
- Tailwind 4
- Shadcn/ui
- Supabase

## Project Structure

When introducing changes to the project, always follow the directory structure below:

- `./src` - source code
- `./src/layouts` - Astro layouts
- `./src/pages` - Astro pages
- `./src/pages/api` - API endpoints
- `./src/middleware/index.ts` - Astro middleware
- `./src/db` - Supabase clients and types
- `./src/types.ts` - Shared types for backend and frontend (Entities, DTOs)
- `./src/components` - Client-side components written in Astro (static) and React (dynamic)
- `./src/components/ui` - Client-side components from Shadcn/ui
- `./src/lib` - Services and helpers
- `./src/assets` - static internal assets
- `./public` - public assets

When modifying the directory structure, always update this section.

## Key Principles

- Write concise, technical code with accurate examples
- Use functional, declarative programming patterns
- Prefer descriptive variable names with auxiliary verbs (isLoading, hasError)
- Use TypeScript for all code - prefer interfaces over types
- File structure: imports, types, main component, subcomponents, helpers, static content
- Prioritize error handling and edge cases at the beginning of functions
- Use early returns for error conditions to avoid deeply nested if statements
- Place the happy path last in the function for improved readability

## Coding Practices

### Guidelines for Clean Code

- Use feedback from linters to improve the code when making changes
- Handle errors and edge cases at the beginning of functions
- Use early returns for error conditions to avoid deeply nested if statements
- Place the happy path last in the function for improved readability
- Avoid unnecessary else statements; use if-return pattern instead
- Use guard clauses to handle preconditions and invalid states early
- Implement proper error logging and user-friendly error messages
- Consider using custom error types or error factories for consistent error handling

## Code Quality Tools

### ESLint

- Configure project-specific rules in eslint.config.js to enforce consistent coding standards
- Use shareable configs like eslint-config-airbnb or eslint-config-standard as a foundation
- Implement custom rules for project-specific patterns to maintain codebase consistency
- Configure integration with Prettier to avoid rule conflicts for code formatting
- Use the --fix flag in CI/CD pipelines to automatically correct fixable issues
- Implement staged linting with husky and lint-staged to prevent committing non-compliant code

### Prettier

- Define a consistent .prettierrc configuration across all project repositories
- Configure editor integration to format on save for immediate feedback
- Use .prettierignore to exclude generated files, build artifacts, and specific patterns
- Set printWidth based on team preferences (80-120 characters) to improve code readability
- Configure consistent quote style and semicolon usage to match team conventions
- Implement CI checks to ensure all committed code adheres to the defined style

## Shadcn/ui Components

### Using Installed Components

Components are in `src/components/ui` and imported using `@/` alias:

```tsx
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
```

### Installing New Components

Use Shadcn CLI to add components from https://ui.shadcn.com/

```bash
npx shadcn@latest add [component-name]
```

**Important:** Use `npx shadcn@latest` (NOT `npx shadcn-ui@latest` - deprecated)

**Styling:** This project uses "new-york" style variant with "neutral" base color and CSS variables for theming (configured in `components.json`)
