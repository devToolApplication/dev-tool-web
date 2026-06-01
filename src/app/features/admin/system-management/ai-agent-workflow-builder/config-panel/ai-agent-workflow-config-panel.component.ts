import { Component, Input, Output, EventEmitter } from '@angular/core';
import { WorkflowNode, WorkflowEdge, WorkflowNodeType, LOGIC_CODES } from '../../../../../core/models/ai-agent/ai-agent-workflow.model';

@Component({
  selector: 'app-ai-agent-workflow-config-panel',
  standalone: false,
  templateUrl: './ai-agent-workflow-config-panel.component.html',
  styleUrl: './ai-agent-workflow-config-panel.component.scss'
})
export class AiAgentWorkflowConfigPanelComponent {

  @Input() node!: WorkflowNode;
  @Input() edges: WorkflowEdge[] = [];

  @Output() nodeNameChange = new EventEmitter<string>();
  @Output() nodeConfigChange = new EventEmitter<string>();
  @Output() nodeDelete = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  readonly logicCodes = LOGIC_CODES;

  // Parsed config for form binding
  get parsedConfig(): Record<string, any> {
    if (!this.node.config) return {};
    try {
      return JSON.parse(this.node.config);
    } catch {
      return {};
    }
  }

  get nodeOutgoingEdges(): WorkflowEdge[] {
    return this.edges.filter(e => e.source === this.node.id);
  }

  get nodeTypeLabel(): string {
    switch (this.node.type) {
      case 'AI_AGENT_STEP': return 'AI Agent Step';
      case 'LOGIC_STEP': return 'Logic Step';
      case 'BRANCH_NODE': return 'Branch Node';
      case 'REVIEW_NODE': return 'Review Node';
      case 'END_NODE': return 'End Node';
      default: return this.node.type;
    }
  }

  get nodeColor(): string {
    switch (this.node.type) {
      case 'AI_AGENT_STEP': return '#3B82F6';
      case 'LOGIC_STEP': return '#10B981';
      case 'BRANCH_NODE': return '#F59E0B';
      case 'REVIEW_NODE': return '#8B5CF6';
      case 'END_NODE': return '#EF4444';
      default: return '#64748B';
    }
  }

  onNameChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.nodeNameChange.emit(value);
  }

  onConfigFieldChange(field: string, value: any): void {
    const config = { ...this.parsedConfig, [field]: value };
    this.nodeConfigChange.emit(JSON.stringify(config));
  }

  onConfigJsonChange(json: string): void {
    this.nodeConfigChange.emit(json);
  }

  onClose(): void {
    this.close.emit();
  }

  onDelete(): void {
    this.nodeDelete.emit();
  }
}
