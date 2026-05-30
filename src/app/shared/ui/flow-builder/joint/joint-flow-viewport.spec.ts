import {
  computeFitTransform,
  computeLocalCenter,
  computePanTranslate,
  computeTranslateForLocalCenter,
  computeWheelZoomScale,
  computeZoomTransformAtLocalPoint,
  resolveViewportSize,
} from './joint-flow-viewport';

describe('joint flow viewport helpers', () => {
  it('centers small graph content inside the initial canvas viewport', () => {
    const transform = computeFitTransform(
      { minX: 0, minY: 0, width: 200, height: 100 },
      { width: 800, height: 500 },
      { padding: 40, minScale: 0.3, maxScale: 1 }
    );

    expect(transform).toEqual({ scale: 1, tx: 300, ty: 200 });
  });

  it('scales large graph content down without losing center alignment', () => {
    const transform = computeFitTransform(
      { minX: 100, minY: 50, width: 1400, height: 800 },
      { width: 800, height: 500 },
      { padding: 40, minScale: 0.3, maxScale: 1 }
    );

    expect(transform.scale).toBeCloseTo(0.514, 3);
    expect(transform.tx).toBeCloseTo(-11, 0);
    expect(transform.ty).toBeCloseTo(19, 0);
  });

  it('preserves the same local center across viewport resize', () => {
    const beforeViewport = { width: 800, height: 500 };
    const beforeTransform = { scale: 1, tx: 300, ty: 200 };
    const center = computeLocalCenter(beforeViewport, beforeTransform);
    const afterTranslate = computeTranslateForLocalCenter(center, { width: 1000, height: 700 }, 1);
    const afterCenter = computeLocalCenter({ width: 1000, height: 700 }, { scale: 1, ...afterTranslate });

    expect(afterCenter.x).toBeCloseTo(center.x, 3);
    expect(afterCenter.y).toBeCloseTo(center.y, 3);
  });

  it('falls back to the parent canvas size when the absolute paper reports zero size', () => {
    const size = resolveViewportSize(
      { width: 0, height: 0 },
      { width: 580, height: 520 },
      { width: 1, height: 1 }
    );

    expect(size).toEqual({ width: 580, height: 520 });
  });

  it('falls back to the last measured size when current DOM size is transiently unavailable', () => {
    const size = resolveViewportSize(
      { width: 0, height: 0 },
      { width: 0, height: 0 },
      { width: 580, height: 520 }
    );

    expect(size).toEqual({ width: 580, height: 520 });
  });

  it('computes mouse wheel zoom scale with min and max clamps', () => {
    expect(computeWheelZoomScale(1, -120, 0.3, 3)).toBeGreaterThan(1);
    expect(computeWheelZoomScale(1, 120, 0.3, 3)).toBeLessThan(1);
    expect(computeWheelZoomScale(2.9, -1200, 0.3, 3)).toBe(3);
    expect(computeWheelZoomScale(0.35, 1200, 0.3, 3)).toBe(0.3);
  });

  it('keeps the mouse local point under the same screen point while zooming', () => {
    const before = { scale: 1, tx: 100, ty: 50 };
    const localPoint = { x: 200, y: 120 };
    const beforeClient = clientPoint(before, localPoint);

    const after = computeZoomTransformAtLocalPoint(before, localPoint, 1.5);
    const afterClient = clientPoint(after, localPoint);

    expect(afterClient.x).toBeCloseTo(beforeClient.x, 3);
    expect(afterClient.y).toBeCloseTo(beforeClient.y, 3);
  });

  it('keeps the viewport center stable for toolbar zoom operations', () => {
    const viewport = { width: 800, height: 500 };
    const before = { scale: 1, tx: 300, ty: 200 };
    const center = computeLocalCenter(viewport, before);
    const after = computeZoomTransformAtLocalPoint(before, center, 1.2);
    const afterCenter = computeLocalCenter(viewport, after);

    expect(afterCenter.x).toBeCloseTo(center.x, 3);
    expect(afterCenter.y).toBeCloseTo(center.y, 3);
  });

  it('moves the canvas viewport by the exact mouse drag delta', () => {
    expect(computePanTranslate({ tx: 180, ty: 224 }, { dx: 35, dy: -18 })).toEqual({
      tx: 215,
      ty: 206,
    });
  });
});

function clientPoint(
  transform: { scale: number; tx: number; ty: number },
  localPoint: { x: number; y: number }
): { x: number; y: number } {
  return {
    x: localPoint.x * transform.scale + transform.tx,
    y: localPoint.y * transform.scale + transform.ty,
  };
}
