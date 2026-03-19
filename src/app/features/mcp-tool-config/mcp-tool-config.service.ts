import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../enviroment/environment';
import { BasePageResponse, BaseResponse } from '../../core/models/base-response.model';
import {
  McpCollectionField,
  McpToolConfig,
  McpToolUpsertPayload
} from './mcp-tool.models';

@Injectable({ providedIn: 'root' })
export class McpToolConfigService {
  private readonly apiUrl = `${environment.apiUrl.adminAiGenerator}/mcp-tools`;

  constructor(private readonly http: HttpClient) {}

  getAll(filters: Record<string, string | number | boolean> = {}): Observable<McpToolConfig[]> {
    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      params = params.set(key, String(value));
    });

    return this.http
      .get<BaseResponse<McpToolConfig[]>>(this.apiUrl, { params })
      .pipe(map((res) => res.data ?? []));
  }

  getPage(
    page = 0,
    size = 10,
    sort: string[] = ['updatedAt,desc'],
    filters: Record<string, string | number | boolean> = {}
  ): Observable<BasePageResponse<McpToolConfig>> {
    let params = new HttpParams().set('page', page).set('size', size);

    sort.forEach((item) => {
      params = params.append('sort', item);
    });

    Object.entries(filters).forEach(([key, value]) => {
      params = params.set(key, String(value));
    });

    return this.http
      .get<BaseResponse<BasePageResponse<McpToolConfig>>>(`${this.apiUrl}/page`, { params })
      .pipe(
        map((res) => ({
          data: res.data?.data ?? [],
          metadata: res.data?.metadata ?? {
            pageNumber: page,
            pageSize: size,
            totalElements: 0,
            totalPages: 0
          }
        }))
      );
  }

  getById(id: string): Observable<McpToolConfig> {
    return this.http
      .get<BaseResponse<McpToolConfig>>(`${this.apiUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  create(payload: McpToolUpsertPayload): Observable<McpToolConfig> {
    return this.http
      .post<BaseResponse<McpToolConfig>>(this.apiUrl, payload)
      .pipe(map((res) => res.data));
  }

  update(id: string, payload: McpToolUpsertPayload): Observable<McpToolConfig> {
    return this.http
      .put<BaseResponse<McpToolConfig>>(`${this.apiUrl}/${id}`, payload)
      .pipe(map((res) => res.data));
  }

  remove(id: string): Observable<McpToolConfig> {
    return this.http
      .delete<BaseResponse<McpToolConfig>>(`${this.apiUrl}/${id}`)
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
}
