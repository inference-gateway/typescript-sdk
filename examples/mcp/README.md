# MCP Examples

This directory contains comprehensive examples demonstrating how to use the Inference Gateway SDK with Model Context Protocol (MCP) tools in a multi-provider architecture. Each example showcases different aspects of MCP tool integration.

## 📁 Available Examples

### Core Examples

- **`example-basic.ts`** - Basic MCP tool usage and file operations
- **`example-advanced.ts`** - Multi-scenario demonstration with complex workflows
- **`example-nextjs.ts`** - Next.js application generator with documentation fetching
- **`example-handler-demo.ts`** - Comprehensive `onMCPTool` handler demonstration

### Debugging & Testing Examples

- **`example-tool-demo.ts`** - Tool argument analysis and issue identification
- **`example-debug-args.ts`** - Raw tool argument debugging
- **`example-list-tools.ts`** - List all available MCP tools with schemas
- **`example-mcp-tools.ts`** - Legacy MCP tools example

## 🚀 Quick Start

### Run Specific Examples

```bash
# Run specific examples by name
npm run example:basic
npm run example:advanced
npm run example:nextjs
npm run example:tool-demo
npm run example:handler-demo
npm run example:debug-args
npm run example:list-tools
```

## Features Demonstrated

1. **MCP Tool Discovery** - List and explore available MCP tools
2. **File Operations** - Use filesystem MCP server for file operations
3. **Web Scraping** - Fetch content from URLs using MCP tools
4. **Multi-Tool Conversations** - Combine multiple MCP tools in single conversations
5. **Tool Function Calling** - Stream responses with real-time tool execution
6. **Data Analysis** - Analyze sample data files with AI assistance
7. **Enhanced Tool Debugging** - Comprehensive `onMCPTool` handler examples
8. **Error Handling** - Robust handling of incomplete tool arguments and failures

## Architecture

This example uses Docker Compose to orchestrate:

- **Inference Gateway** - Main API gateway with MCP support enabled
- **MCP Filesystem Server** - Provides file system operations (restricted to `/shared` and `/tmp`)
- **MCP Web Search Server** - Simulated web search and URL fetching
- **Optional Ollama** - Local model inference (when using `--profile with-ollama`)

## Important: Filesystem Access

The MCP filesystem server is configured with restricted access for security:

- **`/shared`** - Read-only directory with sample data files
- **`/tmp`** - Read-write directory for temporary files

The AI will only be able to access these directories. This prevents unauthorized access to system files.

## Sample Data

The `/shared` directory contains example files for testing:

- `mcp-filesystem-example.txt` - Basic example file
- `sample_sales_data.csv` - Sales data for analysis exercises
- `README.md` - Documentation about available files

## Setup Instructions

### Prerequisites

- Docker and Docker Compose installed
- API key for at least one provider (OpenAI, Groq, Anthropic, etc.)

### 1. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Configure your environment:

```bash
# Required: Set your provider and model
PROVIDER=openai
LLM=gpt-4o

# Required: Add your API keys (at least one)
OPENAI_API_KEY=your_key_here
GROQ_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
DEEPSEEK_API_KEY=your_key_here

# Optional: Inference Gateway configuration
EXPOSE_MCP=true
```

### 2. Start Infrastructure

Start the MCP infrastructure:

```bash
npm run compose:up
```

Wait for all services to be healthy:

```bash
docker-compose ps
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Examples

Choose any example to run:

```bash
# Start with the basic example
npm run start

