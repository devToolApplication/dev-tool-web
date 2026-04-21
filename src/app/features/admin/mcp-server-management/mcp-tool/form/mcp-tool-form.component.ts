import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import {
  McpCategoryResponse,
  McpDbConfig,
  McpEndpointConfig,
  McpEndpointMethod,
  McpMetadataEntry,
  McpToolCreateDto,
  McpToolDefinition,
  McpToolResponse,
  McpToolType,
  McpToolUpdateDto
} from '../../../../../core/models/mcp-server/mcp-tool.model';
import { SYSTEM_STATUS_OPTIONS } from '../../../../../core/constants/system.constants';
import { McpCategoryService } from '../../../../../core/services/ai-agent-service/mcp-category.service';
import { McpToolService } from '../../../../../core/services/ai-agent-service/mcp-tool.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { FormConfig, FormContext } from '../../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../../shared/ui/form-input/utils/validation-rules';
import { MCP_TOOL_CONFIG_ROUTES, MCP_TOOL_INITIAL_VALUE } from '../../mcp-server.constants';

interface McpToolFormValue extends McpToolCreateDto {
  toolParametersText: string;
}

@Component({
  selector: 'app-mcp-tool-form',
  standalone: false,
  templateUrl: './mcp-tool-form.component.html',
  styleUrl: './mcp-tool-form.component.css'
})
export class McpToolFormComponent implements OnInit, OnDestroy {
  private readonly defaultCategoryCode = 'custom';

  formContext: FormContext = {
    user: null,
    mode: 'create',
    extra: {
      categoryOptions: [],
      databaseOptions: [],
      collectionOptions: []
    }
  };

