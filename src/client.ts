import type {
  Provider,
  SchemaChatCompletionMessageToolCall,
  SchemaCompletionUsage,
  SchemaCreateChatCompletionRequest,
  SchemaCreateChatCompletionResponse,
  SchemaCreateChatCompletionStreamResponse,
  SchemaError,
  SchemaListModelsResponse,
  SchemaListToolsResponse,
} from './types/generated';
import { ChatCompletionToolType } from './types/generated';

export interface ChatCompletionStreamCallbacks {
  onOpen?: () => void;
  onChunk?: (chunk: SchemaCreateChatCompletionStreamResponse) => void;
  onReasoning?: (reasoningContent: string) => void;
  onContent?: (content: string) => void;
  onTool?: (toolCall: SchemaChatCompletionMessageToolCall) => void;
  onUsageMetrics?: (usage: SchemaCompletionUsage) => void;
  onFinish?: (
    response: SchemaCreateChatCompletionStreamResponse | null
  ) => void;
  onError?: (error: SchemaError) => void;
  onMCPTool?: (toolCall: SchemaChatCompletionMessageToolCall) => void;
}

/**
 * Handles streaming response processing with enhanced support for MCP and tool calls
 */
class StreamProcessor {
  private callbacks: ChatCompletionStreamCallbacks;
  private clientProvidedTools: Set<string>;
  private incompleteToolCalls = new Map<
    number,
    {
      id: string;
      type: ChatCompletionToolType;
      function: {
        name: string;
        arguments: string;
      };
    }
  >();

  constructor(
    callbacks: ChatCompletionStreamCallbacks,
    clientProvidedTools: Set<string>
  ) {
    this.callbacks = callbacks;
    this.clientProvidedTools = clientProvidedTools;
  }

  async processStream(
    body: ReadableStream<Uint8Array>,
    abortSignal?: AbortSignal
  ): Promise<void> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        if (abortSignal?.aborted) {
          throw new Error('Stream processing was aborted');
        }

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(5).trim();
            await this.processSSEData(data);
          }
        }
      }
    } catch (error) {
      if (abortSignal?.aborted || (error as Error).name === 'AbortError') {
        console.log('Stream processing was cancelled');
        return;
      }

      const apiError: SchemaError = {
        error: (error as Error).message || 'Unknown error',
      };
      this.callbacks.onError?.(apiError);
      throw error;
    } finally {
      try {
        reader.releaseLock();
      } catch {
        // Reader might already be closed, ignore
      }
    }
  }

  private async processSSEData(data: string): Promise<void> {
    if (data === '[DONE]') {
      this.finalizeIncompleteToolCalls();
      this.callbacks.onFinish?.(null);
      return;
    }

    try {
      const chunk: StreamChunkWithError = JSON.parse(data);

      // Handle mid-stream errors from the Inference Gateway
      // When providers fail during streaming, the gateway embeds error info in the stream
      if ('error' in chunk && chunk.error) {
        const apiError: SchemaError = {
          error:
            typeof chunk.error === 'string'
              ? chunk.error
              : JSON.stringify(chunk.error),
        };
        this.callbacks.onError?.(apiError);
        return;
      }

      const validChunk = chunk as SchemaCreateChatCompletionStreamResponse;
      this.callbacks.onChunk?.(validChunk);

      if (validChunk.usage && this.callbacks.onUsageMetrics) {
        this.callbacks.onUsageMetrics(validChunk.usage);
      }

      const choice = validChunk.choices?.[0];
      if (!choice) return;

      this.handleReasoningContent(choice);

      const content = choice.delta?.content;
      if (content) {
        this.callbacks.onContent?.(content);
      }

      this.handleToolCalls(choice);

      this.handleFinishReason(choice);
    } catch (parseError) {
      let errorMessage = `Failed to parse SSE data: ${(parseError as Error).message}`;

      const errorMatch = data.match(/"error":\s*"([^"]+)"/);
      if (errorMatch) {
        errorMessage = errorMatch[1];
      } else {
        const nestedErrorMatch = data.match(/"message":\s*"([^"]+)"/);
        if (nestedErrorMatch) {
          errorMessage = nestedErrorMatch[1];
        }
      }

      const apiError: SchemaError = {
        error: errorMessage,
      };
      this.callbacks.onError?.(apiError);
    }
  }

  private handleReasoningContent(choice: {
    delta?: { reasoning_content?: string; reasoning?: string };
  }): void {
    const reasoningContent = choice.delta?.reasoning_content;
    if (reasoningContent !== undefined) {
      this.callbacks.onReasoning?.(reasoningContent);
    }

    const reasoning = choice.delta?.reasoning;
    if (reasoning !== undefined) {
      this.callbacks.onReasoning?.(reasoning);
    }
  }

  private handleToolCalls(choice: {
    delta?: {
      tool_calls?: Array<{
        index: number;
        id?: string;
        function?: { name?: string; arguments?: string };
      }>;
    };
  }): void {
    const toolCalls = choice.delta?.tool_calls;
    if (!toolCalls || toolCalls.length === 0) return;

    for (const toolCallChunk of toolCalls) {
      const index = toolCallChunk.index;

      if (!this.incompleteToolCalls.has(index)) {
        this.incompleteToolCalls.set(index, {
          id: toolCallChunk.id || '',
          type: ChatCompletionToolType.function,
          function: {
            name: toolCallChunk.function?.name || '',
            arguments: toolCallChunk.function?.arguments || '',
          },
        });
      } else {
        const existingToolCall = this.incompleteToolCalls.get(index)!;

        if (toolCallChunk.id) {
          existingToolCall.id = toolCallChunk.id;
        }

        if (toolCallChunk.function?.name) {
          existingToolCall.function.name = toolCallChunk.function.name;
        }

        if (toolCallChunk.function?.arguments) {
          existingToolCall.function.arguments +=
            toolCallChunk.function.arguments;
        }
      }
    }
  }

  private handleFinishReason(choice: { finish_reason?: string }): void {
    const finishReason = choice.finish_reason;
    if (finishReason === 'tool_calls' && this.incompleteToolCalls.size > 0) {
      this.finalizeIncompleteToolCalls();
    }
  }

  private finalizeIncompleteToolCalls(): void {
    this.incompleteToolCalls.forEach((toolCall) => {
      if (!toolCall.id || !toolCall.function.name) {
        globalThis.console.warn('Incomplete tool call detected:', toolCall);
        return;
      }

      const completedToolCall = {
        id: toolCall.id,
        type: toolCall.type,
        function: {
          name: toolCall.function.name,
          arguments: toolCall.function.arguments,
        },
      };

      if (this.isMCPTool(toolCall.function.name)) {
        try {
          if (toolCall.function.arguments) {
            JSON.parse(toolCall.function.arguments);
          }
          this.callbacks.onMCPTool?.(completedToolCall);
        } catch (argError) {
          const isIncompleteJSON =
            toolCall.function.arguments &&
            !toolCall.function.arguments.trim().endsWith('}');

          if (isIncompleteJSON) {
            globalThis.console.warn(
              `Incomplete MCP tool arguments for ${toolCall.function.name} (stream was likely interrupted):`,
              toolCall.function.arguments
            );
          } else {
            globalThis.console.warn(
              `Invalid MCP tool arguments for ${toolCall.function.name}:`,
              argError
            );
          }
        }
      } else {
        this.callbacks.onTool?.(completedToolCall);
      }
    });
    this.incompleteToolCalls.clear();
  }

  private isMCPTool(toolName: string): boolean {
    if (!toolName || typeof toolName !== 'string') {
      return false;
    }

    return !this.clientProvidedTools.has(toolName);
  }
}

