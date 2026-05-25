# Repository Guidelines

## Project Structure & Module Organization

This package is the TypeScript SDK for Inference Gateway. Core source lives in `src/`: `client.ts` contains the SDK client, `index.ts` exports the public API, and `src/types/generated/index.ts` is generated from `openapi.yaml`. Tests live in `tests/` and currently follow the `*.test.ts` pattern. Example consumers are under `examples/`, including `examples/chat`, `examples/list`, and MCP examples under `examples/mcp/`.

## Build, Test, and Development Commands

- `npm run build`: compiles TypeScript into `dist/` and emits declarations.
- `npm test`: runs Jest through `ts-jest`.
- `npm run lint`: runs ESLint on `src/**/*.ts`.
- `npm run format`: formats `src/**/*.ts` and `tests/**/*.ts` with Prettier.
- `task build`, `task test`, `task lint`: Taskfile wrappers used by the contributor docs.
- `task generate-types`: regenerates SDK types from `openapi.yaml`; run this after schema changes.

Use Node `>=24.15.0`, matching `package.json`.

## Coding Style & Naming Conventions

Write strict TypeScript targeting ES2024 with Node16 module resolution. Prefer explicit exported types for public SDK APIs and keep implementation details unexported. Use PascalCase for classes, interfaces, and generated enum imports, and camelCase for methods, callbacks, and local values. The codebase uses Prettier via ESLint, so run `npm run format` before submitting. Imports may use the configured aliases `@/*` for `src` and `@tests/*` for tests.

## Testing Guidelines

Jest is the test runner, configured in `jest.config.js` with Node test environment and `ts-jest` transforms. Place tests in `tests/` with names like `client.test.ts`. Add or update tests for new client methods, error handling paths, streaming behavior, and generated type integrations. Run `npm test` before opening a PR; use focused test cases only while developing.

## Commit & Pull Request Guidelines

Recent history uses Conventional Commit-style prefixes, often with scopes, such as `chore(docs): Generate CLAUDE.md file`, `chore(deps): Bump dev dependencies`, and `ci(deps): Update Claude Code Action`. Use prefixes from `CONTRIBUTING.md`: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`, `ci`, or `perf`.

PRs should include a concise description, linked issue when applicable, and notes about tests run. Update documentation and examples when changing public SDK behavior. If `openapi.yaml` changes, include regenerated `src/types/generated/index.ts` in the same PR.

## Security & Configuration Tips

Do not commit API keys, provider tokens, or local `.env` files. Example apps should document required environment variables in their README instead of hard-coding secrets. Treat generated types as schema-derived output; adjust the OpenAPI source and regenerate rather than hand-editing generated definitions.
