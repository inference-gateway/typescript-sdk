# Quick Start Guide

This guide will help you run all TypeScript SDK examples quickly.

## Prerequisites

1. **Docker** - For running the Inference Gateway
2. **Node.js** - For running the examples
3. **API Key** - For at least one AI provider

## 1. Setup Environment

1. Copy the environment template:

   ```bash
   cp .env.example .env
   ```

2. Add your API keys to `.env`:
   ```bash
   # Choose one or more providers
   GROQ_API_KEY=your_groq_key_here
   OPENAI_API_KEY=your_openai_key_here
   ANTHROPIC_API_KEY=your_anthropic_key_here
   ```

## 2. Start Inference Gateway

Choose one of these options:

### Option A: Basic Gateway (for List and Chat examples)

```bash
docker run --rm -p 8080:8080 --env-file .env ghcr.io/inference-gateway/inference-gateway:latest
```

### Option B: Gateway with MCP (for all examples)

```bash
cd mcp
npm run compose:up
```

## 3. Test the Examples

### Quick Test - List Models

```bash
cd list
npm install
npm start
```

### Chat Example

```bash
cd chat
export PROVIDER=groq
export LLM=meta-llama/llama-3.3-70b-versatile
npm install
npm start
```

### MCP Example (requires Docker Compose setup)

```bash
cd mcp
export PROVIDER=groq
export LLM=meta-llama/llama-3.3-70b-versatile
npm install
npm start
```

## 4. Popular Provider/Model Combinations

### Groq (Fast inference)

```bash
export PROVIDER=groq
export LLM=meta-llama/llama-3.3-70b-versatile
```

### OpenAI (High quality)

```bash
export PROVIDER=openai
export LLM=gpt-4o
```

### Anthropic (Strong reasoning)

```bash
export PROVIDER=anthropic
export LLM=claude-3-5-sonnet-20241022
```

## Troubleshooting

### Gateway not responding

- Check if Docker container is running: `docker ps`
- Test health: `curl http://localhost:8080/health`
- Check logs: `docker logs <container_id>`

### Authentication errors

- Verify API key is correct in `.env`
- Ensure the key has sufficient permissions
- Try a different provider

### Model not found

- Use the list example to see available models
- Check if the model name is correct
- Try a different model from the same provider

## Next Steps

1. Explore each example in detail
2. Modify the examples for your use case
3. Build your own applications using the patterns shown
4. Check the main [README](../README.md) for more advanced usage
