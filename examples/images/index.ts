import {
  CreateImageRequestQuality,
  ImageSize,
  InferenceGatewayClient,
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
    console.log('🎨 Generating an image');

    const response = await client.createImage(
      {
        model,
        prompt: 'A watercolor painting of a robot learning to paint',
        n: 1,
        size: ImageSize.ImageSize1024x1024,
        quality: CreateImageRequestQuality.high,
      },
      provider
    );

    console.log(`Created at: ${new Date(response.created * 1000).toISOString()}`);
    response.data.forEach((image, i) => {
      console.log(`Image ${i + 1}: ${image.url ?? '[base64 b64_json omitted]'}`);
    });
    if (response.usage) {
      console.log('Usage:', response.usage);
    }
  } catch (error) {
    console.error('Error generating image:', error);
    process.exit(1);
  }
};

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
