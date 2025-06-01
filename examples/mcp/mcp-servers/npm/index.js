/**
 * MCP NPM Server
 *
 * This is a Model Context Protocol (MCP) server that provides npm
 * operations. It uses the official MCP TypeScript SDK and implements
 * the proper MCP protocol with Streamable HTTP transport.
 *
 * Security: Only whitelisted npm commands are allowed for security.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import {
  createMcpLogger,
  logMcpRequest,
  logMcpSession,
  logMcpToolCall,
  logMcpError,
} from './logger.js';

const execAsync = promisify(exec);

// Create standardized logger
const logger = createMcpLogger('mcp-npm', '1.0.0');

// Express app for HTTP transport
const app = express();
app.use(express.json());

// Map to store transports by session ID
const transports = {};

// Working directory (configurable via environment)
const workingDirectory = process.env.WORKING_DIRECTORY || '/tmp';

// Whitelisted npm commands for security
const ALLOWED_NPM_COMMANDS = [
  'init',
  'install',
  'uninstall',
  'update',
  'list',
  'info',
  'search',
  'view',
  'outdated',
  'audit',
  'test',
  'run',
  'start',
  'build',
  'version',
  'npx',
];

logger.info('NPM MCP Server starting', {
  workingDirectory,
  allowedCommands: ALLOWED_NPM_COMMANDS,
});

/**
 * Validate npm command for security
 */
function validateNpmCommand(command) {
  const parts = command.trim().split(/\s+/);
  if (parts.length === 0) {
    throw new Error('Empty command');
  }

  // Remove 'npm' if it's the first part
  if (parts[0] === 'npm') {
    parts.shift();
  }

  if (parts.length === 0) {
    throw new Error('No npm command specified');
  }

  const npmCommand = parts[0];
  if (!ALLOWED_NPM_COMMANDS.includes(npmCommand)) {
    throw new Error(
      `Command '${npmCommand}' is not allowed. Allowed commands: ${ALLOWED_NPM_COMMANDS.join(', ')}`
    );
  }

  return parts.join(' ');
}

/**
 * Execute npm command safely
 */
async function executeNpmCommand(command, cwd = workingDirectory) {
  const validatedCommand = validateNpmCommand(command);
  const fullCommand = `npm ${validatedCommand}`;

  logger.info('Executing npm command', {
    command: fullCommand,
    workingDirectory: cwd,
  });

  try {
    const { stdout, stderr } = await execAsync(fullCommand, {
      cwd,
      timeout: 300000, // 5 minute timeout (increased from 30 seconds)
      maxBuffer: 1024 * 1024, // 1MB buffer
    });

    return {
      success: true,
      stdout: stdout || '',
      stderr: stderr || '',
      command: fullCommand,
      cwd,
    };
  } catch (error) {
    logMcpError(logger, error, {
      command: fullCommand,
      workingDirectory: cwd,
    });

    return {
      success: false,
      stdout: error.stdout || '',
      stderr: error.stderr || error.message,
      command: fullCommand,
      cwd,
      error: error.message,
    };
  }
}

/**
 * Create and configure the MCP server
 */
