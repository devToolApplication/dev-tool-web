import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { BasePageResponse, BaseResponse } from '@core/http/base-response.model';
import { environment } from '../../../../enviroment/environment';
import {
  WorkflowDetailDto,
  WorkflowRunDto,
  WorkflowStartDto,
  WorkflowValidationResponseDto,
} from '../model/workflow-studio.dto';
import {
  WorkflowBackendValidationResult,
  WorkflowAgentCatalogItem,
  WorkflowDefinition,
  WorkflowDetail,
  WorkflowOutputSchemaCatalogItem,
  WorkflowPageQuery,
  WorkflowRun,
  WorkflowUpsertPayload,
} from '../model/workflow-studio.model';
import {
  mapWorkflowDetailDto,
  mapWorkflowRunDto,
  mapWorkflowUpsertPayloadToDto,
  mapWorkflowValidationResponseDto,
} from '../model/workflow-studio.mapper';

@Injectable({ providedIn: 'root' })
export class WorkflowApiService {
  private readonly adminBaseUrl = environment.apiUrl.adminAiGenerator;
  private readonly baseUrl = `${this.adminBaseUrl}/workflows`;

  constructor(private readonly http: HttpClient) {}

  getAgents(): Observable<WorkflowAgentCatalogItem[]> {
    return this.http
      .get<BaseResponse<WorkflowAgentCatalogItem[]>>(`${this.adminBaseUrl}/ai-agents`)
      .pipe(map((response) => response.data ?? []));
  }

  getAiGateOutputSchemas(): Observable<WorkflowOutputSchemaCatalogItem[]> {
    return this.http
      .get<BaseResponse<WorkflowOutputSchemaCatalogItem[]>>(`${this.adminBaseUrl}/ai-gate-output-schemas`)
      .pipe(map((response) => response.data ?? []));
  }

  getWorkflowPage(query: WorkflowPageQuery = {}): Observable<BasePageResponse<WorkflowDefinition>> {
    return this.http
      .get<BaseResponse<BasePageResponse<WorkflowDefinition>>>(`${this.baseUrl}/page`, {
        params: this.pageParams(query),
      })
      .pipe(map((response) => response.data));
  }

  getWorkflowDetail(workflowId: string): Observable<WorkflowDetail> {
    return this.http
      .get<BaseResponse<WorkflowDetailDto>>(`${this.baseUrl}/${workflowId}`)
      .pipe(map((response) => mapWorkflowDetailDto(response.data)));
  }

  createWorkflow(payload: WorkflowUpsertPayload): Observable<WorkflowDetail> {
    return this.http
      .post<BaseResponse<WorkflowDetailDto>>(this.baseUrl, mapWorkflowUpsertPayloadToDto(payload))
      .pipe(map((response) => mapWorkflowDetailDto(response.data)));
  }

  updateWorkflow(workflowId: string, payload: WorkflowUpsertPayload): Observable<WorkflowDetail> {
    return this.http
      .put<BaseResponse<WorkflowDetailDto>>(`${this.baseUrl}/${workflowId}`, mapWorkflowUpsertPayloadToDto(payload))
      .pipe(map((response) => mapWorkflowDetailDto(response.data)));
  }

  validateWorkflow(payload: WorkflowUpsertPayload): Observable<WorkflowBackendValidationResult> {
    return this.http
      .post<BaseResponse<WorkflowValidationResponseDto>>(`${this.baseUrl}/validate`, mapWorkflowUpsertPayloadToDto(payload))
      .pipe(map((response) => mapWorkflowValidationResponseDto(response.data)));
  }

  publishWorkflow(workflowId: string): Observable<WorkflowDetail> {
    return this.http
      .post<BaseResponse<WorkflowDetailDto>>(`${this.baseUrl}/${workflowId}/publish`, null)
      .pipe(map((response) => mapWorkflowDetailDto(response.data)));
  }

  startWorkflow(workflowId: string, input: WorkflowStartDto['input']): Observable<WorkflowRun> {
    return this.http
      .post<BaseResponse<WorkflowRunDto>>(`${this.baseUrl}/${workflowId}/start`, { input })
      .pipe(map((response) => mapWorkflowRunDto(response.data)));
  }

  getRunPage(query: WorkflowPageQuery = {}): Observable<BasePageResponse<WorkflowRun>> {
    return this.http
      .get<BaseResponse<BasePageResponse<WorkflowRunDto>>>(`${this.baseUrl}/runs/page`, {
        params: this.pageParams(query),
      })
      .pipe(map((response) => ({
        ...response.data,
        data: response.data.data.map(mapWorkflowRunDto),
      })));
  }

  getRun(runId: string): Observable<WorkflowRun> {
    return this.http
      .get<BaseResponse<WorkflowRunDto>>(`${this.baseUrl}/runs/${runId}`)
      .pipe(map((response) => mapWorkflowRunDto(response.data)));
  }

  retryRun(runId: string): Observable<WorkflowRun> {
    return this.http
      .post<BaseResponse<WorkflowRunDto>>(`${this.baseUrl}/runs/${runId}/retry`, null)
      .pipe(map((response) => mapWorkflowRunDto(response.data)));
  }

  private pageParams(query: WorkflowPageQuery): HttpParams {
    let params = new HttpParams();

    if (query.page !== undefined) {
      params = params.set('page', query.page);
    }
    if (query.size !== undefined) {
      params = params.set('size', query.size);
    }
    (query.sort ?? []).forEach((sort) => {
      params = params.append('sort', sort);
    });
    if (query.workflowId) {
      params = params.set('workflowId', query.workflowId);
    }
    if (query.status) {
      params = params.set('status', query.status);
    }

    return params;
  }
}
