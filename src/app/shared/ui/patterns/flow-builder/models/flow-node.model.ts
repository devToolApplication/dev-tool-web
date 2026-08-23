import type { FlowPoint, FlowSize, FlowStatus, FlowValidationIssue } from './flow-common.model';
import type { FlowPort } from './flow-port.model';

export interface FlowNode {
  id: string;
  type: string;
  label?: string;
  position?: FlowPoint;
  size?: FlowSize;
  ports?: FlowPort[];
  data?: Record<string, unknown>;
  status?: FlowStatus;
  readonly?: boolean;
  disabled?: boolean;
  validation?: FlowValidationIssue[];
}
