import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

import type { SelectOption } from '@shared/ui/primitives/select/select';
import type { WorkflowBpmnElementConfig } from './workflow-bpmn-canvas.component';

const SERVICE_TASK_PRESETS: SelectOption[] = [
  { label: 'workflowStudio.bpmn.drawer.presetAiTask', value: 'AI_TASK' },
  { label: 'workflowStudio.bpmn.drawer.presetMcpTask', value: 'MCP_TASK' },
  { label: 'workflowStudio.bpmn.drawer.presetCodeTask', value: 'CODE_TASK' },
  { label: 'workflowStudio.bpmn.drawer.presetHttpTask', value: 'HTTP_TASK' },
];

const TOPIC_PRESET_MAP: Record<string, string> = {
  'ai-task': 'AI_TASK',
  'mcp-task': 'MCP_TASK',
  'code-task': 'CODE_TASK',
  'http-task': 'HTTP_TASK',
};

const PRESET_TOPIC_MAP: Record<string, string> = {
  AI_TASK: 'ai-task',
  MCP_TASK: 'mcp-task',
  CODE_TASK: 'code-task',
  HTTP_TASK: 'http-task',
};

const TIMER_KIND_OPTIONS: SelectOption[] = [
  { label: 'workflowStudio.bpmn.drawer.timerDuration', value: 'timeDuration' },
  { label: 'workflowStudio.bpmn.drawer.timerDate', value: 'timeDate' },
  { label: 'workflowStudio.bpmn.drawer.timerCycle', value: 'timeCycle' },
];

@Component({
  selector: 'app-workflow-bpmn-properties-drawer',
  standalone: false,
  templateUrl: './workflow-bpmn-properties-drawer.component.html',
  styleUrl: './workflow-bpmn-node-drawer.component.scss',
})
export class WorkflowBpmnPropertiesDrawerComponent implements OnChanges {
  @Input() config: WorkflowBpmnElementConfig | null = null;
  @Input() readonly = false;
  @Output() readonly configChange = new EventEmitter<WorkflowBpmnElementConfig>();

  readonly serviceTaskPresets = SERVICE_TASK_PRESETS;
  readonly timerKindOptions = TIMER_KIND_OPTIONS;

  name = '';
  preset = 'AI_TASK';
  flowableTopic = 'ai-task';
  flowableType = 'external-worker';
  taskConfigJson = '{}';

  conditionExpression = '';
  defaultFlow = false;

  timerKind = 'timeDuration';
  timerExpression = '';
  messageRef = '';
  messageName = '';
  errorRef = '';
  errorName = '';

  calledElement = '';
  triggeredByEvent = false;

