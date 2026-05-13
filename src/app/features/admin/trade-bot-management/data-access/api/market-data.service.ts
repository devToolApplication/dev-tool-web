import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  BinanceUsdmCandleSyncDto,
  BinanceUsdmCandleSyncResponse,
  CandleBarResponse,
  CandleBulkImportDto,
  CandleGapResponse,
  CandleSyncRunResponse
} from '../models/market-data.model';
import { TradingSystemService } from './trading-system.service';

export type MarketDataSyncMode = 'latest' | 'range' | 'backfill' | 'repair-gap';

@Injectable({ providedIn: 'root' })
export class MarketDataService {
  constructor(private readonly tradingSystemService: TradingSystemService) {}

  getCandles(filters: Record<string, unknown>): Observable<CandleBarResponse[]> {
    return this.tradingSystemService.getCandles(filters);
  }

  bulkImportCandles(payload: CandleBulkImportDto): Observable<{ imported: number }> {
    return this.tradingSystemService.bulkImportCandles(payload);
  }

  syncBinanceUsdm(payload: BinanceUsdmCandleSyncDto, mode: MarketDataSyncMode = 'latest'): Observable<BinanceUsdmCandleSyncResponse> {
    return this.tradingSystemService.syncBinanceUsdm(payload, mode);
  }

  getCandleSyncRuns(filters: Record<string, unknown> = {}): Observable<CandleSyncRunResponse[]> {
    return this.tradingSystemService.getCandleSyncRuns(filters);
  }

  getCandleGaps(filters: Record<string, unknown> = {}): Observable<CandleGapResponse[]> {
    return this.tradingSystemService.getCandleGaps(filters);
  }

  repairCandleGap(gapId: string): Observable<BinanceUsdmCandleSyncResponse> {
    return this.tradingSystemService.repairCandleGap(gapId);
  }

  ignoreCandleGap(gapId: string): Observable<CandleGapResponse> {
    return this.tradingSystemService.ignoreCandleGap(gapId);
  }
}
