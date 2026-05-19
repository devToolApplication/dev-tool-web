import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  RuleExpressionGroupOperator,
  RuleExpressionNode,
  RuleExpressionNodeType,
  RuleExpressionValidationIssue
} from './rule-expression.models';
import { printRuleExpressionNode } from './rule-expression-printer';

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
  @Input() readonly = false;
  @Input() disabled = false;

  @Output() readonly selectNode = new EventEmitter<string>();
  @Output() readonly addChild = new EventEmitter<{ parentId: string; type: RuleExpressionNodeType }>();
  @Output() readonly removeNode = new EventEmitter<string>();
  @Output() readonly duplicateNode = new EventEmitter<string>();
  @Output() readonly toggleDisabled = new EventEmitter<string>();
  @Output() readonly wrapNode = new EventEmitter<{ nodeId: string; wrapperType: 'group' | 'not'; operator?: RuleExpressionGroupOperator }>();

  get selected(): boolean {
    return this.node.id === this.selectedNodeId;
  }

  get readonlyOrDisabled(): boolean {
    return this.readonly || this.disabled;
  }

  children(node: RuleExpressionNode): RuleExpressionNode[] {
    return node.type === 'group' || node.type === 'not' ? node.children : [];
  }

  canHaveChildren(node: RuleExpressionNode): boolean {
    return node.type === 'group' || node.type === 'not';
  }

  title(node: RuleExpressionNode): string {
    if (node.type === 'group') {
      return node.operator;
    }
    if (node.type === 'not') {
      return 'NOT';
    }
    if (node.type === 'ruleRef') {
      return node.ruleCode || 'RULE(?)';
    }
    return node.operator ?? 'CONDITION';
  }

  subtitle(node: RuleExpressionNode): string {
    return printRuleExpressionNode(node) || 'tradeBot.ruleExpression.disabledPreview';
  }

  nodeIssues(node: RuleExpressionNode): RuleExpressionValidationIssue[] {
    return this.issues.filter((issue) => issue.nodeId === node.id);
  }

  select(): void {
    this.selectNode.emit(this.node.id);
  }

  add(type: RuleExpressionNodeType): void {
    if (!this.readonlyOrDisabled) {
      this.addChild.emit({ parentId: this.node.id, type });
    }
  }

  remove(): void {
    if (!this.readonlyOrDisabled) {
      this.removeNode.emit(this.node.id);
    }
  }

  duplicate(): void {
    if (!this.readonlyOrDisabled) {
      this.duplicateNode.emit(this.node.id);
    }
  }

  toggle(): void {
    if (!this.readonlyOrDisabled) {
      this.toggleDisabled.emit(this.node.id);
    }
  }

  wrapNot(): void {
    if (!this.readonlyOrDisabled) {
      this.wrapNode.emit({ nodeId: this.node.id, wrapperType: 'not' });
    }
  }

  wrapAnd(): void {
    if (!this.readonlyOrDisabled) {
      this.wrapNode.emit({ nodeId: this.node.id, wrapperType: 'group', operator: 'AND' });
    }
  }
}

