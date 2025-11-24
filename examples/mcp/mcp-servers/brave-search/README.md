# Brave Search MCP Server

A Model Context Protocol (MCP) server that provides search capabilities using
the Brave Search API with HTTP transport support.

## Features

- **Web Search**: Comprehensive web search with SafeSearch filtering
- **News Search**: Recent news articles with content summaries
- **Marketing Research**: Product and brand research with market insights
- **HTTP Transport**: StreamableHTTP transport for web-based integrations
- **Rate Limiting**: Built-in rate limiting with exponential backoff
- **Session Management**: Proper session handling for MCP connections

## Prerequisites

- Node.js 18 or higher
- Brave Search API key from [Brave Search API](https://api.search.brave.com/)

## Installation

1. Install dependencies:

   ```bash
   npm install
   ```

1. Set up environment variables:

```bash
export BRAVE_API_KEY="your-brave-search-api-key"
export PORT=3000  # Optional, defaults to 3000
export LOG_LEVEL=info  # Optional, defaults to info
```

## Usage

### Start the Server

```bash
npm start
```

The server will start on `http://localhost:3000` with the MCP endpoint
available at `/mcp`.

### Health Check

Check if the server is running:

```bash
curl http://localhost:3000/health
```

### MCP Tools Available

1. **brave_web_search**

   - Searches the web using Brave Search
   - Parameters: `query` (string), `count` (number, optional), `safesearch`
     (string, optional)

2. **brave_news_search**

   - Searches for recent news articles
   - Parameters: `query` (string), `count` (number, optional), `freshness`
     (string, optional)

3. **marketing_research**
   - Performs market research and competitive analysis
   - Parameters: `query` (string), `focus_area` (string, optional)

## Configuration

### Environment Variables

- `BRAVE_API_KEY`: Your Brave Search API key (required)
- `PORT`: Server port (default: 3000)
- `LOG_LEVEL`: Logging level - debug, info, warn, error (default: info)

### Rate Limiting

The server implements rate limiting to respect Brave Search API limits:

- Maximum 10 requests per second
- Exponential backoff on rate limit errors
- Automatic retry with increasing delays

## Development

### Build

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

### Linting

```bash
npm run lint
```

## API Reference

### MCP Endpoint

#### POST /mcp

- Establishes MCP connection using StreamableHTTP transport
- Handles tool calls and resource requests
- Returns JSON responses with MCP protocol format

#### GET /mcp

- Returns server information and available tools
- Used for capability discovery

#### DELETE /mcp

- Closes MCP session
- Cleans up resources

### Example MCP Tool Call

```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "tools/call",
  "params": {
    "name": "brave_web_search",
    "arguments": {
      "query": "artificial intelligence trends 2024",
      "count": 5,
      "safesearch": "moderate"
    }
  }
}
```

## Error Handling

The server includes comprehensive error handling:

- API rate limiting with retry logic
- Input validation using Zod schemas
- Structured logging for debugging
- Graceful error responses

## Security

- Input validation on all parameters
- SafeSearch filtering for web searches
- Rate limiting to prevent abuse
- Structured logging without sensitive data exposure

## License

MIT License - see LICENSE file for details.
