import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { DEFAULT_TABLE_ROWS, DEFAULT_TABLE_ROWS_PER_PAGE } from '../../../../../core/constants/system.constants';
import { BasePageResponse } from '../../../../../core/models/base-response.model';
import { McpCategoryResponse, McpToolResponse } from '../../../../../core/models/mcp-server/mcp-tool.model';
import { McpCategoryService } from '../../../../../core/services/ai-agent-service/mcp-category.service';
import { McpToolService } from '../../../../../core/services/ai-agent-service/mcp-tool.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { TableConfig } from '../../../../../shared/ui/table/models/table-config.model';
import { MCP_TOOL_CONFIG_ROUTES } from '../../mcp-server.constants';

@Component({
  selector: 'app-mcp-tool-list',
  standalone: false,
  templateUrl: './mcp-tool-list.component.html',
  styleUrl: './mcp-tool-list.component.css'
})
export class McpToolListComponent implements OnInit {
  readonly tableConfig: TableConfig = {
    title: 'mcpTool.viewTitle',
    toolbar: {
      new: { visible: true, label: 'mcpTool.newTool', icon: 'pi pi-plus', severity: 'success' }
    },
    filters: [
      { field: 'name', label: 'name', placeholder: 'mcpTool.toolNamePlaceholder' },
      { field: 'category', label: 'category', type: 'select', options: [] },
      {
        field: 'type',
        label: 'mcpTool.type',
        type: 'select',
        options: [
          { label: 'mcpTool.endpointType', value: 'endpoint' },
          { label: 'mcpTool.dbType', value: 'db' }
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
      }
    ],
    filterOptions: { primaryField: 'name' },
    columns: [
      { field: 'name', header: 'name', sortable: true },
      { field: 'category', header: 'category', sortable: true },
      { field: 'type', header: 'mcpTool.type', sortable: true },
      { field: 'tags', header: 'mcpTool.tags', type: 'array' },
      { field: 'endpoint.method', header: 'mcpTool.method' },
      { field: 'endpoint.url', header: 'mcpTool.url' },
      { field: 'db.queryType', header: 'mcpTool.queryType' },
      { field: 'db.databaseName', header: 'mcpTool.database' },
      { field: 'db.collectionName', header: 'mcpTool.collection' },
      { field: 'enabled', header: 'enabled', type: 'boolean' },
      { field: 'updatedAt', header: 'updatedAt', type: 'date', format: 'dd/MM/yyyy HH:mm' },
      {
        field: 'actions',
        header: 'actions',
        type: 'actions',
        actions: [
          { label: 'edit', icon: 'pi pi-pencil', severity: 'info', onClick: (row) => this.editTool(row.id) },
          { label: 'delete', icon: 'pi pi-trash', severity: 'danger', onClick: (row) => this.deleteTool(row.id) }
        ]
      }
    ],
    pagination: true,
    rows: DEFAULT_TABLE_ROWS,
    rowsPerPageOptions: [...DEFAULT_TABLE_ROWS_PER_PAGE]
  };

  rows: McpToolResponse[] = [];
  categories: McpCategoryResponse[] = [];
  loading = false;
  tableLoading = false;
  filters: Record<string, any> = {};

  constructor(
    private readonly toolService: McpToolService,
    private readonly categoryService: McpCategoryService,
    private readonly router: Router,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly i18nService: I18nService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  onSearch(filters: Record<string, unknown>): void {
    this.filters = filters;
    this.loadPage();
  }

  onResetFilter(): void {
    this.filters = {};
    this.loadPage();
  }

  createTool(): void {
    void this.router.navigate([`${MCP_TOOL_CONFIG_ROUTES.toolList}/create`]);
  }

  editTool(id: string): void {
    void this.router.navigate([`${MCP_TOOL_CONFIG_ROUTES.toolList}/edit`, id]);
  }

  deleteTool(id: string): void {
    this.loading = true;
    this.loadingService.track(this.toolService.delete(id)).pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => {
        this.toastService.info(this.i18nService.t('mcpTool.deleteSuccess'));
        this.loadPage();
      },
      error: () => this.toastService.error(this.i18nService.t('mcpTool.deleteError'))
    });
  }

  private loadCategories(): void {
    this.loading = true;
    this.loadingService.track(this.categoryService.getAll()).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (categories) => {
        this.categories = categories;
        const categoryFilter = this.tableConfig.filters?.find((item) => item.field === 'category');
        if (categoryFilter) {
          categoryFilter.options = categories.map((item) => ({ label: item.name || item.code, value: item.code }));
        }
      },
      error: () => {
        this.toastService.error(this.i18nService.t('mcpCategory.loadListError'));
      }
    });
  }

  private loadPage(): void {
    this.tableLoading = true;
    this.loadingService.track(this.toolService.getPage(0, this.tableConfig.rows ?? DEFAULT_TABLE_ROWS, ['updatedAt,desc'], this.filters)).pipe(finalize(() => (this.tableLoading = false))).subscribe({
      next: (res: BasePageResponse<McpToolResponse>) => {
        this.rows = res.data ?? [];
      },
      error: () => this.toastService.error(this.i18nService.t('mcpTool.loadListError'))
    });
  }
}
