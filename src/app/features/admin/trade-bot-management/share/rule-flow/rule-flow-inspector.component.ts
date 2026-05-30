import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FlowNode } from '../../../../../shared/ui/flow-builder/models';
import { IndicatorConfigResponse, RuleConfigResponse } from '../../data-access/models/trading-system.model';
import {
  RuleExpressionConditionOperator,
  RuleExpressionGroupOperator,
  RuleExpressionOperand,
} from '../rule-expression-builder/rule-expression.models';
import {
  RULE_EXPRESSION_OPERATOR_CATALOG,
  defaultParamsForOperator,
  operatorDefinition,
} from '../rule-expression-builder/rule-expression-operators';

export interface RuleFlowNodeDataChange {
  nodeId: string;
  data: Record<string, unknown>;
}

@Component({
  selector: 'app-rule-flow-inspector',
  standalone: false,
  templateUrl: './rule-flow-inspector.component.html',
  styleUrls: ['./rule-flow-inspector.component.css'],
})
export class RuleFlowInspectorComponent {
  @Input() node!: FlowNode;
  @Input() indicatorConfigs: IndicatorConfigResponse[] = [];
  @Input() ruleConfigs: RuleConfigResponse[] = [];
  @Input() currentRuleId: string | null = null;

  @Output() readonly nodeDataChange = new EventEmitter<RuleFlowNodeDataChange>();

  readonly operatorOptions = RULE_EXPRESSION_OPERATOR_CATALOG.map(op => ({ label: op.label, value: op.value }));
  readonly groupOperatorOptions = [
    { label: 'AND', value: 'AND' },
    { label: 'OR', value: 'OR' },
    { label: 'XOR', value: 'XOR' },
  ];

  get nodeType(): string {
    return this.node?.type ?? '';
  }

  get nodeData(): Record<string, unknown> {
    return this.node?.data ?? {};
  }

  get operator(): string | null {
    return (this.nodeData['operator'] as string) ?? null;
  }

  get groupOperator(): string {
    return (this.nodeData['operator'] as string) ?? 'AND';
  }

  get ruleCode(): string {
    return (this.nodeData['ruleCode'] as string) ?? '';
  }

  get operand(): RuleExpressionOperand | null {
    return (this.nodeData['operand'] as RuleExpressionOperand) ?? null;
  }

  get operandLabel(): string {
    return (this.nodeData['label'] as string) ?? '';
  }

  get conditionQuickParams() {
    return operatorDefinition(this.operator as RuleExpressionConditionOperator)?.quickParams ?? [];
  }

  get conditionParams(): Record<string, unknown> {
    return (this.nodeData['params'] as Record<string, unknown>) ?? {};
  }

  get conditionSlots(): Array<{ index: number; label: string; allowedValueTypes: string[] }> {
    const slots = operatorDefinition(this.operator as RuleExpressionConditionOperator)?.slots ?? [];
    return slots.map((slot, index) => ({
      index,
      label: slot.label,
      allowedValueTypes: slot.allowedValueTypes,
    }));
  }

  get conditionOperands(): RuleExpressionOperand[] {
    return (this.nodeData['operands'] as RuleExpressionOperand[]) ?? [];
  }

  conditionOperand(index: number): RuleExpressionOperand | null {
    return this.conditionOperands[index] ?? null;
  }

  get ruleRefOptions(): Array<{ label: string; value: string }> {
    return this.ruleConfigs
      .filter(r => r.id !== this.currentRuleId)
      .map(r => ({ label: r.code, value: r.code }));
  }

  onGroupOperatorChange(value: unknown): void {
    this.emitChange({ operator: value });
  }

  onConditionOperatorChange(value: unknown): void {
    const operator = typeof value === 'string' && value
      ? value as RuleExpressionConditionOperator
      : null;
    const slots = operatorDefinition(operator)?.slots ?? [];
    const operands = this.conditionOperands.slice(0, slots.length);
    while (operands.length < slots.length) {
      operands.push({ type: 'constant', value: null });
    }

    this.emitChange({
      operator,
      operands,
      params: defaultParamsForOperator(operator),
    });
  }

  onQuickParamChange(key: string, value: unknown): void {
    const params = { ...this.conditionParams, [key]: value };
    this.emitChange({ params });
  }

  onConditionOperandChange(index: number, operand: RuleExpressionOperand): void {
    const operands = [...this.conditionOperands];
    while (operands.length <= index) {
      operands.push({ type: 'constant', value: null });
    }
    operands[index] = operand;
    this.emitChange({ operands });
  }

  onOperandChange(operand: RuleExpressionOperand): void {
    this.emitChange({ operand });
  }

  onRuleCodeChange(value: unknown): void {
    this.emitChange({ ruleCode: value });
  }

  onLabelChange(value: string | null): void {
    this.emitChange({ label: value ?? '' });
  }

  private emitChange(partial: Record<string, unknown>): void {
    this.nodeDataChange.emit({
      nodeId: this.node.id,
      data: { ...this.nodeData, ...partial },
    });
  }
}
