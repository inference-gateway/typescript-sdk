export enum Provider {
  Ollama = 'ollama',
  Groq = 'groq',
  OpenAI = 'openai',
  Cloudflare = 'cloudflare',
  Cohere = 'cohere',
  Anthropic = 'anthropic',
  DeepSeek = 'deepseek',
}

export enum MessageRole {
  System = 'system',
  User = 'user',
  Assistant = 'assistant',
  Tool = 'tool',
}

export interface Message {
  role: MessageRole;
  content: string;
  tool_calls?: ChatCompletionMessageToolCall[];
  tool_call_id?: string;
}

export interface Model {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

export interface ListModelsResponse {
  object: string;
  data: Model[];
}

export interface ChatCompletionMessageToolCallFunction {
  name: string;
  arguments: string;
}

export interface ChatCompletionMessageToolCall {
  id: string;
  type: 'function';
  function: ChatCompletionMessageToolCallFunction;
}

export interface ChatCompletionMessageToolCallChunk {
  index: number;
  id?: string;
  type?: string;
  function?: {
    name?: string;
    arguments?: string;
  };
}

export interface FunctionParameters {
  type: string;
  properties?: Record<string, unknown>;
  required?: string[];
}

export interface FunctionObject {
  description?: string;
  name: string;
  parameters: FunctionParameters;
  strict?: boolean;
}

export interface ChatCompletionTool {
  type: 'function';
  function: FunctionObject;
}

export interface ChatCompletionRequest {
  model: string;
  messages: Message[];
  max_tokens?: number;
  stream?: boolean;
  stream_options?: ChatCompletionStreamOptions;
  tools?: ChatCompletionTool[];
  temperature?: number;
  top_p?: number;
  top_k?: number;
}

export interface ChatCompletionStreamOptions {
  include_usage?: boolean;
}

export interface ChatCompletionChoice {
  finish_reason:
    | 'stop'
    | 'length'
    | 'tool_calls'
    | 'content_filter'
    | 'function_call';
  index: number;
  message: Message;
  logprobs?: Record<string, unknown>;
}

export interface CompletionUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatCompletionResponse {
  id: string;
  choices: ChatCompletionChoice[];
  created: number;
  model: string;
  object: string;
  usage?: CompletionUsage;
}

export interface ChatCompletionStreamChoice {
  delta: ChatCompletionStreamResponseDelta;
  finish_reason:
    | 'stop'
    | 'length'
    | 'tool_calls'
    | 'content_filter'
    | 'function_call'
    | null;
  index: number;
  logprobs?: Record<string, unknown>;
}

export interface ChatCompletionStreamResponseDelta {
  content?: string;
  tool_calls?: ChatCompletionMessageToolCallChunk[];
  role?: MessageRole;
  refusal?: string;
}

export interface ChatCompletionStreamResponse {
  id: string;
  choices: ChatCompletionStreamChoice[];
  created: number;
  model: string;
  object: string;
  usage?: CompletionUsage;
}

export interface ChatCompletionStreamCallbacks {
  onOpen?: () => void;
  onChunk?: (chunk: ChatCompletionStreamResponse) => void;
  onContent?: (content: string) => void;
  onTool?: (toolCall: ChatCompletionMessageToolCall) => void;
  onFinish?: (response: ChatCompletionStreamResponse) => void;
  onError?: (error: Error) => void;
}

export interface Error {
  error: string;
}
