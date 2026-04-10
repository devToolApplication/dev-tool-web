import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../enviroment/environment';
import { ExecutionSessionResponse, ExecutionStepResponse } from '../../models/ai-agent/execution-trace.model';
import { BasePageResponse, BaseResponse, normalizePageMetadata } from '../../models/base-response.model';

@Injectable({ providedIn: 'root' })
export class ExecutionTraceService {
  private readonly apiUrl = `${environment.apiUrl.adminAiGenerator}/execution-traces`;

  constructor(private readonly http: HttpClient) {}

  getSessions(filters: Record<string, any> = {}): Observable<ExecutionSessionResponse[]> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<BaseResponse<ExecutionSessionResponse[]>>(`${this.apiUrl}/sessions`, { params }).pipe(map((res) => res.data ?? []));
  }

  getSessionPage(
    page = 0,
    size = 10,
    sort: string[] = ['startedAt,desc'],
    filters: Record<string, any> = {}
  ): Observable<BasePageResponse<ExecutionSessionResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    sort.forEach((item) => (params = params.append('sort', item)));
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<BaseResponse<BasePageResponse<ExecutionSessionResponse>>>(`${this.apiUrl}/sessions/page`, { params }).pipe(
      map((res) => ({
        data: res.data?.data ?? [],
        metadata: normalizePageMetadata(res.data?.metadata, page, size)
      }))
    );
  }

  getSteps(sessionId: string): Observable<ExecutionStepResponse[]> {
    return this.http.get<BaseResponse<ExecutionStepResponse[]>>(`${this.apiUrl}/sessions/${sessionId}/steps`).pipe(map((res) => res.data ?? []));
  }
}