# Or run specific examples
npm run run:advanced
npm run run:nextjs
npm run run:tool-demo
```

```bash
cp .env.example .env
```

### 1. Start the MCP Infrastructure

Start all services using Docker Compose:

```bash
npm run compose:up
```

This will start:

- Inference Gateway on port 8080
- MCP Filesystem server on port 3000
- MCP Web Search server on port 3001

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Provider and Model

Set your preferred provider and model:

```bash
export PROVIDER=groq
export LLM=meta-llama/llama-3.3-70b-versatile
```

Or for OpenAI:

```bash
export PROVIDER=openai
export LLM=gpt-4o
```

### 4. Verify MCP Setup

Test that MCP tools are working correctly:

```bash
npx tsx test-mcp-tools.ts
```

### 5. Run Examples

Run the main example:

```bash
npm start
```

Or run the focused filesystem demo:

```bash
npx tsx filesystem-demo.ts
```

## Available Examples

- `index.ts` - Enhanced MCP demonstration with comprehensive tool handling
- `advanced-example.ts` - Multi-scenario examples showing file operations, web content, and data analysis
- `nextjs-example.ts` - **IMPROVED!** Create a complete Next.js app with enhanced error handling and URL parsing
- `handler-demo.ts` - Focused demonstration of the onMCPTool handler with detailed metrics and logging
- `tool-demo.ts` - **NEW!** Comprehensive tool demonstration that identifies schema issues
- `list-tools.ts` - **NEW!** Inspect MCP tool schemas and parameters
- `example-mcp-tools.ts` - Basic MCP tool discovery and testing

## Available Commands

- `npm start` - Run the main enhanced MCP example (index.ts)
- `npm run advanced` - Run the advanced multi-scenario examples
- `npm run nextjs` - Run improved Next.js app creator with better debugging
- `npm run handler-demo` - Run the focused MCP tool handler demonstration
- `npx tsx tool-demo.ts` - **NEW!** Run comprehensive tool testing and issue identification
- `npx tsx list-tools.ts` - **NEW!** List all MCP tools with detailed schemas
- `npm run compose:up` - Start all services in background
- `npm run compose:down` - Stop all services
- `npm run compose:logs` - View logs from all services

## Key Features Demonstrated

### Enhanced Tool Handling

The examples now showcase:

1. **Separate MCP and Regular Tool Handlers**:

   - `onMCPTool` - Handles tools from MCP servers
   - `onTool` - Handles client-provided tools
   - Enhanced logging with tool IDs and formatted arguments

2. **Comprehensive Stream Callbacks**:

   - `onOpen` - Connection established
   - `onContent` - Streaming content
   - `onMCPTool` - MCP tool calls with detailed logging
   - `onUsageMetrics` - Token usage tracking
   - `onFinish` - Stream completion

3. **Enhanced Error Handling**:

   - Graceful handling of malformed JSON in tool arguments
   - Multiple fallback field names for URL parsing (`url`, `target_url`, `webpage_url`)
   - Detailed logging of parse errors and missing parameters

4. **Tool Argument Debugging**:
   - Raw argument display for troubleshooting
   - Structured argument parsing with error recovery
   - Issue identification for incomplete tool schemas

### Known Issues and Workarounds

The examples demonstrate both working features and current limitations:

**✅ Working:**

- File system operations (read_file, write_file, list_directory, etc.)
- Complete argument passing with path, content, and mcpServer parameters
- Robust error handling and logging

**❌ Current Issues:**

- Web tools (fetch_url, search_web) receive incomplete arguments
- Missing URL parameters due to incomplete schema exposure
- LLM receives partial tool definitions from inference gateway

**🔧 Demonstrated Solutions:**

- Enhanced argument parsing with multiple field fallbacks
- Graceful error handling when tools fail
- Comprehensive logging to identify root causes
- Tool schema inspection utilities

See `MCP_IMPROVEMENT_SUMMARY.md` for detailed analysis and findings.

- `onError` - Error handling

3. **Better Tool Call Visualization**:
   - Tool call counting
   - Formatted argument display
   - Tool execution tracking
   - Performance metrics

## 🆕 Next.js App Creator Example

The `nextjs-example.ts` demonstrates a powerful real-world use case:

### What it does:

1. **Fetches Official Documentation** - Uses MCP web tools to get the latest Next.js docs
2. **Creates Complete App Structure** - Builds a production-ready Next.js application
3. **Follows Best Practices** - Uses the fetched documentation to ensure current patterns
4. **TypeScript Setup** - Includes proper TypeScript configuration
5. **Modern Features** - Implements App Router, Server Components, and latest Next.js features

### Features Demonstrated:

- **Documentation-Driven Development** - AI reads official docs before coding
- **Complex File Operations** - Creates entire application structures
- **Web Content + File Operations** - Combines multiple MCP tool types
- **Production-Ready Output** - Generates runnable Next.js applications

### Run the Example:

```bash
npm run nextjs
```

The AI will:

- Fetch Next.js documentation from https://nextjs.org/docs
- Create a complete application in `/tmp/nextjs-app/`
- Include package.json, configs, pages, components, and README
- Follow the latest Next.js best practices and conventions

## Example Prompts to Try

Once the example is running, you can ask the AI:

1. **File Operations Chain:**

   ```
   "Create a JSON config file at /tmp/config.json with sample data, read it back, and list the directory"
   ```

2. **Multi-step Analysis:**

   ```
   "Read the sales data from /shared/sample_sales_data.csv, analyze trends, and create a summary report"
   ```

3. **Web Research:**

   ```
   "Fetch content from https://httpbin.org/json and tell me what information it contains"
   ```

4. **Documentation-Based Development:**

   ```
   "Create a React component library by first fetching React documentation, then building reusable components"
   ```

5. **Complex File Tasks:**
   ```
   "Create a todo list with 5 tasks, save it to /tmp/todo.txt, then read it back and add 2 more tasks"
   ```

## Example Output

The example will demonstrate:

```
=== MCP Tools Example ===

