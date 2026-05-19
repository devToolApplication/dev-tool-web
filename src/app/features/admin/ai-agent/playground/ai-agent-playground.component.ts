import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, Subscription } from 'rxjs';
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
import { BadgeVariant } from '../../../../shared/ui/data-display/badge/badge.component';
import { KeyValueItem } from '../../../../shared/ui/data-display/key-value-list/key-value-list.component';
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
export class AiAgentPlaygroundComponent implements OnInit, OnDestroy {
  formContext: FormContext = { user: null, mode: 'create', extra: {} };
  readonly formConfig: FormConfig = {
    fields: [
      {
        type: 'select',
        name: 'agentId',
        label: 'aiAgent.agent',
        width: '1/2',
        optionsExpression: 'context.extra?.agentOptions || []',
        showClear: true
      },
      {
        type: 'select',
        name: 'modelId',
        label: 'aiAgent.modelOverride',
        width: '1/2',
        optionsExpression: 'context.extra?.modelOptions || []',
        showClear: true
      },
      {
        type: 'text',
        name: 'userId',
        label: 'aiAgent.userId',
        width: '1/2',
        placeholder: 'aiAgent.playground.optionalUserId'
      },
      {
        type: 'textarea',
        name: 'systemPrompt',
        label: 'aiAgent.systemPromptOverride',
        width: 'full',
        rows: 4,
        showZoomButton: true
      },
      {
        type: 'textarea',
        name: 'userPrompt',
        label: 'aiAgent.userPrompt',
        width: 'full',
        rows: 10,
        showZoomButton: true,
        validation: [Rules.required('aiAgent.validation.userPromptRequired')]
      }
    ]
  };

  readonly formVisible = signal(true);

  loading = false;
  running = false;
  traceLoading = false;
  traceError = '';
  dependenciesError = '';
  formInitialValue: PlaygroundFormValue = { ...PLAYGROUND_INITIAL_VALUE };
  formValue: PlaygroundFormValue = { ...PLAYGROUND_INITIAL_VALUE };
  result: AiAgentAskResponse | null = null;
  steps: ExecutionStepResponse[] = [];
  private queryAgentId = '';
  private queryUserId = '';
  private activeRun?: Subscription;

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

  ngOnDestroy(): void {
    this.activeRun?.unsubscribe();
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
    if (this.running) {
      return;
    }

    const payload: PlaygroundFormValue = {
      agentId: model.agentId?.trim() || '',
      modelId: model.modelId?.trim() || '',
      systemPrompt: model.systemPrompt?.trim() || '',
      userPrompt: model.userPrompt?.trim() || '',
      userId: model.userId?.trim() || ''
    };

    if (!payload.agentId && !payload.modelId) {
      this.toastService.error('aiAgent.playground.validation.agentOrModelRequired');
      return;
    }

    this.running = true;
    this.result = null;
    this.steps = [];
    this.traceError = '';
    this.activeRun = this.loadingService.track(this.aiAgentAdminService.ask(payload)).pipe(finalize(() => {
      this.running = false;
      this.activeRun = undefined;
    })).subscribe({
      next: (response) => {
        this.result = response;
        if (response.sessionId) {
          this.loadSteps(response.sessionId);
        }
        if (response.success) {
          this.toastService.info('aiAgent.playground.toast.runCompleted');
        } else {
          this.toastService.error(response.errorMessage || 'aiAgent.playground.toast.runFailed');
        }
      },
      error: () => this.toastService.error('aiAgent.playground.toast.runFailed')
    });
  }

  onActionClick(actionId: string): void {
    if (actionId === 'clear-result') {
      this.clearResult();
    }
    if (actionId === 'cancel-run') {
      this.cancelRunningRequest();
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

  cancelRunningRequest(): void {
    if (!this.activeRun) {
      return;
    }

    this.activeRun.unsubscribe();
    this.activeRun = undefined;
    this.running = false;
    this.toastService.info('aiAgent.playground.toast.runCanceled');
  }

  get resultSummaryItems(): KeyValueItem[] {
    const currentResult = this.result;
    if (!currentResult) {
      return [];
    }

    return [
      { label: 'aiAgent.agent', value: this.selectedAgentLabel },
      { label: 'aiAgent.modelOverride', value: this.selectedModelLabel },
      { label: 'aiAgent.sessionId', value: currentResult.sessionId, type: 'copyable' },
      { label: 'aiAgent.userId', value: this.formValue.userId || this.formInitialValue.userId, type: 'copyable' },
      { label: 'aiAgent.totalTokens', value: currentResult.totalToken ?? 0, type: 'number', format: '1.0-0' },
      { label: 'aiAgent.iterations', value: currentResult.iterationCount ?? 0, type: 'number', format: '1.0-0' }
    ];
  }

  get resultStatusLabel(): string {
    if (!this.result) {
      return '-';
    }

    return this.result.executionStatus || (this.result.success ? 'COMPLETED' : 'FAILED');
  }

  get resultStatusVariant(): BadgeVariant {
    if (!this.result) {
      return 'muted';
    }

    return this.result.success ? 'success' : 'danger';
  }

  parsePayload(payloadJson?: string): unknown {
    if (!payloadJson?.trim()) {
      return {};
    }

    try {
      return JSON.parse(payloadJson);
    } catch {
      return payloadJson;
    }
  }

  private loadDependencies(): void {
    this.loading = true;
    this.dependenciesError = '';
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
        this.dependenciesError = 'aiAgent.playground.dependenciesUnavailable';
        this.toastService.error('aiAgent.playground.toast.loadDependenciesFailed');
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
    this.traceError = '';
    this.loadingService.track(this.executionTraceService.getSteps(sessionId)).pipe(finalize(() => (this.traceLoading = false))).subscribe({
      next: (steps) => {
        this.steps = steps;
      },
      error: () => {
        this.traceError = 'aiAgent.playground.toast.loadTraceFailed';
        this.toastService.error('aiAgent.playground.toast.loadTraceFailed');
      }
    });
  }

  private clearResult(): void {
    this.result = null;
    this.steps = [];
    this.traceError = '';
  }

  private rerenderForm(): void {
    this.formContext = { ...this.formContext, extra: { ...(this.formContext.extra ?? {}) } };
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
