import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../enviroment/environment';
import { BasePageResponse, BaseResponse, normalizePageMetadata } from '../../models/base-response.model';
import { AgentAccountRequest, AgentAccountResponse, DeviceLoginSessionResponse } from '../../models/ai-agent/ai-agent-account.model';

@Injectable({ providedIn: 'root' })
export class AiAgentAccountService {
  private readonly apiUrl = `${environment.apiUrl.adminAiGenerator}/agent-accounts`;

  constructor(private readonly http: HttpClient) {}

  getPage(
    page = 0,
    size = 10,
    sort: string[] = ['code,asc'],
    filters: Record<string, any> = {}
  ): Observable<BasePageResponse<AgentAccountResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    sort.forEach((item) => (params = params.append('sort', item)));
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<BaseResponse<BasePageResponse<AgentAccountResponse>>>(`${this.apiUrl}/page`, { params }).pipe(
      map((res) => ({
        data: res.data?.data ?? [],
        metadata: normalizePageMetadata(res.data?.metadata, page, size)
      }))
    );
  }

  getById(id: string): Observable<AgentAccountResponse> {
    return this.http.get<BaseResponse<AgentAccountResponse>>(`${this.apiUrl}/${id}`).pipe(
      map((res) => res.data)
    );
  }

  create(payload: AgentAccountRequest): Observable<AgentAccountResponse> {
    return this.http.post<BaseResponse<AgentAccountResponse>>(this.apiUrl, payload).pipe(
      map((res) => res.data)
    );
  }

  update(id: string, payload: AgentAccountRequest): Observable<AgentAccountResponse> {
    return this.http.put<BaseResponse<AgentAccountResponse>>(`${this.apiUrl}/${id}`, payload).pipe(
      map((res) => res.data)
    );
  }

  delete(id: string): Observable<AgentAccountResponse> {
    return this.http.delete<BaseResponse<AgentAccountResponse>>(`${this.apiUrl}/${id}`).pipe(
      map((res) => res.data)
    );
  }

  clearRateLimit(id: string): Observable<void> {
    return this.http.post<BaseResponse<void>>(`${this.apiUrl}/${id}/clear-rate-limit`, null).pipe(
      map(() => undefined)
    );
  }

  startLogin(id: string): Observable<DeviceLoginSessionResponse> {
    return this.http.post<BaseResponse<DeviceLoginSessionResponse>>(`${this.apiUrl}/${id}/login`, null).pipe(
      map((res) => res.data)
    );
  }

  pollLoginStatus(id: string, sessionId: string): Observable<DeviceLoginSessionResponse> {
    return this.http.get<BaseResponse<DeviceLoginSessionResponse>>(`${this.apiUrl}/${id}/login/${sessionId}`).pipe(
      map((res) => res.data)
    );
  }
}
