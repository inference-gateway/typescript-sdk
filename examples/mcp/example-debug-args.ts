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

  console.info(`🧪 Testing MCP Tool Arguments - ${model} on ${provider}\n`);

  try {
    await client.streamChatCompletion(
      {
        model,
        messages: [
          {
            role: MessageRole.user,
            content:
              'Please fetch the content from https://nextjs.org/docs and show me what you find.',
          },
        ],
        max_tokens: 500,
      },
      {
        onMCPTool: (toolCall) => {
          console.info(`\n🔧 MCP Tool Called: ${toolCall.function.name}`);
          console.info(`🆔 Tool ID: ${toolCall.id}`);
          console.info(`📝 Raw Arguments: ${toolCall.function.arguments}`);

          try {
            const args = JSON.parse(toolCall.function.arguments);
            console.info(`✅ Parsed Arguments:`, JSON.stringify(args, null, 2));

            // Show all available properties
            const keys = Object.keys(args);
            console.info(`🔑 Available properties: ${keys.join(', ')}`);
          } catch (e) {
            console.info(`❌ JSON Parse Error: ${e.message}`);
          }
          console.info(''); // Add spacing
        },
        onContent: (content) => {
          process.stdout.write(content);
        },
        onFinish: () => {
          console.info(`\n\n✅ Test completed!\n`);
        },
        onError: (error) => {
          console.error('\n❌ Error:', error);
        },
      },
      provider
    );
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
