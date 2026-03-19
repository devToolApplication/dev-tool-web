import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { BasePageResponse } from '../../../core/models/base-response.model';
import { I18nService } from '../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../core/ui-services/loading.service';
import { ToastService } from '../../../core/ui-services/toast.service';
import { TableConfig } from '../../../shared/ui/table/models/table-config.model';
import { McpToolConfigService } from '../mcp-tool-config.service';
import { McpToolConfig } from '../mcp-tool.models';

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
      new: {
        visible: true,
        label: 'mcpTool.newTool',
        icon: 'pi pi-plus',
        severity: 'success'
      }
    },
    filters: [
      {
        field: 'name',
        label: 'name',
        placeholder: 'mcpTool.toolNamePlaceholder',
        defaultVisible: true
      },
      {
        field: 'category',
        label: 'category',
        type: 'select',
        defaultVisible: true,
        options: [
          { label: 'jira', value: 'jira' },
          { label: 'github', value: 'github' },
          { label: 'code', value: 'code' },
          { label: 'slack', value: 'slack' },
          { label: 'custom', value: 'custom' }
        ]
      },
      {
        field: 'type',
        label: 'mcpTool.type',
        type: 'select',
        defaultVisible: true,
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
    filterOptions: {
      defaultVisibleCount: 4
    },
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
          {
            label: 'edit',
            icon: 'pi pi-pencil',
            severity: 'info',
            onClick: (row) => this.editTool(row.id)
          },
          {
            label: 'delete',
            icon: 'pi pi-trash',
            severity: 'danger',
            onClick: (row) => this.deleteTool(row.id)
          }
        ]
      }
    ],
    pagination: true,
    rows: 10,
    rowsPerPageOptions: [5, 10, 20]
  };

  rows: McpToolConfig[] = [];
  loading = false;
  tableLoading = false;
  filters: Record<string, any> = {};

  constructor(
    private readonly service: McpToolConfigService,
    private readonly router: Router,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly i18nService: I18nService
  ) {}

  ngOnInit(): void {
    if ((this.tableConfig.filters?.length ?? 0) === 0) {
      this.loadPage();
    }
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
    void this.router.navigate(['/admin/mcp-tool-config/tool/create']);
  }

  editTool(id: string): void {
    void this.router.navigate(['/admin/mcp-tool-config/tool/edit', id]);
  }

  deleteTool(id: string): void {
    this.loading = true;
    this.loadingService
      .track(this.service.remove(id))
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.toastService.info(this.i18nService.t('mcpTool.deleteSuccess'));
          this.loadPage();
        },
        error: () => this.toastService.error(this.i18nService.t('mcpTool.deleteError'))
      });
  }

  private loadPage(): void {
    this.tableLoading = true;
    this.loadingService
      .track(this.service.getPage(0, this.tableConfig.rows ?? 10, ['updatedAt,desc'], this.filters))
      .pipe(finalize(() => (this.tableLoading = false)))
      .subscribe({
        next: (res: BasePageResponse<McpToolConfig>) => {
          this.rows = res.data ?? [];
        },
        error: () => this.toastService.error(this.i18nService.t('mcpTool.loadListError'))
      });
  }
}
