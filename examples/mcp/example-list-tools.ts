import * as dotenv from 'dotenv';
import { InferenceGatewayClient } from '../../src/index.js';

dotenv.config();

(async () => {
  const client = new InferenceGatewayClient({
    baseURL: 'http://localhost:8080/v1',
  });

  try {
    const tools = await client.listTools();
    console.info(`📋 Found ${tools.data.length} MCP tools:\n`);

    tools.data.forEach((tool, index) => {
      console.info(`${index + 1}. ${tool.name}`);
      console.info(`   Description: ${tool.description}`);
      if (tool.input_schema) {
        console.info(
          `   Input Schema:`,
          JSON.stringify(tool.input_schema, null, 2)
        );
      }
      console.info('');
    });
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
