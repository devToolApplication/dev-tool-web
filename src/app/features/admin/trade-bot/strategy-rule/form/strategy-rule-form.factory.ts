import { TradeBotConfigResponse } from '../../../../../core/models/trade-bot/config.model';
import { SYSTEM_STATUS_OPTIONS } from '../../../../../core/constants/system.constants';
import { StrategyRuleResponse, StrategyRuleStatus } from '../../../../../core/models/trade-bot/strategy-rule.model';
import { FieldConfig, FieldType, FormConfig, GridWidth, SelectOption } from '../../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../../shared/ui/form-input/utils/validation-rules';

export interface StrategyRuleFormValue {
  code: string;
  name: string;
  status: StrategyRuleStatus;
  description: string;
  configJson: Record<string, unknown>;
}

export interface StrategyRuleCodeDefinition {
  code: string;
  label: string;
  description: string;
  ruleGroupCode: string;
  ruleGroupLabel: string;
  configKey: string;
  configFields: FieldConfig[];
  initialValue: Record<string, unknown>;
}

interface StrategyRuleDefinitionConfigValue {
  label?: string;
  description?: string;
  ruleGroupCode?: string;
  ruleGroupLabel?: string;
  configKey?: string;
  configFields?: unknown[];
  initialValue?: Record<string, unknown>;
}

interface StrategyRuleConfigSchemaValue {
  label?: string;
  description?: string;
  configFields?: unknown[];
  initialValue?: Record<string, unknown>;
}

interface StrategyRuleConfigSchemaDefinition {
  key: string;
  label: string;
  description: string;
  configFields: FieldConfig[];
  initialValue: Record<string, unknown>;
}

let strategyRuleDefinitions: StrategyRuleCodeDefinition[] = [];
let ruleDefinitionMap = buildRuleDefinitionMap(strategyRuleDefinitions);
let strategyRuleCodeOptions = buildRuleCodeOptions(strategyRuleDefinitions);
let strategyRuleConfigSchemaMap = new Map<string, StrategyRuleConfigSchemaDefinition>();

export function configureStrategyRuleDefinitions(
  definitions: TradeBotConfigResponse[] | null | undefined,
  configSchemas?: TradeBotConfigResponse[] | null | undefined
): void {
  strategyRuleConfigSchemaMap = buildRuleConfigSchemaMap(configSchemas ?? []);

  const resolvedDefinitions = (definitions ?? [])
    .filter((item) => item?.status === 'ACTIVE')
    .map(mapConfigToDefinition)
    .filter((item): item is StrategyRuleCodeDefinition => item !== null)
    .map((item) => applySharedSchema(item))
    .filter((item): item is StrategyRuleCodeDefinition => item !== null);

  updateRuleDefinitions(resolvedDefinitions);
}

export function getStrategyRuleDefaultCode(): string | null {
  return strategyRuleDefinitions[0]?.code ?? null;
}

export function mapRuleDefinitionsToResponses(
  definitions: TradeBotConfigResponse[] | null | undefined,
  configSchemas?: TradeBotConfigResponse[] | null | undefined
): StrategyRuleResponse[] {
  const schemaMap = buildRuleConfigSchemaMap(configSchemas ?? []);
  return (definitions ?? [])
    .filter((item) => item?.status === 'ACTIVE')
    .map(mapConfigToDefinition)
    .filter((item): item is StrategyRuleCodeDefinition => item !== null)
    .map((item) => applySharedSchema(item, schemaMap))
    .filter((item): item is StrategyRuleCodeDefinition => item !== null)
    .sort((left, right) => left.code.localeCompare(right.code))
    .map((item) => ({
      id: item.code,
      code: item.code,
      name: item.label,
      ruleGroupCode: item.ruleGroupCode || undefined,
      ruleGroupLabel: item.ruleGroupLabel || undefined,
      configJson: { ...item.initialValue },
      description: item.description,
      status: 'ACTIVE'
    }));
}

export function resolveStrategyRuleDefinition(ruleCode: string | null | undefined): StrategyRuleCodeDefinition {
  const normalizedCode = normalizeRuleCode(ruleCode);
  const fallbackCode = normalizedCode || getStrategyRuleDefaultCode() || '';
  return (
    ruleDefinitionMap.get(normalizedCode) ?? {
      code: fallbackCode,
      label: fallbackCode,
      description: 'tradeBot.strategyRule.definition.fallbackDescription',
      ruleGroupCode: '',
      ruleGroupLabel: '',
      configKey: '',
      configFields: [],
      initialValue: {}
    }
  );
}

