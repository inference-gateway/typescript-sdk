export enum Provider {
  Ollama = 'ollama',
  Groq = 'groq',
  OpenAI = 'openai',
  Google = 'google',
  Cloudflare = 'cloudflare',
  Cohere = 'cohere',
  Anthropic = 'anthropic',
}

export enum MessageRole {
  System = 'system',
  User = 'user',
  Assistant = 'assistant',
}
export interface Message {
  role: MessageRole;
  content: string;
}

export interface Model {
  name: string;
}

export interface ProviderModels {
  provider: Provider;
  models: Model[];
}

export interface GenerateContentRequest {
  provider: Provider;
  model: string;
  messages: Message[];
}

export interface GenerateContentResponse {
  provider: string;
  response: {
    role: 'assistant';
    model: string;
    content: string;
  };
}

export interface GenerateContentOptions {
  onMessageStart?: (role: string) => void;
  onStreamStart?: () => void;
  onContentStart?: () => void;
  onContentDelta?: (content: string) => void;
  onContentEnd?: () => void;
  onMessageEnd?: () => void;
  onStreamEnd?: () => void;
}
