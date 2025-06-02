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
import MemoryManager from './memory-manager.js';
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

// Initialize the memory manager
const memoryManager = new MemoryManager(memoryDir);

logger.info('MCP Memory Server initializing', {
  memoryDir,
  nodeVersion: process.version,
  platform: process.platform,
  environment: process.env.NODE_ENV || 'development',
});

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

      logger.debug('save-state tool called', {
        sessionId,
        stateSize: JSON.stringify(state).length,
      });

      try {
        // Use fast in-memory operation
        await memoryManager.saveState(sessionId, state, context);

        const duration = Date.now() - startTime;

        logger.info('State saved successfully', {
          sessionId,
          duration,
          dataSize: JSON.stringify(state).length,
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
        // Use fast in-memory operation with error tracking
        await memoryManager.saveErrorState(sessionId, state, error, context);

        const duration = Date.now() - startTime;

        logger.info('Error state saved successfully', {
          sessionId,
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

      logger.debug('restore-state tool called', { sessionId });

      try {
        // Use fast in-memory operation
        const memoryData = await memoryManager.restoreState(sessionId);

        const duration = Date.now() - startTime;

        if (!memoryData) {
          logger.debug('No saved state found for session', {
            sessionId,
            duration,
          });

          return {
            content: [
              {
                type: 'text',
                text: `No saved state found for session: ${sessionId}`,
              },
            ],
          };
        }

        logger.debug('State restored successfully', {
          sessionId,
          hasError: !!memoryData.lastError,
          duration,
        });

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
      } catch (error) {
        const duration = Date.now() - startTime;

        logger.error('Failed to restore state', {
          sessionId,
          error: error.message,
          duration,
        });

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
      // Use fast in-memory operation
      const sessions = memoryManager.listSessions();
      const duration = Date.now() - startTime;

      logger.info('Sessions listed successfully', {
        totalSessions: sessions.length,
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
    'save-conversation',
    {
      sessionId: z.string().describe('Unique session identifier'),
      messages: z
        .array(
          z.object({
            role: z
              .enum(['user', 'assistant', 'system'])
              .describe('Message role'),
            content: z.string().describe('Message content'),
            timestamp: z
              .string()
              .optional()
              .describe('Message timestamp (ISO string)'),
          })
        )
        .describe('Array of conversation messages'),
      context: z.string().optional().describe('Optional context description'),
    },
    async ({ sessionId, messages, context }) => {
      const startTime = Date.now();

      logger.info('save-conversation tool called', {
        sessionId,
        messageCount: messages.length,
        hasContext: !!context,
        roles: messages.map((m) => m.role),
      });

      try {
        const timestampedMessages = messages.map((msg) => ({
          ...msg,
          timestamp: msg.timestamp || new Date().toISOString(),
        }));

        // Use fast in-memory operation
        await memoryManager.saveConversation(
          sessionId,
          timestampedMessages,
          context
        );

        const duration = Date.now() - startTime;

        logger.info('Conversation saved successfully', {
          sessionId,
          duration,
          messageCount: timestampedMessages.length,
        });

        logMcpToolCall(logger, 'save-conversation', sessionId, { sessionId });

        return {
          content: [
            {
              type: 'text',
              text: `Conversation saved successfully for session: ${sessionId}. Saved ${timestampedMessages.length} messages.`,
            },
          ],
        };
      } catch (error) {
        const duration = Date.now() - startTime;

        logger.error('Failed to save conversation', {
          sessionId,
          error: error.message,
          stack: error.stack,
          duration,
        });

        logMcpError(logger, error, { sessionId });
        logMcpToolCall(logger, 'save-conversation', sessionId, { sessionId });

        return {
          content: [
            {
              type: 'text',
              text: `Failed to save conversation: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  mcpServer.tool(
    'add-message',
    {
      sessionId: z.string().describe('Unique session identifier'),
      role: z.enum(['user', 'assistant', 'system']).describe('Message role'),
      content: z.string().describe('Message content'),
      timestamp: z
        .string()
        .optional()
        .describe('Message timestamp (ISO string)'),
    },
    async ({ sessionId, role, content, timestamp }) => {
      const startTime = Date.now();

      logger.info('add-message tool called', {
        sessionId,
        role,
        contentLength: content.length,
        hasTimestamp: !!timestamp,
      });

      try {
        const messageTimestamp = timestamp || new Date().toISOString();
        const newMessage = {
          role,
          content,
          timestamp: messageTimestamp,
        };

        // Use fast in-memory operation
        const totalMessages = await memoryManager.addMessage(
          sessionId,
          newMessage
        );

        const duration = Date.now() - startTime;

        logger.info('Message added successfully', {
          sessionId,
          role,
          duration,
          totalMessages,
        });

        logMcpToolCall(logger, 'add-message', sessionId, { sessionId, role });

        return {
          content: [
            {
              type: 'text',
              text: `Message added successfully for session: ${sessionId}. Role: ${role}. Total messages: ${totalMessages}`,
            },
          ],
        };
      } catch (error) {
        const duration = Date.now() - startTime;

        logger.error('Failed to add message', {
          sessionId,
          role,
          error: error.message,
          stack: error.stack,
          duration,
        });

        logMcpError(logger, error, { sessionId, role });
        logMcpToolCall(logger, 'add-message', sessionId, { sessionId, role });

        return {
          content: [
            {
              type: 'text',
              text: `Failed to add message: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  mcpServer.tool(
    'get-conversation',
    {
      sessionId: z.string().describe('Unique session identifier'),
      filterRole: z
        .enum(['user', 'assistant', 'system'])
        .optional()
        .describe('Optional: filter messages by role'),
      limit: z
        .number()
        .optional()
        .describe(
          'Optional: limit number of messages returned (most recent first)'
        ),
    },
    async ({ sessionId, filterRole, limit }) => {
      const startTime = Date.now();

      logger.info('get-conversation tool called', {
        sessionId,
        filterRole,
        limit,
      });

      try {
        // Use fast in-memory operation
        const conversationData = await memoryManager.getConversation(sessionId);

        const duration = Date.now() - startTime;

        if (!conversationData || !conversationData.messages) {
          logger.info('No conversation found for session', {
            sessionId,
            duration,
          });

          logMcpToolCall(logger, 'get-conversation', sessionId, {
            sessionId,
          });

          return {
            content: [
              {
                type: 'text',
                text: `No conversation found for session: ${sessionId}`,
              },
            ],
          };
        }

        let messages = [...conversationData.messages];

        // Apply role filter if specified
        if (filterRole) {
          messages = messages.filter((msg) => msg.role === filterRole);
        }

        // Apply limit if specified (get most recent messages)
        if (limit && limit > 0) {
          messages = messages.slice(-limit);
        }

        logger.info('Conversation retrieved successfully', {
          sessionId,
          totalMessages: conversationData.messages.length,
          filteredMessages: messages.length,
          filterRole,
          limit,
          duration,
        });

        logMcpToolCall(logger, 'get-conversation', sessionId, { sessionId });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  sessionId,
                  conversation: {
                    messages,
                    context: conversationData.context,
                    lastUpdated: conversationData.lastUpdated,
                    totalMessages: conversationData.messages.length,
                    filteredMessages: messages.length,
                  },
                  timestamp: conversationData.timestamp,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        const duration = Date.now() - startTime;

        logger.error('Failed to get conversation', {
          sessionId,
          error: error.message,
          stack: error.stack,
          duration,
        });

        logMcpError(logger, error, { sessionId });
        logMcpToolCall(logger, 'get-conversation', sessionId, { sessionId });

        return {
          content: [
            {
              type: 'text',
              text: `Failed to get conversation: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  mcpServer.tool(
    'clear-conversation',
    {
      sessionId: z.string().describe('Unique session identifier'),
      keepOtherData: z
        .boolean()
        .optional()
        .default(true)
        .describe(
          'Whether to keep other session data (state, errors) and only clear conversation'
        ),
    },
    async ({ sessionId, keepOtherData = true }) => {
      const startTime = Date.now();

      logger.info('clear-conversation tool called', {
        sessionId,
        keepOtherData,
      });

      try {
        // Use fast in-memory operation
        const cleared = await memoryManager.clearConversation(
          sessionId,
          keepOtherData
        );

        const duration = Date.now() - startTime;

        if (!cleared) {
          logger.info('No conversation found to clear', {
            sessionId,
            duration,
          });
          logMcpToolCall(logger, 'clear-conversation', sessionId, {
            sessionId,
          });

          return {
            content: [
              {
                type: 'text',
                text: `No conversation found to clear for session: ${sessionId}`,
              },
            ],
          };
        }

        const message = keepOtherData
          ? `Conversation cleared successfully for session: ${sessionId} (other data preserved)`
          : `Entire session cleared successfully: ${sessionId}`;

        logger.info(
          keepOtherData
            ? 'Conversation cleared successfully (keeping other data)'
            : 'Entire session cleared successfully',
          {
            sessionId,
            duration,
          }
        );

        logMcpToolCall(logger, 'clear-conversation', sessionId, {
          sessionId,
        });

        return {
          content: [
            {
              type: 'text',
              text: message,
            },
          ],
        };
      } catch (error) {
        const duration = Date.now() - startTime;

        logger.error('Failed to clear conversation', {
          sessionId,
          keepOtherData,
          error: error.message,
          stack: error.stack,
          duration,
        });

        logMcpError(logger, error, { sessionId });
        logMcpToolCall(logger, 'clear-conversation', sessionId, { sessionId });

        return {
          content: [
            {
              type: 'text',
              text: `Failed to clear conversation: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  mcpServer.tool(
    'clear-session',
    {
      sessionId: z.string().describe('Unique session identifier'),
    },
    async ({ sessionId }) => {
      const startTime = Date.now();

      logger.info('clear-session tool called', { sessionId });

      try {
        // Use fast in-memory operation
        const cleared = await memoryManager.clearSession(sessionId);

        const duration = Date.now() - startTime;

        if (!cleared) {
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

        logger.error('Failed to clear session', {
          sessionId,
          error: error.message,
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

async function startServer() {
  try {
    await memoryManager.initialize();
    logger.info('MemoryManager initialized successfully');

    app.listen(PORT, () => {
      logger.info('MCP Memory Server started successfully', {
        port: PORT,
        memoryDir,
        endpoints: ['/mcp', '/health'],
        sessionsLoaded: memoryManager.getStats().sessionsInMemory,
      });
    });
  } catch (error) {
    logger.error('Failed to start server', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

startServer();

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');

  try {
    await memoryManager.shutdown();
    logger.info('MemoryManager shutdown completed');
  } catch (error) {
    logger.error('Error during MemoryManager shutdown', {
      error: error.message,
    });
  }

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

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');

  try {
    // Shutdown MemoryManager first to persist data
    await memoryManager.shutdown();
    logger.info('MemoryManager shutdown completed');
  } catch (error) {
    logger.error('Error during MemoryManager shutdown', {
      error: error.message,
    });
  }

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
