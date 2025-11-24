# MCP Examples

This directory contains comprehensive examples demonstrating how to use the
Inference Gateway SDK with Model Context Protocol (MCP) tools in a
multi-provider architecture. Each example showcases different aspects of MCP
tool integration.

## 🚀 Quick Start

### Spin up the Inference Gateway and the MCP Server

```bash
docker compose -f docker-compose.yml up --build
```

### Run Specific Examples

On another terminal, you can run specific examples using the Inference Gateway:

```bash
# Run interactive specialized agents
# Next.js development agent
docker compose -f docker-compose-agents.yml run --rm -it --build nextjs-agent
# Vite application agent
docker compose -f docker-compose-agents.yml run --rm -it --build vite-agent
# Kubernetes operations agent
docker compose -f docker-compose-agents.yml run --rm -it --build kubernetes-agent
# Marketing research agent
docker compose -f docker-compose-agents.yml run --rm -it --build marketing-agent
```

## 🧠 Memory & Error Recovery

The **Memory MCP Server** provides persistent state management for AI agents,
enabling them to recover gracefully from HTTP errors and continue from where
they left off. This is particularly useful for long-running tasks that may
encounter temporary network issues or API failures.

### Key Features

- **State Persistence**: Save arbitrary state objects with session IDs
- **Error State Recovery**: Special handling for HTTP error scenarios
- **Session Management**: List, restore, and clear saved sessions
- **File-based Storage**: Persistent storage using JSON files

### Memory Tools Integration

All agents (Next.js, Vite, and Kubernetes) now include memory recovery capabilities:

1. **Save State Before Risky Operations**: Before making HTTP requests, agents
   save their current progress
1. **Handle Errors Gracefully**: When HTTP errors occur, agents save the error
   state with context
1. **Resume from Last Checkpoint**: On restart, agents check for saved state
   and continue from the last successful step
1. **Memory Management**: Agents can list, restore, and clear saved sessions

### Available Memory Tools

- `save-state`: Save current progress/state with a session ID
- `save-error-state`: Save state when HTTP errors occur for recovery
- `restore-state`: Restore previously saved state by session ID
- `list-sessions`: List all saved sessions
- `clear-session`: Remove a saved session

All agents will automatically use these tools when encountering HTTP errors,
ensuring robust error recovery and task continuation.

## 🔍 MCP Inspector

The **MCP Inspector** is a visual debugging tool that allows you to inspect
and test your MCP servers interactively. It provides a web-based interface to:

- Connect to and inspect MCP servers
- View available tools and their schemas
- Test tool execution with custom parameters
- Debug server responses and error messages
- Monitor real-time server communication

### Accessing the Inspector

The MCP Inspector is available at: **<http://localhost:6274>**

You can connect to any of the running MCP servers:

- **Filesystem Server**: `http://mcp-filesystem:3000/mcp`
- **Web Search Server**: `http://mcp-web-search:3001/mcp`
- **Context7 Server**: `http://mcp-context7:3002/mcp`
- **NPM Server**: `http://mcp-npm:3003/mcp`
- **Memory Server**: `http://mcp-memory:3004/mcp`

### Quick Inspector URLs

For convenience, you can use these pre-configured URLs:

```bash
# Connect to Filesystem server
http://localhost:6274/?transport=streamable-http&serverUrl=http://mcp-filesystem:3000/mcp

# Connect to Web Search server
http://localhost:6274/?transport=streamable-http&serverUrl=http://mcp-web-search:3001/mcp

# Connect to NPM server
http://localhost:6274/?transport=streamable-http&serverUrl=http://mcp-npm:3003/mcp
```

### Using the Inspector

1. **Start the services**: `docker compose up --build`
1. **Open the inspector**: Navigate to <http://localhost:6274>
1. **Connect to a server**: Enter an MCP server URL
   (e.g., `http://mcp-filesystem:3000/mcp`)
1. **Explore tools**: Browse available tools and their parameters
1. **Test execution**: Run tools with custom parameters and view results

### Troubleshooting

If you have to debug an MCP server, you can either use the MCP Inspector or
standard curl commands.

1. First go inside the a container that is attached to the same inference
   gateway network:

```bash
docker run -it --rm alpine:latest sh -c "apk add --no-cache curl && sh"
```

1. For example let's check if mcp-web-search works as expected. We will get
   into the container:

```sh
docker compose exec mcp-web-search sh

export SERVER_URL="http://127.0.0.1"
export SERVER_PORT=""
export TOOL_NAME=""
```

1. Fetch a session ID by initializing the MCP server:

```sh
SESSION_ID=$(curl -v -X POST "${SERVER_URL}:${SERVER_PORT}/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {
        "name": "test-client",
        "version": "1.0.0"
      }
    }
  }' 2>&1 | grep -i "< mcp-session-id:" | cut -d' ' -f3 | tr -d '\r')
echo "mcp-session-id: $SESSION_ID"
```

1. List available tools to verify the server is running correctly:

```sh
curl -v -X POST "${SERVER_URL}:${SERVER_PORT}/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list",
    "params": {}
  }'
```

1. Call a specific tool, for example, `search_web` to search the web:

```sh
curl -X POST "${SERVER_URL}:${SERVER_PORT}/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "'"$TOOL_NAME"'",
      "arguments": {
        "sessionId": "'"$SESSION_ID"'",
        "state": {
          "query": "What is the capital of France?"
        }
      }
    }
  }'
```
