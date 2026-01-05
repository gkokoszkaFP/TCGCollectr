You are an experienced product manager whose task is to create a comprehensive Product Requirements Document (PRD) based on the following descriptions:

<project_description>

# Application - TCGCollectr (MVP)

## Main problem

Storing and checking your TCG cards for personal use is cumbersome – having sufficiently comprehensive but not overwhelming information about your cards. The application will allow the user to add their cards and provide information about the cards.

## Minimum viable features

- Adding, deleting, reading, and browsing their own cards.
- A simple user account system to store cards.
- A user profile page where the user can easily access their card collections.
- Support only for Pokémon cards – with the possibility to expand to other TCGs in the future.
- Basic information such as:
  - price
  - price history charts
  - card information
  - Rarity/value scoring
- Use of free APIs or CSV files to fetch card information (metadata, price).
- Price anomaly detection (historical data).
- Browsing any Pokémon cards without needing to add them to their collection.

## What is NOT in the scope of MVP

- Using paid APIs
- Support for non-Pokémon cards
- Advanced card price and trend analysis
- Scanning cards with the camera (OCR) as an alternative to adding cards
- Redirecting to websites selling cards (e.g., eBay, Amazon, etc.)

## Success criteria

- 90% of users have their cards added to their profile.
- 50% of users log in once a week and add new cards.
  </project_description>

<project_details>
<conversation_summary>
<decisions>

1.  **Card Management:** Users will add cards via a manual search with auto-completion and filters (set, name, number). Users can add, edit, and delete cards from their collection, specifying quantity and condition (condition can be left blank).
2.  **Data Display:** The application will display basic card information (Name, Image, Set, Number, Rarity) and the current market price.
3.  **Features Removed from MVP:** Price history charts, price anomaly detection, and rarity/value scoring have been removed from the MVP scope to reduce complexity.
4.  **Data Sources & Caching:** `pokemontcg.io` is the primary source for card data and TCGplayer prices. `JustTCG` will be used as a fallback only if the primary API is down. All API data will be cached for 24 hours. The plan to import data from `TCGCSV` has been abandoned for the MVP.
5.  **User Accounts:** Authentication will be handled by Supabase, limited to email/password and magic link logins.
6.  **Collection & Profile:** The user's collection will be displayed in a paginated view, grouped by set, and sorted by set name then card number. The total estimated value of the collection will be calculated and displayed. The profile page will show a summary of card counts per set.
7.  **Technology Stack:** The backend will be .NET on Azure Functions with EF Core and Supabase. The frontend will be Astro with React and Tailwind CSS, hosted on Azure Static Web Apps.
8.  **UI/UX:** The design will be mobile-first and responsive. It will include skeleton loaders, toast notifications for user actions, and defined empty states. A dark mode theme will be included.
9.  **CI/CD:** A GitHub Actions workflow will be set up to build and test on pull requests, with manual triggers for deployment to Azure.
10. **Error Handling:** A non-intrusive banner will inform users if external card data APIs are unavailable. The backend will use a service layer to isolate API clients.
11. **Legal:** A basic Privacy Policy and Terms of Service will be created.
12. **User Feedback:** No formal user feedback mechanism will be implemented for the MVP.
    </decisions>

<matched_recommendations>

1.  Implement a robust search functionality with auto-completion and filters to make manual card entry efficient.
2.  Start with a core set of information: Card Name, Image, Set Name, Card Number, Rarity, and current Market Price.
3.  Designate `pokemontcg.io`'s TCGplayer price data as the primary source for current prices and implement server-side caching.
4.  Use EF Core's "code-first" migrations to define and version the database schema with Supabase.
5.  Implement pagination for the main collection view to ensure good performance for users with large collections.
6.  For local development, use `local.settings.json` for Azure Functions and a `.env` file for the frontend, storing secrets in Azure Configuration for production.
7.  Use temporary, non-blocking toast notifications to confirm actions without interrupting the user's workflow.
8.  Use skeleton loaders that mimic the shape of the content being loaded to improve the user experience.
9.  Create an "API client" service layer in the backend to isolate external API calls and make the system more resilient to changes.
10. In the collection view, each card entry should have a "Delete" icon that triggers a confirmation modal to prevent accidental deletions.
    </matched_recommendations>