  readonly formConfig: FormConfig = {
    fields: [
      {
        type: 'select',
        name: 'category',
        label: 'category',
        width: '1/2',
        optionsExpression: 'context.extra?.categoryOptions || []',
        validation: [Rules.required('mcpTool.categoryRequired')]
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
        validation: [Rules.required('mcpTool.typeRequired')]
      },
      { type: 'text', name: 'code', label: 'Code', width: '1/2' },
      { type: 'text', name: 'name', label: 'mcpTool.functionName', width: '1/2', validation: [Rules.required('mcpTool.nameRequired')] },
      { type: 'select', name: 'status', label: 'Status', width: '1/2', options: [...SYSTEM_STATUS_OPTIONS] },
      { type: 'checkbox', name: 'enabled', label: 'enabled', width: '1/2' },
      { type: 'textarea', name: 'description', label: 'mcpTool.functionDescription', width: 'full' },
      {
        type: 'textarea',
        name: 'toolParametersText',
        label: 'mcpTool.parametersSchema',
        width: 'full',
        contentType: 'json',
        rows: 10,
        showZoomButton: true,
        helpText: 'mcpTool.parametersSchemaHint'
      },
      {
        type: 'input-multi',
        name: 'tags',
        label: 'mcpTool.tags',
        width: 'full',
        options: [
          { label: 'search', value: 'search' },
          { label: 'jira', value: 'jira' },
          { label: 'create-task', value: 'create-task' },
          { label: 'github', value: 'github' },
          { label: 'db', value: 'db' },
          { label: 'elasticsearch', value: 'elasticsearch' },
          { label: 'bulk', value: 'bulk' },
          { label: 'indices', value: 'indices' },
          { label: 'analytics', value: 'analytics' },
          { label: 'code', value: 'code' },
          { label: 'notification', value: 'notification' }
        ],
        placeholder: 'mcpTool.tagPlaceholder',
        helpText: 'mcpTool.tagsHint',
        validation: [Rules.requiredArray('mcpTool.tagsRequired')]
      },
      {
        type: 'group',
        name: 'endpoint',
        label: 'mcpTool.endpointConfig',
        width: 'full',
        rules: { visible: 'model.type === "endpoint"' },
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
            validation: [Rules.required('mcpTool.methodRequired')]
          },
          { type: 'text', name: 'url', label: 'mcpTool.url', width: 'full', validation: [Rules.required('mcpTool.urlRequired')] },
          { type: 'record', name: 'params', label: 'mcpTool.params', keyLabel: 'key', valueLabel: 'value', addButtonLabel: 'addRow', width: 'full' },
          {
            type: 'secret-metadata',
            name: 'headers',
            label: 'mcpTool.headers',
            width: 'full',
            service: 'ai-agent-mcrs',
            addButtonLabel: 'mcpTool.addHeader',
            keyPlaceholder: 'mcpTool.headerNamePlaceholder',
            valuePlaceholder: 'mcpTool.headerValuePlaceholder',
            secretPlaceholder: 'mcpTool.headerSecretPlaceholder'
          },
          {
            type: 'textarea',
            name: 'body',
            label: 'mcpTool.body',
            width: 'full',
            rows: 12,
            maxRows: 20,
            showZoomButton: true,
            helpText: 'mcpTool.bodyHint'
          }
        ]
      },
      {
        type: 'group',
        name: 'db',
        label: 'mcpTool.dbConfig',
        width: 'full',
        rules: { visible: 'model.type === "db"' },
        children: [
          {
            type: 'select',
            name: 'databaseName',
            label: 'mcpTool.database',
            width: '1/2',
            optionsExpression: 'context.extra?.databaseOptions || []',
            validation: [Rules.required('mcpTool.databaseRequired')]
          },
          {
            type: 'select',
            name: 'collectionName',
            label: 'mcpTool.collection',
            width: '1/2',
            optionsExpression: 'context.extra?.collectionOptions || []',
            validation: [Rules.required('mcpTool.collectionRequired')]
          },
          {
            type: 'textarea',
            name: 'mongodbQuery',
            label: 'mcpTool.mongodbQuery',
            width: 'full',
            contentType: 'json',
            rows: 12,
            showZoomButton: true,
            helpText: 'mcpTool.mongodbQueryHint',
            validation: [Rules.required('mcpTool.mongodbQueryRequired')]
          }
        ]
      }
    ]
  };

  toolId: string | null = null;
  formInitialValue: McpToolFormValue = this.createInitialValue();
  submitting = false;
  loading = false;
  private currentModel: McpToolFormValue = this.createInitialValue();
  private detailSub?: Subscription;
  private routeParamSub?: Subscription;
  private categories: McpCategoryResponse[] = [];
  private databaseOptions: { label: string; value: string }[] = [];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly toolService: McpToolService,
    private readonly categoryService: McpCategoryService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly i18nService: I18nService
  ) {}

  ngOnInit(): void {
    this.toolId = this.route.snapshot.paramMap.get('id');
    this.formContext = { ...this.formContext, mode: this.toolId ? 'edit' : 'create' };
    this.currentModel = { ...this.formInitialValue };
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.detailSub?.unsubscribe();
    this.routeParamSub?.unsubscribe();
  }

  onFormValueChange(rawModel: Record<string, unknown>): void {
    const nextModel = rawModel as unknown as McpToolFormValue;
    const previousModel = this.currentModel;
    this.currentModel = nextModel;

    if ((nextModel.type ?? 'endpoint') !== 'db') {
      return;
    }

    const previousDb = this.normalizeDb(previousModel.db);
    const nextDb = this.normalizeDb(nextModel.db);
    if (nextDb.databaseName !== previousDb.databaseName) {
      this.prepareDbOptions({ ...nextDb, collectionName: '' });
    }
  }

  onSubmitForm(model: McpToolFormValue): void {
    if (this.submitting) {
      return;
    }

    const type = model.type ?? 'endpoint';
    const toolDefinition = this.buildToolDefinition(model);
    if ((model.toolParametersText?.trim() || '') !== '' && toolDefinition === null) {
      return;
    }

    const payload: McpToolCreateDto = {
      code: (model.code || '').trim(),
      category: model.category ?? this.categories[0]?.code ?? this.defaultCategoryCode,
      name: (model.name || '').trim(),
      type,
      enabled: model.enabled ?? true,
      description: (model.description || '').trim(),
      tags: this.normalizeTags(model.tags),
      endpoint: type === 'endpoint' ? this.normalizeEndpoint(model.endpoint) : undefined,
      db: type === 'db' ? this.normalizeDb(model.db) : undefined,
      tool: toolDefinition ?? undefined,
      status: model.status ?? 'ACTIVE'
    };

    const request$ = this.toolId ? this.toolService.update(this.toolId, payload as McpToolUpdateDto) : this.toolService.create(payload);
    this.submitting = true;
    this.loadingService.track(request$).pipe(finalize(() => (this.submitting = false))).subscribe({
      next: () => {
        this.toastService.info(this.i18nService.t(this.toolId ? 'mcpTool.updateSuccess' : 'mcpTool.createSuccess'));
        void this.router.navigate([MCP_TOOL_CONFIG_ROUTES.toolList]);
      },
      error: () => this.toastService.error(this.i18nService.t(this.toolId ? 'mcpTool.updateError' : 'mcpTool.createError'))
    });
  }

  private loadCategories(): void {
    this.loading = true;
    this.loadingService.track(this.categoryService.getAll()).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (categories) => {
        this.categories = categories;
        this.applyCategoryOptions();
        this.loadDatabases();
      },
      error: () => {
        this.categories = [];
        this.applyCategoryOptions();
        this.toastService.error(this.i18nService.t('mcpCategory.loadListError'));
        this.loadDatabases();
      }
    });
  }

  private loadDatabases(): void {
    this.loading = true;
    this.loadingService.track(this.toolService.getDatabases()).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (databases) => {
        this.databaseOptions = databases.map((item) => ({ label: item, value: item }));
        this.formContext = {
          ...this.formContext,
          extra: {
            ...this.formContext.extra,
            databaseOptions: this.databaseOptions,
            collectionOptions: []
          }
        };
        this.bindRouteMode();
      },
      error: () => {
        this.toastService.error(this.i18nService.t('mcpTool.loadDatabasesError'));
        this.formContext = {
          ...this.formContext,
          extra: {
            ...this.formContext.extra,
            databaseOptions: [],
            collectionOptions: []
          }
        };
        this.bindRouteMode();
      }
    });
  }

  private bindRouteMode(): void {
    this.applyRouteMode(this.toolId);
    this.routeParamSub?.unsubscribe();
    this.routeParamSub = this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id === this.toolId) {
        return;
      }
      this.applyRouteMode(id);
    });
  }

  private applyRouteMode(id: string | null): void {
    if (!id) {
      this.toolId = null;
      this.formContext = { ...this.formContext, mode: 'create' };
      this.formInitialValue = this.createInitialValue();
      this.currentModel = { ...this.formInitialValue };
      this.applyCategoryOptions();
      return;
    }

    this.toolId = id;
    this.formContext = { ...this.formContext, mode: 'edit' };
    this.bindDetail(id);
  }

  private bindDetail(id: string): void {
    this.detailSub?.unsubscribe();
    this.loading = true;
    this.detailSub = this.loadingService.track(this.toolService.getById(id)).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (tool) => {
        this.formInitialValue = this.mapToInitialValue(tool);
        this.currentModel = { ...this.formInitialValue };
        this.applyCategoryOptions();
        this.prepareDbOptions(this.normalizeDb(this.formInitialValue.db));
      },
      error: () => {
        this.toastService.error(this.i18nService.t('mcpTool.loadDetailError'));
        void this.router.navigate([MCP_TOOL_CONFIG_ROUTES.toolList]);
      }
    });
  }

  private mapToInitialValue(tool: McpToolResponse): McpToolFormValue {
    return {
      code: tool.code ?? '',
      category: tool.category,
      name: tool.name,
      type: tool.type,
      enabled: tool.enabled,
      description: tool.description,
      tool: tool.tool,
      toolParametersText: this.stringifyToolParameters(tool.tool),
      tags: [...(tool.tags ?? [])],
      endpoint: {
        method: tool.endpoint?.method ?? 'GET',
        url: tool.endpoint?.url ?? '',
        params: { ...(tool.endpoint?.params ?? {}) },
        headers: this.normalizeHeaderEntries(tool.endpoint?.headers),
        body: tool.endpoint?.body ?? ''
      },
      db: this.mapDbResponseToForm(tool.db),
      status: tool.status ?? 'ACTIVE'
    };
  }

  private applyCategoryOptions(): void {
    const categoryOptions = this.categories.map((item) => ({ label: item.name || item.code, value: item.code }));
    this.formContext = { ...this.formContext, extra: { ...this.formContext.extra, categoryOptions } };

    if (categoryOptions.length === 0) {
      return;
    }

    const hasSelectedCategory = categoryOptions.some((item) => item.value === this.formInitialValue.category);
    if (!hasSelectedCategory) {
      const fallbackCategory = categoryOptions[0].value;
      this.formInitialValue = { ...this.formInitialValue, category: fallbackCategory };
      this.currentModel = { ...this.currentModel, category: fallbackCategory };
    }
  }

  private prepareDbOptions(db: McpDbConfig): void {
    this.formContext = {
      ...this.formContext,
      extra: {
        ...this.formContext.extra,
        databaseOptions: this.databaseOptions,
        collectionOptions: []
      }
    };

    if (!db.databaseName) {
      return;
    }

    this.loading = true;
    this.loadingService.track(this.toolService.getCollections(db.databaseName)).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (collections) => {
        this.formContext = {
          ...this.formContext,
          extra: {
            ...this.formContext.extra,
            databaseOptions: this.databaseOptions,
            collectionOptions: collections.map((item) => ({ label: item, value: item }))
          }
        };
      },
      error: () => this.toastService.error(this.i18nService.t('mcpTool.loadCollectionsError'))
    });
  }

  private buildToolDefinition(model: McpToolFormValue): McpToolDefinition | null | undefined {
    const normalized = model.toolParametersText?.trim() || '';
    if (!normalized) {
      return undefined;
    }

    try {
      const parameters = JSON.parse(normalized);
      if (!parameters || typeof parameters !== 'object' || Array.isArray(parameters)) {
        this.toastService.error(this.i18nService.t('mcpTool.parametersSchemaInvalid'));
        return null;
      }
      return {
        type: 'function',
        function: {
          name: (model.name || '').trim(),
          description: (model.description || '').trim(),
          parameters
        }
      };
    } catch {
      this.toastService.error(this.i18nService.t('mcpTool.parametersSchemaInvalid'));
      return null;
    }
  }

  private stringifyToolParameters(tool?: McpToolDefinition): string {
    const parameters = tool?.function?.parameters;
    if (!parameters || typeof parameters !== 'object' || Array.isArray(parameters) || Object.keys(parameters).length === 0) {
      return '';
    }
    return JSON.stringify(parameters, null, 2);
  }

  private normalizeEndpoint(value: unknown): McpEndpointConfig {
    const record = value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
    return {
      method: (record['method'] as McpEndpointMethod) ?? 'GET',
      url: String(record['url'] ?? '').trim(),
      params: this.normalizeRecord(record['params']),
      headers: this.normalizeHeaderEntries(record['headers']),
      body: String(record['body'] ?? '')
    };
  }

  private normalizeDb(value: unknown): McpDbConfig {
    const record = value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
    return {
      databaseName: String(record['databaseName'] ?? '').trim(),
      collectionName: String(record['collectionName'] ?? '').trim(),
      mongodbQuery: String(record['mongodbQuery'] ?? '').trim()
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

  private normalizeHeaderEntries(value: unknown): McpMetadataEntry[] {
    if (Array.isArray(value)) {
      return this.normalizeMetadataEntries(value);
    }

    if (!value || typeof value !== 'object') {
      return [];
    }

    return Object.entries(value as Record<string, unknown>).reduce<McpMetadataEntry[]>((acc, [key, item]) => {
      const normalizedKey = key.trim();
      if (!normalizedKey) {
        return acc;
      }
      acc.push({
        key: normalizedKey,
        type: 'CONFIG',
        value: String(item ?? '').trim()
      });
      return acc;
    }, []);
  }

  private normalizeMetadataEntries(value: unknown): McpMetadataEntry[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.reduce<McpMetadataEntry[]>((acc, item) => {
      const record = item && typeof item === 'object' && !Array.isArray(item) ? (item as Record<string, unknown>) : {};
      const key = String(record['key'] ?? '').trim();
      const metadataValue = String(record['value'] ?? '').trim();
      if (!key || !metadataValue) {
        return acc;
      }

      acc.push({
        key,
        type: record['type'] === 'SECRET' ? 'SECRET' : 'CONFIG',
        value: metadataValue
      });
      return acc;
    }, []);
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

  private createInitialValue(): McpToolFormValue {
    return {
      ...(MCP_TOOL_INITIAL_VALUE as McpToolFormValue),
      category: this.defaultCategoryCode,
      toolParametersText: ''
    };
  }

  private mapDbResponseToForm(db?: McpDbConfig): McpDbConfig {
    const raw = db as unknown as Record<string, unknown> | undefined;
    const mongodbQuery = db?.mongodbQuery?.trim() || this.buildLegacyMongoQuery(raw);
    return {
      databaseName: db?.databaseName ?? '',
      collectionName: db?.collectionName ?? '',
      mongodbQuery: mongodbQuery || '{}'
    };
  }

  private buildLegacyMongoQuery(db?: Record<string, unknown>): string {
    if (!db || typeof db !== 'object') {
      return '';
    }

    const query: Record<string, unknown> = {};
    const condition = String(db['condition'] ?? '').trim();
    if (condition) {
      try {
        query['filter'] = JSON.parse(condition);
      } catch {
        query['filter'] = {};
      }
    } else {
      query['filter'] = {};
    }

    const fields = Array.isArray(db['fields'])
      ? (db['fields'] as unknown[])
          .map((item) => String(item ?? '').trim())
          .filter(Boolean)
      : [];
    if (fields.length > 0) {
      query['projection'] = fields.reduce<Record<string, number>>((acc, field) => {
        acc[field] = 1;
        return acc;
      }, {});
    }

    return JSON.stringify(query, null, 2);
  }
}
