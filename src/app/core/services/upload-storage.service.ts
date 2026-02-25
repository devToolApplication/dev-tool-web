import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../enviroment/environment';
import { BasePageResponse, BaseResponse } from '../models/base-response.model';
import {
  UploadStorageCreateDto,
  UploadStorageResponse,
  UploadStorageUpdateDto
} from '../models/upload-storage.model';

@Injectable({ providedIn: 'root' })
export class UploadStorageService {
  private readonly apiUrl = `${environment.apiUrl.adminFileServiceUrl}/upload-storages`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<UploadStorageResponse[]> {
    return this.http
      .get<BaseResponse<UploadStorageResponse[]>>(this.apiUrl)
      .pipe(map((res) => res.data ?? []));
  }

  getPage(page = 0, size = 10, sort: string[] = ['name,asc']): Observable<BasePageResponse<UploadStorageResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);

    sort.forEach((item) => {
      params = params.append('sort', item);
    });

    return this.http
      .get<BaseResponse<BasePageResponse<UploadStorageResponse>>>(`${this.apiUrl}/page`, { params })
      .pipe(
        map((res) =>
          res.data ?? {
            data: [],
            metadata: { pageNumber: page, pageSize: size, totalElements: 0, totalPages: 0 }
          }
        )
      );
  }

  getById(id: string): Observable<UploadStorageResponse> {
    return this.http
      .get<BaseResponse<UploadStorageResponse>>(`${this.apiUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  create(payload: UploadStorageCreateDto): Observable<UploadStorageResponse> {
    return this.http
      .post<BaseResponse<UploadStorageResponse>>(this.apiUrl, payload)
      .pipe(map((res) => res.data));
  }

  update(id: string, payload: UploadStorageUpdateDto): Observable<UploadStorageResponse> {
    return this.http
      .put<BaseResponse<UploadStorageResponse>>(`${this.apiUrl}/${id}`, payload)
      .pipe(map((res) => res.data));
  }

  delete(id: string): Observable<UploadStorageResponse> {
    return this.http
      .delete<BaseResponse<UploadStorageResponse>>(`${this.apiUrl}/${id}`)
      .pipe(map((res) => res.data));
  }
}
