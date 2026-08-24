import type {
  FieldConfig,
  FormConfig,
  FormContext,
  SelectOption,
} from '@shared/ui/patterns/form-input/models/form-config.model';

import {
  AiGateWorkflowNode,
  CodeGateWorkflowNode,
  InputMapping,
  JsonValue,
  LogicOperator,
  LogicWorkflowNode,
  WorkflowNode,
  WorkflowNodeType,
} from '../model/workflow-studio.model';

export type WorkflowNodeInspectorValue = Record<string, unknown>;
export type WorkflowNodeInspectorPatch = Partial<WorkflowNode>;

export const WORKFLOW_NODE_INSPECTOR_CONTEXT: FormContext = {
  user: null,
  mode: 'edit',
};

const LOGIC_OPERATOR_OPTIONS: SelectOption[] = [
  { label: 'workflowStudio.logic.operator.and', value: 'AND' },
  { label: 'workflowStudio.logic.operator.or', value: 'OR' },
  { label: 'workflowStudio.logic.operator.not', value: 'NOT' },
  { label: 'workflowStudio.logic.operator.nOfM', value: 'N_OF_M' },
  { label: 'workflowStudio.logic.operator.switch', value: 'SWITCH' },
];

export function workflowNodeInspectorConfig(type: WorkflowNodeType): FormConfig {
  switch (type) {
    case 'AI_GATE':
      return aiGateConfig();
    case 'CODE_GATE':
      return codeGateConfig();
    case 'LOGIC':
      return logicConfig();
    case 'START':
    case 'END':
      return readonlyNodeConfig();
    default:
      return readonlyNodeConfig();
  }
}

export function workflowNodeToInspectorValue(node: WorkflowNode): WorkflowNodeInspectorValue {
  switch (node.type) {
    case 'START':
    case 'END':
      return {
        id: node.id,
        type: node.type,
      };
    case 'AI_GATE':
      return {
        id: node.id,
        agentCode: node.agentCode,
        provider: node.provider,
        workingDirectory: node.workingDirectory,
        instruction: node.instruction,
        criteria: stringifyJson(node.criteria),
        outputSchema: node.outputSchema,
        maxAttempts: node.retryPolicy.maxAttempts,
        timeoutSeconds: node.timeoutPolicy.timeoutSeconds,
      };
    case 'CODE_GATE':
      return {
        id: node.id,
        handler: node.handler,
        config: stringifyJson(node.config),
        inputMapping: stringifyJson(node.inputMapping),
        maxAttempts: node.retryPolicy.maxAttempts,
        timeoutSeconds: node.timeoutPolicy.timeoutSeconds,
      };
    case 'LOGIC':
      return {
        id: node.id,
        operator: node.operator,
        required: readNumberConfig(node.config, 'required', 1),
        casePassTarget: readSwitchCase(node.config, 'PASS'),
        caseFailTarget: readSwitchCase(node.config, 'FAIL'),
        caseBlockedTarget: readSwitchCase(node.config, 'BLOCKED'),
        defaultTarget: readStringConfig(node.config, 'default'),
        config: stringifyJson(node.config),
      };
    default:
      return {
        id: node.id,
        type: node.type,
        name: node.name ?? '',
        config: stringifyJson(node.config ?? {}),
      };
  }
}

export function workflowNodePatchFromInspectorValue(
  node: WorkflowNode,
  value: WorkflowNodeInspectorValue,
): WorkflowNodeInspectorPatch | null {
  switch (node.type) {
    case 'START':
    case 'END':
      return {};
    case 'AI_GATE':
      return aiGatePatch(value);
    case 'CODE_GATE':
      return codeGatePatch(value);
    case 'LOGIC':
      return logicPatch(value);
    default:
      return {};
  }
}

export function workflowFieldToSectionId(nodeType: WorkflowNodeType, fieldName?: string): string | null {
  if (!fieldName) return null;
  const normalizedField = fieldName.startsWith('config.') ? fieldName.slice(7) : fieldName;

  switch (nodeType) {
    case 'AI_GATE':
      switch (normalizedField) {
        case 'agentCode':
        case 'provider':
        case 'workingDirectory':
          return 'agent';
        case 'instruction':
          return 'prompt';
        case 'criteria':
          return 'decision';
        case 'inputMapping':
          return 'input';
        case 'outputSchema':
          return 'output';
        case 'maxAttempts':
        case 'timeoutSeconds':
          return 'execution';
        default:
          return 'general';
      }
    case 'CODE_GATE':
      switch (normalizedField) {
        case 'handler':
        case 'config':
          return 'configuration';
        case 'inputMapping':
          return 'input';
        case 'maxAttempts':
        case 'timeoutSeconds':
          return 'execution';
        default:
          return 'general';
      }
    case 'LOGIC':
      switch (normalizedField) {
        case 'operator':
          return 'logic';
        case 'required':
        case 'cases':
        case 'casePassTarget':
        case 'caseFailTarget':
        case 'caseBlockedTarget':
        case 'defaultTarget':
        case 'config':
          return 'routing';
        default:
          return 'general';
      }
    default:
      return 'general';
  }
}