export function buildStrategyRuleFormConfig(ruleCode: string | null | undefined): FormConfig {
  const definition = resolveStrategyRuleDefinition(ruleCode);
  const codeOptions = ruleDefinitionMap.has(definition.code)
    ? strategyRuleCodeOptions
    : [{ label: definition.label, value: definition.code }, ...strategyRuleCodeOptions];

  return {
    fields: [
      {
        type: 'select',
        name: 'code',
        label: 'tradeBot.strategyRule.field.code',
        width: '1/2',
        options: codeOptions,
        validation: [Rules.required('tradeBot.strategyRule.validation.codeRequired')]
      },
      {
        type: 'text',
        name: 'name',
        label: 'tradeBot.strategyRule.field.name',
        width: '1/2',
        validation: [Rules.required('tradeBot.strategyRule.validation.nameRequired')]
      },
      {
        type: 'select',
        name: 'status',
        label: 'tradeBot.strategy.field.status',
        width: '1/2',
        options: [...SYSTEM_STATUS_OPTIONS],
        validation: [Rules.required('tradeBot.strategyRule.validation.statusRequired')]
      },
      {
        type: 'textarea',
        name: 'description',
        label: 'tradeBot.strategy.field.description',
        width: 'full'
      },
      ...definition.configFields
    ]
  };
}

export function buildStrategyRuleSlotFormConfig(ruleCode: string | null | undefined): FormConfig {
  const definition = resolveStrategyRuleDefinition(ruleCode);
  return {
    fields: definition.configFields.map((field) => ({
      ...field,
      name: extractConfigKey(field.name) ?? field.name
    }))
  };
}

export function buildStrategyRuleInitialValue(
  ruleCode: string | null | undefined,
  overrides: Partial<StrategyRuleFormValue> = {}
): StrategyRuleFormValue {
  const definition = resolveStrategyRuleDefinition(ruleCode);

  return {
    code: definition.code,
    name: '',
    status: 'ACTIVE',
    description: '',
    configJson: { ...definition.initialValue },
    ...overrides
  };
}

export function buildStrategyRuleSlotInitialValue(
  ruleCode: string | null | undefined,
  rawConfig: Record<string, unknown> | undefined
): Record<string, unknown> {
  const definition = resolveStrategyRuleDefinition(ruleCode);
  const mappedConfig = mapApiConfigToRuleConfig(rawConfig, ruleCode);
  return {
    ...definition.initialValue,
    ...mappedConfig
  };
}

export function mapApiConfigToRuleConfig(rawConfig: Record<string, unknown> | undefined, ruleCode: string | null | undefined): Record<string, unknown> {
  const definition = resolveStrategyRuleDefinition(ruleCode);
  const allowedKeys = new Set([
    ...Object.keys(definition.initialValue),
    ...definition.configFields.map((field) => extractConfigKey(field.name)).filter((key): key is string => !!key)
  ]);
  const mapped = { ...definition.initialValue };

  if (allowedKeys.size === 0 && !ruleDefinitionMap.has(definition.code)) {
    return { ...(rawConfig ?? {}) };
  }

  Object.entries(rawConfig ?? {}).forEach(([key, value]) => {
    const uiKey = key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
    if (allowedKeys.has(uiKey) || allowedKeys.has(key)) {
      mapped[allowedKeys.has(uiKey) ? uiKey : key] = value;
    }
  });

  return mapped;
}

export function mapRuleConfigToApiPayload(model: Record<string, unknown> | undefined): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  Object.entries(model ?? {}).forEach(([key, value]) => {
    const apiKey = key
      .replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
      .replace(/^_/, '');
    payload[apiKey] = value;
  });
  return payload;
}

function normalizeRuleCode(ruleCode: string | null | undefined): string {
  return String(ruleCode ?? '')
    .trim()
    .toUpperCase();
}

function updateRuleDefinitions(definitions: StrategyRuleCodeDefinition[]): void {
  strategyRuleDefinitions = [...definitions].sort((left, right) => left.code.localeCompare(right.code));
  ruleDefinitionMap = buildRuleDefinitionMap(strategyRuleDefinitions);
  strategyRuleCodeOptions = buildRuleCodeOptions(strategyRuleDefinitions);
}

function buildRuleDefinitionMap(definitions: StrategyRuleCodeDefinition[]): Map<string, StrategyRuleCodeDefinition> {
  return new Map(definitions.map((item) => [item.code, item]));
}

