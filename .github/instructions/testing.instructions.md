---
applyTo: "**/*.test.ts,**/*.test.tsx,**/*.spec.ts,tests/**,e2e/**,playwright.config.ts,jest.config.ts"
---

# Testing Guidelines

## Unit Testing (Jest)

- Use Jest with TypeScript for type checking in tests
- Implement Testing Library for component testing instead of enzyme
- Use snapshot testing sparingly and only for stable UI components
- Leverage mock functions and spies for isolating units of code
- Implement test setup and teardown with beforeEach and afterEach
- Use describe blocks for organizing related tests
- Leverage expect assertions with specific matchers
- Implement code coverage reporting with meaningful targets
- Use mockResolvedValue and mockRejectedValue for async testing
- Leverage fake timers for testing time-dependent functionality

For up-to-date Jest documentation and best practices, use MCP:

```
@mcp get-library-docs /facebook/jest [topic]
```

## End-to-End Testing (Playwright)

- Initialize configuration only with Chromium/Desktop Chrome browser
- Use browser contexts for isolating test environments
- Implement the Page Object Model for maintainable tests
- Use locators for resilient element selection
- Leverage API testing for backend validation
- Implement visual comparison with expect(page).toHaveScreenshot()
- Use the codegen tool for test recording
- Leverage trace viewer for debugging test failures
- Implement test hooks for setup and teardown
- Use expect assertions with specific matchers
- Leverage parallel execution for faster test runs

For up-to-date Playwright documentation and best practices, use MCP:

```
@mcp get-library-docs /microsoft/playwright [topic]
```

## Anti-patterns

### Testing Anti-patterns to Avoid

- Don't test implementation details - focus on user behavior
- Avoid relying on CSS selectors - use accessible queries (role, label, text)
- Don't create overly complex mocks - consider integration tests instead
- Avoid testing third-party libraries - trust their tests
- Don't write tests that depend on execution order
- Avoid hardcoded waits - use proper async utilities
- Don't ignore flaky tests - fix them or remove them
- Avoid snapshot tests for dynamic content
