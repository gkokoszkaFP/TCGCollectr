# Product Requirements Document (PRD) - TCGCollectr

## 1. Product Overview

TCGCollectr is a web application designed for Trading Card Game (TCG) collectors to manage and track their personal card collections. The Minimum Viable Product (MVP) focuses exclusively on Pokémon cards, with architecture that supports future expansion to other TCGs.

The application provides a streamlined experience for users to:
- Search and browse the complete Pokémon card catalog
- Build and manage a personal collection with quantity and condition tracking
- View current market prices for their cards
- See the total estimated value of their collection

The technical stack consists of:
- Backend: .NET on Azure Functions with EF Core and Supabase
- Frontend: Astro with React and Tailwind CSS, hosted on Azure Static Web Apps
- Authentication: Supabase (email/password and magic link)
- Data Source: pokemontcg.io API with JustTCG as fallback
- Caching: 24-hour server-side cache for API data

The design philosophy prioritizes a mobile-first, responsive interface with support for both light and dark themes.

## 2. User Problem

Storing and checking TCG cards for personal use is cumbersome. Collectors face several challenges:

- Difficulty tracking which cards they own across multiple sets and expansions
- No centralized location to view their entire collection at a glance
- Lack of easy access to current market prices for owned cards
- No simple way to understand the total value of their collection
- Overwhelming complexity in existing solutions that offer too many features for casual collectors

TCGCollectr solves these problems by providing a focused, easy-to-use application that delivers sufficiently comprehensive but not overwhelming information about cards. Users can quickly add cards to their collection, view essential details, and understand the value of what they own without being burdened by unnecessary complexity.

## 3. Functional Requirements

### 3.1 User Authentication
- FR-001: The system shall allow users to register using email and password
- FR-002: The system shall allow users to register and log in using magic link authentication
- FR-003: The system shall maintain user sessions securely via Supabase
- FR-004: The system shall require authentication for all collection management operations

### 3.2 Card Browsing and Search
- FR-005: The system shall provide a global search bar accessible to all users (authenticated and unauthenticated)
- FR-006: The system shall support search with auto-completion for card names
- FR-007: The system shall provide filters for search results (set, name, card number)
- FR-008: The system shall display search results with card image, name, set name, and card number
- FR-009: The system shall fetch card data from pokemontcg.io as the primary source
- FR-010: The system shall use JustTCG as a fallback data source when the primary API is unavailable
- FR-011: The system shall cache all API data for 24 hours

### 3.3 Collection Management
- FR-012: The system shall allow authenticated users to add cards to their collection
- FR-013: The system shall allow users to specify quantity when adding a card
- FR-014: The system shall allow users to specify condition when adding a card (optional field)
- FR-015: The system shall allow users to edit quantity and condition of cards in their collection
- FR-016: The system shall allow users to delete cards from their collection with confirmation
- FR-017: The system shall display a confirmation modal before deleting any card

### 3.4 Collection Display
- FR-018: The system shall display the user's collection in a paginated view
- FR-019: The system shall group cards by set in the collection view
- FR-020: The system shall sort cards by set name, then by card number within each set
- FR-021: The system shall display card image, name, set, number, rarity, and current market price for each card
- FR-022: The system shall calculate and display the total estimated value of the collection

### 3.5 User Profile
- FR-023: The system shall provide a profile page for authenticated users
- FR-024: The system shall display a summary of card counts per set on the profile page
- FR-025: The system shall display the total collection value prominently on the profile page

### 3.6 User Interface
- FR-026: The system shall implement a mobile-first, responsive design
- FR-027: The system shall support both light and dark themes
- FR-028: The system shall display skeleton loaders during content loading
- FR-029: The system shall display toast notifications for user actions (add, edit, delete)
- FR-030: The system shall display appropriate empty states with guidance for new users
- FR-031: The system shall display a non-intrusive banner when external APIs are unavailable

### 3.7 Error Handling
- FR-032: The system shall gracefully handle API failures without crashing
- FR-033: The system shall inform users when card data cannot be retrieved
- FR-034: The backend shall use a service layer to isolate API clients for resilience

### 3.8 Legal
- FR-035: The system shall provide a Privacy Policy page
- FR-036: The system shall provide a Terms of Service page