function aiGateConfig(): FormConfig {
  return compactConfig(
    [
      section('general'),
      section('agent'),
      section('prompt'),
      section('output', true),
      section('execution', true),
    ],
    [
      idField(),
      {
        name: 'agentCode',
        type: 'select',
        label: 'workflowStudio.inspector.agentCode',
        sectionId: 'agent',
        required: true,
        optionsExpression: 'context.extra.agentOptions',
        showClear: true,
        width: '1/2',
      },
      {
        name: 'provider',
        type: 'select',
        label: 'workflowStudio.inspector.provider',
        sectionId: 'agent',
        optionsExpression: 'context.extra.providerOptions',
        showClear: true,
        width: '1/2',
      },
      textField('workingDirectory', 'workflowStudio.inspector.workingDirectory', 'agent', 'full', true),
      {
        name: 'instruction',
        type: 'textarea',
        label: 'workflowStudio.inspector.instruction',
        sectionId: 'prompt',
        required: true,
        rows: 6,
        maxRows: 14,
        showZoomButton: true,
      },
      {
        name: 'outputSchema',
        type: 'auto-complete',
        label: 'workflowStudio.inspector.outputSchema',
        sectionId: 'output',
        required: true,
        optionsExpression: 'context.extra.outputSchemaOptions',
      },
      numberField('maxAttempts', 'workflowStudio.inspector.maxAttempts', 'execution'),
      numberField('timeoutSeconds', 'workflowStudio.inspector.timeoutSeconds', 'execution'),
    ],
  );
}

function codeGateConfig(): FormConfig {
  return compactConfig(
    [
      section('general'),
      section('configuration', true),
      section('input', true),
      section('execution', true),
    ],
    [
      idField(),
      textField('handler', 'workflowStudio.inspector.handler', 'configuration', 'full'),
      jsonField('config', 'workflowStudio.inspector.config', 'configuration'),
      jsonField('inputMapping', 'workflowStudio.inspector.inputMapping', 'input'),
      numberField('maxAttempts', 'workflowStudio.inspector.maxAttempts', 'execution'),
      numberField('timeoutSeconds', 'workflowStudio.inspector.timeoutSeconds', 'execution'),
    ],
  );
}

function logicConfig(): FormConfig {
  return compactConfig(
    [
      section('general'),
      section('logic'),
      section('routing', true),
      section('advanced', true),
    ],
    [
      idField(),
      {
        name: 'operator',
        type: 'select',
        label: 'workflowStudio.inspector.operator',
        sectionId: 'logic',
        required: true,
        options: LOGIC_OPERATOR_OPTIONS,
      },
      {
        name: 'required',
        type: 'number',
        label: 'workflowStudio.inspector.minimumSuccess',
        sectionId: 'logic',
        visibleWhen: "model.operator === 'N_OF_M'",
      },
      switchCaseField('casePassTarget', 'workflowStudio.inspector.casePassTarget'),
      switchCaseField('caseFailTarget', 'workflowStudio.inspector.caseFailTarget'),
      switchCaseField('caseBlockedTarget', 'workflowStudio.inspector.caseBlockedTarget'),
      {
        name: 'defaultTarget',
        type: 'text',
        label: 'workflowStudio.inspector.defaultTarget',
        sectionId: 'routing',
        visibleWhen: "model.operator === 'SWITCH'",
      },
      jsonField('config', 'workflowStudio.inspector.config', 'advanced'),
    ],
  );
}

function readonlyNodeConfig(): FormConfig {
  return compactConfig([section('general')], [idField()]);
}

function compactConfig(
  sections: FormConfig['sections'],
  fields: FieldConfig[],
): FormConfig {
  return {
    sections,
    fields,
    layout: {
      mode: 'sectioned',
      density: 'compact',
      labelPlacement: 'top',
      sectionNavigation: 'none',
      showValidationSummary: true,
      stickyFooter: false,
      autoScrollToError: false,
    },
  };
}

function section(id: string, collapsible = false) {
  return {
    id,
    title: `workflowStudio.inspector.section.${id}`,
    collapsible,
    collapsed: collapsible,
  };
}

function idField(): FieldConfig {
  return {
    name: 'id',
    type: 'text',
    label: 'workflowStudio.inspector.nodeId',
    sectionId: 'general',
    disabledWhen: 'true',
    width: 'full',
  };
}

function textField(
  name: string,
  label: string,
  sectionId: string,
  width: FieldConfig['width'] = 'full',
  disabled = false,
): FieldConfig {
  return {
    name,
    type: 'text',
    label,
    sectionId,
    width,
    disabledWhen: disabled ? 'true' : undefined,
  };
}

function jsonField(name: string, label: string, sectionId: string): FieldConfig {
  return {
    name,
    type: 'json',
    label,
    sectionId,
    rows: 4,
    maxRows: 10,
    showZoomButton: true,
  };
}

function numberField(name: string, label: string, sectionId: string): FieldConfig {
  return {
    name,
    type: 'number',
    label,
    sectionId,
    width: '1/2',
    validation: [{ type: 'min', value: 1, message: 'workflowStudio.validation.positiveNumber' }],
  };
}