function createMcpServer() {
  const mcpServer = new McpServer({
    name: 'npm',
    version: '1.0.0',
  });

  // Tool: Run npm command
  mcpServer.tool(
    'npm_run',
    {
      command: z
        .string()
        .describe('The npm command to run (without "npm" prefix)'),
      cwd: z
        .string()
        .optional()
        .describe('Working directory (defaults to /tmp)'),
    },
    async ({ command, cwd }) => {
      const workDir = cwd || workingDirectory;

      logMcpToolCall(logger, 'npm_run', 'unknown', { command, cwd: workDir });

      try {
        const result = await executeNpmCommand(command, workDir);

        let responseText = `NPM Command: npm ${command}\n`;
        responseText += `Working Directory: ${workDir}\n`;
        responseText += `Status: ${result.success ? 'SUCCESS' : 'FAILED'}\n\n`;

        if (result.stdout) {
          responseText += `STDOUT:\n${result.stdout}\n\n`;
        }

        if (result.stderr) {
          responseText += `STDERR:\n${result.stderr}\n\n`;
        }

        if (!result.success && result.error) {
          responseText += `ERROR: ${result.error}\n`;
        }

        return {
          content: [
            {
              type: 'text',
              text: responseText,
            },
          ],
        };
      } catch (error) {
        logMcpError(logger, error, {
          tool: 'npm_run',
          command,
          workingDirectory: workDir,
        });

        return {
          content: [
            {
              type: 'text',
              text: `Failed to execute npm command: ${command}\nError: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Initialize new npm project
  mcpServer.tool(
    'npm_init',
    {
      name: z.string().describe('Project name'),
      cwd: z
        .string()
        .optional()
        .describe('Working directory (defaults to /tmp)'),
      yes: z.boolean().optional().describe('Skip prompts and use defaults'),
    },
    async ({ name, cwd, yes = true }) => {
      const workDir = cwd || workingDirectory;
      const projectDir = path.join(workDir, name);

      logMcpToolCall(logger, 'npm_init', 'unknown', {
        name,
        cwd: workDir,
        yes,
      });

      try {
        // Create project directory
        await execAsync(`mkdir -p "${projectDir}"`);

        // Initialize npm project
        const initCommand = yes ? 'init -y' : 'init';
        const result = await executeNpmCommand(initCommand, projectDir);

        let responseText = `NPM Project Initialization\n`;
        responseText += `Project Name: ${name}\n`;
        responseText += `Directory: ${projectDir}\n`;
        responseText += `Status: ${result.success ? 'SUCCESS' : 'FAILED'}\n\n`;

        if (result.stdout) {
          responseText += `STDOUT:\n${result.stdout}\n\n`;
        }

        if (result.stderr) {
          responseText += `STDERR:\n${result.stderr}\n\n`;
        }

        return {
          content: [
            {
              type: 'text',
              text: responseText,
            },
          ],
        };
      } catch (error) {
        logMcpError(logger, error, {
          tool: 'npm_init',
          projectName: name,
          workingDirectory: projectDir,
        });

        return {
          content: [
            {
              type: 'text',
              text: `Failed to initialize npm project: ${name}\nError: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Install npm packages
  mcpServer.tool(
    'npm_install',
    {
      packages: z
        .array(z.string())
        .optional()
        .describe('Packages to install (empty for package.json install)'),
      cwd: z
        .string()
        .optional()
        .describe('Working directory (defaults to /tmp)'),
      dev: z.boolean().optional().describe('Install as dev dependencies'),
      global: z.boolean().optional().describe('Install globally'),
    },
    async ({ packages = [], cwd, dev = false, global = false }) => {
      const workDir = cwd || workingDirectory;

      logMcpToolCall(logger, 'npm_install', 'unknown', {
        packages,
        cwd: workDir,
        dev,
        global,
      });

      try {
        let command = 'install';

        if (global) {
          command += ' -g';
        }

        if (dev) {
          command += ' --save-dev';
        }

        if (packages.length > 0) {
          command += ' ' + packages.join(' ');
        }

        const result = await executeNpmCommand(command, workDir);

        let responseText = `NPM Install\n`;
        responseText += `Working Directory: ${workDir}\n`;
        responseText += `Packages: ${packages.length > 0 ? packages.join(', ') : 'package.json dependencies'}\n`;
        responseText += `Dev Dependencies: ${dev}\n`;
        responseText += `Global: ${global}\n`;
        responseText += `Status: ${result.success ? 'SUCCESS' : 'FAILED'}\n\n`;

        if (result.stdout) {
          responseText += `STDOUT:\n${result.stdout}\n\n`;
        }

        if (result.stderr) {
          responseText += `STDERR:\n${result.stderr}\n\n`;
        }

        return {
          content: [
            {
              type: 'text',
              text: responseText,
            },
          ],
        };
      } catch (error) {
        logMcpError(logger, error, {
          tool: 'npm_install',
          packages,
          workingDirectory: workDir,
          dev,
          global,
        });

        return {
          content: [
            {
              type: 'text',
              text: `Failed to install npm packages\nError: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Create Next.js project
  mcpServer.tool(
    'create_nextjs_project',
    {
      name: z.string().describe('Project name for the Next.js application'),
      cwd: z
        .string()
        .optional()
        .describe('Working directory (defaults to /tmp)'),
      typescript: z
        .boolean()
        .optional()
        .describe('Use TypeScript (default: true)'),
      tailwind: z
        .boolean()
        .optional()
        .describe('Use Tailwind CSS (default: true)'),
      eslint: z.boolean().optional().describe('Use ESLint (default: true)'),
      appRouter: z
        .boolean()
        .optional()
        .describe('Use App Router (default: true)'),
      srcDir: z
        .boolean()
        .optional()
        .describe('Use src/ directory (default: false)'),
      importAlias: z
        .string()
        .optional()
        .describe('Import alias (default: @/*)'),
    },
    async ({
      name,
      cwd,
      typescript = true,
      tailwind = true,
      eslint = true,
      appRouter = true,
      srcDir = false,
      importAlias = '@/*',
    }) => {
      const workDir = cwd || workingDirectory;

      logMcpToolCall(logger, 'create_nextjs_project', 'unknown', {
        name,
        cwd: workDir,
        typescript,
        tailwind,
        eslint,
        appRouter,
        srcDir,
        importAlias,
      });

      try {
        // Build the npx create-next-app command with options
        let command = `npx create-next-app@latest "${name}" --yes`;

        // Add flags based on options
        if (typescript) {
          command += ' --typescript';
        } else {
          command += ' --javascript';
        }

        if (tailwind) {
          command += ' --tailwind';
        } else {
          command += ' --no-tailwind';
        }

        if (eslint) {
          command += ' --eslint';
        } else {
          command += ' --no-eslint';
        }

        if (appRouter) {
          command += ' --app';
        } else {
          command += ' --no-app';
        }

        if (srcDir) {
          command += ' --src-dir';
        } else {
          command += ' --no-src-dir';
        }

        if (importAlias && importAlias !== '@/*') {
          command += ` --import-alias "${importAlias}"`;
        }

        logger.info('Creating Next.js project', {
          command,
          workingDirectory: workDir,
          projectName: name,
          options: {
            typescript,
            tailwind,
            eslint,
            appRouter,
            srcDir,
            importAlias,
          },
        });

        const { stdout, stderr } = await execAsync(command, {
          cwd: workDir,
          timeout: 600000, // 10 minute timeout for project creation (increased from 3 minutes)
          maxBuffer: 1024 * 1024 * 5, // 5MB buffer
        });

        let responseText = `Next.js Project Creation\n`;
        responseText += `Project Name: ${name}\n`;
        responseText += `Directory: ${path.join(workDir, name)}\n`;
        responseText += `TypeScript: ${typescript}\n`;
        responseText += `Tailwind CSS: ${tailwind}\n`;
        responseText += `ESLint: ${eslint}\n`;
        responseText += `App Router: ${appRouter}\n`;
        responseText += `Source Directory: ${srcDir}\n`;
        responseText += `Import Alias: ${importAlias}\n`;
        responseText += `Status: SUCCESS\n\n`;

        if (stdout) {
          responseText += `STDOUT:\n${stdout}\n\n`;
        }

        if (stderr) {
          responseText += `STDERR:\n${stderr}\n\n`;
        }

        responseText += `Next.js project '${name}' created successfully!\n`;
        responseText += `To get started:\n`;
        responseText += `  cd ${name}\n`;
        responseText += `  npm run dev\n`;

        return {
          content: [
            {
              type: 'text',
              text: responseText,
            },
          ],
        };
      } catch (error) {
        logMcpError(logger, error, {
          tool: 'create_nextjs_project',
          projectName: name,
          workingDirectory: workDir,
        });

        return {
          content: [
            {
              type: 'text',
              text: `Failed to create Next.js project: ${name}\nError: ${error.message}\nSTDOUT: ${error.stdout || 'N/A'}\nSTDERR: ${error.stderr || 'N/A'}`,
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
      logMcpRequest(logger, req);

      // Fix missing Accept headers for compatibility with Go MCP clients
      const accept = req.headers.accept || req.headers.Accept;
      if (
        !accept ||
        !accept.includes('application/json') ||
        !accept.includes('text/event-stream')
      ) {
        logger.debug('Adding missing Accept headers for MCP compatibility');
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
            logMcpSession(logger, 'initialized', newSessionId);
            // Store the transport by session ID
            transports[newSessionId] = transport;
          },
        });

        // Clean up transport when closed
        transport.onclose = () => {
          if (transport.sessionId) {
            logMcpSession(logger, 'closed', transport.sessionId);
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
 * Health check endpoint
 */
function setupHealthCheck() {
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      server: 'mcp-npm',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      workingDirectory,
      allowedCommands: ALLOWED_NPM_COMMANDS,
    });
  });
}

/**
 * Start the server
 */
async function startServer() {
  const port = process.env.PORT || 3003;

  // Setup routes
  setupSessionRoutes();
  setupHealthCheck();

  app.listen(port, '0.0.0.0', () => {
    logger.info('MCP NPM Server started successfully', {
      host: '0.0.0.0',
      port,
      endpoints: {
        mcp: 'POST /mcp - MCP protocol communication',
        mcpSse: 'GET /mcp - MCP SSE notifications',
        mcpDelete: 'DELETE /mcp - MCP session termination',
        health: 'GET /health - Health check',
      },
      tools: [
        'npm_run - Run any whitelisted npm command',
        'npm_init - Initialize a new npm project',
        'npm_install - Install npm packages',
        'create_nextjs_project - Create a new Next.js project',
      ],
      workingDirectory,
      allowedCommands: ALLOWED_NPM_COMMANDS,
    });
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  // Close all transports
  Object.values(transports).forEach((transport) => {
    if (transport.close) transport.close();
  });
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');
  // Close all transports
  Object.values(transports).forEach((transport) => {
    if (transport.close) transport.close();
  });
  process.exit(0);
});

// Start the server
startServer().catch((error) => {
  logMcpError(logger, error, {
    operation: 'server-startup',
  });
  process.exit(1);
});
