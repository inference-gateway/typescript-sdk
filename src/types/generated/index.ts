/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */

export interface paths {
  '/models': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Lists the currently available models, and provides basic information about each one such as the owner and availability.
     * @description Lists the currently available models, and provides basic information
     *     about each one such as the owner and availability.
     *
     */
    get: operations['listModels'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/chat/completions': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Create a chat completion
     * @description Generates a chat completion based on the provided input.
     *     The completion can be streamed to the client as it is generated.
     *
     */
    post: operations['createChatCompletion'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/proxy/{provider}/{path}': {
    parameters: {
      query?: never;
      header?: never;
      path: {
        provider: components['schemas']['Provider'];
        /** @description The remaining path to proxy to the provider */
        path: string;
      };
      cookie?: never;
    };
    /**
     * Proxy GET request to provider
     * @description Proxy GET request to provider
     *     The request body depends on the specific provider and endpoint being called.
     *     If you decide to use this approach, please follow the provider-specific documentations.
     *
     */
    get: operations['proxyGet'];
    /**
     * Proxy PUT request to provider
     * @description Proxy PUT request to provider
     *     The request body depends on the specific provider and endpoint being called.
     *     If you decide to use this approach, please follow the provider-specific documentations.
     *
     */
    put: operations['proxyPut'];
    /**
     * Proxy POST request to provider
     * @description Proxy POST request to provider
     *     The request body depends on the specific provider and endpoint being called.
     *     If you decide to use this approach, please follow the provider-specific documentations.
     *
     */
    post: operations['proxyPost'];
    /**
     * Proxy DELETE request to provider
     * @description Proxy DELETE request to provider
     *     The request body depends on the specific provider and endpoint being called.
     *     If you decide to use this approach, please follow the provider-specific documentations.
     *
     */
    delete: operations['proxyDelete'];
    options?: never;
    head?: never;
    /**
     * Proxy PATCH request to provider
     * @description Proxy PATCH request to provider
     *     The request body depends on the specific provider and endpoint being called.
     *     If you decide to use this approach, please follow the provider-specific documentations.
     *
     */
    patch: operations['proxyPatch'];
    trace?: never;
  };
  '/health': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Health check
     * @description Health check endpoint
     *     Returns a 200 status code if the service is healthy
     *
     */
    get: operations['healthCheck'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
}
export type webhooks = Record<string, never>;
export interface components {
  schemas: {
    /** @enum {string} */
    Provider: Provider;
    /** @description Provider-specific response format. Examples:
     *
     *     OpenAI GET /v1/models?provider=openai response:
     *     ```json
     *     {
     *       "provider": "openai",
     *       "object": "list",
     *       "data": [
     *         {
     *           "id": "gpt-4",
     *           "object": "model",
     *           "created": 1687882410,
     *           "owned_by": "openai",
     *           "served_by": "openai"
     *         }
     *       ]
     *     }
     *     ```
     *
     *     Anthropic GET /v1/models?provider=anthropic response:
     *     ```json
     *     {
     *       "provider": "anthropic",
     *       "object": "list",
     *       "data": [
     *         {
     *           "id": "gpt-4",
     *           "object": "model",
     *           "created": 1687882410,
     *           "owned_by": "openai",
     *           "served_by": "openai"
     *         }
     *       ]
     *     }
     *     ```
     *      */
    ProviderSpecificResponse: Record<string, never>;
    /**
     * @description Authentication type for providers
     * @enum {string}
     */
    ProviderAuthType: ProviderAuthType;
    SSEvent: {
      /** @enum {string} */
      event?: SSEventEvent;
      /** Format: byte */
      data?: string;
      retry?: number;
    };
    Endpoints: {
      models?: string;
      chat?: string;
    };
    Error: {
      error?: string;
    };
    /**
     * @description Role of the message sender
     * @enum {string}
     */
    MessageRole: MessageRole;
    /** @description Message structure for provider requests */
    Message: {
      role: components['schemas']['MessageRole'];
      content: string;
      tool_calls?: components['schemas']['ChatCompletionMessageToolCall'][];
      tool_call_id?: string;
      reasoning?: string;
      reasoning_content?: string;
    };
    /** @description Common model information */
    Model: {
      id?: string;
      object?: string;
      /** Format: int64 */
      created?: number;
      owned_by?: string;
      served_by?: components['schemas']['Provider'];
    };
    /** @description Response structure for listing models */
    ListModelsResponse: {
      provider?: components['schemas']['Provider'];
      object?: string;
      /** @default [] */
      data: components['schemas']['Model'][];
    };
    FunctionObject: {
      /** @description A description of what the function does, used by the model to choose when and how to call the function. */
      description?: string;
      /** @description The name of the function to be called. Must be a-z, A-Z, 0-9, or contain underscores and dashes, with a maximum length of 64. */
      name: string;
      parameters?: components['schemas']['FunctionParameters'];
      /**
       * @description Whether to enable strict schema adherence when generating the function call. If set to true, the model will follow the exact schema defined in the `parameters` field. Only a subset of JSON Schema is supported when `strict` is `true`. Learn more about Structured Outputs in the [function calling guide](docs/guides/function-calling).
       * @default false
       */
      strict: boolean;
    };
    ChatCompletionTool: {
      type: components['schemas']['ChatCompletionToolType'];
      function: components['schemas']['FunctionObject'];
    };
    /** @description The parameters the functions accepts, described as a JSON Schema object. See the [guide](/docs/guides/function-calling) for examples, and the [JSON Schema reference](https://json-schema.org/understanding-json-schema/) for documentation about the format.
     *     Omitting `parameters` defines a function with an empty parameter list. */
    FunctionParameters: {
      /** @description The type of the parameters. Currently, only `object` is supported. */
      type?: string;
      /** @description The properties of the parameters. */
      properties?: Record<string, never>;
      /** @description The required properties of the parameters. */
      required?: string[];
    };
    /**
     * @description The type of the tool. Currently, only `function` is supported.
     * @enum {string}
     */
    ChatCompletionToolType: ChatCompletionToolType;
    /** @description Usage statistics for the completion request. */
    CompletionUsage: {
      /**
       * Format: int64
       * @description Number of tokens in the generated completion.
       * @default 0
       */
      completion_tokens: number;
      /**
       * Format: int64
       * @description Number of tokens in the prompt.
       * @default 0
       */
      prompt_tokens: number;
      /**
       * Format: int64
       * @description Total number of tokens used in the request (prompt + completion).
       * @default 0
       */
      total_tokens: number;
    };
    /** @description Options for streaming response. Only set this when you set `stream: true`.
     *      */
    ChatCompletionStreamOptions: {
      /**
       * @description If set, an additional chunk will be streamed before the `data: [DONE]` message. The `usage` field on this chunk shows the token usage statistics for the entire request, and the `choices` field will always be an empty array. All other chunks will also include a `usage` field, but with a null value.
       *
       * @default true
       */
      include_usage: boolean;
    };
    CreateChatCompletionRequest: {
      /** @description Model ID to use */
      model: string;
      /** @description A list of messages comprising the conversation so far.
       *      */
      messages: components['schemas']['Message'][];
      /** @description An upper bound for the number of tokens that can be generated for a completion, including visible output tokens and reasoning tokens.
       *      */
      max_tokens?: number;
      /**
       * @description If set to true, the model response data will be streamed to the client as it is generated using [server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#Event_stream_format).
       *
       * @default false
       */
      stream: boolean;
      stream_options?: components['schemas']['ChatCompletionStreamOptions'];
      /** @description A list of tools the model may call. Currently, only functions are supported as a tool. Use this to provide a list of functions the model may generate JSON inputs for. A max of 128 functions are supported.
       *      */
      tools?: components['schemas']['ChatCompletionTool'][];
    };
    /** @description The function that the model called. */
    ChatCompletionMessageToolCallFunction: {
      /** @description The name of the function to call. */
      name: string;
      /** @description The arguments to call the function with, as generated by the model in JSON format. Note that the model does not always generate valid JSON, and may hallucinate parameters not defined by your function schema. Validate the arguments in your code before calling your function. */
      arguments: string;
    };
    ChatCompletionMessageToolCall: {
      /** @description The ID of the tool call. */
      id: string;
      type: components['schemas']['ChatCompletionToolType'];
      function: components['schemas']['ChatCompletionMessageToolCallFunction'];
    };
    ChatCompletionChoice: {
      /**
       * @description The reason the model stopped generating tokens. This will be `stop` if the model hit a natural stop point or a provided stop sequence,
       *     `length` if the maximum number of tokens specified in the request was reached,
       *     `content_filter` if content was omitted due to a flag from our content filters,
       *     `tool_calls` if the model called a tool.
       *
       * @enum {string}
       */
      finish_reason: ChatCompletionChoiceFinish_reason;
      /** @description The index of the choice in the list of choices. */
      index: number;
      message: components['schemas']['Message'];
    };
    ChatCompletionStreamChoice: {
      delta: components['schemas']['ChatCompletionStreamResponseDelta'];
      /** @description Log probability information for the choice. */
      logprobs?: {
        /** @description A list of message content tokens with log probability information. */
        content: components['schemas']['ChatCompletionTokenLogprob'][];
        /** @description A list of message refusal tokens with log probability information. */
        refusal: components['schemas']['ChatCompletionTokenLogprob'][];
      };
      finish_reason: components['schemas']['FinishReason'];
      /** @description The index of the choice in the list of choices. */
      index: number;
    };
    /** @description Represents a chat completion response returned by model, based on the provided input. */
    CreateChatCompletionResponse: {
      /** @description A unique identifier for the chat completion. */
      id: string;
      /** @description A list of chat completion choices. Can be more than one if `n` is greater than 1. */
      choices: components['schemas']['ChatCompletionChoice'][];
      /** @description The Unix timestamp (in seconds) of when the chat completion was created. */
      created: number;
      /** @description The model used for the chat completion. */
      model: string;
      /** @description The object type, which is always `chat.completion`. */
      object: string;
      usage?: components['schemas']['CompletionUsage'];
    };
    /** @description A chat completion delta generated by streamed model responses. */
    ChatCompletionStreamResponseDelta: {
      /** @description The contents of the chunk message. */
      content?: string;
      tool_calls?: components['schemas']['ChatCompletionMessageToolCallChunk'][];
      role?: components['schemas']['MessageRole'];
      /** @description The refusal message generated by the model. */
      refusal?: string;
    };
    ChatCompletionMessageToolCallChunk: {
      index: number;
      /** @description The ID of the tool call. */
      id?: string;
      /** @description The type of the tool. Currently, only `function` is supported. */
      type?: string;
      function?: {
        /** @description The name of the function to call. */
        name?: string;
        /** @description The arguments to call the function with, as generated by the model in JSON format. Note that the model does not always generate valid JSON, and may hallucinate parameters not defined by your function schema. Validate the arguments in your code before calling your function. */
        arguments?: string;
      };
    };
    ChatCompletionTokenLogprob: {
      /** @description The token. */
      token: string;
      /** @description The log probability of this token, if it is within the top 20 most likely tokens. Otherwise, the value `-9999.0` is used to signify that the token is very unlikely. */
      logprob: number;
      /** @description A list of integers representing the UTF-8 bytes representation of the token. Useful in instances where characters are represented by multiple tokens and their byte representations must be combined to generate the correct text representation. Can be `null` if there is no bytes representation for the token. */
      bytes: number[];
      /** @description List of the most likely tokens and their log probability, at this token position. In rare cases, there may be fewer than the number of requested `top_logprobs` returned. */
      top_logprobs: {
        /** @description The token. */
        token: string;
        /** @description The log probability of this token, if it is within the top 20 most likely tokens. Otherwise, the value `-9999.0` is used to signify that the token is very unlikely. */
        logprob: number;
        /** @description A list of integers representing the UTF-8 bytes representation of the token. Useful in instances where characters are represented by multiple tokens and their byte representations must be combined to generate the correct text representation. Can be `null` if there is no bytes representation for the token. */
        bytes: number[];
      }[];
    };
    /**
     * @description The reason the model stopped generating tokens. This will be `stop` if the model hit a natural stop point or a provided stop sequence,
     *     `length` if the maximum number of tokens specified in the request was reached,
     *     `content_filter` if content was omitted due to a flag from our content filters,
     *     `tool_calls` if the model called a tool.
     *
     * @enum {string}
     */
    FinishReason: ChatCompletionChoiceFinish_reason;
    /** @description Represents a streamed chunk of a chat completion response returned
     *     by the model, based on the provided input.
     *      */
    CreateChatCompletionStreamResponse: {
      /** @description A unique identifier for the chat completion. Each chunk has the same ID. */
      id: string;
      /** @description A list of chat completion choices. Can contain more than one elements if `n` is greater than 1. Can also be empty for the
       *     last chunk if you set `stream_options: {"include_usage": true}`.
       *      */
      choices: components['schemas']['ChatCompletionStreamChoice'][];
      /** @description The Unix timestamp (in seconds) of when the chat completion was created. Each chunk has the same timestamp. */
      created: number;
      /** @description The model to generate the completion. */
      model: string;
      /** @description This fingerprint represents the backend configuration that the model runs with.
       *     Can be used in conjunction with the `seed` request parameter to understand when backend changes have been made that might impact determinism.
       *      */
      system_fingerprint?: string;
      /** @description The object type, which is always `chat.completion.chunk`. */
      object: string;
      usage?: components['schemas']['CompletionUsage'];
    };
    Config: unknown;
  };
  responses: {
    /** @description Bad request */
    BadRequest: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/json': components['schemas']['Error'];
      };
    };
    /** @description Unauthorized */
    Unauthorized: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/json': components['schemas']['Error'];
      };
    };
    /** @description Internal server error */
    InternalError: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/json': components['schemas']['Error'];
      };
    };
    /** @description ProviderResponse depends on the specific provider and endpoint being called
     *     If you decide to use this approach, please follow the provider-specific documentations.
     *      */
    ProviderResponse: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/json': components['schemas']['ProviderSpecificResponse'];
      };
    };
  };
  parameters: never;
  requestBodies: {
    /** @description ProviderRequest depends on the specific provider and endpoint being called
     *     If you decide to use this approach, please follow the provider-specific documentations.
     *      */
    ProviderRequest: {
      content: {
        'application/json': {
          model?: string;
          messages?: {
            role?: string;
            content?: string;
          }[];
          /**
           * Format: float
           * @default 0.7
           */
          temperature?: number;
        };
      };
    };
    /** @description ProviderRequest depends on the specific provider and endpoint being called
     *     If you decide to use this approach, please follow the provider-specific documentations.
     *      */
    CreateChatCompletionRequest: {
      content: {
        'application/json': components['schemas']['CreateChatCompletionRequest'];
      };
    };
  };
  headers: never;
  pathItems: never;
}
export type SchemaProvider = components['schemas']['Provider'];
export type SchemaProviderSpecificResponse =
  components['schemas']['ProviderSpecificResponse'];
