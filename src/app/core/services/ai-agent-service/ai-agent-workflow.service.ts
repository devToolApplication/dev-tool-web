import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../enviroment/environment';
import { BasePageResponse, BaseResponse, normalizePageMetadata } from '../../models/base-response.model';
import {
  AiAgentWorkflowDefinitionRequest,
  AiAgentWorkflowDefinitionResponse,
  AiAgentWorkflowGraphDraftRequest,
  AiAgentWorkflowGraphDraftResponse,
  AiAgentWorkflowPublishResponse,
  AiAgentWorkflowValidationResponse
} from '../../models/ai-agent/ai-agent-workflow.model';

@Injectable({ providedIn: 'root' })
export class AiAgentWorkflowService {
  private readonly apiUrl = `${environment.apiUrl.adminAiGenerator}/ai-agent-workflows`;

  constructor(private readonly http: HttpClient) {}

  getAll(status?: string): Observable<AiAgentWorkflowDefinitionResponse[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<BaseResponse<AiAgentWorkflowDefinitionResponse[]>>(this.apiUrl, { params }).pipe(
      map((res) => res.data ?? [])
    );
  }

  getPage(
    page = 0,
    size = 10,
    sort: string[] = ['name,asc'],
    filters: Record<string, any> = {}
  ): Observable<BasePageResponse<AiAgentWorkflowDefinitionResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    sort.forEach((item) => (params = params.append('sort', item)));
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<BaseResponse<BasePageResponse<AiAgentWorkflowDefinitionResponse>>>(`${this.apiUrl}/page`, { params }).pipe(
      map((res) => ({
        data: res.data?.data ?? [],
        metadata: normalizePageMetadata(res.data?.metadata, page, size)
      }))
    );
  }

  getById(id: string): Observable<AiAgentWorkflowDefinitionResponse> {
    return this.http.get<BaseResponse<AiAgentWorkflowDefinitionResponse>>(`${this.apiUrl}/${id}`).pipe(
      map((res) => res.data)
    );
  }

  create(payload: AiAgentWorkflowDefinitionRequest): Observable<AiAgentWorkflowDefinitionResponse> {
    return this.http.post<BaseResponse<AiAgentWorkflowDefinitionResponse>>(this.apiUrl, payload).pipe(
      map((res) => res.data)
    );
  }

  update(id: string, payload: AiAgentWorkflowDefinitionRequest): Observable<AiAgentWorkflowDefinitionResponse> {
    return this.http.put<BaseResponse<AiAgentWorkflowDefinitionResponse>>(`${this.apiUrl}/${id}`, payload).pipe(
      map((res) => res.data)
    );
  }

  updateDraftGraph(id: string, payload: AiAgentWorkflowGraphDraftRequest): Observable<AiAgentWorkflowDefinitionResponse> {
    return this.http.put<BaseResponse<AiAgentWorkflowDefinitionResponse>>(`${this.apiUrl}/${id}/draft-graph`, payload).pipe(
      map((res) => res.data)
    );
  }

  validate(id: string): Observable<AiAgentWorkflowValidationResponse> {
    return this.http.post<BaseResponse<AiAgentWorkflowValidationResponse>>(`${this.apiUrl}/${id}/validate`, {}).pipe(
      map((res) => res.data)
    );
  }

  publish(id: string): Observable<AiAgentWorkflowPublishResponse> {
    return this.http.post<BaseResponse<AiAgentWorkflowPublishResponse>>(`${this.apiUrl}/${id}/publish`, {}).pipe(
      map((res) => res.data)
    );
  }

  getDraftGraph(id: string): Observable<AiAgentWorkflowGraphDraftResponse> {
    return this.http.get<BaseResponse<AiAgentWorkflowGraphDraftResponse>>(`${this.apiUrl}/${id}/draft-graph`).pipe(
      map((res) => res.data)
    );
  }
}
