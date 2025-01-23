/* eslint-disable no-unused-vars */
export enum Provider {
  Ollama = 'ollama',
  Groq = 'groq',
  OpenAI = 'openai',
  Google = 'google',
  Cloudflare = 'cloudflare',
  Cohere = 'cohere',
  Anthropic = 'anthropic',
}
/* eslint-enable no-unused-vars */

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface Model {
  id: string;
  object: string;
  owned_by: string;
  created: number;
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
    role: string;
    model: string;
    content: string;
  };
}
