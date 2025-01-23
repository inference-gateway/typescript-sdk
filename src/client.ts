import {
  GenerateContentRequest,
  GenerateContentResponse,
  ProviderModels,
} from './types';

export class InferenceGatewayClient {
  private baseUrl: string;
  private authToken?: string;

  constructor(baseUrl: string, authToken?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.authToken = authToken;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers = new Headers({
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    });

    if (this.authToken) {
      headers.set('Authorization', `Bearer ${this.authToken}`);
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async listModels(): Promise<ProviderModels[]> {
    return this.request<ProviderModels[]>('/llms');
  }

  async generateContent(
    params: GenerateContentRequest
  ): Promise<GenerateContentResponse> {
    return this.request<GenerateContentResponse>(
      `/llms/${params.provider}/generate`,
      {
        method: 'POST',
        body: JSON.stringify({
          model: params.model,
          messages: params.messages,
        }),
      }
    );
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.request('/health');
      return true;
    } catch {
      return false;
    }
  }
}
