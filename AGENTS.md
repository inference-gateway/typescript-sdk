# Repository Guidelines

## Project Structure & Module Organization

This package is the TypeScript SDK for the [Inference Gateway](https://github.com/inference-gateway/inference-gateway) - a unified API in front of OpenAI, Anthropic, Groq, Cohere, Ollama, Cloudflare, DeepSeek, Google, Mistral, Moonshot - published as `@inference-gateway/sdk`. Core source lives in `src/`: `client.ts` contains `InferenceGatewayClient` (public API) and the internal SSE stream processors, `index.ts` re-exports the public API, and `src/types/generated/index.ts` is generated from `openapi.yaml`. Tests live in `tests/` and follow the `*.test.ts` pattern.

`src/types/generated/index.ts` is **auto-generated. Do not edit by hand.** `openapi.yaml` is itself pulled from the [`inference-gateway/schemas`](https://github.com/inference-gateway/schemas) repo; to change a type, edit the upstream schema, then run `task oas-download` and `task generate-types`.

Example consumers under `examples/` (e.g. `chat`, `list`, `messages`, `images`, `mcp`) are **standalone npm packages** that depend on the published `@inference-gateway/sdk`. They are not part of the build and won't pick up uncommitted local changes without an npm link. They expect a gateway at `http://localhost:8080` and read `PROVIDER` / `LLM` from the environment.

## Build, Test, and Development Commands

The canonical runner is [Task](https://taskfile.dev); the npm scripts it wraps also work.

- `task build` / `npm run build`: compiles TypeScript into `dist/` and emits declarations.
- `task test` / `npm test`: runs Jest through `ts-jest`.
- `task lint`: runs ESLint (`npm run lint`, on `src/` and `tests/`) plus `markdownlint --fix`.
- `npm run format`: formats `src/**/*.ts` and `tests/**/*.ts` with Prettier.
- `task oas-download`: refreshes `openapi.yaml` from `inference-gateway/schemas` (pin with `SCHEMAS_REF`).
- `task generate-types`: regenerates `src/types/generated/` from `openapi.yaml`; run this after schema changes.
- Single test: `npx jest -t "test name pattern"` or `npx jest tests/client.test.ts`.

Use Node `>=24.15.0`, matching `package.json`.

A husky `pre-commit` hook runs `format -> lint -> build -> test` on every commit. Don't bypass it with `--no-verify` unless explicitly asked.

## Streaming Model and Gotchas

- `streamChatCompletion` always injects `stream: true` and `stream_options: { include_usage: true }` internally - the request type omits these fields, and callers must not pass them.
- The stream processor routes tool calls by request: if the tool's `function.name` appears in the request's `tools` array (client-provided function tools) it goes to `onTool`; otherwise it is assumed to be an MCP tool returned by the gateway and goes to `onMCPTool`. Forgetting to pass `tools` on a function-calling request routes every tool call to `onMCPTool`.
- Tool-call chunks arrive in fragments and are reassembled by `index` in `incompleteToolCalls` before being emitted; the stream finalizes them on `[DONE]` or on `finish_reason: tool_calls`.
- Mid-stream errors are embedded as `{ "error": ... }` inside SSE `data:` payloads and routed to `onError` - they don't surface as HTTP errors.
- `healthCheck()` strips `/v1` from `baseURL` and hits `/health` at the root - a `baseURL` of `http://localhost:8080/v1` calls `http://localhost:8080/health`.
- `proxy()` does not strip `/v1`; pass the appropriate `baseURL` for the proxy route you want.
- `withOptions()` returns a **new** client with merged options (headers/query merge, scalars override). It does not mutate the receiver.

## Coding Style & Naming Conventions

Write strict TypeScript targeting ES2024 with Node16 module resolution. Prefer explicit exported types for public SDK APIs and keep implementation details unexported. Use PascalCase for classes, interfaces, and generated enum imports, and camelCase for methods, callbacks, and local values. The codebase uses Prettier via ESLint, so run `npm run format` before submitting. Imports may use the configured aliases `@/*` for `src` and `@tests/*` for tests (wired in both `tsconfig.json` and `jest.config.js`).

### Code Readability

- Write self-explanatory code: clear names and small, single-purpose functions carry the intent.
  If a block needs a comment to be understood, extract it into a well-named function or variable.
- No inline comments inside function bodies.
- Doc comments on functions and types are at most 5 lines: what it does and why, not how.
- No comments above modules, packages, or files.
- Tool directives are not comments and stay where the tool needs them (lint suppressions, build
  tags, compiler pragmas, code generation markers).

## Testing Guidelines

Jest is the test runner, configured in `jest.config.js` with Node test environment and `ts-jest` transforms. Place tests in `tests/` with names like `client.test.ts`. The pattern is to construct the client with an injected `fetch: jest.fn()` and assert on the mock; streaming tests build a `ReadableStream` from a `TransformStream` and write SSE-formatted chunks. Add or update tests for new client methods, error handling paths, streaming behavior, and generated type integrations. Run `npm test` before opening a PR; use focused test cases only while developing.

## Commit & Pull Request Guidelines

Conventional commits are load-bearing - `semantic-release` parses them on merge to `main` to compute the next version and update `CHANGELOG.md`. Recognized types (from `.releaserc.yaml`): `feat` (minor), `impr` / `refactor` / `perf` / `fix` / `ci` / `docs` / `style` / `test` / `build` / `chore` (patch). A `chore(release): ...` scope is excluded from triggering a release. Scopes are common, e.g. `chore(deps): Bump dev dependencies`.

PRs should include a concise description, linked issue when applicable, and notes about tests run. Update documentation and examples when changing public SDK behavior. If `openapi.yaml` changes, include regenerated `src/types/generated/index.ts` in the same PR.

## Security & Configuration Tips

Do not commit API keys, provider tokens, or local `.env` files. Example apps should document required environment variables in their README instead of hard-coding secrets.
