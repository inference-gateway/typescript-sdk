# Examples

This directory contains examples that demonstrate how to use the Typescript SDK.

## Pre-requisites

You should have docker installed or use the dev container in VS Code which has
all the tools you might need.

## Quick Start

1. Copy the `.env.example` file to `.env` and fill in your API key.

2. Start the Inference Gateway locally:

   ```bash
   docker run --rm -p 8080:8080 --env-file .env ghcr.io/inference-gateway/inference-gateway:latest
   ```

3. On another terminal export the provider and the LLM you intent to use:

   ```bash
   export PROVIDER=groq
   export LLM=llama-3.3-70b-versatile
   ```

4. Review the different examples in the specific directories:

   - [List](./list): Demonstrates listing models, MCP tools, health checks,
     and provider proxy functionality.
   - [Chat](./chat): Shows chat completions, streaming responses, multi-turn
     conversations, and function calling.
   - [MCP](./mcp): Illustrates Model Context Protocol integration with file
     operations, web scraping, and multi-tool conversations using Docker
     Compose.

## Examples Overview

### [List Example](./list)

**Purpose**: Explore available models and MCP tools across providers

**Features**:

- List all available models across providers
- Filter models by specific provider
- Discover MCP tools and their schemas
- Health check validation
- Direct provider API access via proxy

**Best for**: Understanding what's available in your Inference Gateway setup

### [Chat Example](./chat)

**Purpose**: Demonstrate various chat completion patterns

**Features**:

- Simple request/response chat completions
- Real-time streaming responses
- Multi-turn conversation handling
- Function/tool calling with AI models
- Temperature comparison examples

**Best for**: Building chat applications and understanding different
interaction patterns

### [MCP Example](./mcp)

**Purpose**: Showcase Model Context Protocol integration

**Features**:

- Docker Compose orchestration of MCP servers
- File system operations via MCP tools
- Web content fetching and search simulation
- Multi-tool conversations
- Real-time tool execution streaming

**Best for**: Integrating external tools and services with AI models

## Running Examples

Each example can be run independently:

```bash
# Navigate to any example directory
cd list  # or chat, or mcp

# Install dependencies
npm install

# Run the example
npm start
```

## Environment Variables

All examples support these environment variables:

- `PROVIDER` - AI provider to use (groq, openai, anthropic, etc.)
- `LLM` - Specific model to use (e.g., meta-llama/llama-3.3-70b-versatile)

Provider-specific API keys should be set in the `.env` file (see `.env.example`).

## Example Combinations

You can combine concepts from different examples:

1. **List + Chat**: Discover available models, then use them for chat
2. **Chat + MCP**: Use function calling with MCP tools for enhanced capabilities
3. **List + MCP**: Explore MCP tools, then integrate them into conversations
