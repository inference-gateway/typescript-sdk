/**
 * Context7 HTTP Bridge
 *
 * This service provides an HTTP interface for the stdio-based Context7 MCP server from Upstash,
 * allowing it to work with the Inference Gateway. It spawns the real Context7 MCP server
 * as a child process and communicates via stdio using the MCP protocol.
 */

import express from 'express';
import cors from 'cors';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import {
  createMcpLogger,
  logMcpRequest,
  logMcpSession,
  logMcpToolCall,
  logMcpError,
} from './logger.js';

const app = express();
app.use(express.json());
app.use(cors());

const logger = createMcpLogger('mcp-context7', '1.0.0');

const mcpSessions = new Map();
const context7Processes = new Map();

/**
 * Create a Context7 process and manage its lifecycle
 */
class Context7Process {
  constructor() {
    this.process = null;
    this.messageId = 0;
    this.pendingRequests = new Map();
    this.isReady = false;
    this.readyPromise = null;
  }

  async start() {
    if (this.readyPromise) {
      return this.readyPromise;
    }

    this.readyPromise = new Promise((resolve, reject) => {
      logger.info('Spawning Context7 MCP server', {
        service: 'context7-process',
      });

      this.process = spawn('npx', ['-y', '@upstash/context7-mcp@latest'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          NODE_ENV: 'production',
        },
      });

      let buffer = '';

      this.process.stdout.on('data', (data) => {
        buffer += data.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.trim()) {
            try {
              const message = JSON.parse(line.trim());
              this.handleMessage(message);
            } catch {
              logger.warn('Non-JSON output from Context7', {
                service: 'context7-process',
                output: line.trim(),
              });
            }
          }
        }
      });

      this.process.stderr.on('data', (data) => {
        const message = data.toString().trim();
        if (message.includes('ready') || message.includes('listening')) {
          logger.info('Context7 MCP server ready', {
            service: 'context7-process',
          });
          this.isReady = true;
          resolve();
        } else {
          logger.info('Context7 log', {
            service: 'context7-process',
            message,
          });
        }
      });

      this.process.on('exit', (code) => {
        logger.info('Context7 process exited', {
          service: 'context7-process',
          exitCode: code,
        });
        this.isReady = false;
        this.process = null;

        for (const [, { reject }] of this.pendingRequests) {
          reject(new Error('Context7 process terminated'));
        }
        this.pendingRequests.clear();
      });

