import { writeFile } from 'node:fs/promises';
import {
  CreateSFXRequestOutput,
  CreateSpeechRequestResponse_format,
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
    console.log('🗣️ Generating speech');
    const speech = await client.createSpeech(
      {
        model,
        input: 'Hello from the Inference Gateway!',
        voice: 'alloy',
        response_format: CreateSpeechRequestResponse_format.mp3,
      },
      provider
    );
    await writeFile('speech.mp3', Buffer.from(await speech.arrayBuffer()));
    console.log('Wrote speech.mp3');
  } catch (error) {
    console.error('Error generating speech:', error);
  }

  try {
    console.log('🚗 Generating a sound effect');
    const sfx = await client.createSFX(
      {
        model,
        prompt: 'A car engine revving, tires screeching on asphalt',
        duration_seconds: 5,
      },
      provider
    );
    await writeFile('sfx.mp3', Buffer.from(await sfx.arrayBuffer()));
    console.log('Wrote sfx.mp3');
  } catch (error) {
    console.error('Error generating sound effect:', error);
  }

  try {
    console.log('🎬 Scoring a video');
    const score = await client.createSFX(
      {
        model,
        video:
          'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        output: CreateSFXRequestOutput.CreateSFXRequestOutputSFX,
      },
      provider
    );
    await writeFile('video-score.mp3', Buffer.from(await score.arrayBuffer()));
    console.log('Wrote video-score.mp3');
  } catch (error) {
    console.error('Error scoring video:', error);
  }

  try {
    console.log('🎵 Composing music');
    const music = await client.createMusic(
      {
        model,
        prompt: 'Lo-fi hip hop with a warm upright bass and vinyl crackle',
        duration_seconds: 15,
        instrumental: true,
      },
      provider
    );
    await writeFile('music.mp3', Buffer.from(await music.arrayBuffer()));
    console.log('Wrote music.mp3');
  } catch (error) {
    console.error('Error composing music:', error);
  }
};

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
