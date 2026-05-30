import { RuleEvaluationTrace } from '../../data-access/models/trading-system.model';
import { FlowDefinition, FlowNode, FlowEdge, FlowStatus } from '../../../../../shared/ui/flow-builder/models';

export function ruleTraceToFlowDefinition(trace: RuleEvaluationTrace | Record<string, unknown> | null | undefined): FlowDefinition {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];

  if (trace) {
    buildTraceNode(trace as RuleEvaluationTrace, nodes, edges, null);
  }

  return {
    id: 'rule-trace-flow',
    version: 1,
    readonly: true,
    nodes,
    edges,
  };
}

let traceNodeCounter = 0;

function nextTraceId(): string {
  traceNodeCounter += 1;
  return `trace-${traceNodeCounter}`;
}

function resolveStatus(trace: RuleEvaluationTrace): FlowStatus {
  if (trace.passed === true || trace.satisfied === true) return 'success';
  if (trace.passed === false || trace.satisfied === false) return 'danger';
  return 'default';
}

function resolveLabel(trace: RuleEvaluationTrace): string {
  if (trace.operator) return String(trace.operator);
  if (trace.ruleCode) return trace.ruleCode;
  if (trace.name) return trace.name;
  return 'Node';
}

function resolveType(trace: RuleEvaluationTrace): string {
  if (trace.children?.length) {
    return trace.operator ? 'rule-group' : 'rule-not';
  }
  if (trace.ruleCode && !trace.operator) return 'rule-ref';
  if (trace.operator) return 'rule-condition';
  return 'rule-condition';
}

function buildTraceNode(
  trace: RuleEvaluationTrace,
  nodes: FlowNode[],
  edges: FlowEdge[],
  parentId: string | null
): string {
  const id = nextTraceId();
  const type = resolveType(trace);
  const status = resolveStatus(trace);
  const label = resolveLabel(trace);

  const valueStr = trace.value != null ? String(trace.value) : undefined;

  nodes.push({
    id,
    type,
    label,
    status,
    data: {
      operator: trace.operator,
      ruleCode: trace.ruleCode,
      passed: trace.passed,
      satisfied: trace.satisfied,
      value: trace.value,
      message: trace.message ?? trace.reason,
      input: trace.input,
      output: trace.output,
      badge: valueStr,
    },
    readonly: true,
  });

  if (parentId) {
    edges.push({
      id: `edge-${parentId}-${id}`,
      source: { nodeId: parentId, portId: 'out' },
      target: { nodeId: id, portId: 'in' },
    });
  }

  if (trace.children?.length) {
    for (const child of trace.children) {
      buildTraceNode(child, nodes, edges, id);
    }
  }

  return id;
}

export function resetTraceCounter(): void {
  traceNodeCounter = 0;
}
