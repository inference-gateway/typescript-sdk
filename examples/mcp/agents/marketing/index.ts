/**
 * Interactive Marketing Agent
 *
 * This agent specializes in marketing research, competitive analysis,
 * brand monitoring, and market intelligence using Brave Search and other MCP tools.
 */

import {
  InferenceGatewayClient,
  MessageRole,
  Provider,
  SchemaChatCompletionMessageToolCall,
} from '@inference-gateway/sdk';
import { randomUUID } from 'crypto';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as readline from 'readline';

dotenv.config({ path: path.join(__dirname, '.env') });

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

class MarketingAgent {
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

  /**
   * Extract error message from various error types
   */
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (error && typeof error === 'object') {
      const errorObj = error as any;
      if (errorObj.message) return String(errorObj.message);
      if (errorObj.error) return String(errorObj.error);
      if (errorObj.reason) return String(errorObj.reason);
      return JSON.stringify(error);
    }
    return String(error);
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
        ? (() => {
            try {
              return JSON.parse(toolCall.function.arguments);
            } catch {
              return toolCall.function.arguments;
            }
          })()
        : undefined,
      userInput: userInput?.substring(0, 100),
      recoveryAttempted: false,
    };

    this.config.errorHistory.push(errorRecord);

    if (this.config.errorHistory.length > 10) {
      this.config.errorHistory = this.config.errorHistory.slice(-10);
    }

    console.log(`📝 Recording ${errorType}: ${errorMessage}`);

    if (this.config.memoryEnabled) {
      try {
        await this.saveErrorToMemory(errorRecord);
      } catch (memoryError) {
        console.log(
          `⚠️  Failed to save error to memory: ${this.getErrorMessage(memoryError)}`
        );
      }
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

      await this.config.client.streamChatCompletion(
        {
          model: this.config.model,
          messages: [
            {
              role: MessageRole.system,
              content: `You are a memory manager handling error recovery. You MUST call the save-error-state tool immediately with the error details below.

ERROR DETAILS:
- Type: ${errorRecord.errorType}
- Message: ${errorRecord.errorMessage}
- Context: ${errorRecord.context}
- Tool: ${errorRecord.toolName || 'none'}
- Timestamp: ${errorRecord.timestamp}

CRITICAL: Call save-error-state tool NOW with this data.`,
            },
            {
              role: MessageRole.user,
              content: `Save error state for session ${this.config.sessionId}: ${JSON.stringify(errorState)}`,
            },
          ],
          max_tokens: this.config.maxTokensPerRequest,
        },
        {
          onReasoning: (reasoning) => {
            process.stdout.write(reasoning);
          },
          onContent: (content) => {
            process.stdout.write(content);
          },
          onError: (error) => {
            console.error(
              `❌ Memory save error: ${this.getErrorMessage(error)}`
            );
          },
        },
        this.config.provider,
        this.config.abortController.signal
      );

      console.log('💾 Error state saved to memory system');
    } catch (memoryError) {
      console.log(
        `⚠️  Failed to save error to memory: ${this.getErrorMessage(memoryError)}`
      );
    }
  }

  private getSystemPrompt(): string {
    let errorHistoryPrompt = '';

    if (this.config.errorHistory.length > 0) {
      const recentErrors = this.config.errorHistory.slice(-2);
      errorHistoryPrompt = `\nERROR CONTEXT: Previous ${recentErrors.length} errors encountered. Adapt approach accordingly.\n`;
    }

    return `You are a Marketing Intelligence Agent specializing in market research, competitive analysis, brand monitoring, and marketing strategy development.${errorHistoryPrompt}

Today is ${new Date().toLocaleDateString()}.

CORE CAPABILITIES:
- Market research and trend analysis using Brave Search
- Competitive intelligence and brand monitoring
- Content research and marketing insights
- News monitoring and sentiment tracking
- Marketing strategy recommendations

AVAILABLE TOOLS:
- brave_web_search: Comprehensive web search for market research
- brave_news_search: Real-time news search for trend monitoring
- marketing_research: Automated competitive analysis and brand research
- Context7 tools: Latest marketing best practices and documentation
- Memory tools: Session persistence and research history
- Filesystem tools: Save research reports and analysis

WORKFLOW GUIDELINES:
1. Always start by understanding the marketing objective or research goal
2. Use Brave Search tools for comprehensive market intelligence
3. Cross-reference findings with news search for current trends
4. Save important research to memory for future reference
5. Provide actionable insights and strategic recommendations

SEARCH STRATEGY:
- Use specific, targeted queries for better results
- Include competitors in research for comparative analysis
- Filter by country/region when relevant for localized insights
- Use freshness filters to get the most current information
- Combine web and news search for comprehensive coverage

Always provide structured, actionable marketing insights with clear next steps.`;
  }

  async initialize(): Promise<void> {
    console.log(
      `📈 Marketing Intelligence Agent initialized using ${this.config.model} on ${this.config.provider}\n`
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

        const braveSearchTools = tools.data.filter((tool) =>
          [
            'brave_web_search',
            'brave_news_search',
            'marketing_research',
          ].includes(tool.name)
        );

        const context7Tools = tools.data.filter((tool) =>
          [
            'c41_resolve-library-id',
            'c41_get-library-docs',
            'search_libraries',
            'get_library_details',
            'get_documentation',
          ].includes(tool.name)
        );

        const memoryTools = tools.data.filter((tool) =>
          ['save-state', 'restore-state', 'list-sessions'].includes(tool.name)
        );

        const filesystemTools = tools.data.filter((tool) =>
          ['write_file', 'read_file', 'list_directory'].includes(tool.name)
        );

        if (braveSearchTools.length === 0) {
          console.error(
            '⚠️  No Brave Search tools available. Make sure the Brave Search MCP server is running.'
          );
          console.error(
            '   Required: brave_web_search, brave_news_search, marketing_research'
          );
          console.error('   Run: docker-compose up --build');
          process.exit(1);
        }

        console.info(`🔍 Found ${braveSearchTools.length} Brave Search tools:`);
        braveSearchTools.forEach((tool, index) => {
          console.info(`  ${index + 1}. ${tool.name} - ${tool.description}`);
        });

        if (context7Tools.length > 0) {
          console.info(
            `📚 Found ${context7Tools.length} Context7 documentation tools`
          );
        }

        if (memoryTools.length > 0) {
          console.info(
            `🧠 Found ${memoryTools.length} memory management tools`
          );
          this.config.memoryEnabled = true;
          console.log('📥 Memory persistence enabled');
        } else {
          console.info(
            '⚠️  No memory tools available. State persistence disabled.'
          );
          this.config.memoryEnabled = false;
        }

        if (filesystemTools.length > 0) {
          console.info(
            `📁 Found ${filesystemTools.length} filesystem tools for report saving`
          );
        }

        console.info('');
        this.showWelcomeMessage();
        break;
      } catch (error) {
        attempt++;
        const errorMessage = this.getErrorMessage(error);
        console.error(
          `❌ Initialization attempt ${attempt}/${this.config.maxRetries} failed:`,
          errorMessage
        );

        if (attempt >= this.config.maxRetries) {
          console.error('🚫 Max initialization attempts reached. Exiting.');
          process.exit(1);
        }

        console.log(`⏳ Retrying in ${this.config.retryDelayMs}ms...`);
        await this.delay(this.config.retryDelayMs);
      }
    }
  }

  private showWelcomeMessage(): void {
    console.log(`
╔═════════════════════════════════════════════════════════════════╗
║                    📈 Marketing Intelligence Agent              ║
║                                                                 ║
║ 🎯 Market Research & Competitive Analysis                       ║
║ 📊 Brand Monitoring & Trend Analysis                            ║
║ 📰 News Monitoring & Sentiment Tracking                         ║
║ 💡 Marketing Strategy & Insights                                ║
║                                                                 ║
║ Commands:                                                       ║
║   - Research [brand/topic]  - Comprehensive market research     ║
║   - Analyze [brand] vs [competitor] - Competitive analysis      ║
║   - Monitor [brand] news - News and trend monitoring            ║
║   - Trends [industry] - Industry trend analysis                 ║
║   - Help - Show available commands and examples                 ║
║   - Exit/Quit - Quit the agent                                  ║
║                                                                 ║
║ 🔍 Powered by Brave Search API for comprehensive market intel   ║
╚═════════════════════════════════════════════════════════════════╝

Examples:
• "Research Tesla's market position and customer sentiment"
• "Analyze Apple vs Samsung smartphone market share"
• "Monitor OpenAI news and competitor responses"
• "Trends in sustainable fashion industry"

Ready for your marketing research request! 🚀
`);
  }

  private trimConversationHistory(): void {
    if (this.config.conversationHistory.length > this.config.maxHistoryLength) {
      const systemMessage = this.config.conversationHistory[0];
      const recentMessages = this.config.conversationHistory.slice(
        -(this.config.maxHistoryLength - 1)
      );
      this.config.conversationHistory = [systemMessage, ...recentMessages];
      console.log(
        '🔄 Trimmed conversation history to prevent context overflow'
      );
    }
  }

  async processUserInput(userInput: string): Promise<void> {
    if (this.config.abortController.signal.aborted) {
      console.log('🛑 Operation aborted by user');
      return;
    }

    this.config.iterationCount++;
    console.log(`\n--- Iteration ${this.config.iterationCount} ---`);

    // Handle special commands
    const normalizedInput = userInput.toLowerCase().trim();
    if (normalizedInput === 'exit' || normalizedInput === 'quit') {
      this.shutdown();
      return;
    }

    if (normalizedInput === 'help') {
      this.showHelpMessage();
      return;
    }

    this.config.conversationHistory.push({
      role: MessageRole.user,
      content: userInput,
    });

    this.trimConversationHistory();

    let attempt = 0;
    while (attempt < this.config.maxRetries) {
      try {
        let response = '';
        let toolCallResults: any[] = [];
        let currentToolCall: any = null;
        let assistantResponse = '';

        console.log('🤔 Analyzing your marketing research request...\n');

        await this.config.client.streamChatCompletion(
          {
            model: this.config.model,
            messages: this.config.conversationHistory,
            max_tokens: this.config.maxTokensPerRequest,
          },
          {
            onContent(content) {
              process.stdout.write(content);
              response += content;
            },
            onMCPTool: async (
              toolCall: SchemaChatCompletionMessageToolCall
            ) => {
              console.log(`\n🛠️  Marketing Tool: ${toolCall.function.name}`);
              try {
                const args = JSON.parse(toolCall.function.arguments);
                console.log(`📝 Arguments:`, JSON.stringify(args, null, 2));
              } catch {
                console.log(`📝 Raw Arguments: ${toolCall.function.arguments}`);
              }
              console.log(`🔍 Tool ID: ${toolCall.id}\n`);
            },
            onFinish: async () => {
              console.log('\n\n✅ Development session completed!\n');
              console.log(
                '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
              );

              if (assistantResponse.trim()) {
                this.config.conversationHistory.push({
                  role: MessageRole.assistant,
                  content: assistantResponse,
                });
              }
            },
            onError: async (error) => {
              const errorMessage = this.getErrorMessage(error);
              console.error(`❌ Stream error: ${errorMessage}`);
              await this.recordError(
                'stream_error',
                errorMessage,
                'Streaming chat completion failed',
                currentToolCall,
                userInput
              );
              throw error;
            },
          },
          this.config.provider,
          this.config.abortController.signal
        );

        // Add assistant response to history
        if (response.trim()) {
          this.config.conversationHistory.push({
            role: MessageRole.assistant,
            content: response,
          });
        }

        // Add tool results to history
        if (toolCallResults.length > 0) {
          this.config.conversationHistory.push(...toolCallResults);
        }

        console.log('\n');
        break;
      } catch (error) {
        attempt++;
        const errorMessage = this.getErrorMessage(error);
        console.error(
          `❌ Attempt ${attempt}/${this.config.maxRetries} failed:`,
          errorMessage
        );

        await this.recordError(
          'stream_error',
          errorMessage,
          `Processing attempt ${attempt} failed`,
          undefined,
          userInput
        );

        if (attempt >= this.config.maxRetries) {
          console.error(
            '🚫 Max retries reached. Please try a different approach.'
          );
          return;
        }

        console.log(`⏳ Retrying in ${this.config.retryDelayMs}ms...`);
        await this.delay(this.config.retryDelayMs);
      }
    }
  }

  private showHelpMessage(): void {
    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                          📈 Marketing Intelligence Agent Help                 ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║ 🎯 MARKET RESEARCH COMMANDS:                                                 ║
║   • Research [brand/company]     - Comprehensive market analysis            ║
║   • Analyze [brand] vs [competitor] - Competitive comparison               ║
║   • Monitor [brand] news         - Real-time news and sentiment tracking   ║
║   • Trends [industry/topic]      - Industry trend analysis                 ║
║                                                                              ║
║ 📊 EXAMPLE QUERIES:                                                          ║
║   • "Research Tesla's market position in electric vehicles"                ║
║   • "Analyze Netflix vs Disney+ streaming market share"                    ║
║   • "Monitor Apple news and competitor responses this week"                ║
║   • "Trends in artificial intelligence and machine learning"               ║
║   • "Compare pricing strategies of Spotify vs Apple Music"                 ║
║   • "Research customer sentiment for Samsung Galaxy phones"                ║
║                                                                              ║
║ 🔍 ADVANCED RESEARCH:                                                        ║
║   • "Multi-competitor analysis of ride-sharing market"                     ║
║   • "Brand perception analysis for sustainable fashion brands"             ║
║   • "Market entry strategy research for fintech in Europe"                 ║
║   • "Social media sentiment tracking for crypto exchanges"                 ║
║                                                                              ║
║ 🛠️  SYSTEM COMMANDS:                                                         ║
║   • Help                         - Show this help message                  ║
║   • Exit/Quit                    - Close the agent                         ║
║                                                                              ║
║ 💡 TIPS:                                                                     ║
║   - Be specific about your research goals                                   ║
║   - Mention target markets or regions for localized insights               ║
║   - Include timeframes (e.g., "this month", "Q4 2024")                     ║
║   - Ask for actionable recommendations                                      ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);
  }

  async run(): Promise<void> {
    await this.initialize();

    while (true) {
      try {
        const userInput = await new Promise<string>((resolve) => {
          this.rl.question('💬 Your marketing research request: ', resolve);
        });

        if (userInput.trim()) {
          await this.processUserInput(userInput.trim());
        }
      } catch (error) {
        if (this.config.abortController.signal.aborted) {
          break;
        }
        console.error('❌ Error in main loop:', this.getErrorMessage(error));
      }
    }
  }

  shutdown(): void {
    console.log('\n👋 Thanks for using Marketing Intelligence Agent!');
    console.log(
      `📊 Session stats: ${this.config.iterationCount} interactions, ${this.config.totalTokensUsed} tokens used`
    );

    this.config.abortController.abort();
    this.rl.close();
    process.exit(0);
  }
}

// Create and start the agent
const agent = new MarketingAgent();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received interrupt signal...');
  agent.shutdown();
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received terminate signal...');
  agent.shutdown();
});

// Start the agent
agent.run().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
