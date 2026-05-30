export type FlowSelectionKind = 'node' | 'edge';

export interface FlowSelectionItem {
  id: string;
  kind: FlowSelectionKind;
}

export interface FlowSelection {
  items: FlowSelectionItem[];
  primaryId: string | null;
}

export const EMPTY_FLOW_SELECTION: FlowSelection = {
  items: [],
  primaryId: null,
};
