import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import {
  McpCategoryResponse,
  McpCollectionField,
  McpDbConfig,
  McpDbQueryType,
  McpEndpointConfig,
  McpEndpointMethod,
  McpToolCreateDto,
  McpToolDefinition,
  McpToolResponse,
  McpToolType,
  McpToolUpdateDto
} from '../../../../../core/models/mcp-server/mcp-tool.model';
import { McpCategoryService } from '../../../../../core/services/ai-agent-service/mcp-category.service';
import { McpToolService } from '../../../../../core/services/ai-agent-service/mcp-tool.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { FormConfig, FormContext, TreeFieldConfig } from '../../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../../shared/ui/form-input/utils/validation-rules';
import { MCP_TOOL_CONFIG_ROUTES, MCP_TOOL_INITIAL_VALUE } from '../../mcp-server.constants';

type DbConditionLogic = 'and' | 'or';
type DbConditionOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'regex' | 'exists';

interface McpDbFormConfig extends McpDbConfig {
  queryTree?: DbConditionTreeForm;
}

interface McpToolFormValue extends Omit<McpToolCreateDto, 'db'> {
  db?: McpDbFormConfig;
  toolParametersText: string;
}

interface DbConditionTreeForm {
  logic: DbConditionLogic;
  rules: DbConditionRowNode[];
  children: Array<{ node: DbConditionTreeForm }>;
}

interface DbConditionRowNode {
  field: string;
  operator: DbConditionOperator;
  value: string;
}

@Component({
  selector: 'app-mcp-tool-form',
  standalone: false,
  templateUrl: './mcp-tool-form.component.html',
  styleUrl: './mcp-tool-form.component.css'
})
export class McpToolFormComponent implements OnInit, OnDestroy {
  private readonly defaultCategoryCode = 'custom';
  private readonly filterPlaceholderPattern = /^\{\{\s*([^{}]+?)\s*\}\}$/;
  private readonly conditionLogicOptions = [
    { label: 'mcpTool.conditionAnd', value: 'and' },
    { label: 'mcpTool.conditionOr', value: 'or' }
  ];
  private readonly conditionOperatorOptions = [
    { label: 'mcpTool.operator.eq', value: 'eq' },
    { label: 'mcpTool.operator.ne', value: 'ne' },
    { label: 'mcpTool.operator.gt', value: 'gt' },
    { label: 'mcpTool.operator.gte', value: 'gte' },
    { label: 'mcpTool.operator.lt', value: 'lt' },
    { label: 'mcpTool.operator.lte', value: 'lte' },
    { label: 'mcpTool.operator.in', value: 'in' },
    { label: 'mcpTool.operator.nin', value: 'nin' },
    { label: 'mcpTool.operator.regex', value: 'regex' },
    { label: 'mcpTool.operator.exists', value: 'exists' }
  ];