export interface ClientOptions {
  baseURL?: string;
  apiKey?: string;
  defaultHeaders?: Record<string, string>;
  defaultQuery?: Record<string, string>;
  timeout?: number;
  fetch?: typeof globalThis.fetch;
}

export class InferenceGatewayClient {
  private baseURL: string;
  private apiKey?: string;
  private defaultHeaders: Record<string, string>;
  private defaultQuery: Record<string, string>;
  private timeout: number;
  private fetchFn: typeof globalThis.fetch;

  constructor(options: ClientOptions = {}) {
    this.baseURL = options.baseURL || 'http://localhost:8080/v1';
    this.apiKey = options.apiKey;
    this.defaultHeaders = options.defaultHeaders || {};
    this.defaultQuery = options.defaultQuery || {};
    this.timeout = options.timeout || 60000; // Increased default timeout to 60 seconds
    this.fetchFn = options.fetch || globalThis.fetch;
  }

  /**
   * Creates a new instance of the client with the given options merged with the existing options.
   */
  withOptions(options: ClientOptions): InferenceGatewayClient {
    return new InferenceGatewayClient({
      baseURL: options.baseURL || this.baseURL,
      apiKey: options.apiKey || this.apiKey,
      defaultHeaders: { ...this.defaultHeaders, ...options.defaultHeaders },
      defaultQuery: { ...this.defaultQuery, ...options.defaultQuery },
      timeout: options.timeout || this.timeout,
      fetch: options.fetch || this.fetchFn,
    });
  }

  /**
   * Makes a request to the API.
   */
  private async request<T>(
    path: string,
    options: RequestInit = {},
    query: Record<string, string> = {}
  ): Promise<T> {
    const headers = new Headers({
      'Content-Type': 'application/json',
      ...this.defaultHeaders,
      ...(options.headers as Record<string, string>),
    });

    if (this.apiKey) {
      headers.set('Authorization', `Bearer ${this.apiKey}`);
    }

    // Combine default query parameters with provided ones
    const queryParams = new URLSearchParams({
      ...this.defaultQuery,
      ...query,
    });

    const queryString = queryParams.toString();
    const url = `${this.baseURL}${path}${queryString ? `?${queryString}` : ''}`;

    const controller = new AbortController();
    const timeoutId = globalThis.setTimeout(
      () => controller.abort(),
      this.timeout
    );

    try {
      const response = await this.fetchFn(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        const error: SchemaError = await response.json();
        throw new Error(
          error.error || `HTTP error! status: ${response.status}`
        );
      }

      return response.json();
    } finally {
      globalThis.clearTimeout(timeoutId);
    }
  }

