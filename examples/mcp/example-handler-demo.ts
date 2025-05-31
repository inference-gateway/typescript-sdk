import {
  InferenceGatewayClient,
  MessageRole,
  Provider,
} from '../../src/index.js';

/**
 * This example specifically demonstrates the enhanced MCP tool handler features
 * including the onMCPTool callback with detailed logging and tracking.
 */
(async () => {
  const client = new InferenceGatewayClient({
    baseURL: 'http://localhost:8080/v1',
  });

  const provider = (process.env.PROVIDER as Provider) || Provider.groq;
  const model = process.env.LLM || 'llama-3.3-70b-versatile';

  console.info(`🎯 MCP Tool Handler Demo using ${model} on ${provider}\n`);

  try {
    // Health check
    const isHealthy = await client.healthCheck();
    if (!isHealthy) {
      console.error('❌ Gateway unhealthy. Run: docker-compose up --build');
      process.exit(1);
    }

    // Track various metrics
    let totalToolCalls = 0;
    let mcpToolCalls = 0;
    let regularToolCalls = 0;
    const toolCallTimestamps: Array<{
      tool: string;
      timestamp: Date;
      id: string;
    }> = [];

    console.info('=== Enhanced MCP Tool Handler Demo ===\n');

    await client.streamChatCompletion(
      {
        model,
        messages: [
          {
            role: MessageRole.system,
            content: `You are a helpful assistant demonstrating MCP tool usage.
            
TASK: Perform the following operations step by step:
1. Create a demo file at /tmp/handler-test.txt with "MCP Handler Demo" content
2. Read the file back to verify
3. List the /tmp directory
4. Create a simple JSON file at /tmp/demo-config.json with some configuration data
5. Read that JSON file back

Be explicit about each step and confirm completion.`,
          },
          {
            role: MessageRole.user,
            content:
              'Please demonstrate MCP tool usage by performing the file operations listed in the system prompt.',
          },
        ],
        max_tokens: 1000,
      },
      {
        onOpen: () => {
          console.info('🔌 Stream connection opened\n');
        },
        onContent: (content) => {
          // Use a subtle indicator for content
          process.stdout.write(content);
        },
        onMCPTool: (toolCall) => {
          mcpToolCalls++;
          totalToolCalls++;
          const timestamp = new Date();
          toolCallTimestamps.push({
            tool: toolCall.function.name,
            timestamp,
            id: toolCall.id,
          });

          console.info(
            `\n🛠️  MCP Tool #${mcpToolCalls}: ${toolCall.function.name}`
          );
          console.info(`🆔 Tool ID: ${toolCall.id}`);
          console.info(`⏰ Called at: ${timestamp.toISOString()}`);

          try {
            const args = JSON.parse(toolCall.function.arguments);

            // Format arguments nicely based on tool type
            if (toolCall.function.name === 'write_file') {
              console.info(`📁 File: ${args.path}`);
              if (args.content && args.content.length > 50) {
                console.info(
                  `📝 Content: ${args.content.substring(0, 50)}... (${args.content.length} chars)`
                );
              } else {
                console.info(`📝 Content: ${args.content}`);
              }
              console.info(`🖥️  Server: ${args.mcpServer}`);
            } else if (toolCall.function.name === 'read_file') {
              console.info(`📖 Reading: ${args.path}`);
              console.info(`🖥️  Server: ${args.mcpServer}`);
            } else if (toolCall.function.name === 'list_directory') {
              console.info(`📂 Listing: ${args.path}`);
              console.info(`🖥️  Server: ${args.mcpServer}`);
            } else {
              console.info(`📝 Arguments:`, JSON.stringify(args, null, 2));
            }
          } catch (parseError) {
            console.info(`📝 Raw Arguments: ${toolCall.function.arguments}`);
            console.warn(`⚠️  Failed to parse arguments: ${parseError}`);
          }

          console.info(''); // Add spacing for readability
        },
        onTool: (toolCall) => {
          // This handles regular (non-MCP) tools
          regularToolCalls++;
          totalToolCalls++;
          console.info(`\n🔧 Regular Tool Called: ${toolCall.function.name}`);
          console.info(`🆔 Tool ID: ${toolCall.id}`);
          console.info(`📝 Arguments: ${toolCall.function.arguments}\n`);
        },
        onUsageMetrics: (usage) => {
          console.info(`\n📊 Token Metrics:`);
          console.info(`   Prompt Tokens: ${usage.prompt_tokens}`);
          console.info(`   Completion Tokens: ${usage.completion_tokens}`);
          console.info(`   Total Tokens: ${usage.total_tokens}`);
          if (usage.prompt_tokens && usage.completion_tokens) {
            const efficiency = (
              (usage.completion_tokens / usage.prompt_tokens) *
              100
            ).toFixed(1);
            console.info(
              `   Efficiency: ${efficiency}% (completion/prompt ratio)`
            );
          }
        },
        onFinish: () => {
          console.info('\n' + '='.repeat(60));
          console.info('📈 Session Summary:');
          console.info(`   Total Tool Calls: ${totalToolCalls}`);
          console.info(`   MCP Tool Calls: ${mcpToolCalls}`);
          console.info(`   Regular Tool Calls: ${regularToolCalls}`);

          if (toolCallTimestamps.length > 0) {
            console.info('\n🕒 Tool Call Timeline:');
            toolCallTimestamps.forEach((call, index) => {
              const timeStr = call.timestamp.toLocaleTimeString();
              console.info(
                `   ${index + 1}. ${timeStr} - ${call.tool} (${call.id.substring(0, 8)}...)`
              );
            });

            // Calculate duration between first and last tool call
            if (toolCallTimestamps.length > 1) {
              const duration =
                toolCallTimestamps[
                  toolCallTimestamps.length - 1
                ].timestamp.getTime() -
                toolCallTimestamps[0].timestamp.getTime();
              console.info(`\n⏱️  Total tool execution span: ${duration}ms`);
            }
          }

          console.info('\n✅ MCP Tool Handler Demo completed successfully!');
          console.info('='.repeat(60) + '\n');
        },
        onError: (error) => {
          console.error('\n❌ Stream Error occurred:');
          console.error('   Error:', error);
          console.error(`   At: ${new Date().toISOString()}`);
          console.error(
            `   Total tools called before error: ${totalToolCalls}\n`
          );
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
      console.error('❌ Unexpected error:', error);
    }
  }
})();
