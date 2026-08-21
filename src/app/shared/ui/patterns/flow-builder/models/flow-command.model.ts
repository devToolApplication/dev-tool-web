import { FlowNode } from './flow-node.model';
import { FlowEdge } from './flow-edge.model';
import type { FlowCapabilities } from './flow-capability.model';
import type { FormContext } from '../../form-input/models/form-config.model';

export type FlowCommand =
  | 'undo'
  | 'redo'
  | 'fit'
  | 'zoomIn'
  | 'zoomOut'
  | 'resetZoom'
  | 'autoLayout'
  | 'toggleNavigator'
  | 'toggleInspector'
  | 'fullscreen'
  | 'deleteSelection'
  | 'duplicateSelection'
  | 'exportJson'
  | 'importJson';

export interface FlowCommandEvent {
  command: FlowCommand;
  payload?: unknown;
}

export interface FlowNodeChange {
  type: 'add' | 'update' | 'remove' | 'move' | 'resize';
  node: FlowNode;
  previousNode?: FlowNode;
}

export interface FlowEdgeChange {
  type: 'add' | 'update' | 'remove';
  edge: FlowEdge;
  previousEdge?: FlowEdge;
}

export interface FlowConnectEvent {
  sourceNodeId: string;
  sourcePortId?: string;
  targetNodeId: string;
  targetPortId?: string;
}

export interface FlowNodeDropEvent {
  nodeType: string;
  x: number;
  y: number;
}

export interface FlowContextMenuEvent {
  targetType: 'node' | 'edge' | 'blank';
  targetId?: string;
  x: number;
  y: number;
}

export type FlowBuilderMode = 'edit' | 'readonly' | 'trace';

export interface FlowToolbarConfig {
  visible?: boolean;
  mode?: 'inline' | 'floating';
  commands?: FlowCommand[];
  capabilities?: FlowCapabilities;
  customActions?: FlowToolbarAction[];
}

export interface FlowToolbarAction {
  id: string;
  label: string;
  icon?: string;
  severity?: string;
  disabled?: boolean;
}

export interface FlowInspectorConfig {
  visible?: boolean;
  position?: 'right' | 'bottom';
  mode?: 'inline' | 'overlay';
  width?: string;
  formContext?: FormContext;
}

export interface FlowPaletteConfig {
  visible?: boolean;
  title?: string;
  collapsed?: boolean;
  width?: string;
  allowedTypes?: string[];
}

export interface FlowLayoutConfig {
  direction: 'TB' | 'BT' | 'LR' | 'RL';
  nodeGap: number;
  rankGap: number;
  padding: number;
  preserveManualPositions?: boolean;
}