      this.process.on('error', (error) => {
        logMcpError(logger, 'Context7 process error', error, {
          service: 'context7-process',
        });
        reject(error);
      });
      globalThis.setTimeout(() => {
        this.sendInitialize();
      }, 2000);
    });

    return this.readyPromise;
  }

  sendInitialize() {
    logger.info('Sending initialize to Context7', {
      service: 'context7-process',
    });
    const initMessage = {
      jsonrpc: '2.0',
      id: this.nextMessageId(),
      method: 'initialize',
      params: {
        protocolVersion: '0.1.0',
        capabilities: {
          tools: {},
        },
        clientInfo: {
          name: 'context7-bridge',
          version: '1.0.0',
        },
      },
    };

    const messageId = initMessage.id;
    const initPromise = new Promise((resolve, reject) => {
      this.pendingRequests.set(messageId, { resolve, reject });

      globalThis.setTimeout(() => {
        if (this.pendingRequests.has(messageId)) {
          this.pendingRequests.delete(messageId);
          reject(new Error('Context7 initialization timeout'));
        }
      }, 10000);
    });

    this.sendMessage(initMessage);

    initPromise
      .then(() => {
        logger.info('Context7 initialized successfully', {
          service: 'context7-process',
        });
        this.isReady = true;
        globalThis.setTimeout(() => {
          this.sendMessage({
            jsonrpc: '2.0',
            method: 'notifications/initialized',
          });
        }, 100);
      })
      .catch((error) => {
        logMcpError(logger, error, {
          service: 'context7-process',
          operation: 'initialization',
        });
      });
  }

  nextMessageId() {
    return ++this.messageId;
  }

  sendMessage(message) {
    if (!this.process || !this.process.stdin.writable) {
      throw new Error('Context7 process not available');
    }

    const jsonMessage = JSON.stringify(message) + '\n';
    logger.debug('Sending message to Context7', {
      service: 'context7-process',
      method: message.method,
      id: message.id,
      message: jsonMessage.trim(),
    });
    this.process.stdin.write(jsonMessage);
  }

  handleMessage(message) {
    logger.debug('Received message from Context7', {
      service: 'context7-process',
      method: message.method,
      id: message.id,
      hasError: !!message.error,
    });

    if (message.id && this.pendingRequests.has(message.id)) {
      const { resolve, reject } = this.pendingRequests.get(message.id);
      this.pendingRequests.delete(message.id);

      if (message.error) {
        logMcpError(logger, message.error, {
          service: 'context7-process',
          requestId: message.id,
        });
        reject(new Error(message.error.message || 'Context7 error'));
        return;
      }

      logger.debug('Context7 success response', {
        service: 'context7-process',
        requestId: message.id,
      });
      resolve(message.result || message);
      return;
    }

    if (
      message.result &&
      message.result.serverInfo &&
      message.result.serverInfo.name === 'Context7'
    ) {
      logger.info('Context7 initialized successfully from serverInfo', {
        service: 'context7-process',
        serverInfo: message.result.serverInfo,
      });
      this.isReady = true;
      return;
    }

    switch (message.method) {
      case 'notifications/initialized':
        logger.info('Context7 initialized notification received', {
          service: 'context7-process',
        });
        this.isReady = true;
        break;
      default:
        if (message.method) {
          logger.debug('Context7 notification received', {
            service: 'context7-process',
            method: message.method,
          });
        } else if (message.id) {
          logger.warn('Received response for unknown request ID', {
            service: 'context7-process',
            requestId: message.id,
          });
        } else {
          logger.debug('Context7 message with no ID or method', {
            service: 'context7-process',
          });
        }
    }
  }

  async callTool(name, args) {
    if (!this.isReady) {
      await this.start();
    }

    const messageId = this.nextMessageId();
    const message = {
      jsonrpc: '2.0',
      id: messageId,
      method: 'tools/call',
      params: {
        name,
        arguments: args,
      },
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(messageId, { resolve, reject });

      globalThis.setTimeout(() => {
        if (this.pendingRequests.has(messageId)) {
          this.pendingRequests.delete(messageId);
          reject(new Error('Context7 request timeout'));
        }
      }, 30000);

      this.sendMessage(message);
    });
  }

  requestToolsList() {
    logger.info('Requesting tools list from Context7', {
      service: 'context7-process',
    });
    const toolsListMessage = {
      jsonrpc: '2.0',
      id: this.nextMessageId(),
      method: 'tools/list',
      params: {},
    };

    const messageId = toolsListMessage.id;
    const toolsPromise = new Promise((resolve, reject) => {
      this.pendingRequests.set(messageId, { resolve, reject });

      globalThis.setTimeout(() => {
        if (this.pendingRequests.has(messageId)) {
          this.pendingRequests.delete(messageId);
          reject(new Error('Context7 tools list timeout'));
        }
      }, 5000);
    });

    this.sendMessage(toolsListMessage);

    toolsPromise
      .then((result) => {
        logger.info('Context7 tools list received', {
          service: 'context7-process',
          toolsCount: result?.tools?.length || 0,
        });
      })
      .catch((error) => {
        logMcpError(logger, error, {
          service: 'context7-process',
          operation: 'tools-list',
        });
      });
  }

  async listTools() {
    if (!this.isReady) {
      await this.start();
    }

    const messageId = this.nextMessageId();
    const message = {
      jsonrpc: '2.0',
      id: messageId,
      method: 'tools/list',
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(messageId, { resolve, reject });

      globalThis.setTimeout(() => {
        if (this.pendingRequests.has(messageId)) {
          this.pendingRequests.delete(messageId);
          reject(new Error('Context7 list tools timeout'));
        }
      }, 10000);

      this.sendMessage(message);
    });
  }

  terminate() {
    if (this.process) {
      logger.info('Terminating Context7 process', {
        service: 'context7-process',
      });
      this.process.kill('SIGTERM');

      globalThis.setTimeout(() => {
        if (this.process) {
          logger.warn('Force killing Context7 process', {
            service: 'context7-process',
          });
          this.process.kill('SIGKILL');
        }
      }, 5000);
    }
  }
}

/**
 * Get or create a Context7 process instance
 */
