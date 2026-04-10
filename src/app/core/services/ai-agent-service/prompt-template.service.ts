import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../enviroment/environment';
import { PromptTemplateCreateDto, PromptTemplateResponse, PromptTemplateUpdateDto } from '../../models/ai-agent/prompt-template.model';
import { BasePageResponse, BaseResponse, normalizePageMetadata } from '../../models/base-response.model';

@Injectable({ providedIn: 'root' })
export class PromptTemplateService {
  private readonly apiUrl = `${environment.apiUrl.adminAiGenerator}/prompt-templates`;

  constructor(private readonly http: HttpClient) {}

  getAll(filters: Record<string, any> = {}): Observable<PromptTemplateResponse[]> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<BaseResponse<PromptTemplateResponse[]>>(this.apiUrl, { params }).pipe(map((res) => res.data ?? []));
  }

  getPage(
    page = 0,
    size = 10,
    sort: string[] = ['name,asc'],
    filters: Record<string, any> = {}
  ): Observable<BasePageResponse<PromptTemplateResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    sort.forEach((item) => (params = params.append('sort', item)));
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<BaseResponse<BasePageResponse<PromptTemplateResponse>>>(`${this.apiUrl}/page`, { params }).pipe(
      map((res) => ({
        data: res.data?.data ?? [],
        metadata: normalizePageMetadata(res.data?.metadata, page, size)
      }))
    );
  }

  getById(id: string): Observable<PromptTemplateResponse> {
    return this.http.get<BaseResponse<PromptTemplateResponse>>(`${this.apiUrl}/${id}`).pipe(map((res) => res.data));
  }

  create(payload: PromptTemplateCreateDto): Observable<PromptTemplateResponse> {
    return this.http.post<BaseResponse<PromptTemplateResponse>>(this.apiUrl, payload).pipe(map((res) => res.data));
  }

  update(id: string, payload: PromptTemplateUpdateDto): Observable<PromptTemplateResponse> {
    return this.http.put<BaseResponse<PromptTemplateResponse>>(`${this.apiUrl}/${id}`, payload).pipe(map((res) => res.data));
  }

  delete(id: string): Observable<PromptTemplateResponse> {
    return this.http.delete<BaseResponse<PromptTemplateResponse>>(`${this.apiUrl}/${id}`).pipe(map((res) => res.data));
  }
}
