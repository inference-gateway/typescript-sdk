import { InferenceGatewayClient, Provider } from '@inference-gateway/sdk';

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
          `    • ${model.id} (created: ${new Date(model.created * 1000).toLocaleDateString()})`
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
        console.log(`  • ${model.id}`);
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
      const tools = await client.listTools();
      console.log(`Found ${tools.data.length} MCP tools:`);

      if (tools.data.length === 0) {
        console.log(
          '  No MCP tools available. Make sure EXPOSE_MCP=true on the gateway.'
        );
      } else {
        tools.data.forEach((tool) => {
          console.log(`\n  🔧 ${tool.name}`);
          console.log(`     Description: ${tool.description}`);
          console.log(`     Server: ${tool.server}`);

          if (tool.input_schema) {
            console.log(
              `     Input schema: ${JSON.stringify(tool.input_schema, null, 2).substring(0, 100)}...`
            );
          }
        });
      }
    } catch (error) {
      console.log(
        '  ❌ MCP tools not available (EXPOSE_MCP might be disabled)'
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
