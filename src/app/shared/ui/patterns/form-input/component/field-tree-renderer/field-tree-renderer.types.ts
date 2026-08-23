import type { TreeFormNode } from '../../models/form-config.model';

export type TreeFilterMode = 'all' | 'selected' | 'leaf';

export interface TreeNodeSelectionState {
  checked: boolean;
  indeterminate: boolean;
  selectable: boolean;
}

export interface TreeViewNode {
  node: TreeFormNode;
  path: string;
  code?: string;
  children: TreeViewNode[];
  matched: boolean;
  forceExpanded: boolean;
  checked: boolean;
  indeterminate: boolean;
  leaf: boolean;
}

export interface SelectedTreeItem {
  node: TreeFormNode;
  path: string;
  code?: string;
  leaf: boolean;
}

export interface TreeBadgeView {
  label: string;
  variant: 'default' | 'info' | 'success' | 'warning' | 'danger' | 'muted';
}
