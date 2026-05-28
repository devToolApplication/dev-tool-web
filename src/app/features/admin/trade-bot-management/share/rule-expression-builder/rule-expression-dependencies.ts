import {
  RuleExpressionDependencySummary,
  RuleExpressionNode,
  RuleExpressionOperand,
  RuleExpressionRuleRefNode,
  RuleLogicFormValue
} from './rule-expression.models';

export function extractRuleExpressionDependencies(
  value: RuleLogicFormValue | RuleExpressionNode | null | undefined,
  includeDisabled = false
): RuleExpressionDependencySummary {
  const summary: RuleExpressionDependencySummary = {
    indicatorCodes: [],
    ruleCodes: [],
    priceSeries: []
  };
  const root = isNode(value) ? value : value?.root ?? null;
  collectNode(root, summary, includeDisabled);
  return {
    indicatorCodes: uniqueSorted(summary.indicatorCodes),
    ruleCodes: uniqueSorted(summary.ruleCodes),
    priceSeries: uniqueSorted(summary.priceSeries)
  };
}

export function deriveChildRulesFromExpression(
  value: RuleLogicFormValue | RuleExpressionNode | null | undefined
): Array<Record<string, unknown>> {
  const root = isNode(value) ? value : value?.root ?? null;
  const refs: RuleExpressionRuleRefNode[] = [];
  collectRuleRefNodes(root, refs);
  const seen = new Set<string>();

  return refs.flatMap((node) => {
    const ruleCode = node.ruleCode.trim();
    if (!ruleCode || seen.has(ruleCode)) {
      return [];
    }
    seen.add(ruleCode);

    const childRule: Record<string, unknown> = { ruleCode };
    if (node.slotCode?.trim()) {
      childRule['slotCode'] = node.slotCode.trim();
    }
    if (node.params && Object.keys(node.params).length) {
      childRule['config'] = { ...node.params };
    }
    return [childRule];
  });
}

function collectNode(
  node: RuleExpressionNode | null,
  summary: RuleExpressionDependencySummary,
  includeDisabled: boolean
): void {
  if (!node || (!includeDisabled && node.disabled)) {
    return;
  }

  if (node.type === 'condition') {
    node.operands.forEach((operand) => collectOperand(operand, summary));
    return;
  }
  if (node.type === 'ruleRef') {
    add(summary.ruleCodes, node.ruleCode);
    return;
  }

  node.children.forEach((child) => collectNode(child, summary, includeDisabled));
}

function collectOperand(operand: RuleExpressionOperand, summary: RuleExpressionDependencySummary): void {
  if (operand.type === 'indicator' || operand.type === 'indicatorOutput') {
    add(summary.indicatorCodes, operand.indicatorCode);
    return;
  }
  if (operand.type === 'priceSeries') {
    add(summary.priceSeries, operand.series);
    return;
  }
  if (operand.type === 'ruleRef') {
    add(summary.ruleCodes, operand.ruleCode);
  }
}

function collectRuleRefNodes(node: RuleExpressionNode | null, refs: RuleExpressionRuleRefNode[]): void {
  if (!node || node.disabled) {
    return;
  }
  if (node.type === 'ruleRef') {
    refs.push(node);
    return;
  }
  if (node.type === 'condition') {
    node.operands
      .filter((operand) => operand.type === 'ruleRef' && operand.ruleCode?.trim())
      .forEach((operand) =>
        refs.push({
          id: `${node.id}-${operand.ruleCode}`,
          type: 'ruleRef',
          ruleCode: operand.ruleCode ?? ''
        })
      );
    return;
  }

  node.children.forEach((child) => collectRuleRefNodes(child, refs));
}

function add<T extends string>(target: T[], value: T | string | undefined): void {
  const text = String(value ?? '').trim();
  if (text) {
    target.push(text as T);
  }
}

function uniqueSorted<T extends string>(items: T[]): T[] {
  return [...new Set(items)].sort((a, b) => a.localeCompare(b));
}

function isNode(value: RuleLogicFormValue | RuleExpressionNode | null | undefined): value is RuleExpressionNode {
  return Boolean(value && typeof value === 'object' && 'type' in value);
}

