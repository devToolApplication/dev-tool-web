import { Component, computed, EventEmitter, Input, Output } from '@angular/core';
import { BacktestMetricResponse, BacktestRunResponse, CandleBarResponse } from '../../../../../../../../core/models/trade-bot/trading-system.model';
import { TableConfig } from '../../../../../../../../shared/ui/table/models/table-config.model';

@Component({
  selector: 'app-backtest-overview-tab',
  standalone: false,
  templateUrl: './backtest-overview-tab.component.html'
})
export class BacktestOverviewTabComponent {
  @Input() run: BacktestRunResponse | null = null;
  @Input() metrics: BacktestMetricResponse | null = null;
  @Input() chartCandlesRaw: CandleBarResponse[] = [];
  @Input() marketDataSnapshot: Record<string, unknown> | null = null;
  @Input() loading = false;
  @Input() error: string | null = null;
  @Input() runId = '';
  @Output() retry = new EventEmitter<void>();

  readonly runFacts = computed(() => {
    const run = this.run;
    return [
      { label: 'tradeBot.field.runId', value: run?.runId ?? this.runId },
      { label: 'tradeBot.field.strategyCode', value: run?.strategyCode },
      { label: 'tradeBot.field.symbol', value: run?.symbol },
      { label: 'tradeBot.field.timeframe', value: run?.timeframe },
      { label: 'tradeBot.field.fromTime', value: run?.fromTime },
      { label: 'tradeBot.field.toTime', value: run?.toTime },
      { label: 'tradeBot.field.candleRangeHash', value: run?.candleRangeHash }
    ];
  });

  readonly metricRows = computed(() =>
    Object.entries(this.metrics?.metrics ?? {}).map(([metric, value]) => ({
      metric,
      value: valueOrNull(value)
    }))
  );

  readonly metricTableConfig: TableConfig = {
    title: 'tradeBot.backtest.metrics',
    columns: [
      { field: 'metric', header: 'tradeBot.field.metric', minWidth: '14rem' },
      { field: 'value', header: 'tradeBot.field.value', minWidth: '14rem' }
    ],
    pagination: true,
    rows: 12,
    minWidth: '32rem'
  };
}

function valueOrNull(value: unknown): string | number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  return typeof value === 'number' || typeof value === 'string' ? value : String(value);
}
