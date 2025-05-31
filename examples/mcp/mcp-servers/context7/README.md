# Context7 MCP Server

A Model Context Protocol (MCP) server that provides library documentation and context resolution capabilities, similar to the Context7 service. This server demonstrates how to build tools for fetching up-to-date documentation and resolving library IDs.

## Features

### 🔍 Library Resolution

- **Tool**: `resolve_library_id`
- Searches for libraries by name and returns Context7-compatible library IDs
- Provides trust scores, code snippet counts, and version information
- Intelligent matching and ranking by relevance

### 📚 Documentation Retrieval

- **Tool**: `get_library_docs`
- Fetches detailed documentation for specific libraries
- Supports topic-focused documentation
- Token-limited responses for optimal performance
- Rich content with code examples and best practices

### 🔎 Library Search

- **Tool**: `search_libraries`
- Search through available libraries with query strings
- Category-based filtering capabilities
- Ranked results by trust score and documentation quality

## Available Libraries (Mock Data)

The server includes mock data for popular libraries:

- **Next.js** (`/vercel/next.js`) - The React Framework for Production
- **React** (`/facebook/react`) - A JavaScript library for building user interfaces
- **Node.js** (`/nodejs/node`) - Node.js JavaScript runtime
- **TypeScript** (`/microsoft/typescript`) - TypeScript superset of JavaScript
- **Express** (`/expressjs/express`) - Fast, minimalist web framework for Node.js

## Installation

```bash
cd context7
npm install
```

## Usage

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server will start on port 3002 by default.

## API Endpoints

- `GET /` - Server information and available tools
- `GET /health` - Health check endpoint
- `POST /sessions` - Create a new MCP session
- `POST /message` - Send MCP messages (requires X-Session-ID header)
- `DELETE /sessions/:sessionId` - Close a session

## Example Tool Usage

### Resolve a Library ID

```javascript
// Tool call
{
  "tool": "resolve_library_id",
  "arguments": {
    "libraryName": "next.js"
  }
}

// Response
{
  "content": [
    {
      "type": "text",
      "text": "Selected Library:\n- Library ID: /vercel/next.js\n- Name: Next.js\n- Description: The React Framework for Production\n- Code Snippets: 1250\n- Trust Score: 9\n- Versions: 14.2.0, 14.1.0, 14.0.0"
    }
  ]
}
```

### Get Documentation

```javascript
// Tool call
{
  "tool": "get_library_docs",
  "arguments": {
    "context7CompatibleLibraryID": "/vercel/next.js",
    "topic": "app router",
    "tokens": 5000
  }
}

// Response includes comprehensive documentation with code examples
```

### Search Libraries

```javascript
// Tool call
{
  "tool": "search_libraries",
  "arguments": {
    "query": "react",
    "category": "frontend"
  }
}

// Response lists matching libraries with details
```

## Configuration

Environment variables:

- `PORT` - Server port (default: 3002)

## Integration with Inference Gateway

This server integrates with the Inference Gateway through the MCP protocol. Add it to your `docker-compose.yml`:

```yaml
context7-server:
  build: ./mcp-servers/context7
  ports:
    - '3002:3002'
  environment:
    - PORT=3002
```

## Development

The server uses the official MCP TypeScript SDK and implements:

- Proper MCP protocol with Streamable HTTP transport
- Zod schema validation for tool parameters
- Express.js HTTP server for transport
- Session management for multiple concurrent connections
- Graceful error handling and shutdown

## Architecture

```
Client Request → Express Server → MCP Server → Tool Execution → Response
                      ↓
              Session Management
                      ↓
              StreamableHTTPTransport
```

## Extension Points

To extend this server:

1. **Add Real Data Sources**: Replace mock data with actual library APIs
2. **Enhanced Search**: Implement more sophisticated search algorithms
3. **Caching**: Add caching layer for frequently accessed documentation
4. **Authentication**: Add API key validation for production use
5. **Rate Limiting**: Implement rate limiting for API calls

## Testing

Test the server using the MCP Inspector:

```bash
npx -y @modelcontextprotocol/inspector npx tsx index.js
```

Or make direct HTTP requests to test the REST API.
