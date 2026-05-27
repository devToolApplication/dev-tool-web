import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../enviroment/environment';
import { BasePageResponse, BaseResponse, normalizePageMetadata } from '../../models/base-response.model';
import { AiAgentCrawlerConfigRequest, AiAgentCrawlerConfigResponse, AiAgentCrawlerTestRunRequest, AiAgentCrawlerTestRunResponse } from '../../models/ai-agent/ai-agent-crawler.model';

@Injectable({ providedIn: 'root' })
export class AiAgentCrawlerConfigService {
  private readonly apiUrl = `${environment.apiUrl.adminAiGenerator}/ai-agent-crawlers`;

  constructor(private readonly http: HttpClient) {}

  getAll(filters: Record<string, any> = {}): Observable<AiAgentCrawlerConfigResponse[]> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<BaseResponse<AiAgentCrawlerConfigResponse[]>>(this.apiUrl, { params }).pipe(
      map((res) => res.data ?? [])
    );
  }

  getPage(
    page = 0,
    size = 10,
    sort: string[] = ['name,asc'],
    filters: Record<string, any> = {}
  ): Observable<BasePageResponse<AiAgentCrawlerConfigResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    sort.forEach((item) => (params = params.append('sort', item)));
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<BaseResponse<BasePageResponse<AiAgentCrawlerConfigResponse>>>(`${this.apiUrl}/page`, { params }).pipe(
      map((res) => ({
        data: res.data?.data ?? [],
        metadata: normalizePageMetadata(res.data?.metadata, page, size)
      }))
    );
  }

  getById(id: string): Observable<AiAgentCrawlerConfigResponse> {
    return this.http.get<BaseResponse<AiAgentCrawlerConfigResponse>>(`${this.apiUrl}/${id}`).pipe(
      map((res) => res.data)
    );
  }

  create(payload: AiAgentCrawlerConfigRequest): Observable<AiAgentCrawlerConfigResponse> {
    return this.http.post<BaseResponse<AiAgentCrawlerConfigResponse>>(this.apiUrl, payload).pipe(
      map((res) => res.data)
    );
  }

  update(id: string, payload: AiAgentCrawlerConfigRequest): Observable<AiAgentCrawlerConfigResponse> {
    return this.http.put<BaseResponse<AiAgentCrawlerConfigResponse>>(`${this.apiUrl}/${id}`, payload).pipe(
      map((res) => res.data)
    );
  }

  delete(id: string): Observable<AiAgentCrawlerConfigResponse> {
    return this.http.delete<BaseResponse<AiAgentCrawlerConfigResponse>>(`${this.apiUrl}/${id}`).pipe(
      map((res) => res.data)
    );
  }

  updateStatus(id: string, status: string): Observable<AiAgentCrawlerConfigResponse> {
    const params = new HttpParams().set('status', status);
    return this.http.put<BaseResponse<AiAgentCrawlerConfigResponse>>(`${this.apiUrl}/${id}/status`, null, { params }).pipe(
      map((res) => res.data)
    );
  }

  testRun(id: string, payload: AiAgentCrawlerTestRunRequest): Observable<AiAgentCrawlerTestRunResponse> {
    return this.http.post<BaseResponse<AiAgentCrawlerTestRunResponse>>(`${this.apiUrl}/${id}/test-run`, payload).pipe(
      map((res) => res.data)
    );
  }
}
