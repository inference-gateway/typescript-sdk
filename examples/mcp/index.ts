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

  console.log(`Using model: ${model}`);
  console.log(`Using provider: ${provider}\n`);

  console.log('=== MCP Tools Example ===\n');

  try {
    // First, let's check if the gateway is healthy
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

    tools.data.forEach((tool, index) => {
      console.log(`${index + 1}. ${tool.name}`);
      console.log(`   Description: ${tool.description}`);
      console.log(`   Server: ${tool.server}`);
      console.log(`   Schema: ${JSON.stringify(tool.input_schema, null, 2)}\n`);
    });

    if (tools.data.length === 0) {
      console.log(
        '⚠️  No MCP tools available. Ensure MCP servers are configured and running.'
      );
      return;
    }

    // Example 0: Simple test without tools first
    console.log('=== Example 0: Simple Test (No Tools) ===\n');
    console.log('Testing basic streaming without tools first...\n');

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
        onOpen: () => console.log('🚀 Starting simple test...'),
        onContent: (content) => process.stdout.write(content),
        onTool: (toolCall) => {
          console.log(`\n🔧 Tool called: ${toolCall.function.name}`);
          console.log(`📝 Arguments: ${toolCall.function.arguments}`);
        },
        onFinish: () => {
          console.log('\n✅ Simple test completed\n');
        },
        onError: (error) => console.error('❌ Error:', error),
      },
      provider
    );

    // Example 1: Automatic tool discovery and usage
    console.log('=== Example 1: Automatic Tool Discovery ===\n');
    console.log(
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
        onOpen: () => console.log('🚀 Starting automatic tool discovery...'),
        onContent: (content) => process.stdout.write(content),
        onTool: (toolCall) => {
          console.log(
            `\n🔧 Tool automatically called: ${toolCall.function.name}`
          );
          console.log(`📝 Arguments: ${toolCall.function.arguments}`);
        },
        onFinish: () =>
          console.log('\n✅ Automatic tool discovery completed\n'),
        onError: (error) => console.error('❌ Error:', error),
      },
      provider
    );

    // Example 2: Use MCP tools for file operations (if filesystem MCP server is available)
    const fileReadTool = tools.data.find((tool) => tool.name === 'read_file');
    if (fileReadTool) {
      console.log('=== Example 2: File Operations with MCP ===\n');

      await client.streamChatCompletion(
        {
          model,
          messages: [
            {
              role: MessageRole.system,
              content:
                'You are a helpful assistant with access to filesystem operations. Available directories are /shared and /tmp.',
            },
            {
              role: MessageRole.user,
              content:
                'Can you read the contents of /shared/mcp-filesystem-example.txt and tell me what it contains?',
            },
          ],
          max_tokens: 200,
        },
        {
          onOpen: () => console.log('🚀 Starting file reading example...'),
          onContent: (content) => process.stdout.write(content),
          onTool: (toolCall) => {
            console.log(`\n🔧 Tool called: ${toolCall.function.name}`);
            console.log(`📝 Arguments: ${toolCall.function.arguments}`);
          },
          onFinish: () => console.log('\n✅ File reading example completed\n'),
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
      console.log('=== Example 3: Web Scraping with MCP ===\n');

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
          onOpen: () => console.log('🚀 Starting web scraping example...'),
          onContent: (content) => process.stdout.write(content),
          onTool: (toolCall) => {
            console.log(`\n🔧 Tool called: ${toolCall.function.name}`);
            console.log(`📝 Arguments: ${toolCall.function.arguments}`);
          },
          onFinish: () => console.log('\n✅ Web scraping example completed\n'),
          onError: (error) => console.error('❌ Error:', error),
        },
        provider
      );
    }

    // Example 4: Generic MCP tool usage - use the first available tool
    if (tools.data.length > 0 && !fileReadTool && !webScrapeTool) {
      console.log('=== Example 4: Generic MCP Tool Usage ===\n');

      const firstTool = tools.data[0];
      console.log(`Using tool: ${firstTool.name}\n`);

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
          onOpen: () => console.log('🚀 Starting generic tool example...'),
          onContent: (content) => process.stdout.write(content),
          onTool: (toolCall) => {
            console.log(`\n🔧 Tool called: ${toolCall.function.name}`);
            console.log(`📝 Arguments: ${toolCall.function.arguments}`);
          },
          onFinish: () => console.log('\n✅ Generic tool example completed\n'),
          onError: (error) => console.error('❌ Error:', error),
        },
        provider
      );
    }

    // Example 5: Data Analysis with File Operations
    if (tools.data.length > 1) {
      console.log('=== Example 5: Data Analysis with File Operations ===\n');

      await client.streamChatCompletion(
        {
          model,
          messages: [
            {
              role: MessageRole.system,
              content: `You are a helpful data analysis assistant with access to filesystem tools. Available directories are /shared and /tmp. You can read, write, and analyze files. The /shared directory contains sample data files for analysis.`,
            },
            {
              role: MessageRole.user,
              content:
                'I need help with data analysis. First, can you check what files are available in the /shared directory? Then create a simple CSV file with sample sales data in /tmp/sales_data.csv and analyze it.',
            },
          ],
          max_tokens: 400,
        },
        {
          onOpen: () => console.log('🚀 Starting data analysis example...'),
          onContent: (content) => process.stdout.write(content),
          onTool: (toolCall) => {
            console.log(`\n🔧 Tool called: ${toolCall.function.name}`);
            console.log(`📝 Arguments: ${toolCall.function.arguments}`);
          },
          onFinish: () => console.log('\n✅ Data analysis example completed\n'),
          onError: (error) => console.error('❌ Error:', error),
        },
        provider
      );
    }

    // Example 6: File Creation and Manipulation
    console.log('=== Example 6: File Creation and Manipulation ===\n');

    await client.streamChatCompletion(
      {
        model,
        messages: [
          {
            role: MessageRole.system,
            content: `You are a helpful assistant with filesystem access. Available directories are /shared and /tmp. You can create, read, write, and manage files in these directories.`,
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
        onOpen: () => console.log('🚀 Starting file manipulation example...'),
        onContent: (content) => process.stdout.write(content),
        onTool: (toolCall) => {
          console.log(`\n🔧 Tool called: ${toolCall.function.name}`);
          console.log(`📝 Arguments: ${toolCall.function.arguments}`);
        },
        onFinish: () =>
          console.log('\n✅ File manipulation example completed\n'),
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
      console.log('\n💡 To fix this, restart the gateway with:');
      console.log('   docker-compose up --build');
    } else {
      console.error('❌ Error:', error);
    }
  }
})();
