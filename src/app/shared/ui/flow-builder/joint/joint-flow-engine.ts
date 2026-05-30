import * as joint from '@joint/core';
import {
  FlowDefinition,
  FlowNodeTypeDefinition,
  FlowEdgeTypeDefinition,
  FlowConnectEvent,
  FlowContextMenuEvent,
  FlowViewportSnapshot,
} from '../models';
import { FLOW_PAPER_OPTIONS } from './joint-flow-paper-options';
import { createNodeShape, createEdgeShape, updateNodeShape } from './joint-flow-renderer';
import { applyTreeLayout } from './joint-flow-layout';
import {
  computeFitTransform,
  computeLocalCenter,
  computePanTranslate,
  computeTranslateForLocalCenter,
  computeWheelZoomScale,
  computeZoomTransformAtLocalPoint,
  resolveViewportSize,
} from './joint-flow-viewport';
import { CancelJointLinkDragInteraction, startJointLinkDragInteraction } from './joint-link-drag-interaction';

export interface FlowEngineCallbacks {
  onNodeClick?: (nodeId: string) => void;
  onEdgeClick?: (edgeId: string) => void;
  onBlankClick?: () => void;
  onConnect?: (event: FlowConnectEvent) => void;
  onNodeMove?: (nodeId: string, x: number, y: number) => void;
  onContextMenu?: (event: FlowContextMenuEvent) => void;
  onViewportChange?: (snapshot: FlowViewportSnapshot) => void;
  onViewportInteraction?: () => void;
  onLinkDragStart?: () => void;
  onLinkDragEnd?: () => void;
  validateConnection?: (sourceId: string, targetId: string) => boolean;
}

export interface FlowEngineOptions {
  el: HTMLElement;
  readonly?: boolean;
  callbacks?: FlowEngineCallbacks;
}

export class JointFlowEngine {
  readonly graph: joint.dia.Graph;
  readonly paper: joint.dia.Paper;

  private nodeMap = new Map<string, string>();
  private edgeMap = new Map<string, string>();
  private callbacks: FlowEngineCallbacks;
  private panning = false;
  private panMoved = false;
  private panStart = { x: 0, y: 0 };
  private panOrigin = { tx: 0, ty: 0 };
  private abortController = new AbortController();
  private lastClientWidth = 0;
  private lastClientHeight = 0;
  private cancelActiveLinkDrag: CancelJointLinkDragInteraction | null = null;
  private readonly minScale = 0.3;
  private readonly maxScale = 3;

  constructor(private options: FlowEngineOptions) {
    this.callbacks = options.callbacks ?? {};
    this.graph = new joint.dia.Graph();

    this.paper = new joint.dia.Paper({
      ...FLOW_PAPER_OPTIONS,
      el: options.el,
      model: this.graph,
      interactive: options.readonly
        ? false
        : { elementMove: true, linkMove: true, addLinkFromMagnet: true },
      defaultLink: () => this.createDefaultLink(),
      validateConnection: (cellViewS, _magnetS, cellViewT, magnetT) => {
        if (cellViewS === cellViewT) return false;
        const targetPort = magnetT?.getAttribute('port') ?? magnetT?.getAttribute('port-id');
        if (targetPort && targetPort !== 'in') return false;
        if (this.callbacks.validateConnection) {
          const sourceFlowId = this.findFlowNodeId(cellViewS.model.id as string);
          const targetFlowId = this.findFlowNodeId(cellViewT.model.id as string);
          if (!sourceFlowId || !targetFlowId) return false;
          return this.callbacks.validateConnection(sourceFlowId, targetFlowId);
        }
        return true;
      },
    });

    this.setupEvents();
    this.setupPanZoom(options.el);
  }

  destroy(): void {
    this.cancelActiveLinkDrag?.();
    this.cancelActiveLinkDrag = null;
    if (this.viewportChangeFrame) cancelAnimationFrame(this.viewportChangeFrame);
    this.abortController.abort();
    this.paper.remove();
  }

  setMode(readonly: boolean): void {
    this.paper.setInteractivity(
      readonly ? false : { elementMove: true, linkMove: true, addLinkFromMagnet: true }
    );
  }

