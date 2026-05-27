import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CandleSyncRunResponse } from '../../../../../../../core/models/trade-bot/trading-system.model';
import { TaskProgressState } from '../../../../../../../core/models/realtime/realtime.model';
import { FormContext } from '../../../../../../../shared/ui/form-input/models/form-config.model';
import { TableConfig } from '../../../../../../../shared/ui/table/models/table-config.model';
import { BINANCE_USDM_SYNC_FORM } from '../../../../trade-bot-runtime.constants';

@Component({
  selector: 'app-market-data-sync-tab',
  standalone: false,
  templateUrl: './market-data-sync-tab.component.html'
})
export class MarketDataSyncTabComponent {
  @Input() syncRuns: CandleSyncRunResponse[] = [];
  @Input() syncLoading = false;
  @Input() syncRunError: string | null = null;
  @Input() syncProgress: TaskProgressState | null = null;
  @Output() syncSubmit = new EventEmitter<Record<string, unknown>>();
  @Output() cancelSync = new EventEmitter<void>();
  @Output() retrySyncRuns = new EventEmitter<void>();

  readonly syncForm = BINANCE_USDM_SYNC_FORM;
  readonly formContext: FormContext = { user: null, mode: 'create' };
  readonly syncInitialValue = {
    symbolsText: 'BTCUSDT',
    timeframesText: ['1m'],
    mode: 'latest',
    fromTime: '',
    toTime: '',
    initialLookbackHours: 24,
    limit: 1000,
    maxPages: null,
    lookbackBars: 3,
    onlyClosedCandle: true
  };

  readonly syncRunTableConfig: TableConfig = {
    title: 'tradeBot.sync.runs',
    columns: [
      { field: 'startedAt', header: 'tradeBot.field.startedAt', type: 'date', minWidth: '13rem' },
      { field: 'source', header: 'tradeBot.field.source' },
      { field: 'symbol', header: 'tradeBot.field.symbol' },
      { field: 'timeframe', header: 'tradeBot.field.timeframe' },
      { field: 'mode', header: 'tradeBot.field.mode' },
      { field: 'status', header: 'tradeBot.field.status', type: 'badge' },
      { field: 'fetched', header: 'tradeBot.field.fetched', type: 'number' },
      { field: 'inserted', header: 'tradeBot.field.inserted', type: 'number' },
      { field: 'updated', header: 'tradeBot.field.updated', type: 'number' },
      { field: 'gapsDetected', header: 'tradeBot.field.gapsDetected', type: 'number' },
      { field: 'durationMs', header: 'tradeBot.field.duration', type: 'duration' },
      { field: 'errorMessage', header: 'tradeBot.field.errorMessage', minWidth: '16rem' }
    ],
    pagination: true,
    rows: 10,
    scrollable: true,
    minWidth: '78rem'
  };
}
