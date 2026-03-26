import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { DEFAULT_TABLE_ROWS, DEFAULT_TABLE_ROWS_PER_PAGE } from '../../../../../../core/constants/system.constants';
import { BasePageResponse } from '../../../../../../core/models/base-response.model';
import { TradeBotSecretResponse } from '../../../../../../core/models/trade-bot/trade-bot-secret.model';
import { TradeBotSecretService } from '../../../../../../core/services/trade-bot-service/trade-bot-secret.service';
import { I18nService } from '../../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../../core/ui-services/toast.service';
import { TableConfig } from '../../../../../../shared/ui/table/models/table-config.model';
import { TRADE_BOT_SECRET_ROUTES } from '../trade-bot-secret.constants';

@Component({
  selector: 'app-trade-bot-secret-list',
  standalone: false,
  templateUrl: './trade-bot-secret-list.component.html'
})
export class TradeBotSecretListComponent implements OnInit {
  readonly tableConfig: TableConfig = {
    title: 'Trade Bot Secrets',
    toolbar: { new: { visible: true, label: 'New Secret', icon: 'pi pi-plus', severity: 'success' } },
    filters: [
      { field: 'code', label: 'Code', placeholder: 'Search code' },
      { field: 'category', label: 'Category', placeholder: 'Search category' }
    ],
    filterOptions: { primaryField: 'code' },
    columns: [
      { field: 'category', header: 'Category', sortable: true },
      { field: 'name', header: 'Name', sortable: true },
      { field: 'code', header: 'Code', sortable: true },
      { field: 'status', header: 'Status' },
      { field: 'description', header: 'Description' },
      {
        field: 'actions',
        header: 'Actions',
        type: 'actions',
        actions: [
          { label: 'Edit', icon: 'pi pi-pencil', severity: 'info', onClick: (row: TradeBotSecretResponse) => this.goEdit(row.id) },
          { label: 'Delete', icon: 'pi pi-trash', severity: 'danger', onClick: (row: TradeBotSecretResponse) => this.remove(row.id) }
        ]
      }
    ],
    pagination: true,
    rows: DEFAULT_TABLE_ROWS,
    rowsPerPageOptions: [...DEFAULT_TABLE_ROWS_PER_PAGE]
  };

  rows: TradeBotSecretResponse[] = [];
  loading = false;
  filters: Record<string, any> = {};

  constructor(
    private readonly service: TradeBotSecretService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly router: Router,
    private readonly i18nService: I18nService
  ) {}

  ngOnInit(): void {
    this.loadPage();
  }

  onCreate(): void {
    void this.router.navigate([TRADE_BOT_SECRET_ROUTES.create]);
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
    void this.router.navigate([`${TRADE_BOT_SECRET_ROUTES.list}/edit`, id]);
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
      .track(this.service.getPage(0, this.tableConfig.rows ?? DEFAULT_TABLE_ROWS, ['category,asc', 'code,asc'], this.filters))
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res: BasePageResponse<TradeBotSecretResponse>) => (this.rows = res.data ?? []),
        error: () => this.toastService.error('Load Trade Bot secrets failed')
      });
  }
}
