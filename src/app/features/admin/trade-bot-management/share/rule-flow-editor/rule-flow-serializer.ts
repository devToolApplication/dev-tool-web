import * as joint from '@joint/core';
import {
  RuleExpressionNode,
  RuleExpressionGroupNode,
  RuleExpressionConditionNode,
  RuleExpressionRuleRefNode,
  RuleExpressionNotNode,
  RuleLogicFormValue,
} from '../rule-expression-builder/rule-expression.models';
import { createFlowShape, createFlowLink } from './rule-flow-shapes';
import { RULE_FLOW_DIMENSIONS, RuleFlowNodeCategory } from './rule-flow-editor.models';

interface LayoutNode {
  elementId: string;
  ruleNodeId: string;
  category: RuleFlowNodeCategory;
}

interface LayoutResult {
  elements: joint.dia.Element[];
  links: joint.dia.Link[];
  nodeMap: Map<string, string>;
}

export function ruleExpressionToGraph(value: RuleLogicFormValue): LayoutResult {
  const elements: joint.dia.Element[] = [];
  const links: joint.dia.Link[] = [];
  const nodeMap = new Map<string, string>();

  if (!value.root) {
    return { elements, links, nodeMap };
  }

  const startNode = createFlowShape('start', 'START');
  elements.push(startNode);

  const rootResult = buildNode(value.root, elements, links, nodeMap);

  if (rootResult) {
    links.push(createFlowLink(startNode.id as string, 'out', rootResult, 'in'));
  }

  return { elements, links, nodeMap };
}

function buildNode(
  node: RuleExpressionNode,
  elements: joint.dia.Element[],
  links: joint.dia.Link[],
  nodeMap: Map<string, string>
): string | null {
  switch (node.type) {
    case 'group':
      return buildGroupNode(node, elements, links, nodeMap);
    case 'condition':
      return buildConditionNode(node, elements, links, nodeMap);
    case 'ruleRef':
      return buildRuleRefNode(node, elements, links, nodeMap);
    case 'not':
      return buildNotNode(node, elements, links, nodeMap);
    default:
      return null;
  }
}

function buildGroupNode(
  node: RuleExpressionGroupNode,
  elements: joint.dia.Element[],
  links: joint.dia.Link[],
  nodeMap: Map<string, string>
): string {
  const label = `${node.operator}${node.label ? ' — ' + node.label : ''}`;
  const el = createFlowShape('group', label);
  elements.push(el);
  nodeMap.set(node.id, el.id as string);

  for (const child of node.children) {
    const childId = buildNode(child, elements, links, nodeMap);
    if (childId) {
      links.push(createFlowLink(el.id as string, 'out', childId, 'in'));
    }
  }

  return el.id as string;
}

function buildConditionNode(
  node: RuleExpressionConditionNode,
  elements: joint.dia.Element[],
  links: joint.dia.Link[],
  nodeMap: Map<string, string>
): string {
  const label = node.operator
    ? `${node.label ?? 'Condition'}\n${node.operator}`
    : node.label ?? 'Condition';
  const el = createFlowShape('condition', label);
  elements.push(el);
  nodeMap.set(node.id, el.id as string);
  return el.id as string;
}

function buildRuleRefNode(
  node: RuleExpressionRuleRefNode,
  elements: joint.dia.Element[],
  links: joint.dia.Link[],
  nodeMap: Map<string, string>
): string {
  const label = `Rule: ${node.ruleCode}`;
  const el = createFlowShape('ruleRef', label);
  elements.push(el);
  nodeMap.set(node.id, el.id as string);
  return el.id as string;
}

function buildNotNode(
  node: RuleExpressionNotNode,
  elements: joint.dia.Element[],
  links: joint.dia.Link[],
  nodeMap: Map<string, string>
): string {
  const el = createFlowShape('not', 'NOT');
  elements.push(el);
  nodeMap.set(node.id, el.id as string);

  for (const child of node.children) {
    const childId = buildNode(child, elements, links, nodeMap);
    if (childId) {
      links.push(createFlowLink(el.id as string, 'out', childId, 'in'));
    }
  }

  return el.id as string;
}

export function applyAutoLayout(graph: joint.dia.Graph): void {
  const { horizontalGap, verticalGap } = RULE_FLOW_DIMENSIONS;

  const elements = graph.getElements();
  const links = graph.getLinks();

  const childrenMap = new Map<string, string[]>();
  const hasParent = new Set<string>();

  for (const link of links) {
    const sourceId = (link.source() as { id: string }).id;
    const targetId = (link.target() as { id: string }).id;
    if (!sourceId || !targetId) continue;

    const children = childrenMap.get(sourceId) ?? [];
    children.push(targetId);
    childrenMap.set(sourceId, children);
    hasParent.add(targetId);
  }

  const roots = elements.filter((el) => !hasParent.has(el.id as string));
  if (!roots.length) return;

  const positions = new Map<string, { x: number; y: number }>();
  let currentX = 0;

  function layoutSubtree(nodeId: string, depth: number): number {
    const children = childrenMap.get(nodeId) ?? [];

    if (children.length === 0) {
      const x = currentX;
      positions.set(nodeId, { x, y: depth * (60 + verticalGap) });
      currentX += 180 + horizontalGap;
      return x;
    }

    const childXPositions: number[] = [];
    for (const childId of children) {
      const cx = layoutSubtree(childId, depth + 1);
      childXPositions.push(cx);
    }

    const minX = Math.min(...childXPositions);
    const maxX = Math.max(...childXPositions);
    const x = (minX + maxX) / 2;
    positions.set(nodeId, { x, y: depth * (60 + verticalGap) });
    return x;
  }

  for (const root of roots) {
    layoutSubtree(root.id as string, 0);
  }

  for (const el of elements) {
    const pos = positions.get(el.id as string);
    if (pos) {
      el.position(pos.x, pos.y);
    }
  }
}
