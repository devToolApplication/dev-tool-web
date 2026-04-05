import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../enviroment/environment';
import { BasePageResponse, BaseResponse, normalizePageMetadata } from '../../models/base-response.model';
import { AiAgentSecretCreateDto, AiAgentSecretResponse, AiAgentSecretUpdateDto } from '../../models/ai-agent/ai-agent-secret.model';

@Injectable({ providedIn: 'root' })
export class AiAgentSecretService {
  private readonly apiUrl = `${environment.apiUrl.adminAiGenerator}/ai-agent-secrets`;

  constructor(private readonly http: HttpClient) {}

  getAll(filters: Record<string, any> = {}): Observable<AiAgentSecretResponse[]> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<BaseResponse<AiAgentSecretResponse[]>>(this.apiUrl, { params }).pipe(map((res) => res.data ?? []));
  }

  getPage(
    page = 0,
    size = 10,
    sort: string[] = ['category,asc', 'code,asc'],
    filters: Record<string, any> = {}
  ): Observable<BasePageResponse<AiAgentSecretResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    sort.forEach((item) => (params = params.append('sort', item)));
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<BaseResponse<BasePageResponse<AiAgentSecretResponse>>>(`${this.apiUrl}/page`, { params }).pipe(
      map((res) => ({
        data: res.data?.data ?? [],
        metadata: normalizePageMetadata(res.data?.metadata, page, size)
      }))
    );
  }

  getById(id: string): Observable<AiAgentSecretResponse> {
    return this.http.get<BaseResponse<AiAgentSecretResponse>>(`${this.apiUrl}/${id}`).pipe(map((res) => res.data));
  }

  create(payload: AiAgentSecretCreateDto): Observable<AiAgentSecretResponse> {
    return this.http.post<BaseResponse<AiAgentSecretResponse>>(this.apiUrl, payload).pipe(map((res) => res.data));
  }

  update(id: string, payload: AiAgentSecretUpdateDto): Observable<AiAgentSecretResponse> {
    return this.http.put<BaseResponse<AiAgentSecretResponse>>(`${this.apiUrl}/${id}`, payload).pipe(map((res) => res.data));
  }

  delete(id: string): Observable<AiAgentSecretResponse> {
    return this.http.delete<BaseResponse<AiAgentSecretResponse>>(`${this.apiUrl}/${id}`).pipe(map((res) => res.data));
  }
}
