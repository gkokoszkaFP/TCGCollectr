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
