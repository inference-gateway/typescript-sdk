import {
  InferenceGatewayClient,
  MessagesMessageRole,
  Provider,
  TextContentPartType,
} from '@inference-gateway/sdk';

const main = async () => {
  const client = new InferenceGatewayClient({
    baseURL: 'http://localhost:8080/v1',
  });

  const provider = process.env.PROVIDER as Provider;
  const model = process.env.LLM;

  if (!provider) {
    console.error('Please set the PROVIDER environment variable');
    process.exit(1);
  }

  if (!model) {
    console.error('Please set the LLM environment variable');
    process.exit(1);
  }

  console.log(`Using provider: ${provider}`);
  console.log(`Using model: ${model}`);
  console.log('---');

  try {
    // Example 1: Simple message
    console.log('🤖 Example 1: Simple Message');
    const response = await client.createMessage(
      {
        model,
        max_tokens: 150,
        system: 'You are a helpful assistant that provides concise answers.',
        messages: [
          {
            role: MessagesMessageRole.MessagesMessageRoleUser,
            content: 'Tell me a fun fact about TypeScript.',
          },
        ],
      },
      provider
    );

    for (const block of response.content) {
      if (block.type === TextContentPartType.text) {
        console.log('Response:', block.text);
      }
    }
    console.log('Stop reason:', response.stop_reason);
    console.log('Usage:', response.usage);
    console.log('---\n');

    // Example 2: Streaming message
    console.log('🌊 Example 2: Streaming Message');
    console.log('Assistant: ');

    await client.streamMessage(
      {
        model,
        max_tokens: 200,
        messages: [
          {
            role: MessagesMessageRole.MessagesMessageRoleUser,
            content: 'Tell me a short story about a robot learning to paint.',
          },
        ],
      },
      {
        onOpen: () => console.log('[Stream opened]'),
        onContent: (text) => process.stdout.write(text),
        onThinking: (thinking) => process.stdout.write(thinking),
        onUsageMetrics: (usage) => {
          console.log(`\n\n[Usage: ${usage.output_tokens} output tokens]`);
        },
        onFinish: () => console.log('[Stream completed]'),
        onError: (error) => console.error('\n[Stream error]:', error),
      },
      provider
    );

    console.log('---\n');

    // Example 3: Tool use
    console.log('🔧 Example 3: Tool Use');

    await client.streamMessage(
      {
        model,
        max_tokens: 300,
        messages: [
          {
            role: MessagesMessageRole.MessagesMessageRoleUser,
            content: "What's the weather like in San Francisco?",
          },
        ],
        tools: [
          {
            name: 'get_weather',
            description: 'Get the current weather in a given location',
            input_schema: {
              type: 'object',
              properties: {
                location: {
                  type: 'string',
                  description: 'The city and state, e.g. San Francisco, CA',
                },
              },
              required: ['location'],
            },
          },
        ],
      },
      {
        onContent: (text) => process.stdout.write(text),
        onTool: (toolUse) => {
          console.log(`\n🔧 Tool called: ${toolUse.name}`);
          console.log(`Input: ${JSON.stringify(toolUse.input)}`);
          // In a real application, you would execute the tool here and send
          // the result back as a tool_result content block in a new message
        },
        onFinish: () => console.log('\n[Tool use completed]'),
        onError: (error) => console.error('\n[Error]:', error),
      },
      provider
    );
  } catch (error) {
    console.error('Error in messages examples:', error);
    process.exit(1);
  }
};

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
