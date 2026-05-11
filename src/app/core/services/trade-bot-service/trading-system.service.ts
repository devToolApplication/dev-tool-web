import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../enviroment/environment';
import { BasePageResponse, BaseResponse, normalizePageMetadata } from '../../models/base-response.model';
import {
  BacktestCurvePointResponse,
  BacktestEventResponse,
  BacktestMetricResponse,
  BacktestRuleTraceResponse,
  BacktestRunDto,
  BacktestRunResponse,
  BacktestTradeResponse,
  CandleBarResponse,
  CandleBulkImportDto,
  ExecutorVersionResponse,
  IndicatorConfigDto,
  IndicatorConfigResponse,
  OverlayRequestDto,
  OverlayResponse,
  ReplayInitDto,
  ReplayInitResponse,
  RuleConfigDto,
  RuleConfigResponse,
  StrategyConfigDto,
  StrategyConfigResponse
} from '../../models/trade-bot/trading-system.model';

@Injectable({ providedIn: 'root' })
export class TradingSystemService {
  private readonly apiUrl = environment.apiUrl.tradeBotAdminUrl;

  constructor(private readonly http: HttpClient) {}

  getCandles(filters: Record<string, any>): Observable<CandleBarResponse[]> {
    return this.http
      .get<BaseResponse<CandleBarResponse[]>>(`${this.apiUrl}/candles`, { params: this.params(filters) })
      .pipe(map((res) => res.data ?? []));
  }

  bulkImportCandles(payload: CandleBulkImportDto): Observable<{ imported: number }> {
    return this.http
      .post<BaseResponse<{ imported: number }>>(`${this.apiUrl}/candles/bulk-import`, payload)
      .pipe(map((res) => res.data));
  }

  deleteCandles(filters: Record<string, any>): Observable<{ deleted: number }> {
    return this.http
      .delete<BaseResponse<{ deleted: number }>>(`${this.apiUrl}/candles`, { params: this.params(filters) })
      .pipe(map((res) => res.data));
  }

  getIndicatorExecutors(): Observable<ExecutorVersionResponse[]> {
    return this.http.get<BaseResponse<ExecutorVersionResponse[]>>(`${this.apiUrl}/indicator-executors`).pipe(map((res) => res.data ?? []));
  }

  getRuleExecutors(): Observable<ExecutorVersionResponse[]> {
    return this.http.get<BaseResponse<ExecutorVersionResponse[]>>(`${this.apiUrl}/rule-executors`).pipe(map((res) => res.data ?? []));
  }

  getIndicatorConfigs(filters: Record<string, any> = {}): Observable<IndicatorConfigResponse[]> {
    return this.http.get<BaseResponse<IndicatorConfigResponse[]>>(`${this.apiUrl}/indicator-configs`, { params: this.params(filters) }).pipe(map((res) => res.data ?? []));
  }

  getIndicatorConfigPage(page = 0, size = 10, filters: Record<string, any> = {}): Observable<BasePageResponse<IndicatorConfigResponse>> {
    return this.http
      .get<BaseResponse<BasePageResponse<IndicatorConfigResponse>>>(`${this.apiUrl}/indicator-configs/page`, {
        params: this.pageParams(page, size, filters)
      })
      .pipe(map((res) => ({ data: res.data?.data ?? [], metadata: normalizePageMetadata(res.data?.metadata, page, size) })));
  }

  getIndicatorConfig(id: string): Observable<IndicatorConfigResponse> {
    return this.http.get<BaseResponse<IndicatorConfigResponse>>(`${this.apiUrl}/indicator-configs/${id}`).pipe(map((res) => res.data));
  }

  saveIndicatorConfig(id: string | null, payload: IndicatorConfigDto): Observable<IndicatorConfigResponse> {
    return id
      ? this.http.put<BaseResponse<IndicatorConfigResponse>>(`${this.apiUrl}/indicator-configs/${id}`, payload).pipe(map((res) => res.data))
      : this.http.post<BaseResponse<IndicatorConfigResponse>>(`${this.apiUrl}/indicator-configs`, payload).pipe(map((res) => res.data));
  }

  deleteIndicatorConfig(id: string): Observable<IndicatorConfigResponse> {
    return this.http.delete<BaseResponse<IndicatorConfigResponse>>(`${this.apiUrl}/indicator-configs/${id}`).pipe(map((res) => res.data));
  }

  getRuleConfigPage(page = 0, size = 10, filters: Record<string, any> = {}): Observable<BasePageResponse<RuleConfigResponse>> {
    return this.http
      .get<BaseResponse<BasePageResponse<RuleConfigResponse>>>(`${this.apiUrl}/rule-configs/page`, { params: this.pageParams(page, size, filters) })
      .pipe(map((res) => ({ data: res.data?.data ?? [], metadata: normalizePageMetadata(res.data?.metadata, page, size) })));
  }

  getRuleConfig(id: string): Observable<RuleConfigResponse> {
    return this.http.get<BaseResponse<RuleConfigResponse>>(`${this.apiUrl}/rule-configs/${id}`).pipe(map((res) => res.data));
  }

  saveRuleConfig(id: string | null, payload: RuleConfigDto): Observable<RuleConfigResponse> {
    return id
      ? this.http.put<BaseResponse<RuleConfigResponse>>(`${this.apiUrl}/rule-configs/${id}`, payload).pipe(map((res) => res.data))
      : this.http.post<BaseResponse<RuleConfigResponse>>(`${this.apiUrl}/rule-configs`, payload).pipe(map((res) => res.data));
  }

