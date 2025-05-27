import {
  ChatCompletionToolType,
  InferenceGatewayClient,
  MessageRole,
  Provider,
} from '@inference-gateway/sdk';

(async () => {
  const client = new InferenceGatewayClient({
    baseURL: 'http://localhost:8080/v1',
  });

  const provider = (process.env.PROVIDER as Provider) || Provider.groq;
  const model = process.env.LLM || 'groq/meta-llama/llama-3.3-70b-versatile';

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

    // Example 1: Use MCP tools for file operations (if filesystem MCP server is available)
    const fileReadTool = tools.data.find((tool) => tool.name === 'read_file');
    if (fileReadTool) {
      console.log('=== Example 1: File Operations with MCP ===\n');

      await client.streamChatCompletion(
        {
          model,
          messages: [
            {
              role: MessageRole.system,
              content:
                'You are a helpful assistant that can read files using MCP tools. When asked to read a file, use the read_file tool.',
            },
            {
              role: MessageRole.user,
              content:
                'Can you read the contents of /tmp/example.txt if it exists?',
            },
          ],
          tools: [
            {
              type: ChatCompletionToolType.function,
              function: {
                name: fileReadTool.name,
                description: fileReadTool.description,
                parameters: fileReadTool.input_schema,
                strict: true,
              },
            },
          ],
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

    // Example 2: Use MCP tools for web scraping (if web scraper MCP server is available)
    const webScrapeTool = tools.data.find(
      (tool) => tool.name.includes('fetch') || tool.name.includes('scrape')
    );
    if (webScrapeTool) {
      console.log('=== Example 2: Web Scraping with MCP ===\n');

      await client.streamChatCompletion(
        {
          model,
          messages: [
            {
              role: MessageRole.system,
              content:
                'You are a helpful assistant that can fetch web content using MCP tools. Use the available tools to gather information from websites.',
            },
            {
              role: MessageRole.user,
              content:
                'Can you fetch information from https://httpbin.org/json and tell me what you find?',
            },
          ],
          tools: [
            {
              type: ChatCompletionToolType.function,
              function: {
                name: webScrapeTool.name,
                description: webScrapeTool.description,
                parameters: webScrapeTool.input_schema,
                strict: true,
              },
            },
          ],
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

    // Example 3: Generic MCP tool usage - use the first available tool
    if (tools.data.length > 0 && !fileReadTool && !webScrapeTool) {
      console.log('=== Example 3: Generic MCP Tool Usage ===\n');

      const firstTool = tools.data[0];
      console.log(`Using tool: ${firstTool.name}\n`);

      await client.streamChatCompletion(
        {
          model,
          messages: [
            {
              role: MessageRole.system,
              content: `You are a helpful assistant that has access to the ${firstTool.name} tool. Use it when appropriate to help the user.`,
            },
            {
              role: MessageRole.user,
              content: `Can you help me use the ${firstTool.name} tool? What can it do?`,
            },
          ],
          tools: [
            {
              type: ChatCompletionToolType.function,
              function: {
                name: firstTool.name,
                description: firstTool.description,
                parameters: firstTool.input_schema,
                strict: true,
              },
            },
          ],
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

    // Example 4: Multi-tool conversation
    if (tools.data.length > 1) {
      console.log('=== Example 4: Multi-Tool Conversation ===\n');

      const availableTools = tools.data.slice(0, 3).map((tool) => ({
        type: ChatCompletionToolType.function,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.input_schema,
          strict: true,
        },
      }));

      await client.streamChatCompletion(
        {
          model,
          messages: [
            {
              role: MessageRole.system,
              content: `You are a helpful assistant with access to multiple MCP tools: ${tools.data
                .slice(0, 3)
                .map((t) => t.name)
                .join(
                  ', '
                )}. Use these tools to help the user accomplish their tasks.`,
            },
            {
              role: MessageRole.user,
              content:
                'I need help with data analysis. Can you show me what tools are available and suggest how to use them?',
            },
          ],
          tools: availableTools,
        },
        {
          onOpen: () => console.log('🚀 Starting multi-tool conversation...'),
          onContent: (content) => process.stdout.write(content),
          onTool: (toolCall) => {
            console.log(`\n🔧 Tool called: ${toolCall.function.name}`);
            console.log(`📝 Arguments: ${toolCall.function.arguments}`);
          },
          onFinish: () =>
            console.log('\n✅ Multi-tool conversation completed\n'),
          onError: (error) => console.error('❌ Error:', error),
        },
        provider
      );
    }
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
