export interface FlowPoint {
  x: number;
  y: number;
}

export interface FlowSize {
  width: number;
  height: number;
}

export type FlowStatus = 'default' | 'selected' | 'success' | 'warning' | 'danger' | 'muted';

export interface FlowValidationIssue {
  nodeId?: string;
  edgeId?: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface FlowViewportState {
  x: number;
  y: number;
  zoom: number;
}
