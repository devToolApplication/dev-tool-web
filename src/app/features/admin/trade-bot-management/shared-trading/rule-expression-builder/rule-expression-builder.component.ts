import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, computed, signal } from '@angular/core';
import { IndicatorConfigResponse, RuleConfigResponse } from '../../data-access/models/trading-system.model';
import {
  addRuleExpressionChild,
  cloneRuleLogicValue,
  createRuleExpressionCondition,
  createRuleExpressionGroup,
  createRuleExpressionNode,
  createRuleExpressionNot,
  createRuleExpressionRuleRef,
  duplicateRuleExpressionNode,
  findRuleExpressionNode,
  normalizeRuleLogicValue,
  removeRuleExpressionNode,
  replaceRuleExpressionNode,
  wrapRuleExpressionNode
} from './rule-expression-factory';
import { extractRuleExpressionDependencies } from './rule-expression-dependencies';
import {
  RuleExpressionDependencySummary,
  RuleExpressionGroupOperator,
  RuleExpressionNode,
  RuleExpressionNodeType,
  RuleExpressionValidationResult,
  RuleLogicFormValue
} from './rule-expression.models';
import { printRuleExpression } from './rule-expression-printer';
import { validateRuleExpression } from './rule-expression-validator';

const EMPTY_VALIDATION: RuleExpressionValidationResult = {
  valid: false,
  issues: [{ message: 'tradeBot.ruleExpression.validation.rootRequired', severity: 'error' }],
  errors: [{ message: 'tradeBot.ruleExpression.validation.rootRequired', severity: 'error' }],
  warnings: []
};

@Component({
  selector: 'app-rule-expression-builder',
  standalone: false,
  templateUrl: './rule-expression-builder.component.html',
  styleUrl: './rule-expression-builder.component.css'
})
export class RuleExpressionBuilderComponent implements OnChanges {
  @Input() value: RuleLogicFormValue | null | undefined;
  @Input() indicatorConfigs: IndicatorConfigResponse[] = [];
  @Input() ruleConfigs: RuleConfigResponse[] = [];
  @Input() currentRuleCode: string | null = null;
  @Input() currentRuleId: string | null = null;
  @Input() readonly = false;
  @Input() disabled = false;

  @Output() readonly valueChange = new EventEmitter<RuleLogicFormValue>();
  @Output() readonly validationChange = new EventEmitter<RuleExpressionValidationResult>();

  readonly expression = signal<RuleLogicFormValue>({ root: null });
  readonly selectedNodeId = signal<string | null>(null);
  readonly validation = signal<RuleExpressionValidationResult>(EMPTY_VALIDATION);

