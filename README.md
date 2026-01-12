# TCGCollectr

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.0.1-green.svg)](package.json)
[![Node Version](https://img.shields.io/badge/node-22.14.0-brightgreen.svg)](.nvmrc)

A Progressive Web Application for Pokémon Trading Card Game collectors to manage and track their card collections.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)
- [Documentation](#documentation)

## Project Description

TCGCollectr is a comprehensive collection management application designed to help Pokémon TCG collectors catalog and track their physical card collections. The application provides a balanced approach to card information - displaying essential details by default while offering expanded information on demand.

### Key Features

- **Card Browsing**: Browse the complete Pokémon TCG catalog without requiring an account
- **Collection Management**: Track owned cards with quantity and variant support (normal, reverse, holo, firstEdition)
- **Set Completion Tracking**: Monitor progress toward completing specific card sets
- **Wishlist**: Flag cards for future acquisition and filter your wishlist
- **Search & Filter**: Multi-faceted search by card name, set name, and Pokémon type
- **Data Export**: Export your collection to CSV format
- **Offline Support**: View cached collection data when offline
- **Mobile-First Design**: Responsive PWA optimized for mobile devices

### Vision

Create the go-to solution for Pokémon TCG collectors who want a straightforward way to track their cards without the complexity of existing solutions.

## Tech Stack

### Frontend

- **[Astro 5](https://astro.build)** - Fast, modern SSR framework with minimal JavaScript
- **[React 19](https://react.dev)** - Interactive components where needed
- **[TypeScript 5](https://www.typescriptlang.org)** - Type-safe code with excellent IDE support
- **[Tailwind CSS 4](https://tailwindcss.com)** - Utility-first CSS framework
- **[Shadcn/ui](https://ui.shadcn.com)** - Accessible React component library

### Backend

- **[Supabase](https://supabase.com)** - Backend-as-a-Service providing:
  - PostgreSQL database
  - User authentication
  - Built-in analytics
  - Can be self-hosted

### Data Source

- **[TCGDex API](https://www.tcgdex.net)** - Free, open-source Pokémon TCG card database

## Developer References

- **TCGdex API (Context7):** [https://context7.com/websites/tcgdex_dev](https://context7.com/websites/tcgdex_dev)
  - Use this link for up-to-date TCGdex API documentation, asset URL rules, and integration details.

### CI/CD & Hosting

- **GitHub Actions** - Automated CI/CD pipelines
- **DigitalOcean** - Application hosting via Docker

## Getting Started Locally

### Prerequisites

- Node.js 22.14.0 (use [nvm](https://github.com/nvm-sh/nvm) for easy version management)
- npm or pnpm
- Supabase account (for backend services)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/tcg-collectr.git
   cd tcg-collectr
   ```

2. **Install Node.js version**

   ```bash
   nvm install
   nvm use
   ```

3. **Install dependencies**

   ```bash
   npm install
   ```

4. **Set up environment variables**

   Create a `.env` file in the root directory:

   ```env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_KEY=your_supabase_anon_key
   ```

5. **Initialize Supabase**

   ```bash
   npx supabase init
   npx supabase start
   ```

6. **Start the development server**

   ```bash
   npm run dev
   ```

7. **Open your browser**

   Navigate to `http://localhost:4321`

## Available Scripts

All commands are run from the root of the project:

| Command            | Description                                               |
| ------------------ | --------------------------------------------------------- |
| `npm run dev`      | Starts the local development server at `localhost:4321`   |
| `npm run build`    | Builds the production site to `./dist/`                   |
| `npm run preview`  | Previews the production build locally before deploying    |
| `npm run astro`    | Run Astro CLI commands (e.g., `astro add`, `astro check`) |
| `npm run lint`     | Runs ESLint to check for code quality issues              |
| `npm run lint:fix` | Automatically fixes ESLint issues where possible          |
| `npm run format`   | Formats code using Prettier                               |

### Code Quality

The project uses several tools to maintain code quality:

- **ESLint** - Linting with TypeScript, React, and Astro plugins
- **Prettier** - Code formatting
- **Husky** - Git hooks for pre-commit checks
- **lint-staged** - Runs linters on staged files

## Project Scope

### Included in MVP

- ✅ Pokémon TCG cards only
- ✅ Email/password authentication via Supabase
- ✅ Card browsing and search (publicly accessible)
- ✅ Personal collection management
- ✅ Quantity and variant tracking (normal, reverse, holo, firstEdition)
- ✅ Wishlist functionality with filtering
- ✅ Set completion percentage tracking
- ✅ CSV export
- ✅ Offline collection viewing (cached data)
- ✅ English language only (i18n-ready structure)
- ✅ Responsive PWA design (mobile-first)
- ✅ WCAG 2.1 Level AA accessibility compliance

### Performance Targets

- Initial page load: < 3 seconds
- Search response: < 1 second
- Lazy loading for images
- Skeleton loading states
- Rate limiting: 100 card additions/min, 60 searches/min per user

### Not Included (Post-MVP)

- ❌ Condition grading
- ❌ Price/trend analysis
- ❌ Camera/OCR card scanning
- ❌ Social features (sharing, trading)
- ❌ Marketplace integration
- ❌ Multi-language support (structure ready)
- ❌ Non-Pokémon TCG support
- ❌ Native mobile apps

### User Limits

- Maximum 10,000 cards per user
- Collection statistics displayed on dashboard
- No auto-deletion of inactive accounts

## Project Status

**Current Status**: 🚧 In Development

**Version**: 0.0.1 (MVP)

**Timeline**: 8-12 weeks

### Development Phases

1. **Phase 1**: Card browsing functionality ⏳
2. **Phase 2**: Authentication system
3. **Phase 3**: Collection management
4. **Phase 4**: Polish and beta testing

### Success Metrics

The MVP will be measured against:

- User engagement with registered users
- Collection management activity
- Search usage patterns
- Set completion rates

Growth strategy focuses on organic reach via Pokémon TCG communities.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Documentation

Additional documentation can be found in the [`docs/`](docs/) directory:

- [Product Requirements Document](docs/prd.md) - Full PRD with user stories
- [Tech Stack Details](docs/tech-stack.md) - Detailed technology decisions
- [API Documentation](docs/api/) - API endpoint implementation details

### Contributing

Contributions are welcome! Please ensure:

- Code follows ESLint and Prettier configurations
- All tests pass before submitting PR
- Commit messages are descriptive

### Support

For support and feedback, please open an issue on GitHub or contact via the in-app support link.

---

Made with ❤️ for Pokémon TCG collectors
