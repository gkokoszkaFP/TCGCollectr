Your task is to implement a REST API endpoint based on the provided implementation plan. Your goal is to create a solid and well-organized implementation that includes appropriate validation, error handling, and follows all logical steps described in the plan.

First, carefully review the provided implementation plan:

<implementation_plan>
**[get-set-implementation-plan.md](./get-set-implementation-plan.md)**
</implementation_plan>

<types>
 **[types.ts](../../src/types.ts)**
</types>

<implementation_rules>
**[shared.instructions.md](../../.github/instructions/shared.instructions.md)**
**[backend.instructions.md](../../.github/instructions/backend.instructions.md)**
**[astro.instructions.md](../../.github/instructions/astro.instructions.md)**
</implementation_rules>

<implementation_approach>
Implement a maximum of 3 steps from the implementation plan, briefly summarize what you've done, and describe the plan for the next 2 actions - stop work at this point and wait for my feedback. **Note**: Integration tests (Jest/Playwright) are NOT required. **Manual endpoint testing will be performed by the user, not by the implementer.**
</implementation_approach>

Now perform the following steps to implement the REST API endpoint:

1. Analyze the implementation plan:
   - Determine the HTTP method (GET, POST, PUT, DELETE, etc.) for the endpoint.
   - Define the endpoint URL structure
   - List all expected input parameters
   - Understand the required business logic and data processing stages
   - Note any special requirements for validation or error handling.

2. Begin implementation:
   - Start by defining the endpoint function with the correct HTTP method decorator.
   - Configure function parameters based on expected inputs
   - Implement input validation for all parameters
   - Follow the logical steps described in the implementation plan
   - Implement error handling for each stage of the process
   - Ensure proper data processing and transformation according to requirements
   - Prepare the response data structure

3. Validation and error handling:
   - Implement thorough input validation for all parameters
   - Use appropriate HTTP status codes for different scenarios (e.g., 400 for bad requests, 404 for not found, 500 for server errors).
   - Provide clear and informative error messages in responses.
   - Handle potential exceptions that may occur during processing.

4. Manual testing with curl:
   - Test successful request paths using curl commands
   - Verify error handling with invalid inputs
   - Confirm proper HTTP status codes and response formats
   - Validate header requirements and security measures
   - Minimal cURL commands documented in [docs/tests/postman-curls.md](../tests/postman-curls.md) for direct Postman import
   - **Note**: Integration tests (Jest/Playwright) are not required for this endpoint and will not be created as part of this implementation.

   Important: For endpoints that return card or set metadata, the implementation MUST document and implement the MVP on-demand seeding flow described in:
   - `docs/prd.md` (section: "MVP Data Sync Strategy (TCGDex)")
   - `docs/api-plan.md` (section: "Addendum: On-demand seeding behavior (MVP)")

   Endpoint implementation plans should explicitly state whether they follow the on-demand seed-on-read approach or rely on background sync (background sync is not part of MVP unless explicitly added). The plan must list required environment variables (`TCGDEX_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`) and any rate-limiting or security controls required to protect upstream APIs.

5. Documentation:
   - Add clear comments to explain complex logic or important decisions
   - Include documentation for the main function and any helper functions.

After completing the implementation, ensure it includes all necessary imports, function definitions, and any additional helper functions or classes required for the implementation.

If you need to make any assumptions or have any questions about the implementation plan, present them before writing code.

Remember to follow REST API design best practices, adhere to programming language style guidelines, and ensure the code is clean, readable, and well-organized.
