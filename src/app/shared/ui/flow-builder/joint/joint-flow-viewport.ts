export interface JointFlowBounds {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

export interface JointFlowViewportSize {
  width: number;
  height: number;
}

export interface JointFlowTransform {
  scale: number;
  tx: number;
  ty: number;
}

export function computeFitTransform(
  bounds: JointFlowBounds,
  viewport: JointFlowViewportSize,
  options: { padding: number; minScale: number; maxScale: number }
): JointFlowTransform {
  const availableWidth = Math.max(viewport.width - options.padding * 2, 1);
  const availableHeight = Math.max(viewport.height - options.padding * 2, 1);
  const scale = Math.min(
    options.maxScale,
    Math.max(
      options.minScale,
      Math.min(availableWidth / Math.max(bounds.width, 1), availableHeight / Math.max(bounds.height, 1))
    )
  );

  return {
    scale,
    tx: Math.round((viewport.width - bounds.width * scale) / 2 - bounds.minX * scale),
    ty: Math.round((viewport.height - bounds.height * scale) / 2 - bounds.minY * scale),
  };
}

export function resolveViewportSize(
  primary: Partial<JointFlowViewportSize> | null | undefined,
  fallback?: Partial<JointFlowViewportSize> | null,
  last?: Partial<JointFlowViewportSize> | null
): JointFlowViewportSize {
  const width = positiveNumber(primary?.width)
    ?? positiveNumber(fallback?.width)
    ?? positiveNumber(last?.width)
    ?? 1;
  const height = positiveNumber(primary?.height)
    ?? positiveNumber(fallback?.height)
    ?? positiveNumber(last?.height)
    ?? 1;
  return { width, height };
}

export function computeLocalCenter(
  viewport: JointFlowViewportSize,
  transform: JointFlowTransform
): { x: number; y: number } {
  return {
    x: (viewport.width / 2 - transform.tx) / transform.scale,
    y: (viewport.height / 2 - transform.ty) / transform.scale,
  };
}

export function computeTranslateForLocalCenter(
  center: { x: number; y: number },
  viewport: JointFlowViewportSize,
  scale: number
): { tx: number; ty: number } {
  return {
    tx: viewport.width / 2 - center.x * scale,
    ty: viewport.height / 2 - center.y * scale,
  };
}

export function computeWheelZoomScale(
  currentScale: number,
  deltaY: number,
  minScale: number,
  maxScale: number
): number {
  const current = positiveNumber(currentScale) ?? 1;
  const delta = Math.pow(1.0015, -deltaY);
  return Math.min(Math.max(current * delta, minScale), maxScale);
}

export function computeZoomTransformAtLocalPoint(
  transform: JointFlowTransform,
  localPoint: { x: number; y: number },
  nextScale: number
): JointFlowTransform {
  return {
    scale: nextScale,
    tx: transform.tx + localPoint.x * (transform.scale - nextScale),
    ty: transform.ty + localPoint.y * (transform.scale - nextScale),
  };
}

export function computePanTranslate(
  origin: { tx: number; ty: number },
  delta: { dx: number; dy: number }
): { tx: number; ty: number } {
  return {
    tx: origin.tx + delta.dx,
    ty: origin.ty + delta.dy,
  };
}

function positiveNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}
