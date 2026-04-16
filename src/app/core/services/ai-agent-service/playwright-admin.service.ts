import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../enviroment/environment';
import { BaseResponse } from '../../models/base-response.model';
import {
  PlaywrightCdpConnectResponse,
  PlaywrightChatGptSendRequest,
  PlaywrightChatGptSendResponse,
  PlaywrightOpenAiChatCompletionRequest,
  PlaywrightOpenAiChatCompletionResponse,
  PlaywrightSessionResponse,
  PlaywrightSessionUpsertRequest
} from '../../models/ai-agent/playwright.model';

@Injectable({ providedIn: 'root' })
export class PlaywrightAdminService {
  private readonly apiUrl = `${environment.apiUrl.adminAiGenerator}/ai-agent/playwright`;

  constructor(private readonly http: HttpClient) {}

  checkCdp(): Observable<PlaywrightCdpConnectResponse> {
    return this.http.post<BaseResponse<PlaywrightCdpConnectResponse>>(`${this.apiUrl}/cdp-check`, {}).pipe(map((res) => res.data));
  }

  sendChatGptPrompt(payload: PlaywrightChatGptSendRequest): Observable<PlaywrightChatGptSendResponse> {
    return this.http
      .post<BaseResponse<PlaywrightChatGptSendResponse>>(`${this.apiUrl}/chatgpt/send`, payload)
      .pipe(map((res) => this.mapChatGptSendResponse(res.data)));
  }

  chatCompletions(payload: PlaywrightOpenAiChatCompletionRequest): Observable<PlaywrightOpenAiChatCompletionResponse> {
    return this.http
      .post<BaseResponse<PlaywrightOpenAiChatCompletionResponse>>(`${this.apiUrl}/chat/completions`, payload)
      .pipe(map((res) => this.mapOpenAiResponse(res.data)));
  }

  listSessions(): Observable<PlaywrightSessionResponse[]> {
    return this.http.get<BaseResponse<PlaywrightSessionResponse[]>>(`${this.apiUrl}/sessions`).pipe(map((res) => res.data ?? []));
  }

  createSession(payload: PlaywrightSessionUpsertRequest): Observable<PlaywrightSessionResponse> {
    return this.http.post<BaseResponse<PlaywrightSessionResponse>>(`${this.apiUrl}/sessions`, payload).pipe(map((res) => res.data));
  }

  updateSession(sessionId: string, payload: PlaywrightSessionUpsertRequest): Observable<PlaywrightSessionResponse> {
    return this.http.put<BaseResponse<PlaywrightSessionResponse>>(`${this.apiUrl}/sessions/${sessionId}`, payload).pipe(map((res) => res.data));
  }

  syncDefaultSession(): Observable<PlaywrightSessionResponse> {
    return this.http.post<BaseResponse<PlaywrightSessionResponse>>(`${this.apiUrl}/sessions/sync-default`, {}).pipe(map((res) => res.data));
  }

  resetSession(sessionId: string): Observable<PlaywrightSessionResponse> {
    return this.http.post<BaseResponse<PlaywrightSessionResponse>>(`${this.apiUrl}/sessions/${sessionId}/reset`, {}).pipe(map((res) => res.data));
  }

  enableSession(sessionId: string): Observable<PlaywrightSessionResponse> {
    return this.http.post<BaseResponse<PlaywrightSessionResponse>>(`${this.apiUrl}/sessions/${sessionId}/enable`, {}).pipe(map((res) => res.data));
  }

  disableSession(sessionId: string): Observable<PlaywrightSessionResponse> {
    return this.http.post<BaseResponse<PlaywrightSessionResponse>>(`${this.apiUrl}/sessions/${sessionId}/disable`, {}).pipe(map((res) => res.data));
  }

  private mapChatGptSendResponse(response: PlaywrightChatGptSendResponse): PlaywrightChatGptSendResponse {
    if (!response) {
      return response;
    }

    return {
      ...response,
      conversationResponseOpenAi: response.conversationResponseOpenAi
        ? this.mapOpenAiResponse(response.conversationResponseOpenAi)
        : response.conversationResponseOpenAi
    };
  }

  private mapOpenAiResponse(response: any): PlaywrightOpenAiChatCompletionResponse {
    if (!response) {
      return response;
    }

    return {
      id: response.id,
      object: response.object,
      created: response.created,
      model: response.model,
      systemFingerprint: response.systemFingerprint ?? response.system_fingerprint ?? null,
      choices: Array.isArray(response.choices)
        ? response.choices.map((choice: any) => ({
            index: choice?.index,
            finishReason: choice?.finishReason ?? choice?.finish_reason,
            message: choice?.message
              ? {
                  role: choice.message.role,
                  content: choice.message.content,
                  refusal: choice.message.refusal,
                  toolCalls: Array.isArray(choice.message.toolCalls ?? choice.message.tool_calls)
                    ? (choice.message.toolCalls ?? choice.message.tool_calls).map((toolCall: any) => ({
                        id: toolCall?.id,
                        type: toolCall?.type,
                        function: toolCall?.function
                          ? {
                              name: toolCall.function.name,
                              arguments: toolCall.function.arguments
                            }
                          : undefined
                      }))
                    : null
                }
              : undefined
          }))
        : undefined,
      usage: response.usage
        ? {
            promptTokens: response.usage.promptTokens ?? response.usage.prompt_tokens ?? null,
            completionTokens: response.usage.completionTokens ?? response.usage.completion_tokens ?? null,
            totalTokens: response.usage.totalTokens ?? response.usage.total_tokens ?? null
          }
        : undefined
    };
  }
}
