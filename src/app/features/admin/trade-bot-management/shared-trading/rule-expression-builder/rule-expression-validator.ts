import { RuleConfigResponse } from '../../data-access/models/trading-system.model';
import { extractRuleExpressionDependencies } from './rule-expression-dependencies';
import {
  RuleExpressionConditionNode,
  RuleExpressionNode,
  RuleExpressionOperand,
  RuleExpressionValidationContext,
  RuleExpressionValidationIssue,
  RuleExpressionValidationResult,
  RuleLogicFormValue
} from './rule-expression.models';
import { operatorDefinition } from './rule-expression-operators';

export function validateRuleExpression(
  value: RuleLogicFormValue | RuleExpressionNode | null | undefined,
  context: RuleExpressionValidationContext = {}
): RuleExpressionValidationResult {
  const root = isNode(value) ? value : value?.root ?? null;
  const issues: RuleExpressionValidationIssue[] = [];

  if (!root) {
    issues.push({ message: 'tradeBot.ruleExpression.validation.rootRequired', severity: 'error' });
    return validationResult(issues);
  }

  validateNode(root, context, issues, 'root');
  return validationResult(issues);
}

export function ruleExpressionHasErrors(result: RuleExpressionValidationResult): boolean {
  return result.errors.length > 0;
}

function validateNode(
  node: RuleExpressionNode,
  context: RuleExpressionValidationContext,
  issues: RuleExpressionValidationIssue[],
  path: string
): void {
  if (node.disabled) {
    return;
  }

  if (node.type === 'group') {
    const activeChildren = node.children.filter((child) => !child.disabled);
    if ((node.operator === 'AND' || node.operator === 'OR') && activeChildren.length < 2) {
      issues.push({
        nodeId: node.id,
        path,
        message: 'tradeBot.ruleExpression.validation.groupMinChildren',
        severity: 'error'
      });
    }
    if (node.operator === 'XOR' && activeChildren.length !== 2) {
      issues.push({
        nodeId: node.id,
        path,
        message: 'tradeBot.ruleExpression.validation.xorChildCount',
        severity: 'error'
      });
    }
    node.children.forEach((child, index) => validateNode(child, context, issues, `${path}.${index}`));
    return;
  }

  if (node.type === 'not') {
    const activeChildren = node.children.filter((child) => !child.disabled);
    if (activeChildren.length !== 1) {
      issues.push({
        nodeId: node.id,
        path,
        message: 'tradeBot.ruleExpression.validation.notChildCount',
        severity: 'error'
      });
    }
    node.children.forEach((child, index) => validateNode(child, context, issues, `${path}.not.${index}`));
    return;
  }

  if (node.type === 'condition') {
    validateCondition(node, context, issues, path);
    return;
  }

  validateRuleRef(node.ruleCode, node.id, context, issues, path);
}

function validateCondition(
  node: RuleExpressionConditionNode,
  context: RuleExpressionValidationContext,
  issues: RuleExpressionValidationIssue[],
  path: string
): void {
  const definition = operatorDefinition(node.operator);
  if (!definition) {
    issues.push({
      nodeId: node.id,
      path,
      message: 'tradeBot.ruleExpression.validation.operatorRequired',
      severity: 'error'
    });
    return;
  }

  const requiredOperands = definition.arity === 'range' ? 3 : 2;
  if (node.operands.length < requiredOperands || node.operands.slice(0, requiredOperands).some((operand) => !operandComplete(operand))) {
    issues.push({
      nodeId: node.id,
      path,
      message: 'tradeBot.ruleExpression.validation.operandRequired',
      severity: 'error'
    });
  }

  node.operands.slice(0, requiredOperands).forEach((operand, index) => {
    if (!operand) {
      return;
    }
    validateOperand(operand, node.id, context, issues, `${path}.operand.${index}`);
    if (!operandCompatible(operand, definition.numericOnly, definition.allowBoolean, definition.allowRuleRef)) {
      issues.push({
        nodeId: node.id,
        path: `${path}.operand.${index}`,
        message: 'tradeBot.ruleExpression.validation.incompatibleOperand',
        severity: 'error'
      });
    }
  });

  if (definition.arity === 'range') {
    validateRangeOperands(node, issues, path);
  }
}

