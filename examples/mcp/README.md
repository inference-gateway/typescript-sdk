# MCP Example

This example demonstrates how to use the Inference Gateway SDK with Model Context Protocol (MCP) tools in a multi-provider architecture. It showcases how to connect to MCP servers, discover available tools, and use them in AI conversations.

Please ensure you have no containers running before starting this example, as it uses Docker Compose to set up the necessary infrastructure.

## Features Demonstrated

1. **MCP Tool Discovery** - List and explore available MCP tools
2. **File Operations** - Use filesystem MCP server for file operations
3. **Web Scraping** - Fetch content from URLs using MCP tools
4. **Multi-Tool Conversations** - Combine multiple MCP tools in single conversations
5. **Tool Function Calling** - Stream responses with real-time tool execution
6. **Data Analysis** - Analyze sample data files with AI assistance

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

## Getting Started

### Prerequisites

- Docker and Docker Compose installed
- API key for at least one provider (OpenAI, Groq, Anthropic, etc.)

Make sure the environment is configured:

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

- `index.ts` - Complete MCP example with multiple scenarios
- `filesystem-demo.ts` - Focused demonstration of filesystem operations
- `test-mcp-tools.ts` - Simple verification that MCP tools are working
- `advanced-example.ts` - More complex MCP usage patterns

## Available Commands

- `npm start` - Run the main MCP example
- `npm run compose:up` - Start all services in background
- `npm run compose:down` - Stop all services
- `npm run compose:logs` - View logs from all services

## Example Prompts to Try

Once the example is running, you can ask the AI:

1. **List available data:**

   ```
   "Can you show me what files are available in the /shared directory?"
   ```

2. **Analyze sample data:**

   ```
   "Read the sales data from /shared/sample_sales_data.csv and give me a summary of the top-selling products"
   ```

3. **Create reports:**

   ```
   "Based on the sales data, create a summary report and save it to /tmp/sales_report.txt"
   ```

4. **File operations:**
   ```
   "Create a todo list with 5 tasks and save it to /tmp/todo.txt, then read it back to me"
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
