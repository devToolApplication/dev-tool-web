import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { DEFAULT_TABLE_ROWS, DEFAULT_TABLE_ROWS_PER_PAGE } from '../../../../../core/constants/system.constants';
import { BasePageResponse } from '../../../../../core/models/base-response.model';
import { SyncConfigResponse } from '../../../../../core/models/trade-bot/sync-config.model';
import { SyncConfigService } from '../../../../../core/services/trade-bot-service/sync-config.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { TableConfig } from '../../../../../shared/ui/table/models/table-config.model';
import { TRADE_BOT_ROUTES } from '../../trade-bot.constants';

@Component({
  selector: 'app-sync-config-list',
  standalone: false,
  templateUrl: './sync-config-list.component.html'
})
export class SyncConfigListComponent implements OnInit {
  readonly tableConfig: TableConfig = {
    title: 'tradeBot.dataSourceTitle',
    toolbar: {
      new: { visible: true, label: 'tradeBot.newDataSource', icon: 'pi pi-plus', severity: 'success' }
    },
    columns: [
      { field: 'dataResource', header: 'tradeBot.dataResource', sortable: true },
      { field: 'symbol', header: 'tradeBot.symbol', sortable: true },
      { field: 'intervals', header: 'tradeBot.intervals', type: 'array' },
      { field: 'status', header: 'tradeBot.status', sortable: true },
      {
        field: 'actions',
        header: 'actions',
        type: 'actions',
        actions: [
          { label: 'edit', icon: 'pi pi-pencil', severity: 'info', onClick: (row) => this.goEdit(row.id) },
          { label: 'tradeBot.viewChart', icon: 'pi pi-chart-line', severity: 'secondary', onClick: (row) => this.viewChart(row.id) },
          { label: 'tradeBot.syncAll', icon: 'pi pi-refresh', severity: 'help', onClick: (row) => this.syncAll(row.id) },
          { label: 'delete', icon: 'pi pi-trash', severity: 'danger', onClick: (row) => this.remove(row.id) }
        ]
      }
    ],
    pagination: true,
    rows: DEFAULT_TABLE_ROWS,
    rowsPerPageOptions: [...DEFAULT_TABLE_ROWS_PER_PAGE]
  };

  rows: SyncConfigResponse[] = [];
  loading = false;

  constructor(
    private readonly service: SyncConfigService,
    private readonly i18nService: I18nService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadPage();
  }

  onCreate(): void {
    void this.router.navigate([TRADE_BOT_ROUTES.create]);
  }

  private goEdit(id: string): void {
    void this.router.navigate([`${TRADE_BOT_ROUTES.list}/edit`, id]);
  }

  private syncAll(id: string): void {
    this.loading = true;
    this.loadingService.track(this.service.syncAll(id)).pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => this.toastService.success(this.i18nService.t('tradeBot.syncStarted')),
      error: () => this.toastService.error(this.i18nService.t('tradeBot.syncFailed'))
    });
  }

  private viewChart(id: string): void {
    void this.router.navigate([`${TRADE_BOT_ROUTES.list}/${id}/chart`]);
  }

  private remove(id: string): void {
    this.loading = true;
    this.loadingService.track(this.service.delete(id)).pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => {
        this.toastService.success(this.i18nService.t('tradeBot.deleteSyncConfigSuccess'));
        this.loadPage();
      },
      error: () => this.toastService.error(this.i18nService.t('tradeBot.deleteSyncConfigError'))
    });
  }

  private loadPage(): void {
    this.loading = true;
    this.loadingService.track(this.service.getPage(0, this.tableConfig.rows ?? DEFAULT_TABLE_ROWS)).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (res: BasePageResponse<SyncConfigResponse>) => {
        this.rows = res.data ?? [];
      },
      error: () => this.toastService.error(this.i18nService.t('tradeBot.loadSyncConfigError'))
    });
  }
}
