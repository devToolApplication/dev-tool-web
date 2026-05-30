import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { FlowDefinition, FlowEdge, FlowNode, FlowNodeTone, FlowNodeTypeDefinition, FlowViewportSnapshot } from '../../models';

interface NavigatorBounds {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

interface NavigatorBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface NavigatorRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

@Component({
  selector: 'app-flow-navigator',
  standalone: false,
  templateUrl: './flow-navigator.component.html',
  styleUrls: ['./flow-navigator.component.css'],
})
export class FlowNavigatorComponent {
  @ViewChild('body') bodyRef?: ElementRef<HTMLDivElement>;

  @Input() value: FlowDefinition | null = null;
  @Input() selectedId: string | null = null;
  @Input() viewport: FlowViewportSnapshot | null = null;
  @Input() nodeTypes: FlowNodeTypeDefinition[] = [];

  @Output() readonly nodeSelect = new EventEmitter<string>();
  @Output() readonly zoomIn = new EventEmitter<void>();
  @Output() readonly zoomOut = new EventEmitter<void>();
  @Output() readonly fit = new EventEmitter<void>();
  @Output() readonly close = new EventEmitter<void>();
  @Output() readonly viewportPan = new EventEmitter<{ centerX: number; centerY: number }>();

  readonly mapWidth = 300;
  readonly mapHeight = 180;
  readonly headerHeight = 32;
  readonly padding = 14;

  dragging = false;

  get bodyHeight(): number {
    return this.mapHeight - this.headerHeight;
  }

  get nodes(): FlowNode[] {
    const allNodes = this.value?.nodes ?? [];
    const positions = this.viewport?.nodePositions;
    if (positions?.length) {
      const positionedIds = new Set(positions.map(p => p.id));
      return allNodes.filter(n => positionedIds.has(n.id));
    }
    return allNodes.filter(node => !!node.position);
  }

  get bounds(): NavigatorBounds {
    const positions = this.viewport?.nodePositions;

    const boxes: NavigatorBox[] = [];

    // Only use real positions from engine — never fallback to (0,0)
    if (positions?.length) {
      for (const np of positions) {
        boxes.push({ left: np.x, top: np.y, right: np.x + np.width, bottom: np.y + np.height });
      }
    } else {
      for (const node of this.value?.nodes ?? []) {
        if (!node.position) continue;
        const size = node.size ?? this.nodeType(node)?.defaultSize ?? { width: 180, height: 64 };
        boxes.push({
          left: node.position.x,
          top: node.position.y,
          right: node.position.x + size.width,
          bottom: node.position.y + size.height,
        });
      }
    }

    const visibleBounds = this.visibleLocalBounds;
    if (visibleBounds) {
      boxes.push({
        left: visibleBounds.x,
        top: visibleBounds.y,
        right: visibleBounds.x + visibleBounds.width,
        bottom: visibleBounds.y + visibleBounds.height,
      });
    } else if (this.viewport?.contentBounds) {
      const b = this.viewport.contentBounds;
      boxes.push({ left: b.minX, top: b.minY, right: b.minX + b.width, bottom: b.minY + b.height });
    }

    if (boxes.length === 0) {
      return { minX: 0, minY: 0, width: 800, height: 600 };
    }

    const minX = Math.min(...boxes.map(b => b.left));
    const minY = Math.min(...boxes.map(b => b.top));
    const maxX = Math.max(...boxes.map(b => b.right));
    const maxY = Math.max(...boxes.map(b => b.bottom));

    const rawWidth = maxX - minX;
    const rawHeight = maxY - minY;
    const localPadding = Math.max(24, Math.min(Math.max(rawWidth, rawHeight) * 0.04, 120));

    return {
      minX: minX - localPadding,
      minY: minY - localPadding,
      width: Math.max(rawWidth + localPadding * 2, 1),
      height: Math.max(rawHeight + localPadding * 2, 1),
    };
  }

