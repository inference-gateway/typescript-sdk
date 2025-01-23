# Inference Gateway Typescript SDK

An SDK written in Typescript for the [Inference Gateway](https://github.com/edenreich/inference-gateway).

- [Inference Gateway Typescript SDK](#inference-gateway-typescript-sdk)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Creating a Client](#creating-a-client)
    - [Listing Models](#listing-models)
    - [Generating Content](#generating-content)
    - [Health Check](#health-check)
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
        console.log(`Model: ${model.id}`);
      });
    });

    const response = await client.generateContent({
      provider: Provider.Ollama,
      model: 'llama2',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful llama',
        },
        {
          role: 'user',
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

### Listing Models

To list available models, use the `listModels` method:

```typescript
try {
  const models = await client.listModels();
  models.forEach((providerModels) => {
    console.log(`Provider: ${providerModels.provider}`);
    providerModels.models.forEach((model) => {
      console.log(`Model: ${model.id}`);
    });
  });
} catch (error) {
  console.error('Error:', error);
}
```

### Generating Content

To generate content using a model, use the `generateContent` method:

```typescript
try {
  const response = await client.generateContent({
    provider: Provider.Ollama,
    model: 'llama2',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful llama',
      },
      {
        role: 'user',
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

## License

This SDK is distributed under the MIT License, see [LICENSE](LICENSE) for more information.
