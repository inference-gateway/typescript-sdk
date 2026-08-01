# Images Example

This example demonstrates the OpenAI-compatible Images API with the Inference
Gateway SDK: it generates an image with `createImage`, then edits it with
`createImageEdit` and creates a variation with `createImageVariation`.

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

- Not every provider or model supports image generation, edits, or
  variations; unsupported combinations return an error.
- `response_format` defaults to `url`. The example requests `b64_json` so it
  can feed the generated image bytes into the edit and variation calls as a
  `Blob`.
- `createImageEdit` accepts an optional `mask` Blob whose transparent areas
  indicate where the image should be edited.
