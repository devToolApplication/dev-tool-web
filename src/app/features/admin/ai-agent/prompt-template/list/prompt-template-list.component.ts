import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DEFAULT_TABLE_ROWS, DEFAULT_TABLE_ROWS_PER_PAGE, SYSTEM_STATUS_OPTIONS } from '../../../../../core/constants/system.constants';
import { PromptTemplateResponse } from '../../../../../core/models/ai-agent/prompt-template.model';
import { PromptTemplateService } from '../../../../../core/services/ai-agent-service/prompt-template.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { BasePagedList } from '../../../../../shared/ui/table/component/table/base-paged-list';
import { TableConfig } from '../../../../../shared/ui/table/models/table-config.model';
import { PROMPT_TEMPLATE_ROUTES } from '../prompt-template.constants';

@Component({
  selector: 'app-prompt-template-list',
  standalone: false,
  templateUrl: './prompt-template-list.component.html'
})
export class PromptTemplateListComponent extends BasePagedList<PromptTemplateResponse> implements OnInit {
  readonly tableConfig: TableConfig = {
    title: 'aiAgent.promptTemplate.title',
    stateKey: 'ai-agent.prompt-templates',
    emptyTitle: 'shared.table.emptyTitle',
    emptyDescription: 'shared.table.emptyDescription',
    errorTitle: 'aiAgent.promptTemplate.loadErrorTitle',
    toolbar: {
      new: { visible: true, label: 'aiAgent.promptTemplate.new', icon: 'pi pi-plus', severity: 'success' },
      columnVisibility: { visible: true },
      density: { visible: true }
    },
    filters: [
      { field: 'code', label: 'code', placeholder: 'aiAgent.promptTemplate.searchCode' },
      { field: 'name', label: 'name', placeholder: 'aiAgent.promptTemplate.searchName' },
      {
        field: 'templateType',
        label: 'aiAgent.promptTemplate.templateType',
        type: 'select',
        options: [
          { label: 'SYSTEM', value: 'SYSTEM' },
          { label: 'USER', value: 'USER' },
          { label: 'TOOL_PROTOCOL', value: 'TOOL_PROTOCOL' },
          { label: 'AGENT', value: 'AGENT' }
        ]
      },
      {
        field: 'enabled',
        label: 'enabled',
        type: 'select',
        options: [
          { label: 'yes', value: true },
          { label: 'no', value: false }
        ]
      },
      { field: 'status', label: 'status', type: 'select', options: [...SYSTEM_STATUS_OPTIONS] }
    ],
    filterOptions: { primaryField: 'name' },
    columns: [
      { field: 'code', header: 'code', type: 'copyable', sortable: true },
      { field: 'name', header: 'name', sortable: true },
      { field: 'templateType', header: 'aiAgent.promptTemplate.templateType', sortable: true },
      { field: 'version', header: 'aiAgent.promptTemplate.version', sortable: true },
      { field: 'enabled', header: 'enabled', type: 'boolean' },
      {
        field: 'status',
        header: 'status',
        type: 'badge',
        sortable: true,
        badgeMap: { ACTIVE: 'success', INACTIVE: 'muted', DELETE: 'danger' }
      },
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
    private readonly service: PromptTemplateService,
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
    void this.router.navigate([PROMPT_TEMPLATE_ROUTES.create]);
  }

  retryLoad(): void {
    this.loadPage();
  }

  private goEdit(id: string): void {
    void this.router.navigate([`${PROMPT_TEMPLATE_ROUTES.list}/edit`, id]);
  }

  private remove(id: string): void {
    this.loadingService.track(this.service.delete(id)).subscribe({
      next: () => {
        this.toastService.info(this.i18nService.t('deleteSuccess'));
        this.loadPage();
      },
      error: () => this.toastService.error('aiAgent.promptTemplate.toast.deleteFailed')
    });
  }

  protected loadPage(): void {
    this.runPageRequest(this.loadingService.track(this.service.getPage(this.page, this.pageSize, this.sorts, this.filters)), {
      errorMessage: 'aiAgent.promptTemplate.loadFailed',
      onError: () => this.toastService.error('aiAgent.promptTemplate.toast.loadListFailed')
    });
  }
}
