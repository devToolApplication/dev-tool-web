import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../enviroment/environment';
import {
  CodexAgentAuthStatusResponse,
  CodexAgentCreateDto,
  CodexAgentDeviceLoginSessionResponse,
  CodexAgentHomeSyncResponse,
  CodexAgentOptionsResponse,
  CodexAgentResponse,
  CodexAgentUpdateDto
} from '../../models/codex-agent/codex-agent.model';
import { BasePageResponse, BaseResponse, normalizePageMetadata } from '../../models/base-response.model';

@Injectable({ providedIn: 'root' })
export class CodexAgentService {
  private readonly apiUrl = `${environment.apiUrl.adminAiGenerator}/codex-agent/agents`;

  constructor(private readonly http: HttpClient) {}

  getOptions(): Observable<CodexAgentOptionsResponse> {
    return this.http.get<BaseResponse<CodexAgentOptionsResponse>>(`${this.apiUrl}/options`).pipe(map((res) => res.data));
  }

  getAll(filters: Record<string, any> = {}): Observable<CodexAgentResponse[]> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<BaseResponse<CodexAgentResponse[]>>(this.apiUrl, { params }).pipe(map((res) => res.data ?? []));
  }

  getPage(
    page = 0,
    size = 10,
    sort: string[] = ['name,asc'],
    filters: Record<string, any> = {}
  ): Observable<BasePageResponse<CodexAgentResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    sort.forEach((item) => (params = params.append('sort', item)));
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<BaseResponse<BasePageResponse<CodexAgentResponse>>>(`${this.apiUrl}/page`, { params }).pipe(
      map((res) => ({
        data: res.data?.data ?? [],
        metadata: normalizePageMetadata(res.data?.metadata, page, size)
      }))
    );
  }

  getById(id: string): Observable<CodexAgentResponse> {
    return this.http.get<BaseResponse<CodexAgentResponse>>(`${this.apiUrl}/${id}`).pipe(map((res) => res.data));
  }

  create(payload: CodexAgentCreateDto): Observable<CodexAgentResponse> {
    return this.http.post<BaseResponse<CodexAgentResponse>>(this.apiUrl, payload).pipe(map((res) => res.data));
  }

  update(id: string, payload: CodexAgentUpdateDto): Observable<CodexAgentResponse> {
    return this.http.put<BaseResponse<CodexAgentResponse>>(`${this.apiUrl}/${id}`, payload).pipe(map((res) => res.data));
  }

  delete(id: string): Observable<CodexAgentResponse> {
    return this.http.delete<BaseResponse<CodexAgentResponse>>(`${this.apiUrl}/${id}`).pipe(map((res) => res.data));
  }

  syncHome(id: string): Observable<CodexAgentHomeSyncResponse> {
    return this.http.post<BaseResponse<CodexAgentHomeSyncResponse>>(`${this.apiUrl}/${id}/sync-home`, {}).pipe(map((res) => res.data));
  }

  getAuthStatus(id: string): Observable<CodexAgentAuthStatusResponse> {
    return this.http.get<BaseResponse<CodexAgentAuthStatusResponse>>(`${this.apiUrl}/${id}/auth-status`).pipe(map((res) => res.data));
  }

  startDeviceLogin(id: string): Observable<CodexAgentDeviceLoginSessionResponse> {
    return this.http.post<BaseResponse<CodexAgentDeviceLoginSessionResponse>>(`${this.apiUrl}/${id}/auth/device`, {}).pipe(map((res) => res.data));
  }

  getDeviceLoginSession(id: string, sessionId: string): Observable<CodexAgentDeviceLoginSessionResponse> {
    return this.http.get<BaseResponse<CodexAgentDeviceLoginSessionResponse>>(`${this.apiUrl}/${id}/auth/device/${sessionId}`).pipe(map((res) => res.data));
  }
}
