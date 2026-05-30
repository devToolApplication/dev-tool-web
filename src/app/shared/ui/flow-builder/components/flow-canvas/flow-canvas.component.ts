import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  QueryList,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {
  FlowDefinition,
  FlowNodeTypeDefinition,
  FlowEdgeTypeDefinition,
  FlowBuilderMode,
  FlowConnectEvent,
  FlowContextMenuEvent,
  FlowNodeDropEvent,
  FlowViewportSnapshot,
} from '../../models';
import { JointFlowEngine } from '../../joint/joint-flow-engine';
import { FLOW_NODE_DRAG_TYPE } from '../flow-palette/flow-palette.component';
import { FlowNodeTemplateDirective } from '../../directives/flow-template.directives';

@Component({
  selector: 'app-flow-canvas',
  standalone: false,
  template: `
    <div #canvasContainer class="flow-canvas" (dragover)="onDragOver($event)" (drop)="onDrop($event)">
      <div #paperContainer class="flow-canvas__paper"></div>
      <app-flow-node-overlay-host
        [value]="value"
        [nodeTypes]="nodeTypes ?? []"
        [nodeTemplates]="nodeTemplates"
        [viewport]="viewportSnapshot"
        [selectedId]="selectedId"
        [mode]="mode"
        [linkDragging]="linkDragging"
        (nodeClick)="nodeClick.emit($event)"
        (nodeMove)="nodeMove.emit($event)"
        (contextMenu)="contextMenu.emit($event)"
        (addNodeFromPort)="addNodeFromPort.emit($event)"
        (portDragStart)="onPortDragStart($event)"
      ></app-flow-node-overlay-host>
    </div>
  `,
  styleUrls: ['./flow-canvas.component.css'],
})
export class FlowCanvasComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('canvasContainer', { static: true }) canvasContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('paperContainer', { static: true }) paperContainer!: ElementRef<HTMLDivElement>;

  @Input() value: FlowDefinition | null = null;
  @Input() nodeTypes: FlowNodeTypeDefinition[] | null = [];
  @Input() edgeTypes: FlowEdgeTypeDefinition[] | null = [];
  @Input() nodeTemplates: QueryList<FlowNodeTemplateDirective> | null = null;
  @Input() mode: FlowBuilderMode = 'edit';
  @Input() selectedId: string | null = null;
  @Input() autoLayout = false;
  @Input() fitOnLoad = true;

  @Output() readonly nodeClick = new EventEmitter<string>();
  @Output() readonly edgeClick = new EventEmitter<string>();
  @Output() readonly blankClick = new EventEmitter<void>();
  @Output() readonly connect = new EventEmitter<FlowConnectEvent>();
  @Output() readonly nodeMove = new EventEmitter<{ nodeId: string; x: number; y: number }>();
  @Output() readonly contextMenu = new EventEmitter<FlowContextMenuEvent>();
  @Output() readonly nodeDrop = new EventEmitter<FlowNodeDropEvent>();
  @Output() readonly viewportChange = new EventEmitter<FlowViewportSnapshot>();
  @Output() readonly addNodeFromPort = new EventEmitter<{ sourceNodeId: string; sourcePortId: string; nodeType: string }>();
  @Output() readonly portDragStart = new EventEmitter<{ nodeId: string; portId: string; clientX: number; clientY: number }>();

  private engine!: JointFlowEngine;
  private initialized = false;
  private firstRenderDone = false;
  private userInteracted = false;
  private resizeObserver?: ResizeObserver;
  private scheduledFit = 0;
  private initialFitAttempts = 0;
  private lastGraphStructureKey = '';
  private initialViewportPending = false;
  private pendingViewportSnapshot: FlowViewportSnapshot | null = null;
  viewportSnapshot: FlowViewportSnapshot | null = null;
  linkDragging = false;

  get engineInstance(): JointFlowEngine {
    return this.engine;
  }

  ngAfterViewInit(): void {
    this.engine = new JointFlowEngine({
      el: this.paperContainer.nativeElement,
      readonly: this.mode !== 'edit',
      callbacks: {
        onNodeClick: (id) => this.nodeClick.emit(id),
        onEdgeClick: (id) => this.edgeClick.emit(id),
        onBlankClick: () => this.blankClick.emit(),
        onConnect: (event) => this.connect.emit(event),
        onNodeMove: (id, x, y) => this.nodeMove.emit({ nodeId: id, x, y }),
        onContextMenu: (event) => this.contextMenu.emit(event),
        onViewportChange: (snapshot) => this.handleViewportChange(snapshot),
        onViewportInteraction: () => this.handleViewportInteraction(),
        onLinkDragStart: () => { this.linkDragging = true; },
        onLinkDragEnd: () => { this.linkDragging = false; },
      },
    });

    this.initialized = true;
    this.resizeObserver = new ResizeObserver(() => {
      this.engine.resizeToContainer(this.firstRenderDone);
      if (this.fitOnLoad && (this.value?.nodes?.length ?? 0) > 0 && !this.firstRenderDone && !this.userInteracted) {
        this.scheduleInitialFitContent();
      }
    });
    this.resizeObserver.observe(this.canvasContainer.nativeElement);
    this.renderGraph();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.initialized) return;

    if (changes['mode']) {
      this.engine.setMode(this.mode !== 'edit');
    }

    if (changes['value'] || changes['nodeTypes'] || changes['edgeTypes']) {
      this.renderGraph();
    }

    if (changes['selectedId']) {
      this.syncSelection();
    }
  }

  ngOnDestroy(): void {
    if (this.scheduledFit) {
      cancelAnimationFrame(this.scheduledFit);
    }
    this.resizeObserver?.disconnect();
    this.engine?.destroy();
  }

  onDragOver(event: DragEvent): void {
    if (this.mode !== 'edit') return;
    const canDrop = event.dataTransfer?.types.includes(FLOW_NODE_DRAG_TYPE);
    if (!canDrop) return;
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  onDrop(event: DragEvent): void {
    if (this.mode !== 'edit') return;
    const nodeType = event.dataTransfer?.getData(FLOW_NODE_DRAG_TYPE)
      || event.dataTransfer?.getData('text/plain');
    if (!nodeType) return;
    event.preventDefault();
    this.userInteracted = true;
    const point = this.engine.clientToLocalPoint(event.clientX, event.clientY);
    this.nodeDrop.emit({ nodeType, x: point.x, y: point.y });
  }

  onPortDragStart(event: { nodeId: string; portId: string; clientX: number; clientY: number }): void {
    if (this.mode !== 'edit') return;
    this.linkDragging = true;
    this.engine.startLinkFromPort(event.nodeId, event.portId, event.clientX, event.clientY);
  }

  private renderGraph(): void {
    this.engine.resizeToContainer();
    this.engine.render(this.value, this.nodeTypes ?? [], this.edgeTypes ?? []);

    const hasNodes = (this.value?.nodes?.length ?? 0) > 0;
    const graphStructureKey = this.graphStructureKey(this.value);
    const structureChanged = graphStructureKey !== this.lastGraphStructureKey;
    const hasUnpositionedNodes = (this.value?.nodes ?? []).some(node => !node.position);
    const shouldAutoPlace = hasNodes
      && !this.userInteracted
      && (!this.firstRenderDone || (structureChanged && hasUnpositionedNodes));
    this.lastGraphStructureKey = graphStructureKey;
    this.initialViewportPending = this.fitOnLoad && shouldAutoPlace;
    if (this.initialViewportPending) {
      this.pendingViewportSnapshot = null;
      this.viewportSnapshot = null;
    }

    if (this.autoLayout && shouldAutoPlace) {
      this.engine.autoLayout();
    }

    if (this.fitOnLoad && shouldAutoPlace) {
      this.firstRenderDone = false;
      this.scheduleInitialFitContent();
    } else if (hasNodes) {
      this.firstRenderDone = true;
    }

    this.syncSelection();
  }

  private graphStructureKey(value: FlowDefinition | null): string {
    if (!value) return '';
    const nodes = value.nodes.map(node => `${node.id}:${node.type}`).join('|');
    const edges = value.edges
      .map(edge => `${edge.id}:${edge.source.nodeId}:${edge.source.portId ?? ''}->${edge.target.nodeId}:${edge.target.portId ?? ''}`)
      .join('|');
    return `${nodes}::${edges}`;
  }

  private handleViewportChange(snapshot: FlowViewportSnapshot): void {
    if (this.initialViewportPending) {
      this.pendingViewportSnapshot = snapshot;
      return;
    }
    this.publishViewportSnapshot(snapshot);
  }

  private handleViewportInteraction(): void {
    if (this.initialViewportPending || !this.firstRenderDone) {
      return;
    }
    this.userInteracted = true;
  }

  private publishViewportSnapshot(snapshot: FlowViewportSnapshot): void {
    this.viewportSnapshot = snapshot;
    this.viewportChange.emit(snapshot);
  }

  private scheduleInitialFitContent(): void {
    if (this.scheduledFit) {
      cancelAnimationFrame(this.scheduledFit);
    }
    this.scheduledFit = requestAnimationFrame(() => {
      this.scheduledFit = requestAnimationFrame(() => {
        this.scheduledFit = 0;
        if (this.userInteracted || (this.value?.nodes?.length ?? 0) === 0) {
          this.firstRenderDone = true;
          this.initialViewportPending = false;
          if (this.pendingViewportSnapshot) {
            this.publishViewportSnapshot(this.pendingViewportSnapshot);
            this.pendingViewportSnapshot = null;
          }
          return;
        }

        this.engine.resizeToContainer();
        const snapshot = this.engine.getViewportSnapshot();
        if ((snapshot.clientWidth < 16 || snapshot.clientHeight < 16) && this.initialFitAttempts < 12) {
          this.initialFitAttempts += 1;
          this.scheduleInitialFitContent();
          return;
        }

        this.engine.fitContent();
        this.firstRenderDone = true;
        this.initialFitAttempts = 0;
        this.initialViewportPending = false;
        this.pendingViewportSnapshot = null;
        this.publishViewportSnapshot(this.engine.getViewportSnapshot());
      });
    });
  }

  private syncSelection(): void {
    if (!this.selectedId) {
      this.engine.clearHighlights();
      return;
    }
    if (this.value?.nodes.some(n => n.id === this.selectedId)) {
      this.engine.highlightNode(this.selectedId);
    } else if (this.value?.edges.some(e => e.id === this.selectedId)) {
      this.engine.highlightEdge(this.selectedId);
    } else {
      this.engine.clearHighlights();
    }
  }
}
