import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../enviroment/environment';
import { BasePageResponse, BaseResponse } from '../../models/base-response.model';
import { ExchangeResponse, StrategyResponse, SymbolResponse } from '../../models/trade-bot/reference-data.model';

@Injectable({ providedIn: 'root' })
export class ReferenceDataService {
  private readonly apiUrl = environment.apiUrl.tradeBotAdminUrl;

  constructor(private readonly http: HttpClient) {}

  getExchanges(keyword?: string): Observable<ExchangeResponse[]> {
    const params = keyword ? new HttpParams().set('keyword', keyword) : undefined;
    return this.http.get<BaseResponse<ExchangeResponse[]>>(`${this.apiUrl}/exchanges`, { params }).pipe(map((res) => res.data ?? []));
  }

  getSymbols(code?: string, marketType?: string): Observable<SymbolResponse[]> {
    let params = new HttpParams();
    if (code) {
      params = params.set('code', code);
    }
    if (marketType) {
      params = params.set('marketType', marketType);
    }
    return this.http.get<BaseResponse<SymbolResponse[]>>(`${this.apiUrl}/symbols`, { params }).pipe(map((res) => res.data ?? []));
  }

  getStrategies(keyword?: string): Observable<StrategyResponse[]> {
    const params = keyword ? new HttpParams().set('keyword', keyword) : undefined;
    return this.http.get<BaseResponse<StrategyResponse[]>>(`${this.apiUrl}/strategies`, { params }).pipe(map((res) => res.data ?? []));
  }
}
