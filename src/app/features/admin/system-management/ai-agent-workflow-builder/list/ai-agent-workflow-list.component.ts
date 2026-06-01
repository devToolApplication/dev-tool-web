import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DEFAULT_TABLE_ROWS, DEFAULT_TABLE_ROWS_PER_PAGE } from '../../../../../core/constants/system.constants';
import { AiAgentWorkflowDefinitionResponse } from '../../../../../core/models/ai-agent/ai-agent-workflow.model';
import { AiAgentWorkflowService } from '../../../../../core/services/ai-agent-service/ai-agent-workflow.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { BasePagedList } from '../../../../../shared/ui/table/component/table/base-paged-list';
import { TableConfig } from '../../../../../shared/ui/table/models/table-config.model';
import { AI_AGENT_WORKFLOW_ROUTES } from '../ai-agent-workflow.constants';

@Component({
  selector: 'app-ai-agent-workflow-list',
  standalone: false,
  templateUrl: './ai-agent-workflow-list.component.html'
})
export class AiAgentWorkflowListComponent extends BasePagedList<AiAgentWorkflowDefinitionResponse> implements OnInit {
  readonly tableConfig: TableConfig = {
    title: 'systemManagement.aiAgentWorkflow.list.title',
    stateKey: 'system-management.ai-agent-workflows',
    emptyTitle: 'shared.table.emptyTitle',
    emptyDescription: 'shared.table.emptyDescription',
    errorTitle: 'loadError',
    toolbar: {
      new: { visible: true, label: 'systemManagement.action.newWorkflow', icon: 'pi pi-plus', severity: 'success' },
      columnVisibility: { visible: true },
      density: { visible: true }
    },
    filters: [
      {
        field: 'status',
        label: 'status',
        type: 'select',
        placeholder: 'systemManagement.filter.searchStatus',
        options: [
          { label: 'DRAFT', value: 'DRAFT' },
          { label: 'ACTIVE', value: 'ACTIVE' },
          { label: 'ARCHIVED', value: 'ARCHIVED' }
        ]
      }
    ],
    filterOptions: { primaryField: 'status' },
    columns: [
      { field: 'name', header: 'name', sortable: true },
      { field: 'description', header: 'description' },
      {
        field: 'status',
        header: 'status',
        type: 'badge',
        badgeMap: { DRAFT: 'warning', ACTIVE: 'success', ARCHIVED: 'muted' }
      },
      { field: 'updatedAt', header: 'updatedAt', type: 'date', sortable: true },
      {
        field: 'actions',
        header: 'actions',
        type: 'actions',
        minWidth: '14rem',
        frozen: true,
        alignFrozen: 'right',
        actions: [
          { label: 'design', icon: 'pi pi-sitemap', severity: 'info', onClick: (row) => this.goBuilder(row.id) },
          { label: 'edit', icon: 'pi pi-pencil', severity: 'secondary', onClick: (row) => this.goEdit(row.id) },
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
    private readonly service: AiAgentWorkflowService,
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
    void this.router.navigate([AI_AGENT_WORKFLOW_ROUTES.create]);
  }

  private goBuilder(id: string): void {
    void this.router.navigate([AI_AGENT_WORKFLOW_ROUTES.builder, id]);
  }

  private goEdit(id: string): void {
    void this.router.navigate([`${AI_AGENT_WORKFLOW_ROUTES.list}/edit`, id]);
  }

  private remove(id: string): void {
    this.toastService.info(this.i18nService.t('shared.toast.featureComingSoon'));
  }

  protected loadPage(): void {
    this.runPageRequest(this.loadingService.track(this.service.getPage(this.page, this.pageSize, this.sorts, this.filters)), {
      errorMessage: 'systemManagement.aiAgentWorkflow.toast.loadListFailed',
      onError: () => this.toastService.error('systemManagement.aiAgentWorkflow.toast.loadListFailed')
    });
  }
}
