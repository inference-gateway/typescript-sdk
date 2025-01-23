import { InferenceGatewayClient } from '@/client';
import { GenerateContentResponse, Provider, ProviderModels } from '@/types';

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
              id: 'llama2',
              object: 'model',
              owned_by: 'ollama',
              created: 1234567890,
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

  describe('generateContent', () => {
    it('should generate content with the specified provider', async () => {
      const mockRequest = {
        provider: Provider.Ollama,
        model: 'llama2',
        messages: [
          { role: 'system' as const, content: 'You are a helpful assistant' },
          { role: 'user' as const, content: 'Hello' },
        ],
      };

      const mockResponse: GenerateContentResponse = {
        provider: Provider.Ollama,
        response: {
          role: 'assistant',
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
});
