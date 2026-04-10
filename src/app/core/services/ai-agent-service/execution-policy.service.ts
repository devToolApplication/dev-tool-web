import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../enviroment/environment';
import { ExecutionPolicyConfigCreateDto, ExecutionPolicyConfigResponse, ExecutionPolicyConfigUpdateDto } from '../../models/ai-agent/execution-policy.model';
import { BasePageResponse, BaseResponse, normalizePageMetadata } from '../../models/base-response.model';

@Injectable({ providedIn: 'root' })
export class ExecutionPolicyService {
  private readonly apiUrl = `${environment.apiUrl.adminAiGenerator}/execution-policies`;

  constructor(private readonly http: HttpClient) {}

  getAll(filters: Record<string, any> = {}): Observable<ExecutionPolicyConfigResponse[]> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<BaseResponse<ExecutionPolicyConfigResponse[]>>(this.apiUrl, { params }).pipe(map((res) => res.data ?? []));
  }

  getPage(
    page = 0,
    size = 10,
    sort: string[] = ['name,asc'],
    filters: Record<string, any> = {}
  ): Observable<BasePageResponse<ExecutionPolicyConfigResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    sort.forEach((item) => (params = params.append('sort', item)));
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<BaseResponse<BasePageResponse<ExecutionPolicyConfigResponse>>>(`${this.apiUrl}/page`, { params }).pipe(
      map((res) => ({
        data: res.data?.data ?? [],
        metadata: normalizePageMetadata(res.data?.metadata, page, size)
      }))
    );
  }

  getById(id: string): Observable<ExecutionPolicyConfigResponse> {
    return this.http.get<BaseResponse<ExecutionPolicyConfigResponse>>(`${this.apiUrl}/${id}`).pipe(map((res) => res.data));
  }

  create(payload: ExecutionPolicyConfigCreateDto): Observable<ExecutionPolicyConfigResponse> {
    return this.http.post<BaseResponse<ExecutionPolicyConfigResponse>>(this.apiUrl, payload).pipe(map((res) => res.data));
  }

  update(id: string, payload: ExecutionPolicyConfigUpdateDto): Observable<ExecutionPolicyConfigResponse> {
    return this.http.put<BaseResponse<ExecutionPolicyConfigResponse>>(`${this.apiUrl}/${id}`, payload).pipe(map((res) => res.data));
  }

  delete(id: string): Observable<ExecutionPolicyConfigResponse> {
    return this.http.delete<BaseResponse<ExecutionPolicyConfigResponse>>(`${this.apiUrl}/${id}`).pipe(map((res) => res.data));
  }
}
