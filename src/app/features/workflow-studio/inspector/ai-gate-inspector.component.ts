import { Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import type { FormConfig, FormContext, SelectOption } from '@shared/ui/patterns/form-input/models/form-config.model';

import { WorkflowApiService } from '../api/workflow-api.service';
import {
  AiGateWorkflowNode,
  WorkflowAgentCatalogItem,
  WorkflowOutputSchemaCatalogItem,
} from '../model/workflow-studio.model';
import {
  WORKFLOW_NODE_INSPECTOR_CONTEXT,
  workflowNodeInspectorConfig,
} from './workflow-node-inspector.model';
import { WorkflowNodeFormInspector } from './workflow-node-form-inspector.base';

@Component({
  selector: 'app-ai-gate-inspector',
  standalone: false,
  templateUrl: './workflow-node-form-inspector.component.html',
})
export class AiGateInspectorComponent extends WorkflowNodeFormInspector<AiGateWorkflowNode> implements OnInit {
  private readonly api = inject(WorkflowApiService);
  private readonly agents = signal<WorkflowAgentCatalogItem[]>([]);
  private readonly outputSchemas = signal<WorkflowOutputSchemaCatalogItem[]>([]);

  @Input({ required: true }) node!: AiGateWorkflowNode;
  @Input() override readonly = false;

  @Output() override readonly nodePatch = new EventEmitter<Partial<AiGateWorkflowNode>>();

  override readonly config: FormConfig = workflowNodeInspectorConfig('AI_GATE');

  override get formContext(): FormContext {
    const selectedAgent = this.selectedAgent(textValue(this.initialValue['agentCode'] ?? this.node?.agentCode));
    return {
      ...WORKFLOW_NODE_INSPECTOR_CONTEXT,
      mode: this.readonly ? 'view' : 'edit',
      extra: {
        agentOptions: this.agents().map(agentOption),
        providerOptions: providerOptions(selectedAgent),
        outputSchemaOptions: this.outputSchemas().map(outputSchemaOption),
      },
    };
  }

  ngOnInit(): void {
    this.api.getAgents().subscribe({
      next: (agents) => this.agents.set(agents ?? []),
      error: () => this.agents.set([]),
    });
    this.api.getAiGateOutputSchemas().subscribe({
      next: (schemas) => this.outputSchemas.set(schemas ?? []),
      error: () => this.outputSchemas.set([]),
    });
  }

  override formValueChange(value: Record<string, unknown>): void {
    const next = { ...value };
    const selectedAgent = this.selectedAgent(textValue(next['agentCode']));
    const provider = textValue(next['provider']);
    if (selectedAgent && !providerSupported(selectedAgent, provider)) {
      next['provider'] = defaultProvider(selectedAgent);
    }
    if (!textValue(next['outputSchema'])) {
      next['outputSchema'] = defaultOutputSchema(this.outputSchemas());
    }
    super.formValueChange(next);
  }

  private selectedAgent(agentCode: string): WorkflowAgentCatalogItem | undefined {
    return this.agents().find((agent) => agent.agentCode === agentCode);
  }
}

function agentOption(agent: WorkflowAgentCatalogItem): SelectOption {
  return {
    label: agent.displayName || agent.agentCode,
    value: agent.agentCode,
    disabled: agent.health === 'UNHEALTHY',
  };
}

function providerOptions(agent: WorkflowAgentCatalogItem | undefined): SelectOption[] {
  return (agent?.supportedProviders ?? []).map((provider) => ({
    label: `workflowStudio.ai.provider.${provider.provider}`,
    value: provider.provider,
    disabled: provider.available === false,
  }));
}

function outputSchemaOption(schema: WorkflowOutputSchemaCatalogItem): SelectOption {
  return {
    label: schema.label || schema.value,
    value: schema.value,
  };
}

function defaultProvider(agent: WorkflowAgentCatalogItem): string {
  return agent.defaultProvider
    || agent.supportedProviders.find((provider) => provider.available !== false)?.provider
    || '';
}

function providerSupported(agent: WorkflowAgentCatalogItem, provider: string): boolean {
  return agent.supportedProviders.some((option) => option.provider === provider && option.available !== false);
}

function defaultOutputSchema(schemas: WorkflowOutputSchemaCatalogItem[]): string {
  return schemas.find((schema) => schema.isDefault)?.value
    || schemas[0]?.value
    || 'gate-result-v1';
}

function textValue(value: unknown): string {
  return typeof value === 'string' ? value : String(value ?? '');
}
