import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkflowCanvasComponent } from './workflow-canvas.component';
import { WorkflowGraph } from '../model/workflow-studio.model';

describe('WorkflowCanvasComponent', () => {
  let fixture: ComponentFixture<WorkflowCanvasComponent>;
  let component: WorkflowCanvasComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WorkflowCanvasComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkflowCanvasComponent);
    component = fixture.componentInstance;
    component.graph = sampleGraph();
    component.positions = {
      start: { x: 0, y: 0 },
      end: { x: 280, y: 0 },
    };
    component.workflowId = 'wf-1';
  });

  it('creates a flow definition from workflow inputs and maps mode to the shared canvas', () => {
    component.mode = 'runtime';
    component.runtimeStatus = {
      nodes: { start: 'RUNNING', end: 'PENDING' },
      edges: { start__end: 'COMPLETED' },
    };

    expect(component.flowDefinition()).toMatchObject({
      id: 'wf-1',
      readonly: true,
      nodes: [
        { id: 'start', type: 'START', position: { x: 0, y: 0 }, status: 'warning' },
        { id: 'end', type: 'END', position: { x: 280, y: 0 }, status: 'default' },
      ],
      edges: [{ id: 'start__end', status: 'success' }],
    });
    expect(component.flowMode()).toBe('trace');
    expect(component.flowReadonly()).toBe(true);
  });

  it('emits domain graph and editor positions when the canvas definition changes', () => {
    const graphChanges: WorkflowGraph[] = [];
    const positionChanges: Array<Record<string, { x: number; y: number }>> = [];
    component.graphChange.subscribe((graph) => graphChanges.push(graph));
    component.positionsChange.subscribe((positions) => positionChanges.push(positions));

    component.onFlowDefinitionChange({
      ...component.flowDefinition(),
      nodes: [
        {
          id: 'start',
          type: 'START',
          position: { x: 10, y: 20 },
          data: { workflowNode: { id: 'start', type: 'START' } },
        },
        {
          id: 'end',
          type: 'END',
          position: { x: 300, y: 20 },
          data: { workflowNode: { id: 'end', type: 'END' } },
        },
      ],
      edges: [
        {
          id: 'start__end',
          source: { nodeId: 'start', portId: 'out' },
          target: { nodeId: 'end', portId: 'in' },
        },
      ],
    });

    expect(graphChanges).toEqual([sampleGraph()]);
    expect(positionChanges).toEqual([{ start: { x: 10, y: 20 }, end: { x: 300, y: 20 } }]);
  });

  it('emits palette-created domain nodes and backend-compatible connections', () => {
    const addedNodes: WorkflowGraph['nodes'] = [];
    const connections: Array<{ source: string; target: string }> = [];
    component.nodeAdded.subscribe((event) => addedNodes.push(event.node));
    component.connected.subscribe((event) => connections.push(event));

    component.onNodeChange({
      type: 'add',
      node: {
        id: 'ai-gate-1',
        type: 'AI_GATE',
        position: { x: 50, y: 60 },
      },
    });
    component.onConnect({
      sourceNodeId: 'start',
      sourcePortId: 'out',
      targetNodeId: 'ai-gate-1',
      targetPortId: 'in',
    });

    expect(addedNodes[0]).toMatchObject({ id: 'ai-gate-1', type: 'AI_GATE' });
    expect(connections).toEqual([{ source: 'start', target: 'ai-gate-1' }]);
  });

  it('configures the shared palette as collapsible for design mode only', () => {
    expect(component.paletteConfig()).toEqual({ visible: true, collapsible: true });

    component.mode = 'runtime';

    expect(component.paletteConfig()).toEqual({ visible: false, collapsible: true });
  });

  it('disables shared graph mutation commands and delegates viewport controls to the shared canvas', () => {
    const executeCommand = vi.fn();
    component.flowBuilder = { executeCommand } as never;

    expect(component.flowCapabilities()).toMatchObject({
      autoLayout: false,
      contextActions: false,
      deleteSelection: false,
      duplicateSelection: false,
      history: false,
    });

    component.fitView();
    component.zoomIn();
    component.zoomOut();
    component.resetView();

    expect(executeCommand.mock.calls.map(([command]) => command)).toEqual([
      'fit',
      'zoomIn',
      'zoomOut',
      'resetZoom',
    ]);
  });

  it('maps shared viewport snapshots back to the workflow editor viewport', () => {
    const viewports: Array<{ x: number; y: number; zoom: number }> = [];
    component.viewportChange.subscribe((viewport) => viewports.push(viewport));

    component.onFlowViewportChange({
      scale: 0.75,
      translateX: 12,
      translateY: 24,
      clientWidth: 800,
      clientHeight: 600,
      contentBounds: { minX: 0, minY: 0, width: 400, height: 200 },
    });

    expect(viewports).toEqual([{ x: 12, y: 24, zoom: 0.75 }]);
  });
});

function sampleGraph(): WorkflowGraph {
  return {
    nodes: [
      { id: 'start', type: 'START' },
      { id: 'end', type: 'END' },
    ],
    edges: [{ source: 'start', target: 'end' }],
  };
}
