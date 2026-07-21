import type {
  PathsModelsGetParametersQueryInclude,
  Provider,
  SchemaChatCompletionMessageToolCall,
  SchemaCompletionUsage,
  SchemaCreateChatCompletionRequest,
  SchemaCreateChatCompletionResponse,
  SchemaCreateChatCompletionStreamResponse,
  SchemaCreateMessagesRequest,
  SchemaError,
  SchemaMessagesResponse,
  SchemaMessagesStreamEvent,
  SchemaMessagesToolUseBlock,
  SchemaMessagesUsage,
  SchemaListModelsResponse,
  SchemaListToolsResponse,
  SchemaToolCallExtraContent,
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

export interface MessagesStreamCallbacks {
  onOpen?: () => void;
  onEvent?: (event: SchemaMessagesStreamEvent) => void;
  onContent?: (text: string) => void;
  onThinking?: (thinking: string) => void;
  onTool?: (toolUse: SchemaMessagesToolUseBlock) => void;
  onUsageMetrics?: (usage: SchemaMessagesUsage) => void;
  onFinish?: (message: SchemaMessagesResponse | null) => void;
  onError?: (error: SchemaError) => void;
}

/**
 * Reads an SSE stream line by line and invokes onData for each `data:` payload.
 */
async function readSSEStream(
  body: ReadableStream<Uint8Array>,
  onData: (data: string) => void | Promise<void>,
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
          await onData(line.slice(5).trim());
        }
      }
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // Reader might already be closed, ignore
    }
  }
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
      extra_content?: SchemaToolCallExtraContent;
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
    try {
      await readSSEStream(
        body,
        (data) => this.processSSEData(data),
        abortSignal
      );
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
        extra_content?: SchemaToolCallExtraContent;
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
          extra_content: toolCallChunk.extra_content,
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

        if (toolCallChunk.extra_content) {
          existingToolCall.extra_content = toolCallChunk.extra_content;
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

      const completedToolCall: SchemaChatCompletionMessageToolCall = {
        id: toolCall.id,
        type: toolCall.type,
        function: {
          name: toolCall.function.name,
          arguments: toolCall.function.arguments,
        },
        ...(toolCall.extra_content && {
          extra_content: toolCall.extra_content,
        }),
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

/**
 * Handles streaming for the Anthropic-compatible Messages API.
 * Reassembles streamed tool inputs from `input_json_delta` events.
 */
class MessagesStreamProcessor {
  private callbacks: MessagesStreamCallbacks;
  private message: SchemaMessagesResponse | null = null;
  private pendingToolUse: {
    block: SchemaMessagesToolUseBlock;
    json: string;
  } | null = null;

  constructor(callbacks: MessagesStreamCallbacks) {
    this.callbacks = callbacks;
  }

  async processStream(
    body: ReadableStream<Uint8Array>,
    abortSignal?: AbortSignal
  ): Promise<void> {
    try {
      await readSSEStream(
        body,
        (data) => this.processSSEData(data),
        abortSignal
      );
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
    }
  }

  private processSSEData(data: string): void {
    if (data === '[DONE]') {
      this.callbacks.onFinish?.(this.message);
      return;
    }

    let event: SchemaMessagesStreamEvent;
    try {
      event = JSON.parse(data);
    } catch (parseError) {
      this.callbacks.onError?.({
        error: `Failed to parse SSE data: ${(parseError as Error).message}`,
      });
      return;
    }

    this.callbacks.onEvent?.(event);

    switch (event.type) {
      case 'message_start':
        this.message = event.message ?? null;
        break;
      case 'content_block_start':
        if (event.content_block?.type === 'tool_use') {
          this.pendingToolUse = { block: event.content_block, json: '' };
        }
        break;
      case 'content_block_delta':
        if (event.delta?.text) {
          this.callbacks.onContent?.(event.delta.text);
        }
        if (event.delta?.thinking) {
          this.callbacks.onThinking?.(event.delta.thinking);
        }
        if (event.delta?.partial_json && this.pendingToolUse) {
          this.pendingToolUse.json += event.delta.partial_json;
        }
        break;
      case 'content_block_stop':
        this.finalizePendingToolUse();
        break;
      case 'message_delta':
        if (event.usage) {
          this.callbacks.onUsageMetrics?.(event.usage);
        }
        break;
      case 'message_stop':
        this.callbacks.onFinish?.(this.message);
        break;
      case 'error':
        this.callbacks.onError?.({
          error: event.error?.error?.message || 'Unknown stream error',
        });
        break;
    }
  }

  private finalizePendingToolUse(): void {
    if (!this.pendingToolUse) return;

    const { block, json } = this.pendingToolUse;
    this.pendingToolUse = null;

    try {
      const input = json ? JSON.parse(json) : block.input;
      this.callbacks.onTool?.({ ...block, input });
    } catch {
      globalThis.console.warn(
        `Invalid tool input JSON for ${block.name} (stream was likely interrupted):`,
        json
      );
    }
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
        const error: { error?: string | { message?: string } } =
          await response.json();
        const message =
          typeof error.error === 'string' ? error.error : error.error?.message;
        throw new Error(message || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    } finally {
      globalThis.clearTimeout(timeoutId);
    }
  }

  /**
   * Lists the currently available models.
   */
  async listModels(
    provider?: Provider,
    include?: PathsModelsGetParametersQueryInclude[]
  ): Promise<SchemaListModelsResponse> {
    const query: Record<string, string> = {};
    if (provider) {
      query.provider = provider;
    }
    if (include?.length) {
      query.include = include.join(',');
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
        '/chat/completions',
        {
          ...request,
          stream: true,
          stream_options: {
            include_usage: true,
          },
        },
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
   * Creates a message via the Anthropic-compatible Messages API.
   * Not every provider implements the Messages API; unsupported providers
   * return an error suggesting `/chat/completions` instead.
   */
  async createMessage(
    request: Omit<SchemaCreateMessagesRequest, 'stream'>,
    provider?: Provider
  ): Promise<SchemaMessagesResponse> {
    const query: Record<string, string> = {};
    if (provider) {
      query.provider = provider;
    }
    return this.request<SchemaMessagesResponse>(
      '/messages',
      {
        method: 'POST',
        body: JSON.stringify({ ...request, stream: false }),
      },
      query
    );
  }

  /**
   * Creates a streaming message via the Anthropic-compatible Messages API.
   * This method always sets stream=true internally, so there's no need to
   * specify it in the request.
   *
   * @param request - Messages request (must include model, max_tokens and messages)
   * @param callbacks - Callbacks for handling streaming events
   * @param provider - Optional provider to use for this request
   * @param abortSignal - Optional AbortSignal to cancel the request
   */
  async streamMessage(
    request: Omit<SchemaCreateMessagesRequest, 'stream'>,
    callbacks: MessagesStreamCallbacks,
    provider?: Provider,
    abortSignal?: AbortSignal
  ): Promise<void> {
    try {
      const response = await this.initiateStreamingRequest(
        '/messages',
        { ...request, stream: true },
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

      const streamProcessor = new MessagesStreamProcessor(callbacks);
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
   * Initiates a streaming request to an SSE endpoint
   */
  private async initiateStreamingRequest(
    path: string,
    body: Record<string, unknown>,
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
    const url = `${this.baseURL}${path}${queryString ? `?${queryString}` : ''}`;

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
        body: JSON.stringify(body),
        signal: combinedSignal,
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const error: { error?: string | { message?: string } } =
            await response.json();
          const message =
            typeof error.error === 'string'
              ? error.error
              : error.error?.message;
          errorMessage = message || errorMessage;
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
