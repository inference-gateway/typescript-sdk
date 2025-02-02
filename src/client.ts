import {
  GenerateContentOptions,
  GenerateContentRequest,
  GenerateContentResponse,
  Provider,
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

  async listModelsByProvider(provider: Provider): Promise<ProviderModels> {
    return this.request<ProviderModels>(`/llms/${provider}`);
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

  async generateContentStream(
    params: GenerateContentRequest,
    options?: GenerateContentOptions
  ): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/llms/${params.provider}/generate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.authToken && { Authorization: `Bearer ${this.authToken}` }),
        },
        body: JSON.stringify({
          model: params.model,
          messages: params.messages,
          stream: true,
          ssevents: true,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Response body is not readable');

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const events = decoder.decode(value).split('\n\n');
      for (const event of events) {
        if (!event.trim()) continue;

        const [eventType, ...data] = event.split('\n');
        const eventData = JSON.parse(data.join('\n').replace('data: ', ''));

        switch (eventType.replace('event: ', '')) {
          case 'message-start':
            options?.onMessageStart?.(eventData.role);
            break;
          case 'stream-start':
            options?.onStreamStart?.();
            break;
          case 'content-start':
            options?.onContentStart?.();
            break;
          case 'content-delta':
            options?.onContentDelta?.(eventData.content);
            break;
          case 'content-end':
            options?.onContentEnd?.();
            break;
          case 'message-end':
            options?.onMessageEnd?.();
            break;
          case 'stream-end':
            options?.onStreamEnd?.();
            break;
        }
      }
    }
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
