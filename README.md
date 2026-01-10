# TCGCollectr

![Node Version](https://img.shields.io/badge/Node-22.14.0-5FA04E?logo=node.js&logoColor=white)
![Astro](https://img.shields.io/badge/Astro-5.16-FF5D01?logo=astro&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![License](https://img.shields.io/badge/License-Apache--2.0-blue)

> Pokémon TCG collection management platform that blends Astro islands, React interactivity, and Supabase services for fast, data-driven experiences.

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
TCGCollectr — Trading Card Game collection manager focused on Pokémon TCG collectors.

## 2. Project Description
TCGCollectr delivers a searchable, filterable catalog of 15,000+ Pokémon cards with daily pricing from tcgcsv.com and enriched attributes from pokemontcg.io. Authenticated users organize personal collections, track quantities, condition, grading, and purchase price, while Supabase Auth and Row Level Security keep data isolated per user. The application targets an MVP release that prioritizes speed (Astro islands + React 19), accessibility (Tailwind 4 + Shadcn/ui), and operational simplicity (Supabase PostgreSQL, Edge Functions, and pg_cron imports). See [docs/prd.md](docs/prd.md) for the complete product requirements and [docs/tech-stack.md](docs/tech-stack.md) for architectural context.

## 3. Tech Stack
| Layer | Technology |
| --- | --- |
| Framework | Astro 5 (SSR + islands) with React 19 components |
| Language | TypeScript 5 across frontend and backend |
| Styling | Tailwind CSS 4, Shadcn/ui (New York theme), tw-animate CSS |
| Backend & Auth | Supabase PostgreSQL, Supabase Auth, Edge Functions, Row Level Security |
| Tooling | ESLint 9, Prettier (with Astro plugin), Husky + lint-staged, Supabase CLI |
| Data Sources | tcgcsv.com (daily CSV import) and pokemontcg.io (24h cached API) |
| Hosting & CI | Azure Static Web Apps, Supabase Cloud, GitHub Actions (planned) |

## 4. Getting Started Locally
1. **Prerequisites**
	- Node.js 22.14.0 (`.nvmrc` provided; use `nvm use` or install manually).
	- npm (bundled with Node) or another compatible package manager.
	- Supabase project with `SUPABASE_URL` and `SUPABASE_KEY` env values.
2. **Install dependencies**
	```bash
	npm install
	```
3. **Configure environment**
	- Copy `.env.example` (create if missing) to `.env` and supply Supabase credentials plus any Astro/Supabase settings documented in [docs/tech-stack.md](docs/tech-stack.md).
4. **Run the dev server**
	```bash
	npm run dev
	```
	- Astro serves the site with hot reload at `http://localhost:4321` (default).
5. **Lint and format (optional but recommended)**
	```bash
	npm run lint
	npm run format
	```
6. **Build for production**
	```bash
	npm run build
	```
	- Preview the static output via `npm run preview`.

## 5. Available Scripts
- `npm run dev` — Start the Astro dev server with SSR, Tailwind, and React integration.
- `npm run build` — Generate the optimized production build (SSR + static assets).
- `npm run preview` — Serve the build output locally to verify production behavior.
- `npm run astro` — Direct access to the Astro CLI for advanced commands.
- `npm run lint` — Run ESLint (Astro + React + TypeScript rules).
- `npm run lint:fix` — Auto-fix lint issues where possible.
- `npm run format` — Run Prettier (with Astro plugin) across the repo.

## 6. Project Scope
- **In Scope (MVP)**: Pokémon-only catalog browsing, advanced search/filtering, user authentication, collection CRUD with condition/grade tracking, custom lists (≤10 per user), market price display with freshness indicator, daily tcgcsv.com imports via pg_cron, pokemontcg.io enrichment, admin import dashboard. (See FR-001 to FR-008 in [docs/prd.md](docs/prd.md).)
- **Out of Scope (Post-MVP)**: Collection export, PWA/offline support, social auth, currency selector, multi-language UX, trend analytics, marketplace features (see “Out of Scope” in [docs/prd.md](docs/prd.md)).
- **Explicitly Excluded**: OCR scanning, paid APIs, non-Pokémon TCG titles, price trend charts, reseller integrations.

## 7. Project Status
- **Version**: 0.0.1 (pre-release, under active development).
- **Milestones**: MVP feature set defined in [docs/prd.md](docs/prd.md); architecture, data flow, and hosting plans documented in [docs/tech-stack.md](docs/tech-stack.md).
- **Next Steps**: Implement Supabase-backed data import pipeline, build authenticated collection flows, set up CI/CD (GitHub Actions + Azure Static Web Apps), and add automated testing per future [testing guidelines](.github/instructions/testing.instructions.md) once core views stabilize.

## 8. License
Distributed under the Apache License 2.0. See [LICENSE](LICENSE) for full terms.

