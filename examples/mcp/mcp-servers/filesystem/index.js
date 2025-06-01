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

// Express app for HTTP transport
const app = express();
app.use(express.json());

// Map to store transports by session ID
const transports = {};

// Allowed directories (configurable via environment)
const allowedDirectories = (process.env.ALLOWED_DIRECTORIES || '/tmp').split(
  ','
);

console.info('Allowed directories:', allowedDirectories);

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
        console.info(`Reading file: ${filePath}`);
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
        console.error(`Failed to read file ${filePath}:`, error.message);

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
        console.info(`Writing to file: ${filePath}`);

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
        console.error(`Failed to write file ${filePath}:`, error.message);

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
        console.info(`Listing directory: ${dirPath}`);

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
              console.warn(
                `Could not get stats for ${entry.name}:`,
                error.message
              );
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
        console.error(`Failed to list directory ${dirPath}:`, error.message);

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
        console.info(`Creating directory: ${dirPath}`);

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
        console.error(`Failed to create directory ${dirPath}:`, error.message);

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
        console.info(`Deleting file: ${filePath}`);

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
        console.error(`Failed to delete file ${filePath}:`, error.message);

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
        console.info(
          `Deleting directory: ${dirPath} (recursive: ${recursive})`
        );

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
        console.error(`Failed to delete directory ${dirPath}:`, error.message);

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
        console.info(`Getting info for: ${filePath}`);

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
        console.error(`Failed to get info for ${filePath}:`, error.message);

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
      console.info('MCP POST request received:');
      console.info('  Headers: %s', JSON.stringify(req.headers, null, 2));
      console.info('  Body: %s', JSON.stringify(req.body, null, 2));

      const accept = req.headers.accept || req.headers.Accept;
      if (
        !accept ||
        !accept.includes('application/json') ||
        !accept.includes('text/event-stream')
      ) {
        console.info('Adding missing Accept headers for MCP compatibility');
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
            console.info(`MCP session initialized: ${newSessionId}`);
            transports[newSessionId] = transport;
          },
        });

        transport.onclose = () => {
          if (transport.sessionId) {
            console.info(`MCP session closed: ${transport.sessionId}`);
            delete transports[transport.sessionId];
          }
        };

        const server = createMcpServer();
        await server.connect(transport);
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

  console.info('Health check requested: %j', healthStatus);
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
    console.info(`MCP Filesystem server running on http://${host}:${port}`);
    console.info('Protocol: Model Context Protocol (MCP)');
    console.info('Transport: Streamable HTTP');
    console.info('Available endpoints:');
    console.info('  POST /mcp             - MCP protocol endpoint');
    console.info(
      '  GET  /mcp             - SSE notifications (with session-id header)'
    );
    console.info(
      '  DELETE /mcp           - Session termination (with session-id header)'
    );
    console.info('  GET  /health          - Health check');
    console.info('Available tools:');
    console.info('  - read_file           - Read content from a file');
    console.info('  - write_file          - Write content to a file');
    console.info('  - list_directory      - List directory contents');
    console.info('  - create_directory    - Create a new directory');
    console.info('  - delete_file         - Delete a file');
    console.info('  - delete_directory    - Delete a directory');
    console.info('  - file_info           - Get file or directory information');
    console.info('Allowed directories:', allowedDirectories);

    console.info('MCP Filesystem server ready for connections');
  });
}

process.on('SIGTERM', () => {
  console.info('Received SIGTERM, shutting down gracefully');
  Object.values(transports).forEach((transport) => {
    if (transport.close) transport.close();
  });
  process.exit(0);
});

process.on('SIGINT', () => {
  console.info('Received SIGINT, shutting down gracefully');
  Object.values(transports).forEach((transport) => {
    if (transport.close) transport.close();
  });
  process.exit(0);
});

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
