import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { DEFAULT_TABLE_ROWS, DEFAULT_TABLE_ROWS_PER_PAGE } from '../../../../../core/constants/system.constants';
import { BasePageResponse } from '../../../../../core/models/base-response.model';
import { JobConfigResponse } from '../../../../../core/models/job-scheduler/job-scheduler.model';
import { JobSchedulerService } from '../../../../../core/services/job-scheduler-service/job-scheduler.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { BasePagedList } from '../../../../../shared/ui/table/component/table/base-paged-list';
import { TableConfig } from '../../../../../shared/ui/table/models/table-config.model';
import { JOB_SCHEDULER_ROUTES, JOB_STATUS_OPTIONS } from '../job-scheduler.constants';

@Component({
  selector: 'app-job-config-list',
  standalone: false,
  templateUrl: './job-config-list.component.html'
})
export class JobConfigListComponent extends BasePagedList<JobConfigResponse> implements OnInit {
  tableConfig!: TableConfig;
  readonly loading = signal(false);

  constructor(
    private readonly service: JobSchedulerService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly i18nService: I18nService
  ) {
    super(route, router, DEFAULT_TABLE_ROWS);
    this.tableConfig = this.createTableConfig();
  }

  ngOnInit(): void {
    this.loadPage();
  }

  onCreate(): void {
    void this.router.navigate([JOB_SCHEDULER_ROUTES.create]);
  }

  private goEdit(code: string): void {
    void this.router.navigate([`${JOB_SCHEDULER_ROUTES.list}/edit`, code]);
  }

  private goRuns(code: string): void {
    void this.router.navigate([`${JOB_SCHEDULER_ROUTES.list}`, code, 'runs']);
  }

  private enable(code: string): void {
    this.runAction(this.service.enable(code), 'jobScheduler.toast.enableSuccess', 'jobScheduler.toast.enableFailed');
  }

  private disable(code: string): void {
    this.runAction(this.service.disable(code), 'jobScheduler.toast.disableSuccess', 'jobScheduler.toast.disableFailed');
  }

  private runNow(code: string): void {
    this.runAction(this.service.runNow(code), 'jobScheduler.toast.runQueued', 'jobScheduler.toast.runNowFailed');
  }

  private remove(code: string): void {
    if (!window.confirm(`${this.i18nService.t('jobScheduler.confirmDelete')} ${code}?`)) {
      return;
    }

    this.runAction(this.service.delete(code), 'deleteSuccess', 'jobScheduler.toast.deleteFailed');
  }

  private runAction(request$: any, successKey: string, errorKey: string): void {
    this.loading.set(true);
    this.loadingService.track(request$).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => {
        this.toastService.info(this.i18nService.t(successKey));
        this.loadPage();
      },
      error: () => this.toastService.error(errorKey)
    });
  }

  protected loadPage(): void {
    this.loading.set(true);
    this.loadingService.track(this.service.getPage(this.page, this.pageSize, this.filters)).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (res: BasePageResponse<JobConfigResponse>) => this.setPageResponse(res),
      error: () => this.toastService.error('jobScheduler.toast.loadListFailed')
    });
  }

  private createTableConfig(): TableConfig {
    return {
      title: 'jobScheduler.list.title',
      toolbar: {
        new: {
          visible: true,
          label: 'jobScheduler.list.new',
          icon: 'pi pi-plus',
          severity: 'success'
        }
      },
      filters: [
        { field: 'keyword', label: 'keyword', placeholder: 'jobScheduler.list.searchKeyword', quick: true },
        {
          field: 'enabled',
          label: 'enabled',
          type: 'select',
          options: [
            { label: 'yes', value: true },
            { label: 'no', value: false }
          ]
        },
        {
          field: 'lastStatus',
          label: 'status',
          type: 'select',
          options: JOB_STATUS_OPTIONS.filter((item) => item.value !== 'RUNNING')
        },
        {
          field: 'authType',
          label: 'jobScheduler.field.authType',
          type: 'select',
          options: [
            { label: 'NONE', value: 'NONE' },
            { label: 'BASIC', value: 'BASIC' },
            { label: 'API_KEY', value: 'API_KEY' },
            { label: 'KEYCLOAK_CLIENT_CREDENTIALS', value: 'KEYCLOAK_CLIENT_CREDENTIALS' }
          ]
        }
      ],
      filterOptions: { primaryField: 'keyword' },
      columns: [
        { field: 'code', header: 'code', sortable: true, minWidth: '12rem' },
        { field: 'name', header: 'name', sortable: true, minWidth: '14rem' },
        { field: 'cron', header: 'jobScheduler.field.cron', minWidth: '9rem' },
        { field: 'timezone', header: 'jobScheduler.field.timezone', minWidth: '11rem' },
        { field: 'auth.type', header: 'jobScheduler.field.authType', minWidth: '12rem' },
        { field: 'enabled', header: 'enabled', type: 'boolean', minWidth: '7rem' },
        { field: 'lastStatus', header: 'status', minWidth: '8rem' },
        { field: 'lastRunAt', header: 'jobScheduler.field.lastRunAt', type: 'date', format: 'dd/MM/yyyy HH:mm:ss', minWidth: '11rem' },
        {
          field: 'actions',
          header: 'actions',
          type: 'actions',
          minWidth: '22rem',
          frozen: true,
          alignFrozen: 'right',
          actions: [
            { label: 'edit', icon: 'pi pi-pencil', severity: 'info', onClick: (row) => this.goEdit(row.code) },
            { label: 'jobScheduler.action.runs', icon: 'pi pi-history', severity: 'secondary', onClick: (row) => this.goRuns(row.code) },
            { label: 'jobScheduler.action.runNow', icon: 'pi pi-play', severity: 'success', onClick: (row) => this.runNow(row.code) },
            { label: 'enable', icon: 'pi pi-check', severity: 'success', disabled: (row) => row.enabled === true, onClick: (row) => this.enable(row.code) },
            { label: 'disable', icon: 'pi pi-pause', severity: 'warn', disabled: (row) => row.enabled !== true, onClick: (row) => this.disable(row.code) },
            { label: 'delete', icon: 'pi pi-trash', severity: 'danger', onClick: (row) => this.remove(row.code) }
          ]
        }
      ],
      pagination: true,
      rows: DEFAULT_TABLE_ROWS,
      rowsPerPageOptions: [...DEFAULT_TABLE_ROWS_PER_PAGE],
      minWidth: '110rem'
    };
  }
}

