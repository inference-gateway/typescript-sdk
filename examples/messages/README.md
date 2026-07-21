# Messages Example

This example demonstrates how to use the Anthropic-compatible Messages API
(`/v1/messages`) of the Inference Gateway SDK. It includes creating messages,
streaming responses, and tool use using the TypeScript SDK.

## Features Demonstrated

1. **Simple Message** - Basic request/response with a system prompt
2. **Streaming Message** - Real-time streaming with typed stream events
3. **Tool Use** - Defining tools and handling `tool_use` content blocks

## Getting Started

1. Ensure you have the Inference Gateway running locally or have access to an
   instance. If not, please read the [Quick Start](../README.md#quick-start)
   section in the main README.

2. Install the SDK if you haven't already:

   ```bash
   npm install
   ```

3. Set the required environment variables:

   ```bash
   export PROVIDER=anthropic
   export LLM=claude-sonnet-5
   ```

4. Run the example:

   ```bash
   npm start
   ```

## Notes

- Not every provider implements the Messages API. Unsupported providers return
  an error suggesting `/chat/completions` instead - use the
  [Chat example](../chat) for those.
- The tool use example simulates tool execution - in a real application, you
  would run the tool and send the result back as a `tool_result` content block
  in a follow-up message.
- Requires `@inference-gateway/sdk` >= 0.15.0 (the first release with
  `createMessage` / `streamMessage`).
