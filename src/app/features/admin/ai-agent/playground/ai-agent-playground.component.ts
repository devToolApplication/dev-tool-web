import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AgentDefinitionResponse } from '../../../../core/models/ai-agent/agent-definition.model';
import { AiAgentAskRequest, AiAgentAskResponse } from '../../../../core/models/ai-agent/ai-agent-ask.model';
import { AiModelResponse } from '../../../../core/models/ai-agent/ai-model.model';
import { ExecutionStepResponse } from '../../../../core/models/ai-agent/execution-trace.model';
import { AgentDefinitionService } from '../../../../core/services/ai-agent-service/agent-definition.service';
import { AiAgentAdminService } from '../../../../core/services/ai-agent-service/ai-agent-admin.service';
import { AiModelService } from '../../../../core/services/ai-agent-service/ai-model.service';
import { ExecutionTraceService } from '../../../../core/services/ai-agent-service/execution-trace.service';
import { LoadingService } from '../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../core/ui-services/toast.service';
import { FormConfig, FormContext } from '../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../shared/ui/form-input/utils/validation-rules';

type PlaygroundFormValue = AiAgentAskRequest;

const PLAYGROUND_INITIAL_VALUE: PlaygroundFormValue = {
  agentId: '',
  modelId: '',
  systemPrompt: '',
  userPrompt: '',
  userId: ''
};

@Component({
  selector: 'app-ai-agent-playground',
  standalone: false,
  templateUrl: './ai-agent-playground.component.html',
  styleUrl: './ai-agent-playground.component.css'
})
export class AiAgentPlaygroundComponent implements OnInit {
  readonly formContext: FormContext = { user: null, mode: 'create', extra: {} };
  readonly formConfig: FormConfig = {
    fields: [
      {
        type: 'select',
        name: 'agentId',
        label: 'Agent',
        width: '1/2',
        optionsExpression: 'context.extra?.agentOptions || []',
        showClear: true
      },
      {
        type: 'select',
        name: 'modelId',
        label: 'Model Override',
        width: '1/2',
        optionsExpression: 'context.extra?.modelOptions || []',
        validation: [Rules.required('Model is required')],
        showClear: true
      },
      {
        type: 'text',
        name: 'userId',
        label: 'User ID',
        width: '1/2',
        placeholder: 'Optional user or correlation id'
      },
      {
        type: 'textarea',
        name: 'systemPrompt',
        label: 'System Prompt Override',
        width: 'full',
        rows: 4,
        showZoomButton: true
      },
      {
        type: 'textarea',
        name: 'userPrompt',
        label: 'User Prompt',
        width: 'full',
        rows: 10,
        showZoomButton: true,
        validation: [Rules.required('User prompt is required')]
      }
    ]
  };

  readonly formVisible = signal(true);