## 4. Product Boundaries

### 4.1 In Scope (MVP)
- Pokémon card support only
- Manual card search and entry with auto-completion
- Basic card information display (name, image, set, number, rarity, price)
- Personal collection management (add, edit, delete)
- User authentication via email/password and magic link
- Collection value calculation
- Paginated collection view grouped by set
- Profile page with collection summary
- Mobile-first responsive design with dark mode
- 24-hour data caching
- Basic Privacy Policy and Terms of Service

### 4.2 Out of Scope (MVP)
- Support for non-Pokémon TCGs (Yu-Gi-Oh!, Magic: The Gathering, etc.)
- Paid API integrations
- Price history charts and historical data visualization
- Price anomaly detection
- Rarity/value scoring algorithms
- Advanced card price and trend analysis
- Camera-based card scanning (OCR)
- Integration with marketplace websites (eBay, Amazon, TCGplayer direct links)
- Social features (sharing collections, trading, messaging)
- Wishlist functionality
- Import/export of collection data
- Mobile native applications
- Formal user feedback mechanism
- TCGCSV data import

### 4.3 Future Considerations
- Expansion to additional TCGs
- Price history tracking and charts
- Price anomaly alerts
- OCR card scanning
- Collection sharing and social features
- Mobile applications

## 5. User Stories

### Authentication

US-001
Title: User Registration with Email and Password
Description: As a new user, I want to register for an account using my email and password so that I can start building my card collection.
Acceptance Criteria:
- Given I am on the registration page, when I enter a valid email and password and submit the form, then my account is created and I am logged in
- Given I am on the registration page, when I enter an email that is already registered, then I see an error message indicating the email is already in use
- Given I am on the registration page, when I enter an invalid email format, then I see a validation error message
- Given I am on the registration page, when I enter a password that does not meet minimum requirements, then I see a validation error message

US-002
Title: User Registration with Magic Link
Description: As a new user, I want to register using a magic link sent to my email so that I can create an account without remembering a password.
Acceptance Criteria:
- Given I am on the registration page, when I enter a valid email and request a magic link, then I receive an email with a login link
- Given I received a magic link email, when I click the link, then I am logged in and my account is created if it did not exist
- Given I received a magic link email, when I click an expired link, then I see an error message and am prompted to request a new link

US-003
Title: User Login with Email and Password
Description: As a registered user, I want to log in with my email and password so that I can access my collection.
Acceptance Criteria:
- Given I am on the login page, when I enter valid credentials, then I am logged in and redirected to my collection page
- Given I am on the login page, when I enter incorrect credentials, then I see an error message indicating invalid email or password
- Given I am logged in, when I navigate to the application, then I remain logged in until I log out or the session expires

US-004
Title: User Login with Magic Link
Description: As a registered user, I want to log in using a magic link so that I can access my account without entering a password.
Acceptance Criteria:
- Given I am on the login page, when I request a magic link for my registered email, then I receive an email with a login link
- Given I received a magic link, when I click the link within its validity period, then I am logged in and redirected to my collection
- Given I received a magic link, when I click an expired link, then I see an appropriate error message

US-005
Title: User Logout
Description: As a logged-in user, I want to log out of my account so that I can secure my session.
Acceptance Criteria:
- Given I am logged in, when I click the logout button, then I am logged out and redirected to the home page
- Given I have logged out, when I try to access my collection, then I am redirected to the login page

US-006
Title: Password Reset
Description: As a user who forgot my password, I want to reset my password so that I can regain access to my account.
Acceptance Criteria:
- Given I am on the login page, when I click "Forgot Password" and enter my email, then I receive a password reset email
- Given I received a password reset email, when I click the link and enter a new valid password, then my password is updated
- Given I have reset my password, when I log in with my new password, then I am successfully authenticated

### Card Browsing and Search

US-007
Title: Search for Cards by Name
Description: As a user, I want to search for Pokémon cards by name so that I can find specific cards I am looking for.
Acceptance Criteria:
- Given I am on any page with the search bar, when I type a card name, then I see auto-complete suggestions matching my input
- Given I am searching, when I select a suggestion or press enter, then I see search results displaying matching cards
- Given search results are displayed, when I view the results, then each card shows its image, name, set name, and card number