export type SchemaProviderAuthType = components['schemas']['ProviderAuthType'];
export type SchemaSsEvent = components['schemas']['SSEvent'];
export type SchemaEndpoints = components['schemas']['Endpoints'];
export type SchemaError = components['schemas']['Error'];
export type SchemaMessageRole = components['schemas']['MessageRole'];
export type SchemaMessage = components['schemas']['Message'];
export type SchemaModel = components['schemas']['Model'];
export type SchemaListModelsResponse =
  components['schemas']['ListModelsResponse'];
export type SchemaFunctionObject = components['schemas']['FunctionObject'];
export type SchemaChatCompletionTool =
  components['schemas']['ChatCompletionTool'];
export type SchemaFunctionParameters =
  components['schemas']['FunctionParameters'];
export type SchemaChatCompletionToolType =
  components['schemas']['ChatCompletionToolType'];
export type SchemaCompletionUsage = components['schemas']['CompletionUsage'];
export type SchemaChatCompletionStreamOptions =
  components['schemas']['ChatCompletionStreamOptions'];
export type SchemaCreateChatCompletionRequest =
  components['schemas']['CreateChatCompletionRequest'];
export type SchemaChatCompletionMessageToolCallFunction =
  components['schemas']['ChatCompletionMessageToolCallFunction'];
export type SchemaChatCompletionMessageToolCall =
  components['schemas']['ChatCompletionMessageToolCall'];
export type SchemaChatCompletionChoice =
  components['schemas']['ChatCompletionChoice'];
export type SchemaChatCompletionStreamChoice =
  components['schemas']['ChatCompletionStreamChoice'];
export type SchemaCreateChatCompletionResponse =
  components['schemas']['CreateChatCompletionResponse'];
export type SchemaChatCompletionStreamResponseDelta =
  components['schemas']['ChatCompletionStreamResponseDelta'];
export type SchemaChatCompletionMessageToolCallChunk =
  components['schemas']['ChatCompletionMessageToolCallChunk'];
export type SchemaChatCompletionTokenLogprob =
  components['schemas']['ChatCompletionTokenLogprob'];
export type SchemaFinishReason = components['schemas']['FinishReason'];
export type SchemaCreateChatCompletionStreamResponse =
  components['schemas']['CreateChatCompletionStreamResponse'];
export type SchemaConfig = components['schemas']['Config'];
export type ResponseBadRequest = components['responses']['BadRequest'];
export type ResponseUnauthorized = components['responses']['Unauthorized'];
export type ResponseInternalError = components['responses']['InternalError'];
export type ResponseProviderResponse =
  components['responses']['ProviderResponse'];
export type RequestBodyProviderRequest =
  components['requestBodies']['ProviderRequest'];
export type RequestBodyCreateChatCompletionRequest =
  components['requestBodies']['CreateChatCompletionRequest'];
export type $defs = Record<string, never>;
export interface operations {
  listModels: {
    parameters: {
      query?: {
        /** @description Specific provider to query (optional) */
        provider?: components['schemas']['Provider'];
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description List of available models */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ListModelsResponse'];
        };
      };
      401: components['responses']['Unauthorized'];
      500: components['responses']['InternalError'];
    };
  };
  createChatCompletion: {
    parameters: {
      query?: {
        /** @description Specific provider to use (default determined by model) */
        provider?: components['schemas']['Provider'];
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: components['requestBodies']['CreateChatCompletionRequest'];
    responses: {
      /** @description Successful response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['CreateChatCompletionResponse'];
          'text/event-stream': components['schemas']['SSEvent'];
        };
      };
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      500: components['responses']['InternalError'];
    };
  };
  proxyGet: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        provider: components['schemas']['Provider'];
        /** @description The remaining path to proxy to the provider */
        path: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components['responses']['ProviderResponse'];
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      500: components['responses']['InternalError'];
    };
  };
  proxyPut: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        provider: components['schemas']['Provider'];
        /** @description The remaining path to proxy to the provider */
        path: string;
      };
      cookie?: never;
    };
    requestBody: components['requestBodies']['ProviderRequest'];
    responses: {
      200: components['responses']['ProviderResponse'];
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      500: components['responses']['InternalError'];
    };
  };
  proxyPost: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        provider: components['schemas']['Provider'];
        /** @description The remaining path to proxy to the provider */
        path: string;
      };
      cookie?: never;
    };
    requestBody: components['requestBodies']['ProviderRequest'];
    responses: {
      200: components['responses']['ProviderResponse'];
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      500: components['responses']['InternalError'];
    };
  };
  proxyDelete: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        provider: components['schemas']['Provider'];
        /** @description The remaining path to proxy to the provider */
        path: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: components['responses']['ProviderResponse'];
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      500: components['responses']['InternalError'];
    };
  };
  proxyPatch: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        provider: components['schemas']['Provider'];
        /** @description The remaining path to proxy to the provider */
        path: string;
      };
      cookie?: never;
    };
    requestBody: components['requestBodies']['ProviderRequest'];
    responses: {
      200: components['responses']['ProviderResponse'];
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      500: components['responses']['InternalError'];
    };
  };
  healthCheck: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Health check successful */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
}
export enum Provider {
  ollama = 'ollama',
  groq = 'groq',
  openai = 'openai',
  cloudflare = 'cloudflare',
  cohere = 'cohere',
  anthropic = 'anthropic',
  deepseek = 'deepseek',
}
export enum ProviderAuthType {
  bearer = 'bearer',
  xheader = 'xheader',
  query = 'query',
  none = 'none',
}
export enum SSEventEvent {
  message_start = 'message-start',
  stream_start = 'stream-start',
  content_start = 'content-start',
  content_delta = 'content-delta',
  content_end = 'content-end',
  message_end = 'message-end',
  stream_end = 'stream-end',
}
export enum MessageRole {
  system = 'system',
  user = 'user',
  assistant = 'assistant',
  tool = 'tool',
}
export enum ChatCompletionToolType {
  function = 'function',
}
export enum ChatCompletionChoiceFinish_reason {
  stop = 'stop',
  length = 'length',
  tool_calls = 'tool_calls',
  content_filter = 'content_filter',
  function_call = 'function_call',
}