  get minimapScale(): number {
    const b = this.bounds;
    return Math.min(
      (this.mapWidth - this.padding * 2) / b.width,
      (this.bodyHeight - this.padding * 2) / b.height
    );
  }

  get visibleLocalBounds(): { x: number; y: number; width: number; height: number } | null {
    if (!this.viewport) return null;
    const { scale, translateX, translateY, clientWidth, clientHeight } = this.viewport;
    if (!scale || !clientWidth || !clientHeight) return null;
    return {
      x: -translateX / scale,
      y: -translateY / scale,
      width: clientWidth / scale,
      height: clientHeight / scale,
    };
  }

  nodeStyle(node: FlowNode): Record<string, string> {
    const rect = this.nodeMinimapRect(node);
    if (!rect) {
      return { display: 'none' };
    }
    return {
      left: `${rect.x}px`,
      top: `${rect.y}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    };
  }

  nodeClass(node: FlowNode): Record<string, boolean> {
    const tone = this.nodeTone(node);
    const typeDef = this.nodeType(node);
    return {
      'flow-navigator__node--selected': node.id === this.selectedId,
      'flow-navigator__node--condition': typeDef?.shape === 'diamond' || node.type === 'condition' || node.type === 'rule-condition' || node.type === 'rule-group',
      'flow-navigator__node--html': typeDef?.shape === 'html',
      [`flow-navigator__node--tone-${tone}`]: true,
    };
  }

  nodeMiniLabel(node: FlowNode): string {
    const rect = this.nodeMinimapRect(node);
    const typeDef = this.nodeType(node);
    if (!rect) return '';
    if (rect.width < 18 || rect.height < 10) return '';
    const label = typeDef?.labelResolver?.(node) ?? node.label ?? typeDef?.label ?? node.type;
    const normalized = String(label).trim().replace(/\s+/g, ' ');
    return normalized.length <= 4 ? normalized.toUpperCase() : normalized.slice(0, 3).toUpperCase();
  }

  private nodeMinimapRect(node: FlowNode): NavigatorRect | null {
    const positions = this.viewport?.nodePositions;
    const np = positions?.find(p => p.id === node.id);
    const position = np ? { x: np.x, y: np.y } : node.position;
    if (!position) {
      return null;
    }
    const size = np
      ? { width: np.width, height: np.height }
      : (node.size ?? this.nodeType(node)?.defaultSize ?? { width: 180, height: 64 });
    const b = this.bounds;
    const s = this.minimapScale;
    return {
      x: this.padding + (position.x - b.minX) * s,
      y: this.padding + (position.y - b.minY) * s,
      width: Math.max(size.width * s, 12),
      height: Math.max(size.height * s, 8),
    };
  }

  viewportStyle(): Record<string, string> | null {
    const vp = this.visibleLocalBounds;
    if (!vp) return null;
    const b = this.bounds;
    const s = this.minimapScale;
    const rect = this.clampMinimapRect({
      left: this.padding + (vp.x - b.minX) * s,
      top: this.padding + (vp.y - b.minY) * s,
      right: this.padding + (vp.x - b.minX) * s + vp.width * s,
      bottom: this.padding + (vp.y - b.minY) * s + vp.height * s,
    });
    return {
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.right - rect.left}px`,
      height: `${rect.bottom - rect.top}px`,
    };
  }

  get edges(): FlowEdge[] {
    return this.value?.edges ?? [];
  }

  get edgeLines(): Array<{ x1: number; y1: number; x2: number; y2: number }> {
    const edges = this.edges;
    if (!edges.length) return [];

    const b = this.bounds;
    const s = this.minimapScale;
    const positions = this.viewport?.nodePositions;
    const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];

