import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../enviroment/environment';
import { BasePageResponse, BaseResponse } from '../../models/base-response.model';
import { StorageConfigCreateDto, StorageConfigResponse, StorageConfigUpdateDto } from '../../models/file-storage/storage-config.model';

@Injectable({ providedIn: 'root' })
export class StorageConfigService {
  private readonly apiUrl = `${environment.apiUrl.adminFileServiceUrl}/storage-configs`;

  constructor(private readonly http: HttpClient) {}

  getAll(filters: Record<string, any> = {}): Observable<StorageConfigResponse[]> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http
      .get<BaseResponse<StorageConfigResponse[]>>(this.apiUrl, { params })
      .pipe(map((res) => res.data ?? []));
  }

  getPage(
    page = 0,
    size = 10,
    sort: string[] = ['category,asc', 'key,asc'],
    filters: Record<string, any> = {}
  ): Observable<BasePageResponse<StorageConfigResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    sort.forEach((item) => {
      params = params.append('sort', item);
    });
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http
      .get<BaseResponse<BasePageResponse<StorageConfigResponse>>>(`${this.apiUrl}/page`, { params })
      .pipe(
        map((res) => ({
          data: res.data?.data ?? [],
          metadata: res.data?.metadata ?? { pageNumber: page, pageSize: size, totalElements: 0, totalPages: 0 }
        }))
      );
  }

  getById(id: string): Observable<StorageConfigResponse> {
    return this.http.get<BaseResponse<StorageConfigResponse>>(`${this.apiUrl}/${id}`).pipe(map((res) => res.data));
  }

  create(payload: StorageConfigCreateDto): Observable<StorageConfigResponse> {
    return this.http.post<BaseResponse<StorageConfigResponse>>(this.apiUrl, payload).pipe(map((res) => res.data));
  }

  update(id: string, payload: StorageConfigUpdateDto): Observable<StorageConfigResponse> {
    return this.http.put<BaseResponse<StorageConfigResponse>>(`${this.apiUrl}/${id}`, payload).pipe(map((res) => res.data));
  }

  delete(id: string): Observable<StorageConfigResponse> {
    return this.http.delete<BaseResponse<StorageConfigResponse>>(`${this.apiUrl}/${id}`).pipe(map((res) => res.data));
  }
}
