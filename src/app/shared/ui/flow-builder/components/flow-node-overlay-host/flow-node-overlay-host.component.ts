import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  FlowBuilderMode,
  FlowContextMenuEvent,
  FlowDefinition,
  FlowNode,
  FlowNodeTypeDefinition,
  FlowViewportSnapshot,
} from '../../models';
import { FlowNodeTemplateDirective } from '../../directives/flow-template.directives';

interface OverlayDragState {
  nodeId: string;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  originX: number;
  originY: number;
  moved: boolean;
}

@Component({
  selector: 'app-flow-node-overlay-host',
  standalone: false,
  templateUrl: './flow-node-overlay-host.component.html',
  styleUrls: ['./flow-node-overlay-host.component.css'],
})
export class FlowNodeOverlayHostComponent {
  @Input() value: FlowDefinition | null = null;
  @Input() nodeTypes: FlowNodeTypeDefinition[] | null = [];
  @Input() nodeTemplates: Iterable<FlowNodeTemplateDirective> | null = null;
  @Input() viewport: FlowViewportSnapshot | null = null;
  @Input() selectedId: string | null = null;
  @Input() mode: FlowBuilderMode = 'edit';
  @Input() linkDragging = false;

  @Output() readonly nodeClick = new EventEmitter<string>();
  @Output() readonly nodeMove = new EventEmitter<{ nodeId: string; x: number; y: number }>();
  @Output() readonly contextMenu = new EventEmitter<FlowContextMenuEvent>();
  @Output() readonly addNodeFromPort = new EventEmitter<{ sourceNodeId: string; sourcePortId: string; nodeType: string }>();
  @Output() readonly portDragStart = new EventEmitter<{ nodeId: string; portId: string; clientX: number; clientY: number }>();

  dragState: OverlayDragState | null = null;
  addMenuNodeId: string | null = null;
  private previewPositions = new Map<string, { x: number; y: number }>();

  get htmlNodes(): FlowNode[] {
    return (this.value?.nodes ?? []).filter(node => this.isHtmlNode(node) && this.hasRenderablePosition(node));
  }

  overlayStyle(): Record<string, string> {
    const scale = this.viewport?.scale ?? 1;
    const tx = this.viewport?.translateX ?? 0;
    const ty = this.viewport?.translateY ?? 0;
    return {
      transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
    };
  }

  nodeStyle(node: FlowNode): Record<string, string> {
    const position = this.positionFor(node);
    const size = this.sizeFor(node);
    return {
      left: `${position.x}px`,
      top: `${position.y}px`,
      width: `${size.width}px`,
      height: `${size.height}px`,
    };
  }

  templateFor(node: FlowNode): FlowNodeTemplateDirective | null {
    const templates = Array.from(this.nodeTemplates ?? []);
    return templates.find(template => template.type === node.type) ?? null;
  }

  commonTemplateName(node: FlowNode): string | null {
    return this.nodeType(node)?.template ?? null;
  }

  nodeContext(node: FlowNode): { $implicit: FlowNode; node: FlowNode; data: Record<string, unknown> } {
    return {
      $implicit: node,
      node,
      data: node.data ?? {},
    };
  }

