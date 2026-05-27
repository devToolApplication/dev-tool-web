import {
  createRuleExpressionGroup,
  createRuleExpressionRuleRef,
  normalizeRuleLogicValue
} from './rule-expression-factory';
import { RuleExpressionNode, RuleLogicFormValue } from './rule-expression.models';

export function ruleExpressionFromConfigAndChildRules(
  config: Record<string, unknown> | null | undefined,
  childRules: Array<Record<string, unknown>> | null | undefined
): RuleLogicFormValue {
  const expression = config?.['ruleExpression'];
  const normalized = normalizeRuleLogicValue(expression);
  if (normalized.root) {
    return normalized;
  }
  return ruleExpressionFromLegacyChildRules(childRules);
}

export function ruleExpressionFromLegacyChildRules(
  childRules: Array<Record<string, unknown>> | null | undefined
): RuleLogicFormValue {
  const nodes = legacyRuleNodes(childRules ?? []);
  if (!nodes.length) {
    return { root: null };
  }
  if (nodes.length === 1) {
    return { root: nodes[0] };
  }
  return { root: createRuleExpressionGroup('AND', nodes) };
}

function legacyRuleNodes(childRules: Array<Record<string, unknown>>): RuleExpressionNode[] {
  return childRules.flatMap((item, index) => {
    const ruleCode = stringValue(item['ruleCode'] ?? item['code']);
    const slotCode = stringValue(item['slotCode']);
    const config = recordValue(item['config'] ?? item['params']);
    const nested = arrayRecordValue(item['childRules'] ?? item['children']);
    const nodes: RuleExpressionNode[] = [];

    if (ruleCode) {
      nodes.push(
        createRuleExpressionRuleRef(ruleCode, {
          id: `legacy-rule-ref-${index}-${safeId(ruleCode)}`,
          slotCode,
          params: config
        })
      );
    }

    nodes.push(...legacyRuleNodes(nested));
    return nodes;
  });
}

function arrayRecordValue(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object' && !Array.isArray(item))
    : [];
}

function recordValue(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : undefined;
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function safeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '-');
}