    for (const edge of edges) {
      const sourcePos = this.getNodeCenter(edge.source.nodeId, 'bottom', positions);
      const targetPos = this.getNodeCenter(edge.target.nodeId, 'top', positions);
      if (!sourcePos || !targetPos) continue;

      lines.push({
        x1: this.padding + (sourcePos.x - b.minX) * s,
        y1: this.padding + (sourcePos.y - b.minY) * s,
        x2: this.padding + (targetPos.x - b.minX) * s,
        y2: this.padding + (targetPos.y - b.minY) * s,
      });
    }
    return lines;
  }

  private getNodeCenter(
    nodeId: string,
    port: 'top' | 'bottom',
    positions?: Array<{ id: string; x: number; y: number; width: number; height: number }> | null
  ): { x: number; y: number } | null {
    const np = positions?.find(p => p.id === nodeId);
    if (np) {
      return {
        x: np.x + np.width / 2,
        y: port === 'bottom' ? np.y + np.height : np.y,
      };
    }
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node?.position) return null;
    const pos = node.position;
    const size = node.size ?? { width: 180, height: 64 };
    return {
      x: pos.x + size.width / 2,
      y: port === 'bottom' ? pos.y + size.height : pos.y,
    };
  }

  onViewportPointerDown(event: PointerEvent): void {
    this.dragging = true;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this.emitPanFromEvent(event);
  }

  onViewportPointerMove(event: PointerEvent): void {
    if (!this.dragging) return;
    this.emitPanFromEvent(event);
  }

  onViewportPointerUp(event: PointerEvent): void {
    this.dragging = false;
    (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
  }

  onBodyClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.closest('.flow-navigator__node') || target.closest('.flow-navigator__viewport')) return;
    this.emitPanFromMouseEvent(event);
  }

  private emitPanFromEvent(event: PointerEvent): void {
    const body = this.bodyRef?.nativeElement;
    if (!body) return;
    const rect = body.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    this.emitPanFromCoords(x, y);
  }

  private emitPanFromMouseEvent(event: MouseEvent): void {
    const body = this.bodyRef?.nativeElement;
    if (!body) return;
    const rect = body.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    this.emitPanFromCoords(x, y);
  }

  private emitPanFromCoords(x: number, y: number): void {
    const b = this.bounds;
    const s = this.minimapScale;
    let localX = b.minX + (x - this.padding) / s;
    let localY = b.minY + (y - this.padding) / s;

    localX = Math.max(b.minX, Math.min(localX, b.minX + b.width));
    localY = Math.max(b.minY, Math.min(localY, b.minY + b.height));

    this.viewportPan.emit({ centerX: localX, centerY: localY });
  }

  private clampMinimapRect(rect: NavigatorBox): NavigatorBox {
    const minWidth = 8;
    const minHeight = 6;
    const maxWidth = this.mapWidth;
    const maxHeight = this.bodyHeight;

    const left = Math.max(0, Math.min(rect.left, maxWidth - minWidth));
    const top = Math.max(0, Math.min(rect.top, maxHeight - minHeight));
    const right = Math.min(maxWidth, Math.max(rect.right, left + minWidth));
    const bottom = Math.min(maxHeight, Math.max(rect.bottom, top + minHeight));

    return {
      left,
      top,
      right: Math.max(right, left + minWidth),
      bottom: Math.max(bottom, top + minHeight),
    };
  }

  private nodeType(node: FlowNode): FlowNodeTypeDefinition | undefined {
    return this.nodeTypes.find(type => type.type === node.type);
  }

  private nodeTone(node: FlowNode): FlowNodeTone {
    const statusTone = node.status && node.status !== 'default' && node.status !== 'selected' ? node.status : null;
    const typeTone = this.nodeType(node)?.tone;
    if (statusTone === 'success' || statusTone === 'warning' || statusTone === 'danger' || statusTone === 'muted') {
      return statusTone;
    }
    if (typeTone === 'primary' || typeTone === 'info' || typeTone === 'success' || typeTone === 'warning' || typeTone === 'danger' || typeTone === 'muted' || typeTone === 'neutral') {
      return typeTone;
    }
    return 'muted';
  }
}
