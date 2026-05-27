import { Component, computed, EventEmitter, Input, Output } from '@angular/core';
import { BacktestCurvePointResponse } from '../../../../../../../../core/models/trade-bot/trading-system.model';
import { TableConfig } from '../../../../../../../../shared/ui/table/models/table-config.model';

@Component({
  selector: 'app-backtest-equity-tab',
  standalone: false,
  templateUrl: './backtest-equity-tab.component.html',
  styleUrl: './backtest-equity-tab.component.css'
})
export class BacktestEquityTabComponent {
  @Input() equity: BacktestCurvePointResponse[] = [];
  @Input() drawdown: BacktestCurvePointResponse[] = [];
  @Input() loading = false;
  @Input() error: string | null = null;
  @Output() retry = new EventEmitter<void>();

  readonly equityRows = computed(() => this.equity.map((point) => ({ ...point, curve: 'Equity' })));
  readonly drawdownRows = computed(() => this.drawdown.map((point) => ({ ...point, curve: 'Drawdown' })));
  readonly equityTrend = computed(() => trendPoints(this.equity, 'equity', 'balance'));
  readonly drawdownTrend = computed(() => trendPoints(this.drawdown, 'drawdownPct', 'drawdown'));

  readonly curveTableConfig: TableConfig = {
    title: 'tradeBot.backtest.curves',
    columns: [
      { field: 'curve', header: 'tradeBot.field.type' },
      { field: 'barIndex', header: 'tradeBot.field.index', type: 'number' },
      { field: 'time', header: 'tradeBot.field.time', type: 'date', minWidth: '13rem' },
      { field: 'balance', header: 'tradeBot.field.currentBalance', type: 'number' },
      { field: 'equity', header: 'tradeBot.field.equity', type: 'number' },
      { field: 'drawdown', header: 'tradeBot.field.drawdown', type: 'number' },
      { field: 'drawdownPct', header: 'tradeBot.field.drawdownPct', type: 'number', suffix: '%' }
    ],
    pagination: true,
    rows: 20,
    minWidth: '74rem'
  };
}

function trendPoints(points: BacktestCurvePointResponse[], primaryField: 'equity' | 'drawdownPct', fallbackField: 'balance' | 'drawdown'): Array<{ height: number; label: string; value: number }> {
  const values = points
    .map((point) => Number(point[primaryField] ?? point[fallbackField] ?? 0))
    .filter((value) => Number.isFinite(value));
  if (!values.length) {
    return [];
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values.slice(-80).map((value, index) => ({
    value,
    label: String(points[index]?.barIndex ?? index),
    height: Math.max(8, ((value - min) / range) * 100)
  }));
}
