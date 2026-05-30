import { Component, Input, computed, signal } from '@angular/core';
import { TagSeverity } from '../../../../../shared/component/tag/tag';

type RuleTraceStatus = 'passed' | 'failed' | 'unknown';
type RuleTraceStatusFilter = 'all' | RuleTraceStatus;

interface RuleTreeRow {
  key: string;
  id: string;
  parentKey: string | null;
  depth: number;
  childCount: number;
  code: string;
  operator: string;
  status: RuleTraceStatus;
  statusLabel: string;
  severity: TagSeverity;
  message: string;
  value: string;
  indicatorCount: number;
  pathLabel: string;
  searchableText: string;
}

interface RuleTreeSummary {
  total: number;
  passed: number;
  failed: number;
  unknown: number;
  maxDepth: number;
}

interface RuleTreeSummaryItem {
  label: string;
  value: number;
  tone: RuleTraceStatus | 'total';
}

@Component({
  selector: 'app-rule-tree-viewer',
  standalone: false,
  templateUrl: './rule-tree-viewer.component.html',
  styleUrl: './rule-tree-viewer.component.css'
})
export class RuleTreeViewerComponent {
  private readonly traceSignal = signal<Record<string, unknown> | null>(null);
  private readonly expandedKeys = signal<ReadonlySet<string>>(new Set<string>());

  @Input() set trace(value: Record<string, unknown> | null | undefined) {
    const trace = value ? unwrapTrace(value) : null;
    const rows = trace ? flattenTrace(trace) : [];

    this.traceSignal.set(trace);
    this.expandedKeys.set(new Set(defaultExpandedKeys(rows)));
    this.query.set('');
    this.statusFilter.set('all');
  }

  readonly query = signal('');
  readonly statusFilter = signal<RuleTraceStatusFilter>('all');
  readonly statusFilterOptions: Array<{ label: string; value: RuleTraceStatusFilter }> = [
    { label: 'tradeBot.ruleTrace.filter.all', value: 'all' },
    { label: 'tradeBot.ruleTrace.filter.failed', value: 'failed' },
    { label: 'tradeBot.ruleTrace.filter.passed', value: 'passed' },
    { label: 'tradeBot.ruleTrace.filter.unknown', value: 'unknown' }
  ];

  readonly rows = computed<RuleTreeRow[]>(() => {
    const trace = this.traceSignal();
    return trace ? flattenTrace(trace) : [];
  });

  readonly summary = computed<RuleTreeSummary>(() => summarizeRows(this.rows()));

  readonly summaryItems = computed<RuleTreeSummaryItem[]>(() => {
    const summary = this.summary();
    return [
      { label: 'tradeBot.ruleTrace.total', value: summary.total, tone: 'total' },
      { label: 'tradeBot.ruleTrace.failedCount', value: summary.failed, tone: 'failed' },
      { label: 'tradeBot.ruleTrace.passedCount', value: summary.passed, tone: 'passed' },
      { label: 'tradeBot.ruleTrace.unknownCount', value: summary.unknown, tone: 'unknown' },
      { label: 'tradeBot.ruleTrace.depth', value: summary.maxDepth, tone: 'total' }
    ];
  });

  readonly visibleRows = computed<RuleTreeRow[]>(() =>
    visibleRows(this.rows(), this.expandedKeys(), this.query(), this.statusFilter())
  );

  isExpanded(key: string): boolean {
    return this.expandedKeys().has(key);
  }

  toggle(key: string): void {
    const next = new Set(this.expandedKeys());
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    this.expandedKeys.set(next);
  }

  updateQuery(value: string | null | undefined): void {
    this.query.set(value ?? '');
  }

  updateStatusFilter(value: unknown): void {
    const next = String(value ?? 'all');
    if (isStatusFilter(next)) {
      this.statusFilter.set(next);
    }
  }

  expandAll(): void {
    this.expandedKeys.set(new Set(this.rows().filter((row) => row.childCount > 0).map((row) => row.key)));
  }

  collapseAll(): void {
    this.expandedKeys.set(new Set<string>());
  }

