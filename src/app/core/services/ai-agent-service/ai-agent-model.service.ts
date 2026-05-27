import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../enviroment/environment';
import { BasePageResponse, BaseResponse, normalizePageMetadata } from '../../models/base-response.model';
import { AiAgentModelConfigRequest, AiAgentModelConfigResponse } from '../../models/ai-agent/ai-agent-model.model';

@Injectable({ providedIn: 'root' })
export class AiAgentModelConfigService {
  private readonly apiUrl = `${environment.apiUrl.adminAiGenerator}/ai-agent-models`;

  constructor(private readonly http: HttpClient) {}

  getAll(filters: Record<string, any> = {}): Observable<AiAgentModelConfigResponse[]> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<BaseResponse<AiAgentModelConfigResponse[]>>(this.apiUrl, { params }).pipe(
      map((res) => res.data ?? [])
    );
  }

  getPage(
    page = 0,
    size = 10,
    sort: string[] = ['name,asc'],
    filters: Record<string, any> = {}
  ): Observable<BasePageResponse<AiAgentModelConfigResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    sort.forEach((item) => (params = params.append('sort', item)));
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<BaseResponse<BasePageResponse<AiAgentModelConfigResponse>>>(`${this.apiUrl}/page`, { params }).pipe(
      map((res) => ({
        data: res.data?.data ?? [],
        metadata: normalizePageMetadata(res.data?.metadata, page, size)
      }))
    );
  }

  getById(id: string): Observable<AiAgentModelConfigResponse> {
    return this.http.get<BaseResponse<AiAgentModelConfigResponse>>(`${this.apiUrl}/${id}`).pipe(
      map((res) => res.data)
    );
  }

  create(payload: AiAgentModelConfigRequest): Observable<AiAgentModelConfigResponse> {
    return this.http.post<BaseResponse<AiAgentModelConfigResponse>>(this.apiUrl, payload).pipe(
      map((res) => res.data)
    );
  }

  update(id: string, payload: AiAgentModelConfigRequest): Observable<AiAgentModelConfigResponse> {
    return this.http.put<BaseResponse<AiAgentModelConfigResponse>>(`${this.apiUrl}/${id}`, payload).pipe(
      map((res) => res.data)
    );
  }

  delete(id: string): Observable<AiAgentModelConfigResponse> {
    return this.http.delete<BaseResponse<AiAgentModelConfigResponse>>(`${this.apiUrl}/${id}`).pipe(
      map((res) => res.data)
    );
  }

  updateStatus(id: string, status: string): Observable<AiAgentModelConfigResponse> {
    const params = new HttpParams().set('status', status);
    return this.http.put<BaseResponse<AiAgentModelConfigResponse>>(`${this.apiUrl}/${id}/status`, null, { params }).pipe(
      map((res) => res.data)
    );
  }
}
