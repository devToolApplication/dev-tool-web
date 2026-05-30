import { Component, DestroyRef, OnInit, ViewChild, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { AiAgentModelConfigRequest, AiAgentModelConfigResponse } from '../../../../../core/models/ai-agent/ai-agent-model.model';
import { AiAgentModelConfigService } from '../../../../../core/services/ai-agent-service/ai-agent-model.service';
import { AiAgentSecretService } from '../../../../../core/services/ai-agent-service/ai-agent-secret.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { BaseCrudPageComponent } from '../../../../../shared/ui/base-crud-page/base-crud-page.component';
import { FormConfig, FormContext } from '../../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../../shared/ui/form-input/utils/validation-rules';
import { AI_AGENT_MODEL_INITIAL_VALUE, AI_AGENT_MODEL_ROUTES } from '../ai-agent-model.constants';

@Component({
  selector: 'app-ai-agent-model-form',
  standalone: false,
  templateUrl: './ai-agent-model-form.component.html'
})
export class AiAgentModelFormComponent implements OnInit {
  @ViewChild(BaseCrudPageComponent) private readonly crudPage?: BaseCrudPageComponent;

  formContext: FormContext = { user: null, mode: 'create', extra: {} };
  readonly formConfig: FormConfig = {
    fields: [
      { type: 'text', name: 'name', label: 'name', width: '1/2', validation: [Rules.required('systemManagement.validation.nameRequired')] },
      {
        type: 'select',
        name: 'providerType',
        label: 'systemManagement.field.providerType',
        width: '1/2',
        options: [
          { label: 'systemManagement.providerType.api', value: 'API' },
          { label: 'systemManagement.providerType.agentCli', value: 'AGENT_CLI' },
          { label: 'systemManagement.providerType.external', value: 'EXTERNAL' },
          { label: 'systemManagement.providerType.local', value: 'LOCAL' }
        ],
        validation: [Rules.required('systemManagement.validation.providerTypeRequired')]
      },
      {
        type: 'select',
        name: 'providerCode',
        label: 'systemManagement.field.providerCode',
        width: '1/2',
        options: [
          { label: 'OPENROUTER', value: 'OPENROUTER' },
          { label: 'OPUSMAX', value: 'OPUSMAX' },
          { label: 'OPENAI', value: 'OPENAI' },
          { label: 'ANTHROPIC', value: 'ANTHROPIC' },
          { label: 'GOOGLE', value: 'GOOGLE' },
          { label: 'CODEX', value: 'CODEX' },
          { label: 'CLAUDE', value: 'CLAUDE' },
          { label: 'ANTIGRAVITY', value: 'ANTIGRAVITY' },
          { label: 'OTHER', value: 'OTHER' }
        ],
        validation: [Rules.required('systemManagement.validation.providerCodeRequired')]
      },
      { type: 'text', name: 'modelName', label: 'systemManagement.field.modelName', width: '1/2', validation: [Rules.required('systemManagement.validation.modelNameRequired')] },
      {
        type: 'select',
        name: 'authMethod',
        label: 'systemManagement.field.authMethod',
        width: '1/2',
        options: [
          { label: 'API_KEY', value: 'API_KEY' },
          { label: 'OAUTH_TOKEN', value: 'OAUTH_TOKEN' },
          { label: 'SESSION_CREDENTIALS', value: 'SESSION_CREDENTIALS' }
        ]
      },
      { type: 'text', name: 'baseUrl', label: 'systemManagement.field.baseUrl', width: '1/2', visibleWhen: "model.providerType !== 'AGENT_CLI'" },
      {
        type: 'select',
        name: 'secretReferenceId',
        label: 'systemManagement.field.secretReferenceName',
        width: '1/2',
        optionsExpression: 'context.extra?.secretOptions || []',
        visibleWhen: "model.providerType !== 'AGENT_CLI'"
      },
      { type: 'number', name: 'maxTokens', label: 'systemManagement.field.maxTokens', width: '1/4', visibleWhen: "model.providerType !== 'AGENT_CLI'" },
      { type: 'number', name: 'temperature', label: 'systemManagement.field.temperature', width: '1/4', visibleWhen: "model.providerType !== 'AGENT_CLI'" },
      {
        type: 'select',
        name: 'status',
        label: 'status',
        width: '1/2',
        options: [
          { label: 'ENABLED', value: 'ENABLED' },
          { label: 'DISABLED', value: 'DISABLED' }
        ],
        validation: [Rules.required('statusRequired')]
      },
      { type: 'tags', name: 'capabilities', label: 'systemManagement.field.capabilities', width: 'full' },
      { type: 'textarea', name: 'description', label: 'description', width: 'full' }
    ]
  };

  editId: string | null = null;
  readonly loading = signal(false);
  formInitialValue: AiAgentModelConfigRequest = { ...AI_AGENT_MODEL_INITIAL_VALUE };
  readonly formVisible = signal(true);

  constructor(
    private readonly service: AiAgentModelConfigService,
    private readonly secretService: AiAgentSecretService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly destroyRef: DestroyRef,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly i18nService: I18nService
  ) {}

  ngOnInit(): void {
    this.loadOptions();
  }

  private loadOptions(): void {
    this.loading.set(true);
    this.loadingService.track(
      this.secretService.getAll({ category: 'AI_AGENT' }).pipe(
        catchError((err) => {
          this.toastService.error(this.i18nService.t('systemManagement.aiAgentModel.toast.loadSecretsError') || 'Failed to load secret options');
          return of([]);
        })
      )
    ).pipe(finalize(() => this.loading.set(false))).subscribe((secrets) => {
      this.formContext.extra = {
        secretOptions: secrets.map((s: any) => ({ label: `${s.name} (${s.code})`, value: s.id }))
      };
      this.bindRouteMode();
    });
  }

  private bindRouteMode(): void {
    this.applyRouteMode(this.route.snapshot.paramMap.get('id'));
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('id');
      if (id === this.editId) {
        return;
      }
      this.applyRouteMode(id);
    });
  }

  onSubmitForm(model: AiAgentModelConfigRequest): void {
    const request$ = this.editId ? this.service.update(this.editId, model) : this.service.create(model);
    this.loading.set(true);
    this.loadingService.track(request$).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => {
        this.toastService.info(this.i18nService.t(this.editId ? 'updateSuccess' : 'createSuccess'));
        this.crudPage?.markFormPristine();
        void this.router.navigate([AI_AGENT_MODEL_ROUTES.list]);
      },
      error: (err) => {
        const errorMsg = err?.error?.message || err?.message || this.i18nService.t('systemManagement.aiAgentModel.toast.saveError');
        this.toastService.error(errorMsg);
      }
    });
  }

  hasUnsavedChanges(): boolean {
    return this.crudPage?.hasUnsavedChanges() ?? false;
  }

  confirmDiscardChanges(): Promise<boolean> | boolean {
    return this.crudPage?.confirmDiscardChanges() ?? true;
  }

  private rerenderForm(): void {
    this.formContext = { ...this.formContext, extra: { ...(this.formContext.extra ?? {}) } };
  }

  private applyRouteMode(id: string | null): void {
    if (!id) {
      this.editId = null;
      this.formContext.mode = 'create';
      this.formInitialValue = { ...AI_AGENT_MODEL_INITIAL_VALUE };
      this.rerenderForm();
      return;
    }
    this.editId = id;
    this.formContext.mode = 'edit';
    this.loading.set(true);
    this.loadingService.track(this.service.getById(id)).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (detail: AiAgentModelConfigResponse) => {
        this.formInitialValue = { ...detail };
        this.rerenderForm();
      },
      error: (err) => {
        const errorMsg = err?.error?.message || err?.message || this.i18nService.t('systemManagement.aiAgentModel.toast.loadDetailError');
        this.toastService.error(errorMsg);
        void this.router.navigate([AI_AGENT_MODEL_ROUTES.list]);
      }
    });
  }
}
