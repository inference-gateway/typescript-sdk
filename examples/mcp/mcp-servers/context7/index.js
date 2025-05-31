/**
 * MCP Context7 Server
 *
 * This is a Model Context Protocol (MCP) server that provides library
 * documentation and context resolution capabilities. It demonstrates how to
 * build tools for fetching up-to-date documentation and resolving library IDs.
 * It uses the official MCP TypeScript SDK and implements the proper MCP protocol
 * with Streamable HTTP transport.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

// Express app for HTTP transport
const app = express();
app.use(express.json());

// Map to store transports by session ID
const transports = {};

// Mock library registry for demonstration
const mockLibraryRegistry = [
  {
    id: '/vercel/next.js',
    name: 'Next.js',
    description: 'The React Framework for Production',
    trustScore: 9,
    codeSnippets: 1250,
    versions: ['14.2.0', '14.1.0', '14.0.0'],
    documentation: 'https://nextjs.org/docs',
    features: [
      'Server-side rendering',
      'Static site generation',
      'API routes',
      'TypeScript support',
    ],
    examples: {
      'basic-app': 'npx create-next-app@latest my-app',
      'with-typescript': 'npx create-next-app@latest my-app --typescript',
      'api-route': 'Create API endpoints in pages/api/ directory',
    },
  },
  {
    id: '/facebook/react',
    name: 'React',
    description: 'A JavaScript library for building user interfaces',
    trustScore: 10,
    codeSnippets: 2100,
    versions: ['18.3.0', '18.2.0', '18.1.0'],
    documentation: 'https://react.dev',
    features: ['Component-based', 'Virtual DOM', 'Hooks', 'JSX syntax'],
    examples: {
      'functional-component':
        'function Component() { return <div>Hello</div>; }',
      'use-state': 'const [count, setCount] = useState(0);',
      'use-effect': 'useEffect(() => { /* side effect */ }, []);',
    },
  },
  {
    id: '/nodejs/node',
    name: 'Node.js',
    description: 'Node.js JavaScript runtime',
    trustScore: 9,
    codeSnippets: 850,
    versions: ['20.12.0', '18.20.0', '16.20.0'],
    documentation: 'https://nodejs.org/docs',
    features: [
      'Event-driven',
      'Non-blocking I/O',
      'NPM ecosystem',
      'Cross-platform',
    ],
    examples: {
      'http-server':
        'const http = require("http"); const server = http.createServer();',
      'file-system':
        'const fs = require("fs"); fs.readFile("file.txt", callback);',
      'express-app':
        'const express = require("express"); const app = express();',
    },
  },
  {
    id: '/microsoft/typescript',
    name: 'TypeScript',
    description:
      'TypeScript is a superset of JavaScript that compiles to plain JavaScript',
    trustScore: 9,
    codeSnippets: 1800,
    versions: ['5.4.0', '5.3.0', '5.2.0'],
  },
  {
    id: '/expressjs/express',
    name: 'Express',
    description: 'Fast, unopinionated, minimalist web framework for Node.js',
    trustScore: 8,
    codeSnippets: 950,
    versions: ['4.19.0', '4.18.0', '4.17.0'],
  },
];

// Mock documentation data
const mockDocumentation = {
  '/vercel/next.js': {
    title: 'Next.js App Router',
    content: `
# Next.js App Router

The App Router is a new paradigm for building applications using React's latest features.

## Basic Setup

\`\`\`typescript
// app/page.tsx
export default function HomePage() {
  return (
    <div>
      <h1>Welcome to Next.js</h1>
      <p>This is the app router in action!</p>
    </div>
  )
}
\`\`\`

## Server Components

Server Components run on the server and can fetch data directly:

\`\`\`typescript
// app/posts/page.tsx
async function getPosts() {
  const res = await fetch('https://api.example.com/posts')
  return res.json()
}

export default async function PostsPage() {
  const posts = await getPosts()
  
  return (
    <div>
      {posts.map(post => (
        <div key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
        </div>
      ))}
    </div>
  )
}
\`\`\`

## Client Components

Use "use client" directive for interactive components:

\`\`\`typescript
'use client'
import { useState } from 'react'

export default function Counter() {
  const [count, setCount] = useState(0)
  
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  )
}
\`\`\`
    `,
  },
  '/facebook/react': {
    title: 'React Hooks and Components',
    content: `
# React Hooks Guide

## useState Hook

\`\`\`typescript
import { useState } from 'react'

function Counter() {
  const [count, setCount] = useState(0)
  
  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  )
}
\`\`\`

## useEffect Hook

\`\`\`typescript
import { useState, useEffect } from 'react'

function DataFetcher() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(data => {
        setData(data)
        setLoading(false)
      })
  }, [])
  
  if (loading) return <div>Loading...</div>
  
  return <div>{JSON.stringify(data)}</div>
}
\`\`\`

## Custom Hooks

\`\`\`typescript
function useLocalStorage(key: string, initialValue: any) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      return initialValue
    }
  })
  
  const setValue = (value: any) => {
    try {
      setStoredValue(value)
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.log(error)
    }
  }
  
  return [storedValue, setValue]
}
\`\`\`
    `,
  },
};

