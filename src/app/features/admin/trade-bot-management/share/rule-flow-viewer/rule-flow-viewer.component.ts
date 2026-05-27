import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { RuleFlowTraceStatus } from '../rule-flow-editor/rule-flow-editor.models';
import { RuleLogicFormValue } from '../rule-expression-builder/rule-expression.models';

@Component({
  selector: 'app-rule-flow-viewer',
  standalone: false,
  templateUrl: './rule-flow-viewer.component.html',
  styleUrl: './rule-flow-viewer.component.css',
})
export class RuleFlowViewerComponent implements OnChanges {
  @Input() trace: Record<string, unknown> | null | undefined;
  @Input() ruleLogic: RuleLogicFormValue | null | undefined;

  traceStatuses: RuleFlowTraceStatus[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['trace']) {
      this.traceStatuses = this.trace ? extractTraceStatuses(this.trace) : [];
    }
  }
}

function extractTraceStatuses(node: Record<string, unknown>, result: RuleFlowTraceStatus[] = []): RuleFlowTraceStatus[] {
  const id = String(node['ruleId'] ?? node['id'] ?? node['code'] ?? '');
  if (id) {
    result.push({
      nodeId: id,
      status: resolveStatus(node),
      message: String(node['message'] ?? node['reason'] ?? ''),
    });
  }

  const children = node['children'] ?? node['childRules'] ?? node['childResults'] ?? node['rules'] ?? node['results'];
  if (Array.isArray(children)) {
    for (const child of children) {
      if (typeof child === 'object' && child !== null) {
        extractTraceStatuses(child as Record<string, unknown>, result);
      }
    }
  }

  return result;
}

function resolveStatus(node: Record<string, unknown>): 'passed' | 'failed' | 'unknown' {
  const value = node['passed'] ?? node['satisfied'] ?? node['result'] ?? node['entry'] ?? node['status'];
  const token = String(value ?? '').trim().toLowerCase();

  if (value === true || ['passed', 'pass', 'true', 'success', 'satisfied'].includes(token)) {
    return 'passed';
  }
  if (value === false || ['failed', 'fail', 'false', 'error', 'rejected', 'unsatisfied'].includes(token)) {
    return 'failed';
  }
  return 'unknown';
}
