import { SYSTEM_STATUS_OPTIONS } from '../../../../../core/constants/system.constants';
import { StrategyRuleResponse, StrategyRuleStatus } from '../../../../../core/models/trade-bot/strategy-rule.model';
import { FieldConfig, FieldType, FormConfig, GridWidth, SelectOption } from '../../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../../shared/ui/form-input/utils/validation-rules';

export interface StrategyRuleFormValue {
  code: string;
  name: string;
  ruleGroupCode: string;
  ruleGroupLabel: string;
  implementationCode: string;
  status: StrategyRuleStatus;
  description: string;
  configFieldsJson: string;
  initialValueJson: string;
  configJson: Record<string, unknown>;
}

export interface StrategyRuleCodeDefinition {
  code: string;
  label: string;
  description: string;
  ruleGroupCode: string;
  ruleGroupLabel: string;
  implementationCode: string;
  configFields: FieldConfig[];
  initialValue: Record<string, unknown>;
}

export function buildStrategyRuleFormConfig(definition: StrategyRuleCodeDefinition): FormConfig {
  return {
    fields: [
      {
        type: 'text',
        name: 'code',
        label: 'tradeBot.strategyRule.field.code',
        width: '1/2',
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
        type: 'text',
        name: 'ruleGroupCode',
        label: 'Rule group code',
        width: '1/2'
      },
      {
        type: 'text',
        name: 'ruleGroupLabel',
        label: 'Rule group label',
        width: '1/2'
      },
      {
        type: 'text',
        name: 'implementationCode',
        label: 'Implementation code',
        width: '1/2'
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
      {
        type: 'textarea',
        name: 'configFieldsJson',
        label: 'Config fields',
        width: 'full',
        rows: 8,
        maxRows: 14,
        showZoomButton: true,
        contentType: 'json'
      },
      {
        type: 'textarea',
        name: 'initialValueJson',
        label: 'Initial value',
        width: 'full',
        rows: 5,
        maxRows: 10,
        showZoomButton: true,
        contentType: 'json'
      },
      ...definition.configFields
    ]
  };
}

export function buildStrategyRuleInitialValue(
  definition: StrategyRuleCodeDefinition,
  overrides: Partial<StrategyRuleFormValue> = {}
): StrategyRuleFormValue {
  return {
    code: definition.code,
    name: '',
    ruleGroupCode: definition.ruleGroupCode,
    ruleGroupLabel: definition.ruleGroupLabel,
    implementationCode: definition.implementationCode,
    status: 'ACTIVE',
    description: '',
    configFieldsJson: stringifyJson(definition.configFields.map(stripConfigFieldNamePrefix)),
    initialValueJson: stringifyJson(definition.initialValue),
    configJson: { ...definition.initialValue },
    ...overrides
  };
}

export function buildEmptyStrategyRuleDefinition(): StrategyRuleCodeDefinition {
  return {
    code: '',
    label: '',
    description: 'tradeBot.strategyRule.definition.fallbackDescription',
    ruleGroupCode: '',
    ruleGroupLabel: '',
    implementationCode: '',
    configFields: [],
    initialValue: {}
  };
}

export function buildStrategyRuleDefinitionFromFormValue(value: StrategyRuleFormValue): StrategyRuleCodeDefinition {
  const rawConfigFields = parseJsonArray(value.configFieldsJson, []);
  const configFields = normalizeConfigFields(rawConfigFields);
  const initialValueFromFields = buildInitialValueFromFields(rawConfigFields);
  const initialValue = {
    ...initialValueFromFields,
    ...parseJsonRecord(value.initialValueJson, {})
  };

  return {
    code: normalizeCode(value.code),
    label: value.name?.trim() || normalizeCode(value.code),
    description: value.description?.trim() || 'tradeBot.strategyRule.definition.fallbackDescription',
    ruleGroupCode: normalizeCode(value.ruleGroupCode),
    ruleGroupLabel: value.ruleGroupLabel?.trim() || value.ruleGroupCode?.trim() || '',
    implementationCode: normalizeCode(value.implementationCode),
    configFields,
    initialValue
  };
}

export function mapRuleResponseToDefinition(rule: StrategyRuleResponse): StrategyRuleCodeDefinition {
  const rawConfigFields = rule.configFields ?? [];
  const configFields = normalizeConfigFields(rawConfigFields);
  const initialValue = isRecord(rule.initialValue) ? { ...rule.initialValue } : buildInitialValueFromFields(rawConfigFields);
  return {
    code: normalizeCode(rule.code),
    label: rule.name ?? rule.code,
    description: rule.description ?? 'tradeBot.strategyRule.definition.fallbackDescription',
    ruleGroupCode: normalizeCode(rule.ruleGroupCode),
    ruleGroupLabel: rule.ruleGroupLabel ?? rule.ruleGroupCode ?? '',
    implementationCode: normalizeCode(rule.implementationCode),
    configFields,
    initialValue
  };
}

export function mapApiConfigToRuleConfig(rawConfig: Record<string, unknown> | undefined, definition: StrategyRuleCodeDefinition): Record<string, unknown> {
  const allowedKeys = new Set([
    ...Object.keys(definition.initialValue),
    ...definition.configFields.map((field) => extractConfigKey(field.name)).filter((key): key is string => !!key)
  ]);
  const mapped = { ...definition.initialValue };

  if (allowedKeys.size === 0) {
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

export function parseRuleConfigFieldsPayload(configFieldsJson: string): Array<Record<string, unknown>> {
  return parseJsonArray(configFieldsJson, []).filter(isRecord);
}

export function parseRuleInitialValuePayload(initialValueJson: string): Record<string, unknown> {
  return parseJsonRecord(initialValueJson, {});
}

export function buildStrategyRuleSlotFormConfig(definition: StrategyRuleCodeDefinition): FormConfig {
  return {
    fields: definition.configFields.map((field) => ({
      ...field,
      name: extractConfigKey(field.name) ?? field.name
    }))
  };
}

export function buildStrategyRuleSlotInitialValue(
  definition: StrategyRuleCodeDefinition,
  rawConfig: Record<string, unknown> | undefined
): Record<string, unknown> {
  return {
    ...definition.initialValue,
    ...mapApiConfigToRuleConfig(rawConfig, definition)
  };
}

export function stringifyJson(value: unknown): string {
  return JSON.stringify(value ?? null, null, 2);
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

  const rawType = String(field['type'] ?? '').trim();
  const type = (rawType === 'boolean' ? 'checkbox' : rawType) as FieldType;
  const name = String(field['name'] ?? field['key'] ?? '').trim();
  if (!isSupportedFieldType(type) || !name) {
    return null;
  }

  const configKey = extractConfigKey(name) ?? name;
  const width = isGridWidth(field['width']) ? field['width'] : undefined;
  const helpText = String(field['helpText'] ?? field['description'] ?? '').trim();
  const options = Array.isArray(field['options']) ? normalizeOptions(field['options']) : undefined;
  const normalizedField: Record<string, unknown> = {
    ...(field as unknown as FieldConfig),
    key: configKey,
    name: `configJson.${configKey}`,
    type,
    ...(width ? { width } : {}),
    ...(options ? { options } : {}),
    ...(helpText ? { helpText } : {})
  };
  return normalizedField as unknown as FieldConfig;
}

function normalizeOptions(options: unknown[]): SelectOption[] {
  return options
    .map((option) => {
      if (isRecord(option)) {
        return {
          label: String(option['label'] ?? option['value'] ?? '').trim(),
          value: option['value'] as string | number
        };
      }
      return { label: String(option), value: String(option) };
    })
    .filter((option) => option.label !== '');
}

function buildInitialValueFromFields(configFields: unknown[] | undefined): Record<string, unknown> {
  const initialValue: Record<string, unknown> = {};
  (configFields ?? []).forEach((field) => {
    if (!isRecord(field)) {
      return;
    }
    const key = extractConfigKey(String(field['key'] ?? field['name'] ?? ''));
    if (key && Object.prototype.hasOwnProperty.call(field, 'defaultValue')) {
      initialValue[key] = field['defaultValue'];
    }
  });
  return initialValue;
}

function stripConfigFieldNamePrefix(field: FieldConfig): Record<string, unknown> {
  const normalized = { ...(field as unknown as Record<string, unknown>) };
  const key = extractConfigKey(String(normalized['key'] ?? normalized['name'] ?? ''));
  if (key) {
    normalized['key'] = key;
    normalized['name'] = key;
  }
  return normalized;
}

function parseJsonArray(value: string | null | undefined, fallback: unknown[]): unknown[] {
  const text = String(value ?? '').trim();
  if (!text) {
    return fallback;
  }
  const parsed = JSON.parse(text) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error('JSON value must be an array');
  }
  return parsed;
}

function parseJsonRecord(value: string | null | undefined, fallback: Record<string, unknown>): Record<string, unknown> {
  const text = String(value ?? '').trim();
  if (!text) {
    return fallback;
  }
  const parsed = JSON.parse(text) as unknown;
  if (!isRecord(parsed)) {
    throw new Error('JSON value must be an object');
  }
  return parsed;
}

function extractConfigKey(fieldName: string | undefined): string | null {
  if (!fieldName) {
    return null;
  }
  return fieldName.startsWith('configJson.') ? fieldName.slice('configJson.'.length) : fieldName;
}

function normalizeCode(value: string | null | undefined): string {
  return String(value ?? '')
    .trim()
    .toUpperCase();
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
