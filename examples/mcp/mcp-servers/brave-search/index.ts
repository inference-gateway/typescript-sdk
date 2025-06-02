/**
 * MCP Brave Search Server
 *
 * This is a Model Context Protocol (MCP) server that provides Brave Search API
 * capabilities. It uses the official MCP TypeScript SDK and implements the
 * proper MCP protocol with Streamable HTTP transport to bridge stdio-only
 * Brave Search containers to HTTP endpoints.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import axios from 'axios';
import cors from 'cors';
import express from 'express';
import { randomUUID } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';
import { z } from 'zod';
import { createMcpLogger } from './logger.js';

const logger = createMcpLogger('mcp-brave-search', '1.0.0');

let lastSearchTime = 0;

// Rate limiting configuration based on plan
const RATE_LIMITS = {
  free: { interval: 1000, maxRetries: 5 }, // 1 query/second
  base: { interval: 50, maxRetries: 3 }, // 20 queries/second
  pro: { interval: 20, maxRetries: 3 }, // 50 queries/second
};

const getCurrentRateLimit = () => {
  const planType = (process.env.BRAVE_API_PLAN || 'free').toLowerCase();
  return RATE_LIMITS[planType as keyof typeof RATE_LIMITS] || RATE_LIMITS.free;
};

/**
 * Rate-limited search function to avoid hitting API limits
 */
const rateLimitedBraveSearch = async (
  endpoint: string,
  params: Record<string, any>,
  retries?: number
) => {
  const rateLimit = getCurrentRateLimit();
  const maxRetries = retries || rateLimit.maxRetries;

  const now = Date.now();
  const timeSinceLastSearch = now - lastSearchTime;

  if (timeSinceLastSearch < rateLimit.interval) {
    const delay = rateLimit.interval - timeSinceLastSearch;
    logger.info('Rate limiting: delaying search', {
      delay,
      endpoint,
      interval: rateLimit.interval,
      plan: process.env.BRAVE_API_PLAN || 'free',
    });
    await setTimeout(delay);
  }

  lastSearchTime = Date.now();

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const apiKey = process.env.BRAVE_API_KEY;
      if (!apiKey) {
        throw new Error('BRAVE_API_KEY environment variable is required');
      }

      const response = await axios.get(
        `https://api.search.brave.com/res/v1/${endpoint}`,
        {
          params,
          headers: {
            Accept: 'application/json',
            'Accept-Encoding': 'gzip',
            'X-Subscription-Token': apiKey,
          },
          timeout: 30000,
        }
      );

      logger.info('Brave Search API request successful', {
        endpoint,
        statusCode: response.status,
        attempt,
        plan: process.env.BRAVE_API_PLAN || 'free',
      });

      return response.data;
    } catch (error: any) {
      const is429Error = error.response?.status === 429;
      const isRateLimitError =
        error.message.includes('rate limit') ||
        error.message.includes('Too Many Requests');

      if (is429Error || isRateLimitError) {
        if (attempt < maxRetries) {
          const baseDelay = rateLimit.interval * Math.pow(2, attempt - 1);
          const jitter = Math.random() * 1000;
          const backoffDelay = baseDelay + jitter;

          logger.warn('Brave Search rate limit hit, retrying', {
            attempt,
            retries: maxRetries,
            delay: backoffDelay,
            endpoint,
            error: error.message,
            statusCode: error.response?.status,
            plan: process.env.BRAVE_API_PLAN || 'free',
          });

          await setTimeout(backoffDelay);
          continue;
        } else {
          logger.error('Brave Search rate limit exceeded after all retries', {
            attempts: maxRetries,
            endpoint,
            error: error.message,
            statusCode: error.response?.status,
            plan: process.env.BRAVE_API_PLAN || 'free',
          });
        }
      }

      if (!is429Error && !isRateLimitError) {
        logger.error('Brave Search API error (non-rate-limit)', {
          endpoint,
          error: error.message,
          statusCode: error.response?.status,
          attempt,
        });
      }

      throw error;
    }
  }
};

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
  const startTime = Date.now();
  const requestId = randomUUID();

  (req as any).requestId = requestId;

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

const transports = new Map<string, any>();

/**
 * Enhanced error handling for tools
 */
