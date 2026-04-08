import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../enviroment/environment';
import { BaseResponse } from '../../models/base-response.model';
import {
  PlaywrightCdpConnectRequest,
  PlaywrightCdpConnectResponse,
  PlaywrightChatGptSendRequest,
  PlaywrightChatGptSendResponse,
  PlaywrightLangChain4jTestRequest,
  PlaywrightLangChain4jTestResponse,
  PlaywrightOpenAiChatCompletionRequest,
  PlaywrightOpenAiChatCompletionResponse
} from '../../models/ai-agent/playwright.model';

@Injectable({ providedIn: 'root' })
export class PlaywrightAdminService {
  private readonly apiUrl = `${environment.apiUrl.adminAiGenerator}/ai-agent/playwright`;

  constructor(private readonly http: HttpClient) {}

  checkCdp(payload: PlaywrightCdpConnectRequest): Observable<PlaywrightCdpConnectResponse> {
    return this.http.post<BaseResponse<PlaywrightCdpConnectResponse>>(`${this.apiUrl}/cdp-check`, payload).pipe(map((res) => res.data));
  }

  sendChatGptPrompt(payload: PlaywrightChatGptSendRequest): Observable<PlaywrightChatGptSendResponse> {
    return this.http
      .post<BaseResponse<PlaywrightChatGptSendResponse>>(`${this.apiUrl}/chatgpt/send`, payload)
      .pipe(map((res) => res.data));
  }

  chatCompletions(payload: PlaywrightOpenAiChatCompletionRequest): Observable<PlaywrightOpenAiChatCompletionResponse> {
    return this.http
      .post<BaseResponse<PlaywrightOpenAiChatCompletionResponse>>(`${this.apiUrl}/chat/completions`, payload)
      .pipe(map((res) => res.data));
  }

  langChain4jTest(payload: PlaywrightLangChain4jTestRequest): Observable<PlaywrightLangChain4jTestResponse> {
    return this.http
      .post<BaseResponse<PlaywrightLangChain4jTestResponse>>(`${this.apiUrl}/langchain4j/test`, payload)
      .pipe(map((res) => res.data));
  }
}
