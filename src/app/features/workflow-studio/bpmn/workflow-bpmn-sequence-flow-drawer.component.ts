import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

import type {
  JsonValue,
  WorkflowCompareOperator,
  WorkflowCondition,
  WorkflowEdge,
} from '../model/workflow-studio.model';

const OPERATOR_OPTIONS: Array<{ label: string; value: WorkflowCompareOperator }> = [
  { label: 'workflowStudio.bpmn.condition.eq', value: 'EQ' },
  { label: 'workflowStudio.bpmn.condition.ne', value: 'NE' },
  { label: 'workflowStudio.bpmn.condition.gt', value: 'GT' },
  { label: 'workflowStudio.bpmn.condition.gte', value: 'GTE' },
  { label: 'workflowStudio.bpmn.condition.lt', value: 'LT' },
  { label: 'workflowStudio.bpmn.condition.lte', value: 'LTE' },
];

@Component({
  selector: 'app-workflow-bpmn-sequence-flow-drawer',
  standalone: false,
  templateUrl: './workflow-bpmn-sequence-flow-drawer.component.html',
  styleUrl: './workflow-bpmn-node-drawer.component.scss',
})
export class WorkflowBpmnSequenceFlowDrawerComponent implements OnChanges {
  @Input() edge: WorkflowEdge | null = null;
  @Input() readonly = false;
  @Output() readonly edgeChange = new EventEmitter<WorkflowEdge>();

  readonly operatorOptions = OPERATOR_OPTIONS;
  name = '';
  defaultFlow = false;
  leftPath = '';
  operator: WorkflowCompareOperator = 'EQ';
  rightLiteral = '';
  jsonError: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['edge'] || !this.edge) {
      return;
    }
    this.name = this.edge.name ?? '';
    this.defaultFlow = !!this.edge.defaultFlow;
    const compare = this.edge.condition?.type === 'COMPARE' ? this.edge.condition : null;
    this.leftPath = compare?.left.path ?? '';
    this.operator = compare?.operator ?? 'EQ';
    this.rightLiteral = stringify(compare?.right.literal ?? null);
    this.jsonError = null;
  }

  updateName(value: string | null): void {
    this.name = value ?? '';
    this.emit();
  }

  updateDefaultFlow(value: boolean | null): void {
    this.defaultFlow = !!value;
    this.emit();
  }

  updateLeftPath(value: string | null): void {
    this.leftPath = value ?? '';
    this.emit();
  }

  updateOperator(value: string | number | boolean | null): void {
    this.operator = isOperator(value) ? value : 'EQ';
    this.emit();
  }

  updateRightLiteral(value: string | null): void {
    this.rightLiteral = value ?? '';
    this.emit();
  }

  clearCondition(): void {
    this.leftPath = '';
    this.rightLiteral = '';
    this.emit();
  }

  private emit(): void {
    if (!this.edge || this.readonly) {
      return;
    }

    const condition = this.buildCondition();
    if (condition === undefined) {
      this.jsonError = 'workflowStudio.bpmn.drawer.invalidJson';
      return;
    }

    this.jsonError = null;
    this.edgeChange.emit({
      ...this.edge,
      name: this.name,
      defaultFlow: this.defaultFlow,
      condition,
    });
  }

  private buildCondition(): WorkflowCondition | null | undefined {
    if (!this.leftPath.trim() && !this.rightLiteral.trim()) {
      return null;
    }
    const literal = parseJson(this.rightLiteral);
    if (literal === undefined) {
      return undefined;
    }
    return {
      type: 'COMPARE',
      left: { path: this.leftPath.trim() },
      operator: this.operator,
      right: { literal },
    };
  }
}

function isOperator(value: unknown): value is WorkflowCompareOperator {
  return OPERATOR_OPTIONS.some((option) => option.value === value);
}

function stringify(value: JsonValue): string {
  return JSON.stringify(value ?? null);
}

function parseJson(value: string): JsonValue | undefined {
  const text = value.trim();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text) as JsonValue;
  } catch {
    return undefined;
  }
}
