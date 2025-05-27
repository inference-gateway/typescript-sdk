# Custom Instructions for Copilot

Today is May 26, 2025.

- Always use context7 to check for the latest updates, features, or best practices of a library relevant to the task at hand.
- Always prefer Table-Driven Testing: When writing tests.
- Always use Early Returns: Favor early returns to simplify logic and avoid deep nesting with if-else structures.
- Always prefer switch statements over if-else chains: Use switch statements for cleaner and more readable code when checking multiple conditions.
- Always run `task lint` before committing code to ensure it adheres to the project's linting rules.
- Always run `task test` before committing code to ensure all tests pass.
- Always run `task build` to verify compilation after making changes.
- Always search for the simplest solution first before considering more complex alternatives.
- Always prefer type safety over dynamic typing: Use strong typing and interfaces to ensure type safety and reduce runtime errors.
- When possible code to an interface so it's easier to mock in tests.
- When writing tests, each test case should have it's own isolated mock server mock dependecies so it's easier to understand and maintain.

## Development Workflow

### Configuration Changes

When adding new configuration fields:

1. OpenAPI is the source of truth `openapi.yaml` - readonly file.
2. If added new Schemas to openapi.yaml, update internal/openapi/schemas.go to include the new schemas
3. Run `task generate-types` to regenerate all types from openapi specification
4. Run `task lint` to ensure code quality
5. Run `task build` to verify successful compilation
6. Run `task test` to ensure all tests pass
7. Update the README.md file or any documentation files with the recently added implementation

## Available Tools and MCPs

- context7 - Helps by finding the latest updates, features, or best practices of a library relevant to the task at hand.

## Related Repositories

- [Inference Gateway](https://github.com/inference-gateway)
  - [Inference Gateway UI](https://github.com/inference-gateway/ui)
  - [Go SDK](https://github.com/inference-gateway/go-sdk)
  - [Rust SDK](https://github.com/inference-gateway/rust-sdk)
  - [TypeScript SDK](https://github.com/inference-gateway/typescript-sdk)
  - [Python SDK](https://github.com/inference-gateway/python-sdk)
  - [Documentation](https://github.com/inference-gateway/docs)
