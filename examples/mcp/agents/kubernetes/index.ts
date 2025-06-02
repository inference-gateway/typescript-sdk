/**
 * Interactive Kubernetes Operations Agent
 *
 * This agent specializes in Kubernetes cluster management, deployment automation,
 * and container orchestration using Context7 MCP tools for up-to-date K8s documentation.
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

interface ErrorRecord {
  timestamp: string;
  iterationCount: number;
  errorType: 'stream_error' | 'tool_error' | 'mcp_error' | 'memory_error';
  errorMessage: string;
  context: string;
  toolName?: string;
  toolId?: string;
  toolArguments?: any;
  userInput?: string;
  recoveryAttempted: boolean;
}

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
  errorHistory: ErrorRecord[];
  lastFailedToolCall?: {
    name: string;
    id: string;
    arguments: any;
    timestamp: string;
  };
}

class KubernetesAgent {
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
      retryDelayMs: 10000,
      iterationCount: 0,
      totalTokensUsed: 0,
      maxTokensPerRequest: 3000,
      maxHistoryLength: 10,
      sessionId: process.env.SESSION_ID || randomUUID(),
      memoryEnabled: true,
      abortController: new globalThis.AbortController(),
      errorHistory: [],
      lastFailedToolCall: undefined,
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

  private async waitForKubernetesOperation(): Promise<void> {
    console.log(
      '⏳ Waiting 10 seconds for Kubernetes operation to complete...'
    );
    await this.delay(10000);
    console.log('✅ Kubernetes operation wait period completed.\n');
  }

  /**
   * Record an error to both local history and memory
   */
  private async recordError(
    errorType: ErrorRecord['errorType'],
    errorMessage: string,
    context: string,
    toolCall?: any,
    userInput?: string
  ): Promise<void> {
    const errorRecord: ErrorRecord = {
      timestamp: new Date().toISOString(),
      iterationCount: this.config.iterationCount,
      errorType,
      errorMessage,
      context,
      toolName: toolCall?.function?.name,
      toolId: toolCall?.id,
      toolArguments: toolCall?.function?.arguments
        ? JSON.parse(toolCall.function.arguments)
        : undefined,
      userInput: userInput?.substring(0, 100),
      recoveryAttempted: false,
    };

    this.config.errorHistory.push(errorRecord);

    // Keep only last 10 errors to prevent memory bloat
    if (this.config.errorHistory.length > 10) {
      this.config.errorHistory = this.config.errorHistory.slice(-10);
    }

    console.log(`📝 Recording ${errorType}: ${errorMessage}`);

    // Save to memory if enabled
    if (this.config.memoryEnabled) {
      await this.saveErrorToMemory(errorRecord);
    }
  }

  /**
   * Save error state to memory with detailed context
   */
  private async saveErrorToMemory(errorRecord: ErrorRecord): Promise<void> {
    if (!this.config.memoryEnabled) return;

    try {
      const errorState = {
        conversationHistory: this.config.conversationHistory.slice(-3),
        iterationCount: this.config.iterationCount,
        totalTokensUsed: this.config.totalTokensUsed,
        timestamp: new Date().toISOString(),
        errorHistory: this.config.errorHistory,
        lastError: errorRecord,
      };

      console.log(
        `🚨 Saving error state to memory for session: ${this.config.sessionId}`
      );

      let toolCallDetected = false;
      let saveSuccessful = false;

      await this.config.client.streamChatCompletion(
        {
          model: this.config.model,
          messages: [
            {
              role: MessageRole.system,
              content: `You are a memory manager handling error recovery. You MUST call the save-error-state tool immediately with the error details below.

CRITICAL ERROR OCCURRED:
Error Type: ${errorRecord.errorType}
Error Message: ${errorRecord.errorMessage}
Context: ${errorRecord.context}
Tool: ${errorRecord.toolName || 'N/A'}
Tool ID: ${errorRecord.toolId || 'N/A'}
User Input: ${errorRecord.userInput || 'N/A'}
Timestamp: ${errorRecord.timestamp}

SessionID: ${this.config.sessionId}
Error State: ${JSON.stringify(errorState)}

Call save-error-state tool immediately with sessionId="${this.config.sessionId}" and the error state above.`,
            },
            {
              role: MessageRole.user,
              content: `URGENT: Save error state now using save-error-state tool for session "${this.config.sessionId}". Include full error context.`,
            },
          ],
          max_tokens: this.config.maxTokensPerRequest,
        },
        {
          onMCPTool: (toolCall) => {
            toolCallDetected = true;
            console.log(
              `📱 Error memory tool called: ${toolCall.function.name}`
            );

            if (
              toolCall.function.name === 'save-error-state' ||
              toolCall.function.name === 'save-state'
            ) {
              saveSuccessful = true;
              console.log('✅ Error state save tool invoked successfully');
            }
          },
          onReasoning: () => {
            // Suppress reasoning output for error saves to reduce noise
          },
          onContent: () => {
            // Suppress content output for error saves to reduce noise
          },
          onError: (error) => {
            console.warn('⚠️ Error memory save failed:', error.error);
          },
          onFinish: () => {
            if (toolCallDetected && saveSuccessful) {
              console.log('✅ Error state saved to memory successfully');
            } else {
              console.warn('⚠️ Failed to save error state to memory');
            }
          },
        },
        this.config.provider,
        this.config.abortController.signal
      );
    } catch (error) {
      console.warn(
        '⚠️ Failed to save error state to memory:',
        (error as Error).message
      );
    }
  }

  /**
   * Load and process previous errors from memory
   */
  private async loadErrorHistory(): Promise<void> {
    if (!this.config.memoryEnabled) return;

    try {
      console.log(
        `📥 Loading error history for session: ${this.config.sessionId}`
      );

      let errorData: any = null;

      await this.config.client.streamChatCompletion(
        {
          model: this.config.model,
          messages: [
            {
              role: MessageRole.system,
              content: `You have access to memory management tools. Check for and restore any saved error states for session "${this.config.sessionId}". If errors were previously recorded, provide details about what went wrong.`,
            },
            {
              role: MessageRole.user,
              content: `Check memory for previous errors in session "${this.config.sessionId}" and restore any error states found.`,
            },
          ],
          max_tokens: this.config.maxTokensPerRequest,
        },
        {
          onContent: (content) => {
            if (content.includes('error') || content.includes('Error')) {
              console.log(
                `📋 Previous error context: ${content.substring(0, 200)}...`
              );
            }
            if (content.includes('{') && content.includes('}')) {
              try {
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  errorData = JSON.parse(jsonMatch[0]);
                }
              } catch {
                // Ignore parsing errors for error recovery
              }
            }
          },
          onMCPTool: (toolCall) => {
            console.log(
              `📱 Error recovery tool called: ${toolCall.function.name}`
            );
          },
          onError: () => {
            console.log('ℹ️ No previous error state found');
          },
          onFinish: () => {
            if (errorData && errorData.errorHistory) {
              this.config.errorHistory = errorData.errorHistory || [];
              console.log(
                `✅ Restored ${this.config.errorHistory.length} previous error records`
              );

              if (this.config.errorHistory.length > 0) {
                const lastError =
                  this.config.errorHistory[this.config.errorHistory.length - 1];
                console.log(
                  `🔍 Last error was: ${lastError.errorType} - ${lastError.errorMessage}`
                );
                console.log(`   Context: ${lastError.context}`);
                if (lastError.toolName) {
                  console.log(
                    `   Failed tool: ${lastError.toolName} (${lastError.toolId})`
                  );
                }
              }
            }
          },
        },
        this.config.provider,
        this.config.abortController.signal
      );
    } catch (error) {
      console.log(`ℹ️ No error history found: ${(error as Error).message}`);
    }
  }

  private getSystemPrompt(): string {
    let errorHistoryPrompt = '';

    if (this.config.errorHistory.length > 0) {
      const recentErrors = this.config.errorHistory.slice(-2);
      errorHistoryPrompt = `\nERROR CONTEXT: Previous ${recentErrors.length} errors encountered. Adapt approach accordingly.\n`;
    }

    return `You are a Kubernetes operations assistant. Help with cluster management and container orchestration.${errorHistoryPrompt}

CORE RULES:
- Work only in /tmp directory  
- If K8s configs exist, enhance them - don't recreate
- Use Context7 tools for documentation lookup
- Tools called automatically - just describe what you need
- Follow security-first approach with RBAC and network policies
- Wait 10 seconds after applying K8s configurations

AVAILABLE TOOLS: Context7 docs, filesystem, memory tools for recovery

WORKFLOW: 1) Clarify requirements 2) Use Context7 for K8s docs 3) Create manifests in /tmp 4) Follow best practices`;
  }

  async initialize(): Promise<void> {
    console.log(
      `☸️  Kubernetes Operations Agent initialized using ${this.config.model} on ${this.config.provider}\n`
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

        const memoryTools = tools.data.filter((tool) =>
          ['save-state', 'restore-state', 'list-sessions'].includes(tool.name)
        );

        if (memoryTools.length > 0) {
          console.info(
            `🧠 Found ${memoryTools.length} memory management tools`
          );
          // Skip slow memory restoration for faster startup - only load on demand
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
    console.log('☸️  Welcome to Kubernetes Operations Agent!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(
      '\n💡 I specialize in Kubernetes cluster operations and container orchestration.'
    );
    console.log(
      "   Just describe what you want to deploy or manage, and I'll use Context7"
    );
    console.log(
      '   to get up-to-date K8s documentation and create production-ready solutions.'
    );
    console.log('\n📝 Example requests:');
    console.log(
      '   • "Deploy a scalable web application with load balancing and auto-scaling"'
    );
    console.log(
      '   • "Create a microservices architecture with service mesh and monitoring"'
    );
    console.log(
      '   • "Set up a CI/CD pipeline with GitOps and automated deployments"'
    );
    console.log(
      '   • "Configure RBAC and network policies for multi-tenant cluster"'
    );
    console.log(
      '   • "Deploy a database cluster with persistent storage and backups"'
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
        '☸️  What would you like to deploy or manage in Kubernetes? '
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
        console.log('\n👋 Thank you for using Kubernetes Agent! Goodbye!');

        if (this.config.memoryEnabled) {
          console.log('💾 Saving session state before exit...');
          this.saveStateToMemoryForced('Manual exit via user command')
            .then(() => {
              console.log('✅ Session state saved successfully');
              this.rl.close();
              process.exit(0);
            })
            .catch((error: Error) => {
              console.warn('⚠️  Failed to save session state:', error.message);
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
    console.log(`\n🔍 Processing Kubernetes request: "${userInput}"`);
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
    let shouldWaitForOperation = false;

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
            '\n🔗 Starting Kubernetes operations session with Context7...\n'
          );
        },
        onReasoning: (reasoning) => {
          process.stdout.write(reasoning);
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
        onMCPTool: (toolCall: any) => {
          console.log(`\n🛠️  Context7 Tool: ${toolCall.function.name}`);
          try {
            const args = JSON.parse(toolCall.function.arguments);
            console.log(`📝 Arguments:`, JSON.stringify(args, null, 2));
          } catch {
            console.log(`📝 Raw Arguments: ${toolCall.function.arguments}`);
          }
          console.log(`🔍 Tool ID: ${toolCall.id}\n`);

          // Store the tool call details for error recovery if needed
          this.config.lastFailedToolCall = {
            name: toolCall.function.name,
            id: toolCall.id,
            arguments: toolCall.function.arguments,
            timestamp: new Date().toISOString(),
          };

          if (
            toolCall.function.name.toLowerCase().includes('kubernetes') ||
            toolCall.function.name.toLowerCase().includes('k8s') ||
            toolCall.function.name.toLowerCase().includes('kubectl') ||
            toolCall.function.name.toLowerCase().includes('deploy') ||
            toolCall.function.name.toLowerCase().includes('create') ||
            toolCall.function.name.toLowerCase().includes('apply') ||
            toolCall.function.name.toLowerCase().includes('helm') ||
            toolCall.function.name === 'write_file' ||
            toolCall.function.name === 'create_directory'
          ) {
            console.log(
              '☸️  Kubernetes operation detected - will wait 10 seconds after completion'
            );
            shouldWaitForOperation = true;
          }
        },
        onError: async (error) => {
          console.error(`\n❌ Stream Error: ${error.error}`);

          // Record the error with detailed context
          await this.recordError(
            'stream_error',
            error.error || 'Unknown stream error',
            `Stream error during iteration ${this.config.iterationCount}. Last tool call: ${this.config.lastFailedToolCall?.name || 'none'}`,
            this.config.lastFailedToolCall,
            userInput
          );

          throw new Error(
            `Stream error: ${error.error || 'Unknown stream error'}`
          );
        },
        onFinish: async () => {
          console.log('\n\n✅ Kubernetes operations session completed!\n');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

          if (shouldWaitForOperation) {
            await this.waitForKubernetesOperation();
          }

          // Add assistant response to conversation history
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

  async shutdown(): Promise<void> {
    if (this.config.memoryEnabled) {
      console.log('💾 Saving session state before shutdown...');
      try {
        const shutdownTimeout = setTimeout(() => {
          console.warn('⚠️  Shutdown timeout reached, forcing exit...');
          process.exit(1);
        }, 10000);

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
            process.stdout.write(reasoning);
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
   * Combined fast memory state and error history loading
   */
  private async quickLoadStateAndErrorHistory(): Promise<void> {
    if (!this.config.memoryEnabled) return;

    try {
      console.log(
        `📥 Attempting to restore state for session: ${this.config.sessionId}`
      );

      // Single LLM call to check both state and errors
      let restoredData: any = null;
      let errorData: any = null;

      await this.config.client.streamChatCompletion(
        {
          model: this.config.model,
          messages: [
            {
              role: MessageRole.system,
              content: `You have access to memory management tools. Quickly restore the saved state for session "${this.config.sessionId}" and check for any previous errors. Use the restore-state tool once.`,
            },
            {
              role: MessageRole.user,
              content: `Restore session state and error history for "${this.config.sessionId}" using restore-state tool.`,
            },
          ],
          max_tokens: 2000, // Reduced token limit for faster response
        },
        {
          onContent: (content) => {
            if (content.includes('{') && content.includes('}')) {
              try {
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  const data = JSON.parse(jsonMatch[0]);
                  if (data.state) {
                    restoredData = data;
                  }
                  if (data.errorHistory || data.lastError) {
                    errorData = data;
                  }
                }
              } catch {
                // Ignore parsing errors for quick startup
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
            // Restore state if found
            if (restoredData && restoredData.state) {
              this.config.conversationHistory =
                restoredData.state.conversationHistory || [];
              this.config.iterationCount =
                restoredData.state.iterationCount || 0;
              this.config.totalTokensUsed =
                restoredData.state.totalTokensUsed || 0;

              console.log(`✅ Restored state from ${restoredData.timestamp}`);
              console.log(
                `📊 Restored ${this.config.conversationHistory.length} messages`
              );
              console.log(
                `🔢 Restored iteration count: ${this.config.iterationCount}`
              );
            }

            // Restore error history if found
            if (errorData && errorData.errorHistory) {
              this.config.errorHistory = errorData.errorHistory || [];
              console.log(
                `✅ Restored ${this.config.errorHistory.length} previous error records`
              );

              if (this.config.errorHistory.length > 0) {
                const lastError =
                  this.config.errorHistory[this.config.errorHistory.length - 1];
                console.log(
                  `🔍 Last error was: ${lastError.errorType} - ${lastError.errorMessage}`
                );
              }
            }

            if (!restoredData && !errorData) {
              console.log('ℹ️  No previous state found');
            }
          },
        },
        this.config.provider,
        this.config.abortController.signal
      );
    } catch (error) {
      console.log(`ℹ️  No previous state found: ${(error as Error).message}`);
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
}

async function runKubernetesAgent(): Promise<void> {
  const agent = new KubernetesAgent();

  process.on('SIGINT', async () => {
    console.log('\n\n👋 Shutting down Kubernetes Agent...');
    agent.abortOperations();
    await agent.shutdown();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n\n👋 Shutting down Kubernetes Agent...');
    agent.abortOperations();
    await agent.shutdown();
    process.exit(0);
  });

  await agent.initialize();
}

if (require.main === module || process.argv[1].endsWith('index.ts')) {
  runKubernetesAgent().catch(console.error);
}

export { KubernetesAgent, runKubernetesAgent };