  /**
   * Lists the currently available models.
   */
  async listModels(provider?: Provider): Promise<SchemaListModelsResponse> {
    const query: Record<string, string> = {};
    if (provider) {
      query.provider = provider;
    }
    return this.request<SchemaListModelsResponse>(
      '/models',
      { method: 'GET' },
      query
    );
  }

  /**
   * Lists the currently available MCP tools.
   * Only accessible when EXPOSE_MCP is enabled.
   */
  async listTools(): Promise<SchemaListToolsResponse> {
    return this.request<SchemaListToolsResponse>('/mcp/tools', {
      method: 'GET',
    });
  }

  /**
   * Creates a chat completion.
   */
  async createChatCompletion(
    request: Omit<SchemaCreateChatCompletionRequest, 'stream'>,
    provider?: Provider
  ): Promise<SchemaCreateChatCompletionResponse> {
    const query: Record<string, string> = {};
    if (provider) {
      query.provider = provider;
    }
    return this.request<SchemaCreateChatCompletionResponse>(
      '/chat/completions',
      {
        method: 'POST',
        body: JSON.stringify({ ...request, stream: false }),
      },
      query
    );
  }

  /**
   * Creates a streaming chat completion.
   * This method always sets stream=true internally, so there's no need to specify it in the request.
   *
   * @param request - Chat completion request (must include at least model and messages)
   * @param callbacks - Callbacks for handling streaming events
   * @param provider - Optional provider to use for this request
   * @param abortSignal - Optional AbortSignal to cancel the request
   */
  async streamChatCompletion(
    request: Omit<
      SchemaCreateChatCompletionRequest,
      'stream' | 'stream_options'
    >,
    callbacks: ChatCompletionStreamCallbacks,
    provider?: Provider,
    abortSignal?: AbortSignal
  ): Promise<void> {
    try {
      const response = await this.initiateStreamingRequest(
        request,
        provider,
        abortSignal
      );

      if (!response.body) {
        const error: SchemaError = {
          error: 'Response body is not readable',
        };
        callbacks.onError?.(error);
        throw new Error('Response body is not readable');
      }

      callbacks.onOpen?.();

      // Extract tool names from client-provided tools
      const clientProvidedTools = new Set<string>();
      if (request.tools) {
        for (const tool of request.tools) {
          if (tool.type === 'function' && tool.function?.name) {
            clientProvidedTools.add(tool.function.name);
          }
        }
      }

      const streamProcessor = new StreamProcessor(
        callbacks,
        clientProvidedTools
      );
      await streamProcessor.processStream(response.body, abortSignal);
    } catch (error) {
      const apiError: SchemaError = {
        error: (error as Error).message || 'Unknown error occurred',
      };
      callbacks.onError?.(apiError);
      throw error;
    }
  }

  /**
   * Initiates a streaming request to the chat completions endpoint
   */
  private async initiateStreamingRequest(
    request: Omit<
      SchemaCreateChatCompletionRequest,
      'stream' | 'stream_options'
    >,
    provider?: Provider,
    abortSignal?: AbortSignal
  ): Promise<Response> {
    const query: Record<string, string> = {};
    if (provider) {
      query.provider = provider;
    }

    const queryParams = new URLSearchParams({
      ...this.defaultQuery,
      ...query,
    });

    const queryString = queryParams.toString();
    const url = `${this.baseURL}/chat/completions${
      queryString ? `?${queryString}` : ''
    }`;

    const headers = new Headers({
      'Content-Type': 'application/json',
      ...this.defaultHeaders,
    });

    if (this.apiKey) {
      headers.set('Authorization', `Bearer ${this.apiKey}`);
    }

    const controller = new AbortController();

    const combinedSignal = abortSignal
      ? AbortSignal.any([abortSignal, controller.signal])
      : controller.signal;

    const timeoutId = globalThis.setTimeout(
      () => controller.abort(),
      this.timeout
    );

    try {
      const response = await this.fetchFn(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...request,
          stream: true,
          stream_options: {
            include_usage: true,
          },
        }),
        signal: combinedSignal,
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const error: SchemaError = await response.json();
          errorMessage = error.error || errorMessage;
        } catch {
          // Failed to parse error response as JSON, use status message
        }
        throw new Error(errorMessage);
      }

      return response;
    } finally {
      globalThis.clearTimeout(timeoutId);
    }
  }

  /**
   * Proxy a request to a specific provider.
   */
  async proxy<T = unknown>(
    provider: Provider,
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    return this.request<T>(`/proxy/${provider}/${path}`, options);
  }

  /**
   * Health check endpoint.
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.fetchFn(`${this.baseURL.replace('/v1', '')}/health`);
      return true;
    } catch {
      return false;
    }
  }
}

// Add type definition for stream chunks that may contain errors
type StreamChunkWithError = SchemaCreateChatCompletionStreamResponse & {
  error?: string | object;
};
