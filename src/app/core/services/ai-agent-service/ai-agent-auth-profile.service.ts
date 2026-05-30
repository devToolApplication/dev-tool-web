import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../enviroment/environment';
import { BasePageResponse, BaseResponse, normalizePageMetadata } from '../../models/base-response.model';
import { AiAgentAuthProfileLoginRequest, AiAgentAuthProfileRequest, AiAgentAuthProfileResponse } from '../../models/ai-agent/ai-agent-auth-profile.model';

@Injectable({ providedIn: 'root' })
export class AiAgentAuthProfileService {
  private readonly apiUrl = `${environment.apiUrl.adminAiGenerator}/auth-profiles`;

  constructor(private readonly http: HttpClient) {}

  getPage(
    page = 0,
    size = 10,
    sort: string[] = ['name,asc'],
    filters: Record<string, any> = {}
  ): Observable<BasePageResponse<AiAgentAuthProfileResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    sort.forEach((item) => (params = params.append('sort', item)));
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<BaseResponse<BasePageResponse<AiAgentAuthProfileResponse>>>(`${this.apiUrl}/page`, { params }).pipe(
      map((res) => ({
        data: res.data?.data ?? [],
        metadata: normalizePageMetadata(res.data?.metadata, page, size)
      }))
    );
  }

  getById(id: string): Observable<AiAgentAuthProfileResponse> {
    return this.http.get<BaseResponse<AiAgentAuthProfileResponse>>(`${this.apiUrl}/${id}`).pipe(
      map((res) => res.data)
    );
  }

  getByCode(code: string): Observable<AiAgentAuthProfileResponse> {
    return this.http.get<BaseResponse<AiAgentAuthProfileResponse>>(`${this.apiUrl}/code/${code}`).pipe(
      map((res) => res.data)
    );
  }

  create(payload: AiAgentAuthProfileRequest): Observable<AiAgentAuthProfileResponse> {
    return this.http.post<BaseResponse<AiAgentAuthProfileResponse>>(this.apiUrl, payload).pipe(
      map((res) => res.data)
    );
  }

  update(id: string, payload: AiAgentAuthProfileRequest): Observable<AiAgentAuthProfileResponse> {
    return this.http.put<BaseResponse<AiAgentAuthProfileResponse>>(`${this.apiUrl}/${id}`, payload).pipe(
      map((res) => res.data)
    );
  }

  delete(id: string): Observable<AiAgentAuthProfileResponse> {
    return this.http.delete<BaseResponse<AiAgentAuthProfileResponse>>(`${this.apiUrl}/${id}`).pipe(
      map((res) => res.data)
    );
  }

  updateStatus(id: string, status: string): Observable<AiAgentAuthProfileResponse> {
    const params = new HttpParams().set('status', status);
    return this.http.patch<BaseResponse<AiAgentAuthProfileResponse>>(`${this.apiUrl}/${id}/status`, null, { params }).pipe(
      map((res) => res.data)
    );
  }

  login(code: string, payload: AiAgentAuthProfileLoginRequest): Observable<AiAgentAuthProfileResponse> {
    return this.http.post<BaseResponse<AiAgentAuthProfileResponse>>(`${this.apiUrl}/code/${code}/login`, payload).pipe(
      map((res) => res.data)
    );
  }
}
