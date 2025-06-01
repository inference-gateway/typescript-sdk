/**
 * MCP Memory Server
 *
 * This is a Model Context Protocol (MCP) server that provides memory
 * operations for persisting state when HTTP errors occur. It allows
 * agents to save their progress and continue from where they left off
 * after encountering errors.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  createMcpLogger,
  logMcpRequest,
  logMcpSession,
  logMcpToolCall,
  logMcpError,
} from './logger.js';

const app = express();
app.use(express.json());

const logger = createMcpLogger('mcp-memory', '1.0.0');

const transports = {};

const memoryDir = process.env.MEMORY_DIR || '/tmp/memory';

console.info('Memory directory:', memoryDir);

/**
 * Ensure memory directory exists
 */
async function ensureMemoryDir() {
  try {
    await fs.mkdir(memoryDir, { recursive: true });
  } catch (error) {
    console.error('Failed to create memory directory:', error);
  }
}

/**
 * Get memory file path for a given session
 */
function getMemoryPath(sessionId) {
  return path.join(memoryDir, `${sessionId}.json`);
}

/**
 * Create and configure the MCP server
 */
function createMcpServer() {
  const mcpServer = new McpServer({
    name: 'memory',
    version: '1.0.0',
  });

  mcpServer.tool(
    'save-state',
    {
      sessionId: z.string().describe('Unique session identifier'),
      state: z.object({}).passthrough().describe('State object to persist'),
      context: z.string().optional().describe('Optional context description'),
    },
    async ({ sessionId, state, context }) => {
      try {
        await ensureMemoryDir();

        const memoryData = {
          sessionId,
          state,
          context,
          timestamp: new Date().toISOString(),
          lastError: null,
        };

        logger.info(`Saving state for session: ${sessionId}`, {
          sessionId,
          state: JSON.stringify(state),
          context,
        });

        const memoryPath = getMemoryPath(sessionId);
        await fs.writeFile(memoryPath, JSON.stringify(memoryData, null, 2));

        return {
          content: [
            {
              type: 'text',
              text: `State saved successfully for session: ${sessionId}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to save state: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  mcpServer.tool(
    'save-error-state',
    {
      sessionId: z.string().describe('Unique session identifier'),
      state: z.object({}).passthrough().describe('State object to persist'),
      error: z
        .object({
          message: z.string(),
          code: z.number().optional(),
          status: z.number().optional(),
          url: z.string().optional(),
        })
        .describe('Error information'),
      context: z.string().optional().describe('Optional context description'),
    },
    async ({ sessionId, state, error, context }) => {
      try {
        await ensureMemoryDir();

        const memoryData = {
          sessionId,
          state,
          context,
          timestamp: new Date().toISOString(),
          lastError: {
            ...error,
            timestamp: new Date().toISOString(),
          },
        };

        const memoryPath = getMemoryPath(sessionId);
        await fs.writeFile(memoryPath, JSON.stringify(memoryData, null, 2));

        return {
          content: [
            {
              type: 'text',
              text: `Error state saved successfully for session: ${sessionId}. Error: ${error.message}`,
            },
          ],
        };
      } catch (saveError) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to save error state: ${saveError.message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  mcpServer.tool(
    'restore-state',
    {
      sessionId: z.string().describe('Unique session identifier'),
    },
    async ({ sessionId }) => {
      try {
        const memoryPath = getMemoryPath(sessionId);

        try {
          const memoryData = JSON.parse(await fs.readFile(memoryPath, 'utf8'));

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    sessionId: memoryData.sessionId,
                    state: memoryData.state,
                    context: memoryData.context,
                    timestamp: memoryData.timestamp,
                    lastError: memoryData.lastError,
                    hasError: !!memoryData.lastError,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (readError) {
          if (readError.code === 'ENOENT') {
            return {
              content: [
                {
                  type: 'text',
                  text: `No saved state found for session: ${sessionId}`,
                },
              ],
            };
          }
          throw readError;
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to restore state: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  mcpServer.tool('list-sessions', {}, async () => {
    try {
      await ensureMemoryDir();
      const files = await fs.readdir(memoryDir);
      const jsonFiles = files.filter((file) => file.endsWith('.json'));

      const sessions = [];
      for (const file of jsonFiles) {
        try {
          const sessionId = path.basename(file, '.json');
          const memoryData = JSON.parse(
            await fs.readFile(path.join(memoryDir, file), 'utf8')
          );

          sessions.push({
            sessionId,
            context: memoryData.context,
            timestamp: memoryData.timestamp,
            hasError: !!memoryData.lastError,
            lastError: memoryData.lastError?.message,
          });
        } catch (readError) {
          console.warn(
            `Failed to read session file ${file}:`,
            readError.message
          );
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ sessions }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to list sessions: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  });

  mcpServer.tool(
    'clear-session',
    {
      sessionId: z.string().describe('Unique session identifier'),
    },
    async ({ sessionId }) => {
      try {
        const memoryPath = getMemoryPath(sessionId);
        await fs.unlink(memoryPath);

        return {
          content: [
            {
              type: 'text',
              text: `Session cleared successfully: ${sessionId}`,
            },
          ],
        };
      } catch (error) {
        if (error.code === 'ENOENT') {
          return {
            content: [
              {
                type: 'text',
                text: `No session found to clear: ${sessionId}`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: `Failed to clear session: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  return mcpServer;
}

/**
 * Handle MCP requests
 */
app.post('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] || randomUUID();

  try {
    let transport = transports[sessionId];

    if (!transport) {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => sessionId,
      });

      transports[sessionId] = transport;

      transport.onclose = () => {
        delete transports[sessionId];
      };

      const mcpServer = createMcpServer();
      await mcpServer.connect(transport);
    }

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Method not allowed handlers
app.get('/mcp', (req, res) => {
  res.status(405).json({
    jsonrpc: '2.0',
    error: {
      code: -32000,
      message: 'Method not allowed',
    },
    id: null,
  });
});

app.delete('/mcp', (req, res) => {
  res.status(405).json({
    jsonrpc: '2.0',
    error: {
      code: -32000,
      message: 'Method not allowed',
    },
    id: null,
  });
});

// Start the server
const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
  console.log(`MCP Memory Server listening on port ${PORT}`);
});
