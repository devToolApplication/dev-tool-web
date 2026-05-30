import {
  RuleExpressionConditionNode,
  RuleExpressionGroupNode,
  RuleExpressionGroupOperator,
  RuleExpressionNode,
  RuleExpressionNotNode,
  RuleExpressionOperand,
  RuleExpressionRuleRefNode,
  RuleLogicFormValue,
} from '../rule-expression-builder/rule-expression.models';
import { FlowDefinition, FlowNode, FlowEdge } from '../../../../../shared/ui/flow-builder/models';

export function flowDefinitionToRuleExpression(definition: FlowDefinition | null): RuleLogicFormValue {
  if (!definition || !definition.nodes.length) {
    return { root: null };
  }

  const expressionNodes = definition.nodes.filter(n => n.type !== 'rule-operand');
  const edges = definition.edges.filter(e => e.data?.['kind'] !== 'operand');

  const incomingCount = new Map<string, number>();
  for (const edge of edges) {
    incomingCount.set(edge.target.nodeId, (incomingCount.get(edge.target.nodeId) ?? 0) + 1);
  }

  const roots = expressionNodes.filter(n => !incomingCount.has(n.id) || incomingCount.get(n.id) === 0);
  if (roots.length === 0) return { root: null };

  const childrenMap = new Map<string, string[]>();
  for (const edge of edges) {
    const children = childrenMap.get(edge.source.nodeId) ?? [];
    children.push(edge.target.nodeId);
    childrenMap.set(edge.source.nodeId, children);
  }

  const nodeMap = new Map<string, FlowNode>();
  for (const node of definition.nodes) {
    nodeMap.set(node.id, node);
  }

  const root = roots.length === 1
    ? rebuildNode(roots[0], childrenMap, nodeMap, definition)
    : rebuildGroupFromRoots(roots, childrenMap, nodeMap, definition);

  return { root };
}

function rebuildNode(
  flowNode: FlowNode,
  childrenMap: Map<string, string[]>,
  nodeMap: Map<string, FlowNode>,
  definition: FlowDefinition
): RuleExpressionNode | null {
  switch (flowNode.type) {
    case 'rule-group':
      return rebuildGroupNode(flowNode, childrenMap, nodeMap, definition);
    case 'rule-condition':
      return rebuildConditionNode(flowNode, definition);
    case 'rule-ref':
      return rebuildRuleRefNode(flowNode);
    case 'rule-not':
      return rebuildNotNode(flowNode, childrenMap, nodeMap, definition);
    default:
      return null;
  }
}

function rebuildGroupNode(
  flowNode: FlowNode,
  childrenMap: Map<string, string[]>,
  nodeMap: Map<string, FlowNode>,
  definition: FlowDefinition
): RuleExpressionGroupNode {
  const childIds = childrenMap.get(flowNode.id) ?? [];
  const children: RuleExpressionNode[] = [];

  for (const childId of childIds) {
    const childFlowNode = nodeMap.get(childId);
    if (childFlowNode && childFlowNode.type !== 'rule-operand') {
      const rebuilt = rebuildNode(childFlowNode, childrenMap, nodeMap, definition);
      if (rebuilt) children.push(rebuilt);
    }
  }

  return {
    id: flowNode.id,
    type: 'group',
    operator: (flowNode.data?.['operator'] as RuleExpressionGroupOperator) ?? 'AND',
    children,
    disabled: flowNode.disabled,
  };
}

function rebuildConditionNode(flowNode: FlowNode, definition: FlowDefinition): RuleExpressionConditionNode {
  const directOperands = flowNode.data?.['operands'];
  const dataOperands = Array.isArray(directOperands)
    ? (directOperands as RuleExpressionOperand[])
    : [];
  const operandEdges = definition.edges
    .filter(e => e.source.nodeId === flowNode.id && e.data?.['kind'] === 'operand')
    .sort((a, b) => {
      const aIdx = extractOperandIndex(a.target.nodeId);
      const bIdx = extractOperandIndex(b.target.nodeId);
      return aIdx - bIdx;
    });

  const edgeOperands: RuleExpressionOperand[] = operandEdges.map(edge => {
    const operandNode = definition.nodes.find(n => n.id === edge.target.nodeId);
    return (operandNode?.data?.['operand'] as RuleExpressionOperand) ?? { type: 'constant', value: null };
  });

  return {
    id: flowNode.id,
    type: 'condition',
    operator: (flowNode.data?.['operator'] as any) ?? null,
    operands: dataOperands.length ? dataOperands : edgeOperands,
    params: (flowNode.data?.['params'] as Record<string, unknown>) ?? undefined,
    disabled: flowNode.disabled,
  };
}

function rebuildRuleRefNode(flowNode: FlowNode): RuleExpressionRuleRefNode {
  return {
    id: flowNode.id,
    type: 'ruleRef',
    ruleCode: (flowNode.data?.['ruleCode'] as string) ?? '',
    disabled: flowNode.disabled,
  };
}

function rebuildNotNode(
  flowNode: FlowNode,
  childrenMap: Map<string, string[]>,
  nodeMap: Map<string, FlowNode>,
  definition: FlowDefinition
): RuleExpressionNotNode {
  const childIds = childrenMap.get(flowNode.id) ?? [];
  const children: RuleExpressionNode[] = [];

  for (const childId of childIds) {
    const childFlowNode = nodeMap.get(childId);
    if (childFlowNode && childFlowNode.type !== 'rule-operand') {
      const rebuilt = rebuildNode(childFlowNode, childrenMap, nodeMap, definition);
      if (rebuilt) children.push(rebuilt);
    }
  }

  return {
    id: flowNode.id,
    type: 'not',
    children,
    disabled: flowNode.disabled,
  };
}

function rebuildGroupFromRoots(
  roots: FlowNode[],
  childrenMap: Map<string, string[]>,
  nodeMap: Map<string, FlowNode>,
  definition: FlowDefinition
): RuleExpressionGroupNode {
  const children: RuleExpressionNode[] = [];
  for (const root of roots) {
    const rebuilt = rebuildNode(root, childrenMap, nodeMap, definition);
    if (rebuilt) children.push(rebuilt);
  }
  return {
    id: `auto-group-${Date.now().toString(36)}`,
    type: 'group',
    operator: 'AND',
    children,
  };
}

function extractOperandIndex(nodeId: string): number {
  const match = nodeId.match(/:operand:(\d+)$/);
  return match ? parseInt(match[1], 10) : 0;
}
