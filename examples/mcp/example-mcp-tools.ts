import {
  InferenceGatewayClient,
  MessageRole,
  Provider,
} from '../../src/index.js';

/**
 * Demonstration of MCP filesystem operations with proper directory access
 * This example shows how to work with the /shared and /tmp directories
 * and demonstrates the onMCPTool callback for tracking tool usage
 */
(async () => {
  const client = new InferenceGatewayClient({
    baseURL: 'http://localhost:8080/v1',
  });

  const provider = (process.env.PROVIDER as Provider) || Provider.groq;
  const model = process.env.LLM || 'llama-3.3-70b-versatile';

  console.info(`Using model: ${model}`);
  console.info(`Using provider: ${provider}\n`);

  console.info('=== MCP Tool Usage Demo ===\n');

  try {
    // Check gateway health
    console.info('🔍 Checking gateway health...');
    const isHealthy = await client.healthCheck();
    console.info(
      `Gateway health: ${isHealthy ? '✅ Healthy' : '❌ Unhealthy'}\n`
    );

    if (!isHealthy) {
      console.info(
        'Please ensure the Inference Gateway is running with Docker Compose.'
      );
      process.exit(1);
    }

    // List available models for the provider
    console.info('🔍 Checking available models...');
    try {
      const models = await client.listModels(provider);
      console.info(`Found ${models.data.length} models for ${provider}:`);
      models.data.forEach((modelInfo, index) => {
        console.info(`${index + 1}. ${modelInfo.id}`);
      });

      // Check if the requested model is available
      const isModelAvailable = models.data.some(
        (m) => m.id === `${provider}/${model}`
      );
      if (!isModelAvailable) {
        console.info(
          `⚠️  Model '${model}' not found for provider '${provider}'`
        );
        console.info(
          'Consider using one of the available models listed above.'
        );
        console.info(
          'You can set the LLM environment variable to use a different model.\n'
        );
      }
    } catch (modelError) {
      console.info('⚠️  Could not retrieve model list:', modelError);
    }
    console.info('');

    // List available MCP tools
    console.info('📋 Listing available MCP tools...');
    const tools = await client.listTools();
    console.info(`Found ${tools.data.length} MCP tools:\n`);

    const fileTools = tools.data.filter((tool) =>
      ['read_file', 'write_file', 'list_directory'].includes(tool.name)
    );

    if (fileTools.length === 0) {
      console.info('⚠️  No filesystem MCP tools available.');
      return;
    }

    console.info('📁 Available filesystem tools:');
    fileTools.forEach((tool, index) => {
      console.info(`${index + 1}. ${tool.name} - ${tool.description}`);
    });
    console.info('');

    // Track MCP tool calls for demonstration
    const toolCallTracker = {
      totalCalls: 0,
      toolsUsed: new Set<string>(),
      filesAccessed: new Set<string>(),
    };

    // Example: Analyze highest revenue from sales data
    console.info('=== Highest Revenue Analysis with MCP Tool Tracking ===\n');

    await client.streamChatCompletion(
      {
        model,
        messages: [
          {
            role: MessageRole.system,
            content: `You are a data analyst with filesystem access. You have access to tools that can read files from /tmp directory and write files to /tmp directory. When analyzing data, be thorough and provide specific insights.`,
          },
          {
            role: MessageRole.user,
            content:
              'Please read the sample_sales_data.csv file from the /tmp directory, analyze it to find the highest revenue transactions, and create a detailed summary report. Save the summary to /tmp/revenue_analysis.txt.',
          },
        ],
        max_tokens: 1500,
      },
      {
        onOpen: () => {
          console.info('🚀 Starting revenue analysis...');
          console.info('📊 MCP Tool usage will be tracked below:\n');
        },
        onContent: (content) => process.stdout.write(content),
        onMCPTool: (toolCall) => {
          toolCallTracker.totalCalls++;
          toolCallTracker.toolsUsed.add(toolCall.function.name);

          console.info(
            `\n🔧 [TOOL CALL #${toolCallTracker.totalCalls}] ${toolCall.function.name}`
          );

          const args = JSON.parse(toolCall.function.arguments);

          switch (toolCall.function.name) {
            case 'read_file':
              console.info(`   📄 Reading file: ${args.path}`);
              toolCallTracker.filesAccessed.add(args.path);
              break;
            case 'write_file':
              console.info(`   💾 Writing file: ${args.path}`);
              console.info(
                `   📝 Content length: ${
                  args.content ? args.content.length : 0
                } characters`
              );
              toolCallTracker.filesAccessed.add(args.path);
              break;
            case 'list_directory':
              console.info(`   📂 Listing directory: ${args.path}`);
              break;
            default:
              console.info(
                `   ⚙️  Arguments: ${JSON.stringify(args, null, 2)}`
              );
          }
          console.info(`   🆔 Tool ID: ${toolCall.id}`);
        },
        onFinish: () => {
          console.info('\n\n✅ Revenue analysis completed!\n');

          // Display tool usage summary
          console.info('📈 MCP Tool Usage Summary:');
          console.info(`   Total tool calls: ${toolCallTracker.totalCalls}`);
          console.info(
            `   Tools used: ${Array.from(toolCallTracker.toolsUsed).join(', ')}`
          );
          console.info(
            `   Files accessed: ${Array.from(
              toolCallTracker.filesAccessed
            ).join(', ')}`
          );
          console.info('');
        },
        onError: (error) => console.error('❌ Error:', error),
      },
      provider
    );

    console.info('🎉 MCP Tool Usage Demo completed successfully!');
    console.info('\n💡 Key takeaways:');
    console.info(
      '- The onMCPTool callback provides detailed tracking of tool usage'
    );
    console.info(
      '- Track total tool calls, tool types used, and files accessed'
    );
    console.info(
      '- Each tool call includes function name, arguments, and unique ID'
    );
    console.info(
      '- Perfect for debugging, monitoring, and understanding AI tool usage patterns'
    );
    console.info(
      '- LLM can read CSV data and perform complex analysis with file operations\n'
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('MCP tools endpoint is not exposed')
    ) {
      console.error(
        '❌ MCP tools are not exposed. Please ensure the Inference Gateway is started with MCP_EXPOSE=true'
      );
      console.info('\n💡 To fix this, restart the gateway with:');
      console.info('   docker-compose up --build');
    } else {
      console.error('❌ Error:', error);
    }
  }
})();