function createToolError(error: Error, context: Record<string, any> = {}) {
  logger.error('Tool execution error', {
    error: error.message,
    stack: error.stack,
    context,
  });

  return {
    content: [
      {
        type: 'text' as const,
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
    name: 'brave-search',
    version: '1.0.0',
  });

  mcpServer.tool(
    'brave_web_search',
    'Search the web using Brave Search API with SafeSearch filtering',
    {
      query: z.string().min(1).max(500).describe('The search query to execute'),
      count: z
        .number()
        .min(1)
        .max(20)
        .default(10)
        .describe('Maximum number of results to return'),
      country: z
        .string()
        .length(2)
        .optional()
        .describe('Country code for localized results (e.g., US, GB, DE)'),
      safesearch: z
        .enum(['strict', 'moderate', 'off'])
        .default('moderate')
        .describe('Safe search setting'),
      freshness: z
        .enum(['pd', 'pw', 'pm', 'py'])
        .optional()
        .describe(
          'Freshness filter: pd=past day, pw=past week, pm=past month, py=past year'
        ),
      text_decorations: z
        .boolean()
        .default(false)
        .describe('Include text decorations in results'),
    },
    async ({
      query,
      count = 10,
      country,
      safesearch = 'moderate',
      freshness,
      text_decorations = false,
    }) => {
      const operationId = randomUUID();

      try {
        logger.info('Performing Brave web search', {
          operationId,
          query,
          count,
          country,
          safesearch,
          freshness,
        });

        const params: Record<string, any> = {
          q: query,
          count: Math.min(count, 20),
          safesearch,
          text_decorations,
        };

        if (country) params.country = country;
        if (freshness) params.freshness = freshness;

        const searchResults = await rateLimitedBraveSearch(
          'web/search',
          params
        );

        if (
          !searchResults?.web?.results ||
          searchResults.web.results.length === 0
        ) {
          logger.warn('No search results found', { operationId, query });
          return {
            content: [
              {
                type: 'text' as const,
                text: `No web search results found for "${query}".`,
              },
            ],
          };
        }

        const results = searchResults.web.results.slice(0, count);
        const formattedResults = results
          .map((result: any, index: number) => {
            return `${index + 1}. ${result.title}\n   ${result.url}\n   ${result.description || 'No description available'}\n`;
          })
          .join('\n');

        logger.info('Brave web search completed successfully', {
          operationId,
          query,
          resultCount: results.length,
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: `Brave Web Search Results for "${query}":\n\n${formattedResults}`,
            },
          ],
        };
      } catch (error: any) {
        logger.error('Failed to perform Brave web search', {
          operationId,
          query,
          error: error.message,
          stack: error.stack,
        });

        return createToolError(
          new Error(`Failed to search Brave: ${error.message}`),
          { query, operationId }
        );
      }
    }
  );

  mcpServer.tool(
    'brave_news_search',
    'Search for recent news articles using Brave Search API',
    {
      query: z
        .string()
        .min(1)
        .max(500)
        .describe('The news search query to execute'),
      count: z
        .number()
        .min(1)
        .max(20)
        .default(10)
        .describe('Maximum number of news results to return'),
      country: z
        .string()
        .length(2)
        .optional()
        .describe('Country code for localized news (e.g., US, GB, DE)'),
      freshness: z
        .enum(['pd', 'pw', 'pm', 'py'])
        .optional()
        .describe(
          'Freshness filter: pd=past day, pw=past week, pm=past month, py=past year'
        ),
    },
    async ({ query, count = 10, country, freshness }) => {
      const operationId = randomUUID();

      try {
        logger.info('Performing Brave news search', {
          operationId,
          query,
          count,
          country,
          freshness,
        });

        const params: Record<string, any> = {
          q: query,
          count: Math.min(count, 20),
        };

        if (country) params.country = country;
        if (freshness) params.freshness = freshness;

        const searchResults = await rateLimitedBraveSearch(
          'news/search',
          params
        );

        if (!searchResults?.results || searchResults.results.length === 0) {
          logger.warn('No news results found', { operationId, query });
          return {
            content: [
              {
                type: 'text' as const,
                text: `No news results found for "${query}".`,
              },
            ],
          };
        }

        const results = searchResults.results.slice(0, count);
        const formattedResults = results
          .map((result: any, index: number) => {
            const publishedDate = result.age ? ` (${result.age})` : '';
            return `${index + 1}. ${result.title}${publishedDate}\n   ${result.url}\n   ${result.description || 'No description available'}\n`;
          })
          .join('\n');

        logger.info('Brave news search completed successfully', {
          operationId,
          query,
          resultCount: results.length,
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: `Brave News Search Results for "${query}":\n\n${formattedResults}`,
            },
          ],
        };
      } catch (error: any) {
        logger.error('Failed to perform Brave news search', {
          operationId,
          query,
          error: error.message,
          stack: error.stack,
        });

        return createToolError(
          new Error(`Failed to search Brave News: ${error.message}`),
          { query, operationId }
        );
      }
    }
  );

  mcpServer.tool(
    'marketing_research',
    'Perform automated competitive market research using Brave Search',
    {
      brand: z
        .string()
        .min(1)
        .max(100)
        .describe('The brand or company to research'),
      competitors: z
        .array(z.string())
        .optional()
        .describe('List of competitor brands to include in research'),
      topics: z
        .array(z.string())
        .default(['reviews', 'pricing', 'features'])
        .describe('Research topics to focus on'),
      country: z
        .string()
        .length(2)
        .default('US')
        .describe('Country code for localized research'),
    },
    async ({
      brand,
      competitors = [],
      topics = ['reviews', 'pricing', 'features'],
      country = 'US',
    }) => {
      const operationId = randomUUID();

      try {
        logger.info('Performing marketing research', {
          operationId,
          brand,
          competitors,
          topics,
          country,
        });

        const allBrands = [brand, ...competitors];
        const researchResults = [];

        for (const currentBrand of allBrands) {
          for (const topic of topics) {
            const query = `${currentBrand} ${topic}`;

            try {
              const params = {
                q: query,
                count: 5,
                country,
                freshness: 'pm',
              };

              const searchResults = await rateLimitedBraveSearch(
                'web/search',
                params
              );

              if (searchResults?.web?.results) {
                researchResults.push({
                  brand: currentBrand,
                  topic,
                  results: searchResults.web.results.slice(0, 3),
                });
              }

              await setTimeout(500);
            } catch (error: any) {
              logger.warn('Failed to search for brand topic', {
                brand: currentBrand,
                topic,
                error: error.message,
              });
            }
          }
        }

        if (researchResults.length === 0) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `No marketing research data found for "${brand}".`,
              },
            ],
          };
        }

        let formattedOutput = `Marketing Research Report for "${brand}"\n`;
        formattedOutput += `=`.repeat(50) + '\n\n';

        const brandResults = researchResults.reduce((acc: any, result) => {
          if (!acc[result.brand]) acc[result.brand] = {};
          if (!acc[result.brand][result.topic])
            acc[result.brand][result.topic] = [];
          acc[result.brand][result.topic].push(...result.results);
          return acc;
        }, {});

        for (const [brandName, brandTopics] of Object.entries(brandResults)) {
          formattedOutput += `## ${brandName}\n\n`;

          for (const [topicName, topicResults] of Object.entries(
            brandTopics as any
          )) {
            formattedOutput += `### ${topicName.charAt(0).toUpperCase() + topicName.slice(1)}\n`;

            (topicResults as any[]).forEach((result, index) => {
              formattedOutput += `${index + 1}. ${result.title}\n`;
              formattedOutput += `   ${result.url}\n`;
              formattedOutput += `   ${result.description || 'No description available'}\n\n`;
            });
          }
          formattedOutput += '\n';
        }

        logger.info('Marketing research completed successfully', {
          operationId,
          brand,
          totalResults: researchResults.length,
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: formattedOutput,
            },
          ],
        };
      } catch (error: any) {
        logger.error('Failed to perform marketing research', {
          operationId,
          brand,
          error: error.message,
          stack: error.stack,
        });

        return createToolError(
          new Error(`Failed to perform marketing research: ${error.message}`),
          { brand, operationId }
        );
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
      method: req.body?.method,
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

    const sessionId = req.headers['mcp-session-id'] as string;
    let transport: any;

    if (sessionId && transports.has(sessionId)) {
      transport = transports.get(sessionId);
      logger.info('Using existing session', { sessionId });
    } else {
      const newSessionId = randomUUID();
      logger.info('Creating new MCP session', { sessionId: newSessionId });

      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => newSessionId,
        onsessioninitialized: (initSessionId: string) => {
          logger.info('MCP session initialized', { sessionId: initSessionId });
          transports.set(initSessionId, transport);
        },
      });

      transport.onclose = () => {
        if ((transport as any).sessionId) {
          logger.info('MCP session closed', {
            sessionId: (transport as any).sessionId,
          });
          transports.delete((transport as any).sessionId);
        }
      };

      const server = createMcpServer();
      await server.connect(transport);

      transports.set(newSessionId, transport);

      res.setHeader('mcp-session-id', newSessionId);
    }

    await transport.handleRequest(req, res, req.body);
  } catch (error: any) {
    logger.error('Error handling MCP request', {
      error: error.message,
      stack: error.stack,
      method: req.body?.method,
      sessionId: req.headers['mcp-session-id'],
    });
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
  const sessionId = req.headers['mcp-session-id'] as string;
  if (!sessionId || !transports.has(sessionId)) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }

  const transport = transports.get(sessionId);
  await transport!.handleRequest(req, res);
});

