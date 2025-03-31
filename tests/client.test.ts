import { InferenceGatewayClient } from '@/client';
import {
  ChatCompletionResponse,
  ListModelsResponse,
  MessageRole,
  Provider,
} from '@/types';
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
      const mockResponse: ListModelsResponse = {
        object: 'list',
        data: [
          {
            id: 'gpt-4o',
            object: 'model',
            created: 1686935002,
            owned_by: 'openai',
          },
          {
            id: 'llama-3.3-70b-versatile',
            object: 'model',
            created: 1723651281,
            owned_by: 'groq',
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
      const mockResponse: ListModelsResponse = {
        object: 'list',
        data: [
          {
            id: 'gpt-4o',
            object: 'model',
            created: 1686935002,
            owned_by: 'openai',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.listModels(Provider.OpenAI);
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/v1/models?provider=openai',
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

      await expect(client.listModels(Provider.OpenAI)).rejects.toThrow(
        errorMessage
      );
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

      const mockResponse: ChatCompletionResponse = {
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
            finish_reason: 'stop',
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
          body: JSON.stringify(mockRequest),
        })
      );
    });

    it('should create a chat completion with a specific provider', async () => {
      const mockRequest = {
        model: 'claude-3-opus-20240229',
        messages: [{ role: MessageRole.User, content: 'Hello' }],
      };

      const mockResponse: ChatCompletionResponse = {
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
            finish_reason: 'stop',
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
        Provider.Anthropic
      );
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/v1/chat/completions?provider=anthropic',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockRequest),
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

      // Simulate SSE events
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
            type: 'function' as const,
            function: {
              name: 'get_weather',
              parameters: {
                type: 'object',
                properties: {
                  location: {
                    type: 'string',
                    description: 'The city and state, e.g. San Francisco, CA',
                  },
                },
                required: ['location'],
              },
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
      expect(callbacks.onTool).toHaveBeenCalledTimes(4); // Called for each chunk with tool_calls
      expect(callbacks.onFinish).toHaveBeenCalledTimes(1);
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
  });

  describe('proxy', () => {
    it('should proxy requests to a specific provider', async () => {
      const mockResponse = { result: 'success' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.proxy(Provider.OpenAI, 'embeddings', {
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

  describe('withOptions', () => {
    it('should create a new client with merged options', () => {
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

      // We can't directly test private properties, but we can test behavior
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      newClient.listModels();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/v1/models',
        expect.objectContaining({
          headers: expect.any(Headers),
        })
      );
    });
  });
});
