# Chat Example

This example demonstrates how to use the Inference Gateway SDK for chat applications. It includes creating chat completions, streaming responses, multi-turn conversations, and function calling using the TypeScript SDK.

## Features Demonstrated

1. **Simple Chat Completion** - Basic request/response chat
2. **Streaming Chat Completion** - Real-time streaming responses
3. **Multi-turn Conversation** - Maintaining conversation context
4. **Function Calling** - Using tools/functions with models

## Getting Started

1. Ensure you have the Inference Gateway running locally or have access to an instance. If not, please read the [Quick Start](../README.md#quick-start) section in the main README.

2. Install the SDK if you haven't already:

   ```bash
   npm install
   ```

3. Set the required environment variables:

   ```bash
   export PROVIDER=groq
   export LLM=groq/meta-llama/llama-3.3-70b-versatile
   ```

   Or for OpenAI:

   ```bash
   export PROVIDER=openai
   export LLM=gpt-4o
   ```

4. Run the example:

   ```bash
   npm start
   ```

## Example Output

The example will demonstrate:

- A simple chat completion about TypeScript
- A streaming story about a robot learning to paint
- A multi-turn conversation about JavaScript programming
- Function calling for weather information (simulated)

## Supported Providers

This example works with any provider supported by the Inference Gateway:

- `openai` - OpenAI models (GPT-4, GPT-3.5, etc.)
- `groq` - Groq's fast inference models
- `anthropic` - Claude models
- `ollama` - Local models via Ollama
- `cohere` - Cohere models
- `deepseek` - DeepSeek models
- `cloudflare` - Cloudflare Workers AI

## Notes

- The function calling example simulates weather API calls - in a real application, you would implement actual function execution
- Streaming responses provide real-time output, perfect for interactive applications
- Multi-turn conversations maintain context across multiple exchanges
- Temperature and max_tokens parameters can be adjusted for different use cases