  deleteRuleConfig(id: string): Observable<RuleConfigResponse> {
    return this.http.delete<BaseResponse<RuleConfigResponse>>(`${this.apiUrl}/rule-configs/${id}`).pipe(map((res) => res.data));
  }

  getStrategyConfigPage(page = 0, size = 10, filters: Record<string, any> = {}): Observable<BasePageResponse<StrategyConfigResponse>> {
    return this.http
      .get<BaseResponse<BasePageResponse<StrategyConfigResponse>>>(`${this.apiUrl}/strategy-configs/page`, { params: this.pageParams(page, size, filters) })
      .pipe(map((res) => ({ data: res.data?.data ?? [], metadata: normalizePageMetadata(res.data?.metadata, page, size) })));
  }

  getStrategyConfig(id: string): Observable<StrategyConfigResponse> {
    return this.http.get<BaseResponse<StrategyConfigResponse>>(`${this.apiUrl}/strategy-configs/${id}`).pipe(map((res) => res.data));
  }

  saveStrategyConfig(id: string | null, payload: StrategyConfigDto): Observable<StrategyConfigResponse> {
    return id
      ? this.http.put<BaseResponse<StrategyConfigResponse>>(`${this.apiUrl}/strategy-configs/${id}`, payload).pipe(map((res) => res.data))
      : this.http.post<BaseResponse<StrategyConfigResponse>>(`${this.apiUrl}/strategy-configs`, payload).pipe(map((res) => res.data));
  }

  deleteStrategyConfig(id: string): Observable<StrategyConfigResponse> {
    return this.http.delete<BaseResponse<StrategyConfigResponse>>(`${this.apiUrl}/strategy-configs/${id}`).pipe(map((res) => res.data));
  }

  runBacktest(payload: BacktestRunDto): Observable<BacktestRunResponse> {
    return this.http.post<BaseResponse<BacktestRunResponse>>(`${this.apiUrl}/backtests`, payload).pipe(map((res) => res.data));
  }

  getBacktests(): Observable<BacktestRunResponse[]> {
    return this.http.get<BaseResponse<BacktestRunResponse[]>>(`${this.apiUrl}/backtests`).pipe(map((res) => res.data ?? []));
  }

  getBacktest(runId: string): Observable<BacktestRunResponse> {
    return this.http.get<BaseResponse<BacktestRunResponse>>(`${this.apiUrl}/backtests/${runId}`).pipe(map((res) => res.data));
  }

  getBacktestTrades(runId: string): Observable<BacktestTradeResponse[]> {
    return this.http.get<BaseResponse<BacktestTradeResponse[]>>(`${this.apiUrl}/backtests/${runId}/trades`).pipe(map((res) => res.data ?? []));
  }

  getBacktestMetrics(runId: string): Observable<BacktestMetricResponse> {
    return this.http.get<BaseResponse<BacktestMetricResponse>>(`${this.apiUrl}/backtests/${runId}/metrics`).pipe(map((res) => res.data));
  }

  getBacktestEquityCurve(runId: string): Observable<BacktestCurvePointResponse[]> {
    return this.http.get<BaseResponse<BacktestCurvePointResponse[]>>(`${this.apiUrl}/backtests/${runId}/equity-curve`).pipe(map((res) => res.data ?? []));
  }

  getBacktestDrawdownCurve(runId: string): Observable<BacktestCurvePointResponse[]> {
    return this.http.get<BaseResponse<BacktestCurvePointResponse[]>>(`${this.apiUrl}/backtests/${runId}/drawdown-curve`).pipe(map((res) => res.data ?? []));
  }

  getBacktestEvents(runId: string): Observable<BacktestEventResponse[]> {
    return this.http.get<BaseResponse<BacktestEventResponse[]>>(`${this.apiUrl}/backtests/${runId}/events`).pipe(map((res) => res.data ?? []));
  }

  getBacktestTrace(runId: string, tradeId: string): Observable<BacktestRuleTraceResponse> {
    return this.http.get<BaseResponse<BacktestRuleTraceResponse>>(`${this.apiUrl}/backtests/${runId}/trades/${tradeId}/trace`).pipe(map((res) => res.data));
  }

  initReplay(payload: ReplayInitDto): Observable<ReplayInitResponse> {
    return this.http.post<BaseResponse<ReplayInitResponse>>(`${this.apiUrl}/replay/init`, payload).pipe(map((res) => res.data));
  }

  buildOverlay(payload: OverlayRequestDto): Observable<OverlayResponse> {
    return this.http.post<BaseResponse<OverlayResponse>>(`${this.apiUrl}/overlays`, payload).pipe(map((res) => res.data));
  }

  evaluateTrace(runId: string, index: number): Observable<Record<string, unknown>> {
    return this.http
      .post<BaseResponse<Record<string, unknown>>>(`${this.apiUrl}/backtests/${runId}/evaluate-trace`, { index })
      .pipe(map((res) => res.data));
  }

  evaluateStrategy(runId: string, index: number): Observable<Record<string, unknown>> {
    return this.http
      .post<BaseResponse<Record<string, unknown>>>(`${this.apiUrl}/backtests/${runId}/evaluate-strategy`, { index })
      .pipe(map((res) => res.data));
  }

  private pageParams(page: number, size: number, filters: Record<string, any>): HttpParams {
    return this.params(filters).set('page', page).set('size', size);
  }

  private params(filters: Record<string, any>): HttpParams {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return params;
  }
}