  readonly preview = computed(() => printRuleExpression(this.expression()));
  readonly dependencies = computed<RuleExpressionDependencySummary>(() => extractRuleExpressionDependencies(this.expression()));
  readonly selectedNode = computed(() => findRuleExpressionNode(this.expression().root, this.selectedNodeId()));

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) {
      const normalized = normalizeRuleLogicValue(this.value);
      this.expression.set(normalized);
      if (!findRuleExpressionNode(normalized.root, this.selectedNodeId())) {
        this.selectedNodeId.set(normalized.root?.id ?? null);
      }
    }
    this.revalidate();
  }

  get readonlyOrDisabled(): boolean {
    return this.readonly || this.disabled;
  }

  addCondition(): void {
    this.insertNode(createRuleExpressionCondition());
  }

  addRuleRef(): void {
    this.insertNode(createRuleExpressionRuleRef(this.defaultRuleCode()));
  }

  addGroup(operator: RuleExpressionGroupOperator): void {
    if (this.readonlyOrDisabled) {
      return;
    }

    const root = this.expression().root;
    const selectedId = this.selectedNodeId();
    if (root && selectedId) {
      const next = wrapRuleExpressionNode(root, selectedId, 'group', operator);
      this.commit(next, next ? findRuleExpressionNode(next, selectedId)?.id ?? selectedId : selectedId);
      return;
    }

    this.insertNode(createRuleExpressionGroup(operator));
  }

  addNot(): void {
    if (this.readonlyOrDisabled) {
      return;
    }

    const root = this.expression().root;
    const selectedId = this.selectedNodeId();
    if (root && selectedId) {
      const next = wrapRuleExpressionNode(root, selectedId, 'not');
      this.commit(next, selectedId);
      return;
    }

    this.insertNode(createRuleExpressionNot());
  }

  clearExpression(): void {
    if (this.readonlyOrDisabled) {
      return;
    }
    this.commit(null, null);
  }

  onNodeChange(node: RuleExpressionNode): void {
    const next = replaceRuleExpressionNode(this.expression().root, node.id, node);
    this.commit(next, node.id);
  }

  onAddChild(event: { parentId: string; type: RuleExpressionNodeType }): void {
    const child = event.type === 'ruleRef'
      ? createRuleExpressionRuleRef(this.defaultRuleCode())
      : createRuleExpressionNode(event.type);
    const next = addRuleExpressionChild(this.expression().root, event.parentId, child);
    this.commit(next, child.id);
  }

  onRemoveNode(nodeId: string): void {
    const next = removeRuleExpressionNode(this.expression().root, nodeId);
    this.commit(next, next?.id ?? null);
  }

  onDuplicateNode(nodeId: string): void {
    const root = this.expression().root;
    const target = findRuleExpressionNode(root, nodeId);
    if (!target) {
      return;
    }
    this.insertNode(duplicateRuleExpressionNode(target));
  }

  onToggleDisabled(nodeId: string): void {
    const target = findRuleExpressionNode(this.expression().root, nodeId);
    if (!target) {
      return;
    }
    this.onNodeChange({ ...target, disabled: !target.disabled });
  }

  onWrapNode(event: { nodeId: string; wrapperType: 'group' | 'not'; operator?: RuleExpressionGroupOperator }): void {
    const next = wrapRuleExpressionNode(this.expression().root, event.nodeId, event.wrapperType, event.operator ?? 'AND');
    this.commit(next, event.nodeId);
  }

  selectNode(nodeId: string): void {
    this.selectedNodeId.set(nodeId);
  }

  private insertNode(node: RuleExpressionNode): void {
    if (this.readonlyOrDisabled) {
      return;
    }

    const root = this.expression().root;
    if (!root) {
      this.commit(node, node.id);
      return;
    }

    const selected = findRuleExpressionNode(root, this.selectedNodeId());
    if (selected && (selected.type === 'group' || selected.type === 'not')) {
      this.commit(addRuleExpressionChild(root, selected.id, node), node.id);
      return;
    }

    if (root.type === 'group') {
      this.commit(addRuleExpressionChild(root, root.id, node), node.id);
      return;
    }

    this.commit(createRuleExpressionGroup('AND', [root, node]), node.id);
  }

  private commit(root: RuleExpressionNode | null, selectedNodeId: string | null): void {
    const nextValue = cloneRuleLogicValue({ root });
    this.expression.set(nextValue);
    this.selectedNodeId.set(selectedNodeId);
    this.revalidate();
    this.valueChange.emit(cloneRuleLogicValue(nextValue));
  }

  private revalidate(): RuleExpressionValidationResult {
    const result = validateRuleExpression(this.expression(), {
      indicatorConfigs: this.indicatorConfigs,
      ruleConfigs: this.ruleConfigs,
      currentRuleCode: this.currentRuleCode,
      currentRuleId: this.currentRuleId
    });
    this.validation.set(result);
    this.validationChange.emit(result);
    return result;
  }

  private defaultRuleCode(): string {
    return this.ruleConfigs
      .filter((item) => item.id !== this.currentRuleId)
      .filter((item) => item.status !== 'INACTIVE' && item.status !== 'DISABLED')
      .sort((a, b) => a.code.localeCompare(b.code))[0]?.code ?? '';
  }
}