  focusFailures(): void {
    const rows = this.rows();
    const failedRows = rows.filter((row) => row.status === 'failed');
    if (!failedRows.length) {
      return;
    }

    this.query.set('');
    this.statusFilter.set('failed');
    this.expandedKeys.set(new Set(contextExpandedKeys(rows, failedRows.map((row) => row.key))));
  }
}

function flattenTrace(
  node: Record<string, unknown>,
  depth = 0,
  parentKey: string | null = null,
  rows: RuleTreeRow[] = [],
  path: string[] = []
): RuleTreeRow[] {
  const children = childNodes(node);
  const code = textValue(node['ruleCode'] ?? node['code'] ?? node['name'] ?? node['ruleName']);
  const operator = textValue(node['operator'] ?? node['executor']);
  const status = resolveStatus(node);
  const key = `${parentKey ?? 'root'}:${rows.length}:${textValue(node['ruleId'] ?? node['id'] ?? code, 'node')}`;
  const message = messageValue(node['message'] ?? node['reason'] ?? node['error']);
  const value = traceValue(node);
  const pathLabel = [...path, code].join(' / ');

  rows.push({
    key,
    id: textValue(node['ruleId'] ?? node['id'] ?? node['code'] ?? `${depth}-${rows.length}`),
    parentKey,
    depth,
    childCount: children.length,
    code,
    operator,
    status,
    statusLabel: statusLabel(status),
    severity: statusSeverity(status),
    message,
    value,
    indicatorCount: indicatorCount(node),
    pathLabel,
    searchableText: normalizeText([code, operator, status, value, message, pathLabel].join(' '))
  });

  children.forEach((child) => flattenTrace(child, depth + 1, key, rows, [...path, code]));
  return rows;
}

function childNodes(node: Record<string, unknown>): Record<string, unknown>[] {
  const children = node['children'] ?? node['childRules'] ?? node['childResults'] ?? node['rules'] ?? node['results'];
  return Array.isArray(children) ? children.filter(isRecord) : [];
}

function unwrapTrace(node: Record<string, unknown>): Record<string, unknown> {
  if (hasRuleIdentity(node)) {
    return node;
  }

  const nested = node['ruleTrace'] ?? node['trace'] ?? node['rule'];
  return isRecord(nested) ? nested : node;
}

function hasRuleIdentity(node: Record<string, unknown>): boolean {
  return [
    'ruleId',
    'id',
    'ruleCode',
    'code',
    'name',
    'ruleName',
    'operator',
    'executor',
    'passed',
    'satisfied',
    'result',
    'entry'
  ].some((key) => key in node);
}

function resolveStatus(node: Record<string, unknown>): RuleTraceStatus {
  const statusValue = node['passed'] ?? node['satisfied'] ?? node['result'] ?? node['entry'] ?? node['status'];
  const statusToken = normalizeText(String(statusValue ?? ''));

  if (statusValue === true || ['passed', 'pass', 'true', 'success', 'satisfied'].includes(statusToken)) {
    return 'passed';
  }
  if (statusValue === false || ['failed', 'fail', 'false', 'error', 'rejected', 'unsatisfied'].includes(statusToken)) {
    return 'failed';
  }
  return 'unknown';
}

function statusLabel(status: RuleTraceStatus): string {
  return `tradeBot.ruleTrace.${status}`;
}

