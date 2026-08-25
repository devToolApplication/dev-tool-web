import { Pipe, PipeTransform } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  WORKFLOW_BPMN_MODELER_FACTORY,
  WorkflowBpmnCanvasComponent,
} from './workflow-bpmn-canvas.component';
import type { WorkflowGraph } from '../model/workflow-studio.model';

@Pipe({ name: 'translateContent', standalone: false })
class TranslateContentPipeStub implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

class MockModeler {
  static instances: MockModeler[] = [];

  readonly importXML = vi.fn(async (xml: string) => {
    this.importedXml = xml;
    return { warnings: [] };
  });
  readonly saveXML = vi.fn(async () => ({ xml: this.importedXml }));
  readonly destroy = vi.fn();
  readonly handlers = new Map<string, (event?: unknown) => void>();
  importedXml = '';
  zoomValue = 1;
  readonly markers: Array<{ action: string; elementId: string; marker: string }> = [];

  constructor() {
    MockModeler.instances.push(this);
  }

  on(eventName: string, handler: (event?: unknown) => void): void {
    this.handlers.set(eventName, handler);
  }

  get(serviceName: string): unknown {
    if (serviceName === 'canvas') {
      return {
        zoom: vi.fn((value?: number | 'fit-viewport') => {
          if (typeof value === 'number') {
            this.zoomValue = value;
          }
          return this.zoomValue;
        }),
        viewbox: vi.fn(() => ({ x: 12, y: 24, scale: this.zoomValue })),
        addMarker: vi.fn((elementId: string, marker: string) => {
          this.markers.push({ action: 'add', elementId, marker });
        }),
        removeMarker: vi.fn((elementId: string, marker: string) => {
          this.markers.push({ action: 'remove', elementId, marker });
        }),
      };
    }
    if (serviceName === 'elementRegistry') {
      return {
        getAll: vi.fn(() => [
          { id: 'start', type: 'bpmn:StartEvent', businessObject: { id: 'start' } },
          { id: 'flow-1', type: 'bpmn:SequenceFlow', businessObject: { id: 'flow-1' } },
        ]),
      };
    }
    return null;
  }
}

describe('WorkflowBpmnCanvasComponent', () => {
  let fixture: ComponentFixture<WorkflowBpmnCanvasComponent>;
  let component: WorkflowBpmnCanvasComponent;

  beforeEach(async () => {
    MockModeler.instances = [];
    await TestBed.configureTestingModule({
      declarations: [WorkflowBpmnCanvasComponent, TranslateContentPipeStub],
      providers: [
        {
          provide: WORKFLOW_BPMN_MODELER_FACTORY,
          useValue: () => new MockModeler(),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkflowBpmnCanvasComponent);
    component = fixture.componentInstance;
    component.workflowId = 'wf-1';
    component.workflowName = 'Flowable workflow';
    component.bpmnXml = sampleXml();
  });

  it('initializes bpmn-js with current workflow XML and destroys it on component destroy', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const modeler = MockModeler.instances[0];
    expect(modeler.importXML).toHaveBeenCalledOnce();
    expect(modeler.importedXml).toContain('<process id="wf_1" name="Flowable workflow" isExecutable="true">');
    expect(modeler.importedXml).toContain('<bpmndi:BPMNDiagram');

    fixture.destroy();

    expect(modeler.destroy).toHaveBeenCalledOnce();
  });

  it('emits palette-created BPMN nodes only in design mode', () => {
    const added: WorkflowGraph['nodes'] = [];
    component.nodeAdded.subscribe((event) => added.push(event.node));

    component.addNode('AI_TASK');
    component.mode = 'readonly';
    component.addNode('HTTP_TASK');

    expect(added).toHaveLength(1);
    expect(added[0]).toMatchObject({
      id: 'ai-task-1',
      type: 'AI_TASK',
      config: {},
      retryPolicy: { maxAttempts: 1 },
    });
  });

  it('emits node and sequence-flow selection from bpmn-js element clicks', async () => {
    const selectedNodes: Array<string | null> = [];
    const selectedEdges: Array<string | null> = [];
    component.nodeSelected.subscribe((nodeId) => selectedNodes.push(nodeId));
    component.edgeSelected.subscribe((edgeId) => selectedEdges.push(edgeId));
    fixture.detectChanges();
    await fixture.whenStable();

    const modeler = MockModeler.instances[0];
    modeler.handlers.get('element.click')?.({
      element: { id: 'start', type: 'bpmn:StartEvent', businessObject: { id: 'start' } },
    });
    modeler.handlers.get('element.click')?.({
      element: { id: 'flow-1', type: 'bpmn:SequenceFlow', businessObject: { id: 'flow-1' } },
    });

    expect(selectedNodes).toEqual(['start']);
    expect(selectedEdges).toEqual(['flow-1']);
  });

  it('delegates viewport commands and emits viewport snapshots', async () => {
    const viewports: Array<{ x: number; y: number; zoom: number }> = [];
    component.viewportChange.subscribe((viewport) => viewports.push(viewport));
    fixture.detectChanges();
    await fixture.whenStable();

    component.executeCommand('zoomIn');
    component.executeCommand('zoomOut');
    component.executeCommand('resetZoom');
    component.executeCommand('fit');

    expect(viewports.at(-1)).toEqual({ x: 12, y: 24, zoom: 1 });
  });

  it('applies selected, validation and runtime markers', async () => {
    component.selectedId = 'start';
    component.validationIssues = [{ code: 'BAD', message: 'Bad node', severity: 'error', edgeId: 'flow-1' }];
    component.runtimeStatus = { nodes: { end: 'COMPLETED' } };

    fixture.detectChanges();
    await fixture.whenStable();

    const markers = MockModeler.instances[0].markers.filter((marker) => marker.action === 'add');
    expect(markers).toEqual(expect.arrayContaining([
      { action: 'add', elementId: 'start', marker: 'workflow-bpmn-canvas__marker--selected' },
      { action: 'add', elementId: 'flow-1', marker: 'workflow-bpmn-canvas__marker--invalid' },
      { action: 'add', elementId: 'end', marker: 'workflow-bpmn-canvas__marker--completed' },
    ]));
  });
});

function sampleXml(): string {
  return '<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"><process id="wf_1" name="Flowable workflow" isExecutable="true"><startEvent id="start" /><sequenceFlow id="flow-1" sourceRef="start" targetRef="end" /><endEvent id="end" /></process><bpmndi:BPMNDiagram id="diag"><bpmndi:BPMNPlane id="plane" bpmnElement="wf_1" /></bpmndi:BPMNDiagram></definitions>';
}