🔍 Checking gateway health...
Gateway health: ✅ Healthy

📋 Listing available MCP tools...
Found 9 MCP tools:

1. read_file
   Description: Read content from a file
   Server: http://mcp-filesystem:3000/mcp
   Schema: {
     "type": "object",
     "properties": {
       "file_path": {
         "type": "string",
         "description": "Path to the file to read"
       }
     },
     "required": ["file_path"]
   }

2. write_file
   Description: Write content to a file
   Server: http://mcp-filesystem:3000/mcp
   Schema: {
     "type": "object",
     "properties": {
       "file_path": {
         "type": "string",
         "description": "Path to the file to write"
       },
       "content": {
         "type": "string",
         "description": "Content to write to the file"
       }
     },
     "required": ["file_path", "content"]
   }

3. fetch_url
   Description: Fetch content from a URL
   Server: http://mcp-web-search:3001/mcp
   Schema: {
     "type": "object",
     "properties": {
       "url": {
         "type": "string",
         "description": "The URL to fetch content from"
       },
       "timeout": {
         "type": "number",
         "description": "Request timeout in milliseconds"
       }
     },
     "required": ["url"]
   }

4. search_web
   Description: Search the web and return results
   Server: http://mcp-web-search:3001/mcp
   Schema: {
     "type": "object",
     "properties": {
       "query": {
         "type": "string",
         "description": "Search query"
       },
       "limit": {
         "type": "number",
         "description": "Number of results to return"
       }
     },
     "required": ["query"]
   }

=== Example 1: File Operations with MCP ===

🚀 Starting file reading example...
I'll help you read the contents of /tmp/example.txt file.

🔧 Tool called: read_file
📝 Arguments: {"file_path": "/tmp/example.txt"}

The file contains:
Hello from MCP filesystem server!
This is a sample file for testing MCP file operations.
Created at: Mon May 27 10:30:00 UTC 2025

✅ File reading example completed
```

## MCP Servers Included

### Filesystem Server

- **Purpose**: File system operations (read, write, list directories)
- **Port**: 3000
- **Tools**: `read_file`, `write_file`, `list_directory`
- **Allowed Directories**: `/shared`, `/tmp`

### Web Search Server

- **Purpose**: Web content fetching and search simulation
- **Port**: 3001
- **Tools**: `fetch_url`, `search_web`
- **Features**: HTTP requests, basic content extraction

### Context7 Server

- **Purpose**: Library documentation and context resolution
- **Port**: 3002
- **Tools**: `resolve_library_id`, `get_library_docs`, `search_libraries`
- **Features**: Library search, documentation retrieval, version management

## Supported Providers

All Inference Gateway providers work with MCP tools:

- `openai` - GPT models with excellent tool calling
- `groq` - Fast inference with Llama and Mixtral models
- `anthropic` - Claude models with strong reasoning
- `ollama` - Local models (use `--profile with-ollama`)
- `cohere` - Command models
- `deepseek` - DeepSeek models
- `cloudflare` - Workers AI models

## Using with Local Models (Ollama)

To include Ollama for local model inference:

```bash
docker-compose --profile with-ollama up -d
```

Then pull a model:

```bash
docker exec -it mcp_ollama_1 ollama pull llama3.2
```

Set environment variables:

```bash
export PROVIDER=ollama
export LLM=llama3.2
```

## Troubleshooting

### MCP Tools Not Available

If you see "No MCP tools available":

1. Check if MCP servers are running:

   ```bash
   docker-compose ps
   ```

2. Verify MCP server logs:

   ```bash
   npm run compose:logs
   ```

3. Ensure the Inference Gateway can reach MCP servers:
   ```bash
   curl -X POST http://localhost:8080/mcp/tools/list -H "Content-Type: application/json" -d '{}'
   ```

### Gateway Health Check Fails

If the gateway appears unhealthy:

1. Check gateway logs:

   ```bash
   docker-compose logs inference-gateway
   ```

2. Verify API keys are set in `.env` file
3. Test direct connection:
   ```bash
   curl http://localhost:8080/health
   ```

### Tool Calls Not Working

If tool calls fail during conversations:

1. Verify the model supports tool calling (GPT-4, Claude, etc.)
2. Check MCP server connectivity through the gateway:

   ```bash
   curl -X POST http://localhost:8080/mcp/tools/list \
     -H "Content-Type: application/json" \
     -d '{}'
   ```

3. Enable debug logging by adding to docker-compose.yml:
   ```yaml
   environment:
     - LOG_LEVEL=debug
   ```

## Custom MCP Servers

To add your own MCP server:

1. Add service to `docker-compose.yml`:

   ```yaml
   my-custom-mcp:
     image: my-mcp-server:latest
     ports:
       - '3002:3002'
     networks:
       - inference-network
   ```

2. Update Inference Gateway environment:

   ```yaml
   MCP_SERVERS: 'http://mcp-filesystem:3000/mcp,http://mcp-web-search:3001/mcp,http://my-custom-mcp:3002/mcp'
   ```

3. Restart services:
   ```bash
   npm run compose:down
   npm run compose:up
   ```

## Notes

- MCP tools are called automatically by AI models when relevant to the conversation
- Tool schemas are defined by the MCP servers and exposed through the `/mcp/tools` endpoint
- Each MCP server can provide multiple tools with different capabilities
- The Inference Gateway acts as a bridge between AI models and MCP tools
- Tool execution is streamed in real-time during conversations
- File operations are sandboxed to allowed directories for security

## Resources

- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [Inference Gateway Documentation](https://github.com/inference-gateway/inference-gateway)
- [Official MCP Servers](https://github.com/modelcontextprotocol/servers)

## HTTP Examples

This section provides practical HTTP examples for interacting with MCP tools through the Inference Gateway. These examples are useful for testing, debugging, or integrating with other systems. **Note: Always interact with MCP tools through the Inference Gateway, not directly with MCP servers.**

### Prerequisites for HTTP Examples

Make sure the MCP infrastructure is running with MCP tools exposed:

```bash
npm run compose:up
```

**Important:** Ensure the Inference Gateway is started with `EXPOSE_MCP=true` environment variable to enable MCP endpoints.

### 1. Health Checks

#### Check Inference Gateway Health

```bash
curl -X GET http://localhost:8080/health
```

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2025-05-28T10:30:00Z",
  "version": "1.0.0"
}
```

