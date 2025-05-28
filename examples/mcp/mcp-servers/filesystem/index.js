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
const allowedDirectories = (
  process.env.ALLOWED_DIRECTORIES || '/shared,/tmp'
).split(',');

console.log('Allowed directories:', allowedDirectories);

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

  // Tool: Read file content
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
        console.log(`Reading file: ${filePath}`);
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

  // Tool: Write file content
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
        console.log(`Writing to file: ${filePath}`);

        // Ensure directory exists
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

  // Tool: List directory contents
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
        console.log(`Listing directory: ${dirPath}`);

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

  // Tool: Create directory
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
        console.log(`Creating directory: ${dirPath}`);

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

  // Tool: Delete file
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
        console.log(`Deleting file: ${filePath}`);

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

  // Tool: Get file info
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
        console.log(`Getting info for: ${filePath}`);

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
}

/**
 * Initialize sample files
 */
async function initializeSampleFiles() {
  try {
    // Create sample files in allowed directories
    for (const dir of allowedDirectories) {
      try {
        await fs.access(dir);

        const sampleFile = path.join(dir, 'mcp-filesystem-example.txt');
        const sampleContent = `Hello from MCP Filesystem Server!

This is a sample file created by the MCP Filesystem Server.
Created at: ${new Date().toISOString()}

You can use the following MCP tools to interact with this file:
- read_file: Read this file's content
- write_file: Modify this file
- file_info: Get detailed information about this file
- list_directory: List all files in this directory
- delete_file: Delete this file

Available directories: ${allowedDirectories.join(', ')}
`;

        await fs.writeFile(sampleFile, sampleContent);
        console.log(`Created sample file: ${sampleFile}`);
      } catch (error) {
        console.log(`Could not create sample file in ${dir}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Error initializing sample files:', error);
  }
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

  console.log('Health check requested:', healthStatus);
  res.json(healthStatus);
});

/**
 * Start the server
 */
async function startServer() {
  const port = process.env.PORT || 3000;
  const host = process.env.HOST || '0.0.0.0';

  // Set up session routes
  setupSessionRoutes();

  app.listen(port, host, async () => {
    console.log(`MCP Filesystem server running on http://${host}:${port}`);
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
    console.log('  - read_file           - Read content from a file');
    console.log('  - write_file          - Write content to a file');
    console.log('  - list_directory      - List directory contents');
    console.log('  - create_directory    - Create a new directory');
    console.log('  - delete_file         - Delete a file');
    console.log('  - move_file           - Move/rename a file');
    console.log('Allowed directories:', allowedDirectories);

    // Initialize sample files
    await initializeSampleFiles();

    console.log('MCP Filesystem server ready for connections');
  });
}

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

// Start the server
startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