  onNodePointerDown(event: PointerEvent, node: FlowNode): void {
    if (event.button !== 0 || this.mode !== 'edit' || this.isInteractiveTarget(event.target)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const position = this.positionFor(node);
    this.dragState = {
      nodeId: node.id,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originX: position.x,
      originY: position.y,
      moved: false,
    };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  onNodePointerMove(event: PointerEvent): void {
    const state = this.dragState;
    if (!state || state.pointerId !== event.pointerId) return;

    event.preventDefault();
    event.stopPropagation();
    const scale = this.viewport?.scale || 1;
    const dx = (event.clientX - state.startClientX) / scale;
    const dy = (event.clientY - state.startClientY) / scale;

    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
      state.moved = true;
    }

    if (state.moved) {
      this.previewPositions.set(state.nodeId, {
        x: Math.round(state.originX + dx),
        y: Math.round(state.originY + dy),
      });
    }
  }

  onNodePointerUp(event: PointerEvent, node: FlowNode): void {
    const state = this.dragState;
    if (!state || state.pointerId !== event.pointerId) return;

    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
    this.dragState = null;

    if (state.moved) {
      const position = this.previewPositions.get(state.nodeId);
      if (position) {
        this.nodeMove.emit({ nodeId: state.nodeId, x: position.x, y: position.y });
      }
      this.previewPositions.delete(state.nodeId);
      return;
    }

    this.nodeClick.emit(node.id);
  }

  onNodePointerCancel(event: PointerEvent): void {
    const state = this.dragState;
    if (!state || state.pointerId !== event.pointerId) return;
    this.previewPositions.delete(state.nodeId);
    this.dragState = null;
  }

  onNodeContextMenu(event: MouseEvent, node: FlowNode): void {
    event.preventDefault();
    event.stopPropagation();
    this.contextMenu.emit({
      targetType: 'node',
      targetId: node.id,
      x: event.clientX,
      y: event.clientY,
    });
  }

  private isHtmlNode(node: FlowNode): boolean {
    const type = this.nodeType(node);
    return type?.shape === 'html' || !!type?.template || !!this.templateFor(node);
  }

  private nodeType(node: FlowNode): FlowNodeTypeDefinition | undefined {
    return (this.nodeTypes ?? []).find(type => type.type === node.type);
  }

  private positionFor(node: FlowNode): { x: number; y: number } {
    const preview = this.previewPositions.get(node.id);
    if (preview) return preview;
    const layoutPosition = this.layoutPositionFor(node);
    if (layoutPosition) return { x: layoutPosition.x, y: layoutPosition.y };
    return node.position ?? { x: 0, y: 0 };
  }

  private sizeFor(node: FlowNode): { width: number; height: number } {
    const layoutPosition = this.layoutPositionFor(node);
    if (layoutPosition) {
      return { width: layoutPosition.width, height: layoutPosition.height };
    }
    return node.size ?? this.nodeType(node)?.defaultSize ?? { width: 200, height: 70 };
  }

  private layoutPositionFor(node: FlowNode): { x: number; y: number; width: number; height: number } | null {
    return this.viewport?.nodePositions?.find(position => position.id === node.id) ?? null;
  }

  private hasRenderablePosition(node: FlowNode): boolean {
    return !!this.layoutPositionFor(node) || !!node.position || !!this.previewPositions.get(node.id);
  }

  private isInteractiveTarget(target: EventTarget | null): boolean {
    if (!(target instanceof Element)) return false;
    return !!target.closest('button,input,textarea,select,a,[data-flow-node-no-drag]');
  }

  get connectableNodes(): FlowNode[] {
    return (this.value?.nodes ?? []).filter(node => {
      const typeDef = this.nodeType(node);
      return this.hasRenderablePosition(node) && typeDef?.allowConnectFrom !== false && typeDef?.ports?.some(p => p.group === 'out');
    });
  }

  get addableNodeTypes(): FlowNodeTypeDefinition[] {
    return (this.nodeTypes ?? []).filter(t => t.allowConnectTo !== false);
  }

  addButtonStyle(node: FlowNode): Record<string, string> {
    const position = this.positionFor(node);
    const size = this.sizeFor(node);
    const scale = this.viewport?.scale ?? 1;
    return {
      left: `${position.x + size.width / 2}px`,
      top: `${position.y + size.height + 8}px`,
    };
  }

  toggleAddMenu(nodeId: string, event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.addMenuNodeId = this.addMenuNodeId === nodeId ? null : nodeId;
  }

  selectAddType(sourceNodeId: string, nodeType: string): void {
    const sourceNode = this.value?.nodes.find(node => node.id === sourceNodeId);
    const typeDef = sourceNode ? this.nodeType(sourceNode) : undefined;
    const outPort = typeDef?.ports?.find(p => p.group === 'out');
    this.addNodeFromPort.emit({
      sourceNodeId,
      sourcePortId: outPort?.id ?? 'out',
      nodeType,
    });
    this.addMenuNodeId = null;
  }

  closeAddMenu(): void {
    this.addMenuNodeId = null;
  }

  hasInPort(node: FlowNode): boolean {
    const typeDef = this.nodeType(node);
    return typeDef?.ports?.some(p => p.group === 'in') ?? false;
  }

  hasOutPort(node: FlowNode): boolean {
    const typeDef = this.nodeType(node);
    return typeDef?.ports?.some(p => p.group === 'out') ?? false;
  }

  onPortDragStart(event: PointerEvent, node: FlowNode): void {
    event.stopPropagation();
    event.preventDefault();
    const typeDef = this.nodeType(node);
    const outPort = typeDef?.ports?.find(p => p.group === 'out');
    this.portDragStart.emit({
      nodeId: node.id,
      portId: outPort?.id ?? 'out',
      clientX: event.clientX,
      clientY: event.clientY,
    });
  }
}
