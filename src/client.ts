import type {
  Provider,
  SchemaChatCompletionMessageToolCall,
  SchemaCompletionUsage,
  SchemaCreateChatCompletionRequest,
  SchemaCreateChatCompletionResponse,
  SchemaCreateChatCompletionStreamResponse,
  SchemaError,
  SchemaListModelsResponse,
} from './types/generated';
import { ChatCompletionToolType } from './types/generated';

interface ChatCompletionStreamCallbacks {
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
    this.timeout = options.timeout || 30000;
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
   * Creates a chat completion.
   */
  async createChatCompletion(
    request: SchemaCreateChatCompletionRequest,
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
        body: JSON.stringify(request),
      },
      query
    );
  }

  /**
   * Creates a streaming chat completion.
   */
  async streamChatCompletion(
    request: SchemaCreateChatCompletionRequest,
    callbacks: ChatCompletionStreamCallbacks,
    provider?: Provider
  ): Promise<void> {
    const query: Record<string, string> = {};
    if (provider) {
      query.provider = provider;
    }

    const queryParams = new URLSearchParams({
      ...this.defaultQuery,
      ...query,
    });

    const queryString = queryParams.toString();
    const url = `${this.baseURL}/chat/completions${queryString ? `?${queryString}` : ''}`;

    const headers = new Headers({
      'Content-Type': 'application/json',
      ...this.defaultHeaders,
    });

    if (this.apiKey) {
      headers.set('Authorization', `Bearer ${this.apiKey}`);
    }

    const controller = new AbortController();
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
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const error: SchemaError = await response.json();
        throw new Error(
          error.error || `HTTP error! status: ${response.status}`
        );
      }

      if (!response.body) {
        throw new Error('Response body is not readable');
      }

      callbacks.onOpen?.();

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const incompleteToolCalls = new Map<
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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(5).trim();

            if (data === '[DONE]') {
              for (const [, toolCall] of incompleteToolCalls.entries()) {
                callbacks.onTool?.({
                  id: toolCall.id,
                  type: toolCall.type,
                  function: {
                    name: toolCall.function.name,
                    arguments: toolCall.function.arguments,
                  },
                });
              }
              callbacks.onFinish?.(null);
              return;
            }

            try {
              const chunk: SchemaCreateChatCompletionStreamResponse =
                JSON.parse(data);
              callbacks.onChunk?.(chunk);

              if (chunk.usage && callbacks.onUsageMetrics) {
                callbacks.onUsageMetrics(chunk.usage);
              }

              const reasoning_content =
                chunk.choices[0]?.delta?.reasoning_content;
              if (reasoning_content !== undefined) {
                callbacks.onReasoning?.(reasoning_content);
              }

              const content = chunk.choices[0]?.delta?.content;
              if (content) {
                callbacks.onContent?.(content);
              }

              const toolCalls = chunk.choices[0]?.delta?.tool_calls;
              if (toolCalls && toolCalls.length > 0) {
                for (const toolCallChunk of toolCalls) {
                  const index = toolCallChunk.index;

                  if (!incompleteToolCalls.has(index)) {
                    incompleteToolCalls.set(index, {
                      id: toolCallChunk.id || '',
                      type: ChatCompletionToolType.function,
                      function: {
                        name: toolCallChunk.function?.name || '',
                        arguments: toolCallChunk.function?.arguments || '',
                      },
                    });
                  } else {
                    const existingToolCall = incompleteToolCalls.get(index)!;

                    if (toolCallChunk.id) {
                      existingToolCall.id = toolCallChunk.id;
                    }

                    if (toolCallChunk.function?.name) {
                      existingToolCall.function.name =
                        toolCallChunk.function.name;
                    }

                    if (toolCallChunk.function?.arguments) {
                      existingToolCall.function.arguments +=
                        toolCallChunk.function.arguments;
                    }
                  }
                }
              }

              const finishReason = chunk.choices[0]?.finish_reason;
              if (
                finishReason === 'tool_calls' &&
                incompleteToolCalls.size > 0
              ) {
                for (const [, toolCall] of incompleteToolCalls.entries()) {
                  callbacks.onTool?.({
                    id: toolCall.id,
                    type: toolCall.type,
                    function: {
                      name: toolCall.function.name,
                      arguments: toolCall.function.arguments,
                    },
                  });
                }
                incompleteToolCalls.clear();
              }
            } catch (e) {
              globalThis.console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      const apiError: SchemaError = {
        error: (error as Error).message || 'Unknown error',
      };
      callbacks.onError?.(apiError);
      throw error;
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
