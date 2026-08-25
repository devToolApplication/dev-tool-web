import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  InjectionToken,
  Input,
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
  WorkflowEditorMode,
  WorkflowEditorViewport,
  WorkflowRuntimeVisualState,
  WorkflowValidationIssue,
} from '../model/workflow-studio.model';

export interface WorkflowBpmnElementConfig {
  id: string;
  type: string;
  name?: string;
  flowableTopic?: string;
  flowableType?: string;
  taskConfigJson?: string;
  conditionExpression?: string;
  defaultFlow?: boolean;
  timerKind?: 'timeDuration' | 'timeDate' | 'timeCycle' | string;
  timerExpression?: string;
  messageRef?: string;
  messageName?: string;
  errorRef?: string;
  errorName?: string;
  calledElement?: string;
  triggeredByEvent?: boolean;
}

type BpmnCommand = 'fit' | 'zoomIn' | 'zoomOut' | 'resetZoom' | 'toggleNavigator' | 'fullscreen';

interface BpmnCanvasService {
  zoom(value?: number | 'fit-viewport', center?: 'auto'): number;
  viewbox(): { x: number; y: number; scale: number };
  addMarker(elementId: string, marker: string): void;
  removeMarker(elementId: string, marker: string): void;
}

interface BpmnElementRegistry {
  get(elementId: string): { id: string; type?: string; businessObject?: any } | undefined;
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

  @Input({ required: true }) bpmnXml!: string;
  @Input() workflowId = 'workflow-draft';
  @Input() workflowName: string | undefined;
  @Input() viewport: WorkflowEditorViewport | undefined;
  @Input() mode: WorkflowEditorMode = 'design';
  @Input() selectedId: string | null = null;
  @Input() validationIssues: WorkflowValidationIssue[] = [];
  @Input() runtimeStatus: WorkflowRuntimeVisualState = {};

  @Output() readonly bpmnXmlChange = new EventEmitter<string>();
  @Output() readonly viewportChange = new EventEmitter<WorkflowEditorViewport>();
  @Output() readonly nodeSelected = new EventEmitter<string | null>();
  @Output() readonly edgeSelected = new EventEmitter<string | null>();
  @Output() readonly elementSelected = new EventEmitter<WorkflowBpmnElementConfig | null>();

  private modeler: WorkflowBpmnModeler | null = null;
  private lastImportedXml = '';
  private importing = false;

