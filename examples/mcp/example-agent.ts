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

declare const require: any;
declare const module: any;

interface AgentConfig {
  client: InferenceGatewayClient;
  provider: Provider;
  model: string;
  conversationHistory: Array<{ role: MessageRole; content: string }>;
  maxRetries: number;
  retryDelayMs: number;
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
      maxRetries: 3,
      retryDelayMs: 60000, // 1 minute
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

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      global.setTimeout(() => resolve(), ms);
    });
  }

  private async waitForProjectCreation(): Promise<void> {
    console.log(
      '⏳ Waiting 30 seconds for Next.js project creation to complete...'
    );
    await this.delay(30000);
    console.log('✅ Project creation wait period completed.\n');
  }

  private getSystemPrompt(): string {
    return `
You are an expert software development assistant with access to Context7 MCP tools for library documentation and research. Today is **June 1, 2025**.

---

### 🔧 CORE RESPONSIBILITIES

You help users create **modern, production-grade applications** by:

1. Understanding user requirements and recommending the best-fit technologies
2. Using **Context7 tools** to retrieve up-to-date documentation and best practices
3. Building complete projects with proper structure and configuration
4. Following modern development conventions and patterns
5. Creating clean, responsive, and accessible UI/UX

---

### 🧰 CONTEXT7 TOOLS

You have access to either **Real** or **Mock** Context7 tools.

**Real Context7 Tools (@upstash/context7-mcp):**

* c41_resolve-library-id: Resolve technology names to Context7-compatible IDs
* c41_get-library-docs: Fetch full documentation, usage examples, and best practices

**Mock Tools (for local/demo use):**

* search_libraries: Search for libraries by name or functionality
* get_library_details: Fetch library metadata and features
* get_documentation: Fetch usage examples and implementation patterns

---

### 📂 FILE SYSTEM RULES

* All projects and generated files must **use the /tmp directory exclusively**.
* If a **Next.js project already exists in /tmp**, continue working within it instead of creating a new one.
* You must **never overwrite** an existing project unless explicitly asked.

---

### ⚙️ DEVELOPMENT WORKFLOW

**Always use Context7 tools before coding:**

**Always list the files in a directory before creating new files.**

**When creating a Next.js project, always wait 30 seconds after project creation.**

1. Clarify requirements and tech stack
2. Lookup technologies using Context7 tools
3. Retrieve current documentation and patterns
4. Scaffold or enhance projects under /tmp, maintaining clean structure
5. Follow framework and language conventions
6. Include error handling, testing, and CI/build scripts
7. Prioritize maintainability, readability, and DX (developer experience)

---

### ⚛️ NEXT.JS PROJECT RULES

* **Use ONLY the App Router (/app)**, not the legacy Pages Router
* **Never create both (/app and /pages directories**
* **IMPORTANT: Always wait 30 seconds after creating a Next.js project before proceeding**
* Structure should include:
  * app/layout.tsx – required root layout
  * app/page.tsx - homepage
  * app/about/page.tsx – nested routes
  * components/, public/, etc. as needed

If a Next.js project exists:

* Validate it uses the App Router
* Extend or modify as needed based on the request

---

### 🧪 TECH STACK (verify latest versions with Context7)

**Frontend:** React, Next.js, Vue, Angular, Svelte
**Backend:** Node.js, Express, Fastify, NestJS, Koa
**Databases:** MongoDB, PostgreSQL, MySQL, SQLite, Redis
**Styling:** Tailwind CSS, CSS Modules, Styled Components
**Testing:** Jest, Vitest, Playwright, Cypress
**Build Tools:** Vite, Webpack, Rollup, Turbo
**Package Managers:** npm, yarn, pnpm

---

### ✅ SUMMARY

* Always work in /tmp
* If a project exists, enhance it — don't recreate
* Use Context7 tools for everything: tech decisions, patterns, and examples
* Adhere to modern best practices in project setup, UI/UX, and code quality
`;
  }

  async initialize(): Promise<void> {
    console.log(
      `🚀 Context7 Interactive Agent initialized using ${this.config.model} on ${this.config.provider}\n`
    );

    let attempt = 0;
    while (attempt < this.config.maxRetries) {
      try {
        // Health check
        const isHealthy = await this.config.client.healthCheck();
        if (!isHealthy) {
          console.error('❌ Gateway unhealthy. Run: docker-compose up --build');
          process.exit(1);
        }

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
        break; // Success, exit retry loop
      } catch (error) {
        attempt++;
        console.error(
          `❌ Initialization Error (attempt ${attempt}/${this.config.maxRetries}):`,
          (error as Error).message
        );

        if (attempt < this.config.maxRetries) {
          console.log(
            `⏳ Retrying in ${this.config.retryDelayMs / 1000} seconds...`
          );
          await this.delay(this.config.retryDelayMs);
        } else {
          console.error(
            `❌ Failed to initialize after ${this.config.maxRetries} attempts`
          );
          console.log(
            '\n💡 Make sure the Context7 MCP server is running on port 3002'
          );
          console.log('   and the Inference Gateway is running on port 8080');
          process.exit(1);
        }
      }
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
        await this.processUserRequestWithRetry(userInput);
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

  private async processUserRequestWithRetry(userInput: string): Promise<void> {
    let attempt = 0;

    while (attempt < this.config.maxRetries) {
      try {
        await this.processUserRequest(userInput);
        break; // Success, exit retry loop
      } catch (error) {
        attempt++;
        console.error(
          `❌ Request failed (attempt ${attempt}/${this.config.maxRetries}):`,
          (error as Error).message
        );

        if (attempt < this.config.maxRetries) {
          console.log(
            `⏳ Retrying in ${this.config.retryDelayMs / 1000} seconds...`
          );
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
          await this.delay(this.config.retryDelayMs);
        } else {
          console.error(
            `❌ Failed to process request after ${this.config.maxRetries} attempts`
          );
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        }
      }
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

    let assistantResponse = '';
    let shouldWaitForProject = false;

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

          if (
            toolCall.function.name === 'create_next_project' ||
            toolCall.function.name === 'create_nextjs_project' ||
            toolCall.function.name === 'create_new_workspace' ||
            toolCall.function.name.toLowerCase().includes('next')
          ) {
            console.log(
              '🎯 Next.js project creation detected - will wait 30 seconds after completion'
            );
            shouldWaitForProject = true;
          }
        },
        onError: (error) => {
          console.error(`\n❌ Stream Error: ${error.error}`);
          throw new Error(`Stream error: ${error.error}`);
        },
        onFinish: async () => {
          console.log('\n\n✅ Development session completed!\n');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

          if (shouldWaitForProject) {
            await this.waitForProjectCreation();
          }

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
