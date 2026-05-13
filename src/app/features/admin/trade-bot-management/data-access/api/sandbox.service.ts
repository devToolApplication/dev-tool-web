import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  EvaluateBarRequest,
  EvaluateBarResponse,
  FastBacktestRequest,
  FastBacktestResponse
} from '../models/sandbox.model';
import { TradingSystemService } from './trading-system.service';

@Injectable({ providedIn: 'root' })
export class SandboxService {
  constructor(private readonly tradingSystemService: TradingSystemService) {}

  runFastBacktest(payload: FastBacktestRequest): Observable<FastBacktestResponse> {
    return this.tradingSystemService.runFastBacktest(payload);
  }

  evaluateBar(payload: EvaluateBarRequest): Observable<EvaluateBarResponse> {
    return this.tradingSystemService.evaluateBar(payload);
  }
}
