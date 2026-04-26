import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { SYSTEM_STATUS_OPTIONS } from '../../../../../core/constants/system.constants';
import { AgentDefinitionCreateDto, AgentDefinitionResponse, AgentDefinitionUpdateDto } from '../../../../../core/models/ai-agent/agent-definition.model';
import { AiModelResponse } from '../../../../../core/models/ai-agent/ai-model.model';
import { ExecutionPolicyConfigResponse } from '../../../../../core/models/ai-agent/execution-policy.model';
import { PromptTemplateResponse } from '../../../../../core/models/ai-agent/prompt-template.model';
import { AgentDefinitionService } from '../../../../../core/services/ai-agent-service/agent-definition.service';
import { AiModelService } from '../../../../../core/services/ai-agent-service/ai-model.service';
import { ExecutionPolicyService } from '../../../../../core/services/ai-agent-service/execution-policy.service';
import { PromptTemplateService } from '../../../../../core/services/ai-agent-service/prompt-template.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { FormConfig, FormContext } from '../../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../../shared/ui/form-input/utils/validation-rules';
import { AGENT_DEFINITION_INITIAL_VALUE, AGENT_DEFINITION_ROUTES } from '../agent-definition.constants';

@Component({
  selector: 'app-agent-definition-form',
  standalone: false,
  templateUrl: './agent-definition-form.component.html'
})
export class AgentDefinitionFormComponent implements OnInit {
  readonly formContext: FormContext = { user: null, mode: 'create', extra: {} };
  readonly formConfig: FormConfig = {
    fields: [
      { type: 'text', name: 'code', label: 'Code', width: '1/2', validation: [Rules.required('Code is required')] },
      { type: 'text', name: 'name', label: 'Name', width: '1/2', validation: [Rules.required('Name is required')] },
      {
        type: 'select',
        name: 'modelConfigId',
        label: 'Model',
        width: '1/2',
        optionsExpression: 'context.extra?.modelOptions || []'
      },
      {
        type: 'select',
        name: 'systemPromptTemplateId',
        label: 'Prompt Template',
        width: '1/2',
        optionsExpression: 'context.extra?.promptOptions || []'
      },
      {
        type: 'select',
        name: 'executionPolicyId',
        label: 'Execution Policy',
        width: '1/2',
        optionsExpression: 'context.extra?.policyOptions || []'
      },
      { type: 'checkbox', name: 'enabled', label: 'Enabled', width: '1/3' },
      { type: 'checkbox', name: 'defaultActive', label: 'Default Active', width: '1/3' },
      { type: 'select', name: 'status', label: 'Status', width: '1/3', options: [...SYSTEM_STATUS_OPTIONS] },
      { type: 'textarea', name: 'description', label: 'Description', width: 'full' },
      { type: 'textarea', name: 'executionPolicyJson', label: 'Execution Policy JSON Override', width: 'full', showZoomButton: true, contentType: 'json', jsonValidationMessage: 'Invalid JSON' }
    ]
  };

  editId: string | null = null;
  loading = false;
  formInitialValue: AgentDefinitionCreateDto = this.createInitialValue();
  readonly formVisible = signal(true);

  constructor(
    private readonly agentDefinitionService: AgentDefinitionService,
    private readonly aiModelService: AiModelService,
    private readonly promptTemplateService: PromptTemplateService,
    private readonly executionPolicyService: ExecutionPolicyService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly i18nService: I18nService
  ) {}

  ngOnInit(): void {
    this.loadOptions();
  }

  get pageTitle(): string {
    return this.editId ? 'Edit Agent Definition' : 'Create Agent Definition';
  }

  get pageDescription(): string {
    return 'Configure agent, model, tools, prompt template and execution policy.';
  }