function getContext7Process(sessionId = 'default') {
  if (!context7Processes.has(sessionId)) {
    const process = new Context7Process();
    context7Processes.set(sessionId, process);

    globalThis.setTimeout(
      () => {
        if (context7Processes.has(sessionId)) {
          const proc = context7Processes.get(sessionId);
          proc.terminate();
          context7Processes.delete(sessionId);
        }
      },
      10 * 60 * 1000
    );
  }

  return context7Processes.get(sessionId);
}

/**
 * Handle MCP request directly without SDK Server
 */
async function handleMcpRequest(request) {
  if (!request || !request.method) {
    throw new Error('Invalid request: missing method');
  }

  switch (request.method) {
    case 'initialize': {
      logger.info('MCP initialize request received', {
        protocolVersion: request.params?.protocolVersion,
        clientInfo: request.params?.clientInfo,
      });

      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          protocolVersion: '0.1.0',
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: 'context7-bridge',
            version: '1.0.0',
          },
        },
      };
    }

    case 'tools/list': {
      logger.info('MCP tools/list request received');

      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          tools: [
            {
              name: 'c41_resolve-library-id',
              description:
                'Resolve library names to Context7-compatible library IDs',
              inputSchema: {
                type: 'object',
                properties: {
                  libraryName: {
                    type: 'string',
                    description:
                      'Library name to search for and retrieve a Context7-compatible library ID',
                  },
                },
                required: ['libraryName'],
              },
            },
            {
              name: 'c41_get-library-docs',
              description: 'Fetch up-to-date library documentation',
              inputSchema: {
                type: 'object',
                properties: {
                  context7CompatibleLibraryID: {
                    type: 'string',
                    description:
                      'Exact Context7-compatible library ID (e.g., "/mongodb/docs", "/vercel/next.js")',
                  },
                  tokens: {
                    type: 'number',
                    description:
                      'Maximum number of tokens of documentation to retrieve',
                    default: 10000,
                  },
                  topic: {
                    type: 'string',
                    description:
                      'Topic to focus documentation on (e.g., "hooks", "routing")',
                  },
                },
                required: ['context7CompatibleLibraryID'],
              },
            },
          ],
        },
      };
    }

    case 'tools/call': {
      logMcpToolCall(
        logger,
        request.params?.name,
        'unknown',
        request.params?.arguments || {}
      );

      if (!request?.params?.name) {
        throw new Error('Missing tool name in request');
      }

      const { name, arguments: args } = request.params;

      switch (name) {
        case 'c41_resolve-library-id': {
          logger.info('Resolving library ID', {
            libraryName: args.libraryName,
          });

          try {
            const context7 = getContext7Process();
            logger.debug('Calling Context7 resolve-library-id tool');

            const result = await context7.callTool('resolve-library-id', {
              libraryName: args.libraryName,
            });

            logger.info('Context7 resolve-library-id completed', {
              libraryName: args.libraryName,
              hasContent: !!result.content,
              contentLength: result.content?.[0]?.text?.length || 0,
            });

            const responseText =
              result.content?.[0]?.text || JSON.stringify(result, null, 2);

            return {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [
                  {
                    type: 'text',
                    text: responseText,
                  },
                ],
              },
            };
          } catch (error) {
            logMcpError(logger, error, {
              libraryName: args.libraryName,
              tool: 'resolve-library-id',
            });

            const errorText = `Error resolving library ID for "${args.libraryName}": ${error.message}`;

            return {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [
                  {
                    type: 'text',
                    text: errorText,
                  },
                ],
              },
            };
          }
        }

        case 'c41_get-library-docs': {
          logger.info('Getting library documentation', {
            context7CompatibleLibraryID: args.context7CompatibleLibraryID,
            tokens: args.tokens || 10000,
            topic: args.topic,
          });

          try {
            const context7 = getContext7Process();
            logger.debug('Calling Context7 get-library-docs tool');

            const callArgs = {
              context7CompatibleLibraryID: args.context7CompatibleLibraryID,
              tokens: args.tokens || 10000,
            };

            if (args.topic) {
              callArgs.topic = args.topic;
            }

            const result = await context7.callTool(
              'get-library-docs',
              callArgs
            );

            logger.info('Context7 get-library-docs completed', {
              context7CompatibleLibraryID: args.context7CompatibleLibraryID,
              hasContent: !!result.content,
              contentLength: result.content?.[0]?.text?.length || 0,
            });

            const responseText =
              result.content?.[0]?.text || JSON.stringify(result, null, 2);

            return {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [
                  {
                    type: 'text',
                    text: responseText,
                  },
                ],
              },
            };
          } catch (error) {
            logMcpError(logger, error, {
              context7CompatibleLibraryID: args.context7CompatibleLibraryID,
              tool: 'get-library-docs',
            });

            const errorText = `Error getting documentation for "${args.context7CompatibleLibraryID}": ${error.message}`;

            return {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [
                  {
                    type: 'text',
                    text: errorText,
                  },
                ],
              },
            };
          }
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    }

    default:
      throw new Error(`Unknown method: ${request.method}`);
  }
}

