import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DEFAULT_TABLE_ROWS, DEFAULT_TABLE_ROWS_PER_PAGE } from '../../../../../../core/constants/system.constants';
import { ExecutorVersionResponse, IndicatorConfigResponse } from '../../../../../../core/models/trade-bot/trading-system.model';
import { TradingSystemService } from '../../../../../../core/services/trade-bot-service/trading-system.service';
import { I18nService } from '../../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../../core/ui-services/toast.service';
import { BasePagedList } from '../../../../../../shared/ui/table/component/table/base-paged-list';
import { TableConfig, TableFilterField } from '../../../../../../shared/ui/table/models/table-config.model';
import { toUniqueTextOptions } from '../../../trade-bot-form-utils';
import { TRADE_BOT_ROUTES } from '../../../trade-bot-runtime.constants';

@Component({
  selector: 'app-indicator-config-list',
  standalone: false,
  templateUrl: './indicator-config-list.component.html'
})
export class IndicatorConfigListComponent extends BasePagedList<IndicatorConfigResponse> implements OnInit {
  tableConfig: TableConfig = {
    title: 'tradeBot.indicator.title',
    stateKey: 'trade-bot.indicator-configs',
    emptyTitle: 'shared.table.emptyTitle',
    emptyDescription: 'shared.table.emptyDescription',
    errorTitle: 'tradeBot.message.loadFailed',
    toolbar: {
      new: { visible: true, label: 'tradeBot.action.newIndicator', icon: 'pi pi-plus', severity: 'success' },
      columnVisibility: { visible: true },
      density: { visible: true }
    },
    filters: [
      { field: 'code', label: 'tradeBot.field.code', placeholder: 'tradeBot.field.code' },
      { field: 'executor', label: 'tradeBot.field.executor', type: 'autocomplete', placeholder: 'tradeBot.field.executor', options: [] }
    ],
    filterOptions: { primaryField: 'code' },
    columns: [
      { field: 'code', header: 'tradeBot.field.code', type: 'copyable', sortable: true },
      { field: 'executor', header: 'tradeBot.field.executor' },
      { field: 'executorVersion', header: 'tradeBot.field.executorVersion' },
      { field: 'displayType', header: 'tradeBot.field.displayType' },
      {
        field: 'status',
        header: 'tradeBot.field.status',
        type: 'badge',
        badgeMap: { ACTIVE: 'success', INACTIVE: 'muted', DELETE: 'danger' }
      },
      {
        field: 'actions',
        header: 'tradeBot.field.actions',
        type: 'actions',
        minWidth: '12rem',
        frozen: true,
        alignFrozen: 'right',
        actions: [
          { label: 'tradeBot.action.edit', icon: 'pi pi-pencil', severity: 'info', onClick: (row) => this.goEdit(row.id) },
          { label: 'tradeBot.action.versions', icon: 'pi pi-history', severity: 'secondary', onClick: (row) => this.goVersions(row.id) },
          {
            label: 'tradeBot.action.delete',
            icon: 'pi pi-trash',
            severity: 'danger',
            variant: 'danger',
            confirm: { message: 'tradeBot.message.confirmDeleteConfig', variant: 'danger' },
            onClick: (row) => this.remove(row.id)
          }
        ]
      }
    ],
    pagination: true,
    rows: DEFAULT_TABLE_ROWS,
    rowsPerPageOptions: [...DEFAULT_TABLE_ROWS_PER_PAGE]
  };

  constructor(
    private readonly service: TradingSystemService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly i18nService: I18nService
  ) {
    super(route, router, DEFAULT_TABLE_ROWS, ['code,asc']);
  }

  ngOnInit(): void {
    this.loadExecutorFilterOptions();
    this.loadPage();
  }

  onCreate(): void {
    void this.router.navigate([`${TRADE_BOT_ROUTES.indicators}/create`]);
  }

  retryLoad(): void {
    this.loadPage();
  }

  protected loadPage(): void {
    this.runPageRequest(this.loadingService.track(this.service.getIndicatorConfigPage(this.page, this.pageSize, this.filters, this.sorts)), {
      errorMessage: 'tradeBot.message.loadFailed',
      onError: () => this.toastService.error(this.i18nService.t('tradeBot.message.loadFailed'))
    });
  }

  private goEdit(id: string): void {
    void this.router.navigate([`${TRADE_BOT_ROUTES.indicators}/edit`, id]);
  }

  private goVersions(id: string): void {
    void this.router.navigate([TRADE_BOT_ROUTES.configHistory, 'indicator', id]);
  }

  private remove(id: string): void {
    this.loadingService
      .track(this.service.deleteIndicatorConfig(id))
      .subscribe({
        next: () => {
          this.toastService.info(this.i18nService.t('deleteSuccess'));
          this.loadPage();
        },
        error: () => this.toastService.error(this.i18nService.t('deleteError'))
      });
  }

  private loadExecutorFilterOptions(): void {
    this.service.getIndicatorExecutors().subscribe({
      next: (executors) => this.applyExecutorFilterOptions(executors),
      error: () => this.applyExecutorFilterOptions([])
    });
  }

  private applyExecutorFilterOptions(executors: ExecutorVersionResponse[]): void {
    this.tableConfig = {
      ...this.tableConfig,
      filters: this.buildFilters(executors)
    };
  }

  private buildFilters(executors: ExecutorVersionResponse[]): TableFilterField[] {
    const executorOptions = toUniqueTextOptions(executors, (executor) => executor.executor).map((option) => ({
      label: option.label,
      value: String(option.value ?? '')
    }));
    return [
      { field: 'code', label: 'tradeBot.field.code', placeholder: 'tradeBot.field.code' },
      {
        field: 'executor',
        label: 'tradeBot.field.executor',
        type: 'autocomplete',
        placeholder: 'tradeBot.field.executor',
        options: executorOptions
      }
    ];
  }
}
