import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TableConfig } from '../../shared/ui/table/models/table-config.model';
import { McpToolConfigService } from './mcp-tool-config.service';
import { McpToolConfig } from './mcp-tool.models';

@Component({
  selector: 'app-mcp-tool-list',
  standalone: false,
  templateUrl: './mcp-tool-list.component.html',
  styleUrl: './mcp-tool-list.component.css'
})
export class McpToolListComponent implements OnInit, OnDestroy {
  readonly tableConfig: TableConfig = {
    title: 'MCP Tool Config - View',
    toolbar: {
      new: {
        visible: true,
        label: 'NEW TOOL',
        icon: 'pi pi-plus',
        severity: 'success'
      }
    },
    filters: [
      {
        field: 'name',
        label: 'Name',
        placeholder: 'Nhập tên tool',
        defaultVisible: true
      },
      {
        field: 'category',
        label: 'Category',
        type: 'select',
        defaultVisible: true,
        options: [
          { label: 'JIRA', value: 'jira' },
          { label: 'GITHUB', value: 'github' },
          { label: 'CODE', value: 'code' },
          { label: 'SLACK', value: 'slack' },
          { label: 'CUSTOM', value: 'custom' }
        ]
      },
      {
        field: 'enabled',
        label: 'Enabled',
        type: 'boolean'
      }
    ],
    filterOptions: {
      defaultVisibleCount: 3
    },
    columns: [
      { field: 'name', header: 'Name', sortable: true },
      { field: 'category', header: 'Category', sortable: true },
      { field: 'endpoint', header: 'Endpoint' },
      { field: 'authType', header: 'Auth Type' },
      { field: 'enabled', header: 'Enabled', type: 'boolean' },
      { field: 'timeoutMs', header: 'Timeout', type: 'number' },
      { field: 'retryCount', header: 'Retry Count', type: 'number' },
      { field: 'updatedAt', header: 'Updated At', type: 'date', format: 'dd/MM/yyyy HH:mm' },
      {
        field: 'actions',
        header: 'Actions',
        type: 'actions',
        actions: [
          {
            label: 'Sửa',
            icon: 'pi pi-pencil',
            severity: 'info',
            onClick: (row) => this.editTool(row.id)
          },
          {
            label: 'Xóa',
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

  tools: McpToolConfig[] = [];
  filteredTools: McpToolConfig[] = [];
  loading = false;
  private sub?: Subscription;

  constructor(
    private readonly service: McpToolConfigService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.sub = this.service.list().subscribe((rows) => {
      this.tools = rows;
      this.filteredTools = rows;
    });
  }

  onSearch(filters: Record<string, unknown>): void {
    this.filteredTools = this.tools.filter((tool) => {
      const name = String(filters['name'] ?? '').trim().toLowerCase();
      const category = String(filters['category'] ?? '').trim();
      const enabled = filters['enabled'];

      const matchedName = !name || tool.name.toLowerCase().includes(name);
      const matchedCategory = !category || tool.category === category;
      const matchedEnabled = typeof enabled !== 'boolean' || tool.enabled === enabled;

      return matchedName && matchedCategory && matchedEnabled;
    });
  }

  onResetFilter(): void {
    this.filteredTools = this.tools;
  }

  createTool(): void {
    void this.router.navigate(['/admin/mcp-tool-config/tool/create']);
  }

  editTool(id: string): void {
    void this.router.navigate(['/admin/mcp-tool-config/tool/edit', id]);
  }

  deleteTool(id: string): void {
    this.service.remove(id).subscribe();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
