import { Injectable, signal } from '@angular/core';
import type { QuantDatasetDto, QuantStrategyDto } from '../models/quant-backtest.dto';

@Injectable({ providedIn: 'root' })
export class QuantBacktestStateService {
  readonly runsFilters = signal<Record<string, unknown>>({});
  readonly runsPage = signal<number>(1);
  readonly runsPageSize = signal<number>(10);

  readonly cachedStrategies = signal<QuantStrategyDto[] | null>(null);
  readonly cachedDatasets = signal<QuantDatasetDto[] | null>(null);

  setFilters(filters: Record<string, unknown>): void {
    this.runsFilters.set(filters);
    this.runsPage.set(1);
  }

  resetFilters(): void {
    this.runsFilters.set({});
    this.runsPage.set(1);
  }

  setPage(page: number, pageSize?: number): void {
    this.runsPage.set(page);
    if (pageSize) {
      this.runsPageSize.set(pageSize);
    }
  }

  cacheStrategies(strategies: QuantStrategyDto[]): void {
    this.cachedStrategies.set(strategies);
  }

  cacheDatasets(datasets: QuantDatasetDto[]): void {
    this.cachedDatasets.set(datasets);
  }
}
