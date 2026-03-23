import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../enviroment/environment';
import { BaseResponse } from '../../models/base-response.model';

export interface AiAgentSecretUserResponse {
  id: string;
  category: string;
  name: string;
  description?: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class AiAgentSecretUserService {
  private readonly apiUrl = `${environment.apiUrl.aiGenerator}/ai-agent-secrets`;

  constructor(private readonly http: HttpClient) {}

  getAll(filters: Record<string, any> = {}): Observable<AiAgentSecretUserResponse[]> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<BaseResponse<AiAgentSecretUserResponse[]>>(this.apiUrl, { params }).pipe(map((res) => res.data ?? []));
  }
}