  render(
    definition: FlowDefinition | null,
    nodeTypes: FlowNodeTypeDefinition[] = [],
    edgeTypes: FlowEdgeTypeDefinition[] = []
  ): void {
    if (!definition) {
      this.graph.clear();
      this.nodeMap.clear();
      this.edgeMap.clear();
      this.scheduleViewportChange();
      return;
    }

    const incomingNodeIds = new Set(definition.nodes.map(n => n.id));
    const incomingEdgeIds = new Set(definition.edges.map(e => e.id));

    // Remove stale nodes
    for (const [flowId, elId] of this.nodeMap.entries()) {
      if (!incomingNodeIds.has(flowId)) {
        const cell = this.graph.getCell(elId);
        if (cell) cell.remove();
        this.nodeMap.delete(flowId);
      }
    }

    // Remove stale edges
    for (const [flowId, linkId] of this.edgeMap.entries()) {
      if (!incomingEdgeIds.has(flowId)) {
        const cell = this.graph.getCell(linkId);
        if (cell) cell.remove();
        this.edgeMap.delete(flowId);
      }
    }

    // Add or update nodes
    for (const node of definition.nodes) {
      const existingElId = this.nodeMap.get(node.id);
      const typeDef = nodeTypes.find(t => t.type === node.type);
      if (existingElId) {
        const el = this.graph.getCell(existingElId);
        if (el?.isElement()) {
          updateNodeShape(el as joint.dia.Element, node, typeDef);
          if (node.position) {
            (el as joint.dia.Element).position(node.position.x, node.position.y);
          }
        }
      } else {
        const el = createNodeShape(node, typeDef);
        el.set('flowNodeId', node.id);
        this.graph.addCell(el);
        this.nodeMap.set(node.id, el.id as string);
      }
    }

    // Add or update edges
    for (const edge of definition.edges) {
      const existingLinkId = this.edgeMap.get(edge.id);
      const sourceElId = this.nodeMap.get(edge.source.nodeId);
      const targetElId = this.nodeMap.get(edge.target.nodeId);
      if (!sourceElId || !targetElId) continue;

      if (existingLinkId) {
        const link = this.graph.getCell(existingLinkId);
        if (link?.isLink()) {
          const jLink = link as joint.dia.Link;
          const typeDef = edgeTypes.find(t => t.type === (edge.data?.['type'] as string));
          jLink.source({ id: sourceElId, port: edge.source.portId || 'out' });
          jLink.target({ id: targetElId, port: edge.target.portId || 'in' });
          if (edge.label) {
            jLink.labels([{ attrs: { text: { text: edge.label } }, position: 0.5 }]);
          } else {
            jLink.labels([]);
          }
          const stroke = jLink.get('originalStroke') ?? undefined;
          if (!stroke && typeDef?.tone) {
            jLink.set('originalStroke', jLink.attr('line/stroke'));
          }
        }
      } else {
        const typeDef = edgeTypes.find(t => t.type === (edge.data?.['type'] as string));
        const link = createEdgeShape(edge, typeDef);
        link.source({ id: sourceElId, port: edge.source.portId || 'out' });
        link.target({ id: targetElId, port: edge.target.portId || 'in' });
        link.set('flowEdgeId', edge.id);
        this.graph.addCell(link);
        this.edgeMap.set(edge.id, link.id as string);
      }
    }

    this.scheduleViewportChange();
  }

  autoLayout(): void {
    applyTreeLayout(this.graph);
    this.clampCurrentTranslate();
    this.scheduleViewportChange();
  }

  fitContent(padding = 40): void {
    const { width, height } = this.syncDimensionsFromElement();
    if (this.graph.getCells().length === 0) {
      this.paper.scale(1, 1);
      this.paper.translate(0, 0);
      this.scheduleViewportChange();
      return;
    }
    const bounds = this.getContentBounds();
    if (!bounds) return;

    const transform = computeFitTransform(bounds, { width, height }, {
      padding,
      minScale: this.minScale,
      maxScale: 1,
    });

    this.paper.scale(transform.scale, transform.scale);
    this.paper.translate(transform.tx, transform.ty);
    this.scheduleViewportChange();
  }

