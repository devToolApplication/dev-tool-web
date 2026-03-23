import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../enviroment/environment';
import { BasePageResponse, BaseResponse } from '../../models/base-response.model';
import { AiAgentConfigCreateDto, AiAgentConfigResponse, AiAgentConfigUpdateDto } from '../../models/ai-agent/ai-agent-config.model';

@Injectable({ providedIn: 'root' })
export class AiAgentConfigService {
  private readonly apiUrl = `${environment.apiUrl.adminAiGenerator}/ai-agent-configs`;

  constructor(private readonly http: HttpClient) {}

  getAll(filters: Record<string, any> = {}): Observable<AiAgentConfigResponse[]> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<BaseResponse<AiAgentConfigResponse[]>>(this.apiUrl, { params }).pipe(map((res) => res.data ?? []));
  }

  getPage(
    page = 0,
    size = 10,
    sort: string[] = ['category,asc', 'key,asc'],
    filters: Record<string, any> = {}
  ): Observable<BasePageResponse<AiAgentConfigResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    sort.forEach((item) => (params = params.append('sort', item)));
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<BaseResponse<BasePageResponse<AiAgentConfigResponse>>>(`${this.apiUrl}/page`, { params }).pipe(
      map((res) => res.data ?? { data: [], metadata: { pageNumber: page, pageSize: size, totalElements: 0, totalPages: 0 } })
    );
  }

  getById(id: string): Observable<AiAgentConfigResponse> {
    return this.http.get<BaseResponse<AiAgentConfigResponse>>(`${this.apiUrl}/${id}`).pipe(map((res) => res.data));
  }

  create(payload: AiAgentConfigCreateDto): Observable<AiAgentConfigResponse> {
    return this.http.post<BaseResponse<AiAgentConfigResponse>>(this.apiUrl, payload).pipe(map((res) => res.data));
  }

  update(id: string, payload: AiAgentConfigUpdateDto): Observable<AiAgentConfigResponse> {
    return this.http.put<BaseResponse<AiAgentConfigResponse>>(`${this.apiUrl}/${id}`, payload).pipe(map((res) => res.data));
  }

  delete(id: string): Observable<AiAgentConfigResponse> {
    return this.http.delete<BaseResponse<AiAgentConfigResponse>>(`${this.apiUrl}/${id}`).pipe(map((res) => res.data));
  }
}
