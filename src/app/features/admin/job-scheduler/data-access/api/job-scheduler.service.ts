import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../../../enviroment/environment';
import { BasePageResponse, BaseResponse, normalizeBasePageResponse } from '../../../../../core/models/base-response.model';
import {
  JobAuthTypesResponse,
  JobConfigPageResponse,
  JobConfigResponse,
  JobConfigUpsertDto,
  JobRunNowResponse,
  JobRunPageResponse,
  JobRunResponse
} from '../models/job-scheduler.model';

@Injectable({ providedIn: 'root' })
export class JobSchedulerService {
  private readonly apiUrl = `${environment.apiUrl.jobSchedulerAdminUrl}/job-configs`;

  constructor(private readonly http: HttpClient) {}

  getAuthTypes(): Observable<JobAuthTypesResponse> {
    return this.http.get<BaseResponse<JobAuthTypesResponse>>(`${this.apiUrl}/auth-types`).pipe(
      map((res) => res.data ?? { authTypes: [] })
    );
  }

  getPage(page = 0, size = 10, filters: Record<string, any> = {}): Observable<JobConfigPageResponse> {
    const params = this.toParams({ page, size, ...filters });
    return this.http.get<BaseResponse<BasePageResponse<JobConfigResponse>>>(this.apiUrl, { params }).pipe(
      map((res) => normalizeBasePageResponse(res.data, page, size))
    );
  }

  getByCode(code: string): Observable<JobConfigResponse> {
    return this.http.get<BaseResponse<{ jobConfig: JobConfigResponse }>>(`${this.apiUrl}/${encodeURIComponent(code)}`).pipe(
      map((res) => res.data.jobConfig)
    );
  }

  create(payload: JobConfigUpsertDto): Observable<JobConfigResponse> {
    return this.http.post<BaseResponse<{ jobConfig: JobConfigResponse }>>(this.apiUrl, payload).pipe(
      map((res) => res.data.jobConfig)
    );
  }

  update(code: string, payload: JobConfigUpsertDto): Observable<JobConfigResponse> {
    return this.http.put<BaseResponse<{ jobConfig: JobConfigResponse }>>(`${this.apiUrl}/${encodeURIComponent(code)}`, payload).pipe(
      map((res) => res.data.jobConfig)
    );
  }

  enable(code: string): Observable<JobConfigResponse> {
    return this.http.patch<BaseResponse<{ jobConfig: JobConfigResponse }>>(`${this.apiUrl}/${encodeURIComponent(code)}/enable`, {}).pipe(
      map((res) => res.data.jobConfig)
    );
  }

  disable(code: string): Observable<JobConfigResponse> {
    return this.http.patch<BaseResponse<{ jobConfig: JobConfigResponse }>>(`${this.apiUrl}/${encodeURIComponent(code)}/disable`, {}).pipe(
      map((res) => res.data.jobConfig)
    );
  }

  delete(code: string): Observable<JobConfigResponse> {
    return this.http.delete<BaseResponse<{ jobConfig: JobConfigResponse }>>(`${this.apiUrl}/${encodeURIComponent(code)}`).pipe(
      map((res) => res.data.jobConfig)
    );
  }

  runNow(code: string): Observable<JobRunNowResponse> {
    return this.http.post<BaseResponse<JobRunNowResponse>>(`${this.apiUrl}/${encodeURIComponent(code)}/run-now`, {}).pipe(
      map((res) => res.data)
    );
  }

  getRuns(code: string, page = 0, size = 10, filters: Record<string, any> = {}): Observable<JobRunPageResponse> {
    const params = this.toParams({ page, size, ...filters });
    return this.http.get<BaseResponse<BasePageResponse<JobRunResponse>>>(`${this.apiUrl}/${encodeURIComponent(code)}/runs`, { params }).pipe(
      map((res) => normalizeBasePageResponse(res.data, page, size))
    );
  }

  private toParams(values: Record<string, any>): HttpParams {
    let params = new HttpParams();
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return params;
  }
}