  resizeToContainer(preserveCenter = false): void {
    const previousSize = this.measureViewportSize();
    const previousWidth = this.lastClientWidth || previousSize.width;
    const previousHeight = this.lastClientHeight || previousSize.height;
    const scale = this.paper.scale().sx || 1;
    const translate = this.paper.translate();
    const previousCenter = computeLocalCenter(
      { width: previousWidth, height: previousHeight },
      { scale, tx: translate.tx, ty: translate.ty }
    );
    const { width, height } = this.syncDimensionsFromElement();

    if (preserveCenter) {
      const nextTranslate = computeTranslateForLocalCenter(previousCenter, { width, height }, scale);
      const target = this.clampTranslate(nextTranslate.tx, nextTranslate.ty);
      this.paper.translate(target.tx, target.ty);
    } else {
      this.clampCurrentTranslate();
    }
    this.scheduleViewportChange();
  }

  clientToLocalPoint(clientX: number, clientY: number): { x: number; y: number } {
    const point = this.paper.clientToLocalPoint(clientX, clientY);
    return { x: point.x, y: point.y };
  }

  zoomIn(): void {
    this.zoomAtCenter(1.2);
  }

  zoomOut(): void {
    this.zoomAtCenter(1 / 1.2);
  }

  resetZoom(): void {
    this.paper.scale(1, 1);
    this.fitContent();
  }

  getViewportSnapshot(): FlowViewportSnapshot {
    const scale = this.paper.scale().sx;
    const translate = this.paper.translate();
    const { width: clientWidth, height: clientHeight } = this.measureViewportSize();
    const contentBounds = this.getContentBounds() ?? { minX: 0, minY: 0, width: 1, height: 1 };
    const nodePositions: Array<{ id: string; x: number; y: number; width: number; height: number }> = [];
    for (const [flowId, elId] of this.nodeMap.entries()) {
      const el = this.graph.getCell(elId);
      if (el?.isElement()) {
        const pos = (el as joint.dia.Element).position();
        const size = (el as joint.dia.Element).size();
        nodePositions.push({ id: flowId, x: pos.x, y: pos.y, width: size.width, height: size.height });
      }
    }
    return { scale, translateX: translate.tx, translateY: translate.ty, clientWidth, clientHeight, contentBounds, nodePositions };
  }

  panToLocalCenter(centerX: number, centerY: number): void {
    if (!Number.isFinite(centerX) || !Number.isFinite(centerY)) return;
    const scale = this.paper.scale().sx;
    const { width, height } = this.measureViewportSize();
    const target = this.clampTranslate(
      width / 2 - centerX * scale,
      height / 2 - centerY * scale
    );
    this.paper.translate(target.tx, target.ty);
    this.scheduleViewportChange();
  }

  startLinkFromPort(flowNodeId: string, portId: string, clientX: number, clientY: number): void {
    this.cancelActiveLinkDrag?.();
    this.cancelActiveLinkDrag = null;

    const elId = this.nodeMap.get(flowNodeId);
    if (!elId) return;
    const el = this.graph.getCell(elId);
    if (!el?.isElement()) return;

    const elementView = this.paper.findViewByModel(el as joint.dia.Element) as joint.dia.ElementView | null;
    if (!elementView) return;

    const portEl = (elementView.el as SVGElement).querySelector(`[port="${portId}"]`);
    if (!portEl) return;

    this.cancelActiveLinkDrag = startJointLinkDragInteraction({
      paper: this.paper,
      elementView,
      magnet: portEl as SVGElement,
      clientX,
      clientY,
      onStart: () => {
        this.options.el.classList.add('joint-link-dragging');
        this.callbacks.onLinkDragStart?.();
      },
      onEnd: () => {
        this.options.el.classList.remove('joint-link-dragging');
        this.cancelActiveLinkDrag = null;
        this.callbacks.onLinkDragEnd?.();
      },
    });
  }

  scheduleViewportChange(): void {
    if (this.viewportChangeFrame) return;
    this.viewportChangeFrame = requestAnimationFrame(() => {
      this.viewportChangeFrame = 0;
      this.callbacks.onViewportChange?.(this.getViewportSnapshot());
    });
  }

  private viewportChangeFrame = 0;

