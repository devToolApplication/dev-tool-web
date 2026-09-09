import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BasePageResponse, BaseResponse } from '@core/http/base-response.model';
import { environment } from '../../../../enviroment/environment';
import {
  UserTaskActionRequest,
  UserTaskActionResponse,
  UserTaskDetail,
  UserTaskHistoryItem,
  UserTaskQuery,
  UserTaskSummary,
} from '../models/user-task.model';
import { UserTaskMapper } from './user-task.mapper';

@Injectable({
  providedIn: 'root',
})
export class UserTaskApiService {
  private readonly baseUrl = `${environment.apiUrl.aiGenerator}/user-tasks`;

  constructor(private readonly http: HttpClient) {}

  getTasks(query: UserTaskQuery = {}): Observable<BasePageResponse<UserTaskSummary>> {
    let params = new HttpParams();
    if (query.view) params = params.set('view', query.view);
    if (query.status) params = params.set('status', query.status);
    if (query.keyword) params = params.set('keyword', query.keyword.trim());
    if (query.formKey) params = params.set('formKey', query.formKey);
    if (query.businessKey) params = params.set('businessKey', query.businessKey.trim());
    if (query.dueAfter) params = params.set('dueAfter', query.dueAfter);
    if (query.dueBefore) params = params.set('dueBefore', query.dueBefore);
    if (query.page !== undefined && query.page !== null) params = params.set('page', query.page);
    if (query.size !== undefined && query.size !== null) params = params.set('size', query.size);
    if (query.sort) params = params.set('sort', query.sort);

    return this.http
      .get<BaseResponse<BasePageResponse<UserTaskSummary>>>(this.baseUrl, { params })
      .pipe(
        map((res) => {
          if (res && typeof res === 'object' && 'data' in res) {
            return res.data;
          }
          return res as unknown as BasePageResponse<UserTaskSummary>;
        }),
      );
  }

  getTask(taskId: string): Observable<UserTaskDetail> {
    return this.http
      .get<BaseResponse<UserTaskDetail>>(`${this.baseUrl}/${encodeURIComponent(taskId)}`)
      .pipe(
        map((res) => {
          if (res && typeof res === 'object' && 'data' in res) {
            return UserTaskMapper.toTypedDetail(res.data);
          }
          return UserTaskMapper.toTypedDetail(res as unknown as UserTaskDetail);
        }),
      );
  }

  getTaskHistory(taskId: string): Observable<UserTaskHistoryItem[]> {
    return this.http
      .get<BaseResponse<UserTaskHistoryItem[]>>(`${this.baseUrl}/${encodeURIComponent(taskId)}/history`)
      .pipe(
        map((res) => {
          if (res && typeof res === 'object' && 'data' in res) {
            return res.data || [];
          }
          return (res as unknown as UserTaskHistoryItem[]) || [];
        }),
      );
  }

  claimTask(taskId: string): Observable<UserTaskSummary> {
    return this.http
      .post<BaseResponse<UserTaskSummary>>(`${this.baseUrl}/${encodeURIComponent(taskId)}/claim`, {})
      .pipe(
        map((res) => {
          if (res && typeof res === 'object' && 'data' in res) {
            return res.data;
          }
          return res as unknown as UserTaskSummary;
        }),
      );
  }

  submitAction(taskId: string, request: UserTaskActionRequest): Observable<UserTaskActionResponse> {
    return this.http
      .post<BaseResponse<UserTaskActionResponse>>(
        `${this.baseUrl}/${encodeURIComponent(taskId)}/actions`,
        request,
      )
      .pipe(
        map((res) => {
          if (res && typeof res === 'object' && 'data' in res) {
            return res.data;
          }
          return res as unknown as UserTaskActionResponse;
        }),
      );
  }
}
