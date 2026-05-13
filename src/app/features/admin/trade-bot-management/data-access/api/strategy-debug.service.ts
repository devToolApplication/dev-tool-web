import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TradingSystemService } from './trading-system.service';

@Injectable({ providedIn: 'root' })
export class StrategyDebugService {
  constructor(private readonly tradingSystemService: TradingSystemService) {}

  evaluateTrace(runId: string, index: number): Observable<Record<string, unknown>> {
    return this.tradingSystemService.evaluateTrace(runId, index);
  }

  evaluateStrategy(runId: string, index: number): Observable<Record<string, unknown>> {
    return this.tradingSystemService.evaluateStrategy(runId, index);
  }

  getBacktestReviewRuleTrace(runId: string, tradeId: string): Observable<Record<string, unknown>> {
    return this.tradingSystemService.getBacktestReviewRuleTrace(runId, tradeId);
  }
}
