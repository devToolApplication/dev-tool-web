import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  InjectionToken,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import BpmnModeler from 'bpmn-js/lib/Modeler';

import type {
  BpmnWorkflowNodeType,
  WorkflowEditorMode,
  WorkflowEditorViewport,
  WorkflowGraph,
  WorkflowNodePosition,
  WorkflowRuntimeVisualState,
  WorkflowValidationIssue,
} from '../model/workflow-studio.model';
import {
  workflowGraphFromBpmnXml,
  workflowGraphToBpmnXml,
} from './workflow-bpmn-adapter';

type BpmnCommand = 'fit' | 'zoomIn' | 'zoomOut' | 'resetZoom' | 'toggleNavigator' | 'fullscreen';

interface BpmnCanvasService {
  zoom(value?: number | 'fit-viewport', center?: 'auto'): number;
  viewbox(): { x: number; y: number; scale: number };
  addMarker(elementId: string, marker: string): void;
  removeMarker(elementId: string, marker: string): void;
}

interface BpmnElementRegistry {
  getAll(): Array<{ id: string; type?: string; businessObject?: { id?: string; $type?: string } }>;
}

interface BpmnClickEvent {
  element?: { id: string; type?: string; businessObject?: { id?: string; $type?: string } };
}

interface WorkflowBpmnModeler {
  importXML(xml: string): Promise<unknown>;
  saveXML(options?: { format?: boolean }): Promise<{ xml?: string }>;
  destroy(): void;
  get(serviceName: 'canvas'): BpmnCanvasService;
  get(serviceName: 'elementRegistry'): BpmnElementRegistry;
  get(serviceName: string): unknown;
  on(eventName: string, handler: (event: BpmnClickEvent) => void): void;
}

export const WORKFLOW_BPMN_MODELER_FACTORY = new InjectionToken<
  (container: HTMLElement) => WorkflowBpmnModeler
>('WORKFLOW_BPMN_MODELER_FACTORY', {
  providedIn: 'root',
  factory: () => (container) => new BpmnModeler({ container }) as unknown as WorkflowBpmnModeler,
});

const PALETTE_ITEMS: Array<{ type: BpmnWorkflowNodeType; label: string }> = [
  { type: 'START_EVENT', label: 'workflowStudio.bpmn.palette.start' },
  { type: 'END_EVENT', label: 'workflowStudio.bpmn.palette.end' },
  { type: 'AI_TASK', label: 'workflowStudio.bpmn.palette.ai' },
  { type: 'MCP_TASK', label: 'workflowStudio.bpmn.palette.mcp' },
  { type: 'CODE_TASK', label: 'workflowStudio.bpmn.palette.code' },
  { type: 'HTTP_TASK', label: 'workflowStudio.bpmn.palette.http' },
  { type: 'EXCLUSIVE_GATEWAY', label: 'workflowStudio.bpmn.palette.exclusive' },
  { type: 'PARALLEL_GATEWAY', label: 'workflowStudio.bpmn.palette.parallel' },
];

