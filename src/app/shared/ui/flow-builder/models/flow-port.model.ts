export type FlowPortPosition = 'top' | 'bottom' | 'left' | 'right';
export type FlowPortDirection = 'in' | 'out' | 'both';

export interface FlowPort {
  id: string;
  group: FlowPortDirection;
  position?: FlowPortPosition;
  label?: string;
}

export interface FlowPortDefinition {
  id: string;
  group: FlowPortDirection;
  position: FlowPortPosition;
  label?: string;
  maxConnections?: number;
}
