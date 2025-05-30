import {
  ChatCompletionToolType,
  InferenceGatewayClient,
  MessageRole,
  Provider,
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
    // Example 1: Simple chat completion
    console.log('🤖 Example 1: Simple Chat Completion');
    const response = await client.createChatCompletion(
      {
        model,
        messages: [
          {
            role: MessageRole.system,
            content:
              'You are a helpful assistant that provides concise answers.',
          },
          {
            role: MessageRole.user,
            content: 'Tell me a fun fact about TypeScript.',
          },
        ],
        max_tokens: 150,
      },
      provider
    );

    console.log('Response:', response.choices[0].message.content);
    console.log('Usage:', response.usage);
    console.log('---\n');

    // Example 2: Streaming chat completion
    console.log('🌊 Example 2: Streaming Chat Completion');
    console.log('Assistant: ');

    await client.streamChatCompletion(
      {
        model,
        messages: [
          {
            role: MessageRole.system,
            content:
              'You are a creative storyteller. Tell engaging short stories.',
          },
          {
            role: MessageRole.user,
            content: 'Tell me a short story about a robot learning to paint.',
          },
        ],
        max_tokens: 200,
      },
      {
        onOpen: () => console.log('[Stream opened]'),
        onContent: (content) => process.stdout.write(content),
        onChunk: (chunk) => {
          // Optional: log chunk metadata
          if (chunk.id) {
            // console.log(`\n[Chunk: ${chunk.id}]`);
          }
        },
        onUsageMetrics: (metrics) => {
          console.log(`\n\n[Usage: ${metrics.total_tokens} tokens]`);
        },
        onFinish: () => console.log('\n[Stream completed]'),
        onError: (error) => console.error('\n[Stream error]:', error),
      },
      provider
    );

    console.log('\n---\n');

    // Example 3: Multi-turn conversation
    console.log('💬 Example 3: Multi-turn Conversation');

    const conversation = [
      {
        role: MessageRole.system,
        content: 'You are a helpful programming tutor.',
      },
      {
        role: MessageRole.user,
        content: 'What is the difference between let and const in JavaScript?',
      },
    ];

    // First message
    const firstResponse = await client.createChatCompletion(
      {
        model,
        messages: conversation,
        max_tokens: 200,
      },
      provider
    );

    console.log('Tutor:', firstResponse.choices[0].message.content);

    // Add assistant response to conversation
    conversation.push({
      role: MessageRole.assistant,
      content: firstResponse.choices[0].message.content || '',
    });

    // Add follow-up question
    conversation.push({
      role: MessageRole.user,
      content: 'Can you give me a simple code example showing the difference?',
    });

    // Second message
    const secondResponse = await client.createChatCompletion(
      {
        model,
        messages: conversation,
        max_tokens: 300,
      },
      provider
    );

    console.log(
      '\nTutor (follow-up):',
      secondResponse.choices[0].message.content
    );
    console.log('---\n');

    // Example 4: Tool calls (function calling)
    console.log('🔧 Example 4: Function Calling');

    await client.streamChatCompletion(
      {
        model,
        messages: [
          {
            role: MessageRole.user,
            content: "What's the weather like in San Francisco and New York?",
          },
        ],
        tools: [
          {
            type: ChatCompletionToolType.function,
            function: {
              name: 'get_weather',
              description: 'Get the current weather in a given location',
              parameters: {
                type: 'object',
                properties: {
                  location: {
                    type: 'string',
                    description: 'The city and state, e.g. San Francisco, CA',
                  },
                  unit: {
                    type: 'string',
                    enum: ['celsius', 'fahrenheit'],
                    description: 'The unit of temperature',
                  },
                },
                required: ['location'],
              },
              strict: true,
            },
          },
        ],
      },
      {
        onTool: (toolCall) => {
          console.log(`\n🔧 Tool called: ${toolCall.function.name}`);
          console.log(`Arguments: ${toolCall.function.arguments}`);

          // In a real application, you would execute the function here
          // and then continue the conversation with the result
          try {
            const args = JSON.parse(toolCall.function.arguments);
            console.log(`[Simulated] Getting weather for: ${args.location}`);
          } catch {
            console.log('Could not parse tool arguments');
          }
        },
        onReasoning: (reasoning) => {
          if (reasoning.trim()) {
            console.log(`\n🧠 Reasoning: ${reasoning}`);
          }
        },
        onContent: (content) => {
          process.stdout.write(content);
        },
        onFinish: () => console.log('\n[Function calling completed]'),
        onError: (error) => console.error('\n[Error]:', error),
      },
      provider
    );
  } catch (error) {
    console.error('Error in chat examples:', error);
    process.exit(1);
  }
};

// Run the main function
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
