# AGENTS.md - Inference Gateway TypeScript SDK

This document provides comprehensive guidance for AI agents working with the Inference Gateway TypeScript SDK project.

## Project Overview

**Inference Gateway TypeScript SDK** is a TypeScript client library for interacting with the Inference Gateway API.
It provides a unified interface to multiple AI providers (OpenAI, Anthropic, Groq, etc.) and supports features
like chat completions, streaming, tool calling, and MCP (Model Context Protocol) integration.

### Key Technologies

- **Language**: TypeScript (ES2024)
- **Runtime**: Node.js (>=24.11.0)
- **Build System**: TypeScript Compiler
- **Testing**: Jest with ts-jest
- **Linting**: ESLint with TypeScript support
- **Formatting**: Prettier
- **Task Runner**: Task (Taskfile.yml)
- **Package Manager**: npm
- **CI/CD**: GitHub Actions

## Project Structure

```text
.
├── src/                    # Source code
│   ├── client.ts          # Main client implementation
│   ├── index.ts           # Public API exports
│   └── types/
│       └── generated/     # Auto-generated types from OpenAPI
├── tests/                 # Test files
│   └── client.test.ts    # Comprehensive client tests
├── examples/              # Usage examples
│   ├── chat/             # Chat completion examples
│   ├── list/             # Model listing examples
│   └── mcp/              # MCP integration examples
├── dist/                 # Built output (generated)
└── node_modules/         # Dependencies (generated)
```

## Development Environment Setup

### Prerequisites

- Node.js >= 24.11.0
- npm >= 11.6.1
- Docker (for running examples)

### Quick Setup

```bash
# Clone the repository
git clone https://github.com/inference-gateway/typescript-sdk
cd typescript-sdk

# Install dependencies
npm install

# Build the project
npm run build
```

### Development Container (Recommended)

The project includes VS Code devcontainer configuration for consistent development environment.

## Key Commands

### Development Commands

```bash
# Build the SDK
npm run build
# or
task build

# Run tests
npm run test
# or
task test

# Lint code
npm run lint
# or
task lint

# Format code
npm run format

# Generate TypeScript types from OpenAPI
npm run generate-types
# or
task generate-types

# Download latest OpenAPI specification
task oas-download
```

### Testing Commands

```bash
# Run all tests
npm run test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

## Development Workflow

### Branch Strategy

- Create feature branches from `main`
- Use conventional commit messages
- Never push directly to `main`

### Commit Message Convention

```text
feat: new feature
fix: bug fix
refactor: code change without new features
docs: documentation
style: formatting changes
test: adding tests
chore: build/config changes
ci: CI/CD changes
perf: performance improvements
```

### Code Quality

- All code must pass linting: `task lint`
- All code must be formatted: `task fmt`
- All tests must pass: `task test`
- TypeScript strict mode is enabled

## Architecture and Key Components

### Core Client (`src/client.ts`)

The main `InferenceGatewayClient` class provides:

- **Model Management**: List available models across providers
- **Chat Completions**: Both regular and streaming responses
- **Tool Calling**: Function calling with AI models
- **MCP Integration**: Model Context Protocol tool discovery
- **Proxy Support**: Direct provider API access
- **Health Checks**: API status verification

### Stream Processing

Advanced streaming support with:

- Real-time content delivery
- Tool call assembly from chunks
- Reasoning content handling (DeepSeek, Groq)
- Usage metrics collection
- Error handling mid-stream

### Type System (`src/types/generated/`)

Auto-generated from OpenAPI specification:

- Complete API type definitions
- Provider-specific interfaces
- Request/response schemas
- Error handling types

## Testing Strategy

### Test Structure

- **Unit Tests**: Individual method testing
- **Integration Tests**: API interaction testing
- **Mock Testing**: HTTP request mocking with Jest
- **Stream Testing**: TransformStream-based stream simulation

### Test Patterns

- Mock fetch API for HTTP requests
- Use TransformStream for stream testing
- Test both success and error scenarios
- Verify type safety in tests

## Configuration Files

### TypeScript (`tsconfig.json`)

- Target: ES2024
- Module: Node16
- Strict mode enabled
- Declaration files generated
- Path mapping for `@/` and `@tests/` aliases

### ESLint (`eslint.config.mjs`)

- TypeScript ESLint integration
- Prettier integration
- Jest globals configured
- Different rules for source, tests, and examples

### Jest (`jest.config.js`)

- TypeScript support via ts-jest
- Node.js test environment
- Module name mapping for aliases
- Test file pattern matching

### Prettier (`.prettierrc.json`)

- Single quotes
- Trailing commas in ES5
- 80 character print width
- 2 space tabs

### Task Runner (`Taskfile.yml`)

- Unified task definitions
- OpenAPI type generation
- Linting with markdownlint
- Build and test commands

## Important Files and Conventions

### Source Files

- `src/client.ts` - Main client implementation
- `src/index.ts` - Public API exports
- `src/types/generated/index.ts` - Auto-generated types

### Test Files

- `tests/client.test.ts` - Comprehensive client tests
- Uses Jest mocking for HTTP requests
- Tests both sync and async operations
- Extensive stream testing

### Examples

- `examples/list/` - Model and tool discovery
- `examples/chat/` - Chat completion patterns
- `examples/mcp/` - MCP tool integration

### CI/CD

- `.github/workflows/ci.yml` - Automated testing
- `.releaserc.yaml` - Release configuration
- Husky pre-commit hooks

## Agent Workflow Guidelines

### When Adding Features

1. Update OpenAPI specification if needed
2. Generate types: `task generate-types`
3. Implement feature in `src/client.ts`
4. Add comprehensive tests
5. Update examples if applicable
6. Run lint, format, and test

### When Fixing Bugs

1. Add failing test case first
2. Implement fix
3. Verify all tests pass
4. Update documentation if needed

### When Working with Types

1. Types are auto-generated from OpenAPI
2. Never manually edit `src/types/generated/`
3. Use `task oas-download` to update OpenAPI spec
4. Use `task generate-types` to regenerate types

### Best Practices

- Always use TypeScript strict mode
- Prefer async/await over callbacks
- Handle both success and error cases
- Test edge cases and error scenarios
- Follow existing code patterns and conventions
