import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type { TableConfig } from '@shared/ui/data-display/table/table';
import { SdkAdminApiService } from '../../../../api/sdk-admin-api.service';
import type {
  SdkAgentCatalogItem,
  SdkTaskRunDetail,
  SdkTaskRunListQuery,
  SdkTaskRunStatus,
  SdkTaskRunSummary,
} from '../../../../model/sdk-management.model';

@Component({
  selector: 'app-sdk-history-tab',
  standalone: false,
  templateUrl: './sdk-history-tab.component.html',
  styleUrl: './sdk-history-tab.component.css',
})
export class SdkHistoryTabComponent implements OnInit {
  @Input() agents: SdkAgentCatalogItem[] = [];
  @Output() rerunTask = new EventEmitter<SdkTaskRunSummary>();

  readonly runs = signal<SdkTaskRunSummary[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly page = signal<number>(1);
  readonly size = signal<number>(20);
  readonly total = signal<number>(0);

  readonly filterStatus = signal<string>('');
  readonly filterAgent = signal<string>('');

  readonly selectedDetail = signal<SdkTaskRunDetail | null>(null);
  readonly isDetailDrawerOpen = signal<boolean>(false);
  readonly isLoadingDetail = signal<boolean>(false);

  readonly tableConfig: TableConfig<SdkTaskRunSummary> = {
    columns: [
      {
        field: 'taskId',
        header: 'systemManagement.sdkManagement.history.col.taskId',
      },
      {
        field: 'agentCode',
        header: 'systemManagement.sdkManagement.history.col.agentCode',
      },
      {
        field: 'provider',
        header: 'systemManagement.sdkManagement.history.col.provider',
      },
      {
        field: 'status',
        header: 'systemManagement.sdkManagement.history.col.status',
      },
      {
        field: 'promptPreview',
        header: 'systemManagement.sdkManagement.history.col.prompt',
      },
      {
        field: 'createdAt',
        header: 'systemManagement.sdkManagement.history.col.createdAt',
      },
      {
        field: 'actions',
        header: 'systemManagement.sdkManagement.history.col.actions',
        type: 'actions',
        actions: [
          {
            label: 'systemManagement.sdkManagement.history.action.detail',
            variant: 'outline',
            onClick: (row) => this.onOpenDetail(row.taskId),
          },
          {
            label: 'systemManagement.sdkManagement.history.action.rerun',
            variant: 'primary',
            onClick: (row) => this.rerunTask.emit(row),
          },
        ],
      },
    ],
    emptyTitle: 'systemManagement.sdkManagement.history.emptyTitle',
    emptyDescription: 'systemManagement.sdkManagement.history.emptyDescription',
  };

  constructor(private readonly api: SdkAdminApiService) {}

  ngOnInit(): void {
    this.loadRuns();
  }

  async loadRuns(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const query: SdkTaskRunListQuery = {
      page: this.page(),
      size: this.size(),
      status: (this.filterStatus() as SdkTaskRunStatus) || undefined,
      agentCode: this.filterAgent() || undefined,
    };

    try {
      const res = await firstValueFrom(this.api.listTaskRuns(query));
      this.runs.set(res.items);
      this.total.set(res.total);
    } catch {
      this.errorMessage.set('Could not load task run history.');
    } finally {
      this.isLoading.set(false);
    }
  }

  onFilterChange(status: string, agent: string): void {
    this.filterStatus.set(status);
    this.filterAgent.set(agent);
    this.page.set(1);
    this.loadRuns();
  }

  async onOpenDetail(taskId: string): Promise<void> {
    this.isDetailDrawerOpen.set(true);
    this.isLoadingDetail.set(true);
    this.selectedDetail.set(null);

    try {
      const detail = await firstValueFrom(this.api.getTaskRunDetail(taskId));
      this.selectedDetail.set(detail);
    } catch {
      this.errorMessage.set('Could not load task detail.');
    } finally {
      this.isLoadingDetail.set(false);
    }
  }

  closeDetailDrawer(): void {
    this.isDetailDrawerOpen.set(false);
    this.selectedDetail.set(null);
  }
}