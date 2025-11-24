# Context7 HTTP Bridge

This service provides an HTTP interface for the stdio-based Context7 MCP server
from Upstash, allowing it to work with the Inference Gateway.

## Architecture

```text
Inference Gateway → HTTP Bridge → stdio → Real Context7 MCP Server
```

## Features

- ✅ HTTP-to-stdio protocol bridge
- ✅ Real Context7 integration with Upstash
- ✅ Automatic Context7 server spawning
- ✅ Proper error handling and timeouts
- ✅ Health check endpoint

## Environment Variables

- `PORT` - Server port (default: 3002)

## Available Tools

1. **c41_resolve-library-id** - Resolve library names to Context7 IDs
2. **c41_get-library-docs** - Fetch up-to-date library documentation

## Usage

The bridge automatically spawns the real Context7 MCP server for each tool call
and handles the stdio communication protocol.
