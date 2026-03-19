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
        field: 'enabled',
        label: 'enabled',
        type: 'boolean'
      }
    ],
    filterOptions: {
      defaultVisibleCount: 3
    },
    columns: [
      { field: 'name', header: 'name', sortable: true },
      { field: 'category', header: 'category', sortable: true },
      { field: 'endpoint', header: 'endpoint' },
      { field: 'authType', header: 'authType' },
      { field: 'enabled', header: 'enabled', type: 'boolean' },
      { field: 'timeoutMs', header: 'timeout', type: 'number' },
      { field: 'retryCount', header: 'retryCount', type: 'number' },
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
