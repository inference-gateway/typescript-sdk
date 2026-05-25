# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

TypeScript SDK for the [Inference Gateway](https://github.com/inference-gateway/inference-gateway) — a unified API in front of OpenAI, Anthropic, Groq, Cohere, Ollama, Cloudflare, DeepSeek, Google, Mistral, Moonshot. Published as `@inference-gateway/sdk`. Requires Node ≥ 24.15.0.

## Commands

The canonical runner is [Task](https://taskfile.dev). The npm scripts it wraps also work.

```bash
task build            # tsc → dist/
task test             # jest
task lint             # eslint + markdownlint --fix
task oas-download     # refresh openapi.yaml from inference-gateway/schemas
task generate-types   # regenerate src/types/generated/ from openapi.yaml

# Single test:
npx jest -t "test name pattern"
npx jest tests/client.test.ts
```

A husky `pre-commit` hook runs `format → lint → build → test` on every commit. Don't bypass with `--no-verify` unless explicitly asked.

## Architecture

The entire SDK is two files:

- **`src/client.ts`** — `InferenceGatewayClient` (public API) + `StreamProcessor` (internal SSE handler).
- **`src/types/generated/index.ts`** — **auto-generated. Do not edit by hand.** Source of truth is `openapi.yaml`, which itself is pulled from the [`inference-gateway/schemas`](https://github.com/inference-gateway/schemas) repo. To change a type, edit the upstream schema and regenerate; do not patch the generated file locally.

`src/index.ts` re-exports both.

### Streaming model (the subtle parts)

`streamChatCompletion` always injects `stream: true` and `stream_options: { include_usage: true }` internally — the request type omits these fields, and callers must not pass them.

`StreamProcessor` distinguishes two kinds of tool calls based on the request:

- If the tool's `function.name` appears in the request's `tools` array (client-provided function tools) → `onTool` callback.
- Otherwise (assumed to be an MCP tool returned by the gateway) → `onMCPTool` callback.

This means: if you forget to pass `tools` on a request that uses function calling, every tool call gets routed to `onMCPTool`. Tool-call chunks arrive in fragments and are reassembled by `index` in `incompleteToolCalls` before being emitted; the stream finalizes them on `[DONE]` or on `finish_reason: tool_calls`.

Mid-stream errors are embedded as `{ "error": ... }` inside SSE `data:` payloads and routed to `onError` — they don't surface as HTTP errors.

### Other gotchas

- `healthCheck()` strips `/v1` from `baseURL` and hits `/health` at the root — so a `baseURL` of `http://localhost:8080/v1` calls `http://localhost:8080/health`.
- `proxy()` does not strip `/v1`; pass the appropriate `baseURL` for the proxy route you want.
- `withOptions()` returns a **new** client with merged options (headers/query merge, scalars override). It does not mutate the receiver.

## Tests

Jest + ts-jest, Node test environment. The pattern is to construct the client with an injected `fetch: jest.fn()` and assert on the mock. Streaming tests build a `ReadableStream` from a `TransformStream` and write SSE-formatted chunks. Path aliases `@/*` → `src/*` and `@tests/*` → `tests/*` are wired in both `tsconfig.json` and `jest.config.js`.

## Examples

`examples/{list,chat,mcp}` are **standalone npm packages** that depend on the published `@inference-gateway/sdk`. They are not part of the build and won't pick up uncommitted local changes without an npm link. They expect a gateway at `http://localhost:8080` and read `PROVIDER` / `LLM` from the environment.

## Commits and releases

Conventional commits are load-bearing — `semantic-release` parses them on merge to `main` to compute the next version and update `CHANGELOG.md`. Recognized types (from `.releaserc.yaml`): `feat` (minor), `impr` / `refactor` / `perf` / `fix` / `ci` / `docs` / `style` / `test` / `build` / `chore` (patch). A `chore(release): ...` scope is excluded from triggering a release.
