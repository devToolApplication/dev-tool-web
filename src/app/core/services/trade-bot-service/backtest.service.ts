import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../enviroment/environment';
import { BasePageResponse, BaseResponse, normalizePageMetadata } from '../../models/base-response.model';
import {
  BacktestJobResponse,
  BacktestMetricResponse,
  BacktestOrderResponse,
  BacktestRunDto
} from '../../models/trade-bot/backtest.model';
import { StrategyReplayPayload } from '../../models/trade-bot/strategy-replay.model';

@Injectable({ providedIn: 'root' })
export class BacktestService {
  private readonly apiUrl = `${environment.apiUrl.tradeBotAdminUrl}/backtests`;

  constructor(private readonly http: HttpClient) {}

  run(payload: BacktestRunDto): Observable<BacktestJobResponse> {
    return this.http.post<BaseResponse<BacktestJobResponse>>(this.apiUrl, payload).pipe(map((res) => res.data));
  }

  getPage(page = 0, size = 20, sort: string[] = ['startedAt,desc'], filters?: Record<string, unknown>): Observable<BasePageResponse<BacktestJobResponse>> {
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
      .get<BaseResponse<BasePageResponse<BacktestJobResponse>>>(`${this.apiUrl}/page`, { params })
      .pipe(
        map((res) => ({
          data: res.data?.data ?? [],
          metadata: normalizePageMetadata(res.data?.metadata, page, size)
        }))
      );
  }

  getById(id: string): Observable<BacktestJobResponse> {
    return this.http.get<BaseResponse<BacktestJobResponse>>(`${this.apiUrl}/${id}`).pipe(map((res) => res.data));
  }

  getOrders(jobId: string, page = 0, size = 500, sort: string[] = ['entryTime,desc'], filters?: Record<string, unknown>): Observable<BasePageResponse<BacktestOrderResponse>> {
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
      .get<BaseResponse<BasePageResponse<BacktestOrderResponse>>>(`${this.apiUrl}/${jobId}/orders`, { params })
      .pipe(
        map((res) => ({
          data: res.data?.data ?? [],
          metadata: normalizePageMetadata(res.data?.metadata, page, size)
        }))
      );
  }

  getMetrics(jobId: string): Observable<BacktestMetricResponse> {
    return this.http.get<BaseResponse<BacktestMetricResponse>>(`${this.apiUrl}/${jobId}/metrics`).pipe(map((res) => res.data));
  }

  getReplay(jobId: string): Observable<StrategyReplayPayload> {
    return this.http.get<BaseResponse<StrategyReplayPayload>>(`${this.apiUrl}/${jobId}/replay`).pipe(map((res) => res.data));
  }
}