/**
 * Setup MCP endpoints for proper Model Context Protocol communication
 */
function setupSessionRoutes() {
  app.post('/mcp', async (req, res) => {
    try {
      logMcpRequest(logger, req);

      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32600,
            message: 'Invalid Request - missing or invalid request body',
          },
          id: null,
        });
      }

      if (!req.body.jsonrpc || !req.body.method) {
        return res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32600,
            message: 'Invalid Request - missing jsonrpc or method field',
          },
          id: req.body.id || null,
        });
      }

      const sessionId = req.headers['mcp-session-id'] || randomUUID();

      if (!mcpSessions.has(sessionId)) {
        mcpSessions.set(sessionId, {
          createdAt: Date.now(),
        });
        logMcpSession(logger, 'created', sessionId);

        globalThis.setTimeout(
          () => {
            if (mcpSessions.has(sessionId)) {
              mcpSessions.delete(sessionId);
              logMcpSession(logger, 'cleaned up', sessionId);
            }
          },
          10 * 60 * 1000
        );
      }

      const response = await handleMcpRequest(req.body);

      res.setHeader('mcp-session-id', sessionId);
      res.json(response);
    } catch (error) {
      logMcpError(logger, error, {
        endpoint: '/mcp',
        method: 'POST',
      });

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

  app.get('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'];

    if (!sessionId || !mcpSessions.has(sessionId)) {
      return res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32600,
          message: 'Invalid or missing session ID',
        },
      });
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'mcp-session-id',
    });

    res.write('data: {"type":"connected"}\n\n');

    const keepAlive = globalThis.setInterval(() => {
      res.write('data: {"type":"ping"}\n\n');
    }, 30000);

    req.on('close', () => {
      globalThis.clearInterval(keepAlive);
    });
  });

  app.delete('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'];

    if (!sessionId || !mcpSessions.has(sessionId)) {
      return res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32600,
          message: 'Invalid or missing session ID',
        },
      });
    }

    mcpSessions.delete(sessionId);

    logMcpSession(logger, 'terminated', sessionId);
    res.status(200).json({
      jsonrpc: '2.0',
      result: { status: 'terminated' },
    });
  });
}

app.get('/health', (_req, res) => {
  const healthStatus = {
    status: 'healthy',
    server: 'context7-bridge',
    version: '1.0.0',
    activeSessions: mcpSessions.size,
    activeProcesses: context7Processes.size,
    timestamp: new Date().toISOString(),
  };

  logger.info('Health check requested', healthStatus);
  res.json(healthStatus);
});

/**
 * Start the server
 */
async function startServer() {
  const PORT = process.env.PORT || 3002;
  const host = process.env.HOST || '0.0.0.0';

  setupSessionRoutes();

  app.listen(PORT, host, () => {
    logger.info('Context7 HTTP Bridge started', {
      host,
      port: PORT,
      protocol: 'Model Context Protocol (MCP) HTTP Bridge',
      target: 'Context7 MCP Server (stdio)',
      endpoints: {
        mcp: 'POST /mcp - MCP protocol endpoint',
        mcpSse: 'GET /mcp - SSE notifications (with session-id header)',
        mcpDelete: 'DELETE /mcp - Session termination (with session-id header)',
        health: 'GET /health - Health check',
      },
      tools: [
        'c41_resolve-library-id - Resolve library names to Context7 IDs',
        'c41_get-library-docs - Fetch up-to-date library documentation',
      ],
    });
  });
}

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully');

  mcpSessions.clear();

  context7Processes.forEach((proc) => {
    proc.terminate();
  });

  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');

  mcpSessions.clear();

  context7Processes.forEach((proc) => {
    proc.terminate();
  });

  process.exit(0);
});

startServer().catch((error) => {
  logMcpError(logger, error, {
    operation: 'server-startup',
  });
  process.exit(1);
});
