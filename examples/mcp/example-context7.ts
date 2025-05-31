/**
 * Context7 MCP Server Usage Example
 *
 * This example demonstrates how to use the Context7 MCP server
 * to resolve library IDs and fetch documentation through the LLM.
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

async function demonstrateContext7() {
  const client = new InferenceGatewayClient({
    baseURL: 'http://localhost:8080/v1',
  });

  const provider = (process.env.PROVIDER as Provider) || Provider.groq;
  const model = process.env.LLM || 'llama-3.3-70b-versatile';

  console.log(`🚀 Context7 MCP Server Demo using ${model} on ${provider}\n`);

  try {
    // Health check
    const isHealthy = await client.healthCheck();
    if (!isHealthy) {
      console.error('❌ Gateway unhealthy. Run: docker-compose up --build');
      process.exit(1);
    }

    // Check if Context7 tools are available
    const tools = await client.listTools();
    const context7Tools = tools.data.filter((tool) =>
      ['resolve_library_id', 'get_library_docs', 'search_libraries'].includes(
        tool.name
      )
    );

    if (context7Tools.length === 0) {
      console.error(
        '⚠️  Context7 MCP tools not available. Make sure the Context7 server is running on port 3002.'
      );
      return;
    }

    console.info(`📋 Found ${context7Tools.length} Context7 tools available:`);
    context7Tools.forEach((tool, index) => {
      console.info(`  ${index + 1}. ${tool.name} - ${tool.description}`);
    });
    console.info('');

    // Demonstrate Context7 usage through LLM conversation
    console.info('=== Context7 Demo: Library Research Session ===\n');

    const userPrompt = `I'm starting a new React project and want to use Next.js. Can you help me by:

1. First, resolve the library IDs for React and Next.js
2. Get the latest documentation for Next.js focusing on the App Router
3. Search for any other relevant frontend libraries I should consider
4. Provide me with a basic setup example based on the latest documentation
5. Please write a full react app using Next.js with typescript in /tmp/next-app

Please use context7 to get the most up-to-date information.`;
    console.info(`User: ${userPrompt}`);

    await client.streamChatCompletion(
      {
        model: `${provider + '/' + model}`,
        messages: [
          {
            role: MessageRole.system,
            content: `You are a helpful software development assistant with access to Context7 MCP tools for library documentation and research.

IMPORTANT: You MUST use context7 tools to complete tasks. Always use context7 for up-to-date library information:

1. Use resolve_library_id to find the correct library ID for any library mentioned
2. Use get_library_docs to fetch detailed documentation and code examples
3. Use search_libraries to discover relevant libraries

When helping with development tasks:
- Always resolve library IDs first using resolve_library_id
- When starting a new project of Next.js, always use the create-next-app command
- Fetch comprehensive documentation using get_library_docs
- Provide up-to-date code examples and best practices
- Explain concepts clearly with context from the documentation

Be thorough and always use context7 tools to provide the most current information.`,
          },
          {
            role: MessageRole.user,
            content: `${userPrompt}`,
          },
        ],
        max_tokens: 1500,
      },
      {
        onOpen: () => {
          console.info(
            '🔗 Connection opened, starting Context7 research session...\n'
          );
        },
        onReasoning: (reasoning) => {
          console.info(`\n🤔 Context7 Reasoning: ${reasoning}`);
        },
        onContent: (content) => {
          process.stdout.write(content);
        },
        onMCPTool: (toolCall) => {
          console.info(`\n🛠️  Context7 Tool: ${toolCall.function.name}`);
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
          console.info('\n\n✅ Context7 research session completed!\n');
        },
      }
    );

    // Second example: TypeScript documentation lookup
    console.info('\n=== Context7 Demo: TypeScript Documentation Lookup ===\n');

    await client.streamChatCompletion(
      {
        model: `${provider + '/' + model}`,
        messages: [
          {
            role: MessageRole.system,
            content: `You are a TypeScript expert with access to Context7 MCP tools. Always use context7 to get the latest TypeScript documentation and provide accurate, up-to-date information.`,
          },
          {
            role: MessageRole.user,
            content: `I need help with TypeScript generics and utility types. Please use context7 to get the latest documentation on TypeScript and show me examples of:

1. Generic functions
2. Utility types like Pick, Omit, and Partial
3. Advanced type patterns

Use context7 to ensure you have the most current information.`,
          },
        ],
        max_tokens: 1000,
      },
      {
        onOpen: () => {
          console.info('🔗 Starting TypeScript documentation lookup...\n');
        },
        onContent: (content) => {
          process.stdout.write(content);
        },
        onMCPTool: (toolCall) => {
          console.info(
            `\n📚 Context7 Documentation Tool: ${toolCall.function.name}`
          );
          try {
            const args = JSON.parse(toolCall.function.arguments);
            console.info(`📋 Query:`, JSON.stringify(args, null, 2));
          } catch {
            console.info(`📋 Raw Query: ${toolCall.function.arguments}`);
          }
          console.info(`🆔 Request ID: ${toolCall.id}\n`);
        },
        onError: (error) => {
          console.error(`\n❌ Documentation Error: ${error.error}`);
        },
        onFinish: () => {
          console.info('\n\n✅ TypeScript documentation session completed!\n');
        },
      }
    );
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
    console.log(
      '\n💡 Make sure the Context7 MCP server is running on port 3002'
    );
    console.log('   and the Inference Gateway is running on port 8080');
  }
}

// Run the demo
if (
  require.main === module ||
  process.argv[1].endsWith('example-context7.ts')
) {
  demonstrateContext7().catch(console.error);
}

export { demonstrateContext7 };
