import {
  RuleExpressionConditionNode,
  RuleExpressionNode,
  RuleExpressionOperand,
  RuleLogicFormValue
} from './rule-expression.models';
import { operatorDefinition } from './rule-expression-operators';

export function printRuleExpression(value: RuleLogicFormValue | RuleExpressionNode | null | undefined): string {
  const root = isNode(value) ? value : value?.root ?? null;
  return root ? printNode(root, false) : '';
}

export function printRuleExpressionNode(node: RuleExpressionNode): string {
  return printNode(node, false);
}

export function printRuleExpressionOperand(operand: RuleExpressionOperand | null | undefined): string {
  if (!operand) {
    return '?';
  }

  if (operand.type === 'indicator') {
    return operand.indicatorCode || '?';
  }
  if (operand.type === 'indicatorOutput') {
    const code = operand.indicatorCode || '?';
    return operand.outputName ? `${code}.${operand.outputName}` : `${code}.?`;
  }
  if (operand.type === 'priceSeries') {
    return operand.series ? `price.${operand.series}` : 'price.?';
  }
  if (operand.type === 'ruleRef') {
    return operand.ruleCode ? `rule.${operand.ruleCode}` : 'rule.?';
  }
  return printConstant(operand);
}

function printNode(node: RuleExpressionNode, nested: boolean): string {
  if (node.disabled) {
    return '';
  }

  if (node.type === 'condition') {
    return printCondition(node);
  }
  if (node.type === 'ruleRef') {
    return node.ruleCode ? `RULE(${node.ruleCode})` : 'RULE(?)';
  }
  if (node.type === 'not') {
    const child = node.children.map((item) => printNode(item, true)).find(Boolean);
    return child ? `NOT (${child})` : 'NOT (?)';
  }

  const children = node.children.map((child) => printNode(child, true)).filter(Boolean);
  if (!children.length) {
    return '';
  }

  const printed = children.join(` ${node.operator} `);
  return nested && children.length > 1 ? `(${printed})` : printed;
}

function printCondition(node: RuleExpressionConditionNode): string {
  const definition = operatorDefinition(node.operator);
  const operator = node.operator ?? '?';
  const first = printRuleExpressionOperand(node.operands[0]);

  if (definition?.arity === 'range') {
    return `${first} ${operator} ${printRuleExpressionOperand(node.operands[1])} AND ${printRuleExpressionOperand(node.operands[2])}`;
  }

  return `${first} ${operator} ${printRuleExpressionOperand(node.operands[1])}`;
}

function printConstant(operand: RuleExpressionOperand): string {
  if (operand.value === null || operand.value === undefined || operand.value === '') {
    return 'const.?';
  }
  if (operand.valueType === 'string') {
    return `"${String(operand.value)}"`;
  }
  return String(operand.value);
}

function isNode(value: RuleLogicFormValue | RuleExpressionNode | null | undefined): value is RuleExpressionNode {
  return Boolean(value && typeof value === 'object' && 'type' in value);
}

