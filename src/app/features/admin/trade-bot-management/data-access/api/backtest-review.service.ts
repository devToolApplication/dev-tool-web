import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  BacktestChartReviewResponse,
  BacktestCurvePointResponse,
  BacktestEventResponse,
  BacktestMetricResponse,
  BacktestOrderResponse,
  BacktestPositionResponse,
  BacktestReportExportResponse,
  BacktestReviewResponse,
  BacktestRunResponse,
  BacktestTradeResponse,
  CandleBarResponse
} from '../models/backtest-review.model';
import { TradingSystemService } from './trading-system.service';

@Injectable({ providedIn: 'root' })
export class BacktestReviewService {
  constructor(private readonly tradingSystemService: TradingSystemService) {}

  getBacktest(runId: string): Observable<BacktestRunResponse> {
    return this.tradingSystemService.getBacktest(runId);
  }

  getBacktestTrades(runId: string): Observable<BacktestTradeResponse[]> {
    return this.tradingSystemService.getBacktestTrades(runId);
  }

  getBacktestMetrics(runId: string): Observable<BacktestMetricResponse> {
    return this.tradingSystemService.getBacktestMetrics(runId);
  }

  getBacktestEquityCurve(runId: string): Observable<BacktestCurvePointResponse[]> {
    return this.tradingSystemService.getBacktestEquityCurve(runId);
  }

  getBacktestDrawdownCurve(runId: string): Observable<BacktestCurvePointResponse[]> {
    return this.tradingSystemService.getBacktestDrawdownCurve(runId);
  }

  getBacktestReviewEvents(runId: string, filters: Record<string, unknown> = {}): Observable<BacktestEventResponse[]> {
    return this.tradingSystemService.getBacktestReviewEvents(runId, filters);
  }

  getBacktestReview(runId: string): Observable<BacktestReviewResponse> {
    return this.tradingSystemService.getBacktestReview(runId);
  }

  getBacktestReviewChart(runId: string): Observable<BacktestChartReviewResponse> {
    return this.tradingSystemService.getBacktestReviewChart(runId);
  }

  getBacktestReviewTrades(runId: string): Observable<BacktestTradeResponse[]> {
    return this.tradingSystemService.getBacktestReviewTrades(runId);
  }

  getBacktestReviewTradeDetail(runId: string, tradeId: string): Observable<Record<string, unknown>> {
    return this.tradingSystemService.getBacktestReviewTradeDetail(runId, tradeId);
  }

  getBacktestReviewOrdersFills(runId: string): Observable<{ orders: BacktestOrderResponse[]; fills: BacktestOrderResponse[]; positions?: BacktestPositionResponse[] }> {
    return this.tradingSystemService.getBacktestReviewOrdersFills(runId);
  }

  getBacktestReviewRuleTrace(runId: string, tradeId: string): Observable<Record<string, unknown>> {
    return this.tradingSystemService.getBacktestReviewRuleTrace(runId, tradeId);
  }

  getBacktestReviewConfigSnapshot(runId: string): Observable<Record<string, unknown>> {
    return this.tradingSystemService.getBacktestReviewConfigSnapshot(runId);
  }

  getBacktestReviewMarketDataSnapshot(runId: string): Observable<Record<string, unknown>> {
    return this.tradingSystemService.getBacktestReviewMarketDataSnapshot(runId);
  }

  getCandles(filters: Record<string, unknown>): Observable<CandleBarResponse[]> {
    return this.tradingSystemService.getCandles(filters);
  }

  exportBacktestReport(runId: string, format = 'json'): Observable<BacktestReportExportResponse> {
    return this.tradingSystemService.exportBacktestReport(runId, format);
  }
}
