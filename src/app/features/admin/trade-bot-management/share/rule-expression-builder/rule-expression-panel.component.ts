import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { IndicatorConfigResponse, RuleConfigResponse } from '../../data-access/models/trading-system.model';
import { createConstantOperand } from './rule-expression-factory';
import {
  RuleExpressionConditionNode,
  RuleExpressionConditionOperator,
  RuleExpressionGroupNode,
  RuleExpressionGroupOperator,
  RuleExpressionNode,
  RuleExpressionOperand,
  RuleExpressionOperandValueType,
  RuleExpressionRuleRefNode,
  RuleExpressionValidationIssue
} from './rule-expression.models';
import {
  RULE_EXPRESSION_OPERATOR_CATALOG,
  operandValueTypes,
  operatorDefinition
} from './rule-expression-operators';

interface OperandSlot {
  index: number;
  label: string;
  allowedValueTypes: RuleExpressionOperandValueType[];
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
    return (definition?.slots ?? []).map((slot, index) => ({
      index,
      label: slot.label,
      allowedValueTypes: slot.allowedValueTypes
    }));
  }

  operandAt(node: RuleExpressionConditionNode, index: number): RuleExpressionOperand | null {
    return node.operands[index] ?? null;
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
    const slots = operatorDefinition(value)?.slots ?? [];
    const operands = slots.flatMap((slot, index) => {
      const current = node.operands[index];
      if (current && operandValueTypes(current).some((type) => slot.allowedValueTypes.includes(type))) {
        return [current];
      }
      if (slot.name === 'min') {
        return [createConstantOperand(0)];
      }
      if (slot.name === 'max') {
        return [createConstantOperand(1)];
      }
      return [];
    });
    this.emitChange({ ...node, operator: value, operands });
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
