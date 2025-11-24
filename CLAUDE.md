# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

TypeScript SDK for the [Inference Gateway][ig] - a unified API for multiple
LLM providers (OpenAI, Anthropic, Groq, Cohere, Ollama, Cloudflare, DeepSeek,
Google, Mistral).

[ig]: https://github.com/edenreich/inference-gateway

## Commands

```bash
# Build
npm run build

# Test
npm run test

# Run a single test
npx jest tests/client.test.ts -t "test name pattern"

# Lint
npm run lint

# Format
npm run format

# Generate types from OpenAPI spec (downloads spec first)
task oas-download && task generate-types
```

## Architecture

### Source Structure

- `src/index.ts` - Package entry point, re-exports client and types
- `src/client.ts` - Main `InferenceGatewayClient` class with all API methods
- `src/types/generated/index.ts` - Auto-generated TypeScript types from OpenAPI
  spec (do not edit manually)

### Client Architecture

The SDK centers around `InferenceGatewayClient` which provides:

- `listModels(provider?)` - List available models
- `listTools()` - List MCP tools (when EXPOSE_MCP enabled)
- `createChatCompletion(request, provider?)` - Non-streaming completions
- `streamChatCompletion(request, callbacks, provider?, abortSignal?)` -
  Streaming completions with SSE
- `proxy(provider, path, options)` - Direct provider proxy
- `healthCheck()` - Gateway health check
- `withOptions(options)` - Create new client with merged options

### Streaming Implementation

`StreamProcessor` class handles SSE parsing with callbacks for:

- `onContent` - Text content chunks
- `onReasoning` - Reasoning content (DeepSeek, Groq models)
- `onTool` - Client-provided tool calls
- `onMCPTool` - MCP tool calls (tools not in client's tool list)
- `onUsageMetrics` - Token usage statistics

### Type Generation

Types in `src/types/generated/index.ts` are auto-generated from the OpenAPI
spec using `openapi-typescript`. Regenerate with `task generate-types` after
downloading the latest spec.

### Path Aliases

- `@/*` maps to `./src/*`
- `@tests/*` maps to `./tests/*`

## Testing

Tests use Jest with ts-jest. Tests mock the fetch function to simulate API
responses including streaming SSE events. Test file: `tests/client.test.ts`.

## Commit Message Convention

Use conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `style:`,
`test:`, `chore:`, `ci:`, `perf:`