  ngAfterViewInit(): void {
    this.modeler = this.createModeler(this.canvasRef.nativeElement);
    this.modeler.on('element.click', (event: BpmnClickEvent) => this.handleElementClick(event));
    this.modeler.on('commandStack.changed', () => void this.emitXmlFromModeler());
    void this.importCurrentXml();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.modeler) {
      return;
    }
    if (changes['bpmnXml']) {
      void this.importCurrentXml();
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

  async updateElementConfig(config: WorkflowBpmnElementConfig): Promise<void> {
    if (!this.modeler || this.readonlyMode()) {
      return;
    }

    const registry = this.elementRegistry();
    const element = registry?.get(config.id);
    if (!element) {
      return;
    }

    const bo = (element as any).businessObject ?? element;
    const modeling = this.modeler.get('modeling') as any;
    const moddle = this.modeler.get('moddle') as any;

    if (config.name !== undefined) {
      if (modeling?.updateProperties) {
        modeling.updateProperties(element, { name: config.name });
      } else {
        bo.name = config.name;
      }
    }

    if (bo.$type === 'bpmn:ServiceTask' || (element as any).type === 'bpmn:ServiceTask') {
      const topic = config.flowableTopic ?? 'ai-task';
      const type = config.flowableType ?? 'external-worker';
      const taskConfigJson = config.taskConfigJson ?? '{}';

      if (bo.set) {
        bo.set('flowable:topic', topic);
        bo.set('flowable:type', type);
        bo.set('flowable:taskConfigJson', taskConfigJson);
      }
      bo.$attrs = bo.$attrs || {};
      bo.$attrs['flowable:topic'] = topic;
      bo.$attrs['flowable:type'] = type;
      bo.$attrs['flowable:taskConfigJson'] = taskConfigJson;

      if (modeling?.updateModdleProperties) {
        modeling.updateModdleProperties(element, bo, {
          'flowable:topic': topic,
          'flowable:type': type,
          'flowable:taskConfigJson': taskConfigJson,
        });
      }
    }

    if (bo.$type === 'bpmn:SequenceFlow' || (element as any).type === 'bpmn:SequenceFlow') {
      if (config.conditionExpression !== undefined) {
        const trimmed = config.conditionExpression.trim();
        if (trimmed) {
          const expr = moddle?.create
            ? moddle.create('bpmn:FormalExpression', { body: trimmed })
            : { $type: 'bpmn:FormalExpression', body: trimmed };
          if (modeling?.updateProperties) {
            modeling.updateProperties(element, { conditionExpression: expr });
          } else {
            bo.conditionExpression = expr;
          }
        } else {
          if (modeling?.updateProperties) {
            modeling.updateProperties(element, { conditionExpression: undefined });
          } else {
            delete bo.conditionExpression;
          }
        }
      }

      if (config.defaultFlow !== undefined && bo.sourceRef) {
        const sourceElement = registry?.get(bo.sourceRef.id ?? bo.sourceRef);
        const sourceBo = (sourceElement as any)?.businessObject ?? bo.sourceRef;
        if (config.defaultFlow) {
          if (modeling?.updateProperties && sourceElement) {
            modeling.updateProperties(sourceElement, { default: bo });
          } else {
            sourceBo.default = bo;
          }
        } else if (
          sourceBo.default === bo ||
          sourceBo.default?.id === bo.id ||
          sourceBo.default === bo.id
        ) {
          if (modeling?.updateProperties && sourceElement) {
            modeling.updateProperties(sourceElement, { default: undefined });
          } else {
            delete sourceBo.default;
          }
        }
      }
    }

    // ponytail: minimal in-place businessObject/moddle property updates; upgrade to full bpmn-moddle extension element factory when advanced timer/message/error schema editing is required.
    if (
      config.calledElement !== undefined &&
      (bo.$type === 'bpmn:CallActivity' || (element as any).type === 'bpmn:CallActivity')
    ) {
      if (modeling?.updateProperties) {
        modeling.updateProperties(element, { calledElement: config.calledElement });
      } else {
        bo.calledElement = config.calledElement;
        if (bo.set) {
          bo.set('calledElement', config.calledElement);
        }
      }
    }

    if (
      config.triggeredByEvent !== undefined &&
      (bo.$type === 'bpmn:SubProcess' ||
        (element as any).type === 'bpmn:SubProcess' ||
        bo.$type === 'bpmn:Transaction')
    ) {
      if (modeling?.updateProperties) {
        modeling.updateProperties(element, { triggeredByEvent: config.triggeredByEvent });
      } else {
        bo.triggeredByEvent = config.triggeredByEvent;
        if (bo.set) {
          bo.set('triggeredByEvent', config.triggeredByEvent);
        }
      }
    }

    this.updateEventDefinitions(bo, config, moddle);

    const { xml } = await this.modeler.saveXML({ format: true });
    if (xml && xml !== this.lastImportedXml) {
      this.lastImportedXml = xml;
      this.bpmnXmlChange.emit(xml);
    }
  }

  private async importCurrentXml(): Promise<void> {
    if (!this.modeler) {
      return;
    }

    if (!this.bpmnXml || this.bpmnXml === this.lastImportedXml) {
      return;
    }

    this.importing = true;
    try {
      await this.modeler.importXML(this.bpmnXml);
      this.lastImportedXml = this.bpmnXml;
      this.applyMarkers();
      this.emitViewport();
    } finally {
      this.importing = false;
    }
  }

  private async emitXmlFromModeler(): Promise<void> {
    if (!this.modeler || this.importing || this.readonlyMode()) {
      return;
    }

    const { xml } = await this.modeler.saveXML({ format: true });
    if (!xml || xml === this.lastImportedXml) {
      return;
    }

    this.lastImportedXml = xml;
    this.bpmnXmlChange.emit(xml);
  }

  private handleElementClick(event: BpmnClickEvent): void {
    const element = event.element;
    const id = element?.businessObject?.id ?? element?.id ?? null;
    if (!id || element?.type === 'bpmn:Process') {
      this.nodeSelected.emit(null);
      this.edgeSelected.emit(null);
      this.elementSelected.emit(null);
      return;
    }
    const config = element ? this.extractElementConfig(element) : null;
    if (!config) {
      return;
    }
    this.elementSelected.emit(config);
    if (
      element?.type === 'bpmn:SequenceFlow' ||
      element?.businessObject?.$type === 'bpmn:SequenceFlow'
    ) {
      this.edgeSelected.emit(id);
      return;
    }
    this.nodeSelected.emit(id);
  }

  private extractElementConfig(element: {
    id: string;
    type?: string;
    businessObject?: any;
  }): WorkflowBpmnElementConfig {
    const bo = element.businessObject ?? element;
    const id = bo.id ?? element.id;
    const type = element.type ?? bo.$type ?? '';
    const name = bo.name ?? '';

    const flowableTopic = bo.get
      ? bo.get('flowable:topic')
      : bo['flowable:topic'] || bo.$attrs?.['flowable:topic'] || undefined;
    const flowableType = bo.get
      ? bo.get('flowable:type')
      : bo['flowable:type'] || bo.$attrs?.['flowable:type'] || undefined;
    const taskConfigJson = bo.get
      ? bo.get('flowable:taskConfigJson')
      : bo['flowable:taskConfigJson'] || bo.$attrs?.['flowable:taskConfigJson'] || undefined;

    let conditionExpression: string | undefined;
    if (bo.conditionExpression) {
      conditionExpression =
        typeof bo.conditionExpression === 'string'
          ? bo.conditionExpression
          : (bo.conditionExpression.body ?? '');
    }

    let defaultFlow: boolean | undefined;
    if (type === 'bpmn:SequenceFlow' || bo.$type === 'bpmn:SequenceFlow') {
      const source = bo.sourceRef;
      if (source) {
        defaultFlow = source.default?.id === id || source.default === bo || source.default === id;
      } else {
        defaultFlow = false;
      }
    }

    let timerKind: string | undefined;
    let timerExpression: string | undefined;
    const eventDefs: any[] = bo.eventDefinitions ?? [];
    const timerDef =
      eventDefs.find(
        (d: any) =>
          d.$type === 'bpmn:TimerEventDefinition' || d.type === 'bpmn:TimerEventDefinition',
      ) ?? bo.timerEventDefinition;
    if (timerDef) {
      if (timerDef.timeDate) {
        timerKind = 'timeDate';
        timerExpression = timerDef.timeDate.body ?? timerDef.timeDate;
      } else if (timerDef.timeCycle) {
        timerKind = 'timeCycle';
        timerExpression = timerDef.timeCycle.body ?? timerDef.timeCycle;
      } else if (timerDef.timeDuration) {
        timerKind = 'timeDuration';
        timerExpression = timerDef.timeDuration.body ?? timerDef.timeDuration;
      } else {
        timerKind = 'timeDuration';
        timerExpression = '';
      }
    }

    let messageRef: string | undefined;
    let messageName: string | undefined;
    const msgDef =
      eventDefs.find(
        (d: any) =>
          d.$type === 'bpmn:MessageEventDefinition' || d.type === 'bpmn:MessageEventDefinition',
      ) ?? bo.messageEventDefinition;
    if (msgDef) {
      messageRef = '';
      messageName = '';
      const ref = msgDef.messageRef;
      if (ref && typeof ref === 'object') {
        messageRef = ref.id ?? '';
        messageName = ref.name ?? '';
      } else if (typeof ref === 'string') {
        messageRef = ref;
        messageName = '';
      }
    }

    let errorRef: string | undefined;
    let errorName: string | undefined;
    const errDef =
      eventDefs.find(
        (d: any) =>
          d.$type === 'bpmn:ErrorEventDefinition' || d.type === 'bpmn:ErrorEventDefinition',
      ) ?? bo.errorEventDefinition;
    if (errDef) {
      errorRef = '';
      errorName = '';
      const ref = errDef.errorRef;
      if (ref && typeof ref === 'object') {
        errorRef = ref.id ?? ref.errorCode ?? '';
        errorName = ref.name ?? '';
      } else if (typeof ref === 'string') {
        errorRef = ref;
        errorName = '';
      }
    }

    const calledElement = bo.calledElement ?? (bo.get ? bo.get('calledElement') : undefined);
    const triggeredByEvent = bo.triggeredByEvent !== undefined ? !!bo.triggeredByEvent : undefined;

    return {
      id,
      type,
      name,
      flowableTopic,
      flowableType,
      taskConfigJson,
      conditionExpression,
      defaultFlow,
      timerKind,
      timerExpression,
      messageRef,
      messageName,
      errorRef,
      errorName,
      calledElement,
      triggeredByEvent,
    };
  }

  private updateEventDefinitions(bo: any, config: WorkflowBpmnElementConfig, moddle: any): void {
    const eventDefs: any[] = bo.eventDefinitions ?? [];
    const timerDef =
      eventDefs.find(
        (d: any) =>
          d.$type === 'bpmn:TimerEventDefinition' || d.type === 'bpmn:TimerEventDefinition',
      ) ?? bo.timerEventDefinition;
    if (timerDef && config.timerExpression !== undefined) {
      const kind = (config.timerKind || 'timeDuration') as
        | 'timeDuration'
        | 'timeDate'
        | 'timeCycle';
      const expr = moddle?.create
        ? moddle.create('bpmn:FormalExpression', { body: config.timerExpression })
        : { $type: 'bpmn:FormalExpression', body: config.timerExpression };
      delete timerDef.timeDuration;
      delete timerDef.timeDate;
      delete timerDef.timeCycle;
      timerDef[kind] = expr;
    }

    const msgDef =
      eventDefs.find(
        (d: any) =>
          d.$type === 'bpmn:MessageEventDefinition' || d.type === 'bpmn:MessageEventDefinition',
      ) ?? bo.messageEventDefinition;
    if (msgDef && (config.messageRef !== undefined || config.messageName !== undefined)) {
      if (!msgDef.messageRef || typeof msgDef.messageRef === 'string') {
        msgDef.messageRef = this.rootReference(
          bo,
          moddle,
          'bpmn:Message',
          config.messageRef || 'msg_1',
          {
            name: config.messageName || '',
          },
        );
      } else {
        if (config.messageRef !== undefined) msgDef.messageRef.id = config.messageRef;
        if (config.messageName !== undefined) msgDef.messageRef.name = config.messageName;
      }
    }

    const errDef =
      eventDefs.find(
        (d: any) =>
          d.$type === 'bpmn:ErrorEventDefinition' || d.type === 'bpmn:ErrorEventDefinition',
      ) ?? bo.errorEventDefinition;
    if (errDef && (config.errorRef !== undefined || config.errorName !== undefined)) {
      if (!errDef.errorRef || typeof errDef.errorRef === 'string') {
        errDef.errorRef = this.rootReference(bo, moddle, 'bpmn:Error', config.errorRef || 'err_1', {
          errorCode: config.errorRef || '',
          name: config.errorName || '',
        });
      } else {
        if (config.errorRef !== undefined) {
          errDef.errorRef.id = config.errorRef;
          errDef.errorRef.errorCode = config.errorRef;
        }
        if (config.errorName !== undefined) {
          errDef.errorRef.name = config.errorName;
        }
      }
    }
  }

  private rootReference(
    bo: any,
    moddle: any,
    type: 'bpmn:Message' | 'bpmn:Error',
    id: string,
    props: Record<string, string>,
  ): any {
    const definitions = this.definitionsOf(bo);
    const existing = definitions?.rootElements?.find(
      (item: any) => item.$type === type && item.id === id,
    );
    if (existing) {
      Object.assign(existing, props);
      return existing;
    }

    const ref = moddle?.create
      ? moddle.create(type, { id, ...props })
      : { $type: type, id, ...props };
    if (
      definitions?.rootElements &&
      !definitions.rootElements.some((item: any) => item.id === id)
    ) {
      definitions.rootElements.push(ref);
    }
    return ref;
  }

  private definitionsOf(bo: any): any | null {
    let current = bo;
    for (let depth = 0; depth < 8 && current; depth += 1) {
      if (current.$type === 'bpmn:Definitions') {
        return current;
      }
      current = current.$parent;
    }
    return null;
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

function markerForStatus(status: string): string {
  if (status === 'COMPLETED') {
    return 'workflow-bpmn-canvas__marker--completed';
  }
  if (status === 'ERROR' || status === 'TIMED_OUT' || status === 'CANCELLED') {
    return 'workflow-bpmn-canvas__marker--failed';
  }
  return 'workflow-bpmn-canvas__marker--running';
}
