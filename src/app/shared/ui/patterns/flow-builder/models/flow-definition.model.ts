import type { FlowNode } from './flow-node.model';
import type { FlowEdge } from './flow-edge.model';
import type { FlowViewportState } from './flow-common.model';

export interface FlowDefinition {
  id: string;
  version: 1;
  name?: string;
  readonly?: boolean;
  viewport?: FlowViewportState;
  nodes: FlowNode[];
  edges: FlowEdge[];
  metadata?: Record<string, unknown>;
}
