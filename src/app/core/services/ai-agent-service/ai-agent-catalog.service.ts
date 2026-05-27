import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../enviroment/environment';
import { BasePageResponse, BaseResponse, normalizePageMetadata } from '../../models/base-response.model';
import { AiAgentAgentConfigRequest, AiAgentAgentConfigResponse } from '../../models/ai-agent/ai-agent-catalog.model';

@Injectable({ providedIn: 'root' })
export class AiAgentAgentConfigService {
  private readonly apiUrl = `${environment.apiUrl.adminAiGenerator}/ai-agent-catalogs`;

  constructor(private readonly http: HttpClient) {}

  getAll(filters: Record<string, any> = {}): Observable<AiAgentAgentConfigResponse[]> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<BaseResponse<AiAgentAgentConfigResponse[]>>(this.apiUrl, { params }).pipe(
      map((res) => res.data ?? [])
    );
  }

  getPage(
    page = 0,
    size = 10,
    sort: string[] = ['name,asc'],
    filters: Record<string, any> = {}
  ): Observable<BasePageResponse<AiAgentAgentConfigResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    sort.forEach((item) => (params = params.append('sort', item)));
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<BaseResponse<BasePageResponse<AiAgentAgentConfigResponse>>>(`${this.apiUrl}/page`, { params }).pipe(
      map((res) => ({
        data: res.data?.data ?? [],
        metadata: normalizePageMetadata(res.data?.metadata, page, size)
      }))
    );
  }

  getById(id: string): Observable<AiAgentAgentConfigResponse> {
    return this.http.get<BaseResponse<AiAgentAgentConfigResponse>>(`${this.apiUrl}/${id}`).pipe(
      map((res) => res.data)
    );
  }

  create(payload: AiAgentAgentConfigRequest): Observable<AiAgentAgentConfigResponse> {
    return this.http.post<BaseResponse<AiAgentAgentConfigResponse>>(this.apiUrl, payload).pipe(
      map((res) => res.data)
    );
  }

  update(id: string, payload: AiAgentAgentConfigRequest): Observable<AiAgentAgentConfigResponse> {
    return this.http.put<BaseResponse<AiAgentAgentConfigResponse>>(`${this.apiUrl}/${id}`, payload).pipe(
      map((res) => res.data)
    );
  }

  delete(id: string): Observable<AiAgentAgentConfigResponse> {
    return this.http.delete<BaseResponse<AiAgentAgentConfigResponse>>(`${this.apiUrl}/${id}`).pipe(
      map((res) => res.data)
    );
  }

  updateStatus(id: string, status: string): Observable<AiAgentAgentConfigResponse> {
    const params = new HttpParams().set('status', status);
    return this.http.put<BaseResponse<AiAgentAgentConfigResponse>>(`${this.apiUrl}/${id}/status`, null, { params }).pipe(
      map((res) => res.data)
    );
  }
}
