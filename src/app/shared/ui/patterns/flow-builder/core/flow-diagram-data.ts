import { FlowDefinition, FlowEdge, FlowNode, FlowPoint, FlowSize } from '../models';
import { cloneFlowDefinition, cloneFlowValue } from './flow-serialization';

const DUPLICATE_OFFSET: FlowPoint = { x: 32, y: 32 };

export class FlowDiagramData {
  private constructor(private readonly definition: FlowDefinition) {}

  static from(definition: FlowDefinition): FlowDiagramData {
    return new FlowDiagramData(cloneFlowDefinition(definition));
  }

  snapshot(): FlowDefinition {
    return cloneFlowDefinition(this.definition);
  }

  addEdge(edge: FlowEdge): FlowDefinition {
    return {
      ...this.snapshot(),
      edges: [...this.definition.edges, cloneFlowValue(edge)],
    };
  }

  moveNode(nodeId: string, position: FlowPoint): FlowDefinition {
    return {
      ...this.snapshot(),
      nodes: this.definition.nodes.map(node =>
        node.id === nodeId ? { ...node, position: { ...position } } : node
      ),
    };
  }

  updateNode(nodeId: string, patch: Partial<FlowNode>): FlowDefinition {
    return {
      ...this.snapshot(),
      nodes: this.definition.nodes.map(node =>
        node.id === nodeId ? { ...node, ...patch } : node
      ),
    };
  }

  updateNodeData(nodeId: string, key: string, value: unknown): FlowDefinition {
    return {
      ...this.snapshot(),
      nodes: this.definition.nodes.map(node =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...(node.data ?? {}),
                [key]: value,
              },
            }
          : node
      ),
    };
  }

  removeSelection(ids: string[]): FlowDefinition {
    const idSet = new Set(ids);
    return {
      ...this.snapshot(),
      nodes: this.definition.nodes.filter(node => !idSet.has(node.id)),
      edges: this.definition.edges.filter(edge =>
        !idSet.has(edge.id) && !idSet.has(edge.source.nodeId) && !idSet.has(edge.target.nodeId)
      ),
    };
  }

  duplicateSelection(ids: string[]): { definition: FlowDefinition; duplicatedIds: string[] } {
    const idSet = new Set(ids);
    const selectedNodes = this.definition.nodes.filter(node => idSet.has(node.id));
    const idMap = new Map<string, string>();

    const duplicatedNodes = selectedNodes.map(node => {
      const newId = this.createDuplicateId(node.id);
      idMap.set(node.id, newId);
      return {
        ...cloneFlowValue(node),
        id: newId,
        label: node.label ? `${node.label} Copy` : node.label,
        position: this.offsetPosition(node.position, node.size),
      };
    });

    const duplicatedEdges = this.definition.edges
      .filter(edge => idMap.has(edge.source.nodeId) && idMap.has(edge.target.nodeId))
      .map(edge => ({
        ...cloneFlowValue(edge),
        id: this.createDuplicateId(edge.id),
        source: {
          ...edge.source,
          nodeId: idMap.get(edge.source.nodeId) ?? edge.source.nodeId,
        },
        target: {
          ...edge.target,
          nodeId: idMap.get(edge.target.nodeId) ?? edge.target.nodeId,
        },
      }));

    const duplicatedIds = duplicatedNodes.map(node => node.id);

    return {
      duplicatedIds,
      definition: {
        ...this.snapshot(),
        nodes: [...this.definition.nodes, ...duplicatedNodes],
        edges: [...this.definition.edges, ...duplicatedEdges],
      },
    };
  }

  private createDuplicateId(baseId: string): string {
    const existingIds = new Set([
      ...this.definition.nodes.map(node => node.id),
      ...this.definition.edges.map(edge => edge.id),
    ]);
    let suffix = 1;
    let candidate = `${baseId}-copy`;
    while (existingIds.has(candidate)) {
      suffix += 1;
      candidate = `${baseId}-copy-${suffix}`;
    }
    return candidate;
  }

  private offsetPosition(position: FlowPoint | undefined, size: FlowSize | undefined): FlowPoint {
    const fallback = size ? { x: size.width / 4, y: size.height / 4 } : { x: 0, y: 0 };
    return {
      x: (position?.x ?? fallback.x) + DUPLICATE_OFFSET.x,
      y: (position?.y ?? fallback.y) + DUPLICATE_OFFSET.y,
    };
  }
}
