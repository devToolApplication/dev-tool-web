import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { IndicatorConfigResponse, RuleConfigResponse } from '../../data-access/models/trading-system.model';
import { createConstantOperand } from './rule-expression-factory';
import {
  RuleExpressionConditionNode,
  RuleExpressionConditionOperator,
  RuleExpressionGroupOperator,
  RuleExpressionOperand,
  RuleExpressionValidationIssue
} from './rule-expression.models';
import {
  RULE_EXPRESSION_OPERATOR_CATALOG,
  RuleExpressionOperatorSlot,
  RuleExpressionQuickParamDefinition,
  operandValueTypes,
  operatorDefinition
} from './rule-expression-operators';

@Component({
  selector: 'app-rule-condition-row',
  standalone: false,
  templateUrl: './rule-condition-row.component.html',
  styleUrl: './rule-expression-builder.component.css'
})
export class RuleConditionRowComponent {
  @Input({ required: true }) node!: RuleExpressionConditionNode;
  @Input() selectedNodeId: string | null = null;
  @Input() issues: RuleExpressionValidationIssue[] = [];
  @Input() indicatorConfigs: IndicatorConfigResponse[] = [];
  @Input() ruleConfigs: RuleConfigResponse[] = [];
  @Input() currentRuleId: string | null = null;
  @Input() readonly = false;
  @Input() disabled = false;

  @Output() readonly selectNode = new EventEmitter<string>();
  @Output() readonly nodeChange = new EventEmitter<RuleExpressionConditionNode>();
  @Output() readonly removeNode = new EventEmitter<string>();
  @Output() readonly duplicateNode = new EventEmitter<string>();
  @Output() readonly toggleDisabled = new EventEmitter<string>();
  @Output() readonly wrapNode = new EventEmitter<{
    nodeId: string;
    wrapperType: 'group' | 'not';
    operator?: RuleExpressionGroupOperator;
  }>();

  readonly moreOpen = signal(false);
  readonly operatorOptions = RULE_EXPRESSION_OPERATOR_CATALOG.map((item) => ({
    label: item.label,
    value: item.value
  }));

  get selected(): boolean {
    return this.node.id === this.selectedNodeId;
  }

  get readonlyOrDisabled(): boolean {
    return this.readonly || this.disabled;
  }

  slots(): RuleExpressionOperatorSlot[] {
    return operatorDefinition(this.node.operator)?.slots ?? [];
  }

  quickParams(): RuleExpressionQuickParamDefinition[] {
    return operatorDefinition(this.node.operator)?.quickParams ?? [];
  }

  operandAt(index: number): RuleExpressionOperand | null {
    return this.node.operands[index] ?? null;
  }

  nodeIssues(): RuleExpressionValidationIssue[] {
    return this.issues.filter((issue) => issue.nodeId === this.node.id);
  }

  select(): void {
    this.selectNode.emit(this.node.id);
  }

  toggleMore(): void {
    if (this.readonlyOrDisabled) {
      return;
    }
    this.moreOpen.update((value) => !value);
  }

  updateOperator(value: unknown): void {
    if (!this.isConditionOperator(value)) {
      return;
    }
    const definition = operatorDefinition(value);
    const operands = (definition?.slots ?? []).flatMap((slot, index) => {
      const current = this.node.operands[index];
      if (current && this.operandCompatible(current, slot)) {
        return [current];
      }
      const fallback = slot.name === 'min'
        ? createConstantOperand(0)
        : slot.name === 'max'
          ? createConstantOperand(1)
          : null;
      return fallback ? [fallback] : [];
    });
    this.emitChange({
      ...this.node,
      operator: value,
      operands,
      params: this.paramsWithQuickDefaults(value, this.node.params)
    });
  }

  updateOperand(index: number, operand: RuleExpressionOperand): void {
    const operands = [...this.node.operands];
    operands[index] = operand;
    this.emitChange({ ...this.node, operands });
  }

  quickParamValue(param: RuleExpressionQuickParamDefinition): number | string | boolean | null {
    const value = this.node.params?.[param.key] ?? param.defaultValue;
    if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') {
      return value;
    }
    return null;
  }

  updateQuickParam(param: RuleExpressionQuickParamDefinition, value: number | string | boolean | null): void {
    const nextValue = value ?? param.defaultValue;
    this.emitChange({
      ...this.node,
      params: {
        ...(this.node.params ?? {}),
        [param.key]: nextValue
      }
    });
  }

  wrap(operator: RuleExpressionGroupOperator): void {
    if (!this.readonlyOrDisabled) {
      this.wrapNode.emit({ nodeId: this.node.id, wrapperType: 'group', operator });
      this.moreOpen.set(false);
    }
  }

  wrapNot(): void {
    if (!this.readonlyOrDisabled) {
      this.wrapNode.emit({ nodeId: this.node.id, wrapperType: 'not' });
      this.moreOpen.set(false);
    }
  }

  duplicate(): void {
    if (!this.readonlyOrDisabled) {
      this.duplicateNode.emit(this.node.id);
      this.moreOpen.set(false);
    }
  }

  requestToggleDisabled(): void {
    if (!this.readonlyOrDisabled) {
      this.toggleDisabled.emit(this.node.id);
      this.moreOpen.set(false);
    }
  }

  remove(): void {
    if (!this.readonlyOrDisabled) {
      this.removeNode.emit(this.node.id);
      this.moreOpen.set(false);
    }
  }

  private emitChange(node: RuleExpressionConditionNode): void {
    if (!this.readonlyOrDisabled) {
      this.nodeChange.emit(node);
    }
  }

  private operandCompatible(operand: RuleExpressionOperand, slot: RuleExpressionOperatorSlot): boolean {
    return operandValueTypes(operand).some((type) => slot.allowedValueTypes.includes(type));
  }

  private paramsWithQuickDefaults(
    operator: RuleExpressionConditionOperator,
    params: Record<string, unknown> | undefined
  ): Record<string, unknown> | undefined {
    const quickParams = operatorDefinition(operator)?.quickParams ?? [];
    if (!quickParams.length) {
      return params;
    }
    return quickParams.reduce<Record<string, unknown>>((next, item) => {
      next[item.key] = next[item.key] ?? item.defaultValue;
      return next;
    }, { ...(params ?? {}) });
  }

  private isConditionOperator(value: unknown): value is RuleExpressionConditionOperator {
    return RULE_EXPRESSION_OPERATOR_CATALOG.some((item) => item.value === value);
  }
}
