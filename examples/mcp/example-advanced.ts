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

  console.info(`🚀 Advanced MCP Demo using ${model} on ${provider}\n`);

  try {
    // Health check
    const isHealthy = await client.healthCheck();
    if (!isHealthy) {
      console.error('❌ Gateway unhealthy. Run: docker-compose up --build');
      process.exit(1);
    }

    // Discover available MCP tools
    const tools = await client.listTools();
    console.info(`📋 Found ${tools.data.length} MCP tools available:`);
    tools.data.forEach((tool, index) => {
      console.info(`  ${index + 1}. ${tool.name} - ${tool.description}`);
    });
    console.info('');

    if (tools.data.length === 0) {
      console.error(
        '⚠️  No MCP tools available. Check MCP server configuration.'
      );
      return;
    }

    // Example 1: File Operations Chain
    console.info('=== Example 1: File Operations Chain ===\n');
    await runFileOperationsExample(client, model, provider);

    console.info('\n' + '='.repeat(50) + '\n');

    // Example 2: Web Content Analysis
    console.info('=== Example 2: Web Content Analysis ===\n');
    await runWebContentExample(client, model, provider);

    console.info('\n' + '='.repeat(50) + '\n');

    // Example 3: Data Analysis with CSV
    console.info('=== Example 3: Data Analysis ===\n');
    await runDataAnalysisExample(client, model, provider);
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

async function runFileOperationsExample(
  client: InferenceGatewayClient,
  model: string,
  provider: Provider
) {
  let toolCallCount = 0;
  let contentBuffer = '';

  await client.streamChatCompletion(
    {
      model,
      messages: [
        {
          role: MessageRole.system,
          content: `You are a file management assistant. Use the available MCP tools to:
1. Create a configuration file at /tmp/config.json with sample data
2. Read the file back to verify
3. List the /tmp directory to show what's there
4. Provide a summary of what you accomplished

Be detailed about each step and confirm successful operations.`,
        },
        {
          role: MessageRole.user,
          content:
            'Help me set up a sample configuration file with some JSON data.',
        },
      ],
      max_tokens: 1000,
    },
    {
      onContent: (content) => {
        process.stdout.write(content);
        contentBuffer += content;
      },
      onMCPTool: (toolCall) => {
        toolCallCount++;
        console.info(
          `\n🛠️  [${toolCallCount}] MCP Tool: ${toolCall.function.name}`
        );
        try {
          const args = JSON.parse(toolCall.function.arguments);
          console.info(`📝 Arguments:`, JSON.stringify(args, null, 2));
        } catch {
          console.info(`📝 Raw Arguments: ${toolCall.function.arguments}`);
        }
        console.info(`🔍 Tool ID: ${toolCall.id}`);
        console.info(''); // Add spacing before next content
      },
      onUsageMetrics: (usage) => {
        console.info(
          `\n📊 Tokens - Prompt: ${usage.prompt_tokens}, Completion: ${usage.completion_tokens}, Total: ${usage.total_tokens}`
        );
      },
      onFinish: () => {
        console.info(
          `\n✅ File operations completed! Used ${toolCallCount} MCP tools.\n`
        );
      },
      onError: (error) => {
        console.error('\n❌ Stream Error:', error);
      },
    },
    provider
  );
}

async function runWebContentExample(
  client: InferenceGatewayClient,
  model: string,
  provider: Provider
) {
  let toolCallCount = 0;

  await client.streamChatCompletion(
    {
      model,
      messages: [
        {
          role: MessageRole.system,
          content: `You are a web research assistant. Use the fetch_url tool to get content from URLs and analyze it.
Provide summaries and key insights from the content you retrieve.`,
        },
        {
          role: MessageRole.user,
          content:
            'Can you fetch the content from https://httpbin.org/json and tell me what information it contains?',
        },
      ],
      max_tokens: 800,
    },
    {
      onContent: (content) => {
        process.stdout.write(content);
      },
      onMCPTool: (toolCall) => {
        toolCallCount++;
        console.info(
          `\n🌐 [${toolCallCount}] Web Tool: ${toolCall.function.name}`
        );
        try {
          const args = JSON.parse(toolCall.function.arguments);
          console.info(`🔗 URL: ${args.url || 'N/A'}`);
          if (args.timeout) {
            console.info(`⏱️  Timeout: ${args.timeout}ms`);
          }
        } catch {
          console.info(`📝 Raw Arguments: ${toolCall.function.arguments}`);
        }
        console.info(`🔍 Tool ID: ${toolCall.id}`);
        console.info(''); // Add spacing
      },
      onFinish: () => {
        console.info(
          `\n✅ Web content analysis completed! Used ${toolCallCount} web tools.\n`
        );
      },
      onError: (error) => {
        console.error('\n❌ Stream Error:', error);
      },
    },
    provider
  );
}

async function runDataAnalysisExample(
  client: InferenceGatewayClient,
  model: string,
  provider: Provider
) {
  let toolCallCount = 0;

  await client.streamChatCompletion(
    {
      model,
      messages: [
        {
          role: MessageRole.system,
          content: `You are a data analyst. Use the available MCP tools to:
1. Read the CSV file at /shared/sample_sales_data.csv
2. Analyze the data structure and content
3. Provide insights about the data
4. Create a summary report and save it to /tmp/analysis_report.txt

Be thorough in your analysis and explanations.`,
        },
        {
          role: MessageRole.user,
          content:
            'Please analyze the sample sales data and create a comprehensive report.',
        },
      ],
      max_tokens: 1200,
    },
    {
      onContent: (content) => {
        process.stdout.write(content);
      },
      onMCPTool: (toolCall) => {
        toolCallCount++;
        console.info(
          `\n📊 [${toolCallCount}] Analysis Tool: ${toolCall.function.name}`
        );
        try {
          const args = JSON.parse(toolCall.function.arguments);
          if (args.file_path) {
            console.info(`📁 File: ${args.file_path}`);
          }
          if (args.content && args.content.length > 100) {
            console.info(
              `📝 Content: ${args.content.substring(0, 100)}... (${args.content.length} chars)`
            );
          } else if (args.content) {
            console.info(`📝 Content: ${args.content}`);
          }
        } catch {
          console.info(`📝 Raw Arguments: ${toolCall.function.arguments}`);
        }
        console.info(`🔍 Tool ID: ${toolCall.id}`);
        console.info(''); // Add spacing
      },
      onFinish: () => {
        console.info(
          `\n✅ Data analysis completed! Used ${toolCallCount} analysis tools.\n`
        );
      },
      onError: (error) => {
        console.error('\n❌ Stream Error:', error);
      },
    },
    provider
  );
}