  loading = false;
  running = false;
  traceLoading = false;
  formInitialValue: PlaygroundFormValue = { ...PLAYGROUND_INITIAL_VALUE };
  formValue: PlaygroundFormValue = { ...PLAYGROUND_INITIAL_VALUE };
  result: AiAgentAskResponse | null = null;
  steps: ExecutionStepResponse[] = [];
  private queryAgentId = '';
  private queryUserId = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly agentDefinitionService: AgentDefinitionService,
    private readonly aiModelService: AiModelService,
    private readonly aiAgentAdminService: AiAgentAdminService,
    private readonly executionTraceService: ExecutionTraceService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.queryAgentId = params.get('agentId') ?? '';
      this.queryUserId = params.get('userId') ?? '';
      this.applyQueryDefaults();
    });
    this.loadDependencies();
  }

  onValueChange(model: PlaygroundFormValue): void {
    this.formValue = {
      agentId: model?.agentId || '',
      modelId: model?.modelId || '',
      systemPrompt: model?.systemPrompt || '',
      userPrompt: model?.userPrompt || '',
      userId: model?.userId || ''
    };
  }

  onSubmitForm(model: PlaygroundFormValue): void {
    const payload: PlaygroundFormValue = {
      agentId: model.agentId?.trim() || '',
      modelId: model.modelId?.trim() || '',
      systemPrompt: model.systemPrompt?.trim() || '',
      userPrompt: model.userPrompt?.trim() || '',
      userId: model.userId?.trim() || ''
    };

    if (!payload.agentId && !payload.modelId) {
      this.toastService.error('Choose an agent or a model override before running');
      return;
    }

    this.running = true;
    this.result = null;
    this.steps = [];
    this.loadingService.track(this.aiAgentAdminService.ask(payload)).pipe(finalize(() => (this.running = false))).subscribe({
      next: (response) => {
        this.result = response;
        if (response.sessionId) {
          this.loadSteps(response.sessionId);
        }
        if (response.success) {
          this.toastService.info('Playground run completed');
        } else {
          this.toastService.error(response.errorMessage || 'Playground run failed');
        }
      },
      error: () => this.toastService.error('Playground run failed')
    });
  }

  onActionClick(actionId: string): void {
    if (actionId === 'clear-result') {
      this.clearResult();
    }
  }

  refreshTrace(): void {
    if (!this.result?.sessionId) {
      return;
    }
    this.loadSteps(this.result.sessionId);
  }

  get selectedAgentLabel(): string {
    return this.getOptionLabel('agentOptions', this.formValue.agentId || this.formInitialValue.agentId || '');
  }

  get selectedModelLabel(): string {
    return this.getOptionLabel('modelOptions', this.formValue.modelId || this.formInitialValue.modelId || '');
  }

  formatPayload(payloadJson?: string): string {
    if (!payloadJson?.trim()) {
      return '{}';
    }

    try {
      return JSON.stringify(JSON.parse(payloadJson), null, 2);
    } catch {
      return payloadJson;
    }
  }

  private loadDependencies(): void {
    this.loading = true;
    this.loadingService.track(
      forkJoin({
        agents: this.agentDefinitionService.getAll({ enabled: true }),
        models: this.aiModelService.getAll()
      })
    ).pipe(finalize(() => (this.loading = false))).subscribe({
      next: ({ agents, models }) => {
        this.formContext.extra = {
          agentOptions: this.toAgentOptions(agents),
          modelOptions: this.toModelOptions(models)
        };
        this.applyQueryDefaults();
      },
      error: () => {
        this.formContext.extra = {
          agentOptions: [],
          modelOptions: []
        };
        this.toastService.error('Load playground dependencies failed');
        this.applyQueryDefaults();
      }
    });
  }

  private applyQueryDefaults(): void {
    const nextValue: PlaygroundFormValue = {
      ...this.formInitialValue,
      agentId: this.queryAgentId || this.formValue.agentId || this.formInitialValue.agentId || '',
      userId: this.queryUserId || this.formValue.userId || this.formInitialValue.userId || ''
    };
    this.formInitialValue = nextValue;
    this.formValue = { ...nextValue };
    this.rerenderForm();
  }

  private loadSteps(sessionId: string): void {
    this.traceLoading = true;
    this.loadingService.track(this.executionTraceService.getSteps(sessionId)).pipe(finalize(() => (this.traceLoading = false))).subscribe({
      next: (steps) => {
        this.steps = steps;
      },
      error: () => this.toastService.error('Load playground trace failed')
    });
  }

  private clearResult(): void {
    this.result = null;
    this.steps = [];
  }

  private rerenderForm(): void {
    this.formVisible.set(false);
    window.setTimeout(() => this.formVisible.set(true));
  }

  private toAgentOptions(items: AgentDefinitionResponse[]): { label: string; value: string }[] {
    return items.map((item) => ({ label: `${item.name}${item.code ? ` (${item.code})` : ''}`, value: item.id }));
  }

  private toModelOptions(items: AiModelResponse[]): { label: string; value: string }[] {
    return items.map((item) => ({ label: `${item.modelName}${item.code ? ` (${item.code})` : ''}`, value: item.id }));
  }

  private getOptionLabel(optionKey: 'agentOptions' | 'modelOptions', value: string): string {
    if (!value) {
      return '-';
    }

    const options = this.formContext.extra?.[optionKey] ?? [];
    const match = options.find((item: { label: string; value: string }) => item.value === value);
    return match?.label ?? value;
  }
}
