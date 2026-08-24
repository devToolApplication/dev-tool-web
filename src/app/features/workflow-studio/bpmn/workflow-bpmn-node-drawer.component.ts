import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

import type { BpmnWorkflowNode, JsonValue } from '../model/workflow-studio.model';

@Component({
  selector: 'app-workflow-bpmn-node-drawer',
  standalone: false,
  templateUrl: './workflow-bpmn-node-drawer.component.html',
  styleUrl: './workflow-bpmn-node-drawer.component.scss',
})
export class WorkflowBpmnNodeDrawerComponent implements OnChanges {
  @Input() node: BpmnWorkflowNode | null = null;
  @Input() readonly = false;
  @Output() readonly nodeChange = new EventEmitter<BpmnWorkflowNode>();

  name = '';
  inputMapping = '{}';
  config = '{}';
  outputMapping = '{}';
  maxAttempts: number | null = 1;
  timeoutSeconds: number | null = 30;
  jsonError: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['node'] || !this.node) {
      return;
    }
    this.name = this.node.name ?? '';
    this.inputMapping = stringify(this.node.inputMapping ?? {});
    this.config = stringify(this.node.config ?? {});
    this.outputMapping = stringify(this.node.outputMapping ?? {});
    this.maxAttempts = numberField(this.node.retryPolicy, 'maxAttempts', 1);
    this.timeoutSeconds = numberField(this.node.timeoutPolicy, 'timeoutSeconds', 30);
    this.jsonError = null;
  }

  updateName(value: string | null): void {
    this.name = value ?? '';
    this.emit();
  }

  updateInputMapping(value: string | null): void {
    this.inputMapping = value ?? '';
    this.emit();
  }

  updateConfig(value: string | null): void {
    this.config = value ?? '';
    this.emit();
  }

  updateOutputMapping(value: string | null): void {
    this.outputMapping = value ?? '';
    this.emit();
  }

  updateMaxAttempts(value: number | null): void {
    this.maxAttempts = value;
    this.emit();
  }

  updateTimeoutSeconds(value: number | null): void {
    this.timeoutSeconds = value;
    this.emit();
  }

  private emit(): void {
    if (!this.node || this.readonly) {
      return;
    }

    const inputMapping = parseJson(this.inputMapping);
    const config = parseJson(this.config);
    const outputMapping = parseJson(this.outputMapping);
    if (inputMapping === undefined || config === undefined || outputMapping === undefined) {
      this.jsonError = 'workflowStudio.bpmn.drawer.invalidJson';
      return;
    }

    this.jsonError = null;
    this.nodeChange.emit({
      ...this.node,
      name: this.name,
      inputMapping,
      config,
      outputMapping,
      retryPolicy: { maxAttempts: positiveInteger(this.maxAttempts, 1) },
      timeoutPolicy: { timeoutSeconds: positiveInteger(this.timeoutSeconds, 30) },
    });
  }
}

function stringify(value: JsonValue): string {
  return JSON.stringify(value ?? {}, null, 2);
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

function numberField(value: JsonValue | undefined, field: string, fallback: number): number {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return fallback;
  }
  return positiveInteger((value as Record<string, unknown>)[field], fallback);
}

function positiveInteger(value: unknown, fallback: number): number {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= 1 ? Math.floor(numberValue) : fallback;
}
