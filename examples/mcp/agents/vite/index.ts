/**
 * Interactive Vite Development Agent
 *
 * This agent specializes in creating modern Vite-based applications with up-to-date
 * documentation and best practices using Context7 MCP tools.
 */

import {
  InferenceGatewayClient,
  MessageRole,
  Provider,
} from '@inference-gateway/sdk';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as readline from 'readline';

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
  iterationCount: number;
  totalTokensUsed: number;
}

class ViteAgent {
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
      retryDelayMs: 60000,
      iterationCount: 0,
      totalTokensUsed: 0,
    };

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

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

  private async waitForViteProjectCreation(): Promise<void> {
    console.log(
      '⏳ Waiting 15 seconds for Vite project creation to complete...'
    );
    await this.delay(15000);
    console.log('✅ Vite project creation wait period completed.\n');
  }

  private getSystemPrompt(): string {
    return `
You are an expert Vite development assistant with access to Context7 MCP tools for library documentation and research. Today is **June 1, 2025**.

---

### 🔧 CORE RESPONSIBILITIES

You help users create **modern, lightning-fast Vite applications** by:

1. Understanding user requirements and recommending the best Vite-based stack
2. Using **Context7 tools** to retrieve up-to-date Vite documentation and best practices
3. Building complete projects with proper Vite configuration and optimization
4. Following modern development conventions and Vite-specific patterns
5. Creating fast, responsive, and well-structured applications

---

### 🧰 AVAILABLE TOOLS

You have access to several MCP tool categories:

**Context7 Tools (@upstash/context7-mcp):**

* c41_resolve-library-id: Resolve technology names to Context7-compatible IDs
* c41_get-library-docs: Fetch full documentation, usage examples, and best practices

**Mock Tools (for local/demo use):**

* search_libraries: Search for libraries by name or functionality
* get_library_details: Fetch library metadata and features
* get_documentation: Fetch usage examples and implementation patterns

**Memory Tools (for error recovery):**

* save-state: Save current progress/state with a session ID
* save-error-state: Save state when HTTP errors occur for recovery
* restore-state: Restore previously saved state by session ID
* list-sessions: List all saved sessions
* clear-session: Remove a saved session

**File System Tools:**

* Available for file operations in /tmp directory

---

### 🛡️ ERROR RECOVERY STRATEGY

When encountering HTTP errors or failures:

1. Immediately save state using save-error-state with:
   - Unique session ID (e.g., "vite-task-{timestamp}")
   - Current progress/context
   - Error details
2. In subsequent runs, check for existing sessions with list-sessions
3. Restore state if needed and continue from where you left off
4. Clear sessions when tasks complete successfully

---

### 📂 FILE SYSTEM RULES

* All projects and generated files must **use the /tmp directory exclusively**.
* If a **Vite project already exists in /tmp**, continue working within it instead of creating a new one.
* You must **never overwrite** an existing project unless explicitly asked.

---

### ⚙️ DEVELOPMENT WORKFLOW

**Always use Context7 tools before coding:**

**Always list the files in a directory before creating new files.**

**When creating a Vite project, always wait 15 seconds after project creation.**

1. Clarify requirements and tech stack
2. Lookup Vite and related technologies using Context7 tools
3. Retrieve current documentation and patterns
4. Scaffold or enhance projects under /tmp, maintaining clean structure
5. Follow Vite conventions and optimization patterns
6. Include proper build configuration, testing, and development scripts
7. Prioritize maintainability, performance, and developer experience

---

### ⚡ VITE PROJECT RULES

* **Use the latest Vite configuration patterns and best practices**
* **Optimize for development speed and build performance**
* **Structure should include:**
  * vite.config.js/ts – main configuration file
  * index.html – entry point
  * src/main.js/ts – application entry
  * src/App.vue/jsx/tsx – main component
  * public/ - static assets
  * src/components/, src/assets/, etc. as needed

**Supported Frameworks with Vite:**
* React (with TypeScript/JavaScript)
* Vue 3 (with TypeScript/JavaScript)
* Svelte/SvelteKit
* Vanilla JavaScript/TypeScript
* Preact
* Lit
* Solid

If a Vite project exists:
* Validate configuration and structure
* Extend or modify as needed based on the request
* Optimize build and development settings

---

### 🧪 VITE ECOSYSTEM (verify latest versions with Context7)

**Core:** Vite, Rollup, ES Modules, Hot Module Replacement (HMR)
**Frontend Frameworks:** React, Vue, Svelte, Preact, Lit, Solid
**Styling:** Tailwind CSS, PostCSS, CSS Modules, Sass/SCSS, Styled Components
**Testing:** Vitest, Playwright, Cypress, Jest
**Build Tools:** ESBuild, SWC, Rollup plugins
**Utilities:** TypeScript, ESLint, Prettier, Autoprefixer
**Package Managers:** npm, yarn, pnpm, bun

---

### 🚀 COMMON VITE FEATURES TO LEVERAGE

* **Fast Development Server** with HMR
* **Optimized Build** with code splitting
* **Plugin Ecosystem** for extensibility
* **TypeScript Support** out of the box
* **CSS Preprocessing** and PostCSS
* **Asset Optimization** and bundling
* **Environment Variables** management
* **Proxy Configuration** for API development

---

### ✅ SUMMARY

* Always work in /tmp
* If a Vite project exists, enhance it — don't recreate
* Use Context7 tools for everything: Vite decisions, patterns, and examples
* Leverage Vite's speed and modern tooling advantages
* Adhere to modern best practices in project setup, UI/UX, and code quality
`;
  }

  async initialize(): Promise<void> {
    console.log(
      `⚡ Vite Development Agent initialized using ${this.config.model} on ${this.config.provider}\n`
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
        break;
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
    console.log('⚡ Welcome to Vite Interactive Development Agent!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(
      '\n💡 I specialize in creating lightning-fast Vite applications with modern tooling.'
    );
    console.log(
      "   Just describe what you want to build, and I'll use Context7 to get"
    );
    console.log(
      '   up-to-date Vite documentation and create an optimized solution for you.'
    );
    console.log('\n📝 Example requests:');
    console.log(
      '   • "Create a React + TypeScript app with Vite and Tailwind CSS"'
    );
    console.log(
      '   • "Build a Vue 3 dashboard with Vite, Vitest, and component library"'
    );
    console.log(
      '   • "Make a Svelte SPA with Vite and optimal build configuration"'
    );
    console.log(
      '   • "Create a vanilla TypeScript app with Vite and modern tooling"'
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
        '⚡ What Vite application would you like to build? '
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
        console.log('\n👋 Thank you for using Vite Agent! Goodbye!');
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
        break;
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
    console.log(`\n🔍 Processing Vite request: "${userInput}"`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Increment iteration count and start timing
    this.config.iterationCount++;
    const iterationStartTime = Date.now();

    console.log(`🔄 Starting Iteration #${this.config.iterationCount}`);
    console.log(
      `📝 User Input: "${userInput.substring(0, 100)}${userInput.length > 100 ? '...' : ''}"`
    );
    console.log(`⏰ Start Time: ${new Date().toLocaleTimeString()}`);
    console.log('─'.repeat(60));

    this.config.conversationHistory.push({
      role: MessageRole.user,
      content: userInput,
    });

    let assistantResponse = '';
    let shouldWaitForProject = false;

    await this.config.client.streamChatCompletion(
      {
        model: this.config.model,
        messages: this.config.conversationHistory,
        max_tokens: 2000,
      },
      {
        onOpen: () => {
          console.log(
            '🔗 Starting Vite development session with Context7...\n'
          );
        },
        onReasoning: (reasoning) => {
          console.log(`\n🤔 Agent Reasoning: ${reasoning}`);
        },
        onContent: (content) => {
          process.stdout.write(content);
          assistantResponse += content;
        },
        onUsageMetrics: (usage) => {
          const iterationDuration = Date.now() - iterationStartTime;
          this.config.totalTokensUsed += usage.total_tokens;

          console.log(
            `\n\n💰 Iteration #${this.config.iterationCount} Token Usage:`
          );
          console.log(
            `   📊 Prompt tokens: ${usage.prompt_tokens.toLocaleString()}`
          );
          console.log(
            `   ✍️  Completion tokens: ${usage.completion_tokens.toLocaleString()}`
          );
          console.log(
            `   🎯 Total tokens: ${usage.total_tokens.toLocaleString()}`
          );
          console.log(`   ⏱️  Duration: ${iterationDuration}ms`);
          console.log(
            `   🚀 Tokens/sec: ${Math.round((usage.total_tokens / iterationDuration) * 1000)}`
          );

          console.log(`\n📈 Cumulative Session Usage:`);
          console.log(`   🔢 Total Iterations: ${this.config.iterationCount}`);
          console.log(
            `   🎯 Total Tokens Used: ${this.config.totalTokensUsed.toLocaleString()}`
          );
          console.log(
            `   📈 Average Tokens per Iteration: ${Math.round(this.config.totalTokensUsed / this.config.iterationCount).toLocaleString()}`
          );

          // Calculate estimated cost (example rates - adjust based on provider)
          const estimatedCost = this.config.totalTokensUsed * 0.000001;
          console.log(
            `   💰 Estimated Total Cost: $${estimatedCost.toFixed(6)}`
          );
          console.log('─'.repeat(60));
        },
        onMCPTool: (toolCall: any) => {
          console.log(`\n🛠️  Context7 Tool: ${toolCall.function.name}`);
          try {
            const args = JSON.parse(toolCall.function.arguments);
            console.log(`📝 Arguments:`, JSON.stringify(args, null, 2));
          } catch {
            console.log(`📝 Raw Arguments: ${toolCall.function.arguments}`);
          }
          console.log(`🔍 Tool ID: ${toolCall.id}\n`);

          if (
            toolCall.function.name === 'create_vite_project' ||
            toolCall.function.name === 'create_new_workspace' ||
            toolCall.function.name.toLowerCase().includes('vite') ||
            toolCall.function.name.toLowerCase().includes('project')
          ) {
            console.log(
              '⚡ Vite project creation detected - will wait 15 seconds after completion'
            );
            shouldWaitForProject = true;
          }
        },
        onError: (error) => {
          console.error(`\n❌ Stream Error: ${error.error}`);
          throw new Error(`Stream error: ${error.error}`);
        },
        onFinish: async () => {
          console.log('\n\n✅ Vite development session completed!\n');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

          if (shouldWaitForProject) {
            await this.waitForViteProjectCreation();
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

async function runViteAgent(): Promise<void> {
  const agent = new ViteAgent();

  process.on('SIGINT', async () => {
    console.log('\n\n👋 Shutting down Vite Agent...');
    await agent.shutdown();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n\n👋 Shutting down Vite Agent...');
    await agent.shutdown();
    process.exit(0);
  });

  await agent.initialize();
}

if (require.main === module || process.argv[1].endsWith('index.ts')) {
  runViteAgent().catch(console.error);
}

export { runViteAgent, ViteAgent };
