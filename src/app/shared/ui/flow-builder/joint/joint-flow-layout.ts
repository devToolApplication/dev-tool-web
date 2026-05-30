import * as joint from '@joint/core';

export interface TreeLayoutOptions {
  direction?: 'TB' | 'LR';
  rankGap?: number;
  nodeGap?: number;
  padding?: number;
}

export function applyTreeLayout(graph: joint.dia.Graph, options: TreeLayoutOptions = {}): void {
  const { direction = 'TB', rankGap = 180, nodeGap = 60, padding = 60 } = options;
  const isVertical = direction === 'TB';

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

  const roots = elements.filter(el => !hasParent.has(el.id as string));
  if (!roots.length) return;

  const positions = new Map<string, { x: number; y: number }>();
  let cursor = padding;

  function getSize(id: string): { width: number; height: number } {
    const el = graph.getCell(id);
    return el?.isElement() ? (el as joint.dia.Element).size() : { width: 200, height: 70 };
  }

  function layoutSubtree(nodeId: string, depth: number): number {
    const children = childrenMap.get(nodeId) ?? [];
    const size = getSize(nodeId);
    const nodeExtent = isVertical ? size.width : size.height;
    const nodeDepthExtent = isVertical ? size.height : size.width;
    const depthOffset = depth * (rankGap + nodeDepthExtent) / 1.5 + padding;

    if (children.length === 0) {
      const pos = cursor;
      if (isVertical) {
        positions.set(nodeId, { x: pos, y: depthOffset });
      } else {
        positions.set(nodeId, { x: depthOffset, y: pos });
      }
      cursor += nodeExtent + nodeGap;
      return pos + nodeExtent / 2;
    }

    const childCenters: number[] = [];
    for (const childId of children) {
      childCenters.push(layoutSubtree(childId, depth + 1));
    }

    const center = (Math.min(...childCenters) + Math.max(...childCenters)) / 2;
    if (isVertical) {
      positions.set(nodeId, { x: center - size.width / 2, y: depthOffset });
    } else {
      positions.set(nodeId, { x: depthOffset, y: center - size.height / 2 });
    }
    return center;
  }

  for (const root of roots) {
    layoutSubtree(root.id as string, 0);
  }

  for (const el of elements) {
    const pos = positions.get(el.id as string);
    if (pos) el.position(pos.x, pos.y);
  }
}
