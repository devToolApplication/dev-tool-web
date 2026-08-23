import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import {
  FlowBuilderComponent,
  FlowBuilderMode,
  FlowCapabilities,
  FlowConnectEvent,
  FlowDefinition,
  FlowEdge,
  FlowNode,
  FlowNodeChange,
  FlowValidationIssue,
  FlowViewportSnapshot,
} from '@shared/ui/patterns/flow-builder';

import {
  WorkflowEditorViewport,
  WorkflowGraph,
  WorkflowNodePosition,
  WorkflowRuntimeVisualState,
} from '../model/workflow-studio.model';
import {
  WORKFLOW_FLOW_NODE_TYPES,
  WorkflowCanvasMode,
  workflowCanvasModeToFlowMode,
  workflowCanvasReadonly,
  workflowGraphFromFlowDefinition,
  workflowGraphToFlowDefinition,
  workflowNodeFromFlowNode,
  workflowPositionsFromFlowDefinition,
  workflowViewportFromFlowDefinition,
} from './workflow-flow-adapter';

@Component({
  selector: 'app-workflow-canvas',
  standalone: false,
  templateUrl: './workflow-canvas.component.html',
  styleUrls: ['./workflow-canvas.component.css'],
})
export class WorkflowCanvasComponent {
  @ViewChild(FlowBuilderComponent) flowBuilder?: FlowBuilderComponent;

  @Input() workflowId = 'workflow-draft';
  @Input() workflowName: string | undefined;
  @Input({ required: true }) graph!: WorkflowGraph;
  @Input() positions: Record<string, WorkflowNodePosition> = {};
  @Input() viewport: WorkflowEditorViewport | undefined;
  @Input() mode: WorkflowCanvasMode = 'design';
  @Input() selectedId: string | null = null;
  @Input() validationIssues: FlowValidationIssue[] = [];
  @Input() runtimeStatus: WorkflowRuntimeVisualState = {};

  @Output() readonly graphChange = new EventEmitter<WorkflowGraph>();
  @Output() readonly positionsChange = new EventEmitter<Record<string, WorkflowNodePosition>>();
  @Output() readonly viewportChange = new EventEmitter<WorkflowEditorViewport>();
  @Output() readonly nodeSelected = new EventEmitter<string | null>();
  @Output() readonly edgeSelected = new EventEmitter<string | null>();
  @Output() readonly nodeAdded = new EventEmitter<{ node: WorkflowGraph['nodes'][number]; position: WorkflowNodePosition }>();
  @Output() readonly nodeMoved = new EventEmitter<{ nodeId: string; position: WorkflowNodePosition }>();
  @Output() readonly connected = new EventEmitter<{ source: string; target: string }>();

  readonly nodeTypes = WORKFLOW_FLOW_NODE_TYPES;

  flowCapabilities(): FlowCapabilities {
    return {
      history: false,
      importExport: false,
      navigator: true,
      inspector: false,
      fullscreen: true,
      autoLayout: false,
      deleteSelection: false,
      duplicateSelection: false,
      multiSelection: false,
      contextActions: false,
    };
  }

  flowDefinition(): FlowDefinition {
    return workflowGraphToFlowDefinition(this.graph, {
      workflowId: this.workflowId,
      workflowName: this.workflowName,
      positions: this.positions,
      viewport: this.viewport,
      mode: this.mode,
      runtimeStatus: this.runtimeStatus,
    });
  }

  flowMode(): FlowBuilderMode {
    return workflowCanvasModeToFlowMode(this.mode);
  }

  flowReadonly(): boolean {
    return workflowCanvasReadonly(this.mode);
  }

  onFlowDefinitionChange(definition: FlowDefinition): void {
    this.graphChange.emit(workflowGraphFromFlowDefinition(definition));
    this.positionsChange.emit(workflowPositionsFromFlowDefinition(definition));
    const viewport = workflowViewportFromFlowDefinition(definition);
    if (viewport) {
      this.viewportChange.emit(viewport);
    }
  }

  onFlowViewportChange(snapshot: FlowViewportSnapshot): void {
    this.viewportChange.emit({
      x: snapshot.translateX,
      y: snapshot.translateY,
      zoom: snapshot.scale,
    });
  }

  fitView(): void {
    this.flowBuilder?.executeCommand('fit');
  }

  zoomIn(): void {
    this.flowBuilder?.executeCommand('zoomIn');
  }

  zoomOut(): void {
    this.flowBuilder?.executeCommand('zoomOut');
  }

  resetView(): void {
    this.flowBuilder?.executeCommand('resetZoom');
  }

  onNodeClick(node: FlowNode): void {
    this.nodeSelected.emit(node.id);
  }

  onEdgeClick(edge: FlowEdge): void {
    this.edgeSelected.emit(edge.id);
  }

  onBlankClick(): void {
    this.nodeSelected.emit(null);
    this.edgeSelected.emit(null);
  }

  onNodeChange(event: FlowNodeChange): void {
    if (event.type === 'add') {
      this.nodeAdded.emit({
        node: workflowNodeFromFlowNode(event.node),
        position: event.node.position ? { ...event.node.position } : { x: 0, y: 0 },
      });
      return;
    }
    // ponytail: phase 03 emits movement only; add resize/port events when node sizing becomes editable.
    if (event.type !== 'move' || !event.node.position) {
      return;
    }
    this.nodeMoved.emit({
      nodeId: event.node.id,
      position: { ...event.node.position },
    });
  }

  onConnect(event: FlowConnectEvent): void {
    this.connected.emit({ source: event.sourceNodeId, target: event.targetNodeId });
  }
}
