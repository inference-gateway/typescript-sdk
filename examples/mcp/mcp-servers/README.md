# MCP Servers

This directory contains Model Context Protocol (MCP) servers that demonstrate how to build and integrate custom tools with the Inference Gateway.

## Available Servers

### 🌐 Web Search Server (`web-search/`)

- **Port**: 3001
- **Tools**: `fetch_url`, `search_web`, `get_page_title`
- **Purpose**: Provides web content fetching and search capabilities
- **Features**: HTTP requests, simulated search, HTML parsing

### 📁 Filesystem Server (`filesystem/`)

- **Port**: 3000
- **Tools**: `read_file`, `write_file`, `list_directory`, `create_directory`, `delete_file`, `file_info`
- **Purpose**: Safe filesystem operations within allowed directories
- **Features**: File I/O, directory management, security restrictions

### 📚 Context7 Server (`context7/`)

- **Port**: 3002
- **Tools**: `resolve_library_id`, `get_library_docs`, `search_libraries`
- **Purpose**: Library documentation and context resolution capabilities
- **Features**: Library search, documentation retrieval, version management

## Quick Start

### Individual Server Development

Each server can be run independently for development:

```bash
# Web Search Server
cd web-search
npm install
npm run dev

# Filesystem Server
cd filesystem
npm install
npm run dev

# Context7 Server
cd context7
npm install
npm run dev
```

### Docker Compose Integration

All servers are configured to work together with the Inference Gateway:

```bash
# From the main MCP example directory
docker-compose up -d
```

This will start:

- Inference Gateway (port 8080)
- MCP Filesystem Server (port 3000)
- MCP Web Search Server (port 3001)
- MCP Context7 Server (port 3002)
- Optional: Ollama (port 11434)

## Server Architecture

Each MCP server follows a consistent structure:

```
server-name/
├── package.json       # Dependencies and scripts
├── index.js          # Main server implementation
└── README.md         # Server-specific documentation
```

### Core Endpoints

All MCP servers implement these standard endpoints:

- `GET /mcp` - Server information and capabilities
- `POST /mcp/tools/list` - List available tools
- `POST /mcp/tools/call` - Execute tools
- `GET /health` - Health check

## Tool Development

### Adding New Tools

To add a new tool to an existing server:

1. **Define the tool** in the `/mcp/tools/list` endpoint:

```javascript
{
  name: 'my_new_tool',
  description: 'Description of what the tool does',
  inputSchema: {
    type: 'object',
    properties: {
      param1: {
        type: 'string',
        description: 'Parameter description'
      }
    },
    required: ['param1']
  }
}
```

2. **Implement the handler** function:

```javascript
async function handleMyNewTool(args, res) {
  const { param1 } = args;

  try {
    // Tool logic here
    const result = await doSomething(param1);

    res.json({
      content: [
        {
          type: 'text',
          text: `Result: ${result}`,
        },
      ],
    });
  } catch (error) {
    res.json({
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
    });
  }
}
```

3. **Add the case** to the tool execution switch:

```javascript
case 'my_new_tool':
  await handleMyNewTool(args, res);
  break;
```

### Creating New Servers

To create a new MCP server:

1. **Create directory structure**:

```bash
mkdir mcp-servers/my-server
cd mcp-servers/my-server
```

2. **Create package.json**:

```json
{
  "name": "mcp-my-server",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "node --watch index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
```

3. **Implement the server** following the existing patterns
4. **Add to docker-compose.yml** for integration
5. **Update Inference Gateway** MCP_SERVERS configuration

## Integration with Inference Gateway

The servers are configured to work with the Inference Gateway through environment variables:

```yaml
# In docker-compose.yml
environment:
  MCP_ENABLE: 'true'
  MCP_EXPOSE: 'true'
  MCP_SERVERS: 'filesystem=http://mcp-filesystem:3000/mcp,web-search=http://mcp-web-search:3001/mcp'
```

## Security Considerations

### Filesystem Server

- Restricts operations to allowed directories
- Validates all file paths
- Prevents directory traversal attacks
- Implements proper error handling

### Web Search Server

- Includes request timeouts
- Limits response sizes
- Handles various content types safely
- Provides safe error messages

### General Security

- All servers run with minimal privileges
- Docker containers are isolated
- Health checks monitor server status
- Graceful shutdown handling

## Testing

Each server includes health check endpoints and can be tested independently:

```bash
# Test server health
curl http://localhost:3000/health
curl http://localhost:3001/health

# Test MCP endpoints
curl http://localhost:3000/mcp
curl -X POST http://localhost:3000/mcp/tools/list
```

## Monitoring

Monitor server logs during development:

```bash
# Follow logs for all services
docker-compose logs -f

# Follow logs for specific service
docker-compose logs -f mcp-filesystem
docker-compose logs -f mcp-web-search
```

## Examples

See the main MCP example (`../index.ts`) for complete usage examples showing how to:

- Discover available MCP tools
- Execute filesystem operations
- Perform web searches and content fetching
- Handle tool responses and errors

## Contributing

When contributing new servers or tools:

1. Follow the established patterns and conventions
2. Include comprehensive error handling
3. Add proper validation for all inputs
4. Document all tools and parameters
5. Include health check endpoints
6. Test thoroughly with the Inference Gateway
7. Update this README with new server information