### 2. MCP Tool Discovery

#### List All Available MCP Tools via Inference Gateway

```bash
curl -X GET http://localhost:8080/v1/mcp/tools
```

**Response:**

```json
{
  "tools": [
    {
      "name": "read_file",
      "description": "Read content from a file",
      "input_schema": {
        "type": "object",
        "properties": {
          "file_path": {
            "type": "string",
            "description": "Path to the file to read"
          }
        },
        "required": ["file_path"]
      }
    },
    {
      "name": "write_file",
      "description": "Write content to a file",
      "input_schema": {
        "type": "object",
        "properties": {
          "file_path": {
            "type": "string",
            "description": "Path to the file to write"
          },
          "content": {
            "type": "string",
            "description": "Content to write to the file"
          }
        },
        "required": ["file_path", "content"]
      }
    },
    {
      "name": "fetch_url",
      "description": "Fetch content from a URL",
      "input_schema": {
        "type": "object",
        "properties": {
          "url": {
            "type": "string",
            "description": "The URL to fetch content from"
          },
          "timeout": {
            "type": "number",
            "description": "Request timeout in milliseconds"
          }
        },
        "required": ["url"]
      }
    }
  ]
}
```

### 3. Using MCP Tools in Chat Completions

MCP tools are executed automatically by AI models during chat completions. You don't call them directly - instead, you include them in the `tools` array of a chat completion request.

#### Basic Chat Completion with MCP Tools

```bash
curl -X POST http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "groq/llama-3.3-70b-versatile",
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful assistant that can read files using available tools."
      },
      {
        "role": "user",
        "content": "Can you read the contents of /tmp/example.txt?"
      }
    ]
  }'
```

#### Web Scraping with MCP Tools

```bash
curl -X POST http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-4o",
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful assistant that can fetch web content."
      },
      {
        "role": "user",
        "content": "Can you fetch the content from https://httpbin.org/json?"
      }
    ]
  }'
```

### 4. Streaming Chat Completions with MCP Tools

```bash
curl -X POST http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-3-haiku-20240307",
    "messages": [
      {
        "role": "user",
        "content": "Help me analyze the file /shared/data.csv by reading it first"
      }
    ],
    "stream": true
  }'
```

### 5. Multi-Tool Conversations

```bash
curl -X POST http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "groq/mixtral-8x7b-32768",
    "messages": [
      {
        "role": "system",
        "content": "You are a research assistant with access to file operations and web content fetching."
      },
      {
        "role": "user",
        "content": "Research information about AI from https://openai.com and save a summary to /tmp/ai-research.txt"
      }
    ]
  }'
```