  private getContentBounds(): { minX: number; minY: number; width: number; height: number } | null {
    if (this.graph.getCells().length === 0) return null;
    const bbox = this.graph.getBBox();
    if (!bbox) return null;
    return {
      minX: bbox.x,
      minY: bbox.y,
      width: Math.max(bbox.width, 1),
      height: Math.max(bbox.height, 1),
    };
  }

  private syncDimensionsFromElement(): { width: number; height: number } {
    const { width, height } = this.measureViewportSize();
    this.paper.setDimensions(width, height);
    this.lastClientWidth = width;
    this.lastClientHeight = height;
    return { width, height };
  }

  private measureViewportSize(): { width: number; height: number } {
    return resolveViewportSize(
      { width: this.options.el.clientWidth, height: this.options.el.clientHeight },
      {
        width: this.options.el.parentElement?.clientWidth,
        height: this.options.el.parentElement?.clientHeight,
      },
      { width: this.lastClientWidth, height: this.lastClientHeight }
    );
  }

  private clampCurrentTranslate(): void {
    const translate = this.paper.translate();
    const clamped = this.clampTranslate(translate.tx, translate.ty);
    if (clamped.tx !== translate.tx || clamped.ty !== translate.ty) {
      this.paper.translate(clamped.tx, clamped.ty);
    }
  }

  private clampTranslate(tx: number, ty: number): { tx: number; ty: number } {
    const bounds = this.getContentBounds();
    if (!bounds) {
      return { tx: 0, ty: 0 };
    }

    const scale = this.paper.scale().sx || 1;
    const { width: clientWidth, height: clientHeight } = this.measureViewportSize();
    const localViewport = Math.max(clientWidth / scale, clientHeight / scale);
    const contentSpan = Math.max(bounds.width, bounds.height);
    const margin = Math.max(80, Math.min(220, Math.min(localViewport * 0.25, contentSpan * 0.2 + 80)));

    const minTx = -scale * (bounds.minX + bounds.width + margin);
    const maxTx = clientWidth - scale * (bounds.minX - margin);
    const minTy = -scale * (bounds.minY + bounds.height + margin);
    const maxTy = clientHeight - scale * (bounds.minY - margin);

    return {
      tx: Math.min(Math.max(tx, minTx), maxTx),
      ty: Math.min(Math.max(ty, minTy), maxTy),
    };
  }

  highlightNode(nodeId: string): void {
    this.clearHighlights();
    const elId = this.nodeMap.get(nodeId);
    if (!elId) return;
    const el = this.graph.getCell(elId);
    if (el?.isElement()) {
      (el as joint.dia.Element).attr('body/strokeWidth', 3);
      (el as joint.dia.Element).attr('body/stroke', 'var(--app-primary, #7a77ff)');
    }
  }

  highlightEdge(edgeId: string): void {
    this.clearHighlights();
    const linkId = this.edgeMap.get(edgeId);
    if (!linkId) return;
    const link = this.graph.getCell(linkId);
    if (link?.isLink()) {
      (link as joint.dia.Link).attr('line/stroke', 'var(--app-primary, #7a77ff)');
      (link as joint.dia.Link).attr('line/strokeWidth', 3);
    }
  }

  clearHighlights(): void {
    for (const el of this.graph.getElements()) {
      const origStroke = el.get('originalStroke') ?? 'var(--app-border, #d8dee8)';
      const origWidth = el.get('originalStrokeWidth') ?? 1.5;
      el.attr('body/stroke', origStroke);
      el.attr('body/strokeWidth', origWidth);
    }
    for (const link of this.graph.getLinks()) {
      link.attr('line/stroke', link.get('originalStroke') ?? 'var(--app-text-muted, #94a3b8)');
      link.attr('line/strokeWidth', 2);
    }
  }

  findFlowNodeId(elementId: string): string | null {
    for (const [flowId, elId] of this.nodeMap.entries()) {
      if (elId === elementId) return flowId;
    }
    return null;
  }

  findFlowEdgeId(linkId: string): string | null {
    for (const [flowId, lId] of this.edgeMap.entries()) {
      if (lId === linkId) return flowId;
    }
    return null;
  }

