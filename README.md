# Inference Gateway TypeScript SDK

An SDK written in TypeScript for the [Inference Gateway](https://github.com/inference-gateway/inference-gateway).

- [Inference Gateway TypeScript SDK](#inference-gateway-typescript-sdk)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Creating a Client](#creating-a-client)
    - [Listing Models](#listing-models)
    - [Calling the MCP Endpoint](#calling-the-mcp-endpoint)
    - [Creating Chat Completions](#creating-chat-completions)
    - [Streaming Chat Completions](#streaming-chat-completions)
    - [Tool Calls](#tool-calls)
    - [Proxying Requests](#proxying-requests)
    - [Health Check](#health-check)
    - [Creating a Client with Custom Options](#creating-a-client-with-custom-options)
    - [Examples](#examples)
  - [Contributing](#contributing)
  - [License](#license)

## Installation

Run `npm i @inference-gateway/sdk`.

## Usage

### Creating a Client

```typescript
import { InferenceGatewayClient } from '@inference-gateway/sdk';

// Create a client with default options
const client = new InferenceGatewayClient({
  baseURL: 'http://localhost:8080/v1',
  apiKey: 'your-api-key', // Optional
});
```

### Listing Models

To list all available models:

```typescript
import { InferenceGatewayClient, Provider } from '@inference-gateway/sdk';

const client = new InferenceGatewayClient({
  baseURL: 'http://localhost:8080/v1',
});

try {
  // List all models
  const models = await client.listModels();
  console.log('All models:', models);

  // List models from a specific provider
  const openaiModels = await client.listModels(Provider.openai);
  console.log('OpenAI models:', openaiModels);
} catch (error) {
  console.error('Error:', error);
}
```

### Calling the MCP Endpoint

The gateway also exposes itself as an MCP server: a JSON-RPC 2.0 endpoint at
the root `/mcp` that aggregates every configured MCP server. The `/v1` suffix
is stripped from the baseURL, the headers the endpoint requires are derived
from the request, and the required `params._meta` entries are defaulted:

```typescript
import {
  InferenceGatewayClient,
  MCPJSONRPCRequestMethod,
} from '@inference-gateway/sdk';

const client = new InferenceGatewayClient({
  baseURL: 'http://localhost:8080/v1',
});

const tools = await client.mcpJsonRpc({
  jsonrpc: '2.0',
  id: 1,
  method: MCPJSONRPCRequestMethod.tools_list,
});
console.log(tools.result);

const call = await client.mcpJsonRpc({
  jsonrpc: '2.0',
  id: 2,
  method: MCPJSONRPCRequestMethod.tools_call,
  params: {
    name: 'mcp_deepwiki_ask_question',
    arguments: { question: 'How is MCP wired up?' },
  },
});

// JSON-RPC failures come back as an error envelope, not an exception
if (call.error) {
  console.error(call.error.code, call.error.message);
}
```

When the gateway requires authentication, the authorization servers that mint
tokens for the MCP endpoint are discoverable without a token:

```typescript
const metadata = await client.getMCPProtectedResourceMetadata();
console.log(metadata.resource, metadata.authorization_servers);
```

### Creating Chat Completions

To generate content using a model:

```typescript
import {
  InferenceGatewayClient,
  MessageRole,
  Provider,
} from '@inference-gateway/sdk';

const client = new InferenceGatewayClient({
  baseURL: 'http://localhost:8080/v1',
});

try {
  const response = await client.createChatCompletion(
    {
      model: 'gpt-4o',
      messages: [
        {
          role: MessageRole.System,
          content: 'You are a helpful assistant',
        },
        {
          role: MessageRole.User,
          content: 'Tell me a joke',
        },
      ],
    },
    Provider.openai
  ); // Provider is optional

  console.log('Response:', response.choices[0].message.content);
} catch (error) {
  console.error('Error:', error);
}
```

### Streaming Chat Completions

To stream content from a model:

```typescript
import {
  InferenceGatewayClient,
  MessageRole,
  Provider,
} from '@inference-gateway/sdk';

const client = new InferenceGatewayClient({
  baseURL: 'http://localhost:8080/v1',
});

try {
  await client.streamChatCompletion(
    {
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: MessageRole.User,
          content: 'Tell me a story',
        },
      ],
    },
    {
      onOpen: () => console.log('Stream opened'),
      onContent: (content) => process.stdout.write(content),
      onChunk: (chunk) => console.log('Received chunk:', chunk.id),
      onUsageMetrics: (metrics) => console.log('Usage metrics:', metrics),
      onFinish: () => console.log('\nStream completed'),
      onError: (error) => console.error('Stream error:', error),
    },
    Provider.groq // Provider is optional
  );
} catch (error) {
  console.error('Error:', error);
}
```

### Tool Calls

To use tool calls with models that support them:

```typescript
import {
  ChatCompletionToolType,
  InferenceGatewayClient,
  MessageRole,
  Provider,
} from '@inference-gateway/sdk';

const client = new InferenceGatewayClient({
  baseURL: 'http://localhost:8080/v1',
});

try {
  await client.streamChatCompletion(
    {
      model: 'openai/gpt-4o',
      messages: [
        {
          role: MessageRole.User,
          content: "What's the weather in San Francisco?",
        },
      ],
      tools: [
        {
          type: ChatCompletionToolType.function,
          function: {
            name: 'get_weather',
            parameters: {
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
        },
      ],
    },
    {
      onTool: (toolCall) => {
        console.log('Tool call:', toolCall.function.name);
        console.log('Arguments:', toolCall.function.arguments);
      },
      onReasoning: (reasoning) => {
        console.log('Reasoning:', reasoning);
      },
      onContent: (content) => {
        console.log('Content:', content);
      },
      onFinish: () => console.log('\nStream completed'),
    }
  );
} catch (error) {
  console.error('Error:', error);
}
```

### Creating Messages

To use the Anthropic-compatible Messages API (not every provider implements
it; unsupported providers return an error suggesting `/chat/completions`
instead):

```typescript
import {
  InferenceGatewayClient,
  MessagesMessageRole,
  Provider,
} from '@inference-gateway/sdk';

const client = new InferenceGatewayClient({
  baseURL: 'http://localhost:8080/v1',
});

try {
  const response = await client.createMessage(
    {
      model: 'claude-sonnet-5',
      max_tokens: 150,
      system: 'You are a helpful assistant',
      messages: [
        {
          role: MessagesMessageRole.MessagesMessageRoleUser,
          content: 'Tell me a joke',
        },
      ],
    },
    Provider.anthropic // Provider is optional
  );

  console.log('Response:', response.content);
  console.log('Usage:', response.usage);
} catch (error) {
  console.error('Error:', error);
}
```

### Streaming Messages

To stream a message from the Messages API:

```typescript
import {
  InferenceGatewayClient,
  MessagesMessageRole,
  Provider,
} from '@inference-gateway/sdk';

const client = new InferenceGatewayClient({
  baseURL: 'http://localhost:8080/v1',
});

try {
  await client.streamMessage(
    {
      model: 'claude-sonnet-5',
      max_tokens: 200,
      messages: [
        {
          role: MessagesMessageRole.MessagesMessageRoleUser,
          content: 'Tell me a story',
        },
      ],
    },
    {
      onOpen: () => console.log('Stream opened'),
      onContent: (text) => process.stdout.write(text),
      onThinking: (thinking) => process.stdout.write(thinking),
      onTool: (toolUse) => {
        console.log('Tool use:', toolUse.name, toolUse.input);
      },
      onUsageMetrics: (usage) => console.log('Usage:', usage),
      onFinish: () => console.log('\nStream completed'),
      onError: (error) => console.error('Stream error:', error),
    },
    Provider.anthropic // Provider is optional
  );
} catch (error) {
  console.error('Error:', error);
}
```

### Proxying Requests

To proxy requests directly to a provider:

```typescript
import { InferenceGatewayClient, Provider } from '@inference-gateway/sdk';

const client = new InferenceGatewayClient({
  baseURL: 'http://localhost:8080',
});

try {
  const response = await client.proxy(Provider.openai, 'embeddings', {
    method: 'POST',
    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input: 'Hello world',
    }),
  });

  console.log('Embeddings:', response);
} catch (error) {
  console.error('Error:', error);
}
```

### Health Check

To check if the Inference Gateway is running:

```typescript
import { InferenceGatewayClient } from '@inference-gateway/sdk';

const client = new InferenceGatewayClient({
  baseURL: 'http://localhost:8080',
});

const isHealthy = await client.healthCheck();
console.log('API is healthy:', isHealthy);
```

`healthCheck()` never throws. It resolves to `true` on a 2xx response - the gateway returns 200 when
healthy - and to `false` for any non-2xx status (for example a 502 or 503 from an ingress or load
balancer in front of a stopped gateway, or a 404 from a misconfigured baseURL) or when the request
fails at the network level.

### Creating a Client with Custom Options

You can create a new client with custom options using the `withOptions` method:

```typescript
import { InferenceGatewayClient } from '@inference-gateway/sdk';

const client = new InferenceGatewayClient({
  baseURL: 'http://localhost:8080/v1',
});

// Create a new client with custom headers
const clientWithHeaders = client.withOptions({
  defaultHeaders: {
    'X-Custom-Header': 'value',
  },
  timeout: 60000, // 60 seconds
});
```

### Examples

For more examples, check the [examples directory](./examples).

## Contributing

Please refer to the [CONTRIBUTING.md](CONTRIBUTING.md) file for information
about how to get involved. We welcome issues, questions, and pull requests.

## License

This SDK is distributed under the Apache 2.0 License, see [LICENSE](LICENSE) for more information.