function buildRuleCodeOptions(definitions: StrategyRuleCodeDefinition[]): SelectOption[] {
  return definitions.map((item) => ({ label: item.label, value: item.code }));
}

function buildRuleConfigSchemaMap(configs: TradeBotConfigResponse[]): Map<string, StrategyRuleConfigSchemaDefinition> {
  return new Map(
    configs
      .filter((item) => item?.status === 'ACTIVE')
      .map(mapConfigToSchema)
      .filter((item): item is StrategyRuleConfigSchemaDefinition => item !== null)
      .map((item) => [item.key, item] as const)
  );
}

function mapConfigToDefinition(config: TradeBotConfigResponse): StrategyRuleCodeDefinition | null {
  if (!isRecord(config?.value)) {
    return null;
  }

  const rawValue = config.value as StrategyRuleDefinitionConfigValue;
  const code = normalizeRuleCode(config.key);
  if (!code) {
    return null;
  }

  return {
    code,
    label: String(rawValue.label ?? code).trim() || code,
    description: String(rawValue.description ?? 'tradeBot.strategyRule.definition.fallbackDescription').trim(),
    ruleGroupCode: normalizeRuleCode(String(rawValue.ruleGroupCode ?? '')),
    ruleGroupLabel: String(rawValue.ruleGroupLabel ?? rawValue.ruleGroupCode ?? '').trim(),
    configKey: normalizeRuleCode(String(rawValue.configKey ?? '')),
    configFields: normalizeConfigFields(rawValue.configFields),
    initialValue: isRecord(rawValue.initialValue) ? { ...rawValue.initialValue } : {}
  };
}

function mapConfigToSchema(config: TradeBotConfigResponse): StrategyRuleConfigSchemaDefinition | null {
  if (!isRecord(config?.value)) {
    return null;
  }

  const rawValue = config.value as StrategyRuleConfigSchemaValue;
  const key = normalizeRuleCode(config.key);
  if (!key) {
    return null;
  }

  return {
    key,
    label: String(rawValue.label ?? key).trim() || key,
    description: String(rawValue.description ?? '').trim(),
    configFields: normalizeConfigFields(rawValue.configFields),
    initialValue: isRecord(rawValue.initialValue) ? { ...rawValue.initialValue } : {}
  };
}

function applySharedSchema(
  definition: StrategyRuleCodeDefinition | null,
  schemaMap: Map<string, StrategyRuleConfigSchemaDefinition> = strategyRuleConfigSchemaMap
): StrategyRuleCodeDefinition | null {
  if (!definition) {
    return null;
  }
  if (!definition.configKey) {
    return definition;
  }

  const schema = schemaMap.get(definition.configKey);
  if (!schema) {
    return definition;
  }

  return {
    ...definition,
    configFields: schema.configFields,
    initialValue: {
      ...schema.initialValue,
      ...definition.initialValue
    }
  };
}

function normalizeConfigFields(configFields: unknown[] | undefined): FieldConfig[] {
  return (configFields ?? [])
    .map((field) => normalizeConfigField(field))
    .filter((field): field is FieldConfig => field !== null);
}

function normalizeConfigField(field: unknown): FieldConfig | null {
  if (!isRecord(field)) {
    return null;
  }

  const type = String(field['type'] ?? '').trim() as FieldType;
  const name = String(field['name'] ?? field['key'] ?? '').trim();
  if (!isSupportedFieldType(type) || !name) {
    return null;
  }

  const width = isGridWidth(field['width']) ? field['width'] : undefined;
  return {
    ...(field as unknown as FieldConfig),
    name: name.startsWith('configJson.') ? name : `configJson.${name}`,
    ...(width ? { width } : {})
  };
}

function extractConfigKey(fieldName: string | undefined): string | null {
  if (!fieldName) {
    return null;
  }
  return fieldName.startsWith('configJson.') ? fieldName.slice('configJson.'.length) : fieldName;
}

function isSupportedFieldType(type: string): type is FieldType {
  return [
    'text',
    'number',
    'select',
    'group',
    'checkbox',
    'date',
    'radio',
    'select-multi',
    'auto-complete',
    'textarea',
    'array',
    'record',
    'tags',
    'input-multi',
    'secret-metadata',
    'tree'
  ].includes(type);
}

function isGridWidth(value: unknown): value is GridWidth {
  return ['1/2', '1/3', '1/4', '1/6', 'full'].includes(String(value ?? ''));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
