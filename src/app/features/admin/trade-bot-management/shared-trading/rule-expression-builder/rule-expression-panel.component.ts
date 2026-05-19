import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { IndicatorConfigResponse, RuleConfigResponse } from '../../data-access/models/trading-system.model';
import {
  createConstantOperand,
  createPriceOperand
} from './rule-expression-factory';
import {
  RuleExpressionConditionNode,
  RuleExpressionConditionOperator,
  RuleExpressionGroupNode,
  RuleExpressionGroupOperator,
  RuleExpressionNode,
  RuleExpressionOperand,
  RuleExpressionRuleRefNode,
  RuleExpressionValidationIssue
} from './rule-expression.models';
import {
  RULE_EXPRESSION_OPERATOR_CATALOG,
  operatorDefinition
} from './rule-expression-operators';

interface OperandSlot {
  index: number;
  label: string;
}

@Component({
  selector: 'app-rule-expression-panel',
  standalone: false,
  templateUrl: './rule-expression-panel.component.html',
  styleUrl: './rule-expression-builder.component.css'
})
export class RuleExpressionPanelComponent {
  @Input() node: RuleExpressionNode | null = null;
  @Input() issues: RuleExpressionValidationIssue[] = [];
  @Input() indicatorConfigs: IndicatorConfigResponse[] = [];
  @Input() ruleConfigs: RuleConfigResponse[] = [];
  @Input() currentRuleId: string | null = null;
  @Input() readonly = false;
  @Input() disabled = false;

  @Output() readonly nodeChange = new EventEmitter<RuleExpressionNode>();
  @Output() readonly removeNode = new EventEmitter<string>();
  @Output() readonly duplicateNode = new EventEmitter<string>();

  readonly paramsJsonError = signal<string | null>(null);

  readonly groupOperatorOptions: Array<{ label: string; value: RuleExpressionGroupOperator }> = [
    { label: 'tradeBot.ruleExpression.group.AND', value: 'AND' },
    { label: 'tradeBot.ruleExpression.group.OR', value: 'OR' },
    { label: 'tradeBot.ruleExpression.group.XOR', value: 'XOR' }
  ];

  readonly operatorOptions = RULE_EXPRESSION_OPERATOR_CATALOG.map((item) => ({
    label: item.label,
    value: item.value
  }));

  get readonlyOrDisabled(): boolean {
    return this.readonly || this.disabled;
  }

  groupNode(node: RuleExpressionNode): RuleExpressionGroupNode {
    return node as RuleExpressionGroupNode;
  }

  conditionNode(node: RuleExpressionNode): RuleExpressionConditionNode {
    return node as RuleExpressionConditionNode;
  }

  ruleRefNode(node: RuleExpressionNode): RuleExpressionRuleRefNode {
    return node as RuleExpressionRuleRefNode;
  }

  nodeIssues(node: RuleExpressionNode): RuleExpressionValidationIssue[] {
    return this.issues.filter((issue) => issue.nodeId === node.id);
  }

  ruleOptions(): Array<{ label: string; value: string; disabled?: boolean }> {
    return this.ruleConfigs
      .filter((item) => item.id !== this.currentRuleId)
      .map((item) => ({
        label: `${item.code} - ${item.executor}/${item.executorVersion}${item.status ? ` [${item.status}]` : ''}`,
        value: item.code,
        disabled: item.status === 'INACTIVE' || item.status === 'DISABLED'
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  operandSlots(node: RuleExpressionConditionNode): OperandSlot[] {
    const definition = operatorDefinition(node.operator);
    if (definition?.arity === 'range') {
      return [
        { index: 0, label: 'tradeBot.ruleExpression.field.leftOperand' },
        { index: 1, label: 'tradeBot.ruleExpression.field.minOperand' },
        { index: 2, label: 'tradeBot.ruleExpression.field.maxOperand' }
      ];
    }
    return [
      { index: 0, label: 'tradeBot.ruleExpression.field.leftOperand' },
      { index: 1, label: 'tradeBot.ruleExpression.field.rightOperand' }
    ];
  }

  operandAt(node: RuleExpressionConditionNode, index: number): RuleExpressionOperand {
    return node.operands[index] ?? (index === 0 ? createPriceOperand() : createConstantOperand());
  }

  updateGroupOperator(node: RuleExpressionGroupNode, value: unknown): void {
    if (!this.isGroupOperator(value)) {
      return;
    }
    this.emitChange({ ...node, operator: value });
  }

  updateConditionOperator(node: RuleExpressionConditionNode, value: unknown): void {
    if (!this.isConditionOperator(value)) {
      return;
    }
    const required = operatorDefinition(value)?.arity === 'range' ? 3 : 2;
    const operands = [...node.operands];
    while (operands.length < required) {
      operands.push(operands.length === 0 ? createPriceOperand() : createConstantOperand(operands.length === 1 ? 0 : 1));
    }
    this.emitChange({ ...node, operator: value, operands: operands.slice(0, required) });
  }

  updateOperand(node: RuleExpressionConditionNode, index: number, operand: RuleExpressionOperand): void {
    const operands = [...node.operands];
    operands[index] = operand;
    this.emitChange({ ...node, operands });
  }

  updateRuleCode(node: RuleExpressionRuleRefNode, value: unknown): void {
    this.emitChange({ ...node, ruleCode: this.textValue(value) });
  }

  updateSlotCode(node: RuleExpressionRuleRefNode, value: string | null): void {
    this.emitChange({ ...node, slotCode: value?.trim() || undefined });
  }

  updateDisabled(node: RuleExpressionNode, value: boolean | null): void {
    this.emitChange({ ...node, disabled: value === true });
  }

  paramsText(node: RuleExpressionNode): string {
    return JSON.stringify(node.params ?? {}, null, 2);
  }

  updateParams(node: RuleExpressionNode, value: string | null): void {
    try {
      const parsed = JSON.parse(value || '{}') as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        this.paramsJsonError.set('tradeBot.ruleExpression.validation.paramsObject');
        return;
      }
      this.paramsJsonError.set(null);
      this.emitChange({ ...node, params: parsed as Record<string, unknown> });
    } catch {
      this.paramsJsonError.set('tradeBot.message.invalidJson');
    }
  }

  requestRemove(node: RuleExpressionNode): void {
    if (!this.readonlyOrDisabled) {
      this.removeNode.emit(node.id);
    }
  }

  requestDuplicate(node: RuleExpressionNode): void {
    if (!this.readonlyOrDisabled) {
      this.duplicateNode.emit(node.id);
    }
  }

  private emitChange(node: RuleExpressionNode): void {
    if (!this.readonlyOrDisabled) {
      this.nodeChange.emit(node);
    }
  }

  private isGroupOperator(value: unknown): value is RuleExpressionGroupOperator {
    return value === 'AND' || value === 'OR' || value === 'XOR';
  }

  private isConditionOperator(value: unknown): value is RuleExpressionConditionOperator {
    return RULE_EXPRESSION_OPERATOR_CATALOG.some((item) => item.value === value);
  }

  private textValue(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }
}

