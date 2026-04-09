import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { DEFAULT_TABLE_ROWS, DEFAULT_TABLE_ROWS_PER_PAGE } from '../../../../../core/constants/system.constants';
import { BasePageResponse } from '../../../../../core/models/base-response.model';
import { TradeStrategyBindingResponse } from '../../../../../core/models/trade-bot/trade-strategy-binding.model';
import { TradeStrategyBindingService } from '../../../../../core/services/trade-bot-service/trade-strategy-binding.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { BasePagedList } from '../../../../../shared/ui/table/component/table/base-paged-list';
import { TableConfig } from '../../../../../shared/ui/table/models/table-config.model';
import { STRATEGY_MANAGEMENT_ROUTES } from '../strategy-management.constants';
import { TradeBotTextKey } from '../shared/strategy-ui.enums';

@Component({
  selector: 'app-trade-strategy-binding-list',
  standalone: false,
  templateUrl: './trade-strategy-binding-list.component.html'
})
export class TradeStrategyBindingListComponent extends BasePagedList<TradeStrategyBindingResponse> implements OnInit {
  readonly tableConfig: TableConfig = {
    title: TradeBotTextKey.StrategyListTitle,
    toolbar: { new: { visible: true, label: TradeBotTextKey.NewStrategy, icon: 'pi pi-plus', severity: 'success' } },
    filters: [
      { field: 'exchangeCode', label: TradeBotTextKey.Exchange, placeholder: 'tradeBot.filter.exchange' },
      { field: 'symbolCode', label: TradeBotTextKey.Symbol, placeholder: 'tradeBot.filter.symbol' },
      { field: 'strategyServiceName', label: TradeBotTextKey.StrategyCode, placeholder: 'tradeBot.filter.strategy' },
      { field: 'ruleCode', label: 'Rule', placeholder: 'Rule code' },
      { field: 'marketType', label: TradeBotTextKey.MarketType, placeholder: 'tradeBot.filter.marketType' },
      { field: 'status', label: TradeBotTextKey.Status, placeholder: 'tradeBot.filter.status' }
    ],
    filterOptions: { primaryField: 'symbolCode' },
    columns: [
      { field: 'exchangeCode', header: TradeBotTextKey.Exchange, sortable: true },
      { field: 'symbolCode', header: TradeBotTextKey.Symbol, sortable: true },
      { field: 'providerSymbol', header: TradeBotTextKey.ProviderSymbol, sortable: true },
      { field: 'strategyServiceName', header: TradeBotTextKey.StrategyCode, sortable: true },
      { field: 'ruleCode', header: 'Rule', sortable: true },
      { field: 'marketType', header: TradeBotTextKey.MarketType, sortable: true },
      { field: 'tradeSideMode', header: TradeBotTextKey.TradeSideMode, sortable: true },
      { field: 'status', header: TradeBotTextKey.Status, sortable: true },
      {
        field: 'actions',
        header: 'actions',
        type: 'actions',
        actions: [
          { label: TradeBotTextKey.Backtest, icon: 'pi pi-play-circle', severity: 'success', onClick: (row: TradeStrategyBindingResponse) => this.goBacktest(row.id) },
          { label: 'edit', icon: 'pi pi-pencil', severity: 'info', onClick: (row: TradeStrategyBindingResponse) => this.goEdit(row.id) },
          { label: 'delete', icon: 'pi pi-trash', severity: 'danger', onClick: (row: TradeStrategyBindingResponse) => this.remove(row.id) }
        ]
      }
    ],
    pagination: true,
    rows: DEFAULT_TABLE_ROWS,
    rowsPerPageOptions: [...DEFAULT_TABLE_ROWS_PER_PAGE]
  };

  loading = false;

  constructor(
    private readonly service: TradeStrategyBindingService,
    private readonly i18nService: I18nService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {
    super(route, router, DEFAULT_TABLE_ROWS);
  }

  ngOnInit(): void {
    this.loadPage();
  }

  onCreate(): void {
    void this.router.navigate([STRATEGY_MANAGEMENT_ROUTES.createEntry]);
  }

  private goEdit(id: string): void {
    void this.router.navigate([STRATEGY_MANAGEMENT_ROUTES.edit(id)]);
  }

  private goBacktest(id: string): void {
    void this.router.navigate([STRATEGY_MANAGEMENT_ROUTES.backtest(id)]);
  }

  private remove(id: string): void {
    this.loading = true;
    this.loadingService.track(this.service.delete(id)).pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => {
        this.toastService.success(this.i18nService.t(TradeBotTextKey.DeleteStrategySuccess));
        this.loadPage();
      },
      error: () => this.toastService.error(this.i18nService.t(TradeBotTextKey.DeleteStrategyFailed))
    });
  }

  protected loadPage(): void {
    this.loading = true;
    this.loadingService
      .track(this.service.getPage(this.page, this.pageSize, ['exchangeCode,asc', 'symbolCode,asc'], this.filters))
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res: BasePageResponse<TradeStrategyBindingResponse>) => this.setPageResponse(res),
        error: () => this.toastService.error(this.i18nService.t(TradeBotTextKey.LoadStrategyListFailed))
      });
  }
}