/**
 * Create and configure the MCP server
 */
function createMcpServer() {
  const mcpServer = new McpServer({
    name: 'context7',
    version: '1.0.0',
  });

  // Tool: Search libraries
  mcpServer.tool(
    'search_libraries',
    {
      query: z
        .string()
        .describe('Search query for libraries (name, description, or ID)'),
      limit: z
        .number()
        .optional()
        .describe('Maximum number of results to return (default: 10)'),
    },
    async ({ query, limit = 10 }) => {
      console.info(
        `Searching libraries with query: "${query}", limit: ${limit}`
      );

      try {
        const searchTerm = query.toLowerCase();
        const results = mockLibraryRegistry
          .filter(
            (lib) =>
              lib.name.toLowerCase().includes(searchTerm) ||
              lib.description.toLowerCase().includes(searchTerm) ||
              lib.id.toLowerCase().includes(searchTerm)
          )
          .slice(0, limit)
          .map((lib) => ({
            id: lib.id,
            name: lib.name,
            description: lib.description,
            trustScore: lib.trustScore,
            latestVersion: lib.versions[0],
            codeSnippets: lib.codeSnippets,
          }));

        if (results.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `No libraries found matching query: "${query}"`,
              },
            ],
          };
        }

        const resultText = results
          .map(
            (lib) =>
              `📚 ${lib.name} (${lib.id})\n` +
              `Description: ${lib.description}\n` +
              `Latest Version: ${lib.latestVersion}\n` +
              `Trust Score: ${lib.trustScore}/10\n` +
              `Code Snippets: ${lib.codeSnippets}\n`
          )
          .join('\n---\n');

        return {
          content: [
            {
              type: 'text',
              text: `Found ${results.length} libraries:\n\n${resultText}`,
            },
          ],
        };
      } catch (error) {
        console.error('Error searching libraries:', error.message);
        return {
          content: [
            {
              type: 'text',
              text: `Error searching libraries: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Get library details
  mcpServer.tool(
    'get_library_details',
    {
      libraryId: z.string().describe('The library ID to get details for'),
    },
    async ({ libraryId }) => {
      console.info(`Getting details for library: ${libraryId}`);

      try {
        const library = mockLibraryRegistry.find((lib) => lib.id === libraryId);

        if (!library) {
          return {
            content: [
              {
                type: 'text',
                text: `Library not found: ${libraryId}`,
              },
            ],
          };
        }

        const detailsText =
          `📚 ${library.name}\n\n` +
          `ID: ${library.id}\n` +
          `Description: ${library.description}\n` +
          `Trust Score: ${library.trustScore}/10\n` +
          `Code Snippets Available: ${library.codeSnippets}\n` +
          `Documentation: ${library.documentation}\n\n` +
          `Available Versions:\n${library.versions.map((v) => `  • ${v}`).join('\n')}\n\n` +
          `Key Features:\n${library.features.map((f) => `  • ${f}`).join('\n')}\n\n` +
          `Code Examples:\n${Object.entries(library.examples)
            .map(([key, example]) => `  ${key}: ${example}`)
            .join('\n')}`;

        return {
          content: [
            {
              type: 'text',
              text: detailsText,
            },
          ],
        };
      } catch (error) {
        console.error('Error getting library details:', error.message);
        return {
          content: [
            {
              type: 'text',
              text: `Error getting library details: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Get documentation
  mcpServer.tool(
    'get_documentation',
    {
      libraryId: z.string().describe('The library ID to get documentation for'),
      section: z
        .string()
        .optional()
        .describe(
          'Specific documentation section (gettingStarted, quickStart, bestPractices, commonIssues)'
        ),
    },
    async ({ libraryId, section }) => {
      console.info(
        `Getting documentation for library: ${libraryId}, section: ${section || 'all'}`
      );

      try {
        const docs = mockDocumentation[libraryId];

        if (!docs) {
          return {
            content: [
              {
                type: 'text',
                text: `Documentation not available for library: ${libraryId}`,
              },
            ],
          };
        }

        let docText = `📖 Documentation for ${libraryId}\n\n${docs.title}\n\n${docs.content}`;

        return {
          content: [
            {
              type: 'text',
              text: docText,
            },
          ],
        };
      } catch (error) {
        console.error('Error getting documentation:', error.message);
        return {
          content: [
            {
              type: 'text',
              text: `Error getting documentation: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool: Resolve library ID
  mcpServer.tool(
    'resolve_library_id',
    {
      libraryName: z.string().describe('The library name to resolve to an ID'),
    },
    async ({ libraryName }) => {
      console.info(`Resolving library ID for: ${libraryName}`);

      try {
        const searchTerm = libraryName.toLowerCase();
        const matches = mockLibraryRegistry.filter(
          (lib) =>
            lib.name.toLowerCase() === searchTerm ||
            lib.name.toLowerCase().includes(searchTerm) ||
            lib.id.toLowerCase().includes(searchTerm)
        );

        if (matches.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `No library found with name: "${libraryName}"`,
              },
            ],
          };
        }

        const exactMatch = matches.find(
          (lib) => lib.name.toLowerCase() === searchTerm
        );
        const bestMatch = exactMatch || matches[0];

        let resultText =
          `🔍 Resolved "${libraryName}" to:\n\n` +
          `ID: ${bestMatch.id}\n` +
          `Name: ${bestMatch.name}\n` +
          `Description: ${bestMatch.description}\n`;

        if (matches.length > 1) {
          const otherMatches = matches
            .filter((lib) => lib.id !== bestMatch.id)
            .map((lib) => `  • ${lib.name} (${lib.id})`)
            .join('\n');
          resultText += `\nOther possible matches:\n${otherMatches}`;
        }

        return {
          content: [
            {
              type: 'text',
              text: resultText,
            },
          ],
        };
      } catch (error) {
        console.error('Error resolving library ID:', error.message);
        return {
          content: [
            {
              type: 'text',
              text: `Error resolving library ID: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  return mcpServer;
}

/**
 * Set up session routes for MCP protocol
 */
function setupSessionRoutes() {
  // Handle POST requests for MCP communication
  app.post('/mcp', async (req, res) => {
    try {
      console.info('MCP POST request received:');
      console.info('  Headers: %s', JSON.stringify(req.headers, null, 2));
      console.info('  Body: %s', JSON.stringify(req.body, null, 2));

      // Fix missing Accept headers for compatibility with Go MCP clients
      // The StreamableHTTPServerTransport requires both application/json and text/event-stream
      const accept = req.headers.accept || req.headers.Accept;
      if (
        !accept ||
        !accept.includes('application/json') ||
        !accept.includes('text/event-stream')
      ) {
        console.info('Adding missing Accept headers for MCP compatibility');
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
            console.info(`MCP session initialized: ${newSessionId}`);
            // Store the transport by session ID
            transports[newSessionId] = transport;
          },
        });

        // Clean up transport when closed
        transport.onclose = () => {
          if (transport.sessionId) {
            console.info(`MCP session closed: ${transport.sessionId}`);
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

// Health check endpoint
app.get('/health', (req, res) => {
  const healthStatus = {
    status: 'healthy',
    server: 'mcp-context7',
    version: '1.0.0',
    activeSessions: Object.keys(transports).length,
    availableLibraries: mockLibraryRegistry.length,
  };

  console.info('Health check requested: %j', healthStatus);
  res.json(healthStatus);
});

/**
 * Start the server
 */
async function startServer() {
  const port = process.env.PORT || 3002;
  const host = process.env.HOST || '0.0.0.0';

  // Set up session routes
  setupSessionRoutes();

  app.listen(port, host, async () => {
    console.info(`MCP Context7 server running on http://${host}:${port}`);
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
    console.info(
      '  - search_libraries    - Search for libraries by name or description'
    );
    console.info(
      '  - get_library_details - Get detailed information about a specific library'
    );
    console.info('  - get_documentation   - Get documentation for a library');
    console.info('  - resolve_library_id  - Resolve a library name to its ID');
    console.info(`Available libraries: ${mockLibraryRegistry.length}`);
    console.info('MCP Context7 server ready for connections');
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.info('Received SIGTERM, shutting down gracefully');
  // Close all transports
  Object.values(transports).forEach((transport) => {
    if (transport.close) transport.close();
  });
  process.exit(0);
});

process.on('SIGINT', () => {
  console.info('Received SIGINT, shutting down gracefully');
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
