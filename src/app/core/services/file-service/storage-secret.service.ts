import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../enviroment/environment';
import { BasePageResponse, BaseResponse } from '../../models/base-response.model';
import { StorageSecretCreateDto, StorageSecretResponse, StorageSecretUpdateDto } from '../../models/file-storage/storage-secret.model';

@Injectable({ providedIn: 'root' })
export class StorageSecretService {
  private readonly apiUrl = `${environment.apiUrl.adminFileServiceUrl}/storage-secrets`;

  constructor(private readonly http: HttpClient) {}

  getAll(filters: Record<string, any> = {}): Observable<StorageSecretResponse[]> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http
      .get<BaseResponse<StorageSecretResponse[]>>(this.apiUrl, { params })
      .pipe(map((res) => res.data ?? []));
  }

  getPage(
    page = 0,
    size = 10,
    sort: string[] = ['category,asc', 'code,asc'],
    filters: Record<string, any> = {}
  ): Observable<BasePageResponse<StorageSecretResponse>> {
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
      .get<BaseResponse<BasePageResponse<StorageSecretResponse>>>(`${this.apiUrl}/page`, { params })
      .pipe(
        map((res) =>
          res.data ?? {
            data: [],
            metadata: { pageNumber: page, pageSize: size, totalElements: 0, totalPages: 0 }
          }
        )
      );
  }

  getById(id: string): Observable<StorageSecretResponse> {
    return this.http.get<BaseResponse<StorageSecretResponse>>(`${this.apiUrl}/${id}`).pipe(map((res) => res.data));
  }

  create(payload: StorageSecretCreateDto): Observable<StorageSecretResponse> {
    return this.http.post<BaseResponse<StorageSecretResponse>>(this.apiUrl, payload).pipe(map((res) => res.data));
  }

  update(id: string, payload: StorageSecretUpdateDto): Observable<StorageSecretResponse> {
    return this.http.put<BaseResponse<StorageSecretResponse>>(`${this.apiUrl}/${id}`, payload).pipe(map((res) => res.data));
  }

  delete(id: string): Observable<StorageSecretResponse> {
    return this.http.delete<BaseResponse<StorageSecretResponse>>(`${this.apiUrl}/${id}`).pipe(map((res) => res.data));
  }
}
