import { InferenceGatewayClient } from '@/client';
import type {
  SchemaCreateChatCompletionRequest,
  SchemaCreateChatCompletionResponse,
  SchemaListModelsResponse,
  SchemaListToolsResponse,
} from '@/types/generated';
import {
  ChatCompletionToolChoiceOptionOneOf0,
  ChatCompletionToolType,
  ContextWindowSource,
  CreateChatCompletionRequestReasoning_effort,
  FinishReason,
  MessageRole,
  MessagesMessageRole,
  PathsModelsGetParametersQueryInclude,
  PricingSource,
  Provider,
  ResponseFormatJsonSchemaType,
} from '@/types/generated';
import { TransformStream } from 'node:stream/web';
import { TextEncoder } from 'node:util';

describe('InferenceGatewayClient', () => {
  let client: InferenceGatewayClient;
  const mockFetch = jest.fn();

  beforeEach(() => {
    client = new InferenceGatewayClient({
      baseURL: 'http://localhost:8080/v1',
      fetch: mockFetch,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listModels', () => {
    it('should fetch available models', async () => {
      const mockResponse: SchemaListModelsResponse = {
        object: 'list',
        data: [
          {
            id: 'gpt-4o',
            object: 'model',
            created: 1686935002,
            owned_by: 'openai',
            served_by: Provider.openai,
          },
          {
            id: 'llama-3.3-70b-versatile',
            object: 'model',
            created: 1723651281,
            owned_by: 'groq',
            served_by: Provider.groq,
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.listModels();
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/v1/models',
        expect.objectContaining({
          method: 'GET',
          headers: expect.any(Headers),
        })
      );
    });

    it('should fetch models for a specific provider', async () => {
      const mockResponse: SchemaListModelsResponse = {
        object: 'list',
        data: [
          {
            id: 'gpt-4o',
            object: 'model',
            created: 1686935002,
            owned_by: 'openai',
            served_by: Provider.openai,
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.listModels(Provider.openai);
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/v1/models?provider=openai',
        expect.objectContaining({
          method: 'GET',
          headers: expect.any(Headers),
        })
      );
    });

    it('should fetch models with include metadata', async () => {
      const mockResponse: SchemaListModelsResponse = {
        object: 'list',
        data: [
          {
            id: 'gpt-4o',
            object: 'model',
            created: 1686935002,
            owned_by: 'openai',
            served_by: Provider.openai,
            context_window: {
              tokens: 128000,
              source: ContextWindowSource.ContextWindowSourceProvider,
            },
            pricing: {
              currency: 'USD',
              input_per_token: '0.0000025',
              output_per_token: '0.00001',
              source: PricingSource.PricingSourceProvider,
              updated_at: '2025-01-01T00:00:00Z',
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.listModels(Provider.openai, [
        PathsModelsGetParametersQueryInclude.context_window,
        PathsModelsGetParametersQueryInclude.pricing,
      ]);
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/v1/models?provider=openai&include=context_window%2Cpricing',
        expect.objectContaining({
          method: 'GET',
          headers: expect.any(Headers),
        })
      );
    });

    it('should throw error when request fails', async () => {
      const errorMessage = 'Provider not found';
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: errorMessage }),
      });

      await expect(client.listModels(Provider.openai)).rejects.toThrow(
        errorMessage
      );
    });
  });

  describe('listTools', () => {
    it('should fetch available MCP tools', async () => {
      const mockResponse: SchemaListToolsResponse = {
        object: 'list',
        data: [
          {
            name: 'read_file',
            description: 'Read content from a file',
            server: 'http://mcp-filesystem-server:8083/mcp',
          },
          {
            name: 'write_file',
            description: 'Write content to a file',
            server: 'http://mcp-filesystem-server:8083/mcp',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.listTools();
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/v1/mcp/tools',
        expect.objectContaining({
          method: 'GET',
          headers: expect.any(Headers),
        })
      );
    });

    it('should throw error when MCP is not exposed', async () => {
      const errorMessage = 'MCP not exposed';
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ error: errorMessage }),
      });

      await expect(client.listTools()).rejects.toThrow(errorMessage);
    });

    it('should throw error when unauthorized', async () => {
      const errorMessage = 'Unauthorized';
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: errorMessage }),
      });

      await expect(client.listTools()).rejects.toThrow(errorMessage);
    });
  });

  describe('createChatCompletion', () => {
    it('should create a chat completion', async () => {
      const mockRequest = {
        model: 'gpt-4o',
        messages: [
          { role: MessageRole.System, content: 'You are a helpful assistant' },
          { role: MessageRole.User, content: 'Hello' },
        ],
      };

      const mockResponse: SchemaCreateChatCompletionResponse = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1677652288,
        model: 'gpt-4o',
        choices: [
          {
            index: 0,
            message: {
              role: MessageRole.Assistant,
              content: 'Hello! How can I help you today?',
            },
            finish_reason: FinishReason.Stop,
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 8,
          total_tokens: 18,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.createChatCompletion(mockRequest);
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ ...mockRequest, stream: false }),
        })
      );
    });

    it('should forward the new optional request parameters', async () => {
      const mockRequest: Omit<SchemaCreateChatCompletionRequest, 'stream'> = {
        model: 'gpt-4o',
        messages: [{ role: MessageRole.User, content: 'Hello' }],
        max_completion_tokens: 256,
        temperature: 0.7,
        top_p: 0.9,
        n: 1,
        stop: ['\n\n', 'END'],
        frequency_penalty: 0.5,
        presence_penalty: -0.5,
        seed: 42,
        logprobs: true,
        top_logprobs: 5,
        logit_bias: { '50256': -100 },
        user: 'end-user-123',
        parallel_tool_calls: false,
        reasoning_effort: CreateChatCompletionRequestReasoning_effort.Medium,
        tool_choice: ChatCompletionToolChoiceOptionOneOf0.required,
      };

      const mockResponse: SchemaCreateChatCompletionResponse = {
        id: 'chatcmpl-789',
        object: 'chat.completion',
        created: 1677652288,
        model: 'gpt-4o',
        choices: [
          {
            index: 0,
            message: { role: MessageRole.Assistant, content: 'Hi!' },
            finish_reason: FinishReason.Stop,
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await client.createChatCompletion(mockRequest);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ ...mockRequest, stream: false }),
        })
      );
    });

    it('should support the oneOf unions: response_format, tool_choice, and stop', async () => {
      const mockRequest: Omit<SchemaCreateChatCompletionRequest, 'stream'> = {
        model: 'gpt-4o',
        messages: [{ role: MessageRole.User, content: 'Weather?' }],
        stop: 'STOP',
        response_format: {
          type: ResponseFormatJsonSchemaType.json_schema,
          json_schema: {
            name: 'weather',
            strict: true,
            schema: {
              type: 'object',
              properties: { city: { type: 'string' } },
            },
          },
        },
        tool_choice: {
          type: ChatCompletionToolType.function,
          function: { name: 'get_weather' },
        },
      };

      const mockResponse: SchemaCreateChatCompletionResponse = {
        id: 'chatcmpl-321',
        object: 'chat.completion',
        created: 1677652288,
        model: 'gpt-4o',
        choices: [
          {
            index: 0,
            message: {
              role: MessageRole.Assistant,
              content: '{"city":"NYC"}',
            },
            finish_reason: FinishReason.Stop,
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await client.createChatCompletion(mockRequest);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ ...mockRequest, stream: false }),
        })
      );
    });

    it('should create a chat completion with a specific provider', async () => {
      const mockRequest = {
        model: 'claude-3-opus-20240229',
        messages: [{ role: MessageRole.User, content: 'Hello' }],
      };

      const mockResponse: SchemaCreateChatCompletionResponse = {
        id: 'chatcmpl-456',
        object: 'chat.completion',
        created: 1677652288,
        model: 'claude-3-opus-20240229',
        choices: [
          {
            index: 0,
            message: {
              role: MessageRole.Assistant,
              content: 'Hello! How can I assist you today?',
            },
            finish_reason: FinishReason.Stop,
          },
        ],
        usage: {
          prompt_tokens: 5,
          completion_tokens: 8,
          total_tokens: 13,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.createChatCompletion(
        mockRequest,
        Provider.anthropic
      );
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/v1/chat/completions?provider=anthropic',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ ...mockRequest, stream: false }),
        })
      );
    });
  });

  describe('streamChatCompletion', () => {
    it('should handle streaming chat completions', async () => {
      const mockRequest = {
        model: 'gpt-4o',
        messages: [{ role: MessageRole.User, content: 'Hello' }],
      };

      const mockStream = new TransformStream();
      const writer = mockStream.writable.getWriter();
      const encoder = new TextEncoder();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: mockStream.readable,
      });

      const callbacks = {
        onOpen: jest.fn(),
        onChunk: jest.fn(),
        onContent: jest.fn(),
        onFinish: jest.fn(),
        onError: jest.fn(),
      };

      const streamPromise = client.streamChatCompletion(mockRequest, callbacks);

      await writer.write(
        encoder.encode(
          'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"gpt-4o","choices":[{"index":0,"delta":{"role":"assistant"},"finish_reason":null}]}\n\n' +
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"gpt-4o","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}\n\n' +
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"gpt-4o","choices":[{"index":0,"delta":{"content":"!"},"finish_reason":null}]}\n\n' +
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"gpt-4o","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}\n\n' +
            'data: [DONE]\n\n'
        )
      );

      await writer.close();
      await streamPromise;

      expect(callbacks.onOpen).toHaveBeenCalledTimes(1);
      expect(callbacks.onChunk).toHaveBeenCalledTimes(4);
      expect(callbacks.onContent).toHaveBeenCalledWith('Hello');
      expect(callbacks.onContent).toHaveBeenCalledWith('!');
      expect(callbacks.onFinish).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            ...mockRequest,
            stream: true,
            stream_options: {
              include_usage: true,
            },
          }),
        })
      );
    });

    it('should handle streaming chat completions reasoning and content', async () => {
      const mockRequest = {
        model: 'gpt-4o',
        messages: [{ role: MessageRole.User, content: 'Hello' }],
      };
      const mockStream = new TransformStream();
      const writer = mockStream.writable.getWriter();
      const encoder = new TextEncoder();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: mockStream.readable,
      });
      const callbacks = {
        onOpen: jest.fn(),
        onChunk: jest.fn(),
        onReasoning: jest.fn(),
        onContent: jest.fn(),
        onFinish: jest.fn(),
      };
      const streamPromise = client.streamChatCompletion(mockRequest, callbacks);
      await writer.write(
        encoder.encode(
          'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"gpt-4o","choices":[{"index":0,"delta":{"role":"assistant"},"finish_reason":null}]}\n\n' +
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"gpt-4o","choices":[{"index":0,"delta":{"content":"","reasoning_content":"This"},"finish_reason":null}]}\n\n' +
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"gpt-4o","choices":[{"index":0,"delta":{"content":"","reasoning_content":" is"},"finish_reason":null}]}\n\n' +
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"gpt-4o","choices":[{"index":0,"delta":{"content":"","reasoning_content":" a"},"finish_reason":"stop"}]}\n\n' +
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"gpt-4o","choices":[{"index":0,"delta":{"content":"","reasoning_content":" reasoning"},"finish_reason":"stop"}]}\n\n' +
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"gpt-4o","choices":[{"index":0,"delta":{"content":"","reasoning_content":" content"},"finish_reason":"stop"}]}\n\n' +
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"gpt-4o","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}\n\n' +
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"gpt-4o","choices":[{"index":0,"delta":{"content":"!"},"finish_reason":null}]}\n\n' +
            'data: [DONE]\n\n'
        )
      );
      await writer.close();
      await streamPromise;
      expect(callbacks.onOpen).toHaveBeenCalledTimes(1);
      expect(callbacks.onChunk).toHaveBeenCalledTimes(8);
      expect(callbacks.onReasoning).toHaveBeenCalledTimes(5);
      expect(callbacks.onReasoning).toHaveBeenCalledWith('This');
      expect(callbacks.onReasoning).toHaveBeenCalledWith(' is');
      expect(callbacks.onReasoning).toHaveBeenCalledWith(' a');
      expect(callbacks.onReasoning).toHaveBeenCalledWith(' reasoning');
      expect(callbacks.onReasoning).toHaveBeenCalledWith(' content');
      expect(callbacks.onContent).toHaveBeenCalledTimes(2);
      expect(callbacks.onContent).toHaveBeenCalledWith('Hello');
      expect(callbacks.onContent).toHaveBeenCalledWith('!');
      expect(callbacks.onFinish).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            ...mockRequest,
            stream: true,
            stream_options: {
              include_usage: true,
            },
          }),
        })
      );
    });

    it('should handle tool calls in streaming chat completions', async () => {
      const mockRequest = {
        model: 'gpt-4o',
        messages: [
          {
            role: MessageRole.User,
            content: 'What is the weather in San Francisco?',
          },
        ],
        tools: [
          {
            type: ChatCompletionToolType.function,
            function: {
              name: 'get_weather',
              strict: true,
            },
          },
        ],
      };

      const mockStream = new TransformStream();
      const writer = mockStream.writable.getWriter();
      const encoder = new TextEncoder();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: mockStream.readable,
      });

      const callbacks = {
        onOpen: jest.fn(),
        onChunk: jest.fn(),
        onTool: jest.fn(),
        onFinish: jest.fn(),
      };

      const streamPromise = client.streamChatCompletion(mockRequest, callbacks);

      // Simulate SSE events with tool calls
      await writer.write(
        encoder.encode(
          'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"gpt-4o","choices":[{"index":0,"delta":{"role":"assistant"},"finish_reason":null}]}\n\n' +
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"gpt-4o","choices":[{"index":0,"delta":{"tool_calls":[{"index":0,"id":"call_123","type":"function","function":{"name":"get_weather"}}]},"finish_reason":null}]}\n\n' +
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"gpt-4o","choices":[{"index":0,"delta":{"tool_calls":[{"index":0,"function":{"arguments":"{\\"location\\""}}]},"finish_reason":null}]}\n\n' +
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"gpt-4o","choices":[{"index":0,"delta":{"tool_calls":[{"index":0,"function":{"arguments":":\\"San Francisco, CA\\""}}]},"finish_reason":null}]}\n\n' +
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"gpt-4o","choices":[{"index":0,"delta":{"tool_calls":[{"index":0,"function":{"arguments":"}"}}]},"finish_reason":null}]}\n\n' +
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"gpt-4o","choices":[{"index":0,"delta":{},"finish_reason":"tool_calls"}]}\n\n' +
            'data: [DONE]\n\n'
        )
      );

      await writer.close();
      await streamPromise;

      expect(callbacks.onOpen).toHaveBeenCalledTimes(1);
      expect(callbacks.onChunk).toHaveBeenCalledTimes(6);
      expect(callbacks.onTool).toHaveBeenCalledTimes(1);
      expect(callbacks.onTool).toHaveBeenCalledWith({
        id: 'call_123',
        type: 'function',
        function: {
          name: 'get_weather',
          arguments: '{"location":"San Francisco, CA"}',
        },
      });
      expect(callbacks.onFinish).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            ...mockRequest,
            stream: true,
            stream_options: {
              include_usage: true,
            },
          }),
        })
      );
    });

    it('should preserve extra_content on streamed tool calls', async () => {
      const mockRequest = {
        model: 'gemini-2.5-pro',
        messages: [
          {
            role: MessageRole.User,
            content: 'What is the weather in San Francisco?',
          },
        ],
        tools: [
          {
            type: ChatCompletionToolType.function,
            function: {
              name: 'get_weather',
              strict: true,
            },
          },
        ],
      };

      const mockStream = new TransformStream();
      const writer = mockStream.writable.getWriter();
      const encoder = new TextEncoder();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: mockStream.readable,
      });

      const callbacks = {
        onTool: jest.fn(),
        onFinish: jest.fn(),
      };

      const streamPromise = client.streamChatCompletion(
        mockRequest,
        callbacks,
        Provider.google
      );

      await writer.write(
        encoder.encode(
          'data: {"id":"chatcmpl-1","object":"chat.completion.chunk","created":1,"model":"gemini-2.5-pro","choices":[{"index":0,"delta":{"role":"assistant"},"finish_reason":null}]}\n\n' +
            'data: {"id":"chatcmpl-1","object":"chat.completion.chunk","created":1,"model":"gemini-2.5-pro","choices":[{"index":0,"delta":{"tool_calls":[{"index":0,"id":"call_1","type":"function","function":{"name":"get_weather","arguments":"{\\"location\\":\\"SF\\"}"},"extra_content":{"google":{"thought_signature":"sig-abc-123"}}}]},"finish_reason":null}]}\n\n' +
            'data: {"id":"chatcmpl-1","object":"chat.completion.chunk","created":1,"model":"gemini-2.5-pro","choices":[{"index":0,"delta":{},"finish_reason":"tool_calls"}]}\n\n' +
            'data: [DONE]\n\n'
        )
      );

      await writer.close();
      await streamPromise;

      expect(callbacks.onTool).toHaveBeenCalledTimes(1);
      expect(callbacks.onTool).toHaveBeenCalledWith({
        id: 'call_1',
        type: 'function',
        function: {
          name: 'get_weather',
          arguments: '{"location":"SF"}',
        },
        extra_content: {
          google: { thought_signature: 'sig-abc-123' },
        },
      });
    });

    it('should handle errors in streaming chat completions', async () => {
      const mockRequest = {
        model: 'gpt-4o',
        messages: [{ role: MessageRole.User, content: 'Hello' }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Bad Request' }),
      });

      const callbacks = {
        onError: jest.fn(),
      };

      await expect(
        client.streamChatCompletion(mockRequest, callbacks)
      ).rejects.toThrow('Bad Request');

      expect(callbacks.onError).toHaveBeenCalledTimes(1);
    });

    it('should handle streaming chat completions with usage metrics', async () => {
      const mockRequest = {
        model: 'gpt-4o',
        messages: [{ role: MessageRole.User, content: 'Hello' }],
      };

      const mockStream = new TransformStream();
      const writer = mockStream.writable.getWriter();
      const encoder = new TextEncoder();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: mockStream.readable,
      });

      const callbacks = {
        onOpen: jest.fn(),
        onChunk: jest.fn(),
        onContent: jest.fn(),
        onUsageMetrics: jest.fn(),
        onFinish: jest.fn(),
        onError: jest.fn(),
      };

      const streamPromise = client.streamChatCompletion(mockRequest, callbacks);

      await writer.write(
        encoder.encode(
          'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"gpt-4o","choices":[{"index":0,"delta":{"role":"assistant"},"finish_reason":null}]}\n\n' +
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"gpt-4o","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}\n\n' +
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"gpt-4o","choices":[{"index":0,"delta":{"content":"!"},"finish_reason":null}]}\n\n' +
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"gpt-4o","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}\n\n' +
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"gpt-4o","choices":[],"usage":{"prompt_tokens":10,"completion_tokens":8,"total_tokens":18}}\n\n' +
            'data: [DONE]\n\n'
        )
      );

      await writer.close();
      await streamPromise;

      expect(callbacks.onOpen).toHaveBeenCalledTimes(1);
      expect(callbacks.onChunk).toHaveBeenCalledTimes(5);
      expect(callbacks.onContent).toHaveBeenCalledWith('Hello');
      expect(callbacks.onContent).toHaveBeenCalledWith('!');
      expect(callbacks.onUsageMetrics).toHaveBeenCalledTimes(1);
      expect(callbacks.onUsageMetrics).toHaveBeenCalledWith({
        prompt_tokens: 10,
        completion_tokens: 8,
        total_tokens: 18,
      });
      expect(callbacks.onFinish).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            ...mockRequest,
            stream: true,
            stream_options: {
              include_usage: true,
            },
          }),
        })
      );
    });

    it('should handle streaming chat completions with reasoning field', async () => {
      const mockRequest = {
        model: 'groq/deepseek-distilled-llama-3.1-70b',
        messages: [{ role: MessageRole.User, content: 'Hello' }],
      };
      const mockStream = new TransformStream();
      const writer = mockStream.writable.getWriter();
      const encoder = new TextEncoder();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: mockStream.readable,
      });
      const callbacks = {
        onOpen: jest.fn(),
        onChunk: jest.fn(),
        onReasoning: jest.fn(),
        onContent: jest.fn(),
        onFinish: jest.fn(),
      };
      const streamPromise = client.streamChatCompletion(mockRequest, callbacks);
      await writer.write(
        encoder.encode(
          'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"groq/deepseek-distilled-llama-3.1-70b","choices":[{"index":0,"delta":{"role":"assistant"},"finish_reason":null}]}\n\n' +
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"groq/deepseek-distilled-llama-3.1-70b","choices":[{"index":0,"delta":{"content":"","reasoning":"Let me"},"finish_reason":null}]}\n\n' +
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"groq/deepseek-distilled-llama-3.1-70b","choices":[{"index":0,"delta":{"content":"","reasoning":" think"},"finish_reason":null}]}\n\n' +
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"groq/deepseek-distilled-llama-3.1-70b","choices":[{"index":0,"delta":{"content":"","reasoning":" about"},"finish_reason":"stop"}]}\n\n' +
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"groq/deepseek-distilled-llama-3.1-70b","choices":[{"index":0,"delta":{"content":"","reasoning":" this"},"finish_reason":"stop"}]}\n\n' +
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"groq/deepseek-distilled-llama-3.1-70b","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}\n\n' +
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"groq/deepseek-distilled-llama-3.1-70b","choices":[{"index":0,"delta":{"content":"!"},"finish_reason":null}]}\n\n' +
            'data: [DONE]\n\n'
        )
      );
      await writer.close();
      await streamPromise;
      expect(callbacks.onOpen).toHaveBeenCalledTimes(1);
      expect(callbacks.onChunk).toHaveBeenCalledTimes(7);
      expect(callbacks.onReasoning).toHaveBeenCalledTimes(4);
      expect(callbacks.onReasoning).toHaveBeenCalledWith('Let me');
      expect(callbacks.onReasoning).toHaveBeenCalledWith(' think');
      expect(callbacks.onReasoning).toHaveBeenCalledWith(' about');
      expect(callbacks.onReasoning).toHaveBeenCalledWith(' this');
      expect(callbacks.onContent).toHaveBeenCalledTimes(2);
      expect(callbacks.onContent).toHaveBeenCalledWith('Hello');
      expect(callbacks.onContent).toHaveBeenCalledWith('!');
      expect(callbacks.onFinish).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            ...mockRequest,
            stream: true,
            stream_options: {
              include_usage: true,
            },
          }),
        })
      );
    });

    it('should handle streaming chat completions with reasoning_content (DeepSeek)', async () => {
      const mockRequest = {
        model: 'deepseek/deepseek-v4-pro',
        messages: [{ role: MessageRole.User, content: 'Hello' }],
      };
      const mockStream = new TransformStream();
      const writer = mockStream.writable.getWriter();
      const encoder = new TextEncoder();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: mockStream.readable,
      });
      const callbacks = {
        onOpen: jest.fn(),
        onChunk: jest.fn(),
        onReasoning: jest.fn(),
        onContent: jest.fn(),
        onFinish: jest.fn(),
      };
      const streamPromise = client.streamChatCompletion(mockRequest, callbacks);
      await writer.write(
        encoder.encode(
          'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"deepseek/deepseek-v4-pro","choices":[{"index":0,"delta":{"role":"assistant"},"finish_reason":null}]}\n\n' +
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"deepseek/deepseek-v4-pro","choices":[{"index":0,"delta":{"content":"","reasoning_content":"This"},"finish_reason":null}]}\n\n' +
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"deepseek/deepseek-v4-pro","choices":[{"index":0,"delta":{"content":"","reasoning_content":" is"},"finish_reason":null}]}\n\n' +
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"deepseek/deepseek-v4-pro","choices":[{"index":0,"delta":{"content":"","reasoning_content":" a"},"finish_reason":"stop"}]}\n\n' +
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"deepseek/deepseek-v4-pro","choices":[{"index":0,"delta":{"content":"","reasoning_content":" reasoning"},"finish_reason":"stop"}]}\n\n' +
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"deepseek/deepseek-v4-pro","choices":[{"index":0,"delta":{"content":"","reasoning_content":" content"},"finish_reason":"stop"}]}\n\n' +
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"deepseek/deepseek-v4-pro","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}\n\n' +
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"deepseek/deepseek-v4-pro","choices":[{"index":0,"delta":{"content":"!"},"finish_reason":null}]}\n\n' +
            'data: [DONE]\n\n'
        )
      );
      await writer.close();
      await streamPromise;
      expect(callbacks.onOpen).toHaveBeenCalledTimes(1);
      expect(callbacks.onChunk).toHaveBeenCalledTimes(8);
      expect(callbacks.onReasoning).toHaveBeenCalledTimes(5);
      expect(callbacks.onReasoning).toHaveBeenCalledWith('This');
      expect(callbacks.onReasoning).toHaveBeenCalledWith(' is');
      expect(callbacks.onReasoning).toHaveBeenCalledWith(' a');
      expect(callbacks.onReasoning).toHaveBeenCalledWith(' reasoning');
      expect(callbacks.onReasoning).toHaveBeenCalledWith(' content');
      expect(callbacks.onContent).toHaveBeenCalledTimes(2);
      expect(callbacks.onContent).toHaveBeenCalledWith('Hello');
      expect(callbacks.onContent).toHaveBeenCalledWith('!');
      expect(callbacks.onFinish).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            ...mockRequest,
            stream: true,
            stream_options: {
              include_usage: true,
            },
          }),
        })
      );
    });

    it('should handle streaming chat completions with reasoning field (Groq)', async () => {
      const mockRequest = {
        model: 'llama-3.1-70b-versatile',
        messages: [{ role: MessageRole.User, content: 'Hello' }],
      };
      const mockStream = new TransformStream();
      const writer = mockStream.writable.getWriter();
      const encoder = new TextEncoder();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: mockStream.readable,
      });
      const callbacks = {
        onOpen: jest.fn(),
        onChunk: jest.fn(),
        onReasoning: jest.fn(),
        onContent: jest.fn(),
        onFinish: jest.fn(),
      };
      const streamPromise = client.streamChatCompletion(mockRequest, callbacks);
      await writer.write(
        encoder.encode(
          'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"llama-3.1-70b-versatile","choices":[{"index":0,"delta":{"role":"assistant"},"finish_reason":null}]}\n\n' +
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"llama-3.1-70b-versatile","choices":[{"index":0,"delta":{"content":"","reasoning":"Let me"},"finish_reason":null}]}\n\n' +
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"llama-3.1-70b-versatile","choices":[{"index":0,"delta":{"content":"","reasoning":" think"},"finish_reason":null}]}\n\n' +
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"llama-3.1-70b-versatile","choices":[{"index":0,"delta":{"content":"","reasoning":" about"},"finish_reason":"stop"}]}\n\n' +
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"llama-3.1-70b-versatile","choices":[{"index":0,"delta":{"content":"","reasoning":" this"},"finish_reason":"stop"}]}\n\n' +
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"llama-3.1-70b-versatile","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}\n\n' +
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"llama-3.1-70b-versatile","choices":[{"index":0,"delta":{"content":"!"},"finish_reason":null}]}\n\n' +
            'data: [DONE]\n\n'
        )
      );
      await writer.close();
      await streamPromise;
      expect(callbacks.onOpen).toHaveBeenCalledTimes(1);
      expect(callbacks.onChunk).toHaveBeenCalledTimes(7);
      expect(callbacks.onReasoning).toHaveBeenCalledTimes(4);
      expect(callbacks.onReasoning).toHaveBeenCalledWith('Let me');
      expect(callbacks.onReasoning).toHaveBeenCalledWith(' think');
      expect(callbacks.onReasoning).toHaveBeenCalledWith(' about');
      expect(callbacks.onReasoning).toHaveBeenCalledWith(' this');
      expect(callbacks.onContent).toHaveBeenCalledTimes(2);
      expect(callbacks.onContent).toHaveBeenCalledWith('Hello');
      expect(callbacks.onContent).toHaveBeenCalledWith('!');
      expect(callbacks.onFinish).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            ...mockRequest,
            stream: true,
            stream_options: {
              include_usage: true,
            },
          }),
        })
      );
    });
  });

  describe('proxy', () => {
    it('should proxy requests to a specific provider', async () => {
      const mockResponse = { result: 'success' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.proxy(Provider.openai, 'embeddings', {
        method: 'POST',
        body: JSON.stringify({
          model: 'text-embedding-ada-002',
          input: 'Hello world',
        }),
      });

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/v1/proxy/openai/embeddings',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            model: 'text-embedding-ada-002',
            input: 'Hello world',
          }),
        })
      );
    });
  });

  describe('healthCheck', () => {
    it('should return true when API is healthy', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      const result = await client.healthCheck();
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/health');
    });

    it('should return false when API is unhealthy', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API error'));

      const result = await client.healthCheck();
      expect(result).toBe(false);
    });
  });

  describe('createMessage', () => {
    it('should create a message', async () => {
      const mockRequest = {
        model: 'claude-sonnet-5',
        max_tokens: 1024,
        messages: [
          {
            role: MessagesMessageRole.MessagesMessageRoleUser,
            content: 'Hello',
          },
        ],
      };
      const mockResponse = {
        id: 'msg_123',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'Hello!' }],
        model: 'claude-sonnet-5',
        stop_reason: 'end_turn',
        usage: { input_tokens: 5, output_tokens: 3 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.createMessage(
        mockRequest,
        Provider.anthropic
      );
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/v1/messages?provider=anthropic',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ ...mockRequest, stream: false }),
        })
      );
    });

    it('should surface Anthropic-format errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            type: 'error',
            error: {
              type: 'not_supported_error',
              message:
                'The Messages API is not supported by this provider yet.',
            },
          }),
      });

      await expect(
        client.createMessage({
          model: 'gpt-4o',
          max_tokens: 100,
          messages: [
            {
              role: MessagesMessageRole.MessagesMessageRoleUser,
              content: 'Hi',
            },
          ],
        })
      ).rejects.toThrow(
        'The Messages API is not supported by this provider yet.'
      );
    });
  });

  describe('streamMessage', () => {
    it('should handle streaming messages with text, tool use and usage', async () => {
      const mockRequest = {
        model: 'claude-sonnet-5',
        max_tokens: 1024,
        messages: [
          {
            role: MessagesMessageRole.MessagesMessageRoleUser,
            content: 'Hello',
          },
        ],
      };

      const mockStream = new TransformStream();
      const writer = mockStream.writable.getWriter();
      const encoder = new TextEncoder();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: mockStream.readable,
      });

      const callbacks = {
        onOpen: jest.fn(),
        onEvent: jest.fn(),
        onContent: jest.fn(),
        onThinking: jest.fn(),
        onTool: jest.fn(),
        onUsageMetrics: jest.fn(),
        onFinish: jest.fn(),
        onError: jest.fn(),
      };

      const streamPromise = client.streamMessage(mockRequest, callbacks);

      await writer.write(
        encoder.encode(
          'data: {"type":"message_start","message":{"id":"msg_123","type":"message","role":"assistant","content":[],"model":"claude-sonnet-5","stop_reason":null,"usage":{"input_tokens":5,"output_tokens":0}}}\n\n' +
            'data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}\n\n' +
            'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello"}}\n\n' +
            'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"!"}}\n\n' +
            'data: {"type":"content_block_stop","index":0}\n\n' +
            'data: {"type":"content_block_start","index":1,"content_block":{"type":"tool_use","id":"toolu_1","name":"get_weather","input":{}}}\n\n' +
            'data: {"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":"{\\"location\\":"}}\n\n' +
            'data: {"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":"\\"Paris\\"}"}}\n\n' +
            'data: {"type":"content_block_stop","index":1}\n\n' +
            'data: {"type":"message_delta","delta":{"stop_reason":"tool_use"},"usage":{"input_tokens":5,"output_tokens":12}}\n\n' +
            'data: {"type":"message_stop"}\n\n'
        )
      );

      await writer.close();
      await streamPromise;

      expect(callbacks.onOpen).toHaveBeenCalledTimes(1);
      expect(callbacks.onContent).toHaveBeenCalledWith('Hello');
      expect(callbacks.onContent).toHaveBeenCalledWith('!');
      expect(callbacks.onTool).toHaveBeenCalledWith({
        type: 'tool_use',
        id: 'toolu_1',
        name: 'get_weather',
        input: { location: 'Paris' },
      });
      expect(callbacks.onUsageMetrics).toHaveBeenCalledWith({
        input_tokens: 5,
        output_tokens: 12,
      });
      expect(callbacks.onFinish).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'msg_123' })
      );
      expect(callbacks.onError).not.toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/v1/messages',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ ...mockRequest, stream: true }),
        })
      );
    });

    it('should route mid-stream error events to onError', async () => {
      const mockStream = new TransformStream();
      const writer = mockStream.writable.getWriter();
      const encoder = new TextEncoder();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: mockStream.readable,
      });

      const callbacks = {
        onContent: jest.fn(),
        onError: jest.fn(),
      };

      const streamPromise = client.streamMessage(
        {
          model: 'claude-sonnet-5',
          max_tokens: 100,
          messages: [
            {
              role: MessagesMessageRole.MessagesMessageRoleUser,
              content: 'Hi',
            },
          ],
        },
        callbacks
      );

      await writer.write(
        encoder.encode(
          'data: {"type":"error","error":{"type":"error","error":{"type":"overloaded_error","message":"Overloaded"}}}\n\n'
        )
      );

      await writer.close();
      await streamPromise;

      expect(callbacks.onError).toHaveBeenCalledWith({ error: 'Overloaded' });
    });
  });

  describe('withOptions', () => {
    it('should create a new client with merged options', async () => {
      const originalClient = new InferenceGatewayClient({
        baseURL: 'http://localhost:8080/v1',
        apiKey: 'test-key',
        fetch: mockFetch,
      });

      const newClient = originalClient.withOptions({
        defaultHeaders: { 'X-Custom-Header': 'value' },
      });

      expect(newClient).toBeInstanceOf(InferenceGatewayClient);
      expect(newClient).not.toBe(originalClient);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await newClient.listModels();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/v1/models',
        expect.objectContaining({
          headers: expect.any(Headers),
        })
      );
    });
  });
});
