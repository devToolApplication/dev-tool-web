import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../../../enviroment/environment';
import { BasePageResponse, BaseResponse, normalizePageMetadata } from '../../../../../core/models/base-response.model';
import {
  BacktestCurvePointResponse,
  BacktestEventResponse,
  BacktestMetricResponse,
  BacktestChartReviewResponse,
  BacktestOrderResponse,
  BacktestPositionResponse,
  BacktestReportExportResponse,
  BacktestReviewResponse,
  BacktestReviewSummaryResponse,
  BacktestRuleTraceResponse,
  BacktestRunDto,
  BacktestRunResponse,
  BacktestStartResponse,
  BacktestTradeResponse,
  BinanceUsdmCandleSyncDto,
  BinanceUsdmCandleSyncResponse,
  CandleBarResponse,
  CandleBulkImportDto,
  CandleGapResponse,
  CandleMarketOptionResponse,
  CandleSyncRunResponse,
  CacheEvictRequest,
  CacheMonitorResponse,
  ConfigVersionHistoryResponse,
  EvaluateBarRequest,
  EvaluateBarResponse,
  ExecutorVersionResponse,
  FastBacktestRequest,
  FastBacktestResponse,
  IndicatorConfigDto,
  IndicatorConfigResponse,
  OverlayRequestDto,
  OverlayResponse,
  ReplayInitDto,
  ReplayInitResponse,
  RuleConfigDto,
  RuleConfigResponse,
  SystemLogResponse,
  StrategyConfigDto,
  StrategyConfigResponse
} from '../models/trading-system.model';

@Injectable({ providedIn: 'root' })
export class TradingSystemService {
  private readonly apiUrl = environment.apiUrl.tradeBotAdminUrl;
  private readonly marketDataApiUrl = environment.apiUrl.tradeBotUrl.replace(/\/v1$/, '/api/market-data');

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

  syncBinanceUsdm(payload: BinanceUsdmCandleSyncDto, mode: 'latest' | 'range' | 'backfill' | 'repair-gap' = 'latest'): Observable<BinanceUsdmCandleSyncResponse> {
    const suffix = mode === 'latest' ? '' : `/${mode}`;
    return this.http
      .post<BaseResponse<BinanceUsdmCandleSyncResponse>>(`${this.apiUrl}/candles/sync/binance-usdm${suffix}`, payload)
      .pipe(map((res) => res.data));
  }

  getCandleSyncRuns(filters: Record<string, any> = {}): Observable<CandleSyncRunResponse[]> {
    return this.http
      .get<BaseResponse<CandleSyncRunResponse[]>>(`${this.apiUrl}/candles/sync-runs`, { params: this.params(filters) })
      .pipe(map((res) => res.data ?? []));
  }

  getCandleMarketOptions(limit = 200): Observable<CandleMarketOptionResponse[]> {
    return this.http
      .get<BaseResponse<CandleMarketOptionResponse[]>>(`${this.apiUrl}/candles/markets`, { params: this.params({ limit }) })
      .pipe(map((res) => res.data ?? []));
  }

  getCandleGaps(filters: Record<string, any> = {}): Observable<CandleGapResponse[]> {
    return this.http
      .get<BaseResponse<CandleGapResponse[]>>(`${this.apiUrl}/candles/gaps`, { params: this.params(filters) })
      .pipe(map((res) => res.data ?? []));
  }

  repairCandleGap(gapId: string): Observable<BinanceUsdmCandleSyncResponse> {
    return this.http
      .post<BaseResponse<BinanceUsdmCandleSyncResponse>>(`${this.apiUrl}/candles/gaps/${gapId}/repair`, {})
      .pipe(map((res) => res.data));
  }

  ignoreCandleGap(gapId: string): Observable<CandleGapResponse> {
    return this.http
      .post<BaseResponse<CandleGapResponse>>(`${this.apiUrl}/candles/gaps/${gapId}/ignore`, {})
      .pipe(map((res) => res.data));
  }

  getMarketDataDashboard(limit = 50): Observable<Record<string, unknown>> {
    return this.http
      .get<BaseResponse<Record<string, unknown>>>(`${this.marketDataApiUrl}/dashboard`, { params: this.params({ limit }) })
      .pipe(map((res) => res.data ?? {}));
  }

  getIndicatorExecutors(): Observable<ExecutorVersionResponse[]> {
    return this.http.get<BaseResponse<ExecutorVersionResponse[]>>(`${this.apiUrl}/indicator-executors`).pipe(map((res) => res.data ?? []));
  }

