import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../enviroment/environment';
import { BaseResponse } from '../../models/base-response.model';
import {
  CodexChatMessageRequest,
  CodexChatSessionResponse,
  CodexChatSessionStartRequest
} from '../../models/codex-agent/codex-chat-session.model';
import {
  CodexMcpServerCheckResponse,
  CodexMcpServerResponse,
  CodexMcpServerUpsertRequest,
  CodexMcpToolResponse
} from '../../models/codex-agent/codex-mcp.model';
import { CodexAgentAuthStatusResponse, CodexDeviceLoginSessionResponse } from '../../models/codex-agent/codex-agent-auth.model';
import {
  CodexAgentAskRequest,
  CodexAgentAskResponse,
  CodexAgentMcpServersResponse,
  CodexAgentMcpToolsResponse,
  CodexAgentOptionsResponse
} from '../../models/codex-agent/codex-agent-ask.model';

@Injectable({ providedIn: 'root' })
export class CodexAgentAdminService {
  private readonly apiUrl = `${environment.apiUrl.adminAiGenerator}/codex-agent`;

  constructor(private readonly http: HttpClient) {}

  getOptions(): Observable<CodexAgentOptionsResponse> {
    return this.http.get<BaseResponse<CodexAgentOptionsResponse>>(`${this.apiUrl}/options`).pipe(map((res) => res.data));
  }

  getMcpServers(): Observable<CodexAgentMcpServersResponse> {
    return this.http.get<BaseResponse<CodexAgentMcpServersResponse>>(`${this.apiUrl}/mcp-servers`).pipe(map((res) => res.data));
  }

  getMcpServerTools(serverId: string): Observable<CodexAgentMcpToolsResponse> {
    return this.http.get<BaseResponse<CodexAgentMcpToolsResponse>>(`${this.apiUrl}/mcp-servers/${serverId}/tools`).pipe(map((res) => res.data));
  }

  listMcpServerConfigs(filters: { keyword?: string; enabled?: boolean | null; source?: string } = {}): Observable<CodexMcpServerResponse[]> {
    const params = Object.entries(filters).reduce<Record<string, string>>((result, [key, value]) => {
      if (value === undefined || value === null || value === '') {
        return result;
      }
      result[key] = String(value);
      return result;
    }, {});

    return this.http.get<BaseResponse<CodexMcpServerResponse[]>>(`${this.apiUrl}/mcp-server-configs`, { params }).pipe(map((res) => res.data ?? []));
  }

  getMcpServerConfig(serverId: string): Observable<CodexMcpServerResponse> {
    return this.http.get<BaseResponse<CodexMcpServerResponse>>(`${this.apiUrl}/mcp-server-configs/${serverId}`).pipe(map((res) => res.data));
  }

  saveMcpServerConfig(serverId: string, payload: CodexMcpServerUpsertRequest): Observable<CodexMcpServerResponse> {
    return this.http.put<BaseResponse<CodexMcpServerResponse>>(`${this.apiUrl}/mcp-server-configs/${serverId}`, payload).pipe(map((res) => res.data));
  }

  deleteMcpServerConfig(serverId: string): Observable<CodexMcpServerResponse> {
    return this.http.delete<BaseResponse<CodexMcpServerResponse>>(`${this.apiUrl}/mcp-server-configs/${serverId}`).pipe(map((res) => res.data));
  }

  checkMcpServerConfig(serverId: string): Observable<CodexMcpServerCheckResponse> {
    return this.http.post<BaseResponse<CodexMcpServerCheckResponse>>(`${this.apiUrl}/mcp-server-configs/${serverId}/check`, {}).pipe(map((res) => res.data));
  }

  getMcpServerConfigTools(serverId: string): Observable<CodexMcpToolResponse[]> {
    return this.http.get<BaseResponse<CodexMcpToolResponse[]>>(`${this.apiUrl}/mcp-server-configs/${serverId}/tools`).pipe(map((res) => res.data ?? []));
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

  listChatSessions(filters: { agentId?: string; requestedByUserId?: string; status?: string; keyword?: string } = {}): Observable<CodexChatSessionResponse[]> {
    const params = Object.entries(filters).reduce<Record<string, string>>((result, [key, value]) => {
      if (value === undefined || value === null || value === '') {
        return result;
      }
      result[key] = String(value);
      return result;
    }, {});

    return this.http.get<BaseResponse<CodexChatSessionResponse[]>>(`${this.apiUrl}/chat-sessions`, { params }).pipe(map((res) => res.data ?? []));
  }

  getChatSession(sessionId: string): Observable<CodexChatSessionResponse> {
    return this.http.get<BaseResponse<CodexChatSessionResponse>>(`${this.apiUrl}/chat-sessions/${sessionId}`).pipe(map((res) => res.data));
  }

  startChatSession(payload: CodexChatSessionStartRequest): Observable<CodexChatSessionResponse> {
    return this.http.post<BaseResponse<CodexChatSessionResponse>>(`${this.apiUrl}/chat-sessions`, payload).pipe(map((res) => res.data));
  }

  appendChatMessage(sessionId: string, payload: CodexChatMessageRequest): Observable<CodexChatSessionResponse> {
    return this.http.post<BaseResponse<CodexChatSessionResponse>>(`${this.apiUrl}/chat-sessions/${sessionId}/messages`, payload).pipe(map((res) => res.data));
  }
}