  private setupEvents(): void {
    this.paper.on('element:pointerclick', (view: joint.dia.ElementView, evt: joint.dia.Event) => {
      const flowId = this.findFlowNodeId(view.model.id as string);
      if (flowId && this.isNodeMenuTarget((evt as unknown as MouseEvent).target)) {
        evt.preventDefault();
        this.callbacks.onContextMenu?.({
          targetType: 'node',
          targetId: flowId,
          x: (evt as unknown as MouseEvent).clientX,
          y: (evt as unknown as MouseEvent).clientY,
        });
        return;
      }
      if (flowId) this.callbacks.onNodeClick?.(flowId);
    });

    this.paper.on('link:pointerclick', (view: joint.dia.LinkView) => {
      const flowId = this.findFlowEdgeId(view.model.id as string);
      if (flowId) this.callbacks.onEdgeClick?.(flowId);
    });

    this.paper.on('blank:pointerclick', () => {
      if (this.panMoved) {
        this.panMoved = false;
        return;
      }
      this.callbacks.onBlankClick?.();
    });

    this.paper.on('element:contextmenu', (view: joint.dia.ElementView, evt: joint.dia.Event) => {
      evt.preventDefault();
      const flowId = this.findFlowNodeId(view.model.id as string);
      if (flowId) {
        this.callbacks.onContextMenu?.({
          targetType: 'node',
          targetId: flowId,
          x: (evt as unknown as MouseEvent).clientX,
          y: (evt as unknown as MouseEvent).clientY,
        });
      }
    });

    this.paper.on('link:contextmenu', (view: joint.dia.LinkView, evt: joint.dia.Event) => {
      evt.preventDefault();
      const flowId = this.findFlowEdgeId(view.model.id as string);
      if (flowId) {
        this.callbacks.onContextMenu?.({
          targetType: 'edge',
          targetId: flowId,
          x: (evt as unknown as MouseEvent).clientX,
          y: (evt as unknown as MouseEvent).clientY,
        });
      }
    });

    this.paper.on('blank:contextmenu', (evt: joint.dia.Event) => {
      evt.preventDefault();
      this.callbacks.onContextMenu?.({
        targetType: 'blank',
        x: (evt as unknown as MouseEvent).clientX,
        y: (evt as unknown as MouseEvent).clientY,
      });
    });

    this.paper.on('link:connect', (linkView: joint.dia.LinkView) => {
      this.options.el.classList.remove('joint-link-dragging');
      this.callbacks.onLinkDragEnd?.();
      const link = linkView.model;
      const sourceElId = (link.source() as { id?: string })?.id;
      const targetElId = (link.target() as { id?: string })?.id;
      if (sourceElId && targetElId) {
        const sourceNodeId = this.findFlowNodeId(sourceElId);
        const targetNodeId = this.findFlowNodeId(targetElId);
        if (sourceNodeId && targetNodeId) {
          const sourcePort = (link.source() as { port?: string })?.port;
          const targetPort = (link.target() as { port?: string })?.port;
          this.callbacks.onConnect?.({
            sourceNodeId,
            sourcePortId: sourcePort,
            targetNodeId,
            targetPortId: targetPort,
          });
        }
      }
      link.remove();
    });

    this.paper.on('link:pointerdown', () => {
      this.options.el.classList.add('joint-link-dragging');
      this.callbacks.onLinkDragStart?.();
    });

    this.paper.on('link:pointerup', () => {
      this.options.el.classList.remove('joint-link-dragging');
      this.callbacks.onLinkDragEnd?.();
    });

    this.paper.on('element:magnet:pointerdown', () => {
      this.options.el.classList.add('joint-link-dragging');
      this.callbacks.onLinkDragStart?.();
    });

    this.paper.on('element:pointerup', (view: joint.dia.ElementView) => {
      const flowId = this.findFlowNodeId(view.model.id as string);
      if (flowId) {
        const pos = (view.model as joint.dia.Element).position();
        this.callbacks.onNodeMove?.(flowId, pos.x, pos.y);
      }
    });
  }

