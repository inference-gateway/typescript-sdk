import { InferenceGatewayClient } from '@/client';
import type {
  SchemaCreateChatCompletionResponse,
  SchemaListModelsResponse,
  SchemaListToolsResponse,
} from '@/types/generated';
import {
  ChatCompletionChoiceFinish_reason,
  ChatCompletionToolType,
  MessageRole,
  Provider,
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
          { role: MessageRole.system, content: 'You are a helpful assistant' },
          { role: MessageRole.user, content: 'Hello' },
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
              role: MessageRole.assistant,
              content: 'Hello! How can I help you today?',
            },
            finish_reason: ChatCompletionChoiceFinish_reason.stop,
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

    it('should create a chat completion with a specific provider', async () => {
      const mockRequest = {
        model: 'claude-3-opus-20240229',
        messages: [{ role: MessageRole.user, content: 'Hello' }],
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
              role: MessageRole.assistant,
              content: 'Hello! How can I assist you today?',
            },
            finish_reason: ChatCompletionChoiceFinish_reason.stop,
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
        messages: [{ role: MessageRole.user, content: 'Hello' }],
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
        messages: [{ role: MessageRole.user, content: 'Hello' }],
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
            role: MessageRole.user,
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

    it('should handle errors in streaming chat completions', async () => {
      const mockRequest = {
        model: 'gpt-4o',
        messages: [{ role: MessageRole.user, content: 'Hello' }],
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
        messages: [{ role: MessageRole.user, content: 'Hello' }],
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
        messages: [{ role: MessageRole.user, content: 'Hello' }],
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
        model: 'deepseek/deepseek-reasoner',
        messages: [{ role: MessageRole.user, content: 'Hello' }],
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
          'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"deepseek/deepseek-reasoner","choices":[{"index":0,"delta":{"role":"assistant"},"finish_reason":null}]}\n\n' +
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"deepseek/deepseek-reasoner","choices":[{"index":0,"delta":{"content":"","reasoning_content":"This"},"finish_reason":null}]}\n\n' +
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"deepseek/deepseek-reasoner","choices":[{"index":0,"delta":{"content":"","reasoning_content":" is"},"finish_reason":null}]}\n\n' +
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"deepseek/deepseek-reasoner","choices":[{"index":0,"delta":{"content":"","reasoning_content":" a"},"finish_reason":"stop"}]}\n\n' +
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"deepseek/deepseek-reasoner","choices":[{"index":0,"delta":{"content":"","reasoning_content":" reasoning"},"finish_reason":"stop"}]}\n\n' +
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"deepseek/deepseek-reasoner","choices":[{"index":0,"delta":{"content":"","reasoning_content":" content"},"finish_reason":"stop"}]}\n\n' +
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"deepseek/deepseek-reasoner","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}\n\n' +
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"deepseek/deepseek-reasoner","choices":[{"index":0,"delta":{"content":"!"},"finish_reason":null}]}\n\n' +
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
        messages: [{ role: MessageRole.user, content: 'Hello' }],
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
