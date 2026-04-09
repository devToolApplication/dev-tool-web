export interface PlaywrightCdpConnectRequest {
  cdpUrl?: string;
}

export interface PlaywrightCdpConnectResponse {
  connected: boolean;
  cdpUrl?: string;
  browserVersion?: string;
  contextCount?: number;
  pageCount?: number;
  pageUrls?: string[];
  errorMessage?: string;
}

export interface PlaywrightChatGptSendRequest {
  cdpUrl?: string;
  prompt: string;
  clearBeforeType?: boolean;
}

export interface PlaywrightOpenAiChatCompletionMessageRequest {
  role: string;
  content: string;
}

export interface PlaywrightOpenAiChatCompletionRequest {
  cdpUrl?: string;
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
  assistantText?: string;
  eventCount?: number;
  events?: PlaywrightConversationStreamEventResponse[];
}

export interface PlaywrightOpenAiChatCompletionMessageResponse {
  role?: string;
  content?: string;
  refusal?: string | null;
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

export interface PlaywrightLangChain4jTestRequest {
  model?: string;
  prompt: string;
}

export interface PlaywrightLangChain4jToolExecutionResponse {
  toolName?: string;
  arguments?: string;
  result?: string;
}

export interface PlaywrightLangChain4jTestResponse {
  responseText?: string;
  completion?: PlaywrightOpenAiChatCompletionResponse;
  toolExecutions?: PlaywrightLangChain4jToolExecutionResponse[];
}

export interface PlaywrightChatGptSendResponse {
  sent: boolean;
  cdpUrl?: string;
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
