import { FlowNode } from './flow-node.model';
import { FlowSize } from './flow-common.model';
import { FlowPortDefinition } from './flow-port.model';
import type { FormConfig } from '../../form-input/models/form-config.model';

export type FlowNodeShape = 'rectangle' | 'diamond' | 'capsule' | 'note' | 'placeholder' | 'custom' | 'html';

export type FlowNodeTone = 'primary' | 'info' | 'success' | 'warning' | 'danger' | 'muted' | 'neutral';

export type FlowNodeLabelResolver = (node: FlowNode) => string;
export type FlowNodeIconResolver = (node: FlowNode) => string;
export type FlowNodeBadgeResolver = (node: FlowNode) => { label: string; tone?: FlowNodeTone } | null;
export type FlowNodeDefaultDataFactory = () => Record<string, unknown>;

export interface FlowNodeTypeDefinition {
  type: string;
  label: string;
  description?: string;
  shape: FlowNodeShape;
  defaultSize: FlowSize;
  defaultData?: Record<string, unknown> | FlowNodeDefaultDataFactory;
  template?: string;
  minSize?: FlowSize;
  maxSize?: FlowSize;
  ports: FlowPortDefinition[];
  icon?: string;
  tone?: FlowNodeTone;
  allowMove?: boolean;
  allowDelete?: boolean;
  allowResize?: boolean;
  allowConnectFrom?: boolean;
  allowConnectTo?: boolean;
  maxIncoming?: number;
  maxOutgoing?: number;
  labelResolver?: FlowNodeLabelResolver;
  subtitleResolver?: FlowNodeLabelResolver;
  badgeResolver?: FlowNodeBadgeResolver;
  inspectorForm?: FormConfig;
  inspector?: FlowInspectorSchema;
}

export interface FlowEdgeTypeDefinition {
  type: string;
  label?: string;
  tone?: FlowNodeTone;
  dashed?: boolean;
  animated?: boolean;
}

export interface FlowInspectorSchema {
  title?: string | FlowNodeLabelResolver;
  icon?: string | FlowNodeIconResolver;
  sections: FlowInspectorSection[];
}

export interface FlowInspectorSection {
  id: string;
  title: string;
  collapsed?: boolean;
  fields: FlowInspectorField[];
}

export interface FlowInspectorField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'textarea' | 'json' | 'readonly';
  options?: Array<{ label: string; value: unknown }>;
  readonly?: boolean;
  required?: boolean;
  hint?: string;
}
