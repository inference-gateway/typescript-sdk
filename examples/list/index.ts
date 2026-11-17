import {
  InferenceGatewayClient,
  MCPJSONRPCRequestMethod,
  PathsModelsGetParametersQueryInclude,
  Provider,
} from '@inference-gateway/sdk';

const main = async () => {
  const client = new InferenceGatewayClient({
    baseURL: 'http://localhost:8080/v1',
  });

  const provider = process.env.PROVIDER as Provider;

  console.log('🔍 Inference Gateway SDK - List Examples');
  console.log('=========================================\n');

  try {
    // Example 1: List all models
    console.log('📋 Example 1: List All Models');
    const allModels = await client.listModels();
    console.log(
      `Found ${allModels.data.length} total models across all providers:`
    );

    // Group models by provider for better display
    const modelsByProvider = allModels.data.reduce(
      (acc, model) => {
        const providerName = model.served_by;
        if (!acc[providerName]) {
          acc[providerName] = [];
        }
        acc[providerName].push(model);
        return acc;
      },
      {} as Record<string, typeof allModels.data>
    );

    Object.entries(modelsByProvider).forEach(([providerName, models]) => {
      console.log(`\n  ${providerName.toUpperCase()}: ${models.length} models`);
      models.slice(0, 3).forEach((model) => {
        console.log(
          `    \u2022 ${model.id} (created: ${new Date(model.created * 1000).toLocaleDateString()})`
        );
      });
      if (models.length > 3) {
        console.log(`    ... and ${models.length - 3} more`);
      }
    });

    console.log('\n---\n');

    // Example 2: List models from a specific provider (if provided)
    if (provider) {
      console.log(`📋 Example 2: List Models from ${provider.toUpperCase()}`);
      const providerModels = await client.listModels(provider);
      console.log(
        `Found ${providerModels.data.length} models from ${provider}:`
      );

      providerModels.data.forEach((model) => {
        console.log(`  \u2022 ${model.id}`);
        console.log(`    Owner: ${model.owned_by}`);
        console.log(
          `    Created: ${new Date(model.created * 1000).toLocaleDateString()}`
        );
        console.log(`    Served by: ${model.served_by}`);
        console.log('');
      });
    } else {
      console.log('📋 Example 2: Skipped (no PROVIDER specified)');
      console.log(
        'Set PROVIDER environment variable to see provider-specific models'
      );
    }

    console.log('---\n');

    // Example 3: List MCP tools (if available)
    console.log('🛠️  Example 3: List MCP Tools');
    try {
      const response = await client.mcpJsonRpc({
        jsonrpc: '2.0',
        id: 1,
        method: MCPJSONRPCRequestMethod.tools_list,
      });
      const tools = (response.result?.tools ?? []) as Array<{
        name: string;
        description?: string;
        inputSchema?: unknown;
      }>;
      console.log(`Found ${tools.length} MCP tools:`);

      if (tools.length === 0) {
        if (response.error) {
          console.log(
              `  ❌ MCP JSON-RPC error ${response.error.code}: ${response.error.message}`
          );
        }
        console.log(
          '  No MCP tools available. Make sure MCP_ENABLED=true and MCP_EXPOSE=true on the gateway.'
        );
      } else {
        tools.forEach((tool) => {
          console.log(`\n  🔧 ${tool.name}`);
          console.log(`     Description: ${tool.description}`);

          if (tool.inputSchema) {
            console.log(
              `     Input schema: ${JSON.stringify(tool.inputSchema, null, 2).substring(0, 100)}...`
            );
          }
        });
      }
    } catch (error) {
      console.log(
        '  ❌ MCP tools not available (MCP_ENABLED or MCP_EXPOSE might be disabled)'
      );
      console.log(
        `     Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    console.log('\n---\n');

    // Example 4: Health check
    console.log('❤️  Example 4: Health Check');
    const isHealthy = await client.healthCheck();
    console.log(
      `Gateway health status: ${isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`
    );

    console.log('\n---\n');

    // Example 5: List models with modalities metadata
    console.log('🎯 Example 5: List Models with Modalities');
    const modelsWithModalities = await client.listModels(undefined, [
      PathsModelsGetParametersQueryInclude.modalities,
    ]);
    console.log(
      `Found ${modelsWithModalities.data.length} models with modalities info:`
    );
    modelsWithModalities.data
      .filter((m) => m.modalities)
      .slice(0, 5)
      .forEach((model) => {
        console.log(
          `  \u2022 ${model.id} - modalities: ${model.modalities ? `in: ${model.modalities.input.join()} out: ${model.modalities.output.join()}` : 'none'}`
        );
      });
    const totalWithModalities = modelsWithModalities.data.filter(
      (m) => m.modalities
    ).length;
    console.log(
      `\n  ${totalWithModalities} of ${modelsWithModalities.data.length} models report modalities`
    );

    console.log('\n---\n');
  } catch (error) {
    console.error('❌ Error in list examples:', error);
    process.exit(1);
  }

  console.log('\n✅ All examples completed successfully!');
};

// Run the main function
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