<prd_planning_summary>
This document summarizes the planning for the TCGCollectr MVP. The application aims to solve the problem of cumbersome personal TCG card collection management by providing a streamlined web application.

**a. Main Functional Requirements:**

- **User Authentication:** Users can register and log in via email/password or a magic link using Supabase.
- **Card Browsing:** All users can browse and search for any Pokémon card using a global search bar with filters.
- **Collection Management:** Authenticated users can add cards to their personal collection, specifying quantity and condition. They can edit these details or delete cards from their collection.
- **Data Display:** The application will show key card details including its image, name, set, and current market price from `pokemontcg.io`.
- **Profile & Collection View:** Users have a profile page summarizing their collection (e.g., cards per set) and displaying the total collection value. The collection itself is a paginated list, sortable and grouped by set.

**b. Key User Stories and Usage Paths:**

- **New User Onboarding:** A new user registers for an account. Upon first login, they see a welcome message on their empty dashboard guiding them to search for a card to start their collection.
- **Adding a Card:** A user searches for "Charizard". The results show several versions with images and set names. They find the correct one, click "Add to Collection," specify the quantity is "1" and condition is "Near Mint" in a modal, and save it. They receive a toast notification confirming the card was added.
- **Managing the Collection:** A user navigates to their collection page. They see their cards grouped by set. They find a card they recently sold, click the "Delete" icon, and confirm the deletion in a modal. They then find another card and click "Edit" to update its quantity from 1 to 2.
- **Viewing Collection Value:** A user visits their profile page to see the total estimated market value of their entire collection displayed prominently.

**c. Important Success Criteria:**

- **Adoption:** 90% of users who log in more than once add at least one card to their collection within their first week.
- **Engagement:** 50% of active users log in at least once a week. Active engagement is defined as adding cards, viewing their collection, or browsing cards.

**d. Technical & Design Decisions:**

- The project will use a .NET/Azure Functions backend and an Astro/React frontend, with Supabase as the database.
- A mobile-first, responsive design will be implemented, including both light and dark themes.
- CI/CD will be managed via GitHub Actions with manual deployment triggers.
  </prd_planning_summary>

<unresolved_issues>

- No unresolved issues were identified during the planning conversation. All initial ambiguities have been clarified and key decisions for the MVP have been made.
  </unresolved_issues>
  </conversation_summary>
  </project_details>

Follow these steps to create a comprehensive and well-organized document:

1. Divide the PRD into the following sections:
   a. Project Overview
   b. User Problem
   c. Functional Requirements
   d. Project Boundaries
   e. User Stories
   f. Success Metrics

2. In each section, provide detailed and relevant information based on the project description and answers to clarifying questions. Make sure to:
   - Use clear and concise language
   - Provide specific details and data as needed
   - Maintain consistency throughout the document
   - Address all points listed in each section

3. When creating user stories and acceptance criteria
   - List ALL necessary user stories, including basic, alternative, and edge case scenarios.
   - Assign a unique requirement identifier (e.g., US-001) to each user story for direct traceability.
   - Include at least one user story specifically for secure access or authentication, if the application requires user identification or access restrictions.
   - Ensure that no potential user interaction is omitted.
   - Ensure that each user story is testable.

Use the following structure for each user story:

- ID
- Title
- Description
- Acceptance Criteria

4. After completing the PRD, review it against this checklist:
   - Is each user story testable?
   - Are the acceptance criteria clear and specific?
   - Do we have enough user stories to build a fully functional application?
   - Have we included authentication and authorization requirements (if applicable)?

5. PRD Formatting:
   - Maintain consistent formatting and numbering.
   - Do not use bold formatting in markdown ( \*\* ).
   - List ALL user stories.
   - Format the PRD in proper markdown.

Prepare the PRD with the following structure:

```markdown
# Product Requirements Document (PRD) - {{app-name}}

## 1. Product Overview

## 2. User Problem

## 3. Functional Requirements

## 4. Product Boundaries

## 5. User Stories

## 6. Success Metrics
```

Remember to fill each section with detailed, relevant information based on the project description and our clarifying questions. Ensure the PRD is comprehensive, clear, and contains all relevant information needed for further product development.

The final output should consist solely of the PRD in the specified markdown format, which you will save in the file .docs/prd.md