US-008
Title: Filter Search Results
Description: As a user, I want to filter search results by set, name, or card number so that I can narrow down results to find the exact card I need.
Acceptance Criteria:
- Given I have search results displayed, when I apply a set filter, then only cards from the selected set are shown
- Given I have search results displayed, when I apply a card number filter, then only cards matching that number are shown
- Given I have multiple filters applied, when I clear a filter, then the results update to reflect the remaining filters
- Given I have filters applied, when I clear all filters, then all original search results are displayed

US-009
Title: View Card Details
Description: As a user, I want to view detailed information about a card so that I can see its complete information.
Acceptance Criteria:
- Given I am viewing search results or my collection, when I click on a card, then I see the card detail view
- Given I am viewing card details, when I look at the information displayed, then I see the card image, name, set, card number, rarity, and current market price

US-010
Title: Browse Cards Without Authentication
Description: As an unauthenticated user, I want to browse and search for Pokémon cards so that I can explore the catalog before creating an account.
Acceptance Criteria:
- Given I am not logged in, when I use the search functionality, then I can search and view card information
- Given I am not logged in, when I try to add a card to a collection, then I am prompted to log in or register

### Collection Management

US-011
Title: Add Card to Collection
Description: As an authenticated user, I want to add a card to my collection so that I can track the cards I own.
Acceptance Criteria:
- Given I am logged in and viewing a card, when I click "Add to Collection," then a modal appears asking for quantity and condition
- Given the add modal is open, when I enter a quantity (required) and optionally a condition and click save, then the card is added to my collection
- Given I have added a card, when the save completes, then I see a toast notification confirming the card was added
- Given I try to add a card, when the operation fails, then I see an error toast notification

US-012
Title: Add Card with Quantity
Description: As an authenticated user, I want to specify how many copies of a card I own so that my collection accurately reflects my inventory.
Acceptance Criteria:
- Given I am adding a card, when I enter a quantity greater than zero, then that quantity is saved with the card
- Given I am adding a card, when I enter a quantity of zero or a negative number, then I see a validation error
- Given I am adding a card, when I leave quantity blank, then I see a validation error requiring a quantity

US-013
Title: Add Card with Condition
Description: As an authenticated user, I want to specify the condition of my card so that I can track the quality of my collection.
Acceptance Criteria:
- Given I am adding a card, when I select a condition from the available options, then that condition is saved with the card
- Given I am adding a card, when I leave condition blank, then the card is saved without a condition specified
- Given I view my collection, when a card has a condition specified, then the condition is displayed with the card

US-014
Title: Edit Card in Collection
Description: As an authenticated user, I want to edit the quantity or condition of a card in my collection so that I can keep my collection accurate.
Acceptance Criteria:
- Given I am viewing my collection, when I click the edit button on a card, then an edit modal appears with current values pre-filled
- Given the edit modal is open, when I change the quantity and save, then the new quantity is stored
- Given the edit modal is open, when I change the condition and save, then the new condition is stored
- Given I have edited a card, when the save completes, then I see a toast notification confirming the update

US-015
Title: Delete Card from Collection
Description: As an authenticated user, I want to delete a card from my collection so that I can remove cards I no longer own.
Acceptance Criteria:
- Given I am viewing my collection, when I click the delete icon on a card, then a confirmation modal appears
- Given the confirmation modal is open, when I confirm the deletion, then the card is removed from my collection
- Given the confirmation modal is open, when I cancel the deletion, then the card remains in my collection
- Given I have deleted a card, when the deletion completes, then I see a toast notification confirming the removal

US-016
Title: Add Duplicate Card to Collection
Description: As an authenticated user, I want to add a card that already exists in my collection so that I can track multiple copies separately or update my quantity.
Acceptance Criteria:
- Given I have a card in my collection, when I try to add the same card again, then I am prompted to either update the existing entry's quantity or add as a new entry
- Given I choose to update quantity, when I confirm, then the existing entry's quantity is increased
- Given I choose to add as new, when I confirm, then a new entry is created for the same card

### Collection Display

