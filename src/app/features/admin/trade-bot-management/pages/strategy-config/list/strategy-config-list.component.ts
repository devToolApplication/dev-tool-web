import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { DEFAULT_TABLE_ROWS, DEFAULT_TABLE_ROWS_PER_PAGE } from '../../../../../../core/constants/system.constants';
import { BasePageResponse } from '../../../../../../core/models/base-response.model';
import { StrategyConfigResponse } from '../../../../../../core/models/trade-bot/trading-system.model';
import { TradingSystemService } from '../../../../../../core/services/trade-bot-service/trading-system.service';
import { I18nService } from '../../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../../core/ui-services/toast.service';
import { BasePagedList } from '../../../../../../shared/ui/table/component/table/base-paged-list';
import { TableConfig } from '../../../../../../shared/ui/table/models/table-config.model';
import { TRADE_BOT_ROUTES } from '../../../trade-bot-runtime.constants';

@Component({
  selector: 'app-strategy-config-list',
  standalone: false,
  templateUrl: './strategy-config-list.component.html'
})
export class StrategyConfigListComponent extends BasePagedList<StrategyConfigResponse> implements OnInit {
  readonly loading = signal(false);
  readonly tableConfig: TableConfig = {
    title: 'tradeBot.strategy.title',
    toolbar: { new: { visible: true, label: 'tradeBot.action.newStrategy', icon: 'pi pi-plus', severity: 'success' } },
    filters: [{ field: 'code', label: 'tradeBot.field.code', placeholder: 'tradeBot.field.code' }],
    filterOptions: { primaryField: 'code' },
    columns: [
      { field: 'code', header: 'tradeBot.field.code', sortable: true },
      { field: 'type', header: 'tradeBot.field.type' },
      { field: 'strategyVersion', header: 'tradeBot.field.strategyVersion' },
      { field: 'entryRule', header: 'tradeBot.field.entryRule' },
      { field: 'slRule', header: 'tradeBot.field.slRule' },
      { field: 'tpRule', header: 'tradeBot.field.tpRule' },
      { field: 'status', header: 'tradeBot.field.status' },
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
          { label: 'tradeBot.action.delete', icon: 'pi pi-trash', severity: 'danger', onClick: (row) => this.remove(row.id) }
        ]
      }
    ],
    pagination: true,
    rows: DEFAULT_TABLE_ROWS,
    rowsPerPageOptions: [...DEFAULT_TABLE_ROWS_PER_PAGE],
    minWidth: '80rem'
  };

  constructor(
    private readonly service: TradingSystemService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly i18nService: I18nService
  ) {
    super(route, router, DEFAULT_TABLE_ROWS);
  }

  ngOnInit(): void {
    this.loadPage();
  }

  onCreate(): void {
    void this.router.navigate([`${TRADE_BOT_ROUTES.strategies}/create`]);
  }

  protected loadPage(): void {
    this.loading.set(true);
    this.loadingService
      .track(this.service.getStrategyConfigPage(this.page, this.pageSize, this.filters))
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res: BasePageResponse<StrategyConfigResponse>) => this.setPageResponse(res),
        error: () => this.toastService.error(this.i18nService.t('tradeBot.message.loadFailed'))
      });
  }

  private goEdit(id: string): void {
    void this.router.navigate([`${TRADE_BOT_ROUTES.strategies}/edit`, id]);
  }

  private goVersions(id: string): void {
    void this.router.navigate([TRADE_BOT_ROUTES.configHistory, 'strategy', id]);
  }

  private remove(id: string): void {
    this.loading.set(true);
    this.loadingService
      .track(this.service.deleteStrategyConfig(id))
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.toastService.info(this.i18nService.t('deleteSuccess'));
          this.loadPage();
        },
        error: () => this.toastService.error(this.i18nService.t('deleteError'))
      });
  }
}