  onSubmitForm(model: AgentDefinitionCreateDto): void {
    const payload: AgentDefinitionCreateDto = {
      ...model,
      code: model.code?.trim() || '',
      name: model.name?.trim() || '',
      description: model.description?.trim() || '',
      executionPolicyJson: model.executionPolicyJson?.trim() || ''
    };
    const request$ = this.editId
      ? this.agentDefinitionService.update(this.editId, payload as AgentDefinitionUpdateDto)
      : this.agentDefinitionService.create(payload);
    this.loading = true;
    this.loadingService.track(request$).pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => {
        this.toastService.info(this.i18nService.t(this.editId ? 'updateSuccess' : 'createSuccess'));
        void this.router.navigate([AGENT_DEFINITION_ROUTES.list]);
      },
      error: () => this.toastService.error('Save agent definition failed')
    });
  }

  private loadOptions(): void {
    this.loading = true;
    this.loadingService.track(
      forkJoin({
        models: this.aiModelService.getAll().pipe(catchError(() => of([] as AiModelResponse[]))),
        prompts: this.promptTemplateService.getAll().pipe(catchError(() => of([] as PromptTemplateResponse[]))),
        policies: this.executionPolicyService.getAll().pipe(catchError(() => of([] as ExecutionPolicyConfigResponse[])))
      })
    ).pipe(finalize(() => (this.loading = false))).subscribe({
      next: ({ models, prompts, policies }) => {
        this.formContext.extra = {
          modelOptions: this.toModelOptions(models),
          promptOptions: this.toPromptOptions(prompts),
          policyOptions: this.toPolicyOptions(policies)
        };
        this.bindRouteMode();
      },
      error: () => {
        this.formContext.extra = {
          modelOptions: [],
          promptOptions: [],
          policyOptions: []
        };
        this.toastService.error('Load agent form dependencies failed');
        this.bindRouteMode();
      }
    });
  }

  private bindRouteMode(): void {
    this.applyRouteMode(this.route.snapshot.paramMap.get('id'));
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id === this.editId) {
        return;
      }
      this.applyRouteMode(id);
    });
  }

  private applyRouteMode(id: string | null): void {
    if (!id) {
      this.editId = null;
      this.formContext.mode = 'create';
      this.formInitialValue = this.createInitialValue();
      this.rerenderForm();
      return;
    }

    this.editId = id;
    this.formContext.mode = 'edit';
    this.loading = true;
    this.loadingService.track(this.agentDefinitionService.getById(id)).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (detail: AgentDefinitionResponse) => {
        this.formInitialValue = {
          code: detail.code,
          name: detail.name,
          description: detail.description ?? '',
          systemPromptTemplateId: detail.systemPromptTemplateId ?? '',
          modelConfigId: detail.modelConfigId ?? '',
          executionPolicyId: detail.executionPolicyId ?? '',
          executionPolicyJson: detail.executionPolicyJson ?? '',
          enabled: detail.enabled ?? true,
          defaultActive: detail.defaultActive ?? false,
          status: detail.status ?? 'ACTIVE'
        };
        this.rerenderForm();
      },
      error: () => {
        this.toastService.error('Load agent definition detail failed');
        void this.router.navigate([AGENT_DEFINITION_ROUTES.list]);
      }
    });
  }

  private createInitialValue(): AgentDefinitionCreateDto {
    return JSON.parse(JSON.stringify(AGENT_DEFINITION_INITIAL_VALUE)) as AgentDefinitionCreateDto;
  }

  private rerenderForm(): void {
    this.formVisible.set(false);
    window.setTimeout(() => this.formVisible.set(true));
  }

  private toModelOptions(items: AiModelResponse[]): { label: string; value: string }[] {
    return items.map((item) => ({ label: `${item.modelName}${item.code ? ` (${item.code})` : ''}`, value: item.id }));
  }

  private toPromptOptions(items: PromptTemplateResponse[]): { label: string; value: string }[] {
    return items.map((item) => ({ label: `${item.name} (${item.templateType})`, value: item.id }));
  }

  private toPolicyOptions(items: ExecutionPolicyConfigResponse[]): { label: string; value: string }[] {
    return items.map((item) => ({ label: `${item.name}${item.code ? ` (${item.code})` : ''}`, value: item.id }));
  }
}
