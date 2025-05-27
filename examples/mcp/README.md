# MCP Example

This example demonstrates how to use the Inference Gateway SDK with Model Context Protocol (MCP) tools in a multi-provider architecture. It showcases how to connect to MCP servers, discover available tools, and use them in AI conversations.

Please ensure you have no containers running before starting this example, as it uses Docker Compose to set up the necessary infrastructure.

## Features Demonstrated

1. **MCP Tool Discovery** - List and explore available MCP tools
2. **File Operations** - Use filesystem MCP server for file operations
3. **Web Scraping** - Fetch content from URLs using MCP tools
4. **Multi-Tool Conversations** - Combine multiple MCP tools in single conversations
5. **Tool Function Calling** - Stream responses with real-time tool execution

## Architecture

This example uses Docker Compose to orchestrate:

- **Inference Gateway** - Main API gateway with MCP support enabled
- **MCP Filesystem Server** - Provides file system operations
- **MCP Web Search Server** - Simulated web search and URL fetching
- **Optional Ollama** - Local model inference (when using `--profile with-ollama`)

## Getting Started

### Prerequisites

- Docker and Docker Compose installed
- API key for at least one provider (OpenAI, Groq, Anthropic, etc.)

### 1. Environment Setup

Copy the parent `.env.example` to `.env` and configure your API keys:

```bash
cp ../.env.example ../.env
```

Edit `../.env` and add your API keys:

```bash
GROQ_API_KEY=your_groq_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 2. Start the MCP Infrastructure

Start all services using Docker Compose:

```bash
npm run compose:up
```

This will start:

- Inference Gateway on port 8080
- MCP Filesystem server on port 3000
- MCP Web Search server on port 3001

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Provider and Model

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

### 5. Run the Example

```bash
npm start
```

## Available Commands

- `npm start` - Run the MCP example
- `npm run compose:up` - Start all services in background
- `npm run compose:down` - Stop all services
- `npm run compose:logs` - View logs from all services

## Example Output

The example will demonstrate:

```
=== MCP Tools Example ===

🔍 Checking gateway health...
Gateway health: ✅ Healthy

📋 Listing available MCP tools...
Found 4 MCP tools:

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
   ...

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
   docker exec inference-gateway-mcp curl -f http://mcp-filesystem:3000/mcp
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
2. Check MCP server responses:

   ```bash
   curl -X POST http://localhost:3000/mcp/tools/list
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
   MCP_SERVERS: 'filesystem=http://mcp-filesystem:3000/mcp,web-search=http://mcp-web-search:3001/mcp,custom=http://my-custom-mcp:3002/mcp'
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
