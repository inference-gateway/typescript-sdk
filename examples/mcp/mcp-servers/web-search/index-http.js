/**
 * HTTP-based Web Search Server using MCP SDK
 *
 * This server uses the official MCP TypeScript SDK with StreamableHTTPServerTransport
 * in stateless mode, which responds with plain HTTP JSON-RPC instead of SSE.
 * This is compatible with Go MCP clients that expect standard HTTP responses.
 */

import express from 'express';
import axios from 'axios';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';

const app = express();
app.use(express.json());

/**
 * Generate simulated search results
 */
function generateSearchResults(query, limit) {
  const results = [];
  const domains = [
    'example.com',
    'wikipedia.org',
    'github.com',
    'stackoverflow.com',
    'medium.com',
  ];

  for (let i = 0; i < Math.min(limit, 10); i++) {
    const domain = domains[i % domains.length];
    const title = `${query} - Result ${i + 1}`;
    const url = `https://${domain}/${query
      .toLowerCase()
      .replace(/\s+/g, '-')}-${i + 1}`;
    const description = `This is a simulated search result for "${query}". It would normally contain relevant information about your search query.`;

    results.push(`${i + 1}. ${title}\n   ${url}\n   ${description}\n`);
  }

  return results.join('\n');
}

/**
 * Create and configure the MCP server
 */
function createServer() {
  const server = new McpServer(
    {
      name: 'web-search-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Add fetch_url tool
  server.tool(
    'fetch_url',
    {
      description: 'Fetch content from a URL',
      inputSchema: {
        type: 'object',
        properties: {
          url: z.string().url(),
          timeout: z.number().min(1000).max(30000).optional().default(10000),
        },
        required: ['url'],
      },
    },
    async ({ url, timeout = 10000 }) => {
      try {
        console.info(`Fetching URL: ${url}`);
        const response = await axios.get(url, {
          timeout,
          headers: {
            'User-Agent': 'HTTP-Web-Search-Server/1.0.0',
          },
          maxRedirects: 5,
          validateStatus: (status) => status < 500,
        });

        const contentType = response.headers['content-type'] || '';
        let content;
        if (contentType.includes('application/json')) {
          content = JSON.stringify(response.data, null, 2);
        } else if (contentType.includes('text/')) {
          content = response.data.toString();
        } else {
          content = `Binary content (${contentType}), size: ${
            JSON.stringify(response.data).length
          } bytes`;
        }

        // Truncate very large responses
        if (content.length > 10000) {
          content = content.substring(0, 10000) + '\n\n... (content truncated)';
        }

        return {
          content: [
            {
              type: 'text',
              text: `URL: ${url}\nStatus: ${response.status} ${response.statusText}\nContent-Type: ${contentType}\n\nContent:\n${content}`,
            },
          ],
        };
      } catch (error) {
        console.error(`Failed to fetch URL ${url}:`, error.message);
        let errorMessage = `Failed to fetch URL: ${url}\n`;
        if (error.code === 'ENOTFOUND') {
          errorMessage += 'Domain not found';
        } else if (error.code === 'ECONNREFUSED') {
          errorMessage += 'Connection refused';
        } else if (error.code === 'ETIMEDOUT') {
          errorMessage += 'Request timed out';
        } else if (error.response) {
          errorMessage += `HTTP ${error.response.status}: ${error.response.statusText}`;
        } else {
          errorMessage += error.message;
        }

        return {
          content: [
            {
              type: 'text',
              text: errorMessage,
            },
          ],
        };
      }
    }
  );

  // Add search_web tool
  server.tool(
    'search_web',
    {
      description: 'Perform a web search',
      inputSchema: {
        type: 'object',
        properties: {
          query: z.string().min(1).max(500),
          limit: z.number().min(1).max(20).optional().default(5),
        },
        required: ['query'],
      },
    },
    async ({ query, limit = 5 }) => {
      console.info(`Searching for: "${query}" (limit: ${limit})`);
      const searchResults = generateSearchResults(query, limit);

      return {
        content: [
          {
            type: 'text',
            text: `Search Results for "${query}":\n\n${searchResults}`,
          },
        ],
      };
    }
  );

  // Add get_page_title tool
  server.tool(
    'get_page_title',
    {
      description: 'Extract title from a web page',
      inputSchema: {
        type: 'object',
        properties: {
          url: z.string().url(),
        },
        required: ['url'],
      },
    },
    async ({ url }) => {
      try {
        console.info(`Extracting title from: ${url}`);
        const response = await axios.get(url, {
          timeout: 10000,
          headers: {
            'User-Agent': 'HTTP-Web-Search-Server/1.0.0',
          },
        });

        const titleMatch = response.data.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : 'No title found';

        return {
          content: [
            {
              type: 'text',
              text: `Title: ${title}\nURL: ${url}`,
            },
          ],
        };
      } catch (error) {
        console.error(`Failed to extract title from ${url}:`, error.message);

        return {
          content: [
            {
              type: 'text',
              text: `Failed to extract title from: ${url}\nError: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  return server;
}

/**
 * Handle MCP requests using stateless mode
 */
app.post('/mcp', async (req, res) => {
  try {
    console.info('HTTP JSON-RPC request received:');
    console.info('  Body: %s', JSON.stringify(req.body, null, 2));

    // Create new server and transport instances for each request (stateless mode)
    const server = createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // Stateless mode
    });

    // Clean up on request close
    res.on('close', () => {
      console.info('Request closed');
      transport.close();
      server.close();
    });

    // Connect server to transport
    await server.connect(transport);

    // Handle the request
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('Error handling MCP request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
          data: error.message,
        },
        id: req.body?.id || null,
      });
    }
  }
});

// Handle unsupported methods for stateless mode
app.get('/mcp', async (req, res) => {
  console.info('Received GET MCP request');
  res.status(405).json({
    jsonrpc: '2.0',
    error: {
      code: -32000,
      message: 'Method not allowed in stateless mode.',
    },
    id: null,
  });
});

app.delete('/mcp', async (req, res) => {
  console.info('Received DELETE MCP request');
  res.status(405).json({
    jsonrpc: '2.0',
    error: {
      code: -32000,
      message: 'Method not allowed in stateless mode.',
    },
    id: null,
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'http-web-search',
    version: '1.0.0',
    protocol: 'HTTP JSON-RPC',
  };

  console.info('Health check requested: %j', healthStatus);
  res.json(healthStatus);
});

// Start the server
const port = process.env.PORT || 3001;
const host = process.env.HOST || '0.0.0.0';

app.listen(port, host, () => {
  console.info(`HTTP Web Search server running on http://${host}:${port}`);
  console.info('Protocol: HTTP JSON-RPC 2.0');
  console.info('Available endpoints:');
  console.info('  POST /mcp             - JSON-RPC endpoint');
  console.info('  GET  /health          - Health check');
  console.info('Available methods:');
  console.info('  - initialize          - Initialize the server');
  console.info('  - tools/list          - List available tools');
  console.info('  - tools/call          - Call a tool');
  console.info('Available tools:');
  console.info('  - fetch_url           - Fetch content from a URL');
  console.info('  - search_web          - Perform web search (simulated)');
  console.info('  - get_page_title      - Extract title from a web page');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.info('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.info('Received SIGINT, shutting down gracefully');
  process.exit(0);
});
