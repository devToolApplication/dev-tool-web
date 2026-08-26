import { runInInjectionContext, Injector } from '@angular/core';
import { readFileSync } from 'node:fs';
import {
  WORKFLOW_BPMN_MODELER_FACTORY,
  WorkflowBpmnCanvasComponent,
  WorkflowBpmnElementConfig,
} from './workflow-bpmn-canvas.component';

class MockModeler {
  readonly importXML = vi.fn(async (xml: string) => {
    this.importedXml = xml;
    return { warnings: [] };
  });
  saveXML = vi.fn(async () => ({ xml: this.importedXml }));
  readonly destroy = vi.fn();
  readonly handlers = new Map<string, (event?: unknown) => void>();
  importedXml = '';
  zoomValue = 1;
  readonly markers: Array<{ action: string; elementId: string; marker: string }> = [];

  readonly mockElements: Record<string, any> = {
    start: {
      id: 'start',
      type: 'bpmn:StartEvent',
      businessObject: { id: 'start', $type: 'bpmn:StartEvent', name: 'Start' },
    },
    'service-1': {
      id: 'service-1',
      type: 'bpmn:ServiceTask',
      businessObject: {
        id: 'service-1',
        $type: 'bpmn:ServiceTask',
        name: 'AI Task',
        $attrs: {
          'flowable:topic': 'ai-task',
          'flowable:type': 'external-worker',
          'flowable:taskConfigJson': '{}',
        },
        get: (attr: string) => this.mockElements['service-1'].businessObject.$attrs[attr],
        set: (attr: string, val: any) => {
          this.mockElements['service-1'].businessObject.$attrs =
            this.mockElements['service-1'].businessObject.$attrs || {};
          this.mockElements['service-1'].businessObject.$attrs[attr] = val;
        },
      },
    },
    'flow-1': {
      id: 'flow-1',
      type: 'bpmn:SequenceFlow',
      businessObject: {
        id: 'flow-1',
        $type: 'bpmn:SequenceFlow',
        name: 'Pass',
        sourceRef: { id: 'start' },
        conditionExpression: { body: '${approved == true}' },
      },
    },
    'message-event': {
      id: 'message-event',
      type: 'bpmn:IntermediateCatchEvent',
      businessObject: {
        id: 'message-event',
        $type: 'bpmn:IntermediateCatchEvent',
        eventDefinitions: [{ $type: 'bpmn:MessageEventDefinition' }],
      },
    },
    'error-boundary': {
      id: 'error-boundary',
      type: 'bpmn:BoundaryEvent',
      businessObject: {
        id: 'error-boundary',
        $type: 'bpmn:BoundaryEvent',
        eventDefinitions: [{ $type: 'bpmn:ErrorEventDefinition' }],
      },
    },
  };

  readonly modeling = {
    updateProperties: vi.fn((elem: any, props: any) => {
      const bo = elem.businessObject || elem;
      Object.assign(bo, props);
    }),
    updateModdleProperties: vi.fn((elem: any, bo: any, props: any) => {
      Object.assign(bo.$attrs, props);
    }),
  };

  readonly moddle = {
    create: vi.fn((type: string, props: any) => ({ $type: type, ...props })),
  };

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
        get: vi.fn((id: string) => this.mockElements[id]),
        getAll: vi.fn(() => Object.values(this.mockElements)),
      };
    }
    if (serviceName === 'modeling') {
      return this.modeling;
    }
    if (serviceName === 'moddle') {
      return this.moddle;
    }
    return null;
  }
}

