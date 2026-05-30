import * as joint from '@joint/core';

type JointDomEvent = joint.dia.Event & { data?: Record<string, unknown> };

export interface JointLinkDragInteractionOptions {
  paper: joint.dia.Paper;
  elementView: joint.dia.ElementView;
  magnet: SVGElement;
  clientX: number;
  clientY: number;
  onStart?: () => void;
  onEnd?: () => void;
}

export type CancelJointLinkDragInteraction = () => void;

export function startJointLinkDragInteraction(
  options: JointLinkDragInteractionOptions
): CancelJointLinkDragInteraction {
  const { paper, elementView, magnet, clientX, clientY, onStart, onEnd } = options;
  const abortController = new AbortController();
  const PointerCtor = globalThis.PointerEvent ?? MouseEvent;
  const startEvent = new PointerCtor('pointerdown', {
    bubbles: true,
    cancelable: true,
    button: 0,
    buttons: 1,
    clientX,
    clientY,
  }) as unknown as JointDomEvent;
  const startPoint = paper.clientToLocalPoint(clientX, clientY);
  let ended = false;

  elementView.dragLinkStart(startEvent, magnet, startPoint.x, startPoint.y);
  paper.undelegateEvents();
  onStart?.();

  const endInteraction = (): void => {
    if (ended) return;
    ended = true;
    abortController.abort();
    paper.delegateEvents();
    onEnd?.();
  };

  const withSharedEventData = (event: PointerEvent | KeyboardEvent | MouseEvent): JointDomEvent => {
    const jointEvent = event as unknown as JointDomEvent;
    jointEvent.data = startEvent.data;
    return jointEvent;
  };

  const cancelInteraction = (): void => {
    const linkView = elementView.eventData(startEvent)['linkView'] as joint.dia.LinkView | undefined;
    linkView?.model.remove();
    elementView.model.stopBatch('add-link');
    endInteraction();
  };

  document.addEventListener('pointermove', (event: PointerEvent) => {
    if (ended) return;
    event.preventDefault();
    const point = paper.clientToLocalPoint(event.clientX, event.clientY);
    elementView.dragLink(withSharedEventData(event), point.x, point.y);
  }, { signal: abortController.signal });

  document.addEventListener('pointerup', (event: PointerEvent) => {
    if (ended || event.button !== 0) return;
    event.preventDefault();
    const point = paper.clientToLocalPoint(event.clientX, event.clientY);
    elementView.dragLinkEnd(withSharedEventData(event), point.x, point.y);
    endInteraction();
  }, { signal: abortController.signal });

  document.addEventListener('pointercancel', () => {
    if (!ended) {
      cancelInteraction();
    }
  }, { signal: abortController.signal });

  document.addEventListener('contextmenu', (event: MouseEvent) => {
    if (ended) return;
    event.preventDefault();
    event.stopPropagation();
    cancelInteraction();
  }, { signal: abortController.signal });

  document.addEventListener('keydown', (event: KeyboardEvent) => {
    if (ended || event.key !== 'Escape') return;
    event.preventDefault();
    event.stopPropagation();
    cancelInteraction();
  }, { signal: abortController.signal });

  return cancelInteraction;
}