US-017
Title: View Collection Page
Description: As an authenticated user, I want to view my card collection so that I can see all the cards I own.
Acceptance Criteria:
- Given I am logged in, when I navigate to my collection page, then I see all my cards displayed
- Given I have cards in my collection, when I view the collection, then cards are grouped by set
- Given cards are grouped by set, when I view each group, then cards are sorted by card number within the set

US-018
Title: Paginate Collection View
Description: As an authenticated user with many cards, I want my collection to be paginated so that the page loads quickly.
Acceptance Criteria:
- Given I have more cards than fit on one page, when I view my collection, then I see pagination controls
- Given pagination is displayed, when I click next page, then I see the next set of cards
- Given I am on a page other than the first, when I click previous page, then I see the previous set of cards
- Given pagination is displayed, when I click a specific page number, then I navigate to that page

US-019
Title: View Collection Total Value
Description: As an authenticated user, I want to see the total estimated value of my collection so that I know what my cards are worth.
Acceptance Criteria:
- Given I have cards in my collection, when I view my collection or profile page, then I see the total estimated market value
- Given I have multiple copies of a card, when the value is calculated, then the quantity is factored into the total
- Given a card does not have a price available, when the value is calculated, then that card is excluded and the user is informed

US-020
Title: View Empty Collection State
Description: As a new user with no cards, I want to see a helpful empty state so that I know how to start adding cards.
Acceptance Criteria:
- Given I am logged in with no cards in my collection, when I view my collection page, then I see an empty state message
- Given I see the empty state, when I look at the content, then I see guidance on how to search for and add cards
- Given I see the empty state, when I click the suggested action, then I am taken to the search functionality

### User Profile

US-021
Title: View Profile Page
Description: As an authenticated user, I want to view my profile page so that I can see a summary of my collection.
Acceptance Criteria:
- Given I am logged in, when I navigate to my profile page, then I see my profile information
- Given I am on my profile page, when I view the content, then I see a summary of card counts per set
- Given I am on my profile page, when I view the content, then I see the total collection value displayed prominently

US-022
Title: View Collection Summary by Set
Description: As an authenticated user, I want to see how many cards I have from each set so that I can track my collection progress.
Acceptance Criteria:
- Given I am on my profile page, when I view the set summary, then I see each set I have cards from with a count
- Given I have cards from multiple sets, when I view the summary, then sets are listed alphabetically or by most cards
- Given I add or remove cards, when I return to my profile, then the counts are updated to reflect changes

### User Interface and Experience

US-023
Title: Switch Between Light and Dark Theme
Description: As a user, I want to switch between light and dark themes so that I can use the application comfortably in different lighting conditions.
Acceptance Criteria:
- Given I am using the application, when I toggle the theme setting, then the interface switches between light and dark mode
- Given I have selected a theme, when I return to the application later, then my theme preference is preserved
- Given I have not set a preference, when I first load the application, then the system default or light theme is applied

US-024
Title: View Loading States
Description: As a user, I want to see loading indicators while content loads so that I know the application is working.
Acceptance Criteria:
- Given I am waiting for content to load, when the page is fetching data, then I see skeleton loaders in place of content
- Given skeleton loaders are displayed, when the data loads successfully, then the loaders are replaced with actual content
- Given skeleton loaders are displayed, when the shape of loaders mimics the content layout, then the transition feels smooth

US-025
Title: Receive Action Confirmations
Description: As a user, I want to receive confirmation when I perform actions so that I know my actions were successful.
Acceptance Criteria:
- Given I add a card to my collection, when the operation succeeds, then I see a toast notification confirming the addition
- Given I edit a card in my collection, when the operation succeeds, then I see a toast notification confirming the update
- Given I delete a card from my collection, when the operation succeeds, then I see a toast notification confirming the deletion
- Given any action fails, when the error occurs, then I see a toast notification explaining the failure

US-026
Title: View API Unavailability Notice
Description: As a user, I want to be informed when external card data is unavailable so that I understand why some features may not work.
Acceptance Criteria:
- Given the external API is unavailable, when I use the application, then I see a non-intrusive banner informing me of the issue
- Given the API unavailability banner is displayed, when I continue using the application, then I can still access cached data and my collection
- Given the API becomes available again, when the system detects connectivity, then the banner is removed