describe('WorkflowBpmnCanvasComponent unit', () => {
  let component: WorkflowBpmnCanvasComponent;
  let mockModeler: MockModeler;

  beforeEach(() => {
    mockModeler = new MockModeler();
    const injector = Injector.create({
      providers: [
        {
          provide: WORKFLOW_BPMN_MODELER_FACTORY,
          useValue: () => mockModeler,
        },
      ],
    });

    component = runInInjectionContext(injector, () => new WorkflowBpmnCanvasComponent());
    component.canvasRef = { nativeElement: document.createElement('div') };
    component.workflowId = 'wf-1';
    component.workflowName = 'Flowable workflow';
    component.bpmnXml = sampleXml();
    component.ngAfterViewInit();
  });

  afterEach(() => {
    component?.ngOnDestroy();
  });

  it('initializes bpmn-js with current workflow XML and destroys it on component destroy', () => {
    expect(mockModeler.importXML).toHaveBeenCalledOnce();
    expect(mockModeler.importedXml).toContain(
      '<process id="wf_1" name="Flowable workflow" isExecutable="true">',
    );
    component.ngOnDestroy();
    expect(mockModeler.destroy).toHaveBeenCalledOnce();
  });

  it('emits node, sequence-flow, and element config selection from bpmn-js element clicks', () => {
    const selectedNodes: Array<string | null> = [];
    const selectedEdges: Array<string | null> = [];
    const selectedConfigs: Array<WorkflowBpmnElementConfig | null> = [];
    component.nodeSelected.subscribe((nodeId) => selectedNodes.push(nodeId));
    component.edgeSelected.subscribe((edgeId) => selectedEdges.push(edgeId));
    component.elementSelected.subscribe((config) => selectedConfigs.push(config));

    mockModeler.handlers.get('element.click')?.({
      element: mockModeler.mockElements['service-1'],
    });
    mockModeler.handlers.get('element.click')?.({
      element: mockModeler.mockElements['flow-1'],
    });

    expect(selectedNodes).toEqual(['service-1']);
    expect(selectedEdges).toEqual(['flow-1']);
    expect(selectedConfigs[0]).toMatchObject({
      id: 'service-1',
      type: 'bpmn:ServiceTask',
      name: 'AI Task',
      flowableTopic: 'ai-task',
      flowableType: 'external-worker',
      taskConfigJson: '{}',
    });
    expect(selectedConfigs[1]).toMatchObject({
      id: 'flow-1',
      type: 'bpmn:SequenceFlow',
      name: 'Pass',
      conditionExpression: '${approved == true}',
    });
  });

  it('emits empty refs for newly created message and error events', () => {
    const selectedConfigs: Array<WorkflowBpmnElementConfig | null> = [];
    component.elementSelected.subscribe((config) => selectedConfigs.push(config));

    mockModeler.handlers.get('element.click')?.({
      element: mockModeler.mockElements['message-event'],
    });
    mockModeler.handlers.get('element.click')?.({
      element: mockModeler.mockElements['error-boundary'],
    });

    expect(selectedConfigs[0]).toMatchObject({
      id: 'message-event',
      messageRef: '',
      messageName: '',
    });
    expect(selectedConfigs[1]).toMatchObject({
      id: 'error-boundary',
      errorRef: '',
      errorName: '',
    });
  });

  it('updates element config for service task and sequence flow, and emits saved XML', async () => {
    const emittedXmls: string[] = [];
    component.bpmnXmlChange.subscribe((xml) => emittedXmls.push(xml));
    mockModeler.saveXML = vi.fn(async () => ({ xml: '<definitions updated="true" />' }));

    await component.updateElementConfig({
      id: 'service-1',
      type: 'bpmn:ServiceTask',
      name: 'Renamed Service',
      flowableTopic: 'http-task',
      flowableType: 'external-worker',
      taskConfigJson: '{"url":"https://example.com"}',
    });

    expect(mockModeler.modeling.updateProperties).toHaveBeenCalledWith(
      mockModeler.mockElements['service-1'],
      { name: 'Renamed Service' },
    );
    expect(mockModeler.mockElements['service-1'].businessObject.$attrs['flowable:topic']).toBe(
      'http-task',
    );
    expect(
      mockModeler.mockElements['service-1'].businessObject.$attrs['flowable:taskConfigJson'],
    ).toBe('{"url":"https://example.com"}');
    expect(emittedXmls).toContain('<definitions updated="true" />');
  });

  it('themes only bpmn-js native editor chrome', () => {
    const stylesheet = readFileSync(
      'src/app/features/workflow-studio/bpmn/workflow-bpmn-canvas.component.scss',
      'utf8',
    );

    expect(stylesheet).toContain('html[data-theme=');
    expect(stylesheet).toContain('.djs-palette');
    expect(stylesheet).toContain('.djs-context-pad');
    expect(stylesheet).not.toContain('workflow-bpmn-canvas__palette');
    expect(stylesheet).not.toContain('workflow-bpmn-canvas__palette-button');
  });

  it('applies selected, validation and runtime markers', () => {
    component.selectedId = 'start';
    component.validationIssues = [
      { code: 'BAD', message: 'Bad node', severity: 'error', edgeId: 'flow-1' },
    ];
    component.runtimeStatus = { nodes: { end: 'COMPLETED' } };

    component.ngOnChanges({
      selectedId: {
        currentValue: 'start',
        previousValue: null,
        firstChange: false,
        isFirstChange: () => false,
      },
    });

    const markers = mockModeler.markers.filter((marker) => marker.action === 'add');
    expect(markers).toEqual(
      expect.arrayContaining([
        { action: 'add', elementId: 'start', marker: 'workflow-bpmn-canvas__marker--selected' },
        { action: 'add', elementId: 'flow-1', marker: 'workflow-bpmn-canvas__marker--invalid' },
        { action: 'add', elementId: 'end', marker: 'workflow-bpmn-canvas__marker--completed' },
      ]),
    );
  });
});

function sampleXml(): string {
  return '<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"><process id="wf_1" name="Flowable workflow" isExecutable="true"><startEvent id="start" /><sequenceFlow id="flow-1" sourceRef="start" targetRef="end" /><endEvent id="end" /></process><bpmndi:BPMNDiagram id="diag"><bpmndi:BPMNPlane id="plane" bpmnElement="wf_1" /></bpmndi:BPMNDiagram></definitions>';
}
