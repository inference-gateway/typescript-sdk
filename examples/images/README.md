# Images Example

This example demonstrates how to generate images with the Inference Gateway
SDK using the `createImage` method (the OpenAI-compatible Images API).

## Getting Started

1. Ensure you have the Inference Gateway running locally or have access to an
   instance. If not, please read the [Quick Start](../README.md#quick-start)
   section in the main README.

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Set the required environment variables:

   ```bash
   export PROVIDER=openai
   export LLM=dall-e-3
   ```

4. Run the example:

   ```bash
   npm start
   ```

## Notes

- Not every provider supports image generation; unsupported providers return
  an error.
- `response_format` defaults to `url`. Pass `b64_json` to receive the image
  content inline via `image.b64_json` instead of `image.url`.
