import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../../../../enviroment/environment';
import { BasePageResponse, BaseResponse, normalizeBasePageResponse } from '../../../../../../core/models/base-response.model';
import { SecretCreateDto, SecretOptionsResponse, SecretPageResponse, SecretResponse, SecretUpdateDto } from '../models/job-secret.model';

@Injectable({ providedIn: 'root' })
export class JobSecretService {
  private readonly apiUrl = `${environment.apiUrl.jobSchedulerAdminUrl}/secrets`;

  constructor(private readonly http: HttpClient) {}

  getPage(page = 0, size = 20, filters: Record<string, any> = {}, sort: string[] = []): Observable<SecretPageResponse> {
    const params = this.toParams({ page, size, ...filters });
    return this.http.get<BaseResponse<BasePageResponse<SecretResponse>>>(this.apiUrl, { params }).pipe(
      map((res) => normalizeBasePageResponse(res.data, page, size))
    );
  }

  getByCode(code: string): Observable<SecretResponse> {
    return this.http.get<BaseResponse<SecretResponse>>(`${this.apiUrl}/${encodeURIComponent(code)}`).pipe(
      map((res) => res.data)
    );
  }

  getOptions(type?: string): Observable<SecretOptionsResponse> {
    const params = type ? new HttpParams().set('type', type) : new HttpParams();
    return this.http.get<BaseResponse<SecretOptionsResponse>>(`${this.apiUrl}/options`, { params }).pipe(
      map((res) => res.data ?? { options: [] })
    );
  }

  create(payload: SecretCreateDto): Observable<SecretResponse> {
    return this.http.post<BaseResponse<SecretResponse>>(this.apiUrl, payload).pipe(
      map((res) => res.data)
    );
  }

  update(code: string, payload: SecretUpdateDto): Observable<SecretResponse> {
    return this.http.put<BaseResponse<SecretResponse>>(`${this.apiUrl}/${encodeURIComponent(code)}`, payload).pipe(
      map((res) => res.data)
    );
  }

  delete(code: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${encodeURIComponent(code)}`);
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
