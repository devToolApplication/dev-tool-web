import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { IndicatorConfigResponse, RuleConfigResponse } from '../../data-access/models/trading-system.model';
import {
  RuleExpressionConditionNode,
  RuleExpressionGroupNode,
  RuleExpressionGroupOperator,
  RuleExpressionNode,
  RuleExpressionNodeType,
  RuleExpressionRuleRefNode,
  RuleExpressionValidationIssue
} from './rule-expression.models';
import { printRuleExpressionOperand } from './rule-expression-printer';

@Component({
  selector: 'app-rule-expression-node',
  standalone: false,
  templateUrl: './rule-expression-node.component.html',
  styleUrl: './rule-expression-builder.component.css'
})
export class RuleExpressionNodeComponent {
  @Input({ required: true }) node!: RuleExpressionNode;
  @Input() selectedNodeId: string | null = null;
  @Input() issues: RuleExpressionValidationIssue[] = [];
  @Input() indicatorConfigs: IndicatorConfigResponse[] = [];
  @Input() ruleConfigs: RuleConfigResponse[] = [];
  @Input() currentRuleId: string | null = null;
  @Input() readonly = false;
  @Input() disabled = false;

  @Output() readonly selectNode = new EventEmitter<string>();
  @Output() readonly nodeChange = new EventEmitter<RuleExpressionNode>();
  @Output() readonly addChild = new EventEmitter<{
    parentId: string;
    type: RuleExpressionNodeType;
    operator?: RuleExpressionGroupOperator;
  }>();
  @Output() readonly removeNode = new EventEmitter<string>();
  @Output() readonly duplicateNode = new EventEmitter<string>();
  @Output() readonly toggleDisabled = new EventEmitter<string>();
  @Output() readonly wrapNode = new EventEmitter<{
    nodeId: string;
    wrapperType: 'group' | 'not';
    operator?: RuleExpressionGroupOperator;
  }>();

  readonly moreOpen = signal(false);
  readonly collapsed = signal(false);

  conditionLabel(node: RuleExpressionConditionNode): string {
    const op = node.operator ?? '?';
    const left = node.operands[0] ? printRuleExpressionOperand(node.operands[0]) : '?';
    const right = node.operands[1] ? printRuleExpressionOperand(node.operands[1]) : '?';
    return `${left} ${op} ${right}`;
  }

  nodeLabel(node: RuleExpressionNode): string {
    switch (node.type) {
      case 'group':
        return (node as RuleExpressionGroupNode).operator;
      case 'not':
        return 'NOT';
      case 'ruleRef':
        return `Rule: ${(node as RuleExpressionRuleRefNode).ruleCode || '?'}`;
      default:
        return node.type;
    }
  }

  readonly groupOperatorOptions: Array<{ label: string; value: RuleExpressionGroupOperator }> = [
    { label: 'tradeBot.ruleExpression.group.AND', value: 'AND' },
    { label: 'tradeBot.ruleExpression.group.OR', value: 'OR' },
    { label: 'tradeBot.ruleExpression.group.XOR', value: 'XOR' }
  ];

  get selected(): boolean {
    return this.node.id === this.selectedNodeId;
  }

  get readonlyOrDisabled(): boolean {
    return this.readonly || this.disabled;
  }

  children(node: RuleExpressionNode): RuleExpressionNode[] {
    return node.type === 'group' || node.type === 'not' ? node.children : [];
  }

  groupNode(node: RuleExpressionNode): RuleExpressionGroupNode {
    return node as RuleExpressionGroupNode;
  }

  ruleRefNode(node: RuleExpressionNode): RuleExpressionRuleRefNode {
    return node as RuleExpressionRuleRefNode;
  }

  nodeIssues(node: RuleExpressionNode): RuleExpressionValidationIssue[] {
    return this.issues.filter((issue) => issue.nodeId === node.id);
  }

  groupDescription(operator: RuleExpressionGroupOperator): string {
    return `tradeBot.ruleExpression.groupDescription.${operator}`;
  }

  canAddChild(node: RuleExpressionNode): boolean {
    if (node.type === 'group') {
      return true;
    }
    return node.type === 'not' && node.children.filter((child) => !child.disabled).length === 0;
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

  select(): void {
    this.selectNode.emit(this.node.id);
  }

  add(type: RuleExpressionNodeType, operator?: RuleExpressionGroupOperator): void {
    if (!this.readonlyOrDisabled) {
      this.addChild.emit({ parentId: this.node.id, type, operator });
    }
  }

  updateGroupOperator(node: RuleExpressionGroupNode, value: unknown): void {
    if (this.isGroupOperator(value)) {
      this.nodeChange.emit({ ...node, operator: value });
    }
  }

  updateRuleCode(node: RuleExpressionRuleRefNode, value: unknown): void {
    this.nodeChange.emit({ ...node, ruleCode: typeof value === 'string' ? value : '' });
  }

  toggleMore(): void {
    if (!this.readonlyOrDisabled) {
      this.moreOpen.update((value) => !value);
    }
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

  remove(): void {
    if (!this.readonlyOrDisabled) {
      this.removeNode.emit(this.node.id);
      this.moreOpen.set(false);
    }
  }

  duplicate(): void {
    if (!this.readonlyOrDisabled) {
      this.duplicateNode.emit(this.node.id);
      this.moreOpen.set(false);
    }
  }

  toggle(): void {
    if (!this.readonlyOrDisabled) {
      this.toggleDisabled.emit(this.node.id);
      this.moreOpen.set(false);
    }
  }

  private isGroupOperator(value: unknown): value is RuleExpressionGroupOperator {
    return value === 'AND' || value === 'OR' || value === 'XOR';
  }
}
