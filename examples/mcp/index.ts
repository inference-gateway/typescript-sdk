import {
  InferenceGatewayClient,
  MessageRole,
  Provider,
} from '../../src/index.js';

// Token tracking interface
interface TokenTracker {
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  requestCount: number;
}

(async () => {
  const client = new InferenceGatewayClient({
    baseURL: 'http://localhost:8080/v1',
  });

  const provider = (process.env.PROVIDER as Provider) || Provider.groq;
  const model = process.env.LLM || 'llama-3.3-70b-versatile';

  // Initialize token tracker
  const tokenTracker: TokenTracker = {
    totalPromptTokens: 0,
    totalCompletionTokens: 0,
    totalTokens: 0,
    requestCount: 0,
  };

  // Helper function to update token tracking
  const updateTokens = (usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  }) => {
    tokenTracker.totalPromptTokens += usage.prompt_tokens;
    tokenTracker.totalCompletionTokens += usage.completion_tokens;
    tokenTracker.totalTokens += usage.total_tokens;
    tokenTracker.requestCount++;
  };

  // Helper function to display current token usage
  const displayTokenUsage = (label: string) => {
    console.info(`\n💰 Token Usage for ${label}:`);
    console.info(
      `   📊 Prompt tokens: ${tokenTracker.totalPromptTokens.toLocaleString()}`
    );
    console.info(
      `   ✍️  Completion tokens: ${tokenTracker.totalCompletionTokens.toLocaleString()}`
    );
    console.info(
      `   🎯 Total tokens: ${tokenTracker.totalTokens.toLocaleString()}`
    );
    console.info(
      `   📈 Average tokens per request: ${Math.round(
        tokenTracker.totalTokens / Math.max(tokenTracker.requestCount, 1)
      ).toLocaleString()}`
    );
  };

  console.info(`Using model: ${model}`);
  console.info(`Using provider: ${provider}\n`);

  console.info('=== MCP Tools Example with Token Tracking ===\n');

  try {
    // First, let's check if the gateway is healthy
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

    // List available MCP tools
    console.info('📋 Listing available MCP tools...');
    const tools = await client.listTools();
    console.info(`Found ${tools.data.length} MCP tools:\n`);

    // tools.data.forEach((tool, index) => {
    //   console.info(`${index + 1}. ${tool.name}`);
    //   console.info(`   Description: ${tool.description}`);
    //   console.info(`   Server: ${tool.server}`);
    //   console.info(`   Schema: ${JSON.stringify(tool.input_schema, null, 2)}\n`);
    // });

    if (tools.data.length === 0) {
      console.info(
        '⚠️  No MCP tools available. Ensure MCP servers are configured and running.'
      );
      return;
    }

    // Example 0: Simple test without tools first
    console.info('=== Example 0: Simple Test (No Tools) ===\n');
    console.info('Testing basic streaming without tools first...\n');

    await client.streamChatCompletion(
      {
        model,
        messages: [
          {
            role: MessageRole.user,
            content: 'Hello! Please tell me about the weather.',
          },
        ],
        max_tokens: 50,
      },
      {
        onOpen: () => console.info('🚀 Starting simple test...'),
        onContent: (content) => process.stdout.write(content),
        onTool: (toolCall) => {
          console.info(`\n🔧 Tool called: ${toolCall.function.name}`);
          console.info(`📝 Arguments: ${toolCall.function.arguments}`);
        },
        onUsageMetrics: (usage) => {
          updateTokens(usage);
        },
        onFinish: () => {
          console.info('\n✅ Simple test completed');
          displayTokenUsage('Simple Test');
          console.info('');
        },
        onError: (error) => console.error('❌ Error:', error),
      },
      provider
    );

    // Example 1: Automatic tool discovery and usage
    console.info('=== Example 1: Automatic Tool Discovery ===\n');
    console.info(
      'The gateway automatically detects and uses available MCP tools based on context.\n'
    );

    await client.streamChatCompletion(
      {
        model,
        messages: [
          {
            role: MessageRole.system,
            content:
              'You are a helpful assistant with access to various tools.',
          },
          {
            role: MessageRole.user,
            content:
              'What time is it now? Also, if you can, find some information about artificial intelligence.',
          },
        ],
        max_tokens: 200,
      },
      {
        onOpen: () => console.info('🚀 Starting automatic tool discovery...'),
        onContent: (content) => process.stdout.write(content),
        onTool: (toolCall) => {
          console.info(
            `\n🔧 Tool automatically called: ${toolCall.function.name}`
          );
          console.info(`📝 Arguments: ${toolCall.function.arguments}`);
        },
        onUsageMetrics: (usage) => {
          updateTokens(usage);
        },
        onFinish: () => {
          console.info('\n✅ Automatic tool discovery completed');
          displayTokenUsage('Automatic Tool Discovery');
          console.info('');
        },
        onError: (error) => console.error('❌ Error:', error),
      },
      provider
    );

    // Example 2: Use MCP tools for file operations (if filesystem MCP server is available)
    const fileReadTool = tools.data.find((tool) => tool.name === 'read_file');
    if (fileReadTool) {
      console.info('=== Example 2: File Operations with MCP ===\n');

      await client.streamChatCompletion(
        {
          model,
          messages: [
            {
              role: MessageRole.system,
              content:
                'You are a helpful assistant with access to filesystem operations. Available directory is /tmp.',
            },
            {
              role: MessageRole.user,
              content:
                'Can you read the contents of /tmp/mcp-filesystem-example.txt and tell me what it contains?',
            },
          ],
          max_tokens: 200,
        },
        {
          onOpen: () => console.info('🚀 Starting file reading example...'),
          onContent: (content) => process.stdout.write(content),
          onTool: (toolCall) => {
            console.info(`\n🔧 Tool called: ${toolCall.function.name}`);
            console.info(`📝 Arguments: ${toolCall.function.arguments}`);
          },
          onUsageMetrics: (usage) => {
            updateTokens(usage);
          },
          onFinish: () => {
            console.info('\n✅ File reading example completed');
            displayTokenUsage('File Reading Example');
            console.info('');
          },
          onError: (error) => console.error('❌ Error:', error),
        },
        provider
      );
    }

    // Example 3: Use MCP tools for web scraping (if web scraper MCP server is available)
    const webScrapeTool = tools.data.find(
      (tool) => tool.name.includes('fetch') || tool.name.includes('scrape')
    );
    if (webScrapeTool) {
      console.info('=== Example 3: Web Scraping with MCP ===\n');

      await client.streamChatCompletion(
        {
          model,
          messages: [
            {
              role: MessageRole.system,
              content:
                'You are a helpful assistant with access to web search capabilities.',
            },
            {
              role: MessageRole.user,
              content:
                'Can you fetch information from https://httpbin.org/json and tell me what you find?',
            },
          ],
          max_tokens: 200,
        },
        {
          onOpen: () => console.info('🚀 Starting web scraping example...'),
          onContent: (content) => process.stdout.write(content),
          onTool: (toolCall) => {
            console.info(`\n🔧 Tool called: ${toolCall.function.name}`);
            console.info(`📝 Arguments: ${toolCall.function.arguments}`);
          },
          onUsageMetrics: (usage) => {
            updateTokens(usage);
          },
          onFinish: () => {
            console.info('\n✅ Web scraping example completed');
            displayTokenUsage('Web Scraping Example');
            console.info('');
          },
          onError: (error) => console.error('❌ Error:', error),
        },
        provider
      );
    }

    // Example 4: Generic MCP tool usage - use the first available tool
    if (tools.data.length > 0 && !fileReadTool && !webScrapeTool) {
      console.info('=== Example 4: Generic MCP Tool Usage ===\n');

      const firstTool = tools.data[0];
      console.info(`Using tool: ${firstTool.name}\n`);

      await client.streamChatCompletion(
        {
          model,
          messages: [
            {
              role: MessageRole.system,
              content: `You are a helpful assistant with access to various tools including ${firstTool.name}.`,
            },
            {
              role: MessageRole.user,
              content: `Can you help me use the ${firstTool.name} tool? What can it do?`,
            },
          ],
          max_tokens: 200,
        },
        {
          onOpen: () => console.info('🚀 Starting generic tool example...'),
          onContent: (content) => process.stdout.write(content),
          onTool: (toolCall) => {
            console.info(`\n🔧 Tool called: ${toolCall.function.name}`);
            console.info(`📝 Arguments: ${toolCall.function.arguments}`);
          },
          onUsageMetrics: (usage) => {
            updateTokens(usage);
          },
          onFinish: () => {
            console.info('\n✅ Generic tool example completed');
            displayTokenUsage('Generic Tool Example');
            console.info('');
          },
          onError: (error) => console.error('❌ Error:', error),
        },
        provider
      );
    }

    // Example 5: Data Analysis with File Operations
    if (tools.data.length > 1) {
      console.info('=== Example 5: Data Analysis with File Operations ===\n');

      await client.streamChatCompletion(
        {
          model,
          messages: [
            {
              role: MessageRole.system,
              content: `You are a helpful data analysis assistant with access to filesystem tools. Available directory is /tmp. You can read, write, and analyze files. The /tmp directory contains sample data files for analysis.`,
            },
            {
              role: MessageRole.user,
              content:
                'I need help with data analysis. First, can you check what files are available in the /tmp directory? Then create a simple CSV file with sample sales data in /tmp/sales_data.csv and analyze it.',
            },
          ],
          max_tokens: 400,
        },
        {
          onOpen: () => console.info('🚀 Starting data analysis example...'),
          onContent: (content) => process.stdout.write(content),
          onTool: (toolCall) => {
            console.info(`\n🔧 Tool called: ${toolCall.function.name}`);
            console.info(`📝 Arguments: ${toolCall.function.arguments}`);
          },
          onUsageMetrics: (usage) => {
            updateTokens(usage);
          },
          onFinish: () => {
            console.info('\n✅ Data analysis example completed');
            displayTokenUsage('Data Analysis Example');
            console.info('');
          },
          onError: (error) => console.error('❌ Error:', error),
        },
        provider
      );
    }

    // Example 6: File Creation and Manipulation
    console.info('=== Example 6: File Creation and Manipulation ===\n');

    await client.streamChatCompletion(
      {
        model,
        messages: [
          {
            role: MessageRole.system,
            content: `You are a helpful assistant with filesystem access. Available directory is /tmp. You can create, read, write, and manage files in this directory.`,
          },
          {
            role: MessageRole.user,
            content:
              'Can you create a simple todo list file at /tmp/todo.txt with 3 sample tasks, then read it back to me?',
          },
        ],
        max_tokens: 300,
      },
      {
        onOpen: () => console.info('🚀 Starting file manipulation example...'),
        onReasoning: (content) => process.stdout.write(content),
        onContent: (content) => process.stdout.write(content),
        onTool: (toolCall) => {
          console.info(`\n🔧 Tool called: ${toolCall.function.name}`);
          console.info(`📝 Arguments: ${toolCall.function.arguments}`);
        },
        onUsageMetrics: (usage) => {
          updateTokens(usage);
        },
        onFinish: () => {
          console.info('\n✅ File manipulation example completed');
          displayTokenUsage('File Manipulation Example');
          console.info('');
        },
        onError: (error) => console.error('❌ Error:', error),
      },
      provider
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('MCP tools endpoint is not exposed')
    ) {
      console.error(
        '❌ MCP tools are not exposed. Please ensure the Inference Gateway is started with EXPOSE_MCP=true'
      );
      console.info('\n💡 To fix this, restart the gateway with:');
      console.info('   docker-compose up --build');
    } else {
      console.error('❌ Error:', error);
    }
  } finally {
    // Display final token summary
    console.info('\n' + '='.repeat(60));
    console.info('📊 FINAL TOKEN USAGE SUMMARY');
    console.info('='.repeat(60));
    console.info(`🔢 Total Requests: ${tokenTracker.requestCount}`);
    console.info(
      `📊 Total Prompt Tokens: ${tokenTracker.totalPromptTokens.toLocaleString()}`
    );
    console.info(
      `✍️  Total Completion Tokens: ${tokenTracker.totalCompletionTokens.toLocaleString()}`
    );
    console.info(
      `🎯 Total Tokens Used: ${tokenTracker.totalTokens.toLocaleString()}`
    );

    if (tokenTracker.requestCount > 0) {
      console.info(
        `📈 Average Tokens per Request: ${Math.round(
          tokenTracker.totalTokens / tokenTracker.requestCount
        ).toLocaleString()}`
      );
    }

    // Calculate cost estimate (example rates - adjust based on actual provider pricing)
    const estimatedCost = tokenTracker.totalTokens * 0.000001; // Example: $0.000001 per token
    console.info(
      `💰 Estimated Cost: $${estimatedCost.toFixed(6)} (example rate)`
    );
    console.info('='.repeat(60));
  }
})();
