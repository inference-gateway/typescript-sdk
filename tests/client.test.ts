import { InferenceGatewayClient } from '@/client';
import {
  GenerateContentResponse,
  MessageRole,
  Provider,
  ProviderModels,
} from '@/types';

describe('InferenceGatewayClient', () => {
  let client: InferenceGatewayClient;
  const mockBaseUrl = 'http://localhost:8080';

  beforeEach(() => {
    client = new InferenceGatewayClient(mockBaseUrl);
    global.fetch = jest.fn();
  });

  describe('listModels', () => {
    it('should fetch available models', async () => {
      const mockResponse: ProviderModels[] = [
        {
          provider: Provider.Ollama,
          models: [
            {
              name: 'llama2',
            },
          ],
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.listModels();
      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/llms`,
        expect.objectContaining({
          headers: expect.any(Headers),
        })
      );
    });
  });

  describe('listModelsByProvider', () => {
    it('should fetch models for a specific provider', async () => {
      const mockResponse: ProviderModels = {
        provider: Provider.OpenAI,
        models: [
          {
            name: 'gpt-4',
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.listModelsByProvider(Provider.OpenAI);
      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/llms/${Provider.OpenAI}`,
        expect.objectContaining({
          headers: expect.any(Headers),
        })
      );
    });

    it('should throw error when provider request fails', async () => {
      const errorMessage = 'Provider not found';
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: errorMessage }),
      });

      await expect(
        client.listModelsByProvider(Provider.OpenAI)
      ).rejects.toThrow(errorMessage);
    });
  });

  describe('generateContent', () => {
    it('should generate content with the specified provider', async () => {
      const mockRequest = {
        provider: Provider.Ollama,
        model: 'llama2',
        messages: [
          { role: MessageRole.System, content: 'You are a helpful assistant' },
          { role: MessageRole.User, content: 'Hello' },
        ],
      };

      const mockResponse: GenerateContentResponse = {
        provider: Provider.Ollama,
        response: {
          role: MessageRole.Assistant,
          model: 'llama2',
          content: 'Hi there!',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.generateContent(mockRequest);
      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/llms/${mockRequest.provider}/generate`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            model: mockRequest.model,
            messages: mockRequest.messages,
          }),
        })
      );
    });
  });

  describe('healthCheck', () => {
    it('should return true when API is healthy', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const result = await client.healthCheck();
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/health`,
        expect.any(Object)
      );
    });

    it('should return false when API is unhealthy', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API error'));

      const result = await client.healthCheck();
      expect(result).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should throw error when API request fails', async () => {
      const errorMessage = 'Bad Request';
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: errorMessage }),
      });

      await expect(client.listModels()).rejects.toThrow(errorMessage);
    });
  });

  describe('generateContentStream', () => {
    it('should handle SSE events correctly', async () => {
      const mockRequest = {
        provider: Provider.Ollama,
        model: 'llama2',
        messages: [
          { role: MessageRole.System, content: 'You are a helpful assistant' },
          { role: MessageRole.User, content: 'Hello' },
        ],
      };

      const mockStream = new TransformStream();
      const writer = mockStream.writable.getWriter();
      const encoder = new TextEncoder();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: mockStream.readable,
      });

      const callbacks = {
        onMessageStart: jest.fn(),
        onStreamStart: jest.fn(),
        onContentStart: jest.fn(),
        onContentDelta: jest.fn(),
        onContentEnd: jest.fn(),
        onMessageEnd: jest.fn(),
        onStreamEnd: jest.fn(),
      };

      const streamPromise = client.generateContentStream(
        mockRequest,
        callbacks
      );

      await writer.write(
        encoder.encode(
          'event: message-start\ndata: {"role": "assistant"}\n\n' +
            'event: stream-start\ndata: {}\n\n' +
            'event: content-start\ndata: {}\n\n' +
            'event: content-delta\ndata: {"content": "Hello"}\n\n' +
            'event: content-delta\ndata: {"content": " there!"}\n\n' +
            'event: content-end\ndata: {}\n\n' +
            'event: message-end\ndata: {}\n\n' +
            'event: stream-end\ndata: {}\n\n'
        )
      );

      await writer.close();
      await streamPromise;

      expect(callbacks.onMessageStart).toHaveBeenCalledWith('assistant');
      expect(callbacks.onStreamStart).toHaveBeenCalledTimes(1);
      expect(callbacks.onContentStart).toHaveBeenCalledTimes(1);
      expect(callbacks.onContentDelta).toHaveBeenCalledWith('Hello');
      expect(callbacks.onContentDelta).toHaveBeenCalledWith(' there!');
      expect(callbacks.onContentEnd).toHaveBeenCalledTimes(1);
      expect(callbacks.onMessageEnd).toHaveBeenCalledTimes(1);
      expect(callbacks.onStreamEnd).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/llms/${mockRequest.provider}/generate`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            model: mockRequest.model,
            messages: mockRequest.messages,
            stream: true,
            ssevents: true,
          }),
        })
      );
    });

    it('should handle errors in the stream response', async () => {
      const mockRequest = {
        provider: Provider.Ollama,
        model: 'llama2',
        messages: [{ role: MessageRole.User, content: 'Hello' }],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Bad Request' }),
      });

      await expect(
        client.generateContentStream(mockRequest, {})
      ).rejects.toThrow('Bad Request');
    });

    it('should handle non-readable response body', async () => {
      const mockRequest = {
        provider: Provider.Ollama,
        model: 'llama2',
        messages: [{ role: MessageRole.User, content: 'Hello' }],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: null,
      });

      await expect(
        client.generateContentStream(mockRequest, {})
      ).rejects.toThrow('Response body is not readable');
    });

    it('should handle empty events in the stream', async () => {
      const mockRequest = {
        provider: Provider.Ollama,
        model: 'llama2',
        messages: [{ role: MessageRole.User, content: 'Hello' }],
      };

      const mockStream = new TransformStream();
      const writer = mockStream.writable.getWriter();
      const encoder = new TextEncoder();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: mockStream.readable,
      });

      const callbacks = {
        onContentDelta: jest.fn(),
      };

      const streamPromise = client.generateContentStream(
        mockRequest,
        callbacks
      );

      await writer.write(encoder.encode('\n\n'));
      await writer.write(
        encoder.encode('event: content-delta\ndata: {"content": "Hello"}\n\n')
      );

      await writer.close();
      await streamPromise;

      expect(callbacks.onContentDelta).toHaveBeenCalledTimes(1);
      expect(callbacks.onContentDelta).toHaveBeenCalledWith('Hello');
    });
  });
});
