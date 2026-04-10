import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { DEFAULT_TABLE_ROWS, DEFAULT_TABLE_ROWS_PER_PAGE, SYSTEM_STATUS_OPTIONS } from '../../../../../core/constants/system.constants';
import { PromptTemplateResponse } from '../../../../../core/models/ai-agent/prompt-template.model';
import { BasePageResponse } from '../../../../../core/models/base-response.model';
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
    title: 'Prompt Templates',
    toolbar: { new: { visible: true, label: 'New Template', icon: 'pi pi-plus', severity: 'success' } },
    filters: [
      { field: 'code', label: 'Code', placeholder: 'Search code' },
      { field: 'name', label: 'Name', placeholder: 'Search name' },
      {
        field: 'templateType',
        label: 'Type',
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
        label: 'Enabled',
        type: 'select',
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ]
      },
      { field: 'status', label: 'Status', type: 'select', options: [...SYSTEM_STATUS_OPTIONS] }
    ],
    filterOptions: { primaryField: 'name' },
    columns: [
      { field: 'code', header: 'Code', sortable: true },
      { field: 'name', header: 'Name', sortable: true },
      { field: 'templateType', header: 'Type', sortable: true },
      { field: 'version', header: 'Version', sortable: true },
      { field: 'enabled', header: 'Enabled', type: 'boolean' },
      { field: 'status', header: 'Status', sortable: true },
      {
        field: 'actions',
        header: 'Actions',
        type: 'actions',
        actions: [
          { label: 'Edit', icon: 'pi pi-pencil', severity: 'info', onClick: (row) => this.goEdit(row.id) },
          { label: 'Delete', icon: 'pi pi-trash', severity: 'danger', onClick: (row) => this.remove(row.id) }
        ]
      }
    ],
    pagination: true,
    rows: DEFAULT_TABLE_ROWS,
    rowsPerPageOptions: [...DEFAULT_TABLE_ROWS_PER_PAGE]
  };

  loading = false;

  constructor(
    private readonly service: PromptTemplateService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly i18nService: I18nService
  ) {
    super(route, router, DEFAULT_TABLE_ROWS);
  }

  ngOnInit(): void {
    this.loadPage();
  }

  onCreate(): void {
    void this.router.navigate([PROMPT_TEMPLATE_ROUTES.create]);
  }

  private goEdit(id: string): void {
    void this.router.navigate([`${PROMPT_TEMPLATE_ROUTES.list}/edit`, id]);
  }

  private remove(id: string): void {
    this.loading = true;
    this.loadingService.track(this.service.delete(id)).pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => {
        this.toastService.info(this.i18nService.t('deleteSuccess'));
        this.loadPage();
      },
      error: () => this.toastService.error('Delete prompt template failed')
    });
  }

  protected loadPage(): void {
    this.loading = true;
    this.loadingService.track(this.service.getPage(this.page, this.pageSize, ['name,asc'], this.filters)).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (res: BasePageResponse<PromptTemplateResponse>) => this.setPageResponse(res),
      error: () => this.toastService.error('Load prompt templates failed')
    });
  }
}
