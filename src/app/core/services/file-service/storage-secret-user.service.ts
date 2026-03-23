import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../enviroment/environment';
import { BaseResponse } from '../../models/base-response.model';

export interface StorageSecretUserResponse {
  id: string;
  category: string;
  name: string;
  description?: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class StorageSecretUserService {
  private readonly apiUrl = `${environment.apiUrl.adminFileServiceUrl.replace(/\/admin$/, '')}/storage-secrets`;

  constructor(private readonly http: HttpClient) {}

  getAll(filters: Record<string, any> = {}): Observable<StorageSecretUserResponse[]> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<BaseResponse<StorageSecretUserResponse[]>>(this.apiUrl, { params }).pipe(map((res) => res.data ?? []));
  }
}
