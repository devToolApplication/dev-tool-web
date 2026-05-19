import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DEFAULT_TABLE_ROWS, DEFAULT_TABLE_ROWS_PER_PAGE } from '../../../../../core/constants/system.constants';
import { ExecutionPolicyConfigResponse } from '../../../../../core/models/ai-agent/execution-policy.model';
import { ExecutionPolicyService } from '../../../../../core/services/ai-agent-service/execution-policy.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { BasePagedList } from '../../../../../shared/ui/table/component/table/base-paged-list';
import { TableConfig } from '../../../../../shared/ui/table/models/table-config.model';
import { EXECUTION_POLICY_ROUTES } from '../execution-policy.constants';

@Component({
  selector: 'app-execution-policy-list',
  standalone: false,
  templateUrl: './execution-policy-list.component.html'
})
export class ExecutionPolicyListComponent extends BasePagedList<ExecutionPolicyConfigResponse> implements OnInit {
  readonly tableConfig: TableConfig = {
    title: 'aiAgent.executionPolicy.title',
    stateKey: 'ai-agent.execution-policies',
    emptyTitle: 'shared.table.emptyTitle',
    emptyDescription: 'shared.table.emptyDescription',
    errorTitle: 'aiAgent.executionPolicy.loadErrorTitle',
    toolbar: {
      new: { visible: true, label: 'aiAgent.executionPolicy.new', icon: 'pi pi-plus', severity: 'success' },
      columnVisibility: { visible: true },
      density: { visible: true }
    },
    filters: [
      { field: 'code', label: 'code', placeholder: 'aiAgent.executionPolicy.searchCode' },
      { field: 'name', label: 'name', placeholder: 'aiAgent.executionPolicy.searchName' },
      {
        field: 'enabled',
        label: 'enabled',
        type: 'select',
        options: [
          { label: 'yes', value: true },
          { label: 'no', value: false }
        ]
      }
    ],
    filterOptions: { primaryField: 'name' },
    columns: [
      { field: 'code', header: 'code', type: 'copyable', sortable: true },
      { field: 'name', header: 'name', sortable: true },
      { field: 'maxSteps', header: 'aiAgent.executionPolicy.maxSteps', sortable: true },
      { field: 'maxToolCallsPerStep', header: 'aiAgent.executionPolicy.maxToolCallsPerStep', sortable: true },
      { field: 'allowParallelTools', header: 'aiAgent.executionPolicy.allowParallelTools', type: 'boolean' },
      { field: 'nativeToolPreferred', header: 'aiAgent.executionPolicy.nativeToolPreferred', type: 'boolean' },
      { field: 'enabled', header: 'enabled', type: 'boolean' },
      {
        field: 'actions',
        header: 'actions',
        type: 'actions',
        minWidth: '12rem',
        frozen: true,
        alignFrozen: 'right',
          actions: [
            { label: 'edit', icon: 'pi pi-pencil', severity: 'info', onClick: (row) => this.goEdit(row.id) },
            {
              label: 'delete',
              icon: 'pi pi-trash',
              severity: 'danger',
              variant: 'danger',
              confirm: { message: 'shared.confirm.dangerAction', variant: 'danger' },
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
    private readonly service: ExecutionPolicyService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly i18nService: I18nService
  ) {
    super(route, router, DEFAULT_TABLE_ROWS, ['name,asc']);
  }

  ngOnInit(): void {
    this.loadPage();
  }

  onCreate(): void {
    void this.router.navigate([EXECUTION_POLICY_ROUTES.create]);
  }

  retryLoad(): void {
    this.loadPage();
  }

  private goEdit(id: string): void {
    void this.router.navigate([`${EXECUTION_POLICY_ROUTES.list}/edit`, id]);
  }

  private remove(id: string): void {
    this.loadingService.track(this.service.delete(id)).subscribe({
      next: () => {
        this.toastService.info(this.i18nService.t('deleteSuccess'));
        this.loadPage();
      },
      error: () => this.toastService.error('aiAgent.executionPolicy.toast.deleteFailed')
    });
  }

  protected loadPage(): void {
    this.runPageRequest(this.loadingService.track(this.service.getPage(this.page, this.pageSize, this.sorts, this.filters)), {
      errorMessage: 'aiAgent.executionPolicy.loadFailed',
      onError: () => this.toastService.error('aiAgent.executionPolicy.toast.loadListFailed')
    });
  }
}
