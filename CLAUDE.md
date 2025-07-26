# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the TypeScript SDK for the [Inference Gateway](https://github.com/inference-gateway/inference-gateway), a gateway service that provides unified access to multiple AI providers (OpenAI, Anthropic, Ollama, Cloudflare, Cohere, DeepSeek, etc.). The SDK enables developers to interact with various LLM providers through a single, consistent interface.

## Development Commands

### Common Development Tasks
- `npm run prepare` - Install pre-commit hooks and prepare the project
- `npm run build` - Build the TypeScript SDK
- `npm run test` - Run Jest tests
- `npm run lint` - Lint source code with ESLint
- `npm run format` - Format code with Prettier
- `task build` - Alternative build command using Taskfile
- `task test` - Alternative test command using Taskfile
- `task lint` - Alternative lint command using Taskfile

### Type Generation
- `task generate-types` - Generate TypeScript types from OpenAPI specification
- `task oas-download` - Download latest OpenAPI spec from main repository

### Testing
- Run single test: `npm test -- --testNamePattern="test name"`
- Run tests with coverage: `npm test -- --coverage`
- Tests are located in `tests/` directory and use Jest with ts-jest

## Architecture

### Core Components

**InferenceGatewayClient** (`src/client.ts:270`)
- Main SDK client class that handles all API interactions
- Supports both streaming and non-streaming chat completions
- Includes built-in retry logic, timeout handling, and error management
- Provides methods: `listModels()`, `listTools()`, `createChatCompletion()`, `streamChatCompletion()`, `proxy()`, `healthCheck()`

**StreamProcessor** (`src/client.ts:31`)
- Handles Server-Sent Events (SSE) for streaming responses
- Processes tool calls incrementally as they arrive
- Distinguishes between client-provided tools and MCP (Model Context Protocol) tools
- Manages reasoning content, regular content, and usage metrics

**Generated Types** (`src/types/generated/index.ts`)
- Auto-generated from OpenAPI specification using openapi-typescript
- Contains all request/response schemas and type definitions
- Never edit manually - regenerate using `task generate-types`

### Key Features

**Multi-Provider Support**
- Provider enum supports: OpenAI, Anthropic, Ollama, Cloudflare, Cohere, DeepSeek, Groq
- Optional provider parameter in API calls for explicit routing
- Proxy method for direct provider-specific API calls

**Tool Call Handling**
- Supports both client-defined tools and MCP tools
- Incremental tool call processing during streaming
- Separate callbacks for regular tools (`onTool`) and MCP tools (`onMCPTool`)

**Streaming Architecture**
- Event-driven streaming with comprehensive callback system
- Callbacks: `onOpen`, `onChunk`, `onContent`, `onReasoning`, `onTool`, `onMCPTool`, `onUsageMetrics`, `onFinish`, `onError`
- Automatic JSON parsing and error recovery

## Development Guidelines

### Code Style
- Use early returns to avoid deep nesting
- Prefer switch statements over if-else chains
- Code to interfaces for better testability
- Use strong typing throughout - avoid `any`

### Testing
- Each test case should have isolated mock dependencies
- Prefer table-driven testing patterns
- Run `task test` before committing

### Type Safety
- OpenAPI specification is the source of truth (`openapi.yaml`)
- All API types are generated - never manually edit `src/types/generated/index.ts`
- After schema changes, run `task generate-types` to update types

### Commit Process
1. Run `task lint` to ensure code quality
2. Run `task test` to verify all tests pass  
3. Run `task build` to verify compilation
4. Use conventional commit types: feat, fix, refactor, docs, style, test, chore, ci, perf

## Examples

The `examples/` directory contains working implementations:
- `examples/chat/` - Basic chat completion example
- `examples/list/` - Model and tool listing example
- `examples/mcp/` - Model Context Protocol examples with agents and servers

## Important Notes

- Node.js >= 22.12.0 and npm >= 10.9.0 required
- All network requests include timeout handling (default 60 seconds)
- MCP tools are only available when `EXPOSE_MCP` is enabled on the gateway
- The SDK automatically handles authentication via Bearer token if provided