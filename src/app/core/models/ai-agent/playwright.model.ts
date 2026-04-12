export interface PlaywrightCdpConnectResponse {
  connected: boolean;
  browserVersion?: string;
  contextCount?: number;
  pageCount?: number;
  pageUrls?: string[];
  errorMessage?: string;
}

export interface PlaywrightChatGptSendRequest {
  prompt: string;
  clearBeforeType?: boolean;
}

export interface PlaywrightOpenAiChatCompletionMessageRequest {
  role: string;
  content: string;
}

export interface PlaywrightOpenAiChatCompletionRequest {
  model?: string;
  clearBeforeType?: boolean;
  messages: PlaywrightOpenAiChatCompletionMessageRequest[];
}

export interface PlaywrightObservedNetworkCallResponse {
  sequence?: number;
  requestId?: string;
  method?: string;
  url?: string;
  resourceType?: string;
  status?: number;
  contentType?: string;
  eventStream?: boolean;
  webSocket?: boolean;
  eventSourceMessageCount?: number;
  dataChunkCount?: number;
  webSocketFrameSentCount?: number;
  webSocketFrameReceivedCount?: number;
  finished?: boolean;
  failed?: boolean;
  failureReason?: string;
  responseBody?: string;
}

export interface PlaywrightConversationStreamEventResponse {
  sequence?: number;
  event?: string;
  rawData?: string;
  parsedData?: unknown;
  type?: string;
  conversationId?: string;
  messageId?: string;
  done?: boolean;
  messageStreamComplete?: boolean;
}

export interface PlaywrightConversationStreamResponse {
  done?: boolean;
  messageStreamComplete?: boolean;
  conversationId?: string;
  assistantMessageId?: string;
  assistantRawText?: string;
  assistantText?: string;
  toolCalls?: PlaywrightOpenAiChatCompletionToolCallResponse[];
  eventCount?: number;
  events?: PlaywrightConversationStreamEventResponse[];
}

export interface PlaywrightOpenAiChatCompletionToolCallFunctionResponse {
  name?: string;
  arguments?: string;
}

export interface PlaywrightOpenAiChatCompletionToolCallResponse {
  id?: string;
  type?: string;
  function?: PlaywrightOpenAiChatCompletionToolCallFunctionResponse;
}

export interface PlaywrightOpenAiChatCompletionMessageResponse {
  role?: string;
  content?: string;
  refusal?: string | null;
  toolCalls?: PlaywrightOpenAiChatCompletionToolCallResponse[] | null;
}

export interface PlaywrightOpenAiChatCompletionChoiceResponse {
  index?: number;
  message?: PlaywrightOpenAiChatCompletionMessageResponse;
  finishReason?: string;
}

export interface PlaywrightOpenAiChatCompletionUsageResponse {
  promptTokens?: number | null;
  completionTokens?: number | null;
  totalTokens?: number | null;
}

export interface PlaywrightOpenAiChatCompletionResponse {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  systemFingerprint?: string | null;
  choices?: PlaywrightOpenAiChatCompletionChoiceResponse[];
  usage?: PlaywrightOpenAiChatCompletionUsageResponse;
}

export interface PlaywrightChatGptSendResponse {
  sent: boolean;
  pageUrl?: string;
  pageTitle?: string;
  message?: string;
  conversationResponseUrl?: string;
  conversationResponseStatus?: number;
  conversationResponseBody?: string;
  conversationResponseParsed?: PlaywrightConversationStreamResponse;
  conversationResponseOpenAi?: PlaywrightOpenAiChatCompletionResponse;
  networkCallCount?: number;
  networkCalls?: PlaywrightObservedNetworkCallResponse[];
}
