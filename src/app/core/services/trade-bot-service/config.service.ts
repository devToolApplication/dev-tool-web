import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../enviroment/environment';
import { BasePageResponse, BaseResponse, normalizePageMetadata } from '../../models/base-response.model';
import { TradeBotConfigCreateDto, TradeBotConfigResponse, TradeBotConfigUpdateDto } from '../../models/trade-bot/config.model';

@Injectable({ providedIn: 'root' })
export class TradeBotConfigService {
  private readonly apiUrl = `${environment.apiUrl.tradeBotAdminUrl}/configs`;

  constructor(private readonly http: HttpClient) {}

  getAll(filters: Record<string, any> = {}): Observable<TradeBotConfigResponse[]> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http
      .get<BaseResponse<TradeBotConfigResponse[]>>(this.apiUrl, { params })
      .pipe(map((res) => res.data ?? []));
  }

  getPage(
    page = 0,
    size = 10,
    sort: string[] = ['category,asc', 'key,asc'],
    filters: Record<string, any> = {}
  ): Observable<BasePageResponse<TradeBotConfigResponse>> {
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
      .get<BaseResponse<BasePageResponse<TradeBotConfigResponse>>>(`${this.apiUrl}/page`, { params })
      .pipe(
        map((res) => ({
          data: res.data?.data ?? [],
          metadata: normalizePageMetadata(res.data?.metadata, page, size)
        }))
      );
  }

  getById(id: string): Observable<TradeBotConfigResponse> {
    return this.http.get<BaseResponse<TradeBotConfigResponse>>(`${this.apiUrl}/${id}`).pipe(map((res) => res.data));
  }

  create(payload: TradeBotConfigCreateDto): Observable<TradeBotConfigResponse> {
    return this.http.post<BaseResponse<TradeBotConfigResponse>>(this.apiUrl, payload).pipe(map((res) => res.data));
  }

  update(id: string, payload: TradeBotConfigUpdateDto): Observable<TradeBotConfigResponse> {
    return this.http.put<BaseResponse<TradeBotConfigResponse>>(`${this.apiUrl}/${id}`, payload).pipe(map((res) => res.data));
  }

  delete(id: string): Observable<TradeBotConfigResponse> {
    return this.http.delete<BaseResponse<TradeBotConfigResponse>>(`${this.apiUrl}/${id}`).pipe(map((res) => res.data));
  }
}
