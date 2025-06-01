/**
 * MCP Filesystem Server
 *
 * This is a Model Context Protocol (MCP) server that provides filesystem
 * operations. It uses the official MCP TypeScript SDK and implements
 * the proper MCP protocol with Streamable HTTP transport.
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

// Express app for HTTP transport
const app = express();
app.use(express.json());

// Create standardized logger
const logger = createMcpLogger('mcp-filesystem', '1.0.0');

// Map to store transports by session ID
const transports = {};

// Allowed directories (configurable via environment)
const allowedDirectories = (process.env.ALLOWED_DIRECTORIES || '/tmp').split(
  ','
);

logger.info('Filesystem server starting', {
  allowedDirectories,
});

/**
 * Check if a path is within allowed directories
 */
function isPathAllowed(filePath) {
  const normalizedPath = path.resolve(filePath);
  return allowedDirectories.some((allowedDir) => {
    const normalizedAllowed = path.resolve(allowedDir);
    return normalizedPath.startsWith(normalizedAllowed);
  });
}

/**
 * Create and configure the MCP server
 */
function createMcpServer() {
  const mcpServer = new McpServer({
    name: 'filesystem',
    version: '1.0.0',
  });

  mcpServer.tool(
    'read_file',
    {
      path: z.string().describe('The file path to read'),
    },
    async ({ path: filePath }) => {
      if (!isPathAllowed(filePath)) {
        throw new Error(
          `Access denied: ${filePath} is not in allowed directories`
        );
      }

      try {
        logMcpToolCall(logger, 'read_file', { filePath });
        const content = await fs.readFile(filePath, 'utf8');

        return {
          content: [
            {
              type: 'text',
              text: `File: ${filePath}\nSize: ${content.length} characters\n\nContent:\n${content}`,
            },
          ],
        };
      } catch (error) {
        logMcpError(logger, error, { filePath, operation: 'read_file' });

        let errorMessage = `Failed to read file: ${filePath}\n`;
        if (error.code === 'ENOENT') {
          errorMessage += 'File does not exist';
        } else if (error.code === 'EACCES') {
          errorMessage += 'Permission denied';
        } else if (error.code === 'EISDIR') {
          errorMessage += 'Path is a directory, not a file';
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

  mcpServer.tool(
    'write_file',
    {
      path: z.string().describe('The file path to write to'),
      content: z.string().describe('The content to write to the file'),
    },
    async ({ path: filePath, content }) => {
      if (!isPathAllowed(filePath)) {
        throw new Error(
          `Access denied: ${filePath} is not in allowed directories`
        );
      }

      try {
        logMcpToolCall(logger, 'write_file', {
          filePath,
          contentLength: content.length,
        });

        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });

        await fs.writeFile(filePath, content, 'utf8');

        return {
          content: [
            {
              type: 'text',
              text: `Successfully wrote ${content.length} characters to: ${filePath}`,
            },
          ],
        };
      } catch (error) {
        logMcpError(logger, error, { filePath, operation: 'write_file' });

        return {
          content: [
            {
              type: 'text',
              text: `Failed to write file: ${filePath}\nError: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  mcpServer.tool(
    'list_directory',
    {
      path: z.string().describe('The directory path to list'),
    },
    async ({ path: dirPath }) => {
      if (!isPathAllowed(dirPath)) {
        throw new Error(
          `Access denied: ${dirPath} is not in allowed directories`
        );
      }

      try {
        logMcpToolCall(logger, 'list_directory', { dirPath });

        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        const items = await Promise.all(
          entries.map(async (entry) => {
            const fullPath = path.join(dirPath, entry.name);
            try {
              const stats = await fs.stat(fullPath);
              return {
                name: entry.name,
                type: entry.isDirectory() ? 'directory' : 'file',
                size: stats.size,
                modified: stats.mtime.toISOString(),
              };
            } catch (error) {
              logger.warn('Could not get stats for entry', {
                entryName: entry.name,
                dirPath,
                error: error.message,
              });
              return {
                name: entry.name,
                type: entry.isDirectory() ? 'directory' : 'file',
                size: 'unknown',
                modified: 'unknown',
              };
            }
          })
        );

        const result =
          `Directory: ${dirPath}\nTotal items: ${items.length}\n\n` +
          items
            .map(
              (item) =>
                `${item.type === 'directory' ? '📁' : '📄'} ${item.name} (${item.size} bytes, modified: ${item.modified})`
            )
            .join('\n');

        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      } catch (error) {
        logMcpError(logger, error, { dirPath, operation: 'list_directory' });

        let errorMessage = `Failed to list directory: ${dirPath}\n`;
        if (error.code === 'ENOENT') {
          errorMessage += 'Directory does not exist';
        } else if (error.code === 'EACCES') {
          errorMessage += 'Permission denied';
        } else if (error.code === 'ENOTDIR') {
          errorMessage += 'Path is not a directory';
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

  mcpServer.tool(
    'create_directory',
    {
      path: z.string().describe('The directory path to create'),
    },
    async ({ path: dirPath }) => {
      if (!isPathAllowed(dirPath)) {
        throw new Error(
          `Access denied: ${dirPath} is not in allowed directories`
        );
      }

      try {
        logMcpToolCall(logger, 'create_directory', { dirPath });

        await fs.mkdir(dirPath, { recursive: true });

        return {
          content: [
            {
              type: 'text',
              text: `Successfully created directory: ${dirPath}`,
            },
          ],
        };
      } catch (error) {
        logMcpError(logger, error, { dirPath, operation: 'create_directory' });

        return {
          content: [
            {
              type: 'text',
              text: `Failed to create directory: ${dirPath}\nError: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  mcpServer.tool(
    'delete_file',
    {
      path: z.string().describe('The file path to delete'),
    },
    async ({ path: filePath }) => {
      if (!isPathAllowed(filePath)) {
        throw new Error(
          `Access denied: ${filePath} is not in allowed directories`
        );
      }

      try {
        logMcpToolCall(logger, 'delete_file', { filePath });

        await fs.unlink(filePath);

        return {
          content: [
            {
              type: 'text',
              text: `Successfully deleted file: ${filePath}`,
            },
          ],
        };
      } catch (error) {
        logMcpError(logger, error, { filePath, operation: 'delete_file' });

        let errorMessage = `Failed to delete file: ${filePath}\n`;
        if (error.code === 'ENOENT') {
          errorMessage += 'File does not exist';
        } else if (error.code === 'EACCES') {
          errorMessage += 'Permission denied';
        } else if (error.code === 'EISDIR') {
          errorMessage +=
            'Path is a directory, use remove directory tool instead';
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

  mcpServer.tool(
    'delete_directory',
    {
      path: z.string().describe('The directory path to delete'),
      recursive: z
        .boolean()
        .optional()
        .describe('Whether to delete recursively (default: false)'),
    },
    async ({ path: dirPath, recursive = false }) => {
      if (!isPathAllowed(dirPath)) {
        throw new Error(
          `Access denied: ${dirPath} is not in allowed directories`
        );
      }

      try {
        logMcpToolCall(logger, 'delete_directory', {
          dirPath,
          recursive,
        });

        if (recursive) {
          await fs.rm(dirPath, { recursive: true, force: true });
        } else {
          await fs.rmdir(dirPath);
        }

        return {
          content: [
            {
              type: 'text',
              text: `Successfully deleted directory: ${dirPath}`,
            },
          ],
        };
      } catch (error) {
        logMcpError(logger, error, {
          dirPath,
          recursive,
          operation: 'delete_directory',
        });

        let errorMessage = `Failed to delete directory: ${dirPath}\n`;
        if (error.code === 'ENOENT') {
          errorMessage += 'Directory does not exist';
        } else if (error.code === 'EACCES') {
          errorMessage += 'Permission denied';
        } else if (error.code === 'ENOTDIR') {
          errorMessage += 'Path is not a directory';
        } else if (error.code === 'ENOTEMPTY') {
          errorMessage +=
            'Directory is not empty (use recursive option to delete non-empty directories)';
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

  mcpServer.tool(
    'file_info',
    {
      path: z.string().describe('The file or directory path to get info for'),
    },
    async ({ path: filePath }) => {
      if (!isPathAllowed(filePath)) {
        throw new Error(
          `Access denied: ${filePath} is not in allowed directories`
        );
      }

      try {
        logMcpToolCall(logger, 'file_info', { filePath });

        const stats = await fs.stat(filePath);

        const info = {
          path: filePath,
          type: stats.isDirectory() ? 'directory' : 'file',
          size: stats.size,
          created: stats.birthtime.toISOString(),
          modified: stats.mtime.toISOString(),
          accessed: stats.atime.toISOString(),
          permissions: stats.mode.toString(8),
          isReadable: !!(stats.mode & parseInt('444', 8)),
          isWritable: !!(stats.mode & parseInt('222', 8)),
          isExecutable: !!(stats.mode & parseInt('111', 8)),
        };

        const result =
          `File Information:\n\n` +
          `Path: ${info.path}\n` +
          `Type: ${info.type}\n` +
          `Size: ${info.size} bytes\n` +
          `Created: ${info.created}\n` +
          `Modified: ${info.modified}\n` +
          `Accessed: ${info.accessed}\n` +
          `Permissions: ${info.permissions}\n` +
          `Readable: ${info.isReadable}\n` +
          `Writable: ${info.isWritable}\n` +
          `Executable: ${info.isExecutable}`;

        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      } catch (error) {
        logMcpError(logger, error, { filePath, operation: 'file_info' });

        let errorMessage = `Failed to get file info: ${filePath}\n`;
        if (error.code === 'ENOENT') {
          errorMessage += 'File or directory does not exist';
        } else if (error.code === 'EACCES') {
          errorMessage += 'Permission denied';
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

  return mcpServer;
}

/**
 * Setup MCP endpoints for proper Model Context Protocol communication
 */
function setupSessionRoutes() {
  // Handle POST requests for MCP communication
  app.post('/mcp', async (req, res) => {
    try {
      logMcpRequest(logger, req, 'MCP POST request received');

      const accept = req.headers.accept || req.headers.Accept;
      if (
        !accept ||
        !accept.includes('application/json') ||
        !accept.includes('text/event-stream')
      ) {
        logger.debug('Adding missing Accept headers for MCP compatibility');
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
            logMcpSession(logger, 'initialized', { sessionId: newSessionId });
            transports[newSessionId] = transport;
          },
        });

        transport.onclose = () => {
          if (transport.sessionId) {
            logMcpSession(logger, 'closed', { sessionId: transport.sessionId });
            delete transports[transport.sessionId];
          }
        };

        const server = createMcpServer();
        await server.connect(transport);
      }

      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      logMcpError(logger, error, { operation: 'mcp_request_handling' });
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
}

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    allowedDirectories,
    service: 'mcp-filesystem',
    version: '1.0.0',
    activeSessions: Object.keys(transports).length,
  };

  logger.info('Health check requested', healthStatus);
  res.json(healthStatus);
});

/**
 * Start the server
 */
async function startServer() {
  const port = process.env.PORT || 3000;
  const host = process.env.HOST || '0.0.0.0';

  setupSessionRoutes();

  app.listen(port, host, async () => {
    logger.info('MCP Filesystem server started', {
      host,
      port,
      protocol: 'Model Context Protocol (MCP)',
      transport: 'Streamable HTTP',
      endpoints: {
        mcp: 'POST /mcp - MCP protocol endpoint',
        mcpSSE: 'GET /mcp - SSE notifications (with session-id header)',
        mcpTerminate:
          'DELETE /mcp - Session termination (with session-id header)',
        health: 'GET /health - Health check',
      },
      tools: [
        'read_file - Read content from a file',
        'write_file - Write content to a file',
        'list_directory - List directory contents',
        'create_directory - Create a new directory',
        'delete_file - Delete a file',
        'delete_directory - Delete a directory',
        'file_info - Get file or directory information',
      ],
      allowedDirectories,
    });

    logger.info('MCP Filesystem server ready for connections');
  });
}

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

startServer().catch((error) => {
  logMcpError(logger, error, { operation: 'server_startup' });
  process.exit(1);
});
