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

// Express app for HTTP transport
const app = express();
app.use(express.json());
app.use(cors());

// Map to store MCP sessions
const mcpSessions = new Map();

// Context7 process instances cache
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
      console.info('🚀 Spawning Context7 MCP server...');

      // Spawn the real Context7 MCP server
      this.process = spawn('npx', ['-y', '@upstash/context7-mcp@latest'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          NODE_ENV: 'production',
        },
      });

      let buffer = '';

      // Handle stdout - MCP protocol messages
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
              console.warn('📝 Non-JSON output from Context7:', line.trim());
            }
          }
        }
      });

      // Handle stderr - logs and errors
      this.process.stderr.on('data', (data) => {
        const message = data.toString().trim();
        if (message.includes('ready') || message.includes('listening')) {
          console.info('✅ Context7 MCP server ready');
          this.isReady = true;
          resolve();
        } else {
          console.info('📝 Context7 log:', message);
        }
      });

      // Handle process exit
      this.process.on('exit', (code) => {
        console.info(`🔚 Context7 process exited with code ${code}`);
        this.isReady = false;
        this.process = null;

        // Reject all pending requests
        for (const [, { reject }] of this.pendingRequests) {
          reject(new Error('Context7 process terminated'));
        }
        this.pendingRequests.clear();
      });

      // Handle errors
      this.process.on('error', (error) => {
        console.error('❌ Context7 process error:', error);
        reject(error);
      }); // Initialize the MCP session
      globalThis.setTimeout(() => {
        this.sendInitialize();
      }, 2000);
    });

    return this.readyPromise;
  }

  sendInitialize() {
    console.info('🔧 Sending initialize to Context7...');
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

    // Track this request properly
    const messageId = initMessage.id;
    const initPromise = new Promise((resolve, reject) => {
      this.pendingRequests.set(messageId, { resolve, reject });

      // Set timeout for initialization
      globalThis.setTimeout(() => {
        if (this.pendingRequests.has(messageId)) {
          this.pendingRequests.delete(messageId);
          reject(new Error('Context7 initialization timeout'));
        }
      }, 10000);
    });

    this.sendMessage(initMessage);

    // Handle the initialization response
    initPromise
      .then(() => {
        console.info('✅ Context7 initialized successfully');
        this.isReady = true;
        // Send initialized notification after successful init
        globalThis.setTimeout(() => {
          this.sendMessage({
            jsonrpc: '2.0',
            method: 'notifications/initialized',
          });
        }, 100);
      })
      .catch((error) => {
        console.error('❌ Context7 initialization failed:', error);
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
    console.info('📤 Sending to Context7:', JSON.stringify(message, null, 2));
    this.process.stdin.write(jsonMessage);
  }

  handleMessage(message) {
    console.info(
      '📥 Received from Context7:',
      JSON.stringify(message, null, 2)
    );

    // Handle responses to our requests
    if (message.id && this.pendingRequests.has(message.id)) {
      const { resolve, reject } = this.pendingRequests.get(message.id);
      this.pendingRequests.delete(message.id);

      if (message.error) {
        console.error('❌ Context7 error response:', message.error);
        reject(new Error(message.error.message || 'Context7 error'));
        return;
      }

      console.info('✅ Context7 success response for ID', message.id);
      resolve(message.result || message);
      return;
    }

    // Special handling for initialization - Context7 doesn't send notifications/initialized
    if (
      message.result &&
      message.result.serverInfo &&
      message.result.serverInfo.name === 'Context7'
    ) {
      console.info(
        '✅ Context7 initialized successfully (detected from serverInfo)'
      );
      this.isReady = true;
      return;
    }

    // Handle specific notifications and responses
    switch (message.method) {
      case 'notifications/initialized':
        console.info('✅ Context7 initialized notification received');
        this.isReady = true;
        break;
      default:
        if (message.method) {
          console.info('📢 Context7 notification/method:', message.method);
        } else if (message.id) {
          console.warn(
            '⚠️  Received response for unknown request ID:',
            message.id
          );
        } else {
          console.info('ℹ️  Context7 message (no ID or method)');
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

      // Set timeout for the request
      globalThis.setTimeout(() => {
        if (this.pendingRequests.has(messageId)) {
          this.pendingRequests.delete(messageId);
          reject(new Error('Context7 request timeout'));
        }
      }, 30000); // 30 second timeout

      this.sendMessage(message);
    });
  }

  requestToolsList() {
    console.info('🔍 Requesting tools list from Context7...');
    const toolsListMessage = {
      jsonrpc: '2.0',
      id: this.nextMessageId(),
      method: 'tools/list',
      params: {},
    };

    // Track this request properly
    const messageId = toolsListMessage.id;
    const toolsPromise = new Promise((resolve, reject) => {
      this.pendingRequests.set(messageId, { resolve, reject });

      // Set timeout for tools list request
      globalThis.setTimeout(() => {
        if (this.pendingRequests.has(messageId)) {
          this.pendingRequests.delete(messageId);
          reject(new Error('Context7 tools list timeout'));
        }
      }, 5000);
    });

    this.sendMessage(toolsListMessage);

    // Handle the tools list response
    toolsPromise
      .then((result) => {
        console.info(
          '✅ Context7 tools list received:',
          JSON.stringify(result, null, 2)
        );
      })
      .catch((error) => {
        console.error('❌ Context7 tools list failed:', error);
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
      console.info('🔄 Terminating Context7 process...');
      this.process.kill('SIGTERM');

      // Force kill after 5 seconds
      globalThis.setTimeout(() => {
        if (this.process) {
          console.info('🔪 Force killing Context7 process...');
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

    // Clean up after 10 minutes of inactivity
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
      console.info(
        '🔧 MCP initialize request:',
        JSON.stringify(request, null, 2)
      );

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
      console.info('📋 MCP tools/list request');

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
      console.info(
        '🔧 MCP tools/call request:',
        JSON.stringify(request, null, 2)
      );

      if (!request?.params?.name) {
        throw new Error('Missing tool name in request');
      }

      const { name, arguments: args } = request.params;

      switch (name) {
        case 'c41_resolve-library-id': {
          console.info(`🔍 Resolving library ID for: ${args.libraryName}`);
          console.info(`📝 Input arguments:`, JSON.stringify(args, null, 2));

          try {
            const context7 = getContext7Process();
            console.info(`🚀 Calling Context7 resolve-library-id tool...`);

            const result = await context7.callTool('resolve-library-id', {
              libraryName: args.libraryName,
            });

            console.info(
              `✅ Context7 resolve-library-id raw result:`,
              JSON.stringify(result, null, 2)
            );
            console.info(`📊 Result structure analysis:`);
            console.info(`  - Result type: ${typeof result}`);
            console.info(
              `  - Has content array: ${Array.isArray(result.content)}`
            );
            console.info(`  - Content length: ${result.content?.length || 0}`);

            if (result.content?.[0]) {
              console.info(
                `  - First content item type: ${result.content[0].type}`
              );
              console.info(
                `  - First content text length: ${result.content[0].text?.length || 0}`
              );
              console.info(
                `  - First content text preview: ${result.content[0].text?.substring(0, 200)}...`
              );
            }

            const responseText =
              result.content?.[0]?.text || JSON.stringify(result, null, 2);
            console.info(
              `📤 Sending response text (${responseText.length} chars):`,
              responseText.substring(0, 500) +
                (responseText.length > 500 ? '...' : '')
            );

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
            console.error('❌ Error resolving library ID:', error);
            console.error('❌ Error stack:', error.stack);
            console.error('❌ Error details:', {
              name: error.name,
              message: error.message,
              cause: error.cause,
            });

            const errorText = `Error resolving library ID for "${args.libraryName}": ${error.message}`;
            console.info(`📤 Sending error response:`, errorText);

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
          console.info(
            `📚 Getting documentation for: ${args.context7CompatibleLibraryID}`
          );
          console.info(`📝 Input arguments:`, JSON.stringify(args, null, 2));

          try {
            const context7 = getContext7Process();
            console.info(`🚀 Calling Context7 get-library-docs tool...`);

            const callArgs = {
              context7CompatibleLibraryID: args.context7CompatibleLibraryID,
              tokens: args.tokens || 10000,
            };

            if (args.topic) {
              callArgs.topic = args.topic;
            }

            console.info(
              `📝 Context7 call arguments:`,
              JSON.stringify(callArgs, null, 2)
            );

            const result = await context7.callTool(
              'get-library-docs',
              callArgs
            );

            console.info(
              `✅ Context7 get-library-docs raw result:`,
              JSON.stringify(result, null, 2)
            );
            console.info(`📊 Result structure analysis:`);
            console.info(`  - Result type: ${typeof result}`);
            console.info(
              `  - Has content array: ${Array.isArray(result.content)}`
            );
            console.info(`  - Content length: ${result.content?.length || 0}`);

            if (result.content?.[0]) {
              console.info(
                `  - First content item type: ${result.content[0].type}`
              );
              console.info(
                `  - First content text length: ${result.content[0].text?.length || 0}`
              );
              console.info(
                `  - First content text preview: ${result.content[0].text?.substring(0, 200)}...`
              );
            }

            const responseText =
              result.content?.[0]?.text || JSON.stringify(result, null, 2);
            console.info(
              `📤 Sending response text (${responseText.length} chars):`,
              responseText.substring(0, 500) +
                (responseText.length > 500 ? '...' : '')
            );

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
            console.error('❌ Error getting library documentation:', error);
            console.error('❌ Error stack:', error.stack);
            console.error('❌ Error details:', {
              name: error.name,
              message: error.message,
              cause: error.cause,
            });

            const errorText = `Error getting documentation for "${args.context7CompatibleLibraryID}": ${error.message}`;
            console.info(`📤 Sending error response:`, errorText);

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
  // Handle POST requests for MCP communication
  app.post('/mcp', async (req, res) => {
    try {
      console.info('📨 MCP POST request received:');
      console.info('  Headers: %s', JSON.stringify(req.headers, null, 2));
      console.info('  Body: %s', JSON.stringify(req.body, null, 2));

      // Validate request body
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

      // Get or create session
      const sessionId = req.headers['mcp-session-id'] || randomUUID();

      if (!mcpSessions.has(sessionId)) {
        mcpSessions.set(sessionId, {
          createdAt: Date.now(),
        });
        console.info(`🎯 MCP session created: ${sessionId}`);

        // Set session cleanup timer
        globalThis.setTimeout(
          () => {
            if (mcpSessions.has(sessionId)) {
              mcpSessions.delete(sessionId);
              console.info(`🧹 Cleaned up session: ${sessionId}`);
            }
          },
          10 * 60 * 1000
        ); // 10 minutes
      }

      // Handle the MCP request
      const response = await handleMcpRequest(req.body);

      // Set session ID header in response
      res.setHeader('mcp-session-id', sessionId);
      res.json(response);
    } catch (error) {
      console.error('❌ Error handling MCP request:', error);

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

  // Handle GET requests for SSE (server-to-client notifications)
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

    // Set up SSE stream
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'mcp-session-id',
    });

    res.write('data: {"type":"connected"}\n\n');

    // Keep connection alive
    const keepAlive = globalThis.setInterval(() => {
      res.write('data: {"type":"ping"}\n\n');
    }, 30000);

    req.on('close', () => {
      globalThis.clearInterval(keepAlive);
    });
  });

  // Handle DELETE requests for session termination
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

    // Clean up session
    mcpSessions.delete(sessionId);

    console.info(`🗑️ Session terminated: ${sessionId}`);
    res.status(200).json({
      jsonrpc: '2.0',
      result: { status: 'terminated' },
    });
  });
}

// Health check endpoint
app.get('/health', (_req, res) => {
  const healthStatus = {
    status: 'healthy',
    server: 'context7-bridge',
    version: '1.0.0',
    activeSessions: mcpSessions.size,
    activeProcesses: context7Processes.size,
    timestamp: new Date().toISOString(),
  };

  console.info('💚 Health check requested: %j', healthStatus);
  res.json(healthStatus);
});

/**
 * Start the server
 */
async function startServer() {
  const PORT = process.env.PORT || 3002;
  const host = process.env.HOST || '0.0.0.0';

  // Set up session routes
  setupSessionRoutes();

  app.listen(PORT, host, () => {
    console.info(`🌉 Context7 HTTP Bridge running on http://${host}:${PORT}`);
    console.info('📋 Protocol: Model Context Protocol (MCP) HTTP Bridge');
    console.info('🎯 Target: Context7 MCP Server (stdio)');
    console.info('🔗 Available endpoints:');
    console.info('  POST /mcp             - MCP protocol endpoint');
    console.info(
      '  GET  /mcp             - SSE notifications (with session-id header)'
    );
    console.info(
      '  DELETE /mcp           - Session termination (with session-id header)'
    );
    console.info('  GET  /health          - Health check');
    console.info('🛠️  Available tools:');
    console.info(
      '  - c41_resolve-library-id  - Resolve library names to Context7 IDs'
    );
    console.info(
      '  - c41_get-library-docs    - Fetch up-to-date library documentation'
    );
    console.info('🚀 Bridge ready for connections');
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.info('🔄 Received SIGTERM, shutting down gracefully');

  // Clear all MCP sessions
  mcpSessions.clear();

  // Terminate all Context7 processes
  context7Processes.forEach((proc) => {
    proc.terminate();
  });

  process.exit(0);
});

process.on('SIGINT', () => {
  console.info('🔄 Received SIGINT, shutting down gracefully');

  // Clear all MCP sessions
  mcpSessions.clear();

  // Terminate all Context7 processes
  context7Processes.forEach((proc) => {
    proc.terminate();
  });

  process.exit(0);
});

// Start the server
startServer().catch((error) => {
  console.error('💥 Failed to start server:', error);
  process.exit(1);
});
