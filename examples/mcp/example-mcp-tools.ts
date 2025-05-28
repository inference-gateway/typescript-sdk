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

  console.log(`Using model: ${model}`);
  console.log(`Using provider: ${provider}\n`);

  console.log('=== MCP Tool Usage Demo ===\n');

  try {
    // Check gateway health
    console.log('🔍 Checking gateway health...');
    const isHealthy = await client.healthCheck();
    console.log(
      `Gateway health: ${isHealthy ? '✅ Healthy' : '❌ Unhealthy'}\n`
    );

    if (!isHealthy) {
      console.log(
        'Please ensure the Inference Gateway is running with Docker Compose.'
      );
      process.exit(1);
    }

    // List available MCP tools
    console.log('📋 Listing available MCP tools...');
    const tools = await client.listTools();
    console.log(`Found ${tools.data.length} MCP tools:\n`);

    const fileTools = tools.data.filter((tool) =>
      ['read_file', 'write_file', 'list_directory'].includes(tool.name)
    );

    if (fileTools.length === 0) {
      console.log('⚠️  No filesystem MCP tools available.');
      return;
    }

    console.log('📁 Available filesystem tools:');
    fileTools.forEach((tool, index) => {
      console.log(`${index + 1}. ${tool.name} - ${tool.description}`);
    });
    console.log('');

    // Track MCP tool calls for demonstration
    const toolCallTracker = {
      totalCalls: 0,
      toolsUsed: new Set<string>(),
      filesAccessed: new Set<string>(),
    };

    // Example: Analyze highest revenue from sales data
    console.log('=== Highest Revenue Analysis with MCP Tool Tracking ===\n');

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
          console.log('🚀 Starting revenue analysis...');
          console.log('📊 MCP Tool usage will be tracked below:\n');
        },
        onContent: (content) => process.stdout.write(content),
        onMCPTool: (toolCall) => {
          toolCallTracker.totalCalls++;
          toolCallTracker.toolsUsed.add(toolCall.function.name);

          console.log(
            `\n🔧 [TOOL CALL #${toolCallTracker.totalCalls}] ${toolCall.function.name}`
          );

          const args = JSON.parse(toolCall.function.arguments);

          switch (toolCall.function.name) {
            case 'read_file':
              console.log(`   📄 Reading file: ${args.path}`);
              toolCallTracker.filesAccessed.add(args.path);
              break;
            case 'write_file':
              console.log(`   💾 Writing file: ${args.path}`);
              console.log(
                `   📝 Content length: ${
                  args.content ? args.content.length : 0
                } characters`
              );
              toolCallTracker.filesAccessed.add(args.path);
              break;
            case 'list_directory':
              console.log(`   📂 Listing directory: ${args.path}`);
              break;
            default:
              console.log(`   ⚙️  Arguments: ${JSON.stringify(args, null, 2)}`);
          }
          console.log(`   🆔 Tool ID: ${toolCall.id}`);
        },
        onFinish: () => {
          console.log('\n\n✅ Revenue analysis completed!\n');

          // Display tool usage summary
          console.log('📈 MCP Tool Usage Summary:');
          console.log(`   Total tool calls: ${toolCallTracker.totalCalls}`);
          console.log(
            `   Tools used: ${Array.from(toolCallTracker.toolsUsed).join(', ')}`
          );
          console.log(
            `   Files accessed: ${Array.from(
              toolCallTracker.filesAccessed
            ).join(', ')}`
          );
          console.log('');
        },
        onError: (error) => console.error('❌ Error:', error),
      },
      provider
    );

    console.log('🎉 MCP Tool Usage Demo completed successfully!');
    console.log('\n💡 Key takeaways:');
    console.log(
      '- The onMCPTool callback provides detailed tracking of tool usage'
    );
    console.log(
      '- Track total tool calls, tool types used, and files accessed'
    );
    console.log(
      '- Each tool call includes function name, arguments, and unique ID'
    );
    console.log(
      '- Perfect for debugging, monitoring, and understanding AI tool usage patterns'
    );
    console.log(
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
      console.log('\n💡 To fix this, restart the gateway with:');
      console.log('   docker-compose up --build');
    } else {
      console.error('❌ Error:', error);
    }
  }
})();
