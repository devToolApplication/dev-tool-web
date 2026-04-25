import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { DEFAULT_TABLE_ROWS, DEFAULT_TABLE_ROWS_PER_PAGE } from '../../../../../core/constants/system.constants';
import { AgentDefinitionResponse } from '../../../../../core/models/ai-agent/agent-definition.model';
import { BasePageResponse } from '../../../../../core/models/base-response.model';
import { AgentDefinitionService } from '../../../../../core/services/ai-agent-service/agent-definition.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { BasePagedList } from '../../../../../shared/ui/table/component/table/base-paged-list';
import { TableConfig } from '../../../../../shared/ui/table/models/table-config.model';
import { AgentDefinitionManagementContext, getAgentDefinitionRoutes } from '../agent-definition.constants';

@Component({
  selector: 'app-agent-definition-list',
  standalone: false,
  templateUrl: './agent-definition-list.component.html'
})
export class AgentDefinitionListComponent extends BasePagedList<AgentDefinitionResponse> implements OnInit {
  tableConfig!: TableConfig;

  loading = false;
  private readonly managementContext: AgentDefinitionManagementContext;
  private readonly routes: ReturnType<typeof getAgentDefinitionRoutes>;

  constructor(
    private readonly service: AgentDefinitionService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly i18nService: I18nService
  ) {
    super(route, router, DEFAULT_TABLE_ROWS);
    this.managementContext = this.route.snapshot.data['managementContext'] === 'codex' ? 'codex' : 'ai';
    this.routes = getAgentDefinitionRoutes(this.managementContext);
    this.tableConfig = this.createTableConfig();
  }

  ngOnInit(): void {
    this.loadPage();
  }

  onCreate(): void {
    void this.router.navigate([this.routes.create]);
  }

  private goEdit(id: string): void {
    void this.router.navigate([`${this.routes.list}/edit`, id]);
  }

  private openPlayground(id: string): void {
    void this.router.navigate(['/admin/ai-agent/runtime/playground'], { queryParams: { agentId: id } });
  }

  private openCodexPlayground(id: string): void {
    void this.router.navigate(['/admin/codex-agent/playground'], { queryParams: { agentId: id } });
  }

  private openCodexChatHistory(id: string): void {
    void this.router.navigate(['/admin/codex-agent/chat-history'], { queryParams: { agentId: id } });
  }

  private remove(id: string): void {
    this.loading = true;
    this.loadingService.track(this.service.delete(id)).pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => {
        this.toastService.info(this.i18nService.t('deleteSuccess'));
        this.loadPage();
      },
      error: () => this.toastService.error('Delete agent definition failed')
    });
  }

  protected loadPage(): void {
    this.loading = true;
    this.loadingService.track(this.service.getPage(this.page, this.pageSize, ['name,asc'], this.filters)).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (res: BasePageResponse<AgentDefinitionResponse>) => this.setPageResponse(res),
      error: () => this.toastService.error('Load agent definitions failed')
    });
  }

  private createTableConfig(): TableConfig {
    const isCodexContext = this.managementContext === 'codex';

    return {
      title: isCodexContext ? 'Codex Agents' : 'Agent Definitions',
      toolbar: {
        new: {
          visible: true,
          label: isCodexContext ? 'New Codex Agent' : 'New Agent',
          icon: 'pi pi-plus',
          severity: 'success'
        }
      },
      filters: [
        { field: 'code', label: 'Code', placeholder: 'Search code' },
        { field: 'name', label: 'Name', placeholder: 'Search name' },
        {
          field: 'enabled',
          label: 'Enabled',
          type: 'select',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false }
          ]
        }
      ],
      filterOptions: { primaryField: 'name' },
      columns: [
        { field: 'code', header: 'Code', sortable: true },
        { field: 'name', header: 'Name', sortable: true },
        ...(isCodexContext
          ? [
              { field: 'codexConfig.enabled', header: 'Codex', type: 'boolean' as const },
              { field: 'codexConfig.model', header: 'Model' },
              { field: 'codexConfig.mode', header: 'Mode' },
              { field: 'codexConfig.mcpServerIds', header: 'MCP Servers', type: 'array' as const },
              { field: 'codexConfig.mcpToolKeys', header: 'MCP Tools', type: 'array' as const },
              { field: 'codexConfig.skillIds', header: 'Skills', type: 'array' as const }
            ]
          : [
              { field: 'modelConfigId', header: 'Model' },
              { field: 'systemPromptTemplateId', header: 'Prompt Template' },
              { field: 'executionPolicyId', header: 'Policy' },
              { field: 'defaultActive', header: 'Default', type: 'boolean' as const }
            ]),
        { field: 'enabled', header: 'Enabled', type: 'boolean' },
        { field: 'status', header: 'Status' },
        {
          field: 'actions',
          header: 'Actions',
          type: 'actions',
          actions: isCodexContext
            ? [
                { label: 'Chats', icon: 'pi pi-comments', severity: 'help', onClick: (row) => this.openCodexChatHistory(row.id) },
                { label: 'Edit', icon: 'pi pi-pencil', severity: 'info', onClick: (row) => this.goEdit(row.id) },
                { label: 'Delete', icon: 'pi pi-trash', severity: 'danger', onClick: (row) => this.remove(row.id) }
              ]
            : [
                { label: 'Playground', icon: 'pi pi-play', severity: 'help', onClick: (row) => this.openPlayground(row.id) },
                { label: 'Codex', icon: 'pi pi-code', severity: 'contrast', onClick: (row) => this.openCodexPlayground(row.id) },
                { label: 'Edit', icon: 'pi pi-pencil', severity: 'info', onClick: (row) => this.goEdit(row.id) },
                { label: 'Delete', icon: 'pi pi-trash', severity: 'danger', onClick: (row) => this.remove(row.id) }
              ]
        }
      ],
      pagination: true,
      rows: DEFAULT_TABLE_ROWS,
      rowsPerPageOptions: [...DEFAULT_TABLE_ROWS_PER_PAGE]
    };
  }
}
