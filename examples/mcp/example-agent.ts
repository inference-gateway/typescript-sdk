/**
 * Interactive Context7 Agent
 *
 * This agent allows users to interactively request app development assistance
 * using Context7 MCP tools for up-to-date documentation and library information.
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as readline from 'readline';
import {
  InferenceGatewayClient,
  MessageRole,
  Provider,
} from '../../src/index.js';

// Load environment variables from the mcp directory
dotenv.config({ path: path.join(__dirname, '.env') });

// For ES modules compatibility
declare const require: any;
declare const module: any;

interface AgentConfig {
  client: InferenceGatewayClient;
  provider: Provider;
  model: string;
  conversationHistory: Array<{ role: MessageRole; content: string }>;
}

class Context7Agent {
  private config: AgentConfig;
  private rl: readline.Interface;

  constructor() {
    this.config = {
      client: new InferenceGatewayClient({
        baseURL: 'http://localhost:8080/v1',
      }),
      provider: (process.env.PROVIDER as Provider) || Provider.groq,
      model: process.env.LLM || 'llama-3.3-70b-versatile',
      conversationHistory: [],
    };

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // Initialize system prompt with comprehensive development instructions
    this.config.conversationHistory.push({
      role: MessageRole.system,
      content: this.getSystemPrompt(),
    });
  }

  private getSystemPrompt(): string {
    return `You are an expert software development assistant with access to Context7 MCP tools for library documentation and research. Today is June 1, 2025.

CORE RESPONSIBILITIES:
You help users create modern, well-structured applications by:
1. Understanding their requirements and suggesting appropriate technologies
2. Using Context7 tools to get the latest documentation and best practices
3. Creating complete, production-ready applications with proper project structure
4. Following modern development patterns and conventions
5. Providing beautiful, responsive UI/UX when building web applications

CONTEXT7 TOOLS AVAILABLE:
You have access to Context7 tools for documentation and library research. The tools available depend on your setup:

REAL CONTEXT7 TOOLS (when using @upstash/context7-mcp):
1. c41_resolve-library-id - Resolve library names to Context7-compatible library IDs
2. c41_get-library-docs - Fetch detailed, up-to-date documentation and code examples

MOCK CONTEXT7 TOOLS (for local development/demo):
1. search_libraries - Search for libraries and frameworks by name or description
2. get_library_details - Get detailed information about a specific library
3. get_documentation - Fetch documentation and examples for a library

CONTEXT7 WORKFLOW:
For Real Context7 Tools:
1. Use c41_resolve-library-id to get the correct library ID for any technology
2. Use c41_get-library-docs with the library ID to fetch comprehensive documentation

For Mock Context7 Tools:
1. Use search_libraries to find relevant technologies and alternatives
2. Use get_library_details to get information about chosen libraries
3. Use get_documentation to fetch examples and best practices

DEVELOPMENT GUIDELINES:
- Always use Context7 tools before implementing any technology
- Fetch comprehensive documentation before writing code
- Use the latest stable versions and best practices from retrieved documentation
- Create complete project structures with proper configuration
- Include proper error handling, validation, and testing setup
- For web apps, prioritize modern, responsive design with current UI patterns
- Use TypeScript for type safety when applicable
- Follow framework conventions (Next.js App Router, React best practices, etc.)
- Include proper dependency management and build scripts
- Reference actual code examples from the retrieved documentation

CRITICAL NEXT.JS ROUTING RULES:
**NEVER create both app/ and pages/ directories in the same project**
- Use ONLY the App Router (app/ directory) for Next.js 13+ applications
- The App Router is the modern, recommended approach
- Creating both app/ and pages/ directories causes routing conflicts
- App Router structure: app/layout.tsx, app/page.tsx, app/about/page.tsx
- Pages Router is legacy and should not be used in new projects

NEXT.JS APP ROUTER STRUCTURE (CORRECT):
Project should have app/ directory with layout.tsx and page.tsx files
- app/layout.tsx is the root layout (required)
- app/page.tsx is the homepage
- app/about/page.tsx would be the about page
- components/ directory for reusable components
- public/ directory for static assets

NEVER CREATE CONFLICTING STRUCTURE:
Do not create both app/ and pages/ directories as this causes routing conflicts

APP CREATION WORKFLOW:
When a user requests an application:
1. Clarify requirements and suggest appropriate technology stack
2. Use Context7 tools to research each major technology/library needed
3. Fetch comprehensive, current documentation for chosen technologies
4. Create complete project structure with proper configuration files
5. **For Next.js: Use ONLY App Router (app/ directory), never pages/ directory**
6. Implement core functionality using patterns from Context7 documentation
7. Add modern styling and responsive design
8. Include development scripts and build configuration
9. Provide setup, development, and deployment instructions
10. Include testing setup when appropriate

SUPPORTED TECHNOLOGIES (always verify latest versions via Context7):
- Frontend: React, Next.js, Vue, Angular, Svelte, Vite
- Backend: Node.js, Express, Fastify, NestJS, Koa
- Databases: MongoDB, PostgreSQL, MySQL, SQLite, Redis
- Styling: Tailwind CSS, CSS Modules, Styled Components, Emotion
- Testing: Jest, Vitest, Playwright, Cypress, Testing Library
- Build Tools: Vite, Webpack, Rollup, Turbo
- Package Managers: npm, yarn, pnpm

Always be thorough, use Context7 tools extensively for every technology involved, and create production-quality applications with current best practices.`;
  }

  async initialize(): Promise<void> {
    console.log(
      `🚀 Context7 Interactive Agent initialized using ${this.config.model} on ${this.config.provider}\n`
    );

    try {
      // Health check
      const isHealthy = await this.config.client.healthCheck();
      if (!isHealthy) {
        console.error('❌ Gateway unhealthy. Run: docker-compose up --build');
        process.exit(1);
      }

      // Check if Context7 tools are available (real or mock)
      const tools = await this.config.client.listTools();
      const realContext7Tools = tools.data.filter((tool) =>
        ['c41_resolve-library-id', 'c41_get-library-docs'].includes(tool.name)
      );
      const mockContext7Tools = tools.data.filter((tool) =>
        [
          'search_libraries',
          'get_library_details',
          'get_documentation',
        ].includes(tool.name)
      );

      const context7Tools = [...realContext7Tools, ...mockContext7Tools];

      if (context7Tools.length === 0) {
        console.error(
          '⚠️  No Context7 MCP tools available. Make sure a Context7 MCP server is running.'
        );
        console.error(
          '   For real Context7: npx -y @upstash/context7-mcp@latest'
        );
        console.error(
          '   For local mock: docker-compose up --build (already included in this project)'
        );
        process.exit(1);
      }

      const usingRealContext7 = realContext7Tools.length > 0;
      const toolType = usingRealContext7 ? 'real Context7' : 'mock Context7';

      console.info(
        `📋 Found ${context7Tools.length} ${toolType} tools available:`
      );
      context7Tools.forEach((tool, index) => {
        console.info(`  ${index + 1}. ${tool.name} - ${tool.description}`);
      });

      if (!usingRealContext7) {
        console.info('💡 Using local mock Context7 server for demonstration');
        console.info(
          '   To use real Context7 with latest docs, install: npx -y @upstash/context7-mcp@latest'
        );
      }
      console.info('');

      this.showWelcomeMessage();
      await this.startInteractiveSession();
    } catch (error) {
      console.error('❌ Initialization Error:', (error as Error).message);
      console.log(
        '\n💡 Make sure the Context7 MCP server is running on port 3002'
      );
      console.log('   and the Inference Gateway is running on port 8080');
      process.exit(1);
    }
  }

  private showWelcomeMessage(): void {
    console.log('🤖 Welcome to Context7 Interactive Development Agent!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(
      '\n💡 I can help you create modern applications using the latest technologies.'
    );
    console.log(
      "   Just describe what you want to build, and I'll use Context7 to get"
    );
    console.log(
      '   up-to-date documentation and create a complete solution for you.'
    );
    console.log('\n📝 Example requests:');
    console.log(
      '   • "Create a Next.js blog with TypeScript and Tailwind CSS"'
    );
    console.log(
      '   • "Build a React dashboard with charts and data visualization"'
    );
    console.log(
      '   • "Make a Node.js API with Express and MongoDB integration"'
    );
    console.log(
      '   • "Create a Vue.js e-commerce frontend with cart functionality"'
    );
    console.log('\n⚡ Commands:');
    console.log('   • Type your request to start building');
    console.log('   • Use "clear" to reset conversation history');
    console.log('   • Use "exit" or "quit" to end the session');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  private async startInteractiveSession(): Promise<void> {
    while (true) {
      const userInput = await this.getUserInput(
        '🔨 What would you like to build? '
      );

      if (this.handleSpecialCommands(userInput)) {
        continue;
      }

      if (userInput.trim()) {
        await this.processUserRequest(userInput);
      }
    }
  }

  private async getUserInput(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(prompt, (answer) => {
        resolve(answer);
      });
    });
  }

  private handleSpecialCommands(input: string): boolean {
    const command = input.trim().toLowerCase();

    switch (command) {
      case 'exit':
      case 'quit':
        console.log('\n👋 Thank you for using Context7 Agent! Goodbye!');
        this.rl.close();
        process.exit(0);
        return true;

      case 'clear':
        this.config.conversationHistory = [
          {
            role: MessageRole.system,
            content: this.getSystemPrompt(),
          },
        ];
        console.log('\n🧹 Conversation history cleared. Starting fresh!\n');
        return true;

      case 'help':
        this.showWelcomeMessage();
        return true;

      default:
        return false;
    }
  }

  private async processUserRequest(userInput: string): Promise<void> {
    console.log(`\n🔍 Processing request: "${userInput}"`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Add user message to conversation history
    this.config.conversationHistory.push({
      role: MessageRole.user,
      content: userInput,
    });

    try {
      let assistantResponse = '';

      await this.config.client.streamChatCompletion(
        {
          model: `${this.config.provider}/${this.config.model}`,
          messages: this.config.conversationHistory,
          max_tokens: 2000,
        },
        {
          onOpen: () => {
            console.log('🔗 Starting development session with Context7...\n');
          },
          onReasoning: (reasoning) => {
            console.log(`\n🤔 Agent Reasoning: ${reasoning}`);
          },
          onContent: (content) => {
            process.stdout.write(content);
            assistantResponse += content;
          },
          onMCPTool: (toolCall) => {
            console.log(`\n🛠️  Context7 Tool: ${toolCall.function.name}`);
            try {
              const args = JSON.parse(toolCall.function.arguments);
              console.log(`📝 Arguments:`, JSON.stringify(args, null, 2));
            } catch {
              console.log(`📝 Raw Arguments: ${toolCall.function.arguments}`);
            }
            console.log(`🔍 Tool ID: ${toolCall.id}\n`);
          },
          onError: (error) => {
            console.error(`\n❌ Stream Error: ${error.error}`);
          },
          onFinish: () => {
            console.log('\n\n✅ Development session completed!\n');
            console.log(
              '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
            );

            // Add assistant response to conversation history
            if (assistantResponse.trim()) {
              this.config.conversationHistory.push({
                role: MessageRole.assistant,
                content: assistantResponse,
              });
            }
          },
        }
      );
    } catch (error) {
      console.error('\n❌ Error processing request:', (error as Error).message);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
  }

  async shutdown(): Promise<void> {
    this.rl.close();
  }
}

async function runContext7Agent(): Promise<void> {
  const agent = new Context7Agent();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\n👋 Shutting down Context7 Agent...');
    await agent.shutdown();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n\n👋 Shutting down Context7 Agent...');
    await agent.shutdown();
    process.exit(0);
  });

  await agent.initialize();
}

// Run the agent
if (require.main === module || process.argv[1].endsWith('context7-agent.ts')) {
  runContext7Agent().catch(console.error);
}

export { Context7Agent, runContext7Agent };