function switchCaseField(name: string, label: string): FieldConfig {
  return {
    name,
    type: 'text',
    label,
    sectionId: 'routing',
    visibleWhen: "model.operator === 'SWITCH'",
  };
}

function aiGatePatch(value: WorkflowNodeInspectorValue): Partial<AiGateWorkflowNode> | null {
  const criteria = parseJsonField(value['criteria']);
  const inputMapping = value['inputMapping'] !== undefined ? parseInputMappingField(value['inputMapping']) : undefined;
  if (criteria === undefined || (value['inputMapping'] !== undefined && inputMapping === undefined)) {
    return null;
  }

  const patch: Partial<AiGateWorkflowNode> = {
    instruction: textValue(value['instruction']),
    criteria,
    provider: textValue(value['provider']),
    agentCode: textValue(value['agentCode']),
    workingDirectory: textValue(value['workingDirectory']),
    outputSchema: textValue(value['outputSchema']),
    retryPolicy: { maxAttempts: positiveInteger(value['maxAttempts'], 1) },
    timeoutPolicy: { timeoutSeconds: positiveInteger(value['timeoutSeconds'], 30) },
  };

  if (inputMapping !== undefined) {
    patch.inputMapping = inputMapping;
  }

  return patch;
}

function codeGatePatch(value: WorkflowNodeInspectorValue): Partial<CodeGateWorkflowNode> | null {
  const config = parseJsonField(value['config']);
  const inputMapping = parseInputMappingField(value['inputMapping']);
  if (config === undefined || inputMapping === undefined) {
    return null;
  }

  return {
    handler: textValue(value['handler']),
    config,
    inputMapping,
    retryPolicy: { maxAttempts: positiveInteger(value['maxAttempts'], 1) },
    timeoutPolicy: { timeoutSeconds: positiveInteger(value['timeoutSeconds'], 30) },
  };
}

function logicPatch(value: WorkflowNodeInspectorValue): Partial<LogicWorkflowNode> | null {
  const operator = logicOperator(value['operator']);

  if (operator === 'N_OF_M') {
    return {
      operator,
      config: { required: positiveInteger(value['required'], 1) },
    };
  }

  if (operator === 'SWITCH') {
    return {
      operator,
      config: switchConfig(value),
    };
  }

  return {
    operator,
    config: {},
  };
}

function switchConfig(value: WorkflowNodeInspectorValue): JsonValue {
  const cases: Record<string, JsonValue> = {};
  setSwitchTarget(cases, 'PASS', value['casePassTarget']);
  setSwitchTarget(cases, 'FAIL', value['caseFailTarget']);
  setSwitchTarget(cases, 'BLOCKED', value['caseBlockedTarget']);

  const config: Record<string, JsonValue> = { cases };
  const defaultTarget = textValue(value['defaultTarget']);
  if (defaultTarget) {
    config['default'] = defaultTarget;
  }
  return config;
}

function setSwitchTarget(cases: Record<string, JsonValue>, outcome: string, value: unknown): void {
  const target = textValue(value);
  if (target) {
    cases[outcome] = target;
  }
}

function stringifyJson(value: JsonValue | InputMapping): string {
  return JSON.stringify(value ?? {}, null, 2);
}

function parseJsonField(value: unknown): JsonValue | undefined {
  if (typeof value !== 'string') {
    return toJsonValue(value);
  }

  const text = value.trim();
  if (!text) {
    return {};
  }

  try {
    return toJsonValue(JSON.parse(text));
  } catch {
    return undefined;
  }
}

function parseInputMappingField(value: unknown): InputMapping | undefined {
  const parsed = parseJsonField(value);
  if (parsed === undefined) {
    return undefined;
  }

  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && 'mapping' in parsed) {
    return {
      mapping: toJsonValue((parsed as Record<string, unknown>)['mapping']) ?? {},
    };
  }

  return { mapping: parsed };
}

function toJsonValue(value: unknown): JsonValue {
  if (value === undefined) {
    return null;
  }
  return JSON.parse(JSON.stringify(value)) as JsonValue;
}

function textValue(value: unknown): string {
  return typeof value === 'string' ? value : String(value ?? '');
}

function positiveInteger(value: unknown, fallback: number): number {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue < 1) {
    return fallback;
  }
  return Math.floor(numberValue);
}

function logicOperator(value: unknown): LogicOperator {
  return LOGIC_OPERATOR_OPTIONS.some((option) => option.value === value)
    ? value as LogicOperator
    : 'AND';
}

function readNumberConfig(config: JsonValue, key: string, fallback: number): number {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return fallback;
  }
  return positiveInteger((config as Record<string, unknown>)[key], fallback);
}

function readStringConfig(config: JsonValue, key: string): string {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return '';
  }
  const value = (config as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : '';
}

function readSwitchCase(config: JsonValue, outcome: string): string {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return '';
  }
  const cases = (config as Record<string, unknown>)['cases'];
  if (!cases || typeof cases !== 'object' || Array.isArray(cases)) {
    return '';
  }
  const value = (cases as Record<string, unknown>)[outcome];
  return typeof value === 'string' ? value : '';
}