function statusSeverity(status: RuleTraceStatus): TagSeverity {
  if (status === 'passed') {
    return 'success';
  }
  if (status === 'failed') {
    return 'danger';
  }
  return 'secondary';
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

function summarizeRows(rows: RuleTreeRow[]): RuleTreeSummary {
  return rows.reduce<RuleTreeSummary>(
    (summary, row) => ({
      total: summary.total + 1,
      passed: summary.passed + (row.status === 'passed' ? 1 : 0),
      failed: summary.failed + (row.status === 'failed' ? 1 : 0),
      unknown: summary.unknown + (row.status === 'unknown' ? 1 : 0),
      maxDepth: Math.max(summary.maxDepth, row.depth + 1)
    }),
    { total: 0, passed: 0, failed: 0, unknown: 0, maxDepth: 0 }
  );
}

function visibleRows(
  rows: RuleTreeRow[],
  expandedKeys: ReadonlySet<string>,
  query: string,
  statusFilter: RuleTraceStatusFilter
): RuleTreeRow[] {
  const normalizedQuery = normalizeText(query);
  const hasQuery = normalizedQuery.length > 0;
  const hasStatusFilter = statusFilter !== 'all';
  const byKey = indexRows(rows);

  if (!hasQuery && !hasStatusFilter) {
    return rows.filter((row) => ancestorsExpanded(row, byKey, expandedKeys));
  }

  const matchedKeys = new Set(
    rows
      .filter((row) => (!hasStatusFilter || row.status === statusFilter) && (!hasQuery || row.searchableText.includes(normalizedQuery)))
      .map((row) => row.key)
  );

  if (!matchedKeys.size) {
    return [];
  }

  const visibleKeys = new Set<string>();
  matchedKeys.forEach((key) => addRowAndAncestors(key, byKey, visibleKeys));

  if (hasQuery) {
    rows.forEach((row) => {
      if (hasMatchedAncestor(row, matchedKeys, byKey)) {
        visibleKeys.add(row.key);
      }
    });
  }

  return rows.filter((row) => visibleKeys.has(row.key));
}

function ancestorsExpanded(row: RuleTreeRow, byKey: Map<string, RuleTreeRow>, expandedKeys: ReadonlySet<string>): boolean {
  let parentKey = row.parentKey;
  while (parentKey) {
    if (!expandedKeys.has(parentKey)) {
      return false;
    }
    parentKey = byKey.get(parentKey)?.parentKey ?? null;
  }
  return true;
}

function defaultExpandedKeys(rows: RuleTreeRow[]): string[] {
  const rootAndFirstLevel = rows.filter((row) => row.childCount > 0 && row.depth <= 1).map((row) => row.key);
  const failedKeys = rows.filter((row) => row.status === 'failed').map((row) => row.key);
  return [...new Set([...rootAndFirstLevel, ...contextExpandedKeys(rows, failedKeys)])];
}

function contextExpandedKeys(rows: RuleTreeRow[], keys: string[]): string[] {
  const byKey = indexRows(rows);
  const expanded = new Set<string>();
  keys.forEach((key) => {
    let current = byKey.get(key) ?? null;
    while (current) {
      if (current.childCount > 0) {
        expanded.add(current.key);
      }
      current = current.parentKey ? byKey.get(current.parentKey) ?? null : null;
    }
  });
  return [...expanded];
}

function addRowAndAncestors(key: string, byKey: Map<string, RuleTreeRow>, target: Set<string>): void {
  let current = byKey.get(key) ?? null;
  while (current) {
    target.add(current.key);
    current = current.parentKey ? byKey.get(current.parentKey) ?? null : null;
  }
}

function hasMatchedAncestor(
  row: RuleTreeRow,
  matchedKeys: ReadonlySet<string>,
  byKey: Map<string, RuleTreeRow>
): boolean {
  let parentKey = row.parentKey;
  while (parentKey) {
    if (matchedKeys.has(parentKey)) {
      return true;
    }
    parentKey = byKey.get(parentKey)?.parentKey ?? null;
  }
  return false;
}

function indexRows(rows: RuleTreeRow[]): Map<string, RuleTreeRow> {
  return new Map(rows.map((row) => [row.key, row]));
}

function textValue(value: unknown, fallback = '-'): string {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return fallback;
}

function messageValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
}

function traceValue(node: Record<string, unknown>): string {
  const directValue = node['value'];
  if (directValue !== null && directValue !== undefined && directValue !== '') {
    return messageValue(directValue);
  }
  const output = node['output'];
  return isRecord(output) ? messageValue(output['value']) : '';
}

function normalizeText(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function isStatusFilter(value: string): value is RuleTraceStatusFilter {
  return ['all', 'passed', 'failed', 'unknown'].includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