  getRuleExecutors(): Observable<ExecutorVersionResponse[]> {
    return this.http.get<BaseResponse<ExecutorVersionResponse[]>>(`${this.apiUrl}/rule-executors`).pipe(map((res) => res.data ?? []));
  }

  getStrategyExecutors(): Observable<ExecutorVersionResponse[]> {
    return this.http.get<BaseResponse<ExecutorVersionResponse[]>>(`${this.apiUrl}/strategy-executors`).pipe(map((res) => res.data ?? []));
  }

  getIndicatorConfigs(filters: Record<string, any> = {}): Observable<IndicatorConfigResponse[]> {
    return this.http.get<BaseResponse<IndicatorConfigResponse[]>>(`${this.apiUrl}/indicator-configs`, { params: this.params(filters) }).pipe(map((res) => res.data ?? []));
  }

  getIndicatorConfigPage(
    page = 0,
    size = 10,
    filters: Record<string, any> = {},
    sort: string[] = []
  ): Observable<BasePageResponse<IndicatorConfigResponse>> {
    return this.http
      .get<BaseResponse<BasePageResponse<IndicatorConfigResponse>>>(`${this.apiUrl}/indicator-configs/page`, {
        params: this.pageParams(page, size, filters, sort)
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

  getRuleConfigPage(
    page = 0,
    size = 10,
    filters: Record<string, any> = {},
    sort: string[] = []
  ): Observable<BasePageResponse<RuleConfigResponse>> {
    return this.http
      .get<BaseResponse<BasePageResponse<RuleConfigResponse>>>(`${this.apiUrl}/rule-configs/page`, { params: this.pageParams(page, size, filters, sort) })
      .pipe(map((res) => ({ data: res.data?.data ?? [], metadata: normalizePageMetadata(res.data?.metadata, page, size) })));
  }

  getRuleConfigs(filters: Record<string, any> = {}): Observable<RuleConfigResponse[]> {
    return this.http.get<BaseResponse<RuleConfigResponse[]>>(`${this.apiUrl}/rule-configs`, { params: this.params(filters) }).pipe(map((res) => res.data ?? []));
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

  getStrategyConfigPage(
    page = 0,
    size = 10,
    filters: Record<string, any> = {},
    sort: string[] = []
  ): Observable<BasePageResponse<StrategyConfigResponse>> {
    return this.http
      .get<BaseResponse<BasePageResponse<StrategyConfigResponse>>>(`${this.apiUrl}/strategy-configs/page`, { params: this.pageParams(page, size, filters, sort) })
      .pipe(map((res) => ({ data: res.data?.data ?? [], metadata: normalizePageMetadata(res.data?.metadata, page, size) })));
  }

  getStrategyConfigs(filters: Record<string, any> = {}): Observable<StrategyConfigResponse[]> {
    return this.http.get<BaseResponse<StrategyConfigResponse[]>>(`${this.apiUrl}/strategy-configs`, { params: this.params(filters) }).pipe(map((res) => res.data ?? []));
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

  getConfigVersions(type: 'indicator' | 'rule' | 'strategy', id: string): Observable<ConfigVersionHistoryResponse> {
    return this.http
      .get<BaseResponse<ConfigVersionHistoryResponse>>(`${this.apiUrl}/${type}-configs/${id}/versions`)
      .pipe(map((res) => res.data));
  }

  runBacktest(payload: BacktestRunDto): Observable<BacktestRunResponse> {
    return this.http.post<BaseResponse<BacktestRunResponse>>(`${this.apiUrl}/backtests`, payload).pipe(map((res) => res.data));
  }

  startBacktest(payload: BacktestRunDto): Observable<BacktestStartResponse> {
    return this.http.post<BaseResponse<BacktestStartResponse>>(`${this.apiUrl}/backtests/start`, payload).pipe(map((res) => res.data));
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

  getBacktestReviewSummary(runId: string): Observable<BacktestReviewSummaryResponse> {
    return this.http.get<BaseResponse<BacktestReviewSummaryResponse>>(`${this.apiUrl}/backtest-review/${runId}/summary`).pipe(map((res) => res.data));
  }

  getBacktestReview(runId: string): Observable<BacktestReviewResponse> {
    return this.http.get<BaseResponse<BacktestReviewResponse>>(`${this.apiUrl}/backtest-review/${runId}`).pipe(map((res) => res.data));
  }

  getBacktestReviewChart(runId: string, includeCandles = true): Observable<BacktestChartReviewResponse> {
    return this.http
      .get<BaseResponse<BacktestChartReviewResponse>>(`${this.apiUrl}/backtest-review/${runId}/chart`, { params: this.params({ includeCandles }) })
      .pipe(map((res) => res.data));
  }

  getBacktestReviewTrades(runId: string): Observable<BacktestTradeResponse[]> {
    return this.http
      .get<BaseResponse<{ trades?: BacktestTradeResponse[] }>>(`${this.apiUrl}/backtest-review/${runId}/trades`)
      .pipe(map((res) => res.data?.trades ?? []));
  }

  getBacktestReviewTradeDetail(runId: string, tradeId: string): Observable<Record<string, unknown>> {
    return this.http.get<BaseResponse<Record<string, unknown>>>(`${this.apiUrl}/backtest-review/${runId}/trades/${tradeId}`).pipe(map((res) => res.data ?? {}));
  }

  getBacktestReviewOrdersFills(runId: string): Observable<{ orders: BacktestOrderResponse[]; fills: BacktestOrderResponse[]; positions?: BacktestPositionResponse[] }> {
    return this.http
      .get<BaseResponse<{ orders?: BacktestOrderResponse[]; fills?: BacktestOrderResponse[]; positions?: BacktestPositionResponse[] }>>(`${this.apiUrl}/backtest-review/${runId}/orders-fills`)
      .pipe(map((res) => ({ orders: res.data?.orders ?? [], fills: res.data?.fills ?? [], positions: res.data?.positions ?? [] })));
  }

  getBacktestReviewEvents(runId: string, filters: Record<string, any> = {}): Observable<BacktestEventResponse[]> {
    return this.http
      .get<BaseResponse<{ events?: BacktestEventResponse[] }>>(`${this.apiUrl}/backtest-review/${runId}/events`, { params: this.params(filters) })
      .pipe(map((res) => res.data?.events ?? []));
  }

  getBacktestReviewRuleTrace(runId: string, tradeId: string): Observable<Record<string, unknown>> {
    return this.http
      .get<BaseResponse<{ ruleTrace?: Record<string, unknown> }>>(`${this.apiUrl}/backtest-review/${runId}/rule-trace/${tradeId}`)
      .pipe(map((res) => res.data?.ruleTrace ?? {}));
  }

  getBacktestReviewConfigSnapshot(runId: string): Observable<Record<string, unknown>> {
    return this.http.get<BaseResponse<Record<string, unknown>>>(`${this.apiUrl}/backtest-review/${runId}/config-snapshot`).pipe(map((res) => res.data ?? {}));
  }

  getBacktestReviewMarketDataSnapshot(runId: string): Observable<Record<string, unknown>> {
    return this.http.get<BaseResponse<Record<string, unknown>>>(`${this.apiUrl}/backtest-review/${runId}/market-data-snapshot`).pipe(map((res) => res.data ?? {}));
  }

  exportBacktestReport(runId: string, format = 'json'): Observable<BacktestReportExportResponse> {
    return this.http
      .get<BaseResponse<BacktestReportExportResponse>>(`${this.apiUrl}/backtest-review/${runId}/export`, { params: this.params({ format }) })
      .pipe(map((res) => res.data));
  }

  runFastBacktest(payload: FastBacktestRequest): Observable<FastBacktestResponse> {
    return this.http.post<BaseResponse<FastBacktestResponse>>(`${this.apiUrl}/sandbox/fast-backtest`, payload).pipe(map((res) => res.data));
  }

  evaluateBar(payload: EvaluateBarRequest): Observable<EvaluateBarResponse> {
    return this.http.post<BaseResponse<EvaluateBarResponse>>(`${this.apiUrl}/evaluate-bar`, payload).pipe(map((res) => res.data));
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

  getCacheMonitor(): Observable<CacheMonitorResponse> {
    return this.http.get<BaseResponse<CacheMonitorResponse>>(`${this.apiUrl}/cache-monitor`).pipe(map((res) => res.data ?? {}));
  }

  evictCache(payload: CacheEvictRequest): Observable<Record<string, unknown>> {
    return this.http.post<BaseResponse<Record<string, unknown>>>(`${this.apiUrl}/cache-monitor/evict`, payload).pipe(map((res) => res.data ?? {}));
  }

  getSystemLogs(filters: Record<string, any> = {}): Observable<SystemLogResponse[]> {
    return this.http.get<BaseResponse<SystemLogResponse[]>>(`${this.apiUrl}/system-logs`, { params: this.params(filters) }).pipe(map((res) => res.data ?? []));
  }

  private pageParams(page: number, size: number, filters: Record<string, any>, sort: string[] = []): HttpParams {
    let params = this.params(filters).set('page', page).set('size', size);
    sort.forEach((item) => {
      params = params.append('sort', item);
    });
    return params;
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
