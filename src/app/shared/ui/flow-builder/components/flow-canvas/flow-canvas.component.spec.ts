import { SimpleChange } from '@angular/core';
import { FlowCanvasComponent } from './flow-canvas.component';
import type { FlowDefinition } from '../../models';

describe('FlowCanvasComponent', () => {
  let component: FlowCanvasComponent;
  let engine: FakeFlowEngine;
  let frames: FrameRequestCallback[];

  beforeEach(() => {
    frames = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback: FrameRequestCallback) => {
      frames.push(callback);
      return frames.length;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id: number) => {
      frames[id - 1] = () => undefined;
    });

    component = new FlowCanvasComponent();
    engine = new FakeFlowEngine();
    (component as unknown as { engine: FakeFlowEngine }).engine = engine;
    (component as unknown as { initialized: boolean }).initialized = true;
    component.autoLayout = true;
    component.fitOnLoad = true;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('auto-layouts and fits the first unpositioned graph only after the initial frame settles', () => {
    component.value = singleNodeFlow('r1');

    component.ngOnChanges({ value: new SimpleChange(null, component.value, true) });

    expect(engine.autoLayout).toHaveBeenCalledTimes(1);
    expect(engine.fitContent).not.toHaveBeenCalled();

    flushFrames(2);

    expect(engine.fitContent).toHaveBeenCalledTimes(1);
  });

  it('does not refit when only node data changes for the same graph structure', () => {
    component.value = singleNodeFlow('r1');
    component.ngOnChanges({ value: new SimpleChange(null, component.value, true) });
    flushFrames(2);
    engine.reset();

    component.value = {
      ...singleNodeFlow('r1'),
      nodes: [{ ...singleNodeFlow('r1').nodes[0], data: { ruleCode: 'UPDATED' } }],
    };
    component.ngOnChanges({ value: new SimpleChange(null, component.value, false) });
    flushFrames(2);

    expect(engine.autoLayout).not.toHaveBeenCalled();
    expect(engine.fitContent).not.toHaveBeenCalled();
  });

  it('auto-layouts and fits a new unpositioned graph structure after the first render', () => {
    component.value = singleNodeFlow('r1');
    component.ngOnChanges({ value: new SimpleChange(null, component.value, true) });
    flushFrames(2);
    engine.reset();

    component.value = singleNodeFlow('r2');
    component.ngOnChanges({ value: new SimpleChange(null, component.value, false) });
    flushFrames(2);

    expect(engine.autoLayout).toHaveBeenCalledTimes(1);
    expect(engine.fitContent).toHaveBeenCalledTimes(1);
  });

  it('keeps the initial fit when a mouse viewport interaction arrives before first fit settles', () => {
    component.value = singleNodeFlow('r1');
    component.ngOnChanges({ value: new SimpleChange(null, component.value, true) });
    (component as unknown as { handleViewportInteraction: () => void }).handleViewportInteraction();

    flushFrames(2);

    expect(engine.fitContent).toHaveBeenCalledTimes(1);
  });

  it('treats mouse viewport interactions after the first fit as user intent', () => {
    component.value = singleNodeFlow('r1');
    component.ngOnChanges({ value: new SimpleChange(null, component.value, true) });
    flushFrames(2);
    engine.reset();

    (component as unknown as { handleViewportInteraction: () => void }).handleViewportInteraction();
    component.value = singleNodeFlow('r2');
    component.ngOnChanges({ value: new SimpleChange(null, component.value, false) });
    flushFrames(2);

    expect(engine.autoLayout).not.toHaveBeenCalled();
    expect(engine.fitContent).not.toHaveBeenCalled();
  });

  it('does not publish the pre-fit viewport that would render the first node in the corner', () => {
    const emitted: ReturnType<FakeFlowEngine['getViewportSnapshot']>[] = [];
    component.viewportChange.subscribe(snapshot => emitted.push(snapshot));
    component.value = singleNodeFlow('r1');

    component.ngOnChanges({ value: new SimpleChange(null, component.value, true) });
    (component as unknown as { handleViewportChange: (snapshot: ReturnType<FakeFlowEngine['getViewportSnapshot']>) => void })
      .handleViewportChange({
        scale: 1,
        translateX: 0,
        translateY: 0,
        clientWidth: 580,
        clientHeight: 520,
        contentBounds: { minX: 0, minY: 0, width: 220, height: 72 },
        nodePositions: [{ id: 'r1', x: 0, y: 0, width: 220, height: 72 }],
      });

    expect(component.viewportSnapshot).toBeNull();
    expect(emitted).toEqual([]);

    (component as unknown as { handleViewportInteraction: () => void }).handleViewportInteraction();
    expect(component.viewportSnapshot).toBeNull();
    expect(emitted).toEqual([]);

    flushFrames(2);

    expect(component.viewportSnapshot?.translateX).toBe(180);
    expect(component.viewportSnapshot?.translateY).toBe(224);
    expect(emitted).toHaveLength(1);
  });

  function flushFrames(count: number): void {
    for (let i = 0; i < count; i += 1) {
      const frame = frames.shift();
      frame?.(i);
    }
  }
});

class FakeFlowEngine {
  resizeToContainer = vi.fn();
  render = vi.fn();
  autoLayout = vi.fn();
  fitContent = vi.fn();
  clearHighlights = vi.fn();
  highlightNode = vi.fn();
  highlightEdge = vi.fn();

  getViewportSnapshot(): ReturnType<FlowCanvasComponent['engineInstance']['getViewportSnapshot']> {
    return {
      scale: 1,
      translateX: 180,
      translateY: 224,
      clientWidth: 580,
      clientHeight: 520,
      contentBounds: { minX: 0, minY: 0, width: 220, height: 72 },
      nodePositions: [{ id: 'r1', x: 0, y: 0, width: 220, height: 72 }],
    };
  }

  reset(): void {
    this.resizeToContainer.mockClear();
    this.render.mockClear();
    this.autoLayout.mockClear();
    this.fitContent.mockClear();
    this.clearHighlights.mockClear();
    this.highlightNode.mockClear();
    this.highlightEdge.mockClear();
  }
}

function singleNodeFlow(id: string): FlowDefinition {
  return {
    id: 'rule-flow',
    version: 1,
    nodes: [
      {
        id,
        type: 'rule-ref',
        label: 'Rule: TREND_IS_BEARISH_INTERNAL',
        data: { ruleCode: 'TREND_IS_BEARISH_INTERNAL' },
      },
    ],
    edges: [],
  };
}
