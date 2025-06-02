/**
 * Interactive NextJS Agent
 *
 * This agent allows users to interactively request app development assistance
 * using Context7 MCP tools for up-to-date documentation and library information.
 */

import {
  InferenceGatewayClient,
  MessageRole,
  Provider,
} from '@inference-gateway/sdk';
import { randomUUID } from 'crypto';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as readline from 'readline';
import { clearTimeout, setTimeout } from 'timers';

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
  maxTokensPerRequest: number;
  maxHistoryLength: number;
  sessionId: string;
  memoryEnabled: boolean;
  abortController: globalThis.AbortController;
}

class NextJSAgent {
  private config: AgentConfig;
  private rl: readline.Interface;

  constructor() {
    console.log('🔧 Debug - Environment variables:');
    console.log('   PROVIDER:', process.env.PROVIDER);
    console.log('   LLM:', process.env.LLM);

    this.config = {
      client: new InferenceGatewayClient({
        baseURL: 'http://inference-gateway:8080/v1',
      }),
      provider: (process.env.PROVIDER as Provider) || Provider.groq,
      model: process.env.LLM || 'llama-3.3-70b-versatile',
      conversationHistory: [],
      maxRetries: 3,
      retryDelayMs: 60000,
      iterationCount: 0,
      totalTokensUsed: 0,
      maxTokensPerRequest: 3000,
      maxHistoryLength: 10,
      sessionId: process.env.SESSION_ID || randomUUID(),
      memoryEnabled: true,
      abortController: new globalThis.AbortController(),
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
    return new Promise((resolve, reject) => {
      if (this.config.abortController.signal.aborted) {
        reject(new Error('Aborted'));
        return;
      }

      const timeout = global.setTimeout(() => resolve(), ms);

      const abortHandler = () => {
        global.clearTimeout(timeout);
        reject(new Error('Aborted'));
      };

      this.config.abortController.signal.addEventListener(
        'abort',
        abortHandler,
        { once: true }
      );
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

**ABSOLUTELY CRITICAL - READ THIS FIRST**:
- You must NEVER output XML tags or function calls in any format
- You must NEVER use syntax like <tool_name>, <function>, or <function(name)>
- Tools are handled automatically by the MCP system - you just describe what you need
- When you want to search: Say "I need to search for X" - don't output XML
- When you want to fetch: Say "I need to get information from Y" - don't output XML
- Just communicate naturally and the system will handle all tool calling

---

### 🔧 CORE RESPONSIBILITIES

You help users create **modern, production-grade applications** by:

1. Understanding user requirements and recommending the best-fit technologies
2. Using **Context7 tools** to retrieve up-to-date documentation and best practices
3. Building complete projects with proper structure and configuration
4. Following modern development conventions and patterns
5. Creating clean, responsive, and accessible UI/UX

---

### 🧰 AVAILABLE TOOLS

You have access to several MCP tool categories:

**Context7 Tools (@upstash/context7-mcp):**

* c41_resolve-library-id: Resolve technology names to Context7-compatible IDs
* c41_get-library-docs: Fetch full documentation, usage examples, and best practices

**Web Search Tools:**

* search_web: Perform web searches using DuckDuckGo (use this FIRST before fetching URLs)
* fetch_url: Fetch content from verified URLs (only use URLs from search results)
* get_page_title: Extract page titles from URLs

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

* read_file: Read the contents of a file
* write_file: Write content to a file
* list_directory: List directory contents
* create_directory: Create directories
* delete_file: Delete files
* file_info: Get file information

**NPM Tools:**

* npm_run: Execute npm commands (install, build, start, test, etc.)
* npm_init: Initialize new npm project
* npm_install: Install npm packages
* create_nextjs_project: Create a new Next.js project with specified options

**CRITICAL TOOL USAGE RULES**:
- NEVER use XML-style syntax like <tool_name> or <function> tags
- NEVER output function calls in XML format like <function(tool_name)>
- Tools are automatically available and will be called by the system when you need them
- Simply describe what you want to do and the system will handle tool calls
- If you need to search, just say "I need to search for..." and the system will call search_web
- If you need to fetch a URL, just say "I need to fetch..." and the system will call fetch_url

---

### 🛡️ ERROR RECOVERY STRATEGY

When encountering HTTP errors or failures:

1. Immediately save state using save-error-state with:
   - Unique session ID (e.g., "nextjs-task-{timestamp}")
   - Current progress/context
   - Error details
2. In subsequent runs, check for existing sessions with list-sessions
3. Restore state if needed and continue from where you left off
4. Clear sessions when tasks complete successfully

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

**CRITICAL: Never use XML-style tool syntax like \`<tool_name>\` or \`<function>\` tags. All tools are automatically available through MCP and will be called by the LLM when needed. Simply describe what you want to do in natural language.**

**Web Search Best Practices:**
1. **Always search first**: Use search_web to find information before trying to fetch URLs
2. **Use reliable URLs**: Only fetch URLs from search results or known reliable domains
3. **Verify domains**: Stick to major sites like github.com, stackoverflow.com, docs sites, etc.
4. **Search workflow**: search_web → get reliable URLs → fetch_url with those URLs

1. Clarify requirements and tech stack
2. Lookup technologies using Context7 tools OR web search tools
3. Retrieve current documentation and patterns
4. Scaffold or enhance projects under /tmp, maintaining clean structure
5. Follow framework and language conventions
6. Include error handling, testing, and CI/build scripts
7. Prioritize maintainability, readability, and DX (developer experience)

**For Next.js projects:**
- Use \`create_nextjs_project\` tool to create new projects
- Use \`npm_run\` tool for npm commands like "run dev", "install", "build"
- Use filesystem tools to read/write files and list directories

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
* Always Use Context7 tools for everything: tech decisions, patterns, and examples
* Adhere to modern best practices in project setup, UI/UX, and code quality
`;
  }

  async initialize(): Promise<void> {
    console.log(
      `🚀 NextJS Interactive Agent initialized using ${this.config.model} on ${this.config.provider}\n`
    );

    let attempt = 0;
    while (attempt < this.config.maxRetries) {
      try {
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

        const memoryTools = tools.data.filter((tool) =>
          ['save-state', 'restore-state', 'list-sessions'].includes(tool.name)
        );

        if (memoryTools.length > 0) {
          console.info(
            `🧠 Found ${memoryTools.length} memory management tools`
          );
          await this.loadStateFromMemory();
        } else {
          console.info(
            '⚠️  No memory tools available. State persistence disabled.'
          );
          this.config.memoryEnabled = false;
        }

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
    console.log('🤖 Welcome to NextJS Interactive Development Agent!');
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
        console.log('\n👋 Thank you for using NextJS Agent! Goodbye!');

        if (this.config.memoryEnabled) {
          console.log('💾 Saving session state before exit...');
          this.saveStateToMemoryForced('Manual exit via user command')
            .then(() => {
              console.log('✅ Session state saved successfully');
              this.rl.close();
              process.exit(0);
            })
            .catch((error) => {
              console.warn(
                '⚠️  Failed to save session state:',
                (error as Error).message
              );
              this.rl.close();
              process.exit(0);
            });
        } else {
          this.rl.close();
          process.exit(0);
        }
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
    console.log(`\n🔍 Processing request: "${userInput}"`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

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

    if (this.config.memoryEnabled) {
      await this.saveStateToMemory(
        `Before processing request: "${userInput.substring(0, 50)}..."`
      );
    }

    this.resetAbortController();

    let assistantResponse = '';
    let shouldWaitForProject = false;

    console.log(
      `🔧 Debug - Using provider: ${this.config.provider}, model: ${this.config.model}`
    );

    await this.config.client.streamChatCompletion(
      {
        model: this.config.model,
        messages: this.getOptimizedConversationHistory(),
        max_tokens: this.config.maxTokensPerRequest,
      },
      {
        onOpen: () => {
          console.log(
            '\n🔗 Starting development session with NextJS Agent...\n'
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

          const estimatedCost = this.config.totalTokensUsed * 0.000001;
          console.log(
            `   💰 Estimated Total Cost: $${estimatedCost.toFixed(6)}`
          );
          console.log('─'.repeat(60));
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

          if (this.config.memoryEnabled) {
            this.saveStateToMemory(
              `Error occurred during request processing: ${error.error}`
            ).catch(console.warn);
          }

          throw new Error(`Stream error: ${error.error}`);
        },
        onFinish: async () => {
          console.log('\n\n✅ Development session completed!\n');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

          if (shouldWaitForProject) {
            await this.waitForProjectCreation();
          }

          if (assistantResponse.trim()) {
            this.config.conversationHistory.push({
              role: MessageRole.assistant,
              content: assistantResponse,
            });
          }
        },
      },
      this.config.provider,
      this.config.abortController.signal
    );
  }

  /**
   * Save current state to memory MCP server
   */
  private async saveStateToMemory(context: string): Promise<void> {
    if (!this.config.memoryEnabled) return;

    try {
      const state = {
        conversationHistory: this.config.conversationHistory.slice(-5),
        iterationCount: this.config.iterationCount,
        totalTokensUsed: this.config.totalTokensUsed,
        timestamp: new Date().toISOString(),
      };

      console.log(
        `💾 Saving state to memory for session: ${this.config.sessionId}`
      );

      let toolCallDetected = false;
      let saveSuccessful = false;

      await this.config.client.streamChatCompletion(
        {
          model: this.config.model,
          messages: [
            {
              role: MessageRole.system,
              content: `You are a memory manager. You MUST call the save-state tool now with the provided data. Don't explain - just call the tool immediately.

SessionID: ${this.config.sessionId}
State: ${JSON.stringify(state)}
Context: ${context}

Call save-state tool immediately with sessionId="${this.config.sessionId}" and the state object above.`,
            },
            {
              role: MessageRole.user,
              content: `Call save-state tool now with sessionId="${this.config.sessionId}"`,
            },
          ],
          max_tokens: this.config.maxTokensPerRequest,
        },
        {
          onMCPTool: (toolCall) => {
            toolCallDetected = true;
            console.log(`📱 Memory tool called: ${toolCall.function.name}`);

            if (
              toolCall.function.name === 'save-state' ||
              toolCall.function.name === 'save-error-state'
            ) {
              saveSuccessful = true;
              console.log('✅ State save tool invoked successfully');
            }
          },
          onReasoning: (reasoning) => {
            console.log(`\n🤔 Memory Reasoning: ${reasoning}`);
          },
          onContent: (content) => {
            process.stdout.write(content);
          },
          onError: (error) => {
            console.warn('⚠️  Memory save failed:', error.error);
          },
          onFinish: () => {
            if (toolCallDetected && saveSuccessful) {
              console.log('✅ Memory save completed successfully');
            } else if (!toolCallDetected) {
              console.warn(
                '⚠️  No memory tool was called - memory may not be available'
              );
            } else {
              console.warn('⚠️  Memory tool called but save may have failed');
            }
          },
        },
        this.config.provider,
        this.config.abortController.signal
      );
    } catch (error) {
      console.warn(
        '⚠️  Failed to save state to memory:',
        (error as Error).message
      );
    }
  }

  /**
   * Save current state to memory MCP server with forced tool usage
   */
  private async saveStateToMemoryForced(context: string): Promise<void> {
    if (!this.config.memoryEnabled) return;

    try {
      const state = {
        conversationHistory: this.config.conversationHistory.slice(-5),
        iterationCount: this.config.iterationCount,
        totalTokensUsed: this.config.totalTokensUsed,
        timestamp: new Date().toISOString(),
      };

      console.log(
        `💾 Forcing memory save for session: ${this.config.sessionId}`
      );

      let toolCallDetected = false;
      let saveSuccessful = false;
      const maxAttempts = 3;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        if (this.config.abortController.signal.aborted) {
          console.warn('⚠️  Memory save aborted during shutdown');
          throw new Error('Memory save aborted');
        }

        console.log(`🔄 Memory save attempt ${attempt}/${maxAttempts}`);

        try {
          await this.config.client.streamChatCompletion(
            {
              model: this.config.model,
              messages: [
                {
                  role: MessageRole.system,
                  content: `You are a memory manager. You MUST call the save-state tool immediately. No explanations, no acknowledgments - just call the tool.

CRITICAL: You MUST call save-state tool with these exact parameters:
- sessionId: "${this.config.sessionId}"
- state: ${JSON.stringify(state)}
- context: "${context}"

Call the save-state tool now.`,
                },
                {
                  role: MessageRole.user,
                  content: `Call save-state tool immediately with sessionId="${this.config.sessionId}". Do not respond with text - only call the tool.`,
                },
              ],
              max_tokens: this.config.maxTokensPerRequest,
            },
            {
              onMCPTool: (toolCall) => {
                toolCallDetected = true;
                console.log(`📱 Memory tool called: ${toolCall.function.name}`);

                if (
                  toolCall.function.name === 'save-state' ||
                  toolCall.function.name === 'save-error-state'
                ) {
                  saveSuccessful = true;
                  console.log('✅ Memory tool invoked successfully');
                  try {
                    const args = JSON.parse(toolCall.function.arguments);
                    console.log(
                      `📝 Tool arguments:`,
                      JSON.stringify(args, null, 2)
                    );
                  } catch {
                    console.error(
                      `📝 Raw tool arguments: ${toolCall.function.arguments}`
                    );
                  }
                }
              },
              onContent: (content) => {
                process.stdout.write(content);
              },
              onError: (error) => {
                console.warn(
                  `⚠️  Memory save attempt ${attempt} failed:`,
                  error.error
                );
              },
              onFinish: () => {
                if (toolCallDetected && saveSuccessful) {
                  console.log(
                    `✅ Memory save completed successfully on attempt ${attempt}`
                  );
                } else if (!toolCallDetected) {
                  console.warn(
                    `⚠️  Attempt ${attempt}: No memory tool was called`
                  );
                } else {
                  console.warn(
                    `⚠️  Attempt ${attempt}: Memory tool called but save may have failed`
                  );
                }
              },
            },
            this.config.provider,
            this.config.abortController.signal
          );

          if (toolCallDetected && saveSuccessful) {
            break;
          }

          if (attempt < maxAttempts) {
            if (this.config.abortController.signal.aborted) {
              console.warn('⚠️  Memory save aborted during retry wait');
              throw new Error('Memory save aborted');
            }
            console.log(`⏳ Waiting 2 seconds before retry...`);
            await this.delay(2000);
          }
        } catch (attemptError) {
          console.warn(
            `⚠️  Memory save attempt ${attempt} error:`,
            (attemptError as Error).message
          );
          if (attempt === maxAttempts) {
            throw attemptError;
          }
        }
      }

      if (!toolCallDetected || !saveSuccessful) {
        console.error(
          `❌ Failed to save memory after ${maxAttempts} attempts - memory tools may not be available`
        );
      }
    } catch (error) {
      console.warn(
        '⚠️  Failed to save state to memory:',
        (error as Error).message
      );
    }
  }

  /**
   * Load state from memory MCP server (via chat completion)
   */
  private async loadStateFromMemory(): Promise<boolean> {
    if (!this.config.memoryEnabled) return false;

    try {
      console.log(
        `📥 Attempting to restore state for session: ${this.config.sessionId}`
      );

      let restoredData: any = null;

      await this.config.client.streamChatCompletion(
        {
          model: this.config.model,
          messages: [
            {
              role: MessageRole.system,
              content: `You have access to memory management tools. Restore the saved state for session "${this.config.sessionId}".`,
            },
            {
              role: MessageRole.user,
              content: `Please restore the session state using the restore-state tool and provide the restored data.`,
            },
          ],
          max_tokens: this.config.maxTokensPerRequest,
        },
        {
          onReasoning: (reasoning) => {
            console.log(`\n🤔 Memory Reasoning: ${reasoning}`);
          },
          onContent: (content) => {
            if (content.includes('{') && content.includes('}')) {
              try {
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  restoredData = JSON.parse(jsonMatch[0]);
                }
              } catch {
                console.error(`⚠️  Failed to parse restored data: ${content}`);
              }
            }
          },
          onMCPTool: (toolCall) => {
            console.log(`📱 Memory tool called: ${toolCall.function.name}`);
          },
          onError: () => {
            console.log('ℹ️  No previous state found');
          },
          onFinish: () => {
            if (restoredData && restoredData.state) {
              this.config.conversationHistory =
                restoredData.state.conversationHistory || [];
              this.config.iterationCount =
                restoredData.state.iterationCount || 0;
              this.config.totalTokensUsed =
                restoredData.state.totalTokensUsed || 0;

              console.log(
                `✅ Restored state from ${restoredData.state.timestamp}`
              );
              console.log(
                `📊 Restored ${this.config.conversationHistory.length} messages`
              );
              console.log(
                `🔢 Restored iteration count: ${this.config.iterationCount}`
              );
            }
          },
        },
        this.config.provider,
        this.config.abortController.signal
      );

      return !!restoredData;
    } catch (error) {
      console.log(`ℹ️  No previous state found: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Truncate conversation history to stay within token limits
   */
  private truncateConversationHistory(): void {
    if (
      this.config.conversationHistory.length <=
      this.config.maxHistoryLength + 1
    ) {
      return;
    }

    console.log(
      `✂️  Truncating conversation history from ${this.config.conversationHistory.length} to ${this.config.maxHistoryLength + 1} messages`
    );

    const systemPrompt = this.config.conversationHistory[0];

    const recentMessages = this.config.conversationHistory.slice(
      -this.config.maxHistoryLength
    );

    const truncatedMessages = this.config.conversationHistory.slice(
      1,
      -this.config.maxHistoryLength
    );

    if (truncatedMessages.length > 0) {
      this.saveStateToMemoryForced(
        `Truncated ${truncatedMessages.length} older messages`
      ).catch((error) => {
        console.warn(
          '⚠️  Failed to save truncated messages to memory:',
          (error as Error).message
        );
      });
    }

    this.config.conversationHistory = [systemPrompt, ...recentMessages];
  }

  /**
   * Estimate token count for a message (rough approximation)
   */
  private estimateTokenCount(text: string): number {
    // Rough approximation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  /**
   * Get optimized conversation history for the current request
   */
  private getOptimizedConversationHistory(): Array<{
    role: MessageRole;
    content: string;
  }> {
    this.truncateConversationHistory();

    const totalEstimatedTokens = this.config.conversationHistory.reduce(
      (sum, msg) => sum + this.estimateTokenCount(msg.content),
      0
    );

    console.log(`📊 Estimated tokens in conversation: ${totalEstimatedTokens}`);

    return this.config.conversationHistory;
  }

  private resetAbortController(): void {
    if (!this.config.abortController.signal.aborted) {
      this.config.abortController.abort('Starting new request');
    }
    this.config.abortController = new globalThis.AbortController();
  }

  async shutdown(): Promise<void> {
    if (this.config.memoryEnabled) {
      console.log('💾 Saving session state before shutdown...');
      try {
        const shutdownTimeout = setTimeout(() => {
          console.warn('⚠️  Shutdown timeout reached, forcing exit...');
          process.exit(1);
        }, 10000); // 10 second timeout

        await this.saveStateToMemoryForced(
          'Manual shutdown via SIGINT/SIGTERM signal'
        );

        clearTimeout(shutdownTimeout);
        console.log('✅ Session state saved successfully');
      } catch (error) {
        console.warn(
          '⚠️  Failed to save session state:',
          (error as Error).message
        );
      }
    }

    this.rl.close();
  }

  abortOperations(): void {
    if (!this.config.abortController.signal.aborted) {
      this.config.abortController.abort('Shutdown signal received');
    }
  }
}

async function runNextJSAgent(): Promise<void> {
  const agent = new NextJSAgent();

  process.on('SIGINT', async () => {
    console.log('\n\n👋 Shutting down NextJS Agent...');
    agent.abortOperations();
    await agent.shutdown();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n\n👋 Shutting down NextJS Agent...');
    agent.abortOperations();
    await agent.shutdown();
    process.exit(0);
  });

  await agent.initialize();
}

if (require.main === module || process.argv[1].endsWith('index.ts')) {
  runNextJSAgent().catch(console.error);
}

export { NextJSAgent, runNextJSAgent };
