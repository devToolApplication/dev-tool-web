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
import { BpmnPropertiesPanelModule, BpmnPropertiesProviderModule } from 'bpmn-js-properties-panel';

import { flowableModdle } from './flowable/flowable-moddle';
import { FlowablePropertiesProviderModule } from './flowable/flowable-properties-provider';
import type {
  WorkflowEditorMode,
  WorkflowEditorViewport,
  WorkflowRuntimeVisualState,
  WorkflowValidationIssue,
} from '../model/workflow-studio.model';

interface BpmnCanvasService {
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
  (container: HTMLElement, propertiesPanel: HTMLElement) => WorkflowBpmnModeler
>('WORKFLOW_BPMN_MODELER_FACTORY', {
  providedIn: 'root',
  factory: () => (container, propertiesPanel) =>
    new BpmnModeler({
      container,
      propertiesPanel: {
        parent: propertiesPanel,
      },
      bpmnRenderer: {
        defaultFillColor: 'var(--workflow-bpmn-shape-fill)',
        defaultStrokeColor: 'var(--workflow-bpmn-shape-stroke)',
        defaultLabelColor: 'var(--workflow-bpmn-text)',
      },
      additionalModules: [
        BpmnPropertiesPanelModule,
        BpmnPropertiesProviderModule,
        FlowablePropertiesProviderModule,
      ],
      moddleExtensions: {
        flowable: flowableModdle,
      },
    }) as unknown as WorkflowBpmnModeler,
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
  @ViewChild('propertiesPanel', { static: true }) propertiesPanelRef!: ElementRef<HTMLElement>;
  private readonly createModeler = inject(WORKFLOW_BPMN_MODELER_FACTORY);

  @Input({ required: true }) bpmnXml!: string;
  @Input() workflowId = 'workflow-draft';
  @Input() workflowName: string | undefined;
  @Input() viewport: WorkflowEditorViewport | undefined;
  @Input() mode: WorkflowEditorMode = 'design';
  @Input() selectedId: string | null = null;
  @Input() validationIssues: WorkflowValidationIssue[] = [];
  @Input() runtimeStatus: WorkflowRuntimeVisualState = {};
  @Input() propertiesCollapsed = false;

  @Output() readonly bpmnXmlChange = new EventEmitter<string>();
  @Output() readonly viewportChange = new EventEmitter<WorkflowEditorViewport>();
  @Output() readonly nodeSelected = new EventEmitter<string | null>();
  @Output() readonly edgeSelected = new EventEmitter<string | null>();

  private modeler: WorkflowBpmnModeler | null = null;
  private lastImportedXml = '';
  private importing = false;

  ngAfterViewInit(): void {
    this.modeler = this.createModeler(
      this.canvasRef.nativeElement,
      this.propertiesPanelRef.nativeElement,
    );
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
    } catch (error) {
      console.warn('Failed to import BPMN XML into canvas modeler:', error);
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
      return;
    }
    if (
      element?.type === 'bpmn:SequenceFlow' ||
      element?.businessObject?.$type === 'bpmn:SequenceFlow'
    ) {
      this.nodeSelected.emit(null);
      this.edgeSelected.emit(id);
      return;
    }
    this.edgeSelected.emit(null);
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

function markerForStatus(status: string): string {
  if (status === 'COMPLETED') {
    return 'workflow-bpmn-canvas__marker--completed';
  }
  if (status === 'ERROR' || status === 'TIMED_OUT' || status === 'CANCELLED') {
    return 'workflow-bpmn-canvas__marker--failed';
  }
  return 'workflow-bpmn-canvas__marker--running';
}
