import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../enviroment/environment';
import { BasePageResponse, BaseResponse, normalizePageMetadata } from '../../models/base-response.model';
import {
  TradeStrategyBindingCreateDto,
  TradeStrategyBindingPatchDto,
  TradeStrategyBindingResponse,
  TradeStrategyBindingUpdateDto
} from '../../models/trade-bot/trade-strategy-binding.model';

@Injectable({ providedIn: 'root' })
export class TradeStrategyBindingService {
  private readonly apiUrl = `${environment.apiUrl.tradeBotAdminUrl}/trade-strategy-bindings`;

  constructor(private readonly http: HttpClient) {}

  getPage(page = 0, size = 20, sort: string[] = ['exchangeCode,asc'], filters?: Record<string, unknown>): Observable<BasePageResponse<TradeStrategyBindingResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    sort.forEach((item) => {
      params = params.append('sort', item);
    });
    Object.entries(filters ?? {}).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http
      .get<BaseResponse<BasePageResponse<TradeStrategyBindingResponse>>>(`${this.apiUrl}/page`, { params })
      .pipe(
        map((res) => ({
          data: res.data?.data ?? [],
          metadata: normalizePageMetadata(res.data?.metadata, page, size)
        }))
      );
  }

  getById(id: string): Observable<TradeStrategyBindingResponse> {
    return this.http.get<BaseResponse<TradeStrategyBindingResponse>>(`${this.apiUrl}/${id}`).pipe(map((res) => res.data));
  }

  create(payload: TradeStrategyBindingCreateDto): Observable<TradeStrategyBindingResponse> {
    return this.http.post<BaseResponse<TradeStrategyBindingResponse>>(this.apiUrl, payload).pipe(map((res) => res.data));
  }

  update(id: string, payload: TradeStrategyBindingUpdateDto): Observable<TradeStrategyBindingResponse> {
    return this.http.put<BaseResponse<TradeStrategyBindingResponse>>(`${this.apiUrl}/${id}`, payload).pipe(map((res) => res.data));
  }

  patch(id: string, payload: TradeStrategyBindingPatchDto): Observable<TradeStrategyBindingResponse> {
    return this.http.patch<BaseResponse<TradeStrategyBindingResponse>>(`${this.apiUrl}/${id}`, payload).pipe(map((res) => res.data));
  }

  delete(id: string): Observable<TradeStrategyBindingResponse> {
    return this.http.delete<BaseResponse<TradeStrategyBindingResponse>>(`${this.apiUrl}/${id}`).pipe(map((res) => res.data));
  }
}
