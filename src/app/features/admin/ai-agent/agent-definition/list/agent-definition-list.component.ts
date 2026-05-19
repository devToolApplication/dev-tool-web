import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DEFAULT_TABLE_ROWS, DEFAULT_TABLE_ROWS_PER_PAGE } from '../../../../../core/constants/system.constants';
import { AgentDefinitionResponse } from '../../../../../core/models/ai-agent/agent-definition.model';
import { AgentDefinitionService } from '../../../../../core/services/ai-agent-service/agent-definition.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { BasePagedList } from '../../../../../shared/ui/table/component/table/base-paged-list';
import { TableConfig } from '../../../../../shared/ui/table/models/table-config.model';
import { AGENT_DEFINITION_ROUTES } from '../agent-definition.constants';

@Component({
  selector: 'app-agent-definition-list',
  standalone: false,
  templateUrl: './agent-definition-list.component.html'
})
export class AgentDefinitionListComponent extends BasePagedList<AgentDefinitionResponse> implements OnInit {
  tableConfig!: TableConfig;

  constructor(
    private readonly service: AgentDefinitionService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly i18nService: I18nService
  ) {
    super(route, router, DEFAULT_TABLE_ROWS, ['name,asc']);
    this.tableConfig = this.createTableConfig();
  }

  ngOnInit(): void {
    this.loadPage();
  }

  onCreate(): void {
    void this.router.navigate([AGENT_DEFINITION_ROUTES.create]);
  }

  retryLoad(): void {
    this.loadPage();
  }

  private goEdit(id: string): void {
    void this.router.navigate([`${AGENT_DEFINITION_ROUTES.list}/edit`, id]);
  }

  private openPlayground(id: string): void {
    void this.router.navigate(['/admin/ai-agent/runtime/playground'], { queryParams: { agentId: id } });
  }

  private remove(id: string): void {
    this.loadingService.track(this.service.delete(id)).subscribe({
      next: () => {
        this.toastService.info(this.i18nService.t('deleteSuccess'));
        this.loadPage();
      },
      error: () => this.toastService.error('aiAgent.agentDefinition.toast.deleteFailed')
    });
  }

  protected loadPage(): void {
    this.runPageRequest(this.loadingService.track(this.service.getPage(this.page, this.pageSize, this.sorts, this.filters)), {
      errorMessage: 'aiAgent.agentDefinition.loadFailed',
      onError: () => this.toastService.error('aiAgent.agentDefinition.toast.loadFailed')
    });
  }

  private createTableConfig(): TableConfig {
    return {
      title: 'aiAgent.agentDefinition.title',
      stateKey: 'ai-agent.agent-definitions',
      emptyTitle: 'shared.table.emptyTitle',
      emptyDescription: 'shared.table.emptyDescription',
      errorTitle: 'aiAgent.agentDefinition.loadErrorTitle',
      toolbar: {
        new: {
          visible: true,
          label: 'aiAgent.agentDefinition.new',
          icon: 'pi pi-plus',
          severity: 'success'
        },
        columnVisibility: { visible: true },
        density: { visible: true }
      },
      filters: [
        { field: 'code', label: 'code', placeholder: 'aiAgent.agentDefinition.searchCode' },
        { field: 'name', label: 'name', placeholder: 'aiAgent.agentDefinition.searchName' },
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
        { field: 'modelConfigId', header: 'aiAgent.model', type: 'copyable' },
        { field: 'systemPromptTemplateId', header: 'aiAgent.promptTemplate', type: 'copyable' },
        { field: 'executionPolicyId', header: 'aiAgent.executionPolicy', type: 'copyable' },
        { field: 'defaultActive', header: 'aiAgent.agentDefinition.defaultActive', type: 'boolean' },
        { field: 'enabled', header: 'enabled', type: 'boolean' },
        {
          field: 'status',
          header: 'status',
          type: 'badge',
          badgeMap: { ACTIVE: 'success', INACTIVE: 'muted', DELETE: 'danger' }
        },
        {
          field: 'actions',
          header: 'actions',
          type: 'actions',
          minWidth: '16rem',
          frozen: true,
          alignFrozen: 'right',
          actions: [
            { label: 'layout.menu.playground', icon: 'pi pi-play', severity: 'help', onClick: (row) => this.openPlayground(row.id) },
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
  }
}
