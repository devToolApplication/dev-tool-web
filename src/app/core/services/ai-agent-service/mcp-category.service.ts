import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../enviroment/environment';
import { BasePageResponse, BaseResponse } from '../../models/base-response.model';
import { McpCategoryCreateDto, McpCategoryResponse, McpCategoryUpdateDto } from '../../models/mcp-server/mcp-tool.model';

@Injectable({ providedIn: 'root' })
export class McpCategoryService {
  private readonly apiUrl = `${environment.apiUrl.adminAiGenerator}/mcp-categories`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<McpCategoryResponse[]> {
    return this.http.get<BaseResponse<McpCategoryResponse[]>>(this.apiUrl).pipe(map((res) => res.data ?? []));
  }

  getPage(page = 0, size = 10, sort: string[] = ['name,asc']): Observable<BasePageResponse<McpCategoryResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    sort.forEach((item) => {
      params = params.append('sort', item);
    });

    return this.http
      .get<BaseResponse<BasePageResponse<McpCategoryResponse>>>(`${this.apiUrl}/page`, { params })
      .pipe(map((res) => res.data ?? { data: [], metadata: { pageNumber: page, pageSize: size, totalElements: 0, totalPages: 0 } }));
  }

  getById(id: string): Observable<McpCategoryResponse> {
    return this.http.get<BaseResponse<McpCategoryResponse>>(`${this.apiUrl}/${id}`).pipe(map((res) => res.data));
  }

  create(payload: McpCategoryCreateDto): Observable<McpCategoryResponse> {
    return this.http.post<BaseResponse<McpCategoryResponse>>(this.apiUrl, payload).pipe(map((res) => res.data));
  }

  update(id: string, payload: McpCategoryUpdateDto): Observable<McpCategoryResponse> {
    return this.http.put<BaseResponse<McpCategoryResponse>>(`${this.apiUrl}/${id}`, payload).pipe(map((res) => res.data));
  }

  delete(id: string): Observable<McpCategoryResponse> {
    return this.http.delete<BaseResponse<McpCategoryResponse>>(`${this.apiUrl}/${id}`).pipe(map((res) => res.data));
  }
}
