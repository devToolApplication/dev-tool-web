import { Component, computed, EventEmitter, Input, Output } from '@angular/core';
import { CandleGapResponse } from '../../../../../../../core/models/trade-bot/trading-system.model';
import { TableConfig } from '../../../../../../../shared/ui/table/models/table-config.model';
import { MARKET_SOURCE_OPTIONS, SYMBOL_OPTIONS, TIMEFRAME_OPTIONS } from '../../../../trade-bot-runtime.constants';

@Component({
  selector: 'app-market-data-gap-tab',
  standalone: false,
  templateUrl: './market-data-gap-tab.component.html'
})
export class MarketDataGapTabComponent {
  @Input() gaps: CandleGapResponse[] = [];
  @Input() loading = false;
  @Input() error: string | null = null;
  @Output() search = new EventEmitter<Record<string, unknown>>();
  @Output() resetFilter = new EventEmitter<void>();
  @Output() retryGaps = new EventEmitter<void>();
  @Output() repairGap = new EventEmitter<CandleGapResponse>();
  @Output() ignoreGap = new EventEmitter<CandleGapResponse>();
  @Output() navigateToSync = new EventEmitter<void>();

  readonly openGaps = computed(() => this.gaps.filter((gap) => String(gap.status ?? '').toUpperCase() === 'OPEN'));

  readonly gapSummaryCards = computed(() => [
    { label: 'tradeBot.market.summary.openGaps', value: this.openGaps().length },
    { label: 'tradeBot.market.summary.missingBars', value: this.openGaps().reduce((sum, gap) => sum + Number(gap.missingBars ?? 0), 0) },
    { label: 'tradeBot.market.summary.repairedToday', value: this.gaps.filter((gap) => String(gap.status ?? '').toUpperCase() === 'REPAIRED' && isToday(gap.repairedAt)).length },
    { label: 'tradeBot.market.summary.ignoredGaps', value: this.gaps.filter((gap) => String(gap.status ?? '').toUpperCase() === 'IGNORED').length }
  ]);

  readonly gapTableConfig: TableConfig = {
    title: 'tradeBot.sync.gaps',
    filters: [
      { field: 'status', label: 'tradeBot.field.status', type: 'select', options: [
        { label: 'OPEN', value: 'OPEN' },
        { label: 'REPAIRED', value: 'REPAIRED' },
        { label: 'IGNORED', value: 'IGNORED' }
      ], defaultValue: 'OPEN' },
      { field: 'source', label: 'tradeBot.field.source', type: 'select', options: MARKET_SOURCE_OPTIONS },
      { field: 'symbol', label: 'tradeBot.field.symbol', type: 'autocomplete', options: SYMBOL_OPTIONS },
      { field: 'timeframe', label: 'tradeBot.field.timeframe', type: 'select', options: TIMEFRAME_OPTIONS }
    ],
    filterOptions: { primaryField: 'symbol', enableUrlSync: true },
    columns: [
      { field: 'createdAt', header: 'tradeBot.field.createdAt', type: 'date', minWidth: '13rem' },
      { field: 'source', header: 'tradeBot.field.source' },
      { field: 'marketType', header: 'tradeBot.field.marketType' },
      { field: 'feedCode', header: 'tradeBot.field.feedCode', minWidth: '14rem' },
      { field: 'symbol', header: 'tradeBot.field.symbol' },
      { field: 'timeframe', header: 'tradeBot.field.timeframe' },
      { field: 'expectedOpenTime', header: 'tradeBot.field.expectedOpenTime', type: 'date', minWidth: '13rem' },
      { field: 'nextAvailableOpenTime', header: 'tradeBot.field.nextAvailableOpenTime', type: 'date', minWidth: '13rem' },
      { field: 'missingBars', header: 'tradeBot.field.missingBars', type: 'number' },
      { field: 'status', header: 'tradeBot.field.status', type: 'badge' },
      { field: 'detectedRunId', header: 'tradeBot.field.detectedRunId', type: 'copyable', minWidth: '18rem' },
      { field: 'repairedRunId', header: 'tradeBot.field.repairedRunId', type: 'copyable', minWidth: '18rem' },
      {
        field: 'actions',
        header: 'tradeBot.field.actions',
        type: 'actions',
        minWidth: '13rem',
        actions: [
          {
            label: 'tradeBot.action.repairGap',
            icon: 'pi pi-wrench',
            severity: 'warn',
            showLabel: false,
            disabled: (row) => this.isClosedGap(row),
            onClick: (row) => this.repairGap.emit(row)
          },
          {
            label: 'tradeBot.action.ignoreGap',
            icon: 'pi pi-ban',
            severity: 'secondary',
            showLabel: false,
            disabled: (row) => this.isClosedGap(row),
            onClick: (row) => this.ignoreGap.emit(row)
          },
          {
            label: 'tradeBot.action.viewSyncRun',
            icon: 'pi pi-history',
            severity: 'info',
            showLabel: false,
            onClick: () => this.navigateToSync.emit()
          }
        ]
      }
    ],
    pagination: true,
    rows: 10,
    scrollable: true,
    minWidth: '76rem'
  };

  isClosedGap(gap: CandleGapResponse): boolean {
    return ['REPAIRED', 'IGNORED'].includes(String(gap.status ?? '').toUpperCase());
  }
}

function isToday(dateValue: unknown): boolean {
  if (!dateValue) {
    return false;
  }
  const date = new Date(String(dateValue));
  if (Number.isNaN(date.getTime())) {
    return false;
  }
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}
