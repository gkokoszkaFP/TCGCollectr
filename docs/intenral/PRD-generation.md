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
  - card information
- Have ability to import price and card info from https://tcgcsv.com/#daily-updates (csv format) to fill database with cards data (basic metadata and price).
- Use of free APIs to fetch card information (metadata, price) - pokemontcg.io - complementary to csv data dump (for example show more data on specific card).
- Browsing any Pokémon cards without needing to add them to their collection.

## What is NOT in the scope of MVP

- Using paid APIs
- Support for non-Pokémon cards
- Advanced card price and trend analysis
- Scanning cards with the camera (OCR) as an alternative to adding cards
- Redirecting to websites selling cards (e.g., eBay, Amazon, etc.)

## Success criteria

- 90% of users have cards added to their profile.
- 75% of users log in once a week and add new cards.
  </project_description>

<project_details>
**[PRD-prompt-refined-response.md](./PRD-prompt-refined-response.md)**
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

The final output should consist solely of the PRD in the specified markdown format, which you will save in the file docs/prd.md
