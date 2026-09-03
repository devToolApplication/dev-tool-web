import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { BaseResponse } from '@core/http/base-response.model';
import { environment } from '../../../../enviroment/environment';
import type {
  SdkAgentCatalogItem,
  SdkAgentHealthResponse,
  SdkServiceHealthResponse,
  SdkTaskExecuteRequest,
  SdkTaskRunDetail,
  SdkTaskRunListQuery,
  SdkTaskRunListResponse,
  SdkTaskRunSummary,
} from '../model/sdk-management.model';

@Injectable({ providedIn: 'root' })
export class SdkAdminApiService {
  private readonly adminBaseUrl = `${environment.apiUrl.adminAiGenerator}`;

  constructor(private readonly http: HttpClient) {}

  listAgents(): Observable<SdkAgentCatalogItem[]> {
    return this.http
      .get<BaseResponse<SdkAgentCatalogItem[]>>(`${this.adminBaseUrl}/ai-agents`)
      .pipe(map((response) => response.data ?? []));
  }

  checkAgentHealth(
    agentCode: string,
    provider?: string,
    workingDirectory?: string
  ): Observable<SdkAgentHealthResponse> {
    let params = new HttpParams();
    if (provider) {
      params = params.set('provider', provider);
    }
    if (workingDirectory) {
      params = params.set('workingDirectory', workingDirectory);
    }

    return this.http
      .get<BaseResponse<SdkAgentHealthResponse>>(
        `${this.adminBaseUrl}/ai-agents/${encodeURIComponent(agentCode)}/health`,
        { params }
      )
      .pipe(
        map(
          (response) =>
            response.data ?? {
              agentCode,
              provider: 'codex',
              status: 'READY',
              mcp: [],
            }
        )
      );
  }

  getServiceHealth(): Observable<SdkServiceHealthResponse> {
    return this.http
      .get<BaseResponse<SdkServiceHealthResponse>>(`${this.adminBaseUrl}/sdk/health`)
      .pipe(
        map(
          (response) =>
            response.data ?? {
              status: 'UP',
              service: 'codex-sdk-api',
              auth: {},
              codex: {},
              database: {},
            }
        )
      );
  }

  executeTask(payload: SdkTaskExecuteRequest): Observable<SdkTaskRunSummary> {
    return this.http
      .post<BaseResponse<SdkTaskRunSummary>>(`${this.adminBaseUrl}/sdk/tasks/runs`, payload)
      .pipe(map((response) => response.data));
  }

  listTaskRuns(query: SdkTaskRunListQuery = {}): Observable<SdkTaskRunListResponse> {
    return this.http
      .get<BaseResponse<SdkTaskRunListResponse>>(`${this.adminBaseUrl}/sdk/tasks/runs`, {
        params: this.queryParams(query),
      })
      .pipe(map((response) => response.data ?? { items: [], page: 1, size: 20, total: 0 }));
  }

  getTaskRunDetail(taskId: string): Observable<SdkTaskRunDetail> {
    return this.http
      .get<BaseResponse<SdkTaskRunDetail>>(`${this.adminBaseUrl}/sdk/tasks/runs/${encodeURIComponent(taskId)}`)
      .pipe(map((response) => response.data));
  }

  private queryParams(query: SdkTaskRunListQuery): HttpParams {
    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return params;
  }
}