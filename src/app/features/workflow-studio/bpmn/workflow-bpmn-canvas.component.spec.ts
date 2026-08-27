import { runInInjectionContext, Injector } from '@angular/core';
import { readFileSync } from 'node:fs';
vi.mock('@bpmn-io/properties-panel', () => ({
  CheckboxEntry: {},
  Group: {},
  ListGroup: {},
  SelectEntry: {},
  TextAreaEntry: {},
  TextFieldEntry: {},
  isCheckboxEntryEdited: vi.fn(),
  isSelectEntryEdited: vi.fn(),
  isTextAreaEntryEdited: vi.fn(),
  isTextFieldEntryEdited: vi.fn(),
}));
vi.mock('bpmn-js-properties-panel', () => ({
  BpmnPropertiesPanelModule: {},
  BpmnPropertiesProviderModule: {},
  useService: vi.fn(),
}));
import {
  WORKFLOW_BPMN_MODELER_FACTORY,
  WorkflowBpmnCanvasComponent,
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
        name: 'Service Task',
        $attrs: {
          'flowable:type': 'external-worker',
          'flowable:topic': 'service-worker',
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
  let createModeler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockModeler = new MockModeler();
    createModeler = vi.fn(() => mockModeler);
    const injector = Injector.create({
      providers: [
        {
          provide: WORKFLOW_BPMN_MODELER_FACTORY,
          useValue: createModeler,
        },
      ],
    });

    component = runInInjectionContext(injector, () => new WorkflowBpmnCanvasComponent());
    component.canvasRef = { nativeElement: document.createElement('div') };
    component.propertiesPanelRef = { nativeElement: document.createElement('div') };
    component.workflowId = 'wf-1';
    component.workflowName = 'Flowable workflow';
    component.bpmnXml = sampleXml();
    component.ngAfterViewInit();
  });

  afterEach(() => {
    component?.ngOnDestroy();
  });

  it('initializes bpmn-js with current workflow XML and destroys it on component destroy', () => {
    expect(createModeler).toHaveBeenCalledWith(
      component.canvasRef.nativeElement,
      component.propertiesPanelRef.nativeElement,
    );
    expect(mockModeler.importXML).toHaveBeenCalledOnce();
    expect(mockModeler.importedXml).toContain(
      '<process id="wf_1" name="Flowable workflow" isExecutable="true">',
    );
    component.ngOnDestroy();
    expect(mockModeler.destroy).toHaveBeenCalledOnce();
  });

  it('emits node and sequence-flow selection from bpmn-js element clicks', () => {
    const selectedNodes: Array<string | null> = [];
    const selectedEdges: Array<string | null> = [];
    component.nodeSelected.subscribe((nodeId) => selectedNodes.push(nodeId));
    component.edgeSelected.subscribe((edgeId) => selectedEdges.push(edgeId));

    mockModeler.handlers.get('element.click')?.({
      element: mockModeler.mockElements['service-1'],
    });
    mockModeler.handlers.get('element.click')?.({
      element: mockModeler.mockElements['flow-1'],
    });

    expect(selectedNodes).toEqual(['service-1', null]);
    expect(selectedEdges).toEqual([null, 'flow-1']);
  });

  it('themes only bpmn-js native editor chrome', () => {
    const componentSource = readFileSync(
      'src/app/features/workflow-studio/bpmn/workflow-bpmn-canvas.component.ts',
      'utf8',
    );
    const template = readFileSync(
      'src/app/features/workflow-studio/bpmn/workflow-bpmn-canvas.component.html',
      'utf8',
    );
    const stylesheet = readFileSync(
      'src/app/features/workflow-studio/bpmn/workflow-bpmn-canvas.component.scss',
      'utf8',
    );
    const globalStyles = readFileSync('src/styles.css', 'utf8');
    const angularConfig = JSON.parse(readFileSync('angular.json', 'utf8'));
    const buildAssets = angularConfig.projects['dev-tool-web'].architect.build.options.assets;

    expect(componentSource).toContain('bpmn-js-properties-panel');
    expect(componentSource).toContain('FlowablePropertiesProviderModule');
    expect(componentSource).toContain('moddleExtensions:');
    expect(componentSource).toContain('flowable: flowableModdle');
    expect(componentSource).toContain('propertiesPanel: {');
    expect(componentSource).toContain('bpmnRenderer: {');
    expect(componentSource).toContain("defaultFillColor: 'var(--workflow-bpmn-shape-fill)'");
    expect(componentSource).toContain("defaultStrokeColor: 'var(--workflow-bpmn-shape-stroke)'");
    expect(componentSource).not.toContain('WorkflowBpmnElementConfig');
    expect(componentSource).not.toContain('updateElementConfig');
    expect(template).toContain('#propertiesPanel');
    expect(globalStyles).not.toContain('bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css');
    expect(globalStyles).toContain('bpmn-js/dist/assets/bpmn-font/css/bpmn-codes.css');
    expect(globalStyles).toContain('/assets/bpmn-font/bpmn.woff2');
    expect(buildAssets).toContainEqual({
      glob: '**/*',
      input: 'node_modules/bpmn-js/dist/assets/bpmn-font/font',
      output: '/assets/bpmn-font',
    });
    expect(globalStyles).toContain('@bpmn-io/properties-panel/dist/assets/properties-panel.css');
    expect(stylesheet).toContain('html[data-theme=');
    expect(stylesheet).toContain('--workflow-bpmn-shape-fill');
    expect(stylesheet).toContain('--workflow-bpmn-shape-stroke');
    expect(stylesheet).toContain('.djs-palette');
    expect(stylesheet).toContain('.djs-context-pad');
    expect(globalStyles).toContain('.workflow-bpmn-canvas .bio-properties-panel');
    expect(stylesheet).not.toContain('workflow-bpmn-canvas__palette');
    expect(stylesheet).not.toContain('workflow-bpmn-canvas__palette-button');
    expect(stylesheet).not.toContain('.djs-visual > :is(');
    expect(stylesheet).not.toContain('fill: var(--workflow-bpmn-shape-fill) !important');
    expect(stylesheet).not.toContain('stroke: var(--workflow-bpmn-shape-stroke) !important');
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
