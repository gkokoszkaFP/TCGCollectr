---
applyTo: "**/*.tsx,**/*.jsx,src/components/hooks/**"
---

# React Guidelines

## React Coding Standards

- Use functional components with hooks instead of class components
- Never use "use client" and other Next.js directives as we use React with Astro
- Extract logic into custom hooks in `src/components/hooks`
- Implement React.memo() for expensive components that render often with the same props
- Utilize React.lazy() and Suspense for code-splitting and performance optimization
- Use the useCallback hook for event handlers passed to child components to prevent unnecessary re-renders
- Prefer useMemo for expensive calculations to avoid recomputation on every render
- Implement useId() for generating unique IDs for accessibility attributes
- Consider using the new useOptimistic hook for optimistic UI updates in forms
- Use useTransition for non-urgent state updates to keep the UI responsive

## Key Principles

- Use functional, declarative programming - avoid classes
- Use descriptive variable names with auxiliary verbs (e.g., isLoading, hasError)
- Favor named exports for components
- Use TypeScript for all code - prefer interfaces over types
- File structure: imports, types, main component, subcomponents, helpers, static content
- Use Zod for form validation
- Use Shadcn UI, Radix, and Tailwind CSS for components and styling

## Anti-patterns

### React Anti-patterns to Avoid

- Never use "use client" directive (Next.js specific - not needed with Astro)
- Avoid prop drilling - use context or state management instead
- Don't mutate state directly - always use setState or state updater functions
- Avoid inline function definitions in JSX for frequently rendered components
- Don't forget dependency arrays in useEffect, useMemo, and useCallback
- Avoid using index as key in lists unless items are static and have no IDs
- Don't create new object/array references in render without memoization
- Avoid excessive re-renders by not creating new objects/functions in render
