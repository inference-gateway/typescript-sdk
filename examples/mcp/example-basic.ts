import {
  InferenceGatewayClient,
  MessageRole,
  Provider,
} from '../../src/index.js';

(async () => {
  const client = new InferenceGatewayClient({
    baseURL: 'http://localhost:8080/v1',
  });

  const provider = (process.env.PROVIDER as Provider) || Provider.groq;
  const model = process.env.LLM || 'llama-3.3-70b-versatile';

  console.info(`🚀 Using ${model} on ${provider}\n`);

  try {
    // Health check
    const isHealthy = await client.healthCheck();
    if (!isHealthy) {
      console.error('❌ Gateway unhealthy. Run: docker-compose up --build');
      process.exit(1);
    }

    // Discover available MCP tools
    const tools = await client.listTools();
    console.info(`📋 Found ${tools.data.length} MCP tools available\n`);

    if (tools.data.length === 0) {
      console.error(
        '⚠️  No MCP tools available. Check MCP server configuration.'
      );
      return;
    }

    // Display available tools
    console.info('📋 Available MCP Tools:');
    tools.data.forEach((tool, index) => {
      console.info(`  ${index + 1}. ${tool.name} - ${tool.description}`);
    });
    console.info('');

    // Comprehensive MCP tool demonstration
    console.info('=== MCP Tool Demo ===\n');

    await client.streamChatCompletion(
      {
        model,
        messages: [
          {
            role: MessageRole.system,
            content: `You are a helpful assistant with access to MCP tools for file operations and web content fetching.

IMPORTANT: You MUST use the available tools to complete tasks. When asked to work with files:
1. Use write_file to create files
2. Use read_file to read content
3. Use list_directory to explore directories
4. Always confirm what you did

For web content:
1. Use fetch_url to get content from URLs
2. Summarize and analyze the content

Be verbose about your tool usage and explain what you're doing step by step.`,
          },
          {
            role: MessageRole.user,
            content:
              'Please write "Hello MCP Tools!" to /tmp/demo.txt, then read it back to confirm, and finally list the /tmp directory contents.',
          },
        ],
        max_tokens: 800,
      },
      {
        onOpen: () => {
          console.info('🔗 Connection opened, starting stream...\n');
        },
        onContent: (content) => {
          process.stdout.write(content);
        },
        onMCPTool: (toolCall) => {
          console.info(`\n🛠️  MCP Tool Called: ${toolCall.function.name}`);
          try {
            const args = JSON.parse(toolCall.function.arguments);
            console.info(`📝 Arguments:`, JSON.stringify(args, null, 2));
          } catch {
            console.info(`📝 Raw Arguments: ${toolCall.function.arguments}`);
          }
          console.info(`🔍 Tool ID: ${toolCall.id}\n`);
        },
        onTool: (toolCall) => {
          // This would handle regular (non-MCP) tools if any were provided
          console.info(`\n🔧 Regular Tool Called: ${toolCall.function.name}`);
          try {
            const args = JSON.parse(toolCall.function.arguments);
            console.info(`📝 Arguments:`, JSON.stringify(args, null, 2));
          } catch {
            console.info(`📝 Raw Arguments: ${toolCall.function.arguments}`);
          }
          console.info(`🔍 Tool ID: ${toolCall.id}\n`);
        },
        onUsageMetrics: (usage) => {
          console.info(`\n📊 Token Usage:`, {
            prompt: usage.prompt_tokens,
            completion: usage.completion_tokens,
            total: usage.total_tokens,
          });
        },
        onFinish: () => {
          console.info('\n\n✅ Demo completed successfully!\n');
        },
        onError: (error) => {
          console.error('\n❌ Stream Error:', error);
        },
      },
      provider
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('MCP tools endpoint is not exposed')
    ) {
      console.error(
        '❌ MCP not exposed. Set EXPOSE_MCP=true and restart gateway.'
      );
    } else {
      console.error('❌ Error:', error);
    }
  }
})();