function validateRangeOperands(
  node: RuleExpressionConditionNode,
  issues: RuleExpressionValidationIssue[],
  path: string
): void {
  const min = node.operands[1];
  const max = node.operands[2];
  if (!min || !max) {
    return;
  }

  const minNumber = constantNumber(min);
  const maxNumber = constantNumber(max);
  if (minNumber !== null && maxNumber !== null && minNumber >= maxNumber) {
    issues.push({
      nodeId: node.id,
      path,
      message: 'tradeBot.ruleExpression.validation.rangeOrder',
      severity: 'error'
    });
  }
}

function validateOperand(
  operand: RuleExpressionOperand,
  nodeId: string,
  context: RuleExpressionValidationContext,
  issues: RuleExpressionValidationIssue[],
  path: string
): void {
  if (operand.type === 'indicator' || operand.type === 'indicatorOutput') {
    const code = operand.indicatorCode?.trim() ?? '';
    if (!code) {
      return;
    }
    const indicator = context.indicatorConfigs?.find((item) => item.code === code);
    if (!indicator) {
      issues.push({ nodeId, path, message: 'tradeBot.ruleExpression.validation.missingIndicator', severity: 'error' });
      return;
    }
    if (indicator.status === 'INACTIVE' || indicator.status === 'DISABLED') {
      issues.push({ nodeId, path, message: 'tradeBot.ruleExpression.validation.inactiveIndicator', severity: 'warning' });
    }
    return;
  }

  if (operand.type === 'ruleRef') {
    validateRuleRef(operand.ruleCode ?? '', nodeId, context, issues, path);
  }
}

function validateRuleRef(
  ruleCode: string,
  nodeId: string,
  context: RuleExpressionValidationContext,
  issues: RuleExpressionValidationIssue[],
  path: string
): void {
  const code = ruleCode.trim();
  if (!code) {
    issues.push({ nodeId, path, message: 'tradeBot.ruleExpression.validation.ruleRefRequired', severity: 'error' });
    return;
  }

  const currentRuleCode = context.currentRuleCode?.trim() ?? '';
  if (currentRuleCode && code === currentRuleCode) {
    issues.push({ nodeId, path, message: 'tradeBot.validation.selfChildRule', severity: 'error' });
  }

  const rule = context.ruleConfigs?.find((item) => item.code === code);
  if (!rule) {
    issues.push({ nodeId, path, message: 'tradeBot.ruleExpression.validation.missingRuleRef', severity: 'error' });
    return;
  }

  if (context.currentRuleId && rule.id === context.currentRuleId) {
    issues.push({ nodeId, path, message: 'tradeBot.validation.selfChildRule', severity: 'error' });
  }

  if (rule.status === 'INACTIVE' || rule.status === 'DISABLED') {
    issues.push({ nodeId, path, message: 'tradeBot.validation.inactiveChildRule', severity: 'warning' });
  }

  const circularPath = currentRuleCode ? circularDependencyPath(currentRuleCode, code, context.ruleConfigs ?? []) : null;
  if (circularPath) {
    issues.push({
      nodeId,
      path,
      message: `Circular child rule dependency: ${circularPath.join(' -> ')}`,
      severity: 'error'
    });
  }
}

function circularDependencyPath(
  currentCode: string,
  candidateCode: string,
  ruleConfigs: RuleConfigResponse[]
): string[] | null {
  if (!currentCode || !candidateCode || currentCode === candidateCode) {
    return null;
  }
  const path = findDependencyPath(candidateCode, currentCode, ruleConfigs, new Set([currentCode]));
  return path ? [currentCode, ...path] : null;
}

