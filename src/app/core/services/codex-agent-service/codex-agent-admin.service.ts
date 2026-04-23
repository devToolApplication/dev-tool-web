import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../enviroment/environment';
import { BaseResponse } from '../../models/base-response.model';
import { CodexAgentAuthStatusResponse, CodexDeviceLoginSessionResponse } from '../../models/codex-agent/codex-agent-auth.model';
import { CodexAgentAskRequest, CodexAgentAskResponse, CodexAgentOptionsResponse } from '../../models/codex-agent/codex-agent-ask.model';

@Injectable({ providedIn: 'root' })
export class CodexAgentAdminService {
  private readonly apiUrl = `${environment.apiUrl.adminAiGenerator}/codex-agent`;

  constructor(private readonly http: HttpClient) {}

  getOptions(): Observable<CodexAgentOptionsResponse> {
    return this.http.get<BaseResponse<CodexAgentOptionsResponse>>(`${this.apiUrl}/options`).pipe(map((res) => res.data));
  }

  getAuthStatus(): Observable<CodexAgentAuthStatusResponse> {
    return this.http.get<BaseResponse<CodexAgentAuthStatusResponse>>(`${this.apiUrl}/auth/status`).pipe(map((res) => res.data));
  }

  startDeviceLogin(): Observable<CodexDeviceLoginSessionResponse> {
    return this.http.post<BaseResponse<CodexDeviceLoginSessionResponse>>(`${this.apiUrl}/auth/login/device`, {}).pipe(map((res) => res.data));
  }

  getDeviceLoginSession(sessionId: string): Observable<CodexDeviceLoginSessionResponse> {
    return this.http.get<BaseResponse<CodexDeviceLoginSessionResponse>>(`${this.apiUrl}/auth/login/device/${sessionId}`).pipe(map((res) => res.data));
  }

  ask(payload: CodexAgentAskRequest): Observable<CodexAgentAskResponse> {
    return this.http.post<BaseResponse<CodexAgentAskResponse>>(`${this.apiUrl}/ask`, {
      agentId: payload.agentId,
      codexModel: payload.model,
      mode: payload.mode,
      userPrompt: payload.userPrompt
    }).pipe(map((res) => res.data));
  }
}
