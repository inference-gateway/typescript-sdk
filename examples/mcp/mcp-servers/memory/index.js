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

logger.info('MCP Memory Server initializing', {
  memoryDir,
  nodeVersion: process.version,
  platform: process.platform,
  environment: process.env.NODE_ENV || 'development',
});

/**
 * Ensure memory directory exists
 */
async function ensureMemoryDir() {
  try {
    logger.debug('Ensuring memory directory exists', { memoryDir });
    await fs.mkdir(memoryDir, { recursive: true });
    logger.debug('Memory directory ready', { memoryDir });
  } catch (error) {
    logger.error('Failed to create memory directory', {
      memoryDir,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * Get memory file path for a given session
 */
function getMemoryPath(sessionId) {
  const memoryPath = path.join(memoryDir, `${sessionId}.json`);
  logger.debug('Generated memory path', { sessionId, memoryPath });
  return memoryPath;
}

/**
 * Create and configure the MCP server
 */
function createMcpServer() {
  logger.debug('Creating new MCP server instance');

  const mcpServer = new McpServer({
    name: 'memory',
    version: '1.0.0',
  });

  logger.debug('MCP server instance created');

  mcpServer.tool(
    'save-state',
    {
      sessionId: z.string().describe('Unique session identifier'),
      state: z.object({}).passthrough().describe('State object to persist'),
      context: z.string().optional().describe('Optional context description'),
    },
    async ({ sessionId, state, context }) => {
      const startTime = Date.now();

      logger.info('save-state tool called', {
        sessionId,
        hasContext: !!context,
        stateKeys: Object.keys(state || {}),
        stateSize: JSON.stringify(state).length,
      });

      try {
        await ensureMemoryDir();

        const memoryData = {
          sessionId,
          state,
          context,
          timestamp: new Date().toISOString(),
          lastError: null,
        };

        logger.debug('Preparing memory data for save', {
          sessionId,
          dataSize: JSON.stringify(memoryData).length,
          hasContext: !!context,
        });

        logger.info(`Saving state for session: ${sessionId}`, {
          sessionId,
          state: JSON.stringify(state),
          context,
        });

        const memoryPath = getMemoryPath(sessionId);
        await fs.writeFile(memoryPath, JSON.stringify(memoryData, null, 2));

        const duration = Date.now() - startTime;

        logger.info('State saved successfully', {
          sessionId,
          memoryPath,
          duration,
          dataSize: JSON.stringify(memoryData).length,
        });

        logMcpToolCall(logger, 'save-state', sessionId, { sessionId });

        return {
          content: [
            {
              type: 'text',
              text: `State saved successfully for session: ${sessionId}`,
            },
          ],
        };
      } catch (error) {
        const duration = Date.now() - startTime;

        logger.error('Failed to save state', {
          sessionId,
          error: error.message,
          stack: error.stack,
          duration,
        });

        logMcpError(logger, error, { sessionId });
        logMcpToolCall(logger, 'save-state', sessionId, { sessionId });

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
      const startTime = Date.now();

      logger.info('save-error-state tool called', {
        sessionId,
        errorMessage: error.message,
        errorCode: error.code,
        errorStatus: error.status,
        errorUrl: error.url,
        hasContext: !!context,
        stateKeys: Object.keys(state || {}),
      });

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

        logger.debug('Preparing error memory data for save', {
          sessionId,
          dataSize: JSON.stringify(memoryData).length,
          errorType: error.code || 'unknown',
        });

        const memoryPath = getMemoryPath(sessionId);
        await fs.writeFile(memoryPath, JSON.stringify(memoryData, null, 2));

        const duration = Date.now() - startTime;

        logger.info('Error state saved successfully', {
          sessionId,
          memoryPath,
          duration,
          errorMessage: error.message,
        });

        logMcpToolCall(logger, 'save-error-state', sessionId, {
          sessionId,
          error: error.message,
        });

        return {
          content: [
            {
              type: 'text',
              text: `Error state saved successfully for session: ${sessionId}. Error: ${error.message}`,
            },
          ],
        };
      } catch (saveError) {
        const duration = Date.now() - startTime;

        logger.error('Failed to save error state', {
          sessionId,
          originalError: error.message,
          saveError: saveError.message,
          stack: saveError.stack,
          duration,
        });

        logMcpError(logger, saveError, {
          sessionId,
          originalError: error.message,
        });
        logMcpToolCall(logger, 'save-error-state', sessionId, { sessionId });

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
      const startTime = Date.now();

      logger.info('restore-state tool called', { sessionId });

      try {
        const memoryPath = getMemoryPath(sessionId);

        logger.debug('Attempting to read memory file', {
          sessionId,
          memoryPath,
        });

        try {
          const fileContent = await fs.readFile(memoryPath, 'utf8');
          const memoryData = JSON.parse(fileContent);

          const duration = Date.now() - startTime;

          logger.info('State restored successfully', {
            sessionId,
            hasError: !!memoryData.lastError,
            timestamp: memoryData.timestamp,
            contextPresent: !!memoryData.context,
            duration,
            fileSize: fileContent.length,
          });

          logMcpToolCall(logger, 'restore-state', sessionId, { sessionId });

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
            const duration = Date.now() - startTime;

            logger.info('No saved state found for session', {
              sessionId,
              duration,
            });
            logMcpToolCall(logger, 'restore-state', sessionId, { sessionId });

            return {
              content: [
                {
                  type: 'text',
                  text: `No saved state found for session: ${sessionId}`,
                },
              ],
            };
          }

          logger.error('Failed to read memory file', {
            sessionId,
            memoryPath,
            error: readError.message,
            code: readError.code,
          });

          throw readError;
        }
      } catch (error) {
        const duration = Date.now() - startTime;

        logger.error('Failed to restore state', {
          sessionId,
          error: error.message,
          stack: error.stack,
          duration,
        });

        logMcpError('restore-state', error, { sessionId });
        logMcpToolCall('restore-state', { sessionId }, false, duration);

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
    const startTime = Date.now();

    logger.info('list-sessions tool called');

    try {
      await ensureMemoryDir();
      const files = await fs.readdir(memoryDir);
      const jsonFiles = files.filter((file) => file.endsWith('.json'));

      logger.debug('Found session files', {
        totalFiles: files.length,
        jsonFiles: jsonFiles.length,
        files: jsonFiles,
      });

      const sessions = [];
      let successCount = 0;
      let errorCount = 0;

      for (const file of jsonFiles) {
        try {
          const sessionId = path.basename(file, '.json');
          const filePath = path.join(memoryDir, file);
          const memoryData = JSON.parse(await fs.readFile(filePath, 'utf8'));

          sessions.push({
            sessionId,
            context: memoryData.context,
            timestamp: memoryData.timestamp,
            hasError: !!memoryData.lastError,
            lastError: memoryData.lastError?.message,
          });

          successCount++;

          logger.debug('Session file processed successfully', {
            sessionId,
            file,
            hasError: !!memoryData.lastError,
          });
        } catch (readError) {
          errorCount++;

          logger.warn('Failed to read session file', {
            file,
            error: readError.message,
          });
        }
      }

      const duration = Date.now() - startTime;

      logger.info('Sessions listed successfully', {
        totalSessions: sessions.length,
        successCount,
        errorCount,
        duration,
      });

      logMcpToolCall('list-sessions', {}, true, duration);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ sessions }, null, 2),
          },
        ],
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error('Failed to list sessions', {
        error: error.message,
        stack: error.stack,
        duration,
      });

      logMcpError('list-sessions', error, {});
      logMcpToolCall('list-sessions', {}, false, duration);

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
      const startTime = Date.now();

      logger.info('clear-session tool called', { sessionId });

      try {
        const memoryPath = getMemoryPath(sessionId);

        logger.debug('Attempting to delete session file', {
          sessionId,
          memoryPath,
        });

        await fs.unlink(memoryPath);

        const duration = Date.now() - startTime;

        logger.info('Session cleared successfully', { sessionId, duration });
        logMcpToolCall('clear-session', { sessionId }, true, duration);

        return {
          content: [
            {
              type: 'text',
              text: `Session cleared successfully: ${sessionId}`,
            },
          ],
        };
      } catch (error) {
        const duration = Date.now() - startTime;

        if (error.code === 'ENOENT') {
          logger.info('No session found to clear', { sessionId, duration });
          logMcpToolCall('clear-session', { sessionId }, true, duration);

          return {
            content: [
              {
                type: 'text',
                text: `No session found to clear: ${sessionId}`,
              },
            ],
          };
        }

        logger.error('Failed to clear session', {
          sessionId,
          error: error.message,
          code: error.code,
          stack: error.stack,
          duration,
        });

        logMcpError('clear-session', error, { sessionId });
        logMcpToolCall('clear-session', { sessionId }, false, duration);

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

  logger.debug('All MCP tools registered');
  return mcpServer;
}

/**
 * Handle MCP requests
 */
app.post('/mcp', async (req, res) => {
  const requestId = randomUUID();
  const sessionId = req.headers['mcp-session-id'] || randomUUID();
  const startTime = Date.now();

  logger.info('MCP request received', {
    requestId,
    sessionId,
    method: req.body?.method,
    hasParams: !!req.body?.params,
    userAgent: req.headers['user-agent'],
    contentType: req.headers['content-type'],
    contentLength: req.headers['content-length'],
  });

  logMcpRequest(logger, req, {
    sessionId,
    requestId,
    params: req.body?.params,
  });

  try {
    let transport = transports[sessionId];

    if (!transport) {
      logger.debug('Creating new transport for session', {
        sessionId,
        requestId,
      });

      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => sessionId,
      });

      transports[sessionId] = transport;

      transport.onclose = () => {
        logger.debug('Transport closed for session', { sessionId });
        delete transports[sessionId];
      };

      const mcpServer = createMcpServer();
      await mcpServer.connect(transport);

      logger.debug('MCP server connected to transport', {
        sessionId,
        requestId,
      });
      logMcpSession(logger, 'connected', sessionId);
    } else {
      logger.debug('Reusing existing transport for session', {
        sessionId,
        requestId,
      });
    }

    await transport.handleRequest(req, res, req.body);

    const duration = Date.now() - startTime;

    logger.info('MCP request handled successfully', {
      requestId,
      sessionId,
      duration,
      method: req.body?.method,
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('Error handling MCP request', {
      requestId,
      sessionId,
      error: error.message,
      stack: error.stack,
      method: req.body?.method,
      duration,
    });

    logMcpError(logger, error, {
      sessionId,
      requestId,
      method: req.body?.method,
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

app.get('/health', (req, res) => {
  const requestId = randomUUID();

  logger.debug('Health check requested', {
    requestId,
    userAgent: req.headers['user-agent'],
  });

  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    activeSessions: Object.keys(transports).length,
    memoryDir,
  };

  logger.debug('Health check response', { requestId, healthData });

  res.status(200).json(healthData);
});

app.get('/mcp', (req, res) => {
  const requestId = randomUUID();

  logger.warn('Method not allowed: GET /mcp', {
    requestId,
    userAgent: req.headers['user-agent'],
  });

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
  const requestId = randomUUID();

  logger.warn('Method not allowed: DELETE /mcp', {
    requestId,
    userAgent: req.headers['user-agent'],
  });

  res.status(405).json({
    jsonrpc: '2.0',
    error: {
      code: -32000,
      message: 'Method not allowed',
    },
    id: null,
  });
});

const PORT = process.env.PORT || 3004;

logger.info('Starting MCP Memory Server', {
  port: PORT,
  memoryDir,
  nodeVersion: process.version,
  environment: process.env.NODE_ENV || 'development',
});

app.listen(PORT, () => {
  logger.info('MCP Memory Server started successfully', {
    port: PORT,
    memoryDir,
    endpoints: ['/mcp', '/health'],
  });
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');

  Object.keys(transports).forEach((sessionId) => {
    logger.debug('Closing transport for session', { sessionId });
    const transport = transports[sessionId];
    if (transport && transport.close) {
      transport.close();
    }
  });

  logger.info('MCP Memory Server shutdown complete');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');

  Object.keys(transports).forEach((sessionId) => {
    logger.debug('Closing transport for session', { sessionId });
    const transport = transports[sessionId];
    if (transport && transport.close) {
      transport.close();
    }
  });

  logger.info('MCP Memory Server shutdown complete');
  process.exit(0);
});