app.delete('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string;
  if (!sessionId || !transports.has(sessionId)) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }

  const transport = transports.get(sessionId);
  await transport!.handleRequest(req, res);
});

app.get('/health', (req, res) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'mcp-brave-search',
    version: '1.0.0',
    protocol: 'Model Context Protocol',
    transport: 'Streamable HTTP',
    api_key_configured: !!process.env.BRAVE_API_KEY,
  };

  logger.info('Health check requested', healthStatus);

  res.json(healthStatus);
});

const port = parseInt(process.env.PORT || '3002');
const host = process.env.HOST || '0.0.0.0';

app.listen(port, host, () => {
  logger.info(`MCP Brave Search server running on http://${host}:${port}`);
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
  logger.info('  - brave_web_search    - Web search using Brave Search API');
  logger.info('  - brave_news_search   - News search using Brave Search API');
  logger.info(
    '  - marketing_research  - Automated competitive market research'
  );

  if (!process.env.BRAVE_API_KEY) {
    logger.warn(
      'BRAVE_API_KEY environment variable not set - search functionality will be limited'
    );
  }
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  Array.from(transports.values()).forEach((transport: any) => {
    if (transport.close) transport.close();
  });
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');
  Array.from(transports.values()).forEach((transport: any) => {
    if (transport.close) transport.close();
  });
  process.exit(0);
});
