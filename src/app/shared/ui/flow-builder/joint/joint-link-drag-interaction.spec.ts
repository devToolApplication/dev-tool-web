import * as joint from '@joint/core';
import { startJointLinkDragInteraction } from './joint-link-drag-interaction';

describe('startJointLinkDragInteraction', () => {
  it('starts, moves, and completes a JointJS link drag from an external HTML control', () => {
    const magnet = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    const linkView = { model: { remove: vi.fn() } };
    const paper = fakePaper();
    const elementView = fakeElementView(linkView as unknown as joint.dia.LinkView);
    const onStart = vi.fn();
    const onEnd = vi.fn();

    startJointLinkDragInteraction({
      paper: paper as unknown as joint.dia.Paper,
      elementView: elementView as unknown as joint.dia.ElementView,
      magnet,
      clientX: 100,
      clientY: 80,
      onStart,
      onEnd,
    });

    document.dispatchEvent(pointerEvent('pointermove', 140, 120));
    document.dispatchEvent(pointerEvent('pointerup', 180, 160));

    expect(elementView.dragLinkStart).toHaveBeenCalledWith(expect.any(Event), magnet, 50, 40);
    expect(elementView.dragLink).toHaveBeenCalledWith(expect.any(Event), 70, 60);
    expect(elementView.dragLinkEnd).toHaveBeenCalledWith(expect.any(Event), 90, 80);
    expect(paper.undelegateEvents).toHaveBeenCalledTimes(1);
    expect(paper.delegateEvents).toHaveBeenCalledTimes(1);
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('cancels the temporary link and closes the batch when Escape is pressed', () => {
    const magnet = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    const linkView = { model: { remove: vi.fn() } };
    const paper = fakePaper();
    const elementView = fakeElementView(linkView as unknown as joint.dia.LinkView);
    const onEnd = vi.fn();

    startJointLinkDragInteraction({
      paper: paper as unknown as joint.dia.Paper,
      elementView: elementView as unknown as joint.dia.ElementView,
      magnet,
      clientX: 100,
      clientY: 80,
      onEnd,
    });

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    document.dispatchEvent(pointerEvent('pointermove', 140, 120));

    expect(linkView.model.remove).toHaveBeenCalledTimes(1);
    expect(elementView.model.stopBatch).toHaveBeenCalledWith('add-link');
    expect(elementView.dragLink).not.toHaveBeenCalled();
    expect(paper.delegateEvents).toHaveBeenCalledTimes(1);
    expect(onEnd).toHaveBeenCalledTimes(1);
  });
});

function fakePaper(): {
  clientToLocalPoint: ReturnType<typeof vi.fn>;
  undelegateEvents: ReturnType<typeof vi.fn>;
  delegateEvents: ReturnType<typeof vi.fn>;
} {
  return {
    clientToLocalPoint: vi.fn((x: number, y: number) => ({ x: x / 2, y: y / 2 })),
    undelegateEvents: vi.fn(),
    delegateEvents: vi.fn(),
  };
}

function fakeElementView(linkView: joint.dia.LinkView): {
  model: { stopBatch: ReturnType<typeof vi.fn> };
  dragLinkStart: ReturnType<typeof vi.fn>;
  dragLink: ReturnType<typeof vi.fn>;
  dragLinkEnd: ReturnType<typeof vi.fn>;
  eventData: ReturnType<typeof vi.fn>;
} {
  return {
    model: { stopBatch: vi.fn() },
    dragLinkStart: vi.fn((event: Event & { data?: Record<string, unknown> }) => {
      event.data = { linkView };
    }),
    dragLink: vi.fn(),
    dragLinkEnd: vi.fn(),
    eventData: vi.fn((event: Event & { data?: Record<string, unknown> }) => event.data ?? {}),
  };
}

function pointerEvent(type: string, clientX: number, clientY: number): PointerEvent {
  const EventCtor = globalThis.PointerEvent ?? MouseEvent;
  return new EventCtor(type, {
    bubbles: true,
    cancelable: true,
    button: 0,
    buttons: type === 'pointerup' ? 0 : 1,
    clientX,
    clientY,
  }) as PointerEvent;
}
