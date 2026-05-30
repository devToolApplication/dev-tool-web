import {
  RuleExpressionConditionNode,
  RuleExpressionGroupNode,
  RuleExpressionNode,
  RuleExpressionNotNode,
  RuleExpressionRuleRefNode,
  RuleLogicFormValue,
} from '../rule-expression-builder/rule-expression.models';
import { operatorDefinition } from '../rule-expression-builder/rule-expression-operators';
import { printRuleExpressionOperand } from '../rule-expression-builder/rule-expression-printer';
import { FlowDefinition, FlowNode, FlowEdge } from '../../../../../shared/ui/flow-builder/models';

export function ruleExpressionToFlowDefinition(value: RuleLogicFormValue): FlowDefinition {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];

  if (value.root) {
    buildNode(value.root, nodes, edges);
  }

  return {
    id: 'rule-flow',
    version: 1,
    nodes,
    edges,
  };
}

function buildNode(node: RuleExpressionNode, nodes: FlowNode[], edges: FlowEdge[]): void {
  switch (node.type) {
    case 'group':
      buildGroupNode(node, nodes, edges);
      break;
    case 'condition':
      buildConditionNode(node, nodes);
      break;
    case 'ruleRef':
      buildRuleRefNode(node, nodes);
      break;
    case 'not':
      buildNotNode(node, nodes, edges);
      break;
  }
}

function buildGroupNode(node: RuleExpressionGroupNode, nodes: FlowNode[], edges: FlowEdge[]): void {
  nodes.push({
    id: node.id,
    type: 'rule-group',
    label: node.operator,
    data: { operator: node.operator, disabled: node.disabled },
    disabled: node.disabled,
  });

  for (const child of node.children) {
    buildNode(child, nodes, edges);
    edges.push({
      id: `edge-${node.id}-${child.id}`,
      source: { nodeId: node.id, portId: 'out' },
      target: { nodeId: child.id, portId: 'in' },
    });
  }
}

function buildConditionNode(node: RuleExpressionConditionNode, nodes: FlowNode[]): void {
  const label = buildConditionLabel(node);
  nodes.push({
    id: node.id,
    type: 'rule-condition',
    label,
    data: {
      operator: node.operator,
      operands: node.operands,
      params: node.params,
      disabled: node.disabled,
    },
    disabled: node.disabled,
  });
}

function buildRuleRefNode(node: RuleExpressionRuleRefNode, nodes: FlowNode[]): void {
  nodes.push({
    id: node.id,
    type: 'rule-ref',
    label: node.ruleCode ? `Rule: ${node.ruleCode}` : 'Rule: ?',
    data: { ruleCode: node.ruleCode, disabled: node.disabled },
    disabled: node.disabled,
  });
}

function buildNotNode(node: RuleExpressionNotNode, nodes: FlowNode[], edges: FlowEdge[]): void {
  nodes.push({
    id: node.id,
    type: 'rule-not',
    label: 'NOT',
    data: { disabled: node.disabled },
    disabled: node.disabled,
  });

  for (const child of node.children) {
    buildNode(child, nodes, edges);
    edges.push({
      id: `edge-${node.id}-${child.id}`,
      source: { nodeId: node.id, portId: 'out' },
      target: { nodeId: child.id, portId: 'in' },
    });
  }
}

function buildConditionLabel(node: RuleExpressionConditionNode): string {
  const op = node.operator ?? '?';
  const slots = operatorDefinition(node.operator)?.slots ?? [];
  const slotCount = slots.length || node.operands.length || 2;

  if (slotCount === 0) return op;

  const left = node.operands[0] ? printRuleExpressionOperand(node.operands[0]) : '?';

  if (slotCount === 1) return `${left} ${op}`;

  const right = node.operands[1] ? printRuleExpressionOperand(node.operands[1]) : '?';

  if (slotCount === 2) return `${left}\n${op}\n${right}`;

  // BETWEEN/OUTSIDE: left BETWEEN min, max
  const min = node.operands[1] ? printRuleExpressionOperand(node.operands[1]) : '?';
  const max = node.operands[2] ? printRuleExpressionOperand(node.operands[2]) : '?';
  return `${left}\n${op}\n${min} ~ ${max}`;
}
