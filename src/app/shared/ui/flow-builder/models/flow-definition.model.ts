import { FlowNode } from './flow-node.model';
import { FlowEdge } from './flow-edge.model';
import { FlowViewportState } from './flow-common.model';

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
