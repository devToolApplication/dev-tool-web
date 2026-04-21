import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../enviroment/environment';
import { BasePageResponse, BaseResponse } from '../../models/base-response.model';
import { UploadFileOptions, UploadFileResponse } from '../../models/file-storage/upload-file.model';

@Injectable({ providedIn: 'root' })
export class UploadFileService {
  private readonly adminApiUrl = `${environment.apiUrl.adminFileServiceUrl}/upload-files`;
  private readonly uploadApiUrl = `${environment.apiUrl.adminFileServiceUrl.replace(/\/admin$/, '')}/upload`;

  constructor(private readonly http: HttpClient) {}

  getPage(
    page = 0,
    size = 10,
    sort: string[] = ['createdAt,desc'],
    filters: Record<string, string | number | boolean> = {}
  ): Observable<BasePageResponse<UploadFileResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);

    sort.forEach((item) => {
      params = params.append('sort', item);
    });

    Object.entries(filters).forEach(([key, value]) => {
      params = params.set(key, String(value));
    });

    return this.http
      .get<BaseResponse<BasePageResponse<UploadFileResponse>>>(`${this.adminApiUrl}/page`, { params })
      .pipe(
        map((res) =>
          res.data ?? {
            data: [],
            metadata: { pageNumber: page, pageSize: size, totalElements: 0, totalPages: 0 }
          }
        )
      );
  }

  getById(id: string): Observable<UploadFileResponse> {
    return this.http
      .get<BaseResponse<UploadFileResponse>>(`${this.adminApiUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  delete(id: string): Observable<UploadFileResponse> {
    return this.http
      .delete<BaseResponse<UploadFileResponse>>(`${this.adminApiUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  upload(file: File, options: UploadFileOptions = {}): Observable<UploadFileResponse> {
    const formData = new FormData();
    formData.append('file', file);

    if (options.storageId) {
      formData.append('storageId', options.storageId);
    } else if (options.storageType) {
      formData.append('storageType', options.storageType);
    }

    const fileName = options.fileName?.trim();
    const metadata = options.metadata ?? {};
    if (fileName || Object.keys(metadata).length > 0) {
      formData.append(
        'metadata',
        JSON.stringify({
          fileName: fileName || file.name,
          metadata
        })
      );
    }

    return this.http
      .post<BaseResponse<UploadFileResponse>>(this.uploadApiUrl, formData)
      .pipe(map((res) => res.data));
  }
}