  private setupPanZoom(container: HTMLElement): void {
    const signal = this.abortController.signal;
    const surface = container.parentElement ?? container;

    surface.addEventListener('wheel', (e: WheelEvent) => {
      if (this.isWheelBlockedTarget(e.target)) return;
      e.preventDefault();
      const newScale = computeWheelZoomScale(this.paper.scale().sx, e.deltaY, this.minScale, this.maxScale);
      const point = this.paper.clientToLocalPoint(e.clientX, e.clientY);
      this.callbacks.onViewportInteraction?.();
      this.zoomToScale(newScale, point);
    }, { passive: false, signal });

    surface.addEventListener('mousedown', (e: MouseEvent) => {
      if (e.button === 1 || (e.button === 0 && this.isCanvasPanTarget(e.target))) {
        this.startPanning(e);
      }
    }, { signal });

    document.addEventListener('mousemove', (e: MouseEvent) => {
      if (!this.panning) return;
      e.preventDefault();
      const dx = e.clientX - this.panStart.x;
      const dy = e.clientY - this.panStart.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        this.panMoved = true;
      }
      const nextTranslate = computePanTranslate(this.panOrigin, { dx, dy });
      const target = this.clampTranslate(nextTranslate.tx, nextTranslate.ty);
      this.paper.translate(target.tx, target.ty);
      this.scheduleViewportChange();
    }, { signal });

    document.addEventListener('mouseup', () => {
      if (this.panning) {
        this.panning = false;
        this.options.el.style.cursor = '';
        surface.style.cursor = '';
        this.scheduleViewportChange();
      }
    }, { signal });
  }

  private zoomAtCenter(factor: number): void {
    const scale = this.paper.scale().sx || 1;
    const newScale = Math.min(Math.max(scale * factor, this.minScale), this.maxScale);
    const translate = this.paper.translate();
    const { width, height } = this.measureViewportSize();
    const center = computeLocalCenter({ width, height }, { scale, tx: translate.tx, ty: translate.ty });
    this.zoomToScale(newScale, center);
  }

  private zoomToScale(scale: number, localPoint: { x: number; y: number }): void {
    const currentScale = this.paper.scale().sx || 1;
    const translate = this.paper.translate();
    const next = computeZoomTransformAtLocalPoint(
      { scale: currentScale, tx: translate.tx, ty: translate.ty },
      localPoint,
      scale
    );
    this.paper.scale(next.scale, next.scale);
    const target = this.clampTranslate(next.tx, next.ty);
    this.paper.translate(target.tx, target.ty);
    this.scheduleViewportChange();
  }

  private createDefaultLink(): joint.dia.Link {
    return new joint.shapes.standard.Link({
      attrs: {
        line: {
          stroke: 'var(--app-text-muted, #94a3b8)',
          strokeWidth: 2,
          targetMarker: { type: 'path', d: 'M 10 -5 0 0 10 5 z', fill: 'var(--app-text-muted, #94a3b8)' },
        },
      },
      router: { name: 'manhattan', args: { step: 20 } },
      connector: { name: 'rounded', args: { radius: 8 } },
    });
  }

  private startPanning(e: MouseEvent): void {
    if (e.button !== 0 && e.button !== 1) return;
    e.preventDefault();
    this.callbacks.onViewportInteraction?.();
    this.panning = true;
    this.panMoved = false;
    this.panStart = { x: e.clientX, y: e.clientY };
    const t = this.paper.translate();
    this.panOrigin = { tx: t.tx, ty: t.ty };
    this.options.el.style.cursor = 'grabbing';
    const surface = this.options.el.parentElement;
    if (surface) surface.style.cursor = 'grabbing';
  }

  private isCanvasPanTarget(target: EventTarget | null): boolean {
    if (!(target instanceof Element)) return false;
    if (target.closest([
      '.joint-cell',
      '.flow-node-overlay',
      '.flow-add-button',
      '[data-flow-node-no-drag]',
      'button',
      'input',
      'textarea',
      'select',
      'a',
    ].join(','))) {
      return false;
    }
    return this.options.el.parentElement?.contains(target) ?? this.options.el.contains(target);
  }

  private isWheelBlockedTarget(target: EventTarget | null): boolean {
    if (!(target instanceof Element)) return false;
    return !!target.closest('input,textarea,select,[data-flow-node-no-drag]');
  }

  private isNodeMenuTarget(target: EventTarget | null): boolean {
    if (!(target instanceof Element)) return false;
    return !!target.closest([
      '[joint-selector="menuBody"]',
      '[joint-selector="menuDot1"]',
      '[joint-selector="menuDot2"]',
      '[joint-selector="menuDot3"]',
    ].join(','));
  }
}
