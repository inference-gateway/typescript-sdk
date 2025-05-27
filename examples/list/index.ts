import { InferenceGatewayClient, Provider } from '@inference-gateway/sdk';

(async () => {
  const client = new InferenceGatewayClient({
    baseURL: 'http://localhost:8080/v1',
  });

  const provider = process.env.PROVIDER as Provider;

  try {
    // List all models
    const models = await client.listModels();
    console.log('All models:', models);

    // List models from a specific provider
    const llms = await client.listModels(provider);
    console.log(`Specific ${provider} models:`, llms);
  } catch (error) {
    console.error('Error:', error);
  }
})();
