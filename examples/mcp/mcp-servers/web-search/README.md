# MCP Web Search Server

A Model Context Protocol (MCP) server that provides web search and URL fetching
capabilities using DuckDuckGo.

## Features

- **fetch_url**: Fetch content from any URL with error handling and timeout support
- **search_web**: Real web search functionality using DuckDuckGo with safe
  search options
- **get_page_title**: Extract page titles from web pages using HTML parsing

## Installation

```bash
npm install
```

## Usage

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

The server will start on port 3001 by default. You can change this by setting
the `PORT` environment variable.

## API Endpoints

### Server Information

```text
GET /mcp
```

Returns server capabilities and metadata.

### List Tools

```text
POST /mcp/tools/list
```

Returns all available MCP tools.

### Execute Tools

```text
POST /mcp/tools/call
```

Execute a specific tool with provided arguments.

### Health Check

```text
GET /health
```

Returns server health status.

## Example Tool Usage

### Fetch URL

```json
{
  "name": "fetch_url",
  "arguments": {
    "url": "https://api.github.com/users/octocat",
    "timeout": 5000
  }
}
```

### Search Web

```json
{
  "name": "search_web",
  "arguments": {
    "query": "machine learning tutorials",
    "limit": 5,
    "safe_search": "moderate"
  }
}
```

#### Safe Search Options

- `strict`: Strict safe search filtering
- `moderate`: Moderate safe search filtering (default)
- `off`: No safe search filtering

### Get Page Title

```json
{
  "name": "get_page_title",
  "arguments": {
    "url": "https://github.com"
  }
}
```

## Environment Variables

- `PORT`: Server port (default: 3001)
- `HOST`: Server host (default: 0.0.0.0)
- `NODE_ENV`: Environment (development/production)

## Integration with Inference Gateway

This server is designed to work with the Inference Gateway's MCP support. Add
it to your gateway configuration:

```yaml
MCP_SERVERS: 'web-search=http://mcp-web-search:3001/mcp'
```

## Extending the Server

To add new tools:

1. Add the tool definition to the `/mcp/tools/list` endpoint
2. Add a handler function for the tool
3. Add the case to the switch statement in `/mcp/tools/call`

## Security Considerations

- This is a demonstration server and should not be used in production without
  proper security measures
- Add rate limiting, authentication, and input validation for production use
- Consider using environment variables for sensitive configuration
