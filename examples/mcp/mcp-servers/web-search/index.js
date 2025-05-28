/**
 * MCP Web Search Server
 *
 * This is a Model Context Protocol (MCP) server that provides web search
 * and URL fetching capabilities. It uses the official MCP TypeScript SDK
 * and implements the proper MCP protocol with Streamable HTTP transport.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import axios from 'axios';

// Express app for HTTP transport
const app = express();
app.use(express.json());

// Map to store transports by session ID
const transports = {};

/**
 * Create and configure the MCP server
 */
function createMcpServer() {
  const mcpServer = new McpServer({
    name: 'web-search',
    version: '1.0.0',
  });

  // Tool: Fetch URL content
  mcpServer.tool(
    'fetch_url',
    {
      url: z.string().url().describe('The URL to fetch content from'),
      timeout: z
        .number()
        .min(1000)
        .max(30000)
        .default(10000)
        .describe('Request timeout in milliseconds'),
    },
    async ({ url, timeout = 10000 }) => {
      try {
        console.log(`Fetching URL: ${url}`);

        const response = await axios.get(url, {
          timeout,
          headers: {
            'User-Agent': 'MCP-Web-Search-Server/1.0.0',
          },
          maxRedirects: 5,
          validateStatus: (status) => status < 500, // Accept 4xx but not 5xx
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

  // Tool: Web search (simulated)
  mcpServer.tool(
    'search_web',
    {
      query: z.string().min(1).max(500).describe('The search query to execute'),
      limit: z
        .number()
        .min(1)
        .max(20)
        .default(5)
        .describe('Maximum number of results to return'),
    },
    async ({ query, limit = 5 }) => {
      console.log(`Searching for: "${query}" (limit: ${limit})`);

      // Generate simulated search results
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

  // Tool: Get page title
  mcpServer.tool(
    'get_page_title',
    {
      url: z.string().url().describe('The URL to extract the title from'),
    },
    async ({ url }) => {
      try {
        console.log(`Extracting title from: ${url}`);

        const response = await axios.get(url, {
          timeout: 10000,
          headers: {
            'User-Agent': 'MCP-Web-Search-Server/1.0.0',
          },
        });

        // Simple title extraction using regex (cheerio would require additional dependency)
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

  return mcpServer;
}

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

// Handle POST requests for MCP communication
app.post('/mcp', async (req, res) => {
  try {
    console.log('MCP POST request received:');
    console.log('  Headers:', JSON.stringify(req.headers, null, 2));
    console.log('  Body:', JSON.stringify(req.body, null, 2));

    // Fix missing Accept headers for compatibility with Go MCP clients
    // The StreamableHTTPServerTransport requires both application/json and text/event-stream
    const accept = req.headers.accept || req.headers.Accept;
    if (
      !accept ||
      !accept.includes('application/json') ||
      !accept.includes('text/event-stream')
    ) {
      console.log('Adding missing Accept headers for MCP compatibility');
      req.headers.accept = 'application/json, text/event-stream';
    }

    // Check for existing session ID
    const sessionId = req.headers['mcp-session-id'];
    let transport;

    if (sessionId && transports[sessionId]) {
      // Reuse existing transport
      transport = transports[sessionId];
    } else {
      // Create new transport for new session
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (newSessionId) => {
          console.log(`MCP session initialized: ${newSessionId}`);
          // Store the transport by session ID
          transports[newSessionId] = transport;
        },
      });

      // Clean up transport when closed
      transport.onclose = () => {
        if (transport.sessionId) {
          console.log(`MCP session closed: ${transport.sessionId}`);
          delete transports[transport.sessionId];
        }
      };

      // Create and connect MCP server
      const server = createMcpServer();
      await server.connect(transport);
    }

    // Handle the MCP request
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('Error handling MCP request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      });
    }
  }
});

// Handle GET requests for SSE (server-to-client notifications)
app.get('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }

  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
});

// Handle DELETE requests for session termination
app.delete('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }

  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
});

// Health check endpoint
app.get('/health', (req, res) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'mcp-web-search',
    version: '1.0.0',
    protocol: 'Model Context Protocol',
    transport: 'Streamable HTTP',
  };

  console.log('Health check requested:', healthStatus);

  res.json(healthStatus);
});

// Start the server
const port = process.env.PORT || 3001;
const host = process.env.HOST || '0.0.0.0';

app.listen(port, host, () => {
  console.log(`MCP Web Search server running on http://${host}:${port}`);
  console.log('Protocol: Model Context Protocol (MCP)');
  console.log('Transport: Streamable HTTP');
  console.log('Available endpoints:');
  console.log('  POST /mcp             - MCP protocol endpoint');
  console.log(
    '  GET  /mcp             - SSE notifications (with session-id header)'
  );
  console.log(
    '  DELETE /mcp           - Session termination (with session-id header)'
  );
  console.log('  GET  /health          - Health check');
  console.log('Available tools:');
  console.log('  - fetch_url           - Fetch content from a URL');
  console.log('  - search_web          - Perform web search (simulated)');
  console.log('  - get_page_title      - Extract title from a web page');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  // Close all transports
  Object.values(transports).forEach((transport) => {
    if (transport.close) transport.close();
  });
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  // Close all transports
  Object.values(transports).forEach((transport) => {
    if (transport.close) transport.close();
  });
  process.exit(0);
});