function findDependencyPath(
  fromCode: string,
  targetCode: string,
  ruleConfigs: RuleConfigResponse[],
  visited: Set<string>
): string[] | null {
  if (fromCode === targetCode) {
    return [fromCode];
  }
  if (visited.has(fromCode)) {
    return null;
  }
  visited.add(fromCode);

  const rule = ruleConfigs.find((item) => item.code === fromCode);
  if (!rule) {
    return null;
  }

  for (const dependencyPath of ruleDependencyPaths(rule)) {
    const dependency = dependencyPath[0];
    if (!dependency) {
      continue;
    }

    const targetIndex = dependencyPath.indexOf(targetCode);
    if (targetIndex >= 0) {
      return [fromCode, ...dependencyPath.slice(0, targetIndex + 1)];
    }

    if (dependency === targetCode) {
      return [fromCode, targetCode];
    }
    const nested = findDependencyPath(dependency, targetCode, ruleConfigs, new Set(visited));
    if (nested) {
      return [fromCode, ...nested];
    }
  }
  return null;
}

function ruleDependencyPaths(rule: RuleConfigResponse): string[][] {
  const expression = rule.config?.['ruleExpression'];
  const expressionDeps = extractRuleExpressionDependencies(expression as RuleLogicFormValue | RuleExpressionNode | null | undefined).ruleCodes;
  const childRuleDeps = childRulePaths(rule.childRules);
  const paths = [...expressionDeps.map((code) => [code]), ...childRuleDeps];
  const seen = new Set<string>();

  return paths.filter((path) => {
    const key = path.join('>');
    if (!path.length || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function childRulePaths(childRules: Array<Record<string, unknown>> | undefined): string[][] {
  return (childRules ?? []).flatMap((child) => {
    const code = textValue(child['ruleCode'] ?? child['code']);
    const nested = Array.isArray(child['childRules'])
      ? child['childRules'] as Array<Record<string, unknown>>
      : Array.isArray(child['children'])
        ? child['children'] as Array<Record<string, unknown>>
        : [];
    const nestedPaths = childRulePaths(nested);
    if (!code) {
      return nestedPaths;
    }
    return [
      [code],
      ...nestedPaths.map((path) => [code, ...path])
    ];
  });
}

function operandComplete(operand: RuleExpressionOperand | undefined): boolean {
  if (!operand) {
    return false;
  }
  if (operand.type === 'indicator') {
    return Boolean(operand.indicatorCode?.trim());
  }
  if (operand.type === 'indicatorOutput') {
    return Boolean(operand.indicatorCode?.trim() && operand.outputName?.trim());
  }
  if (operand.type === 'priceSeries') {
    return Boolean(operand.series);
  }
  if (operand.type === 'ruleRef') {
    return Boolean(operand.ruleCode?.trim());
  }
  return operand.value !== undefined && operand.value !== null && operand.value !== '';
}

function operandCompatible(
  operand: RuleExpressionOperand,
  numericOnly: boolean,
  allowBoolean: boolean,
  allowRuleRef: boolean
): boolean {
  if (operand.type === 'ruleRef') {
    return allowRuleRef;
  }
  if (operand.type !== 'constant') {
    return true;
  }
  if (operand.valueType === 'boolean') {
    return allowBoolean;
  }
  if (numericOnly) {
    return operand.valueType === 'number' && typeof operand.value === 'number';
  }
  return true;
}

function constantNumber(operand: RuleExpressionOperand): number | null {
  return operand.type === 'constant' && operand.valueType === 'number' && typeof operand.value === 'number'
    ? operand.value
    : null;
}

function validationResult(issues: RuleExpressionValidationIssue[]): RuleExpressionValidationResult {
  const errors = issues.filter((issue) => issue.severity === 'error');
  const warnings = issues.filter((issue) => issue.severity === 'warning');
  return {
    valid: errors.length === 0,
    issues,
    errors,
    warnings
  };
}

function textValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isNode(value: RuleLogicFormValue | RuleExpressionNode | null | undefined): value is RuleExpressionNode {
  return Boolean(value && typeof value === 'object' && 'type' in value);
}
