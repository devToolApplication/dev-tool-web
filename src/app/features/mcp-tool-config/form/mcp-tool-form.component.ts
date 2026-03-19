import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import { I18nService } from '../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../core/ui-services/loading.service';
import { ToastService } from '../../../core/ui-services/toast.service';
import { FormConfig, FormContext } from '../../../shared/ui/form-input/models/form-config.model';
import { McpToolConfigService } from '../mcp-tool-config.service';
import {
  McpCollectionField,
  McpDbConfig,
  McpDbQueryType,
  McpEndpointConfig,
  McpEndpointMethod,
  McpToolCategory,
  McpToolConfig,
  McpToolType,
  McpToolUpsertPayload
} from '../mcp-tool.models';

@Component({
  selector: 'app-mcp-tool-form',
  standalone: false,
  templateUrl: './mcp-tool-form.component.html',
  styleUrl: './mcp-tool-form.component.css'
})
export class McpToolFormComponent implements OnInit, OnDestroy {
  formContext: FormContext = {
    user: null,
    mode: 'create',
    extra: {
      databaseOptions: [],
      collectionOptions: [],
      fieldOptions: []
    }
  };

  readonly formConfig: FormConfig = {
    fields: [
      {
        type: 'select',
        name: 'category',
        label: 'category',
        width: '1/2',
        options: [
          { label: 'jira', value: 'jira' },
          { label: 'github', value: 'github' },
          { label: 'code', value: 'code' },
          { label: 'slack', value: 'slack' },
          { label: 'custom', value: 'custom' }
        ],
        validation: [{ expression: '!model.category', message: 'mcpTool.categoryRequired' }]
      },
      {
        type: 'select',
        name: 'type',
        label: 'mcpTool.type',
        width: '1/2',
        options: [
          { label: 'mcpTool.endpointType', value: 'endpoint' },
          { label: 'mcpTool.dbType', value: 'db' }
        ],
        validation: [{ expression: '!model.type', message: 'mcpTool.typeRequired' }]
      },
      {
        type: 'text',
        name: 'name',
        label: 'name',
        width: '1/2',
        validation: [{ expression: '!model.name?.trim()', message: 'mcpTool.nameRequired' }]
      },
      {
        type: 'checkbox',
        name: 'enabled',
        label: 'enabled',
        width: '1/2'
      },
      {
        type: 'textarea',
        name: 'description',
        label: 'description',
        width: 'full'
      },
      {
        type: 'tags',
        name: 'tags',
        label: 'mcpTool.tags',
        width: 'full',
        options: [
          { label: 'search', value: 'search' },
          { label: 'jira', value: 'jira' },
          { label: 'create-task', value: 'create-task' },
          { label: 'github', value: 'github' },
          { label: 'db', value: 'db' },
          { label: 'analytics', value: 'analytics' },
          { label: 'code', value: 'code' },
          { label: 'notification', value: 'notification' }
        ],
        validation: [{ expression: '!(model.tags?.length > 0)', message: 'mcpTool.tagsRequired' }]
      },
      {
        type: 'group',
        name: 'endpoint',
        label: 'mcpTool.endpointConfig',
        width: 'full',
        rules: {
          visible: 'model.type === "endpoint"'
        },
        children: [
          {
            type: 'select',
            name: 'method',
            label: 'mcpTool.method',
            width: '1/3',
            options: [
              { label: 'GET', value: 'GET' },
              { label: 'POST', value: 'POST' },
              { label: 'PUT', value: 'PUT' },
              { label: 'PATCH', value: 'PATCH' },
              { label: 'DELETE', value: 'DELETE' }
            ],
            validation: [
              { expression: 'model.type === "endpoint" && !model.endpoint?.method', message: 'mcpTool.methodRequired' }
            ]
          },
          {
            type: 'text',
            name: 'url',
            label: 'mcpTool.url',
            width: '1/2',
            validation: [
              { expression: 'model.type === "endpoint" && !model.endpoint?.url?.trim()', message: 'mcpTool.urlRequired' }
            ]
          },
          {
            type: 'record',
            name: 'params',
            label: 'mcpTool.params',
            keyLabel: 'key',
            valueLabel: 'value',
            addButtonLabel: 'addRow',
            width: '1/2'
          },
          {
            type: 'record',
            name: 'headers',
            label: 'mcpTool.headers',
            keyLabel: 'key',
            valueLabel: 'value',
            addButtonLabel: 'addRow',
            width: '1/2'
          },
          {
            type: 'textarea',
            name: 'body',
            label: 'mcpTool.body',
            width: 'full'
          }
        ]
      },
      {
        type: 'group',
        name: 'db',
        label: 'mcpTool.dbConfig',
        width: 'full',
        rules: {
          visible: 'model.type === "db"'
        },
        children: [
          {
            type: 'select',
            name: 'queryType',
            label: 'mcpTool.queryType',
            width: '1/3',
            options: [
              { label: 'mcpTool.selectQuery', value: 'select' },
              { label: 'mcpTool.insertQuery', value: 'insert' },
              { label: 'mcpTool.updateQuery', value: 'update' },
              { label: 'mcpTool.deleteQuery', value: 'delete' }
            ],
            validation: [
              { expression: 'model.type === "db" && !model.db?.queryType', message: 'mcpTool.queryTypeRequired' }
            ]
          },
          {
            type: 'select',
            name: 'databaseName',
            label: 'mcpTool.database',
            width: '1/3',
            optionsExpression: 'context.extra?.databaseOptions || []',
            validation: [
              { expression: 'model.type === "db" && !model.db?.databaseName?.trim()', message: 'mcpTool.databaseRequired' }
            ]
          },
          {
            type: 'select',
            name: 'collectionName',
            label: 'mcpTool.collection',
            width: '1/3',
            optionsExpression: 'context.extra?.collectionOptions || []',
            validation: [
              { expression: 'model.type === "db" && !model.db?.collectionName?.trim()', message: 'mcpTool.collectionRequired' }
            ]
          },
          {
            type: 'select-multi',
            name: 'fields',
            label: 'mcpTool.fields',
            width: 'full',
            optionsExpression: 'context.extra?.fieldOptions || []'
          },
          {
            type: 'textarea',
            name: 'condition',
            label: 'mcpTool.condition',
            width: 'full'
          }
        ]
      }
    ]
  };