US-027
Title: Navigate Application on Mobile
Description: As a mobile user, I want the application to be fully functional on my phone so that I can manage my collection anywhere.
Acceptance Criteria:
- Given I am using a mobile device, when I access the application, then all features are accessible and usable
- Given I am on a mobile device, when I view the interface, then elements are appropriately sized for touch interaction
- Given I am on a mobile device, when I view my collection, then the layout adapts to the screen size

### Legal and Compliance

US-028
Title: View Privacy Policy
Description: As a user, I want to read the Privacy Policy so that I understand how my data is handled.
Acceptance Criteria:
- Given I am on any page, when I click the Privacy Policy link in the footer, then I am taken to the Privacy Policy page
- Given I am on the Privacy Policy page, when I read the content, then I see clear information about data collection and usage

US-029
Title: View Terms of Service
Description: As a user, I want to read the Terms of Service so that I understand the rules for using the application.
Acceptance Criteria:
- Given I am on any page, when I click the Terms of Service link in the footer, then I am taken to the Terms of Service page
- Given I am on the Terms of Service page, when I read the content, then I see clear terms governing use of the application

### Error Handling and Edge Cases

US-030
Title: Handle Search with No Results
Description: As a user, I want to see a helpful message when my search returns no results so that I know to try a different query.
Acceptance Criteria:
- Given I perform a search, when no cards match my query, then I see a message indicating no results were found
- Given I see the no results message, when I view the content, then I see suggestions to try a different search term or adjust filters

US-031
Title: Handle Network Errors Gracefully
Description: As a user, I want the application to handle network errors gracefully so that I can continue using available features.
Acceptance Criteria:
- Given a network error occurs during an operation, when the error is detected, then I see an appropriate error message
- Given a network error occurs, when viewing my collection, then I can still see cached data if available
- Given a network error occurred, when connectivity is restored, then the application resumes normal operation

US-032
Title: Handle Invalid Session
Description: As a user with an expired session, I want to be redirected to login so that I can re-authenticate securely.
Acceptance Criteria:
- Given my session has expired, when I try to access protected content, then I am redirected to the login page
- Given I am redirected to login, when I view the page, then I see a message explaining my session expired
- Given I re-authenticate, when I log in successfully, then I am returned to my previous location if possible

US-033
Title: Prevent Accidental Data Loss
Description: As a user, I want confirmation before destructive actions so that I do not accidentally lose data.
Acceptance Criteria:
- Given I click delete on a card, when the action is triggered, then a confirmation modal appears before deletion occurs
- Given the confirmation modal is displayed, when I click cancel, then no deletion occurs and the modal closes
- Given the confirmation modal is displayed, when I click confirm, then the deletion proceeds

## 6. Success Metrics

### Primary Metrics

SM-001: User Adoption Rate
- Definition: Percentage of users who log in more than once and add at least one card to their collection within their first week
- Target: 90%
- Measurement: Track user registration date, login events, and first card addition timestamp

SM-002: Weekly Active Engagement
- Definition: Percentage of registered users who log in at least once per week
- Target: 50%
- Measurement: Track unique user logins per week against total registered user base

### Supporting Metrics

SM-003: Collection Activity
- Definition: Active engagement defined as users who perform at least one of the following actions: adding cards, viewing their collection, or browsing cards
- Target: Track and report weekly
- Measurement: Count unique users performing these actions per week

SM-004: Cards Added per User
- Definition: Average number of cards added to collections per active user
- Target: Establish baseline and track growth
- Measurement: Total cards added divided by active users per period

SM-005: Search to Add Conversion
- Definition: Percentage of search sessions that result in a card being added to a collection
- Target: Establish baseline and optimize
- Measurement: Track search sessions and subsequent add-to-collection events

SM-006: Error Rate
- Definition: Percentage of user actions that result in errors
- Target: Less than 1%
- Measurement: Track failed API calls, failed user actions, and error toast displays

SM-007: API Availability
- Definition: Uptime of the application and external API integrations
- Target: 99.5% uptime for application, with graceful degradation when external APIs are unavailable
- Measurement: Monitor application health and API response status

### Data Collection Notes
- All metrics will be collected anonymously in compliance with the Privacy Policy
- Metrics will be reviewed weekly during initial launch period
- Success criteria will be evaluated after 30 days of active use
