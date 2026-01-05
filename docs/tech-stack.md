# TCGCollectr Tech Stack

## Overview

A monorepo architecture using TypeScript across the entire stack for rapid MVP delivery and simplified maintenance.

---

## Frontend

| Technology       | Version | Purpose                                                                   |
| ---------------- | ------- | ------------------------------------------------------------------------- |
| **Astro**        | 5.x     | Static site generation with islands architecture for optimal performance  |
| **React**        | 19.x    | Interactive UI components (collection management, modals, forms)          |
| **TypeScript**   | 5.x     | Type safety across frontend and backend                                   |
| **Tailwind CSS** | 4.x     | Utility-first styling with mobile-first responsive design                 |
| **Shadcn/ui**    | latest  | Pre-built accessible components (modals, toasts, forms, skeleton loaders) |

---

## Backend & Database

| Technology                      | Purpose                                                                |
| ------------------------------- | ---------------------------------------------------------------------- |
| **Supabase PostgreSQL**         | Primary database for user collections and cached API data              |
| **Supabase Auth**               | Authentication (email/password + magic link)                           |
| **Supabase Edge Functions**     | Serverless API proxy for pokemontcg.io with 24-hour caching            |
| **Supabase Row Level Security** | Database-level authorization ensuring users access only their own data |

---

## CI/CD & Hosting

| Technology                | Purpose                                                         |
| ------------------------- | --------------------------------------------------------------- |
| **GitHub Actions**        | Automated build, test, and deployment pipeline                  |
| **Azure Static Web Apps** | Frontend hosting with global CDN                                |
| **Supabase Cloud**        | Managed backend infrastructure (database, auth, edge functions) |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Azure Static Web Apps                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Astro + React Frontend                  │    │
│  │         (TypeScript, Tailwind, Shadcn/ui)           │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase Cloud                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │     Auth     │  │    Edge      │  │    PostgreSQL    │   │
│  │              │  │  Functions   │  │    Database      │   │
│  │ - Email/Pass │  │              │  │                  │   │
│  │ - Magic Link │  │ - API Proxy  │  │ - Collections    │   │
│  │ - JWT Tokens │  │ - Caching    │  │ - API Cache      │   │
│  └──────────────┘  └──────────────┘  │ - RLS Policies   │   │
│                           │          └──────────────────┘   │
└───────────────────────────┼─────────────────────────────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │  pokemontcg.io   │
                  │   External API   │
                  └──────────────────┘
```

---

## Key Design Decisions

### Why This Stack?

1. **Single Language (TypeScript)** — Shared types between frontend and Edge Functions, faster development
2. **Monorepo** — One codebase, one CI/CD pipeline, atomic deployments
3. **Supabase Auth** — Turnkey authentication matching PRD requirements (FR-001 to FR-004)
4. **Row Level Security** — Authorization enforced at database level, not application code
5. **Edge Functions** — Serverless with no cold starts, ideal for API proxy with caching
6. **Astro Islands** — Static pages for SEO, React only where interactivity is needed

### Caching Strategy

- Edge Functions cache pokemontcg.io responses in a PostgreSQL table
- 24-hour TTL as specified in PRD (FR-011)
- Persistent cache survives function restarts

### Future Migration Path

If business logic complexity grows, the architecture supports adding:

- Azure Functions or Container Apps connecting to Supabase PostgreSQL
- External Redis cache for high-traffic scenarios
- Additional microservices as needed

---

## Repository Structure

```
TCGCollectr/
├── src/                      # Astro frontend
│   ├── components/
│   ├── layouts/
│   ├── pages/
│   └── lib/
│       ├── supabase.ts       # Supabase client
│       └── types.ts          # Shared TypeScript types
├── supabase/
│   ├── functions/            # Edge Functions
│   ├── migrations/           # Database schema
│   └── config.toml
├── .github/workflows/        # CI/CD
├── package.json
└── tsconfig.json
```

---

## Cost Estimate (MVP)

| Service               | Tier | Monthly Cost |
| --------------------- | ---- | ------------ |
| Supabase              | Free | $0           |
| Azure Static Web Apps | Free | $0           |
| **Total**             |      | **$0**       |

_Free tiers sufficient for MVP. Supabase Pro ($25/mo) recommended when approaching 500MB database or 50K MAU._
