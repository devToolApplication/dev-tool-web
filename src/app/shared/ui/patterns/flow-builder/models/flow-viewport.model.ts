export interface FlowViewportSnapshot {
  scale: number;
  translateX: number;
  translateY: number;
  clientWidth: number;
  clientHeight: number;
  contentBounds: {
    minX: number;
    minY: number;
    width: number;
    height: number;
  };
  nodePositions?: Array<{ id: string; x: number; y: number; width: number; height: number }>;
}
