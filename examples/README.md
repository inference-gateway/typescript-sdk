# Examples

This directory contains examples that demonstrate how to use the Typescript SDK.

## Pre-requisites

You should have docker installed or use the dev container in VS Code which has all the tools you might need.

## Quick Start

1. Copy the `.env.example` file to `.env` and fill in your API key.

2. Start the Inference Gateway locally:

   ```bash
   docker run -p 8080:8080 --env-file .env ghcr.io/inference-gateway/inference-gateway:latest
   ```

3. Review the different examples in the specific directories:

   - [Basic](./basic): A basic example of how to use the SDK.
   - [Chat](./chat): An example of how to use the SDK for chat applications.
   - [MCP](./mcp): An example of how to use the SDK with the MCP in a Multi Provider architecture.