  formContext: FormContext = {
    user: null,
    mode: 'create',
    extra: {
      categoryOptions: [],
      databaseOptions: [],
      collectionOptions: [],
      fieldOptions: [],
      conditionFieldOptions: []
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
      {
        type: 'text',
        name: 'name',
        label: 'mcpTool.functionName',
        width: '1/2',
        validation: [Rules.required('mcpTool.nameRequired')]
      },
      { type: 'checkbox', name: 'enabled', label: 'enabled', width: '1/2' },
      { type: 'textarea', name: 'description', label: 'mcpTool.functionDescription', width: 'full' },
      {
        type: 'textarea',
        name: 'toolParametersText',
        label: 'mcpTool.parametersSchema',
        width: 'full',
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
          { type: 'text', name: 'url', label: 'mcpTool.url', width: '1/2', validation: [Rules.required('mcpTool.urlRequired')] },
          { type: 'record', name: 'params', label: 'mcpTool.params', keyLabel: 'key', valueLabel: 'value', addButtonLabel: 'addRow', width: '1/2' },
          { type: 'record', name: 'headers', label: 'mcpTool.headers', keyLabel: 'key', valueLabel: 'value', addButtonLabel: 'addRow', width: '1/2' },
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
            options: [
              { label: 'mcpTool.selectQuery', value: 'select' },
              { label: 'mcpTool.insertQuery', value: 'insert' },
              { label: 'mcpTool.updateQuery', value: 'update' },
              { label: 'mcpTool.deleteQuery', value: 'delete' }
            ],
            validation: [Rules.required('mcpTool.queryTypeRequired')]
          },
          { type: 'select', name: 'databaseName', label: 'mcpTool.database', width: '1/3', optionsExpression: 'context.extra?.databaseOptions || []', validation: [Rules.required('mcpTool.databaseRequired')] },
          { type: 'select', name: 'collectionName', label: 'mcpTool.collection', width: '1/3', optionsExpression: 'context.extra?.collectionOptions || []', validation: [Rules.required('mcpTool.collectionRequired')] },
          { type: 'select-multi', name: 'fields', label: 'mcpTool.fields', width: 'full', optionsExpression: 'context.extra?.fieldOptions || []' },
          this.buildQueryTreeField('queryTree', 'mcpTool.conditionBuilder', 'model.db && model.db.queryType !== "insert"')
        ]
      }
    ]
  };

  toolId: string | null = null;
  formInitialValue: McpToolFormValue = { ...(MCP_TOOL_INITIAL_VALUE as McpToolFormValue), toolParametersText: '' };
  submitting = false;
  loading = false;
  private currentModel: McpToolFormValue = { ...(MCP_TOOL_INITIAL_VALUE as McpToolFormValue), toolParametersText: '' };

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

  private buildQueryTreeField(name: string, label: string, visible?: string): TreeFieldConfig {
    return {
      type: 'tree',
      name,
      label,
      width: 'full',
      rules: visible ? { visible } : undefined,
      children: [
      {
        type: 'select',
        name: 'logic',
        label: 'mcpTool.conditionLogic',
        width: '1/3',
        options: this.conditionLogicOptions
      },
      {
        type: 'array',
        name: 'rules',
        label: 'mcpTool.condition',
        width: 'full',
        itemConfig: [
          {
            type: 'select',
            name: 'field',
            label: 'mcpTool.conditionField',
            width: '1/3',
            optionsExpression: 'context.extra?.conditionFieldOptions || []'
          },
          {
            type: 'select',
            name: 'operator',
            label: 'mcpTool.conditionOperator',
            width: '1/3',
            options: this.conditionOperatorOptions
          },
          {
            type: 'text',
            name: 'value',
            label: 'mcpTool.conditionValue',
            width: '1/3',
            placeholder: 'mcpTool.conditionValuePlaceholder',
            helpText: 'mcpTool.conditionValueHint'
          }
        ]
      },
      {
        type: 'array',
        name: 'children',
        label: 'mcpTool.conditionGroups',
        width: 'full',
        itemConfig: [
          {
            type: 'tree',
            name: 'node',
            label: 'mcpTool.conditionGroup'
          }
        ]
      }
    ]
    };
  }

  ngOnInit(): void {
    const initialId = this.route.snapshot.paramMap.get('id');
    this.toolId = initialId;
    this.formContext = { ...this.formContext, mode: initialId ? 'edit' : 'create' };
    this.currentModel = { ...this.formInitialValue };
    this.loadCategories();
  }

  onFormValueChange(rawModel: Record<string, unknown>): void {
    const nextModel = rawModel as unknown as McpToolFormValue;
    const previousModel = this.currentModel;
    this.currentModel = nextModel;

    const type = (nextModel.type as McpToolType) ?? 'endpoint';
    if (type !== 'db') {
      if ((this.formContext.extra?.collectionOptions?.length ?? 0) > 0 || (this.formContext.extra?.fieldOptions?.length ?? 0) > 0) {
        this.formContext = { ...this.formContext, extra: { ...this.formContext.extra, collectionOptions: [], fieldOptions: [] } };
      }
      return;
    }

    const db = this.normalizeDbForm(nextModel.db);
    const currentDb = this.normalizeDbForm(previousModel.db);
    if (
      db.databaseName === currentDb.databaseName &&
      db.collectionName === currentDb.collectionName &&
      JSON.stringify(db.fields) === JSON.stringify(currentDb.fields) &&
      JSON.stringify(db.queryTree) === JSON.stringify(currentDb.queryTree)
    ) {
      return;
    }

    if (db.databaseName !== currentDb.databaseName) {
      this.prepareDbOptions(this.normalizeDb({ ...db, collectionName: '', fields: [] }), { ...db, collectionName: '', fields: [] });
      return;
    }

    if (db.collectionName !== currentDb.collectionName) {
      this.prepareFieldOptions(db.databaseName, db.collectionName, db.queryTree ?? this.createEmptyQueryTree());
    }
  }

  onSubmitForm(model: McpToolFormValue): void {
    if (this.submitting) {
      return;
    }

    const type = model.type ?? 'endpoint';
    const toolDefinition = this.buildToolDefinition(model);
    if ((model.toolParametersText?.trim() || '') && !toolDefinition) {
      return;
    }
    const payload: McpToolCreateDto = {
      category: model.category ?? this.categories[0]?.code ?? this.defaultCategoryCode,
      name: (model.name || '').trim(),
      type,
      enabled: model.enabled ?? true,
      description: (model.description || '').trim(),
      tags: this.normalizeTags(model.tags),
      endpoint: type === 'endpoint' ? this.normalizeEndpoint(model.endpoint) : undefined,
      db: type === 'db' ? this.normalizeDb(model.db) : undefined,
      tool: toolDefinition
    };

    const request$ = this.toolId ? this.toolService.update(this.toolId, payload as McpToolUpdateDto) : this.toolService.create(payload);
    this.submitting = true;
    request$.pipe(finalize(() => (this.submitting = false))).subscribe({
      next: () => {
        this.toastService.info(this.i18nService.t(this.toolId ? 'mcpTool.updateSuccess' : 'mcpTool.createSuccess'));
        void this.router.navigate([MCP_TOOL_CONFIG_ROUTES.toolList]);
      },
      error: () => {
        this.toastService.error(this.i18nService.t(this.toolId ? 'mcpTool.updateError' : 'mcpTool.createError'));
      }
    });
  }

  ngOnDestroy(): void {
    this.detailSub?.unsubscribe();
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
            fieldOptions: [],
            conditionFieldOptions: []
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
            fieldOptions: [],
            conditionFieldOptions: []
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

  private bindDetail(id: string): void {
    this.detailSub?.unsubscribe();
    this.loading = true;
    this.detailSub = this.loadingService.track(this.toolService.getById(id)).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (tool: McpToolResponse) => {
        this.formInitialValue = this.mapToInitialValue(tool);
        this.currentModel = { ...this.formInitialValue };
        this.applyCategoryOptions();
        this.prepareDbOptions(this.normalizeDb(this.formInitialValue.db), this.normalizeDbForm(this.formInitialValue.db));
      },
      error: () => {
        this.toastService.error(this.i18nService.t('mcpTool.loadDetailError'));
        void this.router.navigate([MCP_TOOL_CONFIG_ROUTES.toolList]);
      }
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

  private mapToInitialValue(tool: McpToolResponse): McpToolFormValue {
    const db = this.mapDbResponseToForm(tool.db);
    return {
      category: tool.category,
      name: tool.name,
      type: tool.type,
      enabled: tool.enabled,
      description: tool.description,
      tool: tool.tool,
      toolParametersText: this.stringifyToolParameters(tool.tool),
      tags: [...tool.tags],
      endpoint: {
        method: tool.endpoint?.method ?? 'GET',
        url: tool.endpoint?.url ?? '',
        params: { ...(tool.endpoint?.params ?? {}) },
        headers: { ...(tool.endpoint?.headers ?? {}) },
        body: tool.endpoint?.body ?? ''
      },
      db
    };
  }

  private normalizeTags(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.map((item) => String(item).trim()).filter(Boolean).filter((item, index, items) => items.indexOf(item) === index);
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

  private buildToolDefinition(model: McpToolFormValue): McpToolDefinition | undefined {
    const parameters = this.parseToolParametersText(model.toolParametersText);
    if (parameters === null) {
      return undefined;
    }

    return {
      type: 'function',
      function: {
        name: (model.name || '').trim(),
        description: (model.description || '').trim(),
        parameters: parameters ?? undefined
      }
    };
  }

  private parseToolParametersText(rawValue: string): Record<string, unknown> | undefined | null {
    const normalized = rawValue?.trim() || '';
    if (!normalized) {
      return undefined;
    }

    try {
      const parsed = JSON.parse(normalized);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        this.toastService.error(this.i18nService.t('mcpTool.parametersSchemaInvalid'));
        return null;
      }
      return parsed as Record<string, unknown>;
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

  private normalizeDb(value: unknown): McpDbConfig {
    const db = this.normalizeDbForm(value);
    return {
      queryType: db.queryType,
      databaseName: db.databaseName,
      collectionName: db.collectionName,
      fields: db.fields,
      condition: this.buildCondition(db)
    };
  }

  private normalizeDbForm(value: unknown): McpDbFormConfig {
    const record = value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
    const queryTree = this.normalizeQueryTree(record['queryTree']);

    return {
      queryType: (record['queryType'] as McpDbQueryType) ?? 'select',
      databaseName: String(record['databaseName'] ?? '').trim(),
      collectionName: String(record['collectionName'] ?? '').trim(),
      fields: this.normalizeTags(record['fields']),
      condition: String(record['condition'] ?? '').trim(),
      queryTree
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

  private createInitialValue(): McpToolFormValue {
    return {
      ...(MCP_TOOL_INITIAL_VALUE as McpToolFormValue),
      category: this.categories[0]?.code ?? this.defaultCategoryCode,
      toolParametersText: '',
      db: {
        queryType: 'select',
        databaseName: '',
        collectionName: '',
        fields: [],
        condition: '',
        queryTree: this.createEmptyQueryTree()
      } as unknown as McpDbFormConfig
    };
  }

  private applyCategoryOptions(): void {
    const categoryOptions = this.categories.map((item) => ({ label: item.name || item.code, value: item.code }));
    this.formContext = { ...this.formContext, extra: { ...this.formContext.extra, categoryOptions } };

    if (!this.formInitialValue.category && categoryOptions.length > 0) {
      this.formInitialValue = { ...this.formInitialValue, category: categoryOptions[0].value };
    }
  }

  private prepareDbOptions(db: McpDbConfig, dbForm?: McpDbFormConfig): void {
    this.formContext = {
      ...this.formContext,
      extra: {
        ...this.formContext.extra,
        databaseOptions: this.databaseOptions,
        collectionOptions: [],
        fieldOptions: [],
        conditionFieldOptions: []
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
            fieldOptions: [],
            conditionFieldOptions: []
          }
        };

        if (!db.collectionName) {
          return;
        }

        this.prepareFieldOptions(db.databaseName, db.collectionName, dbForm?.queryTree ?? this.createEmptyQueryTree());
      },
      error: () => {
        this.toastService.error(this.i18nService.t('mcpTool.loadCollectionsError'));
      }
    });
  }

  private prepareFieldOptions(databaseName: string, collectionName: string, queryTree: DbConditionTreeForm): void {
    const cacheKey = `${databaseName}.${collectionName}`;
    const cached = this.collectionFieldMap.get(cacheKey);
    if (cached) {
      this.applyFieldOptions(cached, queryTree);
      return;
    }

    this.loading = true;
    this.loadingService.track(this.toolService.getFields(databaseName, collectionName)).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (fields) => {
        this.collectionFieldMap.set(cacheKey, fields);
        this.applyFieldOptions(fields, queryTree);
      },
      error: () => {
        this.toastService.error(this.i18nService.t('mcpTool.loadFieldsError'));
      }
    });
  }

  private applyFieldOptions(fields: McpCollectionField[], queryTree: DbConditionTreeForm): void {
    const fieldOptions = fields.map((field) => ({ label: `${field.fieldName} (${field.dataTypes.join(', ')})`, value: field.fieldName }));
    const allowed = new Set(fieldOptions.map((field) => field.value));
    const db = this.normalizeDbForm(this.currentModel.db);
    const nextQueryTree = this.filterQueryTree(queryTree, allowed);
    this.formContext = {
      ...this.formContext,
      extra: {
        ...this.formContext.extra,
        fieldOptions,
        conditionFieldOptions: fieldOptions
      }
    };
    this.currentModel = {
      ...this.currentModel,
      db: {
        ...db,
        queryTree: nextQueryTree,
        condition: this.buildCondition({ ...db, queryTree: nextQueryTree })
      } as unknown as McpDbFormConfig
    };
  }

  private buildCondition(db: McpDbFormConfig): string {
    const root = db.queryTree ?? this.createEmptyQueryTree();
    const payload = this.toMongoTree(root);
    if (!payload) {
      return '';
    }
    return JSON.stringify(payload);
  }

  private toMongoClause(item: DbConditionRowNode): Record<string, unknown> {
    const value = this.parseConditionValue(item.operator, item.value);

    switch (item.operator) {
      case 'eq':
        return { [item.field]: value };
      case 'ne':
        return { [item.field]: { $ne: value } };
      case 'gt':
        return { [item.field]: { $gt: value } };
      case 'gte':
        return { [item.field]: { $gte: value } };
      case 'lt':
        return { [item.field]: { $lt: value } };
      case 'lte':
        return { [item.field]: { $lte: value } };
      case 'in':
        return { [item.field]: { $in: value } };
      case 'nin':
        return { [item.field]: { $nin: value } };
      case 'regex':
        return { [item.field]: { $regex: value, $options: 'i' } };
      case 'exists':
        return { [item.field]: { $exists: value } };
    }
  }

  private parseConditionValue(operator: DbConditionOperator, rawValue: string): unknown {
    const placeholder = this.toFilterPlaceholder(rawValue);
    if (placeholder !== null) {
      if (operator === 'in' || operator === 'nin') {
        return [placeholder];
      }
      return placeholder;
    }

    if (operator === 'exists') {
      return rawValue.trim().toLowerCase() !== 'false';
    }

    if (operator === 'in' || operator === 'nin') {
      return rawValue
        .split(',')
        .map((item) => this.parseScalar(item.trim()))
        .filter((item) => item !== '');
    }

    return this.parseScalar(rawValue);
  }

  private parseScalar(rawValue: string): unknown {
    const normalized = rawValue.trim();
    if (normalized === '') {
      return '';
    }
    if (normalized === 'true') {
      return true;
    }
    if (normalized === 'false') {
      return false;
    }
    if (normalized === 'null') {
      return null;
    }
    const numericValue = Number(normalized);
    if (!Number.isNaN(numericValue) && normalized !== '') {
      return numericValue;
    }
    return normalized;
  }

  private toFilterPlaceholder(rawValue: string): string | null {
    const normalized = rawValue.trim();
    if (!normalized) {
      return null;
    }

    const matched = normalized.match(this.filterPlaceholderPattern);
    if (matched) {
      return `{{${matched[1].trim()}}}`;
    }

    return `{{${normalized}}}`;
  }

  private fromStoredConditionValue(value: unknown): string {
    if (Array.isArray(value) && value.length === 1) {
      return this.fromStoredConditionValue(value[0]);
    }

    const normalized = String(value ?? '').trim();
    const matched = normalized.match(this.filterPlaceholderPattern);
    if (matched) {
      return matched[1].trim();
    }

    return normalized;
  }

  private mapDbResponseToForm(db?: McpDbConfig): McpDbConfig {
    const parsed = this.parseCondition(db?.condition);
    return {
      queryType: db?.queryType ?? 'select',
      databaseName: db?.databaseName ?? '',
      collectionName: db?.collectionName ?? '',
      fields: [...(db?.fields ?? [])],
      condition: db?.condition ?? '',
      queryTree: parsed
    } as unknown as McpDbConfig;
  }

  private normalizeQueryTree(value: unknown): DbConditionTreeForm {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return this.createEmptyQueryTree();
    }

    const record = value as Record<string, unknown>;
    const rules = Array.isArray(record['rules']) ? record['rules'] : [];
    const children = Array.isArray(record['children']) ? record['children'] : [];
    return {
      logic: record['logic'] === 'or' ? 'or' : 'and',
      rules: rules.flatMap((rule) => this.normalizeQueryRule(rule)),
      children: children.flatMap((child) => this.normalizeQueryChild(child))
    };
  }

  private normalizeQueryChild(value: unknown): Array<{ node: DbConditionTreeForm }> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return [];
    }

    const record = value as Record<string, unknown>;
    if (!record['node'] || typeof record['node'] !== 'object' || Array.isArray(record['node'])) {
      return [];
    }

    return [{ node: this.normalizeQueryTree(record['node']) }];
  }

  private normalizeQueryRule(value: unknown): DbConditionRowNode[] {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return [];
    }

    const record = value as Record<string, unknown>;
    const field = String(record['field'] ?? '').trim();
    const operator = this.normalizeOperator(record['operator']);
    return [{
      field,
      operator,
      value: String(record['value'] ?? '')
    }];
  }

  private normalizeOperator(value: unknown): DbConditionOperator {
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

  private parseCondition(rawCondition?: string): DbConditionTreeForm {
    if (!rawCondition?.trim()) {
      return this.createEmptyQueryTree();
    }

    try {
      const parsed = JSON.parse(rawCondition) as Record<string, unknown>;
      if (Array.isArray(parsed['$and'])) {
        return this.createQueryTreeForm('and', this.parseConditionClauses(parsed['$and'] as Array<Record<string, unknown>>));
      }
      if (Array.isArray(parsed['$or'])) {
        return this.createQueryTreeForm('or', this.parseConditionClauses(parsed['$or'] as Array<Record<string, unknown>>));
      }
      return this.createQueryTreeForm('and', this.parseConditionClauses([parsed]));
    } catch {
      return this.createEmptyQueryTree();
    }
  }

  private parseConditionClauses(clauses: Array<Record<string, unknown>>): Array<DbConditionTreeForm | DbConditionRowNode> {
    const nodes: Array<DbConditionTreeForm | DbConditionRowNode> = [];

    clauses.forEach((clause) => {
      if (Array.isArray(clause['$and'])) {
        nodes.push(this.createQueryTreeForm('and', this.parseConditionClauses(clause['$and'] as Array<Record<string, unknown>>)));
        return;
      }
      if (Array.isArray(clause['$or'])) {
        nodes.push(this.createQueryTreeForm('or', this.parseConditionClauses(clause['$or'] as Array<Record<string, unknown>>)));
        return;
      }

      const [field, definition] = Object.entries(clause)[0] ?? [];
      if (!field) {
        return;
      }

      if (definition && typeof definition === 'object' && !Array.isArray(definition)) {
        const record = definition as Record<string, unknown>;
        const [operatorKey, operatorValue] = Object.entries(record)[0] ?? [];
        const operator = this.mapMongoOperator(operatorKey);
        if (!operator) {
          return;
        }

        nodes.push({
          field,
          operator,
          value: this.fromStoredConditionValue(operatorValue)
        });
        return;
      }

      nodes.push({ field, operator: 'eq', value: this.fromStoredConditionValue(definition) });
    });

    return nodes;
  }

  private mapMongoOperator(operator: string): DbConditionOperator | null {
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

  private createEmptyQueryTree(): DbConditionTreeForm {
    return { logic: 'and', rules: [], children: [] };
  }

  private createQueryTreeForm(
    logic: DbConditionLogic,
    nodes: Array<DbConditionTreeForm | DbConditionRowNode>
  ): DbConditionTreeForm {
    return {
      logic,
      rules: nodes.filter((node): node is DbConditionRowNode => !('rules' in node)),
      children: nodes
        .filter((node): node is DbConditionTreeForm => 'rules' in node)
        .map((node) => ({ node }))
    };
  }

  private filterQueryTree(node: DbConditionTreeForm, allowed: Set<string>): DbConditionTreeForm {
    return {
      logic: node.logic,
      rules: node.rules.filter((rule) => allowed.has(rule.field)),
      children: node.children
        .map((child) => ({ node: this.filterQueryTree(child.node, allowed) }))
        .filter((child) => child.node.rules.length > 0 || child.node.children.length > 0)
    };
  }

  private toMongoTree(node: DbConditionTreeForm): Record<string, unknown> | null {
    const children = [
      ...node.rules.map((rule) => this.toMongoClause(rule)),
      ...node.children.map((child) => this.toMongoTree(child.node))
    ]
      .filter((child): child is Record<string, unknown> => !!child);

    if (children.length === 0) {
      return null;
    }

    if (children.length === 1) {
      return children[0];
    }

    return node.logic === 'or' ? { $or: children } : { $and: children };
  }
}
