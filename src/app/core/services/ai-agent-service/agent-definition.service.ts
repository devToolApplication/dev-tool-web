import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../enviroment/environment';
import { AgentDefinitionCreateDto, AgentDefinitionResponse, AgentDefinitionUpdateDto } from '../../models/ai-agent/agent-definition.model';
import { BasePageResponse, BaseResponse, normalizePageMetadata } from '../../models/base-response.model';

@Injectable({ providedIn: 'root' })
export class AgentDefinitionService {
  private readonly apiUrl = `${environment.apiUrl.adminAiGenerator}/agent-definitions`;

  constructor(private readonly http: HttpClient) {}

  getAll(filters: Record<string, any> = {}): Observable<AgentDefinitionResponse[]> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<BaseResponse<AgentDefinitionResponse[]>>(this.apiUrl, { params }).pipe(map((res) => res.data ?? []));
  }

  getPage(
    page = 0,
    size = 10,
    sort: string[] = ['name,asc'],
    filters: Record<string, any> = {}
  ): Observable<BasePageResponse<AgentDefinitionResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    sort.forEach((item) => (params = params.append('sort', item)));
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<BaseResponse<BasePageResponse<AgentDefinitionResponse>>>(`${this.apiUrl}/page`, { params }).pipe(
      map((res) => ({
        data: res.data?.data ?? [],
        metadata: normalizePageMetadata(res.data?.metadata, page, size)
      }))
    );
  }

  getById(id: string): Observable<AgentDefinitionResponse> {
    return this.http.get<BaseResponse<AgentDefinitionResponse>>(`${this.apiUrl}/${id}`).pipe(map((res) => res.data));
  }

  create(payload: AgentDefinitionCreateDto): Observable<AgentDefinitionResponse> {
    return this.http.post<BaseResponse<AgentDefinitionResponse>>(this.apiUrl, payload).pipe(map((res) => res.data));
  }

  update(id: string, payload: AgentDefinitionUpdateDto): Observable<AgentDefinitionResponse> {
    return this.http.put<BaseResponse<AgentDefinitionResponse>>(`${this.apiUrl}/${id}`, payload).pipe(map((res) => res.data));
  }

  delete(id: string): Observable<AgentDefinitionResponse> {
    return this.http.delete<BaseResponse<AgentDefinitionResponse>>(`${this.apiUrl}/${id}`).pipe(map((res) => res.data));
  }
}
