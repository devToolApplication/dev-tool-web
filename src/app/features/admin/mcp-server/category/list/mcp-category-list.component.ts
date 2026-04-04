import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { DEFAULT_TABLE_ROWS, DEFAULT_TABLE_ROWS_PER_PAGE } from '../../../../../core/constants/system.constants';
import { BasePageResponse } from '../../../../../core/models/base-response.model';
import { McpCategoryResponse } from '../../../../../core/models/mcp-server/mcp-tool.model';
import { McpCategoryService } from '../../../../../core/services/ai-agent-service/mcp-category.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { TableConfig } from '../../../../../shared/ui/table/models/table-config.model';
import { MCP_TOOL_CONFIG_ROUTES } from '../../mcp-server.constants';

@Component({
  selector: 'app-mcp-category-list',
  standalone: false,
  templateUrl: './mcp-category-list.component.html'
})
export class McpCategoryListComponent implements OnInit {
  readonly tableConfig: TableConfig = {
    title: 'mcpCategory.title',
    toolbar: {
      new: { visible: true, label: 'mcpCategory.new', icon: 'pi pi-plus', severity: 'success' }
    },
    columns: [
      { field: 'name', header: 'name', sortable: true },
      { field: 'code', header: 'code', sortable: true },
      { field: 'status', header: 'status' },
      { field: 'description', header: 'description' },
      {
        field: 'actions',
        header: 'actions',
        type: 'actions',
        actions: [
          { label: 'edit', icon: 'pi pi-pencil', severity: 'info', onClick: (row) => this.goEdit(row.id) },
          { label: 'delete', icon: 'pi pi-trash', severity: 'danger', onClick: (row) => this.remove(row.id) }
        ]
      }
    ],
    pagination: true,
    rows: DEFAULT_TABLE_ROWS,
    rowsPerPageOptions: [...DEFAULT_TABLE_ROWS_PER_PAGE]
  };

  rows: McpCategoryResponse[] = [];
  loading = false;

  constructor(
    private readonly service: McpCategoryService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly router: Router,
    private readonly i18nService: I18nService
  ) {}

  ngOnInit(): void {
    this.loadPage();
  }

  onCreate(): void {
    void this.router.navigate([`${MCP_TOOL_CONFIG_ROUTES.categoryList}/create`]);
  }

  private goEdit(id: string): void {
    void this.router.navigate([`${MCP_TOOL_CONFIG_ROUTES.categoryList}/edit`, id]);
  }

  private remove(id: string): void {
    this.loading = true;
    this.loadingService.track(this.service.delete(id)).pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => {
        this.toastService.info(this.i18nService.t('deleteSuccess'));
        this.loadPage();
      },
      error: () => this.toastService.error(this.i18nService.t('deleteError'))
    });
  }

  private loadPage(): void {
    this.loading = true;
    this.loadingService.track(this.service.getPage()).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (res: BasePageResponse<McpCategoryResponse>) => {
        this.rows = res.data ?? [];
      },
      error: () => this.toastService.error(this.i18nService.t('mcpCategory.loadListError'))
    });
  }
}
