import { TradeBotConfigResponse } from '../../../../../core/models/trade-bot/config.model';
import { FieldConfig, FieldType, FormConfig, GridWidth } from '../../../../../shared/ui/form-input/models/form-config.model';

export interface StrategyRuleSlotDefinition {
  slotCode: string;
  label: string;
  required: boolean;
  selectionMode: string;
  acceptedRuleCodes: string[];
  acceptedRuleGroupCodes: string[];
}

export interface StrategyConfigDefinition {
  code: string;
  label: string;
  description: string;
  executor: string;
  ruleGroupSelectionMode: string;
  formConfig: FormConfig;
  initialValue: Record<string, unknown>;
  ruleSlots: StrategyRuleSlotDefinition[];
}

interface StrategyDefinitionConfigValue {
  label?: string;
  description?: string;
  executor?: string;
  ruleGroupSelectionMode?: string;
  configFields?: unknown[];
  initialValue?: Record<string, unknown>;
  ruleSlots?: unknown[];
}

let strategyDefinitions: StrategyConfigDefinition[] = [];
let strategyDefinitionMap = buildStrategyDefinitionMap(strategyDefinitions);

export function configureStrategyDefinitions(configs: TradeBotConfigResponse[] | null | undefined): void {
  const definitions = (configs ?? [])
    .filter((item) => item?.status === 'ACTIVE')
    .map(mapConfigToDefinition)
    .filter((item): item is StrategyConfigDefinition => item !== null);

  strategyDefinitions = [...definitions].sort((left, right) => left.code.localeCompare(right.code));
  strategyDefinitionMap = buildStrategyDefinitionMap(strategyDefinitions);
}

export function resolveStrategyConfigDefinition(strategyServiceName: string | null | undefined): StrategyConfigDefinition {
  const normalizedCode = normalizeStrategyCode(strategyServiceName);
  return (
    strategyDefinitionMap.get(normalizedCode) ?? {
      code: normalizedCode,
      label: normalizedCode,
      description: 'tradeBot.strategy.meta.defaultDescription',
      executor: normalizedCode,
      ruleGroupSelectionMode: 'ANY',
      formConfig: { fields: [] },
      initialValue: {},
      ruleSlots: []
    }
  );
}

export function buildStrategySpecificConfigDefinition(strategyServiceName: string | null | undefined): StrategyConfigDefinition {
  return resolveStrategyConfigDefinition(strategyServiceName);
}

export function mapStrategyConfigToApiPayload(model: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  Object.entries(model ?? {}).forEach(([key, value]) => {
    const apiKey = key
      .replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
      .replace(/^_/, '');
    payload[apiKey] = value;
  });
  return payload;
}

export function mapApiConfigToStrategyConfig(
  rawConfig: Record<string, unknown> | undefined,
  definition: StrategyConfigDefinition
): Record<string, unknown> {
  const allowedKeys = new Set([
    ...Object.keys(definition.initialValue),
    ...definition.formConfig.fields.map((field) => field.name).filter((name): name is string => !!name)
  ]);
  const mapped = { ...definition.initialValue };

  Object.entries(rawConfig ?? {}).forEach(([key, value]) => {
    const uiKey = key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
    if (allowedKeys.size === 0 || allowedKeys.has(uiKey)) {
      mapped[uiKey] = value;
    }
  });

  return mapped;
}

function mapConfigToDefinition(config: TradeBotConfigResponse): StrategyConfigDefinition | null {
  if (!isRecord(config?.value)) {
    return null;
  }

  const rawValue = config.value as StrategyDefinitionConfigValue;
  const code = normalizeStrategyCode(config.key);
  if (!code) {
    return null;
  }

  return {
    code,
    label: String(rawValue.label ?? code).trim() || code,
    description: String(rawValue.description ?? 'tradeBot.strategy.meta.defaultDescription').trim(),
    executor: String(rawValue.executor ?? code).trim() || code,
    ruleGroupSelectionMode: String(rawValue.ruleGroupSelectionMode ?? 'ANY').trim().toUpperCase() || 'ANY',
    formConfig: { fields: normalizeConfigFields(rawValue.configFields) },
    initialValue: isRecord(rawValue.initialValue) ? { ...rawValue.initialValue } : {},
    ruleSlots: normalizeRuleSlots(rawValue.ruleSlots)
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
  const name = String(field['name'] ?? '').trim();
  if (!isSupportedFieldType(type) || !name) {
    return null;
  }

  const width = isGridWidth(field['width']) ? field['width'] : undefined;
  return {
    ...((field as unknown) as FieldConfig),
    ...(width ? { width } : {})
  };
}

function normalizeRuleSlots(ruleSlots: unknown[] | undefined): StrategyRuleSlotDefinition[] {
  return (ruleSlots ?? [])
    .map((slot) => normalizeRuleSlot(slot))
    .filter((slot): slot is StrategyRuleSlotDefinition => slot !== null);
}

function normalizeRuleSlot(slot: unknown): StrategyRuleSlotDefinition | null {
  if (!isRecord(slot)) {
    return null;
  }

  const slotCode = normalizeStrategyCode(String(slot['slotCode'] ?? slot['slot_code'] ?? ''));
  if (!slotCode) {
    return null;
  }

  return {
    slotCode,
    label: String(slot['label'] ?? slotCode).trim() || slotCode,
    required: Boolean(slot['required']),
    selectionMode: String(slot['selectionMode'] ?? slot['selection_mode'] ?? 'single').trim() || 'single',
    acceptedRuleCodes: Array.isArray(slot['acceptedRuleCodes'])
      ? slot['acceptedRuleCodes'].map((item) => normalizeStrategyCode(String(item))).filter(Boolean)
      : Array.isArray(slot['accepted_rule_codes'])
        ? slot['accepted_rule_codes'].map((item) => normalizeStrategyCode(String(item))).filter(Boolean)
        : [],
    acceptedRuleGroupCodes: Array.isArray(slot['acceptedRuleGroupCodes'])
      ? slot['acceptedRuleGroupCodes'].map((item) => normalizeStrategyCode(String(item))).filter(Boolean)
      : Array.isArray(slot['accepted_rule_group_codes'])
        ? slot['accepted_rule_group_codes'].map((item) => normalizeStrategyCode(String(item))).filter(Boolean)
        : []
  };
}

function buildStrategyDefinitionMap(definitions: StrategyConfigDefinition[]): Map<string, StrategyConfigDefinition> {
  return new Map(definitions.map((item) => [item.code, item]));
}

function normalizeStrategyCode(value: string | null | undefined): string {
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
