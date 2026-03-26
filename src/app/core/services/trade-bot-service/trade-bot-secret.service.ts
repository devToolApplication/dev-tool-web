import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../enviroment/environment';
import { BasePageResponse, BaseResponse } from '../../models/base-response.model';
import { TradeBotSecretCreateDto, TradeBotSecretResponse, TradeBotSecretUpdateDto } from '../../models/trade-bot/trade-bot-secret.model';

@Injectable({ providedIn: 'root' })
export class TradeBotSecretService {
  private readonly apiUrl = `${environment.apiUrl.tradeBotAdminUrl}/trade-bot-secrets`;

  constructor(private readonly http: HttpClient) {}

  getAll(filters: Record<string, any> = {}): Observable<TradeBotSecretResponse[]> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<BaseResponse<TradeBotSecretResponse[]>>(this.apiUrl, { params }).pipe(map((res) => res.data ?? []));
  }

  getPage(
    page = 0,
    size = 10,
    sort: string[] = ['category,asc', 'code,asc'],
    filters: Record<string, any> = {}
  ): Observable<BasePageResponse<TradeBotSecretResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    sort.forEach((item) => (params = params.append('sort', item)));
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<BaseResponse<BasePageResponse<TradeBotSecretResponse>>>(`${this.apiUrl}/page`, { params }).pipe(
      map((res) => res.data ?? { data: [], metadata: { pageNumber: page, pageSize: size, totalElements: 0, totalPages: 0 } })
    );
  }

  getById(id: string): Observable<TradeBotSecretResponse> {
    return this.http.get<BaseResponse<TradeBotSecretResponse>>(`${this.apiUrl}/${id}`).pipe(map((res) => res.data));
  }

  create(payload: TradeBotSecretCreateDto): Observable<TradeBotSecretResponse> {
    return this.http.post<BaseResponse<TradeBotSecretResponse>>(this.apiUrl, payload).pipe(map((res) => res.data));
  }

  update(id: string, payload: TradeBotSecretUpdateDto): Observable<TradeBotSecretResponse> {
    return this.http.put<BaseResponse<TradeBotSecretResponse>>(`${this.apiUrl}/${id}`, payload).pipe(map((res) => res.data));
  }

  delete(id: string): Observable<TradeBotSecretResponse> {
    return this.http.delete<BaseResponse<TradeBotSecretResponse>>(`${this.apiUrl}/${id}`).pipe(map((res) => res.data));
  }
}