  jsonError: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['config'] || !this.config) {
      return;
    }
    this.name = this.config.name ?? '';
    const topic = this.config.flowableTopic ?? 'ai-task';
    this.flowableTopic = topic;
    this.preset = TOPIC_PRESET_MAP[topic] ?? 'AI_TASK';
    this.flowableType = this.config.flowableType ?? 'external-worker';
    this.taskConfigJson = this.config.taskConfigJson ?? '{}';

    this.conditionExpression = this.config.conditionExpression ?? '';
    this.defaultFlow = !!this.config.defaultFlow;

    this.timerKind = this.config.timerKind ?? 'timeDuration';
    this.timerExpression = this.config.timerExpression ?? '';
    this.messageRef = this.config.messageRef ?? '';
    this.messageName = this.config.messageName ?? '';
    this.errorRef = this.config.errorRef ?? '';
    this.errorName = this.config.errorName ?? '';

    this.calledElement = this.config.calledElement ?? '';
    this.triggeredByEvent = !!this.config.triggeredByEvent;

    this.jsonError = null;
  }

  isServiceTask(): boolean {
    return this.config?.type === 'bpmn:ServiceTask';
  }

  isSequenceFlow(): boolean {
    return this.config?.type === 'bpmn:SequenceFlow';
  }

  isTimerEvent(): boolean {
    const type = this.config?.type ?? '';
    return (
      type.includes('TimerEventDefinition') ||
      type === 'bpmn:IntermediateCatchEvent' ||
      type === 'bpmn:BoundaryEvent' ||
      type === 'bpmn:StartEvent'
    );
  }

  hasTimer(): boolean {
    return this.config?.timerExpression !== undefined || this.config?.timerKind !== undefined;
  }

  hasMessage(): boolean {
    return this.config?.messageRef !== undefined || this.config?.messageName !== undefined;
  }

  hasError(): boolean {
    return this.config?.errorRef !== undefined || this.config?.errorName !== undefined;
  }

  isCallActivity(): boolean {
    return this.config?.type === 'bpmn:CallActivity';
  }

  isSubProcess(): boolean {
    const type = this.config?.type ?? '';
    return type === 'bpmn:SubProcess' || type === 'bpmn:Transaction';
  }

  isCustomConfigurable(): boolean {
    return (
      this.isServiceTask() ||
      this.isSequenceFlow() ||
      this.hasTimer() ||
      this.hasMessage() ||
      this.hasError() ||
      this.isCallActivity() ||
      this.isSubProcess()
    );
  }

  updateName(value: string | null): void {
    this.name = value ?? '';
    this.emit();
  }

  updatePreset(value: string | number | boolean | null): void {
    const presetStr = String(value ?? 'AI_TASK');
    this.preset = presetStr;
    this.flowableTopic = PRESET_TOPIC_MAP[presetStr] ?? 'ai-task';
    this.emit();
  }

  updateTopic(value: string | null): void {
    this.flowableTopic = value ?? '';
    this.preset = TOPIC_PRESET_MAP[this.flowableTopic] ?? '';
    this.emit();
  }

  updateTaskConfigJson(value: string | null): void {
    this.taskConfigJson = value ?? '';
    this.emit();
  }

  updateConditionExpression(value: string | null): void {
    this.conditionExpression = value ?? '';
    this.emit();
  }

  updateDefaultFlow(value: boolean | null): void {
    this.defaultFlow = !!value;
    this.emit();
  }

  updateTimerKind(value: string | number | boolean | null): void {
    this.timerKind = String(value ?? 'timeDuration');
    this.emit();
  }

  updateTimerExpression(value: string | null): void {
    this.timerExpression = value ?? '';
    this.emit();
  }

  updateMessageRef(value: string | null): void {
    this.messageRef = value ?? '';
    this.emit();
  }

  updateMessageName(value: string | null): void {
    this.messageName = value ?? '';
    this.emit();
  }

  updateErrorRef(value: string | null): void {
    this.errorRef = value ?? '';
    this.emit();
  }

  updateErrorName(value: string | null): void {
    this.errorName = value ?? '';
    this.emit();
  }

  updateCalledElement(value: string | null): void {
    this.calledElement = value ?? '';
    this.emit();
  }

  updateTriggeredByEvent(value: boolean | null): void {
    this.triggeredByEvent = !!value;
    this.emit();
  }

  private emit(): void {
    if (!this.config || this.readonly) {
      return;
    }

    if (this.isServiceTask()) {
      const trimmed = this.taskConfigJson.trim();
      if (trimmed) {
        try {
          JSON.parse(trimmed);
          this.jsonError = null;
        } catch {
          this.jsonError = 'workflowStudio.bpmn.drawer.invalidJson';
          return;
        }
      } else {
        this.jsonError = null;
      }
    }

    this.configChange.emit({
      ...this.config,
      name: this.name,
      flowableTopic: this.isServiceTask() ? this.flowableTopic : this.config.flowableTopic,
      flowableType: this.isServiceTask() ? this.flowableType : this.config.flowableType,
      taskConfigJson: this.isServiceTask() ? this.taskConfigJson : this.config.taskConfigJson,
      conditionExpression: this.isSequenceFlow()
        ? this.conditionExpression
        : this.config.conditionExpression,
      defaultFlow: this.isSequenceFlow() ? this.defaultFlow : this.config.defaultFlow,
      timerKind: this.hasTimer() ? this.timerKind : this.config.timerKind,
      timerExpression: this.hasTimer() ? this.timerExpression : this.config.timerExpression,
      messageRef: this.hasMessage() ? this.messageRef : this.config.messageRef,
      messageName: this.hasMessage() ? this.messageName : this.config.messageName,
      errorRef: this.hasError() ? this.errorRef : this.config.errorRef,
      errorName: this.hasError() ? this.errorName : this.config.errorName,
      calledElement: this.isCallActivity() ? this.calledElement : this.config.calledElement,
      triggeredByEvent: this.isSubProcess() ? this.triggeredByEvent : this.config.triggeredByEvent,
    });
  }
}
