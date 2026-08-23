import { Component, computed, inject, signal } from '@angular/core';
import { I18nService } from '@core/i18n/i18n.service';
import { ActivatedRoute, Router } from '@angular/router';
import type { ActionToolbarAction } from '@shared/ui/layout/action-toolbar/action-toolbar.component';
import type { TableAction, TableDensity, TableExportRequest } from '@shared/ui/patterns/table';
import {
  buildJobManagementScreen,
  filterJobs,
  jobDetailItems,
} from '../../model/service-management.config';
import type { JobRecord } from '../../model/service-management.model';
import {
  exportTableRequestAsCsv,
  readTableViewState,
  type ServiceManagementTableViewState,
  writeTableViewState,
} from '../../utils/table-view-state';

@Component({
  selector: 'app-job-management',
  standalone: false,
  templateUrl: './job-management.component.html',
  styleUrl: './job-management.component.css',
})
export class JobManagementComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly i18nService = inject(I18nService);
  private readonly tableStateKey = 'service-management.job-service.jobs.table';
  private readonly tableExportFileName = 'service-management-jobs.csv';

  readonly screen = buildJobManagementScreen();
  readonly filterValues = signal<Record<string, unknown>>({});
  readonly selectedJob = signal<JobRecord | null>(null);
  readonly drawerOpen = signal(false);
  readonly tableViewState = signal<ServiceManagementTableViewState>(
    readTableViewState(this.tableStateKey, this.screen.table),
  );
  readonly jobs = computed(() => filterJobs(this.screen.jobs, this.filterValues()));
  readonly selectedJobDetails = computed(() => {
    const job = this.selectedJob();
    return job ? jobDetailItems(job) : [];
  });

  onToolbarAction(action: ActionToolbarAction): void {
    if (action.id === 'create') {
      void this.router.navigate(['create'], { relativeTo: this.route });
    }
  }

  onFilterChange(values: Record<string, unknown>): void {
    this.filterValues.set(values);
  }

  onFilterReset(): void {
    this.filterValues.set({});
  }

  openDetail(job: JobRecord): void {
    this.selectedJob.set(job);
    this.drawerOpen.set(true);
  }

  onTableAction(event: { action: TableAction<JobRecord>; row: JobRecord }): void {
    switch (event.action.id) {
      case 'view':
        this.openDetail(event.row);
        break;
      case 'edit':
        void this.router.navigate([event.row.id, 'edit'], { relativeTo: this.route });
        break;
      default:
        break;
    }
  }

  onTableColumnVisibilityChange(columnVisibility: string[]): void {
    this.updateTableViewState({ columnVisibility });
  }

  onTableDensityChange(density: TableDensity): void {
    this.updateTableViewState({ density });
  }

  onTableExport(request: TableExportRequest<JobRecord>): void {
    exportTableRequestAsCsv(request, this.screen.table, this.tableExportFileName, {
      formatHeader: (header) => this.i18nService.t(header),
    });
  }

  editSelectedJob(): void {
    const job = this.selectedJob();
    if (!job) {
      return;
    }

    void this.router.navigate([job.id, 'edit'], { relativeTo: this.route });
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  private updateTableViewState(patch: Partial<ServiceManagementTableViewState>): void {
    const nextState = { ...this.tableViewState(), ...patch };
    this.tableViewState.set(nextState);
    writeTableViewState(this.tableStateKey, nextState);
  }
}
