import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import {
  McpCategoryResponse,
  McpCollectionField,
  McpDbConfig,
  McpDbMatchMode,
  McpDbQueryRule,
  McpDbRuleOperator,
  McpEndpointConfig,
  McpEndpointMethod,
  McpToolCreateDto,
  McpToolDefinition,
  McpToolResponse,
  McpToolType,
  McpToolUpdateDto,
  ToolExecutorType
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

interface McpToolFormValue extends Omit<McpToolCreateDto, 'db'> {
  db?: McpDbConfig;
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
  private readonly operatorOptions = [
    { label: 'Equals', value: 'eq' },
    { label: 'Not Equals', value: 'ne' },
    { label: 'Greater Than', value: 'gt' },
    { label: 'Greater Than or Equal', value: 'gte' },
    { label: 'Less Than', value: 'lt' },
    { label: 'Less Than or Equal', value: 'lte' },
    { label: 'In', value: 'in' },
    { label: 'Not In', value: 'nin' },
    { label: 'Regex', value: 'regex' },
    { label: 'Exists', value: 'exists' }
  ];

  formContext: FormContext = {
    user: null,
    mode: 'create',
    extra: {
      categoryOptions: [],
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
      {
        type: 'select',
        name: 'executorType',
        label: 'Executor Type',
        width: '1/2',
        options: [
          { label: 'HTTP', value: 'HTTP' },
          { label: 'DB', value: 'DB' },
          { label: 'JAVA_BEAN', value: 'JAVA_BEAN' },
          { label: 'WORKFLOW', value: 'WORKFLOW' },
          { label: 'SCRIPT', value: 'SCRIPT' }
        ]
      },
      { type: 'text', name: 'executorRef', label: 'Executor Ref', width: '1/2' },
      { type: 'text', name: 'authType', label: 'Auth Type', width: '1/2', placeholder: 'BEARER / API_KEY / NONE' },
      { type: 'text', name: 'secretKeyRef', label: 'Secret Ref', width: '1/2' },
      { type: 'number', name: 'timeoutMs', label: 'Timeout (ms)', width: '1/2' },
      { type: 'select', name: 'status', label: 'Status', width: '1/2', options: [...SYSTEM_STATUS_OPTIONS] },
      { type: 'checkbox', name: 'enabled', label: 'enabled', width: '1/2' },
      { type: 'textarea', name: 'description', label: 'mcpTool.functionDescription', width: 'full' },
      {
        type: 'textarea',
        name: 'toolParametersText',
        label: 'mcpTool.parametersSchema',
        width: 'full',
        rows: 10,
        showZoomButton: true,
        helpText: 'mcpTool.parametersSchemaHint',
        rules: { visible: 'model.type === "endpoint"' }
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
          { type: 'record', name: 'headers', label: 'mcpTool.headers', keyLabel: 'key', valueLabel: 'value', addButtonLabel: 'addRow', width: 'full' },
          { type: 'textarea', name: 'body', label: 'mcpTool.body', width: 'full', showZoomButton: true }
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
            name: 'queryType',
            label: 'mcpTool.queryType',
            width: '1/3',
            options: [{ label: 'mcpTool.selectQuery', value: 'select' }],
            validation: [Rules.required('mcpTool.queryTypeRequired')]
          },
          {
            type: 'select',
            name: 'databaseName',
            label: 'mcpTool.database',
            width: '1/3',
            optionsExpression: 'context.extra?.databaseOptions || []',
            validation: [Rules.required('mcpTool.databaseRequired')]
          },
          {
            type: 'select',
            name: 'collectionName',
            label: 'mcpTool.collection',
            width: '1/3',
            optionsExpression: 'context.extra?.collectionOptions || []',
            validation: [Rules.required('mcpTool.collectionRequired')]
          },
          { type: 'select-multi', name: 'fields', label: 'mcpTool.fields', width: 'full', optionsExpression: 'context.extra?.fieldOptions || []' },
          {
            type: 'select',
            name: 'matchMode',
            label: 'Match Mode',
            width: '1/3',
            options: [
              { label: 'All Rules', value: 'and' },
              { label: 'Any Rule', value: 'or' }
            ]
          },
          {
            type: 'array',
            name: 'rules',
            label: 'Query Rules',
            width: 'full',
            itemConfig: [
              { type: 'select', name: 'field', label: 'Field', width: '1/3', optionsExpression: 'context.extra?.fieldOptions || []' },
              { type: 'select', name: 'operator', label: 'Operator', width: '1/3', options: this.operatorOptions },
              { type: 'text', name: 'argumentName', label: 'Argument Name', width: '1/6', placeholder: 'code / userId / sessionId' },
              { type: 'text', name: 'value', label: 'Static Value', width: '1/6', placeholder: 'Fallback or fixed value' }
            ]
          },
          {
            type: 'textarea',
            name: 'condition',
            label: 'Raw Condition JSON',
            width: 'full',
            rows: 8,
            showZoomButton: true,
            helpText: 'Optional advanced override. Runtime uses simple rules first, then falls back to this condition.'
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
  private categories: McpCategoryResponse[] = [];
  private databaseOptions: { label: string; value: string }[] = [];
  private readonly collectionFieldMap = new Map<string, McpCollectionField[]>();

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
      this.prepareDbOptions({ ...nextDb, collectionName: '', fields: [], rules: [] });
      return;
    }

    if (nextDb.collectionName !== previousDb.collectionName) {
      this.prepareFieldOptions(nextDb.databaseName, nextDb.collectionName, nextDb.rules ?? []);
    }
  }

  onSubmitForm(model: McpToolFormValue): void {
    if (this.submitting) {
      return;
    }

    const type = model.type ?? 'endpoint';
    const toolDefinition = this.buildToolDefinition(model);
    if ((type === 'endpoint' || (model.toolParametersText?.trim() || '') !== '') && toolDefinition === null) {
      return;
    }

    const payload: McpToolCreateDto = {
      code: (model.code || '').trim(),
      category: model.category ?? this.categories[0]?.code ?? this.defaultCategoryCode,
      name: (model.name || '').trim(),
      type,
      executorType: (model.executorType as ToolExecutorType | undefined) ?? (type === 'db' ? 'DB' : 'HTTP'),
      executorRef: (model.executorRef || '').trim(),
      endpointUrl: type === 'endpoint' ? ((model.endpoint?.url || model.endpointUrl || '').trim()) : undefined,
      authType: (model.authType || '').trim(),
      secretKeyRef: (model.secretKeyRef || '').trim(),
      timeoutMs: model.timeoutMs ?? 10000,
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
            ...this.formContext.extra,
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
    this.applyRouteMode(this.toolId);
    this.route.paramMap.subscribe((params) => {
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
    const db = this.mapDbResponseToForm(tool.db);
    return {
      code: tool.code ?? '',
      category: tool.category,
      name: tool.name,
      type: tool.type,
      executorType: tool.executorType ?? (tool.type === 'db' ? 'DB' : 'HTTP'),
      executorRef: tool.executorRef ?? '',
      endpointUrl: tool.endpointUrl ?? tool.endpoint?.url ?? '',
      authType: tool.authType ?? '',
      secretKeyRef: tool.secretKeyRef ?? '',
      timeoutMs: tool.timeoutMs ?? 10000,
      enabled: tool.enabled,
      description: tool.description,
      tool: tool.tool,
      toolParametersText: this.stringifyToolParameters(tool.tool),
      tags: [...(tool.tags ?? [])],
      endpoint: {
        method: tool.endpoint?.method ?? 'GET',
        url: tool.endpoint?.url ?? '',
        params: { ...(tool.endpoint?.params ?? {}) },
        headers: { ...(tool.endpoint?.headers ?? {}) },
        body: tool.endpoint?.body ?? ''
      },
      db,
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
        collectionOptions: [],
        fieldOptions: []
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
            collectionOptions: collections.map((item) => ({ label: item, value: item })),
            fieldOptions: []
          }
        };

        if (!db.collectionName) {
          return;
        }

        this.prepareFieldOptions(db.databaseName, db.collectionName, db.rules ?? []);
      },
      error: () => this.toastService.error(this.i18nService.t('mcpTool.loadCollectionsError'))
    });
  }

  private prepareFieldOptions(databaseName: string, collectionName: string, rules: McpDbQueryRule[]): void {
    if (!databaseName || !collectionName) {
      return;
    }

    const cacheKey = `${databaseName}.${collectionName}`;
    const cached = this.collectionFieldMap.get(cacheKey);
    if (cached) {
      this.applyFieldOptions(cached, rules);
      return;
    }

    this.loading = true;
    this.loadingService.track(this.toolService.getFields(databaseName, collectionName)).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (fields) => {
        this.collectionFieldMap.set(cacheKey, fields);
        this.applyFieldOptions(fields, rules);
      },
      error: () => this.toastService.error(this.i18nService.t('mcpTool.loadFieldsError'))
    });
  }

  private applyFieldOptions(fields: McpCollectionField[], rules: McpDbQueryRule[]): void {
    const fieldOptions = fields.map((field) => ({ label: `${field.fieldName} (${field.dataTypes.join(', ')})`, value: field.fieldName }));
    const allowed = new Set(fieldOptions.map((item) => item.value));
    const db = this.normalizeDb(this.currentModel.db);
    const filteredRules = rules.filter((rule) => allowed.has(rule.field));

    this.formContext = {
      ...this.formContext,
      extra: {
        ...this.formContext.extra,
        fieldOptions
      }
    };

    this.currentModel = {
      ...this.currentModel,
      db: {
        ...db,
        rules: filteredRules.length > 0 ? filteredRules : db.rules ?? []
      }
    };
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
      headers: this.normalizeRecord(record['headers']),
      body: String(record['body'] ?? '').trim()
    };
  }

  private normalizeDb(value: unknown): McpDbConfig {
    const record = value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
    return {
      queryType: 'select',
      databaseName: String(record['databaseName'] ?? '').trim(),
      collectionName: String(record['collectionName'] ?? '').trim(),
      fields: this.normalizeTags(record['fields']),
      matchMode: record['matchMode'] === 'or' ? 'or' : 'and',
      rules: this.normalizeQueryRules(record['rules']),
      condition: String(record['condition'] ?? '').trim()
    };
  }

  private normalizeQueryRules(value: unknown): McpDbQueryRule[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((rule) => this.normalizeQueryRule(rule))
      .filter((rule): rule is McpDbQueryRule => !!rule);
  }

  private normalizeQueryRule(value: unknown): McpDbQueryRule | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }

    const record = value as Record<string, unknown>;
    const field = String(record['field'] ?? '').trim();
    if (!field) {
      return null;
    }

    return {
      field,
      operator: this.normalizeOperator(record['operator']),
      argumentName: String(record['argumentName'] ?? '').trim(),
      value: String(record['value'] ?? '').trim()
    };
  }

  private normalizeOperator(value: unknown): McpDbRuleOperator {
    switch (value) {
      case 'ne':
      case 'gt':
      case 'gte':
      case 'lt':
      case 'lte':
      case 'in':
      case 'nin':
      case 'regex':
      case 'exists':
        return value;
      default:
        return 'eq';
    }
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
      toolParametersText: '',
      db: {
        queryType: 'select',
        databaseName: '',
        collectionName: '',
        fields: [],
        matchMode: 'and',
        rules: [],
        condition: ''
      }
    };
  }

  private mapDbResponseToForm(db?: McpDbConfig): McpDbConfig {
    const parsed = this.parseLegacyCondition(db?.condition);
    return {
      queryType: 'select',
      databaseName: db?.databaseName ?? '',
      collectionName: db?.collectionName ?? '',
      fields: [...(db?.fields ?? [])],
      matchMode: db?.matchMode ?? parsed.matchMode,
      rules: db?.rules?.length ? db.rules : parsed.rules,
      condition: db?.condition ?? ''
    };
  }

  private parseLegacyCondition(rawCondition?: string): { matchMode: McpDbMatchMode; rules: McpDbQueryRule[] } {
    if (!rawCondition?.trim()) {
      return { matchMode: 'and', rules: [] };
    }

    try {
      const parsed = JSON.parse(rawCondition) as Record<string, unknown>;
      if (Array.isArray(parsed['$and'])) {
        return { matchMode: 'and', rules: this.parseSimpleClauses(parsed['$and']) };
      }
      if (Array.isArray(parsed['$or'])) {
        return { matchMode: 'or', rules: this.parseSimpleClauses(parsed['$or']) };
      }
      return { matchMode: 'and', rules: this.parseSimpleClauses([parsed]) };
    } catch {
      return { matchMode: 'and', rules: [] };
    }
  }

  private parseSimpleClauses(clauses: unknown[]): McpDbQueryRule[] {
    return clauses
      .map((clause) => this.parseSimpleClause(clause))
      .filter((rule): rule is McpDbQueryRule => !!rule);
  }

  private parseSimpleClause(clause: unknown): McpDbQueryRule | null {
    if (!clause || typeof clause !== 'object' || Array.isArray(clause)) {
      return null;
    }

    const record = clause as Record<string, unknown>;
    const entries = Object.entries(record);
    if (entries.length !== 1) {
      return null;
    }

    const [field, definition] = entries[0];
    if (!field || field.startsWith('$')) {
      return null;
    }

    if (definition && typeof definition === 'object' && !Array.isArray(definition)) {
      const operatorRecord = definition as Record<string, unknown>;
      const operatorEntry = Object.entries(operatorRecord).find(([key]) => key.startsWith('$') && key !== '$options');
      if (!operatorEntry) {
        return null;
      }

      const [mongoOperator, operatorValue] = operatorEntry;
      const operator = this.mapMongoOperator(mongoOperator);
      if (!operator) {
        return null;
      }

      const normalized = this.extractArgumentAndValue(operatorValue);
      return {
        field,
        operator,
        argumentName: normalized.argumentName,
        value: normalized.value
      };
    }

    const normalized = this.extractArgumentAndValue(definition);
    return {
      field,
      operator: 'eq',
      argumentName: normalized.argumentName,
      value: normalized.value
    };
  }

  private mapMongoOperator(operator: string): McpDbRuleOperator | null {
    switch (operator) {
      case '$ne': return 'ne';
      case '$gt': return 'gt';
      case '$gte': return 'gte';
      case '$lt': return 'lt';
      case '$lte': return 'lte';
      case '$in': return 'in';
      case '$nin': return 'nin';
      case '$regex': return 'regex';
      case '$exists': return 'exists';
      default: return null;
    }
  }

  private extractArgumentAndValue(value: unknown): { argumentName: string; value: string } {
    if (Array.isArray(value) && value.length === 1) {
      return this.extractArgumentAndValue(value[0]);
    }

    const normalized = String(value ?? '').trim();
    const placeholderMatch = normalized.match(/^\{\{\s*([^{}]+?)\s*\}\}$/);
    if (placeholderMatch) {
      return { argumentName: placeholderMatch[1].trim(), value: '' };
    }

    return {
      argumentName: '',
      value: Array.isArray(value) ? value.map((item) => String(item)).join(', ') : normalized
    };
  }
}
