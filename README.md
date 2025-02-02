# Inference Gateway Typescript SDK

An SDK written in Typescript for the [Inference Gateway](https://github.com/edenreich/inference-gateway).

- [Inference Gateway Typescript SDK](#inference-gateway-typescript-sdk)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Creating a Client](#creating-a-client)
    - [Listing All Models](#listing-all-models)
    - [List Models by Provider](#list-models-by-provider)
    - [Generating Content](#generating-content)
    - [Streaming Content](#streaming-content)
    - [Health Check](#health-check)
  - [Contributing](#contributing)
  - [License](#license)

## Installation

Run `npm i @inference-gateway/sdk`.

## Usage

### Creating a Client

```typescript
import {
  InferenceGatewayClient,
  Message,
  Provider,
} from '@inference-gateway/sdk';

async function main() {
  const client = new InferenceGatewayClient('http://localhost:8080');

  try {
    // List available models
    const models = await client.listModels();
    models.forEach((providerModels) => {
      console.log(`Provider: ${providerModels.provider}`);
      providerModels.models.forEach((model) => {
        console.log(`Model: ${model.name}`);
      });
    });

    // Generate content
    const response = await client.generateContent({
      provider: Provider.Ollama,
      model: 'llama2',
      messages: [
        {
          role: MessageRole.System,
          content: 'You are a helpful llama',
        },
        {
          role: MessageRole.User,
          content: 'Tell me a joke',
        },
      ],
    });

    console.log('Response:', response);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
```

### Listing All Models

To list all available models from all providers, use the `listModels` method:

```typescript
try {
  const models = await client.listModels();
  models.forEach((providerModels) => {
    console.log(`Provider: ${providerModels.provider}`);
    providerModels.models.forEach((model) => {
      console.log(`Model: ${model.name}`);
    });
  });
} catch (error) {
  console.error('Error:', error);
}
```

### List Models by Provider

To list all available models from a specific provider, use the `listModelsByProvider` method:

```typescript
try {
  const providerModels = await client.listModelsByProvider(Provider.OpenAI);
  console.log(`Provider: ${providerModels.provider}`);
  providerModels.models.forEach((model) => {
    console.log(`Model: ${model.name}`);
  });
} catch (error) {
  console.error('Error:', error);
}
```

### Generating Content

To generate content using a model, use the `generateContent` method:

```typescript
import {
  InferenceGatewayClient,
  Message,
  MessageRole,
  Provider,
} from '@inference-gateway/sdk';

const client = new InferenceGatewayClient('http://localhost:8080');

  const response = await client.generateContent({
    provider: Provider.Ollama,
    model: 'llama2',
    messages: [
      {
        role: MessageRole.System,
        content: 'You are a helpful llama',
      },
      {
        role: MessageRole.User,
        content: 'Tell me a joke',
      },
    ],
  });

  console.log('Provider:', response.provider);
  console.log('Response:', response.response);
} catch (error) {
  console.error('Error:', error);
}
```

### Streaming Content

To stream content using a model, use the `streamContent` method:

```typescript
const client = new InferenceGatewayClient('http://localhost:8080');

await client.generateContentStream(
  {
    provider: Provider.Groq,
    model: 'deepseek-r1-distill-llama-70b',
    messages: [
      {
        role: MessageRole.User,
        content: 'Tell me a story',
      },
    ],
  },
  {
    onMessageStart: (role) => console.log('Message started:', role),
    onContentDelta: (content) => process.stdout.write(content),
    onStreamEnd: () => console.log('\nStream completed'),
  }
);
```

### Health Check

To check if the Inference Gateway is running, use the `healthCheck` method:

```typescript
try {
  const isHealthy = await client.healthCheck();
  console.log('API is healthy:', isHealthy);
} catch (error) {
  console.error('Error:', error);
}
```

## Contributing

Please refer to the [CONTRIBUTING.md](CONTRIBUTING.md) file for information about how to get involved. We welcome issues, questions, and pull requests.

## License

This SDK is distributed under the MIT License, see [LICENSE](LICENSE) for more information.
