import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../enviroment/environment';
import { BasePageResponse, BaseResponse, normalizePageMetadata } from '../../models/base-response.model';
import { AiModelCreateDto, AiModelResponse, AiModelUpdateDto } from '../../models/ai-agent/ai-model.model';

@Injectable({ providedIn: 'root' })
export class AiModelService {
  private readonly apiUrl = `${environment.apiUrl.adminAiGenerator}/ai-models`;

  constructor(private readonly http: HttpClient) {}

  getAll(filters: Record<string, any> = {}): Observable<AiModelResponse[]> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<BaseResponse<AiModelResponse[]>>(this.apiUrl, { params }).pipe(map((res) => res.data ?? []));
  }

  getPage(
    page = 0,
    size = 10,
    sort: string[] = ['modelName,asc'],
    filters: Record<string, any> = {}
  ): Observable<BasePageResponse<AiModelResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    sort.forEach((item) => (params = params.append('sort', item)));
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<BaseResponse<BasePageResponse<AiModelResponse>>>(`${this.apiUrl}/page`, { params }).pipe(
      map((res) => ({
        data: res.data?.data ?? [],
        metadata: normalizePageMetadata(res.data?.metadata, page, size)
      }))
    );
  }

  getById(id: string): Observable<AiModelResponse> {
    return this.http.get<BaseResponse<AiModelResponse>>(`${this.apiUrl}/${id}`).pipe(map((res) => res.data));
  }

  create(payload: AiModelCreateDto): Observable<AiModelResponse> {
    return this.http.post<BaseResponse<AiModelResponse>>(this.apiUrl, payload).pipe(map((res) => res.data));
  }

  update(id: string, payload: AiModelUpdateDto): Observable<AiModelResponse> {
    return this.http.put<BaseResponse<AiModelResponse>>(`${this.apiUrl}/${id}`, payload).pipe(map((res) => res.data));
  }

  delete(id: string): Observable<AiModelResponse> {
    return this.http.delete<BaseResponse<AiModelResponse>>(`${this.apiUrl}/${id}`).pipe(map((res) => res.data));
  }
}
