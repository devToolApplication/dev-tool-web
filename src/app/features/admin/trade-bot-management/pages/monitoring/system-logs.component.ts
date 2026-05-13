import { Component, OnInit, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { SystemLogResponse } from '../../../../../core/models/trade-bot/trading-system.model';
import { TradingSystemService } from '../../../../../core/services/trade-bot-service/trading-system.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { FormConfig, FormContext } from '../../../../../shared/ui/form-input/models/form-config.model';
import { TableConfig } from '../../../../../shared/ui/table/models/table-config.model';

@Component({
  selector: 'app-system-logs',
  standalone: false,
  templateUrl: './system-logs.component.html'
})
export class SystemLogsComponent implements OnInit {
  readonly loading = signal(false);
  readonly logs = signal<SystemLogResponse[]>([]);
  readonly filterModel = signal<Record<string, unknown>>({ module: '', limit: 100 });
  readonly formContext: FormContext = { user: null, mode: 'create' };
  readonly filterForm: FormConfig = {
    fields: [
      { name: 'module', type: 'text', label: 'tradeBot.field.module', width: '1/2' },
      { name: 'limit', type: 'number', label: 'tradeBot.field.limit', width: '1/2' }
    ]
  };
  readonly tableConfig: TableConfig = {
    title: 'tradeBot.logs.title',
    columns: [
      { field: 'time', header: 'tradeBot.field.time', type: 'date', minWidth: '13rem' },
      { field: 'module', header: 'tradeBot.field.module' },
      { field: 'level', header: 'tradeBot.field.level' },
      { field: 'status', header: 'tradeBot.field.status' },
      { field: 'runId', header: 'tradeBot.field.runId', minWidth: '18rem' },
      { field: 'message', header: 'tradeBot.field.message', minWidth: '18rem' },
      { field: 'symbol', header: 'tradeBot.field.symbol' },
      { field: 'timeframe', header: 'tradeBot.field.timeframe' }
    ],
    pagination: true,
    rows: 25,
    scrollable: true,
    minWidth: '110rem'
  };

  constructor(
    private readonly service: TradingSystemService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly i18nService: I18nService
  ) {}

  ngOnInit(): void {
    this.load(this.filterModel());
  }

  load(model: Record<string, unknown>): void {
    this.loading.set(true);
    this.loadingService
      .track(this.service.getSystemLogs(model))
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (logs) => this.logs.set(logs),
        error: () => this.toastService.error(this.i18nService.t('tradeBot.message.loadFailed'))
      });
  }
}
