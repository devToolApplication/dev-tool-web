import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../enviroment/environment';
import { BasePageResponse, BaseResponse, normalizePageMetadata } from '../../models/base-response.model';
import {
  AiAgentWorkflowRunResponse,
  AiAgentWorkflowRunSubmitRequest,
  AiAgentExecutionEventResponse,
  AiAgentWorkflowResultResponse,
  AiAgentReviewDecisionRequest
} from '../../models/ai-agent/ai-agent-workflow-run.model';

@Injectable({ providedIn: 'root' })
export class AiAgentWorkflowRunService {
  private readonly apiUrl = `${environment.apiUrl.adminAiGenerator}/ai-agent-workflow-runs`;

  constructor(private readonly http: HttpClient) {}

  submit(payload: AiAgentWorkflowRunSubmitRequest): Observable<AiAgentWorkflowRunResponse> {
    return this.http.post<BaseResponse<AiAgentWorkflowRunResponse>>(this.apiUrl, payload).pipe(
      map((res) => res.data)
    );
  }

  getById(runId: string): Observable<AiAgentWorkflowRunResponse> {
    return this.http.get<BaseResponse<AiAgentWorkflowRunResponse>>(`${this.apiUrl}/${runId}`).pipe(
      map((res) => res.data)
    );
  }

  getEvents(runId: string): Observable<AiAgentExecutionEventResponse[]> {
    return this.http.get<BaseResponse<AiAgentExecutionEventResponse[]>>(`${this.apiUrl}/${runId}/events`).pipe(
      map((res) => res.data ?? [])
    );
  }

  getResult(runId: string): Observable<AiAgentWorkflowResultResponse> {
    return this.http.get<BaseResponse<AiAgentWorkflowResultResponse>>(`${this.apiUrl}/${runId}/result`).pipe(
      map((res) => res.data)
    );
  }

  submitReviewDecision(runId: string, payload: AiAgentReviewDecisionRequest): Observable<AiAgentWorkflowRunResponse> {
    return this.http.post<BaseResponse<AiAgentWorkflowRunResponse>>(`${this.apiUrl}/${runId}/review-decisions`, payload).pipe(
      map((res) => res.data)
    );
  }

  getPage(
    page = 0,
    size = 20,
    sort: string[] = ['createdAt,desc'],
    filters: Record<string, any> = {}
  ): Observable<BasePageResponse<AiAgentWorkflowRunResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    sort.forEach((item) => (params = params.append('sort', item)));
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<BaseResponse<BasePageResponse<AiAgentWorkflowRunResponse>>>(`${this.apiUrl}/page`, { params }).pipe(
      map((res) => ({
        data: res.data?.data ?? [],
        metadata: normalizePageMetadata(res.data?.metadata, page, size)
      }))
    );
  }

  cancel(runId: string): Observable<AiAgentWorkflowRunResponse> {
    return this.http.post<BaseResponse<AiAgentWorkflowRunResponse>>(`${this.apiUrl}/${runId}/cancel`, {}).pipe(
      map((res) => res.data)
    );
  }
}
