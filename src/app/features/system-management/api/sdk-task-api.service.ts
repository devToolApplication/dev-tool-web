import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { BaseResponse } from '@core/http/base-response.model';
import { environment } from '../../../../enviroment/environment';
import type {
  SdkTaskRunDetail,
  SdkTaskRunListQuery,
  SdkTaskRunListResponse,
  SdkTaskRunRequest,
  SdkTaskRunSummary,
} from '../model/sdk-task.model';

@Injectable({ providedIn: 'root' })
export class SdkTaskApiService {
  private readonly baseUrl = `${environment.apiUrl.adminAiGenerator}/sdk/tasks`;

  constructor(private readonly http: HttpClient) {}

  startRun(payload: SdkTaskRunRequest): Observable<SdkTaskRunSummary> {
    return this.http
      .post<BaseResponse<SdkTaskRunSummary>>(`${this.baseUrl}/runs`, payload)
      .pipe(map((response) => response.data));
  }

  listRuns(query: SdkTaskRunListQuery = {}): Observable<SdkTaskRunListResponse> {
    return this.http
      .get<BaseResponse<SdkTaskRunListResponse>>(`${this.baseUrl}/runs`, {
        params: this.queryParams(query),
      })
      .pipe(map((response) => response.data ?? { items: [], page: 1, size: 20, total: 0 }));
  }

  getRun(taskId: string): Observable<SdkTaskRunDetail> {
    return this.http
      .get<BaseResponse<SdkTaskRunDetail>>(`${this.baseUrl}/runs/${encodeURIComponent(taskId)}`)
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
