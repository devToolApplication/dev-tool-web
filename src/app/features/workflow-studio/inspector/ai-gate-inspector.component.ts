import { Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import type { FormConfig, FormContext, SelectOption } from '@shared/ui/patterns/form-input/models/form-config.model';

import { WorkflowApiService } from '../api/workflow-api.service';
import {
  AiGateWorkflowNode,
  InputMapping,
  JsonValue,
  WorkflowAgentCatalogItem,
  WorkflowOutputSchemaCatalogItem,
  WorkflowValidationIssue,
} from '../model/workflow-studio.model';
import {
  WORKFLOW_NODE_INSPECTOR_CONTEXT,
  workflowNodeInspectorConfig,
} from './workflow-node-inspector.model';
import { WorkflowNodeFormInspector } from './workflow-node-form-inspector.base';

export type CatalogLoadState = 'loading' | 'ready' | 'empty' | 'error';

@Component({
  selector: 'app-ai-gate-inspector',
  standalone: false,
  templateUrl: './ai-gate-inspector.component.html',
  styleUrl: './ai-gate-inspector.component.css',
})
export class AiGateInspectorComponent extends WorkflowNodeFormInspector<AiGateWorkflowNode> implements OnInit {
  private readonly api = inject(WorkflowApiService);

  readonly agents = signal<WorkflowAgentCatalogItem[]>([]);
  readonly outputSchemas = signal<WorkflowOutputSchemaCatalogItem[]>([]);

  readonly agentState = signal<CatalogLoadState>('loading');
  readonly outputSchemaState = signal<CatalogLoadState>('loading');

  private defaultSchemaApplied = false;

  @Input({ required: true }) node!: AiGateWorkflowNode;
  @Input() override readonly = false;

  @Output() override readonly nodePatch = new EventEmitter<Partial<AiGateWorkflowNode>>();

  override readonly config: FormConfig = workflowNodeInspectorConfig('AI_GATE');

  override get formContext(): FormContext {
    const currentAgentCode = textValue(this.initialValue['agentCode'] ?? this.node?.agentCode);
    const selectedAgent = this.selectedAgent(currentAgentCode);

    return {
      ...WORKFLOW_NODE_INSPECTOR_CONTEXT,
      mode: this.readonly ? 'view' : 'edit',
      extra: {
        agentOptions: this.buildAgentOptions(currentAgentCode),
        providerOptions: this.buildProviderOptions(selectedAgent, textValue(this.initialValue['provider'] ?? this.node?.provider)),
        outputSchemaOptions: this.buildOutputSchemaOptions(textValue(this.initialValue['outputSchema'] ?? this.node?.outputSchema)),
      },
    };
  }

  // ponytail: section scroll/focus jumps directly to decision or input containers; exact DOM element focus skipped for custom row controls.
  @Input() focusedIssue: WorkflowValidationIssue | null = null;

  get criteriaValue(): JsonValue {
    return this.node?.criteria ?? {};
  }

  get inputMappingValue(): InputMapping {
    return this.node?.inputMapping ?? { mapping: {} };
  }

  onCriteriaChange(criteria: JsonValue): void {
    if (this.readonly) return;
    this.nodePatch.emit({ criteria });
  }

  ngOnInit(): void {
    this.loadAgents();
    this.loadOutputSchemas();
  }

  loadAgents(): void {
    this.agentState.set('loading');
    this.api.getAgents().subscribe({
      next: (agents) => {
        const items = agents ?? [];
        this.agents.set(items);
        this.agentState.set(items.length > 0 ? 'ready' : 'empty');
      },
      error: () => {
        this.agents.set([]);
        this.agentState.set('error');
      },
    });
  }

  loadOutputSchemas(): void {
    this.outputSchemaState.set('loading');
    this.api.getAiGateOutputSchemas().subscribe({
      next: (schemas) => {
        const items = schemas ?? [];
        this.outputSchemas.set(items);
        this.outputSchemaState.set(items.length > 0 ? 'ready' : 'empty');

        if (!this.defaultSchemaApplied && !this.node?.outputSchema && items.length > 0) {
          this.defaultSchemaApplied = true;
          const defaultSchema = defaultOutputSchema(items);
          this.formValueChange({
            ...this.initialValue,
            outputSchema: defaultSchema,
          });
        }
      },
      error: () => {
        this.outputSchemas.set([]);
        this.outputSchemaState.set('error');
      },
    });
  }

  retryAgents(): void {
    this.loadAgents();
  }

  retryOutputSchemas(): void {
    this.loadOutputSchemas();
  }

  override formValueChange(value: Record<string, unknown>): void {
    const next = { ...value };
    const selectedAgent = this.selectedAgent(textValue(next['agentCode']));
    const provider = textValue(next['provider']);

    if (this.agentState() === 'ready' && selectedAgent && (!provider || !providerSupported(selectedAgent, provider))) {
      next['provider'] = defaultProvider(selectedAgent);
    }

    super.formValueChange(next);
  }

  onInputMappingChange(mapping: InputMapping): void {
    if (this.readonly) return;
    this.nodePatch.emit({ inputMapping: mapping });
  }

  private selectedAgent(agentCode: string): WorkflowAgentCatalogItem | undefined {
    return this.agents().find((agent) => agent.agentCode === agentCode);
  }

  private buildAgentOptions(currentAgentCode: string): SelectOption[] {
    const state = this.agentState();
    if (state === 'loading') {
      return [{ label: 'workflowStudio.inspector.loadingAgents', value: currentAgentCode || null, disabled: true }];
    }
    if (state === 'empty') {
      return [{ label: 'workflowStudio.inspector.emptyAgents', value: currentAgentCode || null, disabled: true }];
    }
    if (state === 'error') {
      return [{ label: 'workflowStudio.inspector.errorAgents', value: currentAgentCode || null, disabled: true }];
    }

    const options: SelectOption[] = this.agents().map((agent) => ({
      label: agent.health === 'UNHEALTHY'
        ? `${agent.displayName || agent.agentCode} (${this.unhealthyLabel()})`
        : (agent.displayName || agent.agentCode),
      value: agent.agentCode,
      disabled: agent.health === 'UNHEALTHY',
    }));

    if (currentAgentCode && !this.agents().some((a) => a.agentCode === currentAgentCode)) {
      options.unshift({
        label: `${currentAgentCode} (${this.unavailableLabel()})`,
        value: currentAgentCode,
        disabled: true,
      });
    }

    return options;
  }

  private buildProviderOptions(agent: WorkflowAgentCatalogItem | undefined, currentProvider: string): SelectOption[] {
    if (!agent) {
      if (currentProvider) {
        return [{
          label: `${currentProvider} (${this.unavailableLabel()})`,
          value: currentProvider,
          disabled: true,
        }];
      }
      return [{ label: 'workflowStudio.inspector.noAgentSelected', value: null, disabled: true }];
    }

    const supported = agent.supportedProviders ?? [];
    if (supported.length === 0) {
      return [{ label: 'workflowStudio.inspector.noAvailableProvider', value: null, disabled: true }];
    }

    const options: SelectOption[] = supported.map((p) => ({
      label: `workflowStudio.ai.provider.${p.provider}`,
      value: p.provider,
      disabled: p.available === false,
    }));

    if (currentProvider && !supported.some((p) => p.provider === currentProvider)) {
      options.unshift({
        label: `${currentProvider} (${this.unavailableLabel()})`,
        value: currentProvider,
        disabled: true,
      });
    }

    return options;
  }

  private buildOutputSchemaOptions(currentSchema: string): SelectOption[] {
    const state = this.outputSchemaState();
    if (state === 'loading') {
      return [{ label: 'workflowStudio.inspector.loadingOutputSchemas', value: currentSchema || null, disabled: true }];
    }
    if (state === 'empty') {
      return [{ label: 'workflowStudio.inspector.emptyOutputSchemas', value: currentSchema || null, disabled: true }];
    }
    if (state === 'error') {
      return [{ label: 'workflowStudio.inspector.errorOutputSchemas', value: currentSchema || null, disabled: true }];
    }

    const options: SelectOption[] = this.outputSchemas().map((schema) => ({
      label: schema.label || schema.value,
      value: schema.value,
    }));

    if (currentSchema && !this.outputSchemas().some((s) => s.value === currentSchema)) {
      options.unshift({
        label: `${currentSchema} (${this.unavailableLabel()})`,
        value: currentSchema,
        disabled: true,
      });
    }

    return options;
  }

  private unhealthyLabel(): string {
    return 'workflowStudio.inspector.unhealthy';
  }

  private unavailableLabel(): string {
    return 'workflowStudio.inspector.unavailable';
  }
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
