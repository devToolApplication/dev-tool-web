import { Component, Input, computed, signal } from '@angular/core';
import { TagSeverity } from '../../../../../shared/component/tag/tag';

interface RuleTreeRow {
  id: string;
  depth: number;
  code: string;
  operator: string;
  status: string;
  severity: TagSeverity;
  message: string;
  indicatorCount: number;
}

@Component({
  selector: 'app-rule-tree-viewer',
  standalone: false,
  templateUrl: './rule-tree-viewer.component.html',
  styleUrl: './rule-tree-viewer.component.css'
})
export class RuleTreeViewerComponent {
  private readonly traceSignal = signal<Record<string, unknown> | null>(null);

  @Input() set trace(value: Record<string, unknown> | null | undefined) {
    this.traceSignal.set(value ?? null);
  }

  readonly rows = computed<RuleTreeRow[]>(() => {
    const trace = this.traceSignal();
    return trace ? flattenTrace(trace) : [];
  });
}

function flattenTrace(node: Record<string, unknown>, depth = 0, rows: RuleTreeRow[] = []): RuleTreeRow[] {
  const statusValue = node['passed'] ?? node['satisfied'] ?? node['result'] ?? node['entry'];
  const passed = statusValue === true || String(statusValue).toUpperCase() === 'PASSED';
  const failed = statusValue === false || String(statusValue).toUpperCase() === 'FAILED';
  const children = childNodes(node);
  rows.push({
    id: String(node['ruleId'] ?? node['id'] ?? node['code'] ?? `${depth}-${rows.length}`),
    depth,
    code: String(node['ruleCode'] ?? node['code'] ?? node['name'] ?? node['ruleName'] ?? '-'),
    operator: String(node['operator'] ?? node['executor'] ?? '-'),
    status: passed ? 'tradeBot.ruleTrace.passed' : failed ? 'tradeBot.ruleTrace.failed' : 'tradeBot.ruleTrace.unknown',
    severity: passed ? 'success' : failed ? 'danger' : 'secondary',
    message: String(node['message'] ?? node['reason'] ?? ''),
    indicatorCount: indicatorCount(node)
  });
  children.forEach((child) => flattenTrace(child, depth + 1, rows));
  return rows;
}

function childNodes(node: Record<string, unknown>): Record<string, unknown>[] {
  const children = node['children'] ?? node['childRules'] ?? node['childResults'];
  return Array.isArray(children) ? children.filter(isRecord) : [];
}

function indicatorCount(node: Record<string, unknown>): number {
  const indicatorValues = node['indicatorValues'] ?? node['indicators'];
  if (Array.isArray(indicatorValues)) {
    return indicatorValues.length;
  }
  if (isRecord(indicatorValues)) {
    return Object.keys(indicatorValues).length;
  }
  return 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
