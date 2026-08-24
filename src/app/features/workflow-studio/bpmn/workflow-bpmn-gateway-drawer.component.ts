import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

import type { BpmnWorkflowNode, JsonValue } from '../model/workflow-studio.model';

@Component({
  selector: 'app-workflow-bpmn-gateway-drawer',
  standalone: false,
  templateUrl: './workflow-bpmn-gateway-drawer.component.html',
  styleUrl: './workflow-bpmn-node-drawer.component.scss',
})
export class WorkflowBpmnGatewayDrawerComponent implements OnChanges {
  @Input() node: BpmnWorkflowNode | null = null;
  @Input() readonly = false;
  @Output() readonly nodeChange = new EventEmitter<BpmnWorkflowNode>();

  name = '';
  config = '{}';
  jsonError: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['node'] || !this.node) {
      return;
    }
    this.name = this.node.name ?? '';
    this.config = JSON.stringify(this.node.config ?? {}, null, 2);
    this.jsonError = null;
  }

  updateName(value: string | null): void {
    this.name = value ?? '';
    this.emit();
  }

  updateConfig(value: string | null): void {
    this.config = value ?? '';
    this.emit();
  }

  private emit(): void {
    if (!this.node || this.readonly) {
      return;
    }

    const config = parseJson(this.config);
    if (config === undefined) {
      this.jsonError = 'workflowStudio.bpmn.drawer.invalidJson';
      return;
    }

    this.jsonError = null;
    this.nodeChange.emit({
      ...this.node,
      name: this.name,
      config,
    });
  }
}

function parseJson(value: string): JsonValue | undefined {
  const text = value.trim();
  if (!text) {
    return {};
  }
  try {
    return JSON.parse(text) as JsonValue;
  } catch {
    return undefined;
  }
}
