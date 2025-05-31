/**
 * NPM MCP Server Usage Example
 *
 * This example demonstrates how to use the NPM MCP server
 * to manage Node.js projects through the LLM with proper tool usage.
 */

import * as dotenv from 'dotenv';
import {
  InferenceGatewayClient,
  MessageRole,
  Provider,
} from '../../src/index.js';

dotenv.config();

// For ES modules compatibility
declare const require: any;
declare const module: any;

async function demonstrateNpmMcp() {
  const client = new InferenceGatewayClient({
    baseURL: 'http://localhost:8080/v1',
  });

  const provider = (process.env.PROVIDER as Provider) || Provider.groq;
  const model = process.env.LLM || 'llama-3.3-70b-versatile';

  console.log(`🚀 NPM MCP Server Demo using ${model} on ${provider}\n`);

  try {
    // Health check
    const isHealthy = await client.healthCheck();
    if (!isHealthy) {
      console.error('❌ Gateway unhealthy. Run: docker-compose up --build');
      process.exit(1);
    }

    // Check if NPM tools are available
    const tools = await client.listTools();
    const npmTools = tools.data.filter((tool) =>
      ['npm_run', 'npm_init_project', 'npm_install_package'].includes(tool.name)
    );

    if (npmTools.length === 0) {
      console.error(
        '⚠️  NPM MCP tools not available. Make sure the NPM server is running on port 3003.'
      );
      return;
    }

    console.info(`📋 Found ${npmTools.length} NPM tools available:`);
    npmTools.forEach((tool, index) => {
      console.info(`  ${index + 1}. ${tool.name} - ${tool.description}`);
    });
    console.info('');

    // Demonstrate NPM usage through LLM conversation
    console.info('=== NPM Demo: Project Setup and Management ===\n');

    const userPrompt = `I want to create a new Node.js project with Express.js. Please help me by:

1. Initialize a new npm project called "express-demo" in the /tmp directory
2. Install express, cors, and dotenv packages 
3. List the installed packages to verify
4. Run npm audit to check for vulnerabilities
5. Show me the package.json that was created

Please use the npm MCP tools to perform these operations safely.`;

    console.info(`User: ${userPrompt}`);

    await client.streamChatCompletion(
      {
        model: `${provider + '/' + model}`,
        messages: [
          {
            role: MessageRole.system,
            content: `You are a helpful Node.js development assistant with access to NPM MCP tools for package management.

IMPORTANT: You MUST use npm MCP tools to complete npm-related tasks. Available tools:

1. Use npm_init_project to initialize new npm projects
2. Use npm_install_package to install packages
3. Use npm_run to execute npm commands like list, audit, etc.

When helping with npm tasks:
- Always use the appropriate MCP tool for each operation
- Provide clear explanations of what each command does
- Show the results and explain any issues found
- Use /tmp as the working directory unless specified otherwise

Be thorough and always use npm MCP tools to perform actual npm operations.`,
          },
          {
            role: MessageRole.user,
            content: userPrompt,
          },
        ],
        max_tokens: 1500,
      },
      {
        onOpen: () => {
          console.info('🔗 Connection opened, starting NPM session...\n');
        },
        onReasoning: (reasoning) => {
          console.info(`\n🤔 NPM Reasoning: ${reasoning}`);
        },
        onContent: (content) => {
          process.stdout.write(content);
        },
        onMCPTool: (toolCall) => {
          console.info(`\n🛠️  NPM Tool: ${toolCall.function.name}`);
          try {
            const args = JSON.parse(toolCall.function.arguments);
            console.info(`📝 Arguments:`, JSON.stringify(args, null, 2));
          } catch {
            console.info(`📝 Raw Arguments: ${toolCall.function.arguments}`);
          }
          console.info(`🔍 Tool ID: ${toolCall.id}\n`);
        },
        onError: (error) => {
          console.error(`\n❌ Stream Error: ${error.error}`);
        },
        onFinish: () => {
          console.info('\n\n✅ NPM project setup completed!\n');
        },
      }
    );

    // Second example: Script management
    console.info('\n=== NPM Demo: Script Management ===\n');

    await client.streamChatCompletion(
      {
        model: `${provider + '/' + model}`,
        messages: [
          {
            role: MessageRole.system,
            content: `You are a Node.js expert with access to NPM MCP tools. Always use npm MCP tools to manage packages and run commands.`,
          },
          {
            role: MessageRole.user,
            content: `I have a project in /tmp/express-demo. Please help me:

1. Check what scripts are available in the package.json
2. Install nodemon as a dev dependency
3. Run npm outdated to see if there are any package updates available
4. Show me how to check the project's dependency tree

Use the npm MCP tools to perform these operations.`,
          },
        ],
        max_tokens: 1000,
      },
      {
        onOpen: () => {
          console.info('🔗 Starting NPM script management session...\n');
        },
        onContent: (content) => {
          process.stdout.write(content);
        },
        onMCPTool: (toolCall) => {
          console.info(`\n📦 NPM Tool: ${toolCall.function.name}`);
          try {
            const args = JSON.parse(toolCall.function.arguments);
            console.info(`📋 Command:`, JSON.stringify(args, null, 2));
          } catch {
            console.info(`📋 Raw Command: ${toolCall.function.arguments}`);
          }
          console.info(`🆔 Request ID: ${toolCall.id}\n`);
        },
        onError: (error) => {
          console.error(`\n❌ NPM Error: ${error.error}`);
        },
        onFinish: () => {
          console.info('\n\n✅ NPM script management session completed!\n');
        },
      }
    );
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
    console.log('\n💡 Make sure the NPM MCP server is running on port 3003');
    console.log('   and the Inference Gateway is running on port 8080');
  }
}

// Run the demo
if (require.main === module || process.argv[1].endsWith('example-npm.ts')) {
  demonstrateNpmMcp().catch(console.error);
}

export { demonstrateNpmMcp };