@Component({
  selector: 'app-workflow-bpmn-canvas',
  standalone: false,
  templateUrl: './workflow-bpmn-canvas.component.html',
  styleUrl: './workflow-bpmn-canvas.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class WorkflowBpmnCanvasComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLElement>;
  private readonly createModeler = inject(WORKFLOW_BPMN_MODELER_FACTORY);

  @Input() workflowId = 'workflow-draft';
  @Input() workflowName: string | undefined;
  @Input({ required: true }) graph!: WorkflowGraph;
  @Input() positions: Record<string, WorkflowNodePosition> = {};
  @Input() viewport: WorkflowEditorViewport | undefined;
  @Input() mode: WorkflowEditorMode = 'design';
  @Input() selectedId: string | null = null;
  @Input() validationIssues: WorkflowValidationIssue[] = [];
  @Input() runtimeStatus: WorkflowRuntimeVisualState = {};

  @Output() readonly graphChange = new EventEmitter<WorkflowGraph>();
  @Output() readonly positionsChange = new EventEmitter<Record<string, WorkflowNodePosition>>();
  @Output() readonly viewportChange = new EventEmitter<WorkflowEditorViewport>();
  @Output() readonly nodeSelected = new EventEmitter<string | null>();
  @Output() readonly edgeSelected = new EventEmitter<string | null>();
  @Output() readonly nodeAdded = new EventEmitter<{
    node: WorkflowGraph['nodes'][number];
    position: WorkflowNodePosition;
  }>();
  @Output() readonly nodeMoved = new EventEmitter<{
    nodeId: string;
    position: WorkflowNodePosition;
  }>();
  @Output() readonly connected = new EventEmitter<{ source: string; target: string }>();

  readonly paletteItems = PALETTE_ITEMS;
  private modeler: WorkflowBpmnModeler | null = null;
  private lastImportedXml = '';
  private importing = false;

  ngAfterViewInit(): void {
    this.modeler = this.createModeler(this.canvasRef.nativeElement);
    this.modeler.on('element.click', (event: BpmnClickEvent) => this.handleElementClick(event));
    this.modeler.on('commandStack.changed', () => void this.emitGraphFromModeler());
    void this.importCurrentGraph();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.modeler) {
      return;
    }
    if (changes['graph'] || changes['positions'] || changes['workflowId'] || changes['workflowName']) {
      void this.importCurrentGraph();
    }
    if (changes['selectedId'] || changes['validationIssues'] || changes['runtimeStatus']) {
      this.applyMarkers();
    }
  }

  ngOnDestroy(): void {
    this.modeler?.destroy();
    this.modeler = null;
  }

  readonlyMode(): boolean {
    return this.mode !== 'design';
  }

  addNode(type: BpmnWorkflowNodeType): void {
    if (this.readonlyMode()) {
      return;
    }
    const id = createNodeId(type, this.graph.nodes.map((node) => node.id));
    const position = { x: 120 + this.graph.nodes.length * 180, y: 140 };
    this.nodeAdded.emit({
      node: {
        id,
        type,
        name: PALETTE_ITEMS.find((item) => item.type === type)?.label ?? type,
        config: {},
        inputMapping: {},
        outputMapping: {},
        retryPolicy: { maxAttempts: 1 },
        timeoutPolicy: { timeoutSeconds: 30 },
      },
      position,
    });
  }

  revealElement(elementId: string): void {
    const canvas = this.canvasService();
    canvas?.addMarker(elementId, 'workflow-bpmn-canvas__marker--focused');
  }

  executeCommand(command: BpmnCommand): void {
    const canvas = this.canvasService();
    if (!canvas) {
      return;
    }

    switch (command) {
      case 'fit':
        canvas.zoom('fit-viewport', 'auto');
        break;
      case 'zoomIn':
        canvas.zoom(canvas.zoom() + 0.1, 'auto');
        break;
      case 'zoomOut':
        canvas.zoom(canvas.zoom() - 0.1, 'auto');
        break;
      case 'resetZoom':
        canvas.zoom(1, 'auto');
        break;
      case 'toggleNavigator':
      case 'fullscreen':
        break;
    }
    this.emitViewport();
  }

  private async importCurrentGraph(): Promise<void> {
    if (!this.modeler || !this.graph) {
      return;
    }

    const xml = workflowGraphToBpmnXml(this.graph, {
      processId: this.workflowId || 'workflow-draft',
      processName: this.workflowName,
      positions: this.positions,
    });
    if (xml === this.lastImportedXml) {
      return;
    }

    this.importing = true;
    try {
      await this.modeler.importXML(xml);
      this.lastImportedXml = xml;
      this.applyMarkers();
      this.emitViewport();
    } finally {
      this.importing = false;
    }
  }

  private async emitGraphFromModeler(): Promise<void> {
    if (!this.modeler || this.importing || this.readonlyMode()) {
      return;
    }

    const { xml } = await this.modeler.saveXML({ format: true });
    if (!xml || xml === this.lastImportedXml) {
      return;
    }

    const result = workflowGraphFromBpmnXml(xml);
    if (!result.issues.length) {
      this.graphChange.emit(result.graph);
    }
  }

  private handleElementClick(event: BpmnClickEvent): void {
    const element = event.element;
    const id = element?.businessObject?.id ?? element?.id ?? null;
    if (!id || element?.type === 'bpmn:Process') {
      this.nodeSelected.emit(null);
      this.edgeSelected.emit(null);
      return;
    }
    if (element?.type === 'bpmn:SequenceFlow' || element?.businessObject?.$type === 'bpmn:SequenceFlow') {
      this.edgeSelected.emit(id);
      return;
    }
    this.nodeSelected.emit(id);
  }

  private applyMarkers(): void {
    const canvas = this.canvasService();
    const registry = this.elementRegistry();
    if (!canvas || !registry) {
      return;
    }

    for (const element of registry.getAll()) {
      for (const marker of [
        'workflow-bpmn-canvas__marker--selected',
        'workflow-bpmn-canvas__marker--invalid',
        'workflow-bpmn-canvas__marker--running',
        'workflow-bpmn-canvas__marker--completed',
        'workflow-bpmn-canvas__marker--failed',
      ]) {
        canvas.removeMarker(element.id, marker);
      }
    }

    if (this.selectedId) {
      canvas.addMarker(this.selectedId, 'workflow-bpmn-canvas__marker--selected');
    }
    for (const issue of this.validationIssues) {
      const elementId = issue.nodeId ?? issue.edgeId;
      if (elementId) {
        canvas.addMarker(elementId, 'workflow-bpmn-canvas__marker--invalid');
      }
    }
    Object.entries(this.runtimeStatus.nodes ?? {}).forEach(([nodeId, status]) => {
      canvas.addMarker(nodeId, markerForStatus(status));
    });
    Object.entries(this.runtimeStatus.edges ?? {}).forEach(([edgeId, status]) => {
      canvas.addMarker(edgeId, markerForStatus(status));
    });
  }

  private emitViewport(): void {
    const viewbox = this.canvasService()?.viewbox();
    if (!viewbox) {
      return;
    }
    this.viewportChange.emit({ x: viewbox.x, y: viewbox.y, zoom: viewbox.scale });
  }

  private canvasService(): BpmnCanvasService | null {
    return this.modeler?.get('canvas') as BpmnCanvasService | null;
  }

  private elementRegistry(): BpmnElementRegistry | null {
    return this.modeler?.get('elementRegistry') as BpmnElementRegistry | null;
  }
}

function createNodeId(type: BpmnWorkflowNodeType, existingIds: string[]): string {
  const prefix = type.toLowerCase().replaceAll('_', '-');
  let index = 1;
  while (existingIds.includes(`${prefix}-${index}`)) {
    index += 1;
  }
  return `${prefix}-${index}`;
}

function markerForStatus(status: string): string {
  if (status === 'COMPLETED') {
    return 'workflow-bpmn-canvas__marker--completed';
  }
  if (status === 'ERROR' || status === 'TIMED_OUT' || status === 'CANCELLED') {
    return 'workflow-bpmn-canvas__marker--failed';
  }
  return 'workflow-bpmn-canvas__marker--running';
}
