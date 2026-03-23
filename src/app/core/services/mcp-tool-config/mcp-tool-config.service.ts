import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../enviroment/environment';
import { BasePageResponse, BaseResponse } from '../../models/base-response.model';
import {
  McpCategoryCreateDto,
  McpCategoryResponse,
  McpCategoryUpdateDto,
  McpCollectionField,
  McpToolCreateDto,
  McpToolResponse,
  McpToolUpdateDto
} from '../../models/mcp-server/mcp-tool.model';

@Injectable({ providedIn: 'root' })
export class McpToolConfigService {
  private readonly apiUrl = `${environment.apiUrl.adminAiGenerator}/mcp-tools`;
  private readonly categoryApiUrl = `${environment.apiUrl.adminAiGenerator}/mcp-categories`;

  constructor(private readonly http: HttpClient) {}

  getAll(filters: Record<string, string | number | boolean> = {}): Observable<McpToolResponse[]> {
    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      params = params.set(key, String(value));
    });

    return this.http
      .get<BaseResponse<McpToolResponse[]>>(this.apiUrl, { params })
      .pipe(map((res) => res.data ?? []));
  }

  getPage(
    page = 0,
    size = 10,
    sort: string[] = ['updatedAt,desc'],
    filters: Record<string, string | number | boolean> = {}
  ): Observable<BasePageResponse<McpToolResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);

    sort.forEach((item) => {
      params = params.append('sort', item);
    });

    Object.entries(filters).forEach(([key, value]) => {
      params = params.set(key, String(value));
    });

    return this.http
      .get<BaseResponse<BasePageResponse<McpToolResponse>>>(`${this.apiUrl}/page`, { params })
      .pipe(
        map((res) =>
          res.data ?? {
            data: [],
            metadata: { pageNumber: page, pageSize: size, totalElements: 0, totalPages: 0 }
          }
        )
      );
  }

  getById(id: string): Observable<McpToolResponse> {
    return this.http
      .get<BaseResponse<McpToolResponse>>(`${this.apiUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  create(payload: McpToolCreateDto): Observable<McpToolResponse> {
    return this.http
      .post<BaseResponse<McpToolResponse>>(this.apiUrl, payload)
      .pipe(map((res) => res.data));
  }

  update(id: string, payload: McpToolUpdateDto): Observable<McpToolResponse> {
    return this.http
      .put<BaseResponse<McpToolResponse>>(`${this.apiUrl}/${id}`, payload)
      .pipe(map((res) => res.data));
  }

  delete(id: string): Observable<McpToolResponse> {
    return this.http
      .delete<BaseResponse<McpToolResponse>>(`${this.apiUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  getCollections(databaseName: string): Observable<string[]> {
    const params = new HttpParams().set('databaseName', databaseName);
    return this.http
      .get<BaseResponse<string[]>>(`${this.apiUrl}/metadata/collections`, { params })
      .pipe(map((res) => res.data ?? []));
  }

  getDatabases(): Observable<string[]> {
    return this.http
      .get<BaseResponse<string[]>>(`${this.apiUrl}/metadata/databases`)
      .pipe(map((res) => res.data ?? []));
  }

  getFields(databaseName: string, collectionName: string): Observable<McpCollectionField[]> {
    const params = new HttpParams().set('databaseName', databaseName).set('collectionName', collectionName);
    return this.http
      .get<BaseResponse<McpCollectionField[]>>(`${this.apiUrl}/metadata/fields`, { params })
      .pipe(map((res) => res.data ?? []));
  }

  getCategories(): Observable<McpCategoryResponse[]> {
    return this.http
      .get<BaseResponse<McpCategoryResponse[]>>(this.categoryApiUrl)
      .pipe(map((res) => res.data ?? []));
  }

  getCategoryPage(page = 0, size = 10, sort: string[] = ['name,asc']): Observable<BasePageResponse<McpCategoryResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);

    sort.forEach((item) => {
      params = params.append('sort', item);
    });

    return this.http
      .get<BaseResponse<BasePageResponse<McpCategoryResponse>>>(`${this.categoryApiUrl}/page`, { params })
      .pipe(
        map((res) =>
          res.data ?? {
            data: [],
            metadata: { pageNumber: page, pageSize: size, totalElements: 0, totalPages: 0 }
          }
        )
      );
  }

  getCategoryById(id: string): Observable<McpCategoryResponse> {
    return this.http
      .get<BaseResponse<McpCategoryResponse>>(`${this.categoryApiUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  createCategory(payload: McpCategoryCreateDto): Observable<McpCategoryResponse> {
    return this.http
      .post<BaseResponse<McpCategoryResponse>>(this.categoryApiUrl, payload)
      .pipe(map((res) => res.data));
  }

  updateCategory(id: string, payload: McpCategoryUpdateDto): Observable<McpCategoryResponse> {
    return this.http
      .put<BaseResponse<McpCategoryResponse>>(`${this.categoryApiUrl}/${id}`, payload)
      .pipe(map((res) => res.data));
  }

  deleteCategory(id: string): Observable<McpCategoryResponse> {
    return this.http
      .delete<BaseResponse<McpCategoryResponse>>(`${this.categoryApiUrl}/${id}`)
      .pipe(map((res) => res.data));
  }
}
