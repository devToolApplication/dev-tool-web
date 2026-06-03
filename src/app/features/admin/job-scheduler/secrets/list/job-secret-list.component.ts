import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DEFAULT_TABLE_ROWS, DEFAULT_TABLE_ROWS_PER_PAGE } from '../../../../../core/constants/system.constants';
import { SecretResponse, SecretType } from '../data-access/models/job-secret.model';
import { JobSecretService } from '../data-access/api/job-secret.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { BasePagedList } from '../../../../../shared/ui/table/component/table/base-paged-list';
import { TableConfig } from '../../../../../shared/ui/table/models/table-config.model';
import { JOB_SECRET_ROUTES } from '../job-secret.constants';

@Component({
  selector: 'app-job-secret-list',
  standalone: false,
  templateUrl: './job-secret-list.component.html'
})
export class JobSecretListComponent extends BasePagedList<SecretResponse> implements OnInit {
  readonly tableConfig: TableConfig = this.buildTableConfig();

  constructor(
    private readonly service: JobSecretService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly i18nService: I18nService
  ) {
    super(route, router, DEFAULT_TABLE_ROWS, ['code,asc']);
  }

  ngOnInit(): void {
    this.loadPage();
  }

  onCreate(): void {
    void this.router.navigate([JOB_SECRET_ROUTES.create]);
  }

  private goEdit(code: string): void {
    void this.router.navigate([`${JOB_SECRET_ROUTES.list}/edit`, code]);
  }

  private remove(code: string): void {
    this.loadingService.track(this.service.delete(code)).subscribe({
      next: () => {
        this.toastService.info(this.i18nService.t('deleteSuccess'));
        this.loadPage();
      },
      error: () => this.toastService.error(this.i18nService.t('deleteError'))
    });
  }

  protected loadPage(): void {
    this.runPageRequest(this.loadingService.track(this.service.getPage(this.page, this.pageSize, this.filters, this.sorts)), {
      errorMessage: 'jobSecret.toast.loadListFailed',
      onError: () => this.toastService.error('jobSecret.toast.loadListFailed')
    });
  }

  private buildTableConfig(): TableConfig {
    return {
      title: 'jobSecret.list.title',
      stateKey: 'job-scheduler.secrets',
      emptyTitle: 'shared.table.emptyTitle',
      emptyDescription: 'shared.table.emptyDescription',
      errorTitle: 'loadError',
      toolbar: {
        new: { visible: true, label: 'jobSecret.action.newSecret', icon: 'pi pi-plus', severity: 'success', permissions: ['JOB_SCHEDULER_WRITE'] },
        columnVisibility: { visible: true },
        density: { visible: true }
      },
      filters: [
        { field: 'keyword', label: 'search', placeholder: 'jobSecret.filter.search' }
      ],
      filterOptions: { primaryField: 'keyword' },
      columns: [
        { field: 'code', header: 'code', type: 'copyable', sortable: true },
        { field: 'name', header: 'name', sortable: true },
        { field: 'type', header: 'type', sortable: true },
        { field: 'description', header: 'description' },
        { field: 'updatedAt', header: 'updatedAt', type: 'date', sortable: true },
        {
          field: 'actions',
          header: 'actions',
          type: 'actions',
          minWidth: '12rem',
          frozen: true,
          alignFrozen: 'right',
          hideable: false,
          actions: [
            { label: 'edit', icon: 'pi pi-pencil', severity: 'info', permissions: ['JOB_SCHEDULER_WRITE'], onClick: (row: SecretResponse) => this.goEdit(row.code) },
            {
              label: 'delete',
              icon: 'pi pi-trash',
              severity: 'danger',
              variant: 'danger',
              permissions: ['JOB_SCHEDULER_WRITE'],
              confirm: { message: 'shared.confirm.dangerAction', variant: 'danger' },
              onClick: (row: SecretResponse) => this.remove(row.code)
            }
          ]
        }
      ],
      pagination: true,
      rows: DEFAULT_TABLE_ROWS,
      rowsPerPageOptions: [...DEFAULT_TABLE_ROWS_PER_PAGE]
    };
  }
}
