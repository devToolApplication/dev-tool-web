import {
  RuleExpressionConditionNode,
  RuleExpressionConditionOperator,
  RuleExpressionGroupNode,
  RuleExpressionGroupOperator,
  RuleExpressionNode,
  RuleExpressionNodeType,
  RuleExpressionNotNode,
  RuleExpressionOperand,
  RuleExpressionRuleRefNode,
  RuleLogicFormValue
} from './rule-expression.models';
import { defaultParamsForOperator } from './rule-expression-operators';

let nodeCounter = 0;

export function nextRuleExpressionNodeId(prefix = 'expr'): string {
  nodeCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${nodeCounter.toString(36)}`;
}

export function createPriceOperand(series = 'CLOSEPRICE' as const): RuleExpressionOperand {
  return { type: 'priceSeries', series };
}

export function createConstantOperand(value: string | number | boolean | null = 0): RuleExpressionOperand {
  const valueType = typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string';
  return { type: 'constant', value, valueType };
}

export function createRuleExpressionCondition(
  overrides: Partial<RuleExpressionConditionNode> = {}
): RuleExpressionConditionNode {
  const operator = overrides.operator ?? 'CROSSOVER';
  return {
    id: overrides.id ?? nextRuleExpressionNodeId('condition'),
    type: 'condition',
    operator,
    operands: overrides.operands ?? defaultOperands(operator),
    disabled: overrides.disabled,
    label: overrides.label,
    params: cloneParams(overrides.params ?? defaultParamsForOperator(operator))
  };
}

export function createRuleExpressionGroup(
  operator: RuleExpressionGroupOperator = 'AND',
  children: RuleExpressionNode[] = [],
  overrides: Partial<RuleExpressionGroupNode> = {}
): RuleExpressionGroupNode {
  return {
    id: overrides.id ?? nextRuleExpressionNodeId(operator.toLocaleLowerCase()),
    type: 'group',
    operator: overrides.operator ?? operator,
    children: cloneRuleExpressionNodes(overrides.children ?? children),
    disabled: overrides.disabled,
    label: overrides.label,
    params: cloneParams(overrides.params)
  };
}

export function createRuleExpressionRuleRef(
  ruleCode = '',
  overrides: Partial<RuleExpressionRuleRefNode> = {}
): RuleExpressionRuleRefNode {
  return {
    id: overrides.id ?? nextRuleExpressionNodeId('rule-ref'),
    type: 'ruleRef',
    ruleCode: overrides.ruleCode ?? ruleCode,
    slotCode: overrides.slotCode,
    disabled: overrides.disabled,
    label: overrides.label,
    params: cloneParams(overrides.params)
  };
}

export function createRuleExpressionNot(
  children: RuleExpressionNode[] = [],
  overrides: Partial<RuleExpressionNotNode> = {}
): RuleExpressionNotNode {
  return {
    id: overrides.id ?? nextRuleExpressionNodeId('not'),
    type: 'not',
    children: cloneRuleExpressionNodes(overrides.children ?? children),
    disabled: overrides.disabled,
    label: overrides.label,
    params: cloneParams(overrides.params)
  };
}

export function createRuleExpressionNode(type: RuleExpressionNodeType): RuleExpressionNode {
  if (type === 'group') {
    return createRuleExpressionGroup('AND');
  }
  if (type === 'condition') {
    return createRuleExpressionCondition();
  }
  if (type === 'ruleRef') {
    return createRuleExpressionRuleRef();
  }
  return createRuleExpressionNot();
}

export function cloneRuleLogicValue(value: RuleLogicFormValue | null | undefined): RuleLogicFormValue {
  return {
    root: value?.root ? cloneRuleExpressionNode(value.root) : null
  };
}

export function cloneRuleExpressionNode(node: RuleExpressionNode): RuleExpressionNode {
  if (node.type === 'group') {
    return {
      ...node,
      params: cloneParams(node.params),
      children: cloneRuleExpressionNodes(node.children)
    };
  }
  if (node.type === 'not') {
    return {
      ...node,
      params: cloneParams(node.params),
      children: cloneRuleExpressionNodes(node.children)
    };
  }
  if (node.type === 'condition') {
    return {
      ...node,
      params: cloneParams(node.params),
      operands: node.operands.map((operand) => ({ ...operand }))
    };
  }
  return {
    ...node,
    params: cloneParams(node.params)
  };
}

export function normalizeRuleLogicValue(value: unknown): RuleLogicFormValue {
  if (!value || typeof value !== 'object') {
    return { root: null };
  }

  const record = value as Record<string, unknown>;
  const candidate = record['root'] ?? record;
  const root = normalizeNode(candidate);
  return { root };
}

export function replaceRuleExpressionNode(
  root: RuleExpressionNode | null,
  nodeId: string,
  replacement: RuleExpressionNode
): RuleExpressionNode | null {
  if (!root) {
    return null;
  }
  if (root.id === nodeId) {
    return cloneRuleExpressionNode(replacement);
  }

  if (root.type === 'group' || root.type === 'not') {
    return {
      ...root,
      children: root.children.map((child) => replaceRuleExpressionNode(child, nodeId, replacement) ?? child)
    };
  }

  return root;
}

export function removeRuleExpressionNode(
  root: RuleExpressionNode | null,
  nodeId: string
): RuleExpressionNode | null {
  if (!root || root.id === nodeId) {
    return null;
  }

  if (root.type !== 'group' && root.type !== 'not') {
    return root;
  }

  return {
    ...root,
    children: root.children
      .filter((child) => child.id !== nodeId)
      .map((child) => removeRuleExpressionNode(child, nodeId) ?? child)
  };
}

export function findRuleExpressionNode(
  root: RuleExpressionNode | null,
  nodeId: string | null | undefined
): RuleExpressionNode | null {
  if (!root || !nodeId) {
    return null;
  }
  if (root.id === nodeId) {
    return root;
  }
  if (root.type === 'group' || root.type === 'not') {
    for (const child of root.children) {
      const result = findRuleExpressionNode(child, nodeId);
      if (result) {
        return result;
      }
    }
  }
  return null;
}

export function addRuleExpressionChild(
  root: RuleExpressionNode | null,
  parentId: string,
  child: RuleExpressionNode
): RuleExpressionNode | null {
  if (!root) {
    return null;
  }
  if ((root.type === 'group' || root.type === 'not') && root.id === parentId) {
    return {
      ...root,
      children: [...root.children, cloneRuleExpressionNode(child)]
    };
  }
  if (root.type === 'group' || root.type === 'not') {
    return {
      ...root,
      children: root.children.map((item) => addRuleExpressionChild(item, parentId, child) ?? item)
    };
  }
  return root;
}

export function duplicateRuleExpressionNode(node: RuleExpressionNode): RuleExpressionNode {
  const cloned = cloneRuleExpressionNode(node);
  return reassignNodeIds(cloned);
}

export function wrapRuleExpressionNode(
  root: RuleExpressionNode | null,
  nodeId: string,
  wrapperType: 'group' | 'not',
  groupOperator: RuleExpressionGroupOperator = 'AND'
): RuleExpressionNode | null {
  const target = findRuleExpressionNode(root, nodeId);
  if (!target) {
    return root;
  }
  const wrapper = wrapperType === 'not'
    ? createRuleExpressionNot([target])
    : createRuleExpressionGroup(groupOperator, [target]);
  return replaceRuleExpressionNode(root, nodeId, wrapper);
}

function normalizeNode(value: unknown): RuleExpressionNode | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const type = record['type'];
  if (type === 'group') {
    const operator = isGroupOperator(record['operator']) ? record['operator'] : 'AND';
    return createRuleExpressionGroup(operator, normalizeChildren(record['children']), {
      id: stringValue(record['id'], nextRuleExpressionNodeId('group')),
      disabled: Boolean(record['disabled']),
      label: stringValue(record['label']),
      params: recordValue(record['params'])
    });
  }
  if (type === 'not') {
    return createRuleExpressionNot(normalizeChildren(record['children']), {
      id: stringValue(record['id'], nextRuleExpressionNodeId('not')),
      disabled: Boolean(record['disabled']),
      label: stringValue(record['label']),
      params: recordValue(record['params'])
    });
  }
  if (type === 'condition') {
    const operator = isConditionOperator(record['operator']) ? record['operator'] : null;
    const operands = Array.isArray(record['operands'])
      ? record['operands'].map((operand) => normalizeOperand(operand)).filter(isOperand)
      : [];
    return createRuleExpressionCondition({
      id: stringValue(record['id'], nextRuleExpressionNodeId('condition')),
      operator,
      operands,
      disabled: Boolean(record['disabled']),
      label: stringValue(record['label']),
      params: recordValue(record['params'])
    });
  }
  if (type === 'ruleRef') {
    return createRuleExpressionRuleRef(stringValue(record['ruleCode']), {
      id: stringValue(record['id'], nextRuleExpressionNodeId('rule-ref')),
      slotCode: stringValue(record['slotCode']),
      disabled: Boolean(record['disabled']),
      label: stringValue(record['label']),
      params: recordValue(record['params'])
    });
  }

  return null;
}

function normalizeChildren(value: unknown): RuleExpressionNode[] {
  return Array.isArray(value) ? value.map((item) => normalizeNode(item)).filter(isNode) : [];
}

function normalizeOperand(value: unknown): RuleExpressionOperand | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const record = value as Record<string, unknown>;
  const type = record['type'];
  if (!isOperandType(type)) {
    return null;
  }
  return {
    type,
    indicatorCode: stringValue(record['indicatorCode']),
    outputName: stringValue(record['outputName']),
    series: priceSeriesValue(record['series']),
    ruleCode: stringValue(record['ruleCode']),
    value: scalarValue(record['value']),
    valueType: isConstantType(record['valueType']) ? record['valueType'] : undefined
  };
}

function defaultOperands(operator: RuleExpressionConditionOperator | null): RuleExpressionOperand[] {
  if (operator === 'BETWEEN' || operator === 'OUTSIDE') {
    return [createPriceOperand(), createConstantOperand(0), createConstantOperand(1)];
  }
  if (operator === 'CROSSOVER' || operator === 'CROSSUNDER') {
    return [];
  }
  return [createPriceOperand(), createConstantOperand(0)];
}

function reassignNodeIds(node: RuleExpressionNode): RuleExpressionNode {
  if (node.type === 'group') {
    return {
      ...node,
      id: nextRuleExpressionNodeId('group-copy'),
      children: node.children.map((child) => reassignNodeIds(child))
    };
  }
  if (node.type === 'not') {
    return {
      ...node,
      id: nextRuleExpressionNodeId('not-copy'),
      children: node.children.map((child) => reassignNodeIds(child))
    };
  }
  return {
    ...node,
    id: nextRuleExpressionNodeId(`${node.type}-copy`)
  };
}

function cloneRuleExpressionNodes(nodes: RuleExpressionNode[]): RuleExpressionNode[] {
  return nodes.map((node) => cloneRuleExpressionNode(node));
}

function cloneParams(value: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  return value ? { ...value } : undefined;
}

function recordValue(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : undefined;
}

function stringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function scalarValue(value: unknown): string | number | boolean | null | undefined {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) {
    return value;
  }
  return undefined;
}

function isNode(value: RuleExpressionNode | null): value is RuleExpressionNode {
  return Boolean(value);
}

function isOperand(value: RuleExpressionOperand | null): value is RuleExpressionOperand {
  return Boolean(value);
}

function isGroupOperator(value: unknown): value is RuleExpressionGroupOperator {
  return value === 'AND' || value === 'OR' || value === 'XOR';
}

function isConditionOperator(value: unknown): value is RuleExpressionConditionOperator {
  return [
    'CROSSOVER',
    'CROSSUNDER',
    'GT',
    'GTE',
    'LT',
    'LTE',
    'EQ',
    'NEQ',
    'BETWEEN',
    'OUTSIDE'
  ].includes(String(value));
}

function isOperandType(value: unknown): value is RuleExpressionOperand['type'] {
  return ['indicator', 'indicatorOutput', 'priceSeries', 'ruleRef', 'constant'].includes(String(value));
}

function priceSeriesValue(value: unknown): RuleExpressionOperand['series'] {
  return ['OPEN', 'HIGH', 'LOW', 'CLOSE', 'VOLUME', 'CLOSEPRICE'].includes(String(value))
    ? value as RuleExpressionOperand['series']
    : undefined;
}

function isConstantType(value: unknown): value is RuleExpressionOperand['valueType'] {
  return value === 'number' || value === 'string' || value === 'boolean';
}