  toolId: string | null = null;
  formInitialValue = this.createInitialValue();
  readonly formVisible = signal(true);
  loading = false;

  private detailSub?: Subscription;
  private databaseOptions: { label: string; value: string }[] = [];
  private readonly collectionFieldMap = new Map<string, McpCollectionField[]>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly service: McpToolConfigService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly i18nService: I18nService
  ) {}

  ngOnInit(): void {
    this.loadDatabases();
  }

  onFormValueChange(rawModel: Record<string, unknown>): void {
    const type = (rawModel['type'] as McpToolType) ?? 'endpoint';
    if (type !== 'db') {
      if ((this.formContext.extra?.collectionOptions?.length ?? 0) > 0 || (this.formContext.extra?.fieldOptions?.length ?? 0) > 0) {
        this.formContext = {
          ...this.formContext,
          extra: {
            ...this.formContext.extra,
            collectionOptions: [],
            fieldOptions: []
          }
        };
      }
      return;
    }

    const db = this.normalizeDb(rawModel['db']);
    const currentDb = this.normalizeDb(this.formInitialValue['db']);
    if (
      db.databaseName === currentDb.databaseName &&
      db.collectionName === currentDb.collectionName &&
      JSON.stringify(db.fields) === JSON.stringify(currentDb.fields)
    ) {
      return;
    }

    this.formInitialValue = {
      ...this.formInitialValue,
      ...rawModel,
      db
    };

    if (db.databaseName !== currentDb.databaseName) {
      this.formInitialValue = {
        ...this.formInitialValue,
        db: {
          ...db,
          collectionName: '',
          fields: []
        }
      };
      this.prepareDbOptions({
        ...db,
        collectionName: '',
        fields: []
      });
      return;
    }

    if (db.collectionName !== currentDb.collectionName) {
      this.formInitialValue = {
        ...this.formInitialValue,
        db: {
          ...db,
          fields: []
        }
      };
      this.prepareFieldOptions(db.databaseName, db.collectionName, []);
    }
  }

  onSubmitForm(rawModel: Record<string, unknown>): void {
    if (this.loading) {
      return;
    }

    const type = (rawModel['type'] as McpToolType) ?? 'endpoint';
    const payload: McpToolUpsertPayload = {
      category: (rawModel['category'] as McpToolCategory) ?? 'custom',
      name: String(rawModel['name'] ?? '').trim(),
      type,
      enabled: Boolean(rawModel['enabled']),
      description: String(rawModel['description'] ?? '').trim(),
      tags: this.normalizeTags(rawModel['tags']),
      endpoint: type === 'endpoint' ? this.normalizeEndpoint(rawModel['endpoint']) : undefined,
      db: type === 'db' ? this.normalizeDb(rawModel['db']) : undefined
    };

    const request$ = this.toolId ? this.service.update(this.toolId, payload) : this.service.create(payload);
    this.loading = true;
    this.loadingService
      .track(request$)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.toastService.info(this.i18nService.t(this.toolId ? 'mcpTool.updateSuccess' : 'mcpTool.createSuccess'));
          void this.router.navigate(['/admin/mcp-tool-config/tool']);
        },
        error: () => {
          this.toastService.error(this.i18nService.t(this.toolId ? 'mcpTool.updateError' : 'mcpTool.createError'));
        }
      });
  }

  backToView(): void {
    void this.router.navigate(['/admin/mcp-tool-config/tool']);
  }

  ngOnDestroy(): void {
    this.detailSub?.unsubscribe();
  }

  private loadDatabases(): void {
    this.loading = true;
    this.loadingService
      .track(this.service.getDatabases())
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (databases) => {
          this.databaseOptions = databases.map((item) => ({ label: item, value: item }));
          this.formContext = {
            ...this.formContext,
            extra: {
              databaseOptions: this.databaseOptions,
              collectionOptions: [],
              fieldOptions: []
            }
          };
          this.bindRouteMode();
        },
        error: () => {
          this.toastService.error(this.i18nService.t('mcpTool.loadDatabasesError'));
          this.formContext = {
            ...this.formContext,
            extra: {
              databaseOptions: [],
              collectionOptions: [],
              fieldOptions: []
            }
          };
          this.bindRouteMode();
        }
      });
  }

  private bindRouteMode(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) {
        this.toolId = null;
        this.formContext = {
          ...this.formContext,
          mode: 'create'
        };
        this.formInitialValue = this.createInitialValue();
        this.rerenderForm();
        return;
      }

      this.toolId = id;
      this.formContext = {
        ...this.formContext,
        mode: 'edit'
      };
      this.bindDetail(id);
    });
  }

  private bindDetail(id: string): void {
    this.detailSub?.unsubscribe();
    this.loading = true;
    this.detailSub = this.loadingService
      .track(this.service.getById(id))
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (tool) => {
          this.formInitialValue = this.mapToInitialValue(tool);
          this.prepareDbOptions(this.normalizeDb(this.formInitialValue['db']));
        },
        error: () => {
          this.toastService.error(this.i18nService.t('mcpTool.loadDetailError'));
          this.backToView();
        }
      });
  }

  private rerenderForm(): void {
    this.formVisible.set(false);
    queueMicrotask(() => this.formVisible.set(true));
  }

  private mapToInitialValue(tool: McpToolConfig): Record<string, unknown> {
    return {
      category: tool.category,
      name: tool.name,
      type: tool.type,
      enabled: tool.enabled,
      description: tool.description,
      tags: [...tool.tags],
      endpoint: {
        method: tool.endpoint?.method ?? 'GET',
        url: tool.endpoint?.url ?? '',
        params: { ...(tool.endpoint?.params ?? {}) },
        headers: { ...(tool.endpoint?.headers ?? {}) },
        body: tool.endpoint?.body ?? ''
      },
      db: {
        queryType: tool.db?.queryType ?? 'select',
        databaseName: tool.db?.databaseName ?? '',
        collectionName: tool.db?.collectionName ?? '',
        fields: [...(tool.db?.fields ?? [])],
        condition: tool.db?.condition ?? ''
      }
    };
  }

  private normalizeTags(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item) => String(item).trim())
      .filter(Boolean)
      .filter((item, index, items) => items.indexOf(item) === index);
  }

  private normalizeEndpoint(value: unknown): McpEndpointConfig {
    const record = value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

    return {
      method: (record['method'] as McpEndpointMethod) ?? 'GET',
      url: String(record['url'] ?? '').trim(),
      params: this.normalizeRecord(record['params']),
      headers: this.normalizeRecord(record['headers']),
      body: String(record['body'] ?? '').trim()
    };
  }

  private normalizeDb(value: unknown): McpDbConfig {
    const record = value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

    return {
      queryType: (record['queryType'] as McpDbQueryType) ?? 'select',
      databaseName: String(record['databaseName'] ?? '').trim(),
      collectionName: String(record['collectionName'] ?? '').trim(),
      fields: this.normalizeTags(record['fields']),
      condition: String(record['condition'] ?? '').trim()
    };
  }

  private normalizeRecord(value: unknown): Record<string, string> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }

    return Object.entries(value as Record<string, unknown>).reduce<Record<string, string>>((acc, [key, item]) => {
      const normalizedKey = key.trim();
      if (!normalizedKey) {
        return acc;
      }

      acc[normalizedKey] = String(item ?? '').trim();
      return acc;
    }, {});
  }

  private createInitialValue(): Record<string, unknown> {
    return {
      category: 'jira',
      name: '',
      type: 'endpoint',
      enabled: true,
      description: '',
      tags: ['search'],
      endpoint: {
        method: 'GET',
        url: '',
        params: {},
        headers: {},
        body: ''
      },
      db: {
        queryType: 'select',
        databaseName: '',
        collectionName: '',
        fields: [],
        condition: ''
      }
    };
  }

  private prepareDbOptions(db: McpDbConfig): void {
    this.formContext = {
      ...this.formContext,
      extra: {
        ...this.formContext.extra,
        databaseOptions: this.databaseOptions,
        collectionOptions: [],
        fieldOptions: []
      }
    };

    if (!db.databaseName) {
      this.rerenderForm();
      return;
    }

    this.loading = true;
    this.loadingService
      .track(this.service.getCollections(db.databaseName))
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (collections) => {
          this.formContext = {
            ...this.formContext,
            extra: {
              ...this.formContext.extra,
              databaseOptions: this.databaseOptions,
              collectionOptions: collections.map((item) => ({ label: item, value: item })),
              fieldOptions: []
            }
          };

          if (!db.collectionName) {
            this.rerenderForm();
            return;
          }

          this.prepareFieldOptions(db.databaseName, db.collectionName, db.fields);
        },
        error: () => {
          this.toastService.error(this.i18nService.t('mcpTool.loadCollectionsError'));
          this.rerenderForm();
        }
      });
  }

  private prepareFieldOptions(databaseName: string, collectionName: string, selectedFields: string[]): void {
    const cacheKey = `${databaseName}.${collectionName}`;
    const cached = this.collectionFieldMap.get(cacheKey);
    if (cached) {
      this.applyFieldOptions(cached, selectedFields);
      return;
    }

    this.loading = true;
    this.loadingService
      .track(this.service.getFields(databaseName, collectionName))
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (fields) => {
          this.collectionFieldMap.set(cacheKey, fields);
          this.applyFieldOptions(fields, selectedFields);
        },
        error: () => {
          this.toastService.error(this.i18nService.t('mcpTool.loadFieldsError'));
          this.rerenderForm();
        }
      });
  }

  private applyFieldOptions(fields: McpCollectionField[], selectedFields: string[]): void {
    const allowed = new Set(fields.map((field) => field.fieldName));
    const db = this.normalizeDb(this.formInitialValue['db']);

    this.formInitialValue = {
      ...this.formInitialValue,
      db: {
        ...db,
        fields: selectedFields.filter((item) => allowed.has(item))
      }
    };

    this.formContext = {
      ...this.formContext,
      extra: {
        ...this.formContext.extra,
        fieldOptions: fields.map((field) => ({
          label: `${field.fieldName} (${field.dataTypes.join(', ')})`,
          value: field.fieldName
        }))
      }
    };

    this.rerenderForm();
  }
}
