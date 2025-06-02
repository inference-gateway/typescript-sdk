/**
 * Interactive NextJS Agent
 *
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
        timeout: 120000,
      }),
      provider: (process.env.PROVIDER as Provider) || Provider.groq,
      model: process.env.LLM || 'llama-3.3-70b-versatile',
      conversationHistory: [],
      maxRetries: 5,
      retryDelayMs: 5000,
      iterationCount: 0,
      totalTokensUsed: 0,
      maxTokensPerRequest: 2500,
      maxHistoryLength: 6,
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
    return `You are a NextJS development assistant. Create modern applications using current technologies.

CORE RULES:
- Work only in /tmp directory
- Use Next.js App Router (/app), never Pages Router  
- Wait 30 seconds after creating Next.js projects
- If project exists, enhance it - don't recreate
- Use Context7 tools for documentation lookup
- Tools called automatically - just describe what you need

AVAILABLE TOOLS: Context7 docs, web search, filesystem, npm commands, memory tools

WORKFLOW: 1) Clarify requirements 2) Use Context7 for docs 3) Build in /tmp 4) Follow modern conventions`;
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
          // Skip slow memory restoration for faster startup
          console.log('📥 Skipping memory restoration for faster startup');
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
          console.log(`\n🛠️  NextJS Tool: ${toolCall.function.name}`);
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
