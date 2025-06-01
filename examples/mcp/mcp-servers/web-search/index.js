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
import * as cheerio from 'cheerio';
import { search, SafeSearchType } from 'duck-duck-scrape';
import { createMcpLogger } from './logger.js';

const logger = createMcpLogger('mcp-web-search', '1.0.0');

const app = express();
app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
  const startTime = Date.now();
  const requestId = randomUUID();

  req.requestId = requestId;

  logger.info('Incoming request', {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    sessionId: req.headers['mcp-session-id'],
  });

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('Request completed', {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      sessionId: req.headers['mcp-session-id'],
    });
  });

  next();
});

const transports = new Map();

/**
 * Enhanced error handling for tools
 */
function createToolError(error, context = {}) {
  logger.error('Tool execution error', {
    error: error.message,
    stack: error.stack,
    context,
  });

  return {
    content: [
      {
        type: 'text',
        text: `Error: ${error.message}`,
      },
    ],
    isError: true,
  };
}

/**
 * Create and configure the MCP server
 */
function createMcpServer() {
  logger.info('Creating MCP server instance');

  const mcpServer = new McpServer({
    name: 'web-search',
    version: '1.0.0',
  });

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
      extract_text: z
        .boolean()
        .default(true)
        .describe('Extract plain text from HTML content'),
    },
    async ({ url, timeout = 10000, extract_text = true }) => {
      const operationId = randomUUID();

      try {
        logger.info('Fetching URL', {
          operationId,
          url,
          timeout,
          extract_text,
        });

        const response = await axios.get(url, {
          timeout,
          headers: {
            'User-Agent': 'MCP-Web-Search-Server/1.0.0 (Compatible)',
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            Connection: 'keep-alive',
          },
          maxRedirects: 5,
          validateStatus: (status) => status < 500,
        });

        const contentType = response.headers['content-type'] || '';
        let content;

        logger.info('URL fetch successful', {
          operationId,
          url,
          statusCode: response.status,
          contentType,
          contentLength: response.data?.length || 0,
        });

        if (contentType.includes('application/json')) {
          content = JSON.stringify(response.data, null, 2);
        } else if (contentType.includes('text/html') && extract_text) {
          const rawContent = response.data.toString();

          try {
            const $ = cheerio.load(rawContent);

            $('script, style, nav, footer, aside').remove();

            const title = $('title').text().trim();

            const mainContent = $(
              'main, article, .content, #content, .main'
            ).first();
            const extractedText =
              mainContent.length > 0 ? mainContent.text() : $('body').text();

            const cleanText = extractedText
              .replace(/\s+/g, ' ')
              .replace(/\n\s*\n/g, '\n')
              .trim();

            content = `Title: ${title}\n\nContent:\n${cleanText}`;
          } catch (parseError) {
            logger.warn('Failed to parse HTML, returning raw content', {
              operationId,
              url,
              error: parseError.message,
            });
            content = rawContent;
          }
        } else if (contentType.includes('text/')) {
          content = response.data.toString();
        } else {
          content = `Binary content (${contentType}), size: ${
            JSON.stringify(response.data).length
          } bytes`;
        }

        const maxLength = 15000;
        if (content.length > maxLength) {
          content =
            content.substring(0, maxLength) +
            '\n\n... (content truncated due to length)';
          logger.info('Content truncated', {
            operationId,
            originalLength: content.length + (content.length - maxLength),
            truncatedLength: content.length,
          });
        }

        return {
          content: [
            {
              type: 'text',
              text: `URL: ${url}\nStatus: ${response.status} ${response.statusText}\nContent-Type: ${contentType}\nExtracted Text: ${extract_text}\n\n${content}`,
            },
          ],
        };
      } catch (error) {
        logger.error('Failed to fetch URL', {
          operationId,
          url,
          error: error.message,
          code: error.code,
          status: error.response?.status,
        });

        let errorMessage = `Failed to fetch URL: ${url}\n`;

        switch (error.code) {
          case 'ENOTFOUND':
            errorMessage += 'Domain not found or DNS resolution failed';
            break;
          case 'ECONNREFUSED':
            errorMessage += 'Connection refused by the server';
            break;
          case 'ETIMEDOUT':
            errorMessage += 'Request timed out';
            break;
          case 'ECONNRESET':
            errorMessage += 'Connection was reset by the server';
            break;
          default:
            if (error.response) {
              errorMessage += `HTTP ${error.response.status}: ${error.response.statusText}`;
            } else {
              errorMessage += error.message;
            }
        }

        return createToolError(new Error(errorMessage), { url, operationId });
      }
    }
  );

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
      safe_search: z
        .enum(['strict', 'moderate', 'off'])
        .default('moderate')
        .describe('Safe search setting'),
    },
    async ({ query, limit = 5, safe_search = 'moderate' }) => {
      const operationId = randomUUID();

      try {
        logger.info('Performing DuckDuckGo web search', {
          operationId,
          query,
          limit,
          safe_search,
        });

        // Map safe_search string to SafeSearchType enum
        const safeSearchMap = {
          strict: SafeSearchType.STRICT,
          moderate: SafeSearchType.MODERATE,
          off: SafeSearchType.OFF,
        };

        const searchOptions = {
          safeSearch: safeSearchMap[safe_search],
          time: null, // no time restriction
          locale: 'en-us',
          count: Math.min(limit, 20), // DuckDuckGo API limit
        };

        const searchResults = await search(query, searchOptions);

        if (
          !searchResults ||
          !searchResults.results ||
          searchResults.results.length === 0
        ) {
          logger.warn('No search results found', { operationId, query });
          return {
            content: [
              {
                type: 'text',
                text: `No search results found for "${query}".`,
              },
            ],
          };
        }

        const results = searchResults.results.slice(0, limit);
        const formattedResults = results
          .map((result, index) => {
            return `${index + 1}. ${result.title}\n   ${result.url}\n   ${
              result.description
            }\n`;
          })
          .join('\n');

        logger.info('DuckDuckGo search completed successfully', {
          operationId,
          query,
          resultCount: results.length,
        });

        return {
          content: [
            {
              type: 'text',
              text: `DuckDuckGo Search Results for "${query}":\n\n${formattedResults}`,
            },
          ],
        };
      } catch (error) {
        logger.error('Failed to perform DuckDuckGo search', {
          operationId,
          query,
          error: error.message,
          stack: error.stack,
        });

        return createToolError(
          new Error(`Failed to search DuckDuckGo: ${error.message}`),
          { query, operationId }
        );
      }
    }
  );

  mcpServer.tool(
    'get_page_title',
    {
      url: z.string().url().describe('The URL to extract the title from'),
    },
    async ({ url }) => {
      try {
        logger.info('Extracting page title', { url });

        const response = await axios.get(url, {
          timeout: 10000,
          headers: {
            'User-Agent': 'MCP-Web-Search-Server/1.0.0',
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
        logger.error('Failed to extract page title', {
          url,
          error: error.message,
        });

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

app.post('/mcp', async (req, res) => {
  try {
    logger.info('MCP POST request received', {
      headers: req.headers,
      bodyKeys: Object.keys(req.body || {}),
    });

    const accept = req.headers.accept || req.headers.Accept;
    if (
      !accept ||
      !accept.includes('application/json') ||
      !accept.includes('text/event-stream')
    ) {
      logger.info('Adding missing Accept headers for MCP compatibility');
      req.headers.accept = 'application/json, text/event-stream';
    }

    const sessionId = req.headers['mcp-session-id'];
    let transport;

    if (sessionId && transports[sessionId]) {
      transport = transports[sessionId];
    } else {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (newSessionId) => {
          logger.info('MCP session initialized', { sessionId: newSessionId });
          transports[newSessionId] = transport;
        },
      });

      transport.onclose = () => {
        if (transport.sessionId) {
          logger.info('MCP session closed', { sessionId: transport.sessionId });
          delete transports[transport.sessionId];
        }
      };

      const server = createMcpServer();
      await server.connect(transport);
    }

    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    logger.error('Error handling MCP request', { error: error.message });
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

app.get('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }

  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
});

app.delete('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }

  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
});

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

  logger.info('Health check requested', healthStatus);

  res.json(healthStatus);
});

const port = process.env.PORT || 3001;
const host = process.env.HOST || '0.0.0.0';

app.listen(port, host, () => {
  logger.info(`MCP Web Search server running on http://${host}:${port}`);
  logger.info('Protocol: Model Context Protocol (MCP)');
  logger.info('Transport: Streamable HTTP');
  logger.info('Available endpoints:');
  logger.info('  POST /mcp             - MCP protocol endpoint');
  logger.info(
    '  GET  /mcp             - SSE notifications (with session-id header)'
  );
  logger.info(
    '  DELETE /mcp           - Session termination (with session-id header)'
  );
  logger.info('  GET  /health          - Health check');
  logger.info('Available tools:');
  logger.info('  - fetch_url           - Fetch content from a URL');
  logger.info('  - search_web          - Perform web search using DuckDuckGo');
  logger.info('  - get_page_title      - Extract title from a web page');
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  Object.values(transports).forEach((transport) => {
    if (transport.close) transport.close();
  });
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');
  Object.values(transports).forEach((transport) => {
    if (transport.close) transport.close();
  });
  process.exit(0);
});
