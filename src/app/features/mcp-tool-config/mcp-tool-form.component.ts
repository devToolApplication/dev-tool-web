import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { FormConfig, FormContext } from '../../shared/ui/form-input/models/form-config.model';
import { McpToolConfigService } from './mcp-tool-config.service';
import { McpToolCategory, McpToolConfig, McpToolUpsertPayload } from './mcp-tool.models';

@Component({
  selector: 'app-mcp-tool-form',
  standalone: false,
  templateUrl: './mcp-tool-form.component.html',
  styleUrl: './mcp-tool-form.component.css'
})
export class McpToolFormComponent implements OnInit, OnDestroy {
  readonly formContext: FormContext = {
    user: null,
    mode: 'create'
  };

  readonly formConfig: FormConfig = {
    fields: [
      {
        type: 'select',
        name: 'category',
        label: 'Category',
        width: '1/2',
        options: [
          { label: 'JIRA', value: 'jira' },
          { label: 'GITHUB', value: 'github' },
          { label: 'CODE', value: 'code' },
          { label: 'SLACK', value: 'slack' },
          { label: 'CUSTOM', value: 'custom' }
        ],
        validation: [{ expression: '!!model.category', message: 'Category là bắt buộc' }]
      },
      {
        type: 'text',
        name: 'name',
        label: 'Name',
        width: '1/2',
        validation: [{ expression: '!!model.name?.trim()', message: 'Name là bắt buộc' }]
      },
      {
        type: 'text',
        name: 'endpoint',
        label: 'Endpoint',
        width: '1/2',
        validation: [{ expression: '!!model.endpoint?.trim()', message: 'Endpoint là bắt buộc' }]
      },
      {
        type: 'select',
        name: 'authType',
        label: 'Auth Type',
        width: '1/2',
        options: [
          { label: 'API KEY', value: 'api_key' },
          { label: 'OAUTH', value: 'oauth' },
          { label: 'NONE', value: 'none' }
        ]
      },
      {
        type: 'number',
        name: 'timeoutMs',
        label: 'Timeout (ms)',
        width: '1/2',
        validation: [{ expression: 'Number(model.timeoutMs) >= 1000', message: 'Timeout tối thiểu là 1000ms' }]
      },
      {
        type: 'number',
        name: 'retryCount',
        label: 'Retry Count',
        width: '1/2',
        validation: [{ expression: 'Number(model.retryCount) >= 0', message: 'Retry count phải lớn hơn hoặc bằng 0' }]
      },
      {
        type: 'checkbox',
        name: 'enabled',
        label: 'Enabled',
        width: '1/2'
      },
      {
        type: 'textarea',
        name: 'description',
        label: 'Description',
        width: 'full'
      },
      {
        type: 'record',
        name: 'scopes',
        label: 'Scopes',
        keyLabel: 'Scope',
        valueLabel: 'Description',
        addButtonLabel: 'Add scope',
        width: 'full'
      }
    ]
  };

  toolId: string | null = null;
  formInitialValue = this.createInitialValue();
  readonly formVisible = signal(true);

  private sub?: Subscription;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly service: McpToolConfigService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) {
        this.toolId = null;
        this.formContext.mode = 'create';
        this.formInitialValue = this.createInitialValue();
        this.rerenderForm();
        return;
      }

      this.toolId = id;
      this.formContext.mode = 'edit';
      this.bindDetail(id);
    });
  }

  onSubmitForm(rawModel: Record<string, unknown>): void {
    const payload: McpToolUpsertPayload = {
      category: (rawModel['category'] as McpToolCategory) ?? 'custom',
      name: String(rawModel['name'] ?? '').trim(),
      endpoint: String(rawModel['endpoint'] ?? '').trim(),
      authType: (rawModel['authType'] as 'api_key' | 'oauth' | 'none') ?? 'none',
      enabled: Boolean(rawModel['enabled']),
      timeoutMs: Number(rawModel['timeoutMs'] ?? 10000),
      retryCount: Number(rawModel['retryCount'] ?? 0),
      description: String(rawModel['description'] ?? '').trim(),
      scopes: this.normalizeScopes(rawModel['scopes'])
    };

    const request$ = this.toolId ? this.service.update(this.toolId, payload) : this.service.create(payload);
    request$.subscribe(() => {
      void this.router.navigate(['/admin/mcp-tool-config/tool']);
    });
  }

  backToView(): void {
    void this.router.navigate(['/admin/mcp-tool-config/tool']);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private bindDetail(id: string): void {
    this.sub?.unsubscribe();
    this.sub = this.service.getById(id).subscribe((tool) => {
      if (!tool) {
        this.backToView();
        return;
      }

      this.formInitialValue = this.mapToInitialValue(tool);
      this.rerenderForm();
    });
  }

  private rerenderForm(): void {
    this.formVisible.set(false);
    queueMicrotask(() => this.formVisible.set(true));
  }

  private mapToInitialValue(tool: McpToolConfig): Record<string, unknown> {
    const scopes = tool.scopes.reduce<Record<string, string>>((result, scope) => {
      result[scope] = '';
      return result;
    }, {});

    return {
      category: tool.category,
      name: tool.name,
      endpoint: tool.endpoint,
      authType: tool.authType,
      enabled: tool.enabled,
      timeoutMs: tool.timeoutMs,
      retryCount: tool.retryCount,
      description: tool.description,
      scopes
    };
  }

  private normalizeScopes(value: unknown): string[] {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return [];
    }

    return Object.keys(value as Record<string, unknown>)
      .map((key) => key.trim())
      .filter(Boolean);
  }

  private createInitialValue(): Record<string, unknown> {
    return {
      category: 'github',
      name: '',
      endpoint: '',
      authType: 'api_key',
      enabled: true,
      timeoutMs: 10000,
      retryCount: 2,
      description: '',
      scopes: {
        'repo:read': ''
      }
    };
  }
}
