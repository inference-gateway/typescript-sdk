import * as dotenv from 'dotenv';
import {
  InferenceGatewayClient,
  MessageRole,
  Provider,
} from '../../src/index.js';

// Load environment variables from .env file
dotenv.config();

(async () => {
  const client = new InferenceGatewayClient({
    baseURL: 'http://localhost:8080/v1',
  });

  const provider = (process.env.PROVIDER as Provider) || Provider.openai;
  const model = process.env.LLM || 'gpt-4o';

  console.info(`🚀 Next.js App Creator using ${model} on ${provider}\n`);

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

    console.info('=== Next.js App Creator with Documentation ===\n');

    let toolCallCount = 0;
    let webToolCalls = 0;
    let fileToolCalls = 0;

    await client.streamChatCompletion(
      {
        model,
        messages: [
          {
            role: MessageRole.system,
            content: `You are an expert Next.js developer assistant with access to MCP tools for web content fetching and file operations.

Your task is to:
1. Fetch the latest Next.js documentation from official sources
2. Create a complete Next.js application structure following current best practices
3. Use the documentation to ensure you're following the latest patterns and conventions
4. Create all necessary files with proper TypeScript setup
5. Include modern Next.js features like App Router, Server Components, etc.

Available MCP tools:
- fetch_url: Get content from Next.js documentation URLs
- write_file: Create application files 
- read_file: Read existing files
- list_directory: Check directory structure

Please be thorough and create a production-ready Next.js app structure with:
- package.json with latest dependencies
- next.config.js with proper configuration
- tsconfig.json for TypeScript
- App Router structure (app/ directory)
- A sample page with components
- Basic styling setup
- README with instructions

Always reference the official documentation to ensure accuracy.`,
          },
          {
            role: MessageRole.user,
            content: `Please create a complete Next.js application following the latest documentation and best practices. 

First, fetch the current Next.js documentation from https://nextjs.org/docs to understand the latest features and setup requirements, then create a full application structure in the /tmp/nextjs-app/ directory.

The app should include:
1. Modern App Router setup
2. TypeScript configuration
3. A homepage with navigation
4. A sample about page
5. Basic component structure
6. Proper styling setup (CSS modules or Tailwind)
7. Package.json with all necessary dependencies

Make sure to follow the official documentation patterns exactly.`,
          },
        ],
        max_tokens: 4000,
      },
      {
        onOpen: () => {
          console.info(
            '🔗 Connection opened, starting Next.js app creation...\n'
          );
        },
        onContent: (content) => {
          process.stdout.write(content);
        },
        onMCPTool: (toolCall) => {
          toolCallCount++;

          if (toolCall.function.name === 'fetch_url') {
            webToolCalls++;
            console.info(
              `\n🌐 [${toolCallCount}] Fetching Documentation: ${toolCall.function.name}`
            );
            try {
              const args = JSON.parse(toolCall.function.arguments);
              console.info(`📝 Raw Arguments:`, JSON.stringify(args, null, 2));

              // Handle different possible argument field names
              const url =
                args.url ||
                args.target_url ||
                args.webpage_url ||
                args.uri ||
                args.link ||
                (args.arguments && args.arguments.url) ||
                'URL not found';
              console.info(`🔗 URL: ${url}`);
              if (args.timeout) {
                console.info(`⏱️  Timeout: ${args.timeout}ms`);
              }
              if (args.mcpServer) {
                console.info(`🖥️  MCP Server: ${args.mcpServer}`);
              }
            } catch (e) {
              console.info(`📝 Raw Arguments: ${toolCall.function.arguments}`);
              console.info(`⚠️  Parse Error: ${e.message}`);
            }
          } else if (
            toolCall.function.name.includes('file') ||
            toolCall.function.name.includes('directory')
          ) {
            fileToolCalls++;
            console.info(
              `\n📁 [${toolCallCount}] File Operation: ${toolCall.function.name}`
            );
            try {
              const args = JSON.parse(toolCall.function.arguments);
              // Handle different path field names
              const path =
                args.file_path ||
                args.path ||
                args.directory_path ||
                args.target_path;
              if (path) {
                const fileName = path.split('/').pop();
                console.info(`📄 Path: ${fileName} (${path})`);
              }
              if (args.content && args.content.length > 150) {
                console.info(
                  `📝 Content: ${args.content.substring(0, 150)}... (${
                    args.content.length
                  } chars)`
                );
              } else if (args.content) {
                console.info(`📝 Content: ${args.content}`);
              }
              if (args.mcpServer) {
                console.info(`🖥️  MCP Server: ${args.mcpServer}`);
              }
            } catch (e) {
              console.info(`📝 Raw Arguments: ${toolCall.function.arguments}`);
              console.info(`⚠️  Parse Error: ${e.message}`);
            }
          } else {
            console.info(
              `\n🛠️  [${toolCallCount}] MCP Tool: ${toolCall.function.name}`
            );
            try {
              const args = JSON.parse(toolCall.function.arguments);
              console.info(`📝 Arguments:`, JSON.stringify(args, null, 2));
            } catch (e) {
              console.info(`📝 Raw Arguments: ${toolCall.function.arguments}`);
              console.info(`⚠️  Parse Error: ${e.message}`);
            }
          }

          console.info(`🔍 Tool ID: ${toolCall.id}`);
          console.info(''); // Add spacing
        },
        onTool: (toolCall) => {
          // Handle any regular (non-MCP) tools if present
          console.info(`\n🔧 Regular Tool: ${toolCall.function.name}`);
          console.info(`🔍 Tool ID: ${toolCall.id}\n`);
        },
        onUsageMetrics: (usage) => {
          console.info(
            `\n📊 Token Usage - Prompt: ${usage.prompt_tokens}, Completion: ${usage.completion_tokens}, Total: ${usage.total_tokens}`
          );
        },
        onFinish: () => {
          console.info(`\n\n✅ Next.js App Creation Completed!`);
          console.info(`📈 Total Tools Used: ${toolCallCount}`);
          console.info(`🌐 Documentation Fetches: ${webToolCalls}`);
          console.info(`📁 File Operations: ${fileToolCalls}`);
          console.info(
            `\n🎯 Your Next.js app has been created in /tmp/nextjs-app/`
          );
          console.info(`📖 Check the README.md file for setup instructions\n`);
        },
        onError: (error) => {
          console.error('\n❌ Stream Error:', error);
        },
      },
      provider
    );

    // After completion, show the created structure
    console.info('\n=== Created File Structure ===\n');
    await showDirectoryStructure(client, model, provider);
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

async function showDirectoryStructure(
  client: InferenceGatewayClient,
  model: string,
  provider: Provider
) {
  await client.streamChatCompletion(
    {
      model,
      messages: [
        {
          role: MessageRole.system,
          content: `You are a file system assistant. Use the list_directory tool to show the structure of the created Next.js application.`,
        },
        {
          role: MessageRole.user,
          content:
            'Please show me the complete directory structure of /tmp/nextjs-app/ including all subdirectories and files.',
        },
      ],
      max_tokens: 1000,
    },
    {
      onContent: (content) => {
        process.stdout.write(content);
      },
      onMCPTool: (toolCall) => {
        if (toolCall.function.name === 'list_directory') {
          try {
            const args = JSON.parse(toolCall.function.arguments);
            console.info(
              `\n📂 Listing: ${args.file_path || args.directory_path || 'directory'}`
            );
          } catch {
            console.info(`\n📂 Listing directory...`);
          }
        }
      },
      onFinish: () => {
        console.info(`\n\n🎉 Next.js application structure complete!`);
        console.info(`\nTo run your app:`);
        console.info(`1. cd /tmp/nextjs-app`);
        console.info(`2. npm install`);
        console.info(`3. npm run dev`);
        console.info(`4. Open http://localhost:3000\n`);
      },
    },
    provider
  );
}
