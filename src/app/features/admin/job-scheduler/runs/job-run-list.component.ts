import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { DEFAULT_TABLE_ROWS, DEFAULT_TABLE_ROWS_PER_PAGE } from '../../../../core/constants/system.constants';
import { BasePageResponse } from '../../../../core/models/base-response.model';
import { JobRunResponse } from '../data-access/models/job-scheduler.model';
import { JobSchedulerService } from '../data-access/api/job-scheduler.service';
import { LoadingService } from '../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../core/ui-services/toast.service';
import { BasePagedList } from '../../../../shared/ui/table/component/table/base-paged-list';
import { TableConfig } from '../../../../shared/ui/table/models/table-config.model';
import { JOB_SCHEDULER_ROUTES, JOB_STATUS_OPTIONS, JOB_TRIGGER_TYPE_OPTIONS } from '../job-scheduler.constants';

@Component({
  selector: 'app-job-run-list',
  standalone: false,
  templateUrl: './job-run-list.component.html'
})
export class JobRunListComponent extends BasePagedList<JobRunResponse> implements OnInit {
  tableConfig!: TableConfig;
  readonly loading = signal(false);
  code = '';

  constructor(
    private readonly service: JobSchedulerService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {
    super(route, router, DEFAULT_TABLE_ROWS);
    this.tableConfig = this.createTableConfig();
  }

  ngOnInit(): void {
    this.code = this.route.snapshot.paramMap.get('code') ?? '';
    this.loadPage();
  }

  onBack(): void {
    void this.router.navigate([JOB_SCHEDULER_ROUTES.list]);
  }

  protected loadPage(): void {
    if (!this.code) {
      return;
    }

    this.loading.set(true);
    this.loadingService.track(this.service.getRuns(this.code, this.page, this.pageSize, this.filters)).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (res: BasePageResponse<JobRunResponse>) => this.setPageResponse(res),
      error: () => this.toastService.error('jobScheduler.toast.loadRunsFailed')
    });
  }

  private createTableConfig(): TableConfig {
    return {
      title: 'jobScheduler.runs.title',
      filters: [
        {
          field: 'status',
          label: 'status',
          type: 'select',
          options: JOB_STATUS_OPTIONS
        },
        {
          field: 'triggerType',
          label: 'jobScheduler.field.triggerType',
          type: 'select',
          options: JOB_TRIGGER_TYPE_OPTIONS
        }
      ],
      filterOptions: { primaryField: 'status' },
      columns: [
        { field: 'startedAt', header: 'jobScheduler.field.startedAt', type: 'date', format: 'dd/MM/yyyy HH:mm:ss', minWidth: '12rem' },
        { field: 'finishedAt', header: 'jobScheduler.field.finishedAt', type: 'date', format: 'dd/MM/yyyy HH:mm:ss', minWidth: '12rem' },
        { field: 'durationMs', header: 'jobScheduler.field.durationMs', type: 'number', suffix: 'ms', minWidth: '8rem' },
        { field: 'triggerType', header: 'jobScheduler.field.triggerType', minWidth: '9rem' },
        { field: 'status', header: 'status', minWidth: '8rem' },
        { field: 'request.method', header: 'jobScheduler.field.method', minWidth: '7rem' },
        { field: 'request.url', header: 'jobScheduler.field.url', minWidth: '20rem' },
        { field: 'request.headers', header: 'jobScheduler.field.headers', type: 'textarea', minWidth: '18rem' },
        { field: 'request.body', header: 'jobScheduler.field.body', type: 'textarea', minWidth: '18rem' },
        { field: 'response.status', header: 'jobScheduler.field.responseStatus', type: 'number', minWidth: '8rem' },
        { field: 'response.body', header: 'jobScheduler.field.responseBody', type: 'textarea', minWidth: '18rem' },
        { field: 'error.message', header: 'jobScheduler.field.errorMessage', minWidth: '18rem' },
        { field: 'error.body', header: 'jobScheduler.field.errorBody', type: 'textarea', minWidth: '18rem' }
      ],
      pagination: true,
      rows: DEFAULT_TABLE_ROWS,
      rowsPerPageOptions: [...DEFAULT_TABLE_ROWS_PER_PAGE],
      minWidth: '170rem'
    };
  }
}

