import { FlowStatus, FlowValidationIssue } from './flow-common.model';

export interface FlowEndpoint {
  nodeId: string;
  portId?: string;
}

export interface FlowEdge {
  id: string;
  source: FlowEndpoint;
  target: FlowEndpoint;
  label?: string;
  data?: Record<string, unknown>;
  status?: FlowStatus;
  readonly?: boolean;
  disabled?: boolean;
  validation?: FlowValidationIssue[];
}
