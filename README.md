# TCGCollectr

![Node.js](https://img.shields.io/badge/node-22.14.0-43853d?logo=node.js&logoColor=white)
![Astro](https://img.shields.io/badge/astro-5.x-fc7b03?logo=astro)
![Status](https://img.shields.io/badge/status-MVP_in_progress-orange)
![License](https://img.shields.io/badge/license-Apache--2.0-0a0a0a)

## Table of Contents

- [1. Project Name](#1-project-name)
- [2. Project Description](#2-project-description)
- [3. Tech Stack](#3-tech-stack)
- [4. Getting Started Locally](#4-getting-started-locally)
- [5. Available Scripts](#5-available-scripts)
- [6. Project Scope](#6-project-scope)
- [7. Project Status](#7-project-status)
- [8. License](#8-license)

## 1. Project Name

**TCGCollectr** — a focused collection manager for Pokémon trading cards designed for collectors who want clarity without the clutter of enterprise inventory tools.

## 2. Project Description

TCGCollectr helps collectors browse the full Pokémon catalog, capture the cards they own (with quantity, condition, and current market value), and understand their portfolio’s worth at a glance. The MVP emphasises:

- Search-first UX with auto-complete, filters, and detailed card sheets derived from pokemontcg.io (with JustTCG fallback).
- Supabase-backed authentication (email/password + magic link) and Row Level Security so users only see their own collections.
- Collection flows that highlight clarity: add/edit/delete with confirmations, toast feedback, skeleton loaders, and guided empty states.

For deeper business requirements and success metrics, see [docs/prd.md](docs/prd.md) and [docs/tech-stack.md](docs/tech-stack.md).

## 3. Tech Stack

| Layer     | Technology                                  | Purpose                                                               |
| --------- | ------------------------------------------- | --------------------------------------------------------------------- |
| Framework | Astro 5 (SSR) + React 19 islands            | Hybrid rendering with interactivity only where needed                 |
| Language  | TypeScript 5                                | Shared types across frontend, middleware, and Supabase Edge functions |
| Styling   | Tailwind CSS 4 + Shadcn/ui + Lucide icons   | Utility-first design, accessible components, consistent iconography   |
| Backend   | Supabase (PostgreSQL, Auth, Edge Functions) | Data persistence, RLS enforcement, pokemontcg.io proxy with 24h cache |
| Tooling   | ESLint 9, Prettier, Husky, lint-staged      | Enforced quality gates on every commit                                |
| Hosting   | Azure Static Web Apps + Supabase Cloud      | Global CDN for the Astro app, managed backend services                |

## 4. Getting Started Locally

### Prerequisites

- Node.js **22.14.0** (see `.nvmrc`)
- npm **10+**
- Supabase project (or local stack) to supply credentials

### Setup

1. **Clone and install**
   ```bash
   git clone https://github.com/<your-org>/TCGCollectr.git
   cd TCGCollectr
   npm install
   ```
2. **Configure environment variables** (create `.env` or export via shell)
   ```bash
   SUPABASE_URL=<your-supabase-project-url>
   SUPABASE_KEY=<your-anon-public-key>
   ```
3. **Run the dev server**
   ```bash
   npm run dev
   ```
4. **Build and preview production output** (optional)
   ```bash
   npm run build
   npm run preview
   ```

Additional architectural notes live in [docs/tech-stack.md](docs/tech-stack.md) and product direction in [docs/prd.md](docs/prd.md).

## 5. Available Scripts

| Command            | Description                               |
| ------------------ | ----------------------------------------- |
| `npm run dev`      | Start Astro dev server with React islands |
| `npm run build`    | Create an optimized production build      |
| `npm run preview`  | Preview the production output locally     |
| `npm run astro`    | Run arbitrary Astro CLI commands          |
| `npm run lint`     | Lint the entire workspace via ESLint      |
| `npm run lint:fix` | Apply ESLint auto-fixes                   |
| `npm run format`   | Format source files with Prettier         |

## 6. Project Scope

**In Scope (MVP)**

- Pokémon-only catalog search with filters, detail views, and fallback data source.
- Authenticated collection management (add/edit/delete, duplicate handling, confirmations, toasts, skeleton loaders).
- Collection insights: grouping by set, pagination, rarity & pricing display, total portfolio value, profile summaries.
- Mobile-first UI with light/dark themes, API availability banner, and graceful offline handling.
- Supabase Row Level Security, 24-hour cached API proxy, and Privacy/Terms pages.

**Out of Scope (for now)**

- Non-Pokémon franchises, social/sharing workflows, marketplace integrations, OCR scanning, import/export, mobile native apps, or advanced analytics beyond total value (see “Future Considerations” in [docs/prd.md](docs/prd.md)).

## 7. Project Status

- ✅ **Architecture settled:** Monorepo with Astro + Supabase, documented in [docs/tech-stack.md](docs/tech-stack.md).
- 🚧 **MVP implementation underway:** Focused on FR-005–FR-022 (search + collection lifecycle) and Supabase auth flows (FR-001–FR-006).
- 🎯 **Success metrics defined:** User adoption, weekly engagement, collection activity, and error rate targets (see Section 6 of the PRD).
- 📍 **Next priorities:** Complete caching layer (FR-011), API degraded-mode banner (FR-026), and baseline accessibility tests.

## 8. License

Distributed under the [Apache License 2.0](LICENSE). Use, modification, and distribution are permitted under the terms outlined therein.
