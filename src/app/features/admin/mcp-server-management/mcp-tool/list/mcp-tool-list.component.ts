import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { DEFAULT_TABLE_ROWS, DEFAULT_TABLE_ROWS_PER_PAGE } from '../../../../../core/constants/system.constants';
import { BasePageResponse } from '../../../../../core/models/base-response.model';
import { McpCategoryResponse, McpToolResponse } from '../../../../../core/models/mcp-server/mcp-tool.model';
import { McpCategoryService } from '../../../../../core/services/ai-agent-service/mcp-category.service';
import { McpToolService } from '../../../../../core/services/ai-agent-service/mcp-tool.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { BasePagedList } from '../../../../../shared/ui/table/component/table/base-paged-list';
import { TableConfig } from '../../../../../shared/ui/table/models/table-config.model';
import { MCP_TOOL_CONFIG_ROUTES } from '../../mcp-server.constants';

@Component({
  selector: 'app-mcp-tool-list',
  standalone: false,
  templateUrl: './mcp-tool-list.component.html',
  styleUrl: './mcp-tool-list.component.css'
})
export class McpToolListComponent extends BasePagedList<McpToolResponse> implements OnInit {
  tableConfig: TableConfig = {
    title: 'mcpTool.viewTitle',
    minWidth: '148rem',
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
      { field: 'code', header: 'Code', sortable: true, width: '14rem' },
      { field: 'name', header: 'name', sortable: true, width: '16rem', frozen: true, alignFrozen: 'left' },
      { field: 'category', header: 'category', sortable: true, width: '12rem' },
      { field: 'type', header: 'mcpTool.type', sortable: true, width: '7rem' },
      { field: 'tags', header: 'mcpTool.tags', type: 'array', width: '14rem' },
      { field: 'endpoint.method', header: 'mcpTool.method', width: '8rem' },
      { field: 'endpoint.url', header: 'mcpTool.url', width: '24rem' },
      { field: 'db.databaseName', header: 'mcpTool.database', width: '12rem' },
      { field: 'db.collectionName', header: 'mcpTool.collection', width: '14rem' },
      { field: 'enabled', header: 'enabled', type: 'boolean', width: '7rem' },
      { field: 'updatedAt', header: 'updatedAt', type: 'date', format: 'dd/MM/yyyy HH:mm', width: '12rem' },
      {
        field: 'actions',
        header: 'actions',
        type: 'actions',
        width: '13rem',
        frozen: true,
        alignFrozen: 'right',
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

  categories: McpCategoryResponse[] = [];
  loading = false;
  tableLoading = false;

  constructor(
    private readonly toolService: McpToolService,
    private readonly categoryService: McpCategoryService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly i18nService: I18nService
  ) {
    super(route, router, DEFAULT_TABLE_ROWS);
  }

  ngOnInit(): void {
    this.loadCategories();
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
        const categoryOptions = categories.map((item) => ({ label: item.name || item.code, value: item.code }));
        queueMicrotask(() => {
          this.tableConfig = {
            ...this.tableConfig,
            filters: (this.tableConfig.filters ?? []).map((item) =>
              item.field === 'category'
                ? { ...item, options: categoryOptions }
                : item
            )
          };
        });
      },
      error: () => {
        this.toastService.error(this.i18nService.t('mcpCategory.loadListError'));
      }
    });
  }

  protected loadPage(): void {
    this.tableLoading = true;
    this.loadingService
      .track(this.toolService.getPage(this.page, this.pageSize, ['updatedAt,desc'], this.filters as Record<string, string | number | boolean>))
      .pipe(finalize(() => (this.tableLoading = false)))
      .subscribe({
        next: (res: BasePageResponse<McpToolResponse>) => {
          this.setPageResponse(res);
        },
        error: () => this.toastService.error(this.i18nService.t('mcpTool.loadListError'))
      });
  }
}
