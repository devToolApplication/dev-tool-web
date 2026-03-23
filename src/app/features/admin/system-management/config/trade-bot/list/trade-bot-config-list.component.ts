import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { DEFAULT_TABLE_ROWS, DEFAULT_TABLE_ROWS_PER_PAGE } from '../../../../../../core/constants/system.constants';
import { BasePageResponse } from '../../../../../../core/models/base-response.model';
import { TradeBotConfigResponse } from '../../../../../../core/models/trade-bot/config.model';
import { TradeBotConfigService } from '../../../../../../core/services/trade-bot-service/config.service';
import { I18nService } from '../../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../../core/ui-services/toast.service';
import { TableConfig } from '../../../../../../shared/ui/table/models/table-config.model';
import { TRADE_BOT_CONFIG_ROUTES } from '../trade-bot-config.constants';

@Component({
  selector: 'app-trade-bot-config-list',
  standalone: false,
  templateUrl: './trade-bot-config-list.component.html'
})
export class TradeBotConfigListComponent implements OnInit {
  readonly tableConfig: TableConfig = {
    title: 'Trade Bot Configs',
    toolbar: {
      new: { visible: true, label: 'New Config', icon: 'pi pi-plus', severity: 'success' }
    },
    filters: [
      { field: 'key', label: 'Key', placeholder: 'Search key' },
      { field: 'category', label: 'Category', placeholder: 'Search category' }
    ],
    filterOptions: { primaryField: 'key' },
    columns: [
      { field: 'category', header: 'Category', sortable: true },
      { field: 'key', header: 'Key', sortable: true },
      { field: 'status', header: 'Status' },
      { field: 'description', header: 'Description' },
      { field: 'value', header: 'Value', type: 'textarea' },
      {
        field: 'actions',
        header: 'Actions',
        type: 'actions',
        actions: [
          { label: 'Edit', icon: 'pi pi-pencil', severity: 'info', onClick: (row) => this.goEdit(row.id) },
          { label: 'Delete', icon: 'pi pi-trash', severity: 'danger', onClick: (row) => this.remove(row.id) }
        ]
      }
    ],
    pagination: true,
    rows: DEFAULT_TABLE_ROWS,
    rowsPerPageOptions: [...DEFAULT_TABLE_ROWS_PER_PAGE]
  };

  rows: TradeBotConfigResponse[] = [];
  loading = false;
  filters: Record<string, any> = {};

  constructor(
    private readonly service: TradeBotConfigService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly router: Router,
    private readonly i18nService: I18nService
  ) {}

  ngOnInit(): void {

  }

  onCreate(): void {
    void this.router.navigate([TRADE_BOT_CONFIG_ROUTES.create]);
  }

  onSearch(filters: Record<string, any>): void {
    this.filters = filters;
    this.loadPage();
  }

  onResetFilter(): void {
    this.filters = {};
    this.loadPage();
  }

  private goEdit(id: string): void {
    void this.router.navigate([`${TRADE_BOT_CONFIG_ROUTES.list}/edit`, id]);
  }

  private remove(id: string): void {
    this.loading = true;
    this.loadingService.track(this.service.delete(id)).pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => {
        this.toastService.info(this.i18nService.t('deleteSuccess'));
        this.loadPage();
      },
      error: () => this.toastService.error(this.i18nService.t('deleteError'))
    });
  }

  private loadPage(): void {
    this.loading = true;
    this.loadingService
      .track(this.service.getPage(0, this.tableConfig.rows ?? DEFAULT_TABLE_ROWS, ['category,asc', 'key,asc'], this.filters))
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res: BasePageResponse<TradeBotConfigResponse>) => {
          this.rows = res.data ?? [];
        },
        error: () => this.toastService.error('Load trade bot configs failed')
      });
  }
}
