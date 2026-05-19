import { Component, DestroyRef, OnInit, ViewChild, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { SYSTEM_STATUS_OPTIONS } from '../../../../../core/constants/system.constants';
import { AiModelCreateDto, AiModelResponse, AiModelUpdateDto } from '../../../../../core/models/ai-agent/ai-model.model';
import { AiModelService } from '../../../../../core/services/ai-agent-service/ai-model.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { BaseCrudPageComponent } from '../../../../../shared/ui/base-crud-page/base-crud-page.component';
import { CrudPageConfig } from '../../../../../shared/ui/base-crud-page/base-crud-page.model';
import { FormConfig, FormContext } from '../../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../../shared/ui/form-input/utils/validation-rules';
import { toUniqueTextOptions } from '../../../../form-option-utils';
import { AI_AGENT_USER_SECRETS_OPTIONS_SOURCE } from '../../../../form-input-options-loaders';
import { AI_MODEL_INITIAL_VALUE, AI_MODEL_ROUTES } from '../ai-model.constants';

@Component({
  selector: 'app-ai-model-form',
  standalone: false,
  templateUrl: './ai-model-form.component.html'
})
export class AiModelFormComponent implements OnInit {
  @ViewChild(BaseCrudPageComponent) private readonly crudPage?: BaseCrudPageComponent;

  formContext: FormContext = { user: null, mode: 'create', extra: {} };
  readonly formConfig: FormConfig = {
    fields: [
      { type: 'text', name: 'code', label: 'code', width: '1/2' },
      {
        type: 'auto-complete',
        name: 'modelName',
        label: 'aiAgent.aiModel.modelName',
        width: '1/2',
        optionsExpression: 'context.extra?.modelNameOptions || []',
        validation: [Rules.required('aiAgent.aiModel.validation.modelNameRequired')]
      },
      {
        type: 'select',
        name: 'providerModelType',
        label: 'aiAgent.aiModel.provider',
        width: '1/2',
        options: [
          { label: 'GROQ', value: 'GROQ' },
          { label: 'OPENROUTER', value: 'OPENROUTER' },
          { label: 'PLAYWRIGHT', value: 'PLAYWRIGHT' }
        ],
        validation: [Rules.required('aiAgent.aiModel.validation.providerRequired')]
      },
      {
        type: 'auto-complete',
        name: 'modelType',
        label: 'aiAgent.aiModel.modelType',
        width: '1/2',
        optionsExpression: 'context.extra?.modelTypeOptions || []',
        validation: [Rules.required('aiAgent.aiModel.validation.modelTypeRequired')]
      },
      {
        type: 'select',
        name: 'apiType',
        label: 'aiAgent.aiModel.apiType',
        width: '1/2',
        options: [
          { label: 'OPENAI_COMPATIBLE', value: 'OPENAI_COMPATIBLE' },
          { label: 'TEXT_ONLY', value: 'TEXT_ONLY' },
          { label: 'CUSTOM', value: 'CUSTOM' }
        ]
      },
      {
        type: 'select',
        name: 'toolSupportMode',
        label: 'aiAgent.aiModel.toolSupport',
        width: '1/2',
        options: [
          { label: 'NATIVE', value: 'NATIVE' },
          { label: 'NONE', value: 'NONE' }
        ]
      },
      {
        type: 'auto-complete',
        name: 'url',
        label: 'aiAgent.aiModel.url',
        width: '1/2',
        optionsExpression: 'context.extra?.urlOptions || []'
      },
      { type: 'number', name: 'timeoutMs', label: 'aiAgent.aiModel.timeoutMs', width: '1/2', suffix: 'ms' },
      { type: 'number', name: 'maxContext', label: 'aiAgent.aiModel.maxContext', width: '1/2', suffix: 'tokens' },
      { type: 'select', name: 'status', label: 'status', width: '1/2', options: [...SYSTEM_STATUS_OPTIONS] },
      { type: 'checkbox', name: 'defaultActive', label: 'defaultActive', width: '1/2' },
      {
        type: 'secret-metadata',
        name: 'metadata',
        label: 'metadata',
        width: 'full',
        optionsSource: AI_AGENT_USER_SECRETS_OPTIONS_SOURCE,
        valuePlaceholder: 'metadataValue',
        tokenUrlPlaceholder: 'tokenUrl',
        clientIdPlaceholder: 'clientId',
        clientSecretPlaceholder: 'selectClientSecret',
        passwordPlaceholder: 'selectPasswordSecret'
      },
      { type: 'textarea', name: 'description', label: 'description', width: 'full' }
    ]
  };

  editId: string | null = null;
  readonly loading = signal(false);
  formInitialValue: AiModelCreateDto = { ...AI_MODEL_INITIAL_VALUE };
  readonly formVisible = signal(true);

  constructor(
    private readonly service: AiModelService,
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
    this.loadingService.track(this.service.getAll().pipe(catchError(() => of([] as AiModelResponse[])))).pipe(finalize(() => this.loading.set(false))).subscribe((models) => {
      this.formContext.extra = {
        modelNameOptions: toUniqueTextOptions(models, (item) => item.modelName),
        modelTypeOptions: toUniqueTextOptions(models, (item) => item.modelType),
        urlOptions: toUniqueTextOptions(models, (item) => item.url)
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

  get pageConfig(): CrudPageConfig {
    return {
      title: this.editId ? 'aiAgent.aiModel.editTitle' : 'aiAgent.aiModel.createTitle',
      description: 'aiAgent.aiModel.formDescription',
      actions: [
        { id: 'back', label: 'back', icon: 'pi pi-arrow-left', goBack: true, backLink: AI_MODEL_ROUTES.list, severity: 'secondary', text: true },
        { id: 'submit', label: this.editId ? 'update' : 'create', icon: 'pi pi-save', loading: this.loading(), submitForm: true }
      ],
      infoSection: {
        title: 'aiAgent.aiModel.infoTitle',
        description: 'aiAgent.aiModel.infoDescription'
      }
    };
  }

  onSubmitForm(model: AiModelCreateDto): void {
    const payload: AiModelCreateDto = { ...model };
    const request$ = this.editId ? this.service.update(this.editId, payload as AiModelUpdateDto) : this.service.create(payload);
    this.loading.set(true);
    this.loadingService.track(request$).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => {
        this.toastService.info(this.i18nService.t(this.editId ? 'updateSuccess' : 'createSuccess'));
        this.crudPage?.markFormPristine();
        void this.router.navigate([AI_MODEL_ROUTES.list]);
      },
      error: () => this.toastService.error('aiAgent.aiModel.toast.saveFailed')
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
      this.formInitialValue = { ...AI_MODEL_INITIAL_VALUE };
      this.rerenderForm();
      return;
    }

    this.editId = id;
    this.formContext.mode = 'edit';
    this.loading.set(true);
    this.loadingService.track(this.service.getById(id)).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (detail: AiModelResponse) => {
        this.formInitialValue = {
          code: detail.code ?? '',
          modelName: detail.modelName,
          description: detail.description ?? '',
          modelType: detail.modelType,
          providerModelType: detail.providerModelType,
          status: detail.status,
          defaultActive: detail.defaultActive,
          url: detail.url ?? '',
          apiType: detail.apiType ?? 'OPENAI_COMPATIBLE',
          toolSupportMode: detail.toolSupportMode ?? 'NATIVE',
          timeoutMs: detail.timeoutMs ?? 30000,
          maxContext: detail.maxContext ?? 0,
          metadata: detail.metadata ?? []
        };
        this.rerenderForm();
      },
      error: () => {
        this.toastService.error('aiAgent.aiModel.toast.loadDetailFailed');
        void this.router.navigate([AI_MODEL_ROUTES.list]);
      }
    });
  }
}
