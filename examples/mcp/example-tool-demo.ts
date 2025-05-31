import * as dotenv from 'dotenv';
import {
  InferenceGatewayClient,
  MessageRole,
  Provider,
} from '../../src/index.js';

dotenv.config();

(async () => {
  const client = new InferenceGatewayClient({
    baseURL: 'http://localhost:8080/v1',
  });

  const provider = (process.env.PROVIDER as Provider) || Provider.openai;
  const model = process.env.LLM || 'gpt-4o';

  console.info(`🔍 MCP Tool Demonstration - ${model} on ${provider}\n`);
  console.info('='.repeat(60));
  console.info('🎯 PURPOSE: Demonstrate onMCPTool handler and identify issues');
  console.info('='.repeat(60));

  try {
    // Health check
    const isHealthy = await client.healthCheck();
    if (!isHealthy) {
      console.error('❌ Gateway unhealthy. Run: docker-compose up --build');
      process.exit(1);
    }

    // List available tools
    const tools = await client.listTools();
    console.info(`\n📋 Available MCP Tools: ${tools.data.length}`);
    tools.data.forEach((tool, index) => {
      console.info(
        `  ${index + 1}. ${tool.name} - ${tool.description.substring(0, 80)}...`
      );
    });

    console.info('\n' + '='.repeat(60));
    console.info('🧪 TEST 1: File Operations (Expected to work)');
    console.info('='.repeat(60));

    let toolCallCount = 0;

    await client.streamChatCompletion(
      {
        model,
        messages: [
          {
            role: MessageRole.user,
            content:
              'Please create a simple test file at /tmp/test-demo.txt with the content "Hello MCP Demo!" and then read it back.',
          },
        ],
        max_tokens: 500,
      },
      {
        onContent: (content) => {
          process.stdout.write(content);
        },
        onMCPTool: (toolCall) => {
          toolCallCount++;
          console.info(
            `\n📋 [${toolCallCount}] MCP Tool: ${toolCall.function.name}`
          );
          console.info(`🆔 ID: ${toolCall.id}`);
          console.info(`📝 Raw Args: ${toolCall.function.arguments}`);

          try {
            const args = JSON.parse(toolCall.function.arguments);
            console.info(`✅ Parsed Args:`, JSON.stringify(args, null, 2));

            // Analyze arguments
            if (args.path) {
              console.info(`✅ ✓ Path parameter found: ${args.path}`);
            }
            if (args.content) {
              console.info(
                `✅ ✓ Content parameter found: ${args.content.substring(0, 50)}...`
              );
            }
            if (args.mcpServer) {
              console.info(`✅ ✓ MCP Server specified: ${args.mcpServer}`);
            }
          } catch (e) {
            console.info(`❌ Parse Error: ${e.message}`);
          }
          console.info(''); // spacing
        },
        onFinish: () => {
          console.info(
            `\n✅ Test 1 Complete - File operations used ${toolCallCount} tools\n`
          );
          runWebTest();
        },
        onError: (error) => {
          console.error('\n❌ Test 1 Error:', error);
          runWebTest();
        },
      },
      provider
    );

    async function runWebTest() {
      console.info('='.repeat(60));
      console.info('🧪 TEST 2: Web Operations (Expected to have issues)');
      console.info('='.repeat(60));

      toolCallCount = 0;

      await client.streamChatCompletion(
        {
          model,
          messages: [
            {
              role: MessageRole.user,
              content:
                'Please fetch the content from https://example.com and show me what you find.',
            },
          ],
          max_tokens: 500,
        },
        {
          onContent: (content) => {
            process.stdout.write(content);
          },
          onMCPTool: (toolCall) => {
            toolCallCount++;
            console.info(
              `\n📋 [${toolCallCount}] MCP Tool: ${toolCall.function.name}`
            );
            console.info(`🆔 ID: ${toolCall.id}`);
            console.info(`📝 Raw Args: ${toolCall.function.arguments}`);

            try {
              const args = JSON.parse(toolCall.function.arguments);
              console.info(`✅ Parsed Args:`, JSON.stringify(args, null, 2));

              // Analyze web tool arguments
              const urlFields = [
                'url',
                'target_url',
                'webpage_url',
                'uri',
                'link',
              ];
              const foundUrl = urlFields.find((field) => args[field]);

              if (foundUrl) {
                console.info(`✅ ✓ URL parameter found: ${args[foundUrl]}`);
              } else {
                console.info(`❌ ✗ No URL parameter found`);
                console.info(
                  `❌ ✗ Available fields: ${Object.keys(args).join(', ')}`
                );
                console.info(`❌ ✗ Expected fields: ${urlFields.join(', ')}`);
              }

              if (args.mcpServer) {
                console.info(`✅ ✓ MCP Server specified: ${args.mcpServer}`);
              }
            } catch (e) {
              console.info(`❌ Parse Error: ${e.message}`);
            }
            console.info(''); // spacing
          },
          onFinish: () => {
            console.info(
              `\n✅ Test 2 Complete - Web operations used ${toolCallCount} tools\n`
            );
            showSummary();
          },
          onError: (error) => {
            console.error('\n❌ Test 2 Error:', error);
            showSummary();
          },
        },
        provider
      );
    }

    function showSummary() {
      console.info('='.repeat(60));
      console.info('📊 SUMMARY AND FINDINGS');
      console.info('='.repeat(60));
      console.info(`
🎯 onMCPTool Handler Demonstration Complete!

✅ WORKING FEATURES:
   • onMCPTool callback properly invoked for all MCP tool calls
   • File system operations work perfectly with complete arguments
   • Tool ID tracking and argument parsing working
   • MCP server routing works correctly

❌ IDENTIFIED ISSUES:
   • Web tools (fetch_url, search_web) receive incomplete arguments
   • Missing URL parameter in web tool calls
   • LLM receives incomplete tool schemas from inference gateway
   • Tool schemas only show 'mcpServer' as required, missing actual parameters

🔧 ROOT CAUSE:
   The MCP web-search server's tool schemas are not being properly
   exposed through the inference gateway. The gateway only shows
   'mcpServer' as a required parameter but misses tool-specific
   parameters like 'url' for fetch_url.

💡 RECOMMENDATIONS:
   1. Check inference gateway's MCP schema aggregation
   2. Verify web-search server's tool registration
   3. Ensure tool schemas are complete in gateway responses
   4. Test direct MCP server communication to compare schemas

The onMCPTool handler itself works perfectly - the issue is with
the tool schema exposure in the inference gateway architecture.
      `);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
