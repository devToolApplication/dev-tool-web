import { Component, DestroyRef, OnInit, ViewChild, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AiModelResponse } from '../../../../../core/models/ai-agent/ai-model.model';
import {
  ExecutionPolicyConfigCreateDto,
  ExecutionPolicyConfigResponse,
  ExecutionPolicyConfigUpdateDto
} from '../../../../../core/models/ai-agent/execution-policy.model';
import { AiModelService } from '../../../../../core/services/ai-agent-service/ai-model.service';
import { ExecutionPolicyService } from '../../../../../core/services/ai-agent-service/execution-policy.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { BaseCrudPageComponent } from '../../../../../shared/ui/base-crud-page/base-crud-page.component';
import { CrudPageConfig } from '../../../../../shared/ui/base-crud-page/base-crud-page.model';
import { FormConfig, FormContext } from '../../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../../shared/ui/form-input/utils/validation-rules';
import { EXECUTION_POLICY_INITIAL_VALUE, EXECUTION_POLICY_ROUTES } from '../execution-policy.constants';

@Component({
  selector: 'app-execution-policy-form',
  standalone: false,
  templateUrl: './execution-policy-form.component.html'
})
export class ExecutionPolicyFormComponent implements OnInit {
  @ViewChild(BaseCrudPageComponent) private readonly crudPage?: BaseCrudPageComponent;

  formContext: FormContext = { user: null, mode: 'create', extra: {} };
  readonly formConfig: FormConfig = {
    fields: [
      { type: 'text', name: 'code', label: 'code', width: '1/2', validation: [Rules.required('aiAgent.executionPolicy.validation.codeRequired')] },
      { type: 'text', name: 'name', label: 'name', width: '1/2', validation: [Rules.required('aiAgent.executionPolicy.validation.nameRequired')] },
      { type: 'number', name: 'maxSteps', label: 'aiAgent.executionPolicy.maxSteps', width: '1/3' },
      { type: 'number', name: 'maxToolCallsPerStep', label: 'aiAgent.executionPolicy.maxToolCallsPerStep', width: '1/3' },
      { type: 'number', name: 'modelTimeoutMs', label: 'aiAgent.executionPolicy.modelTimeoutMs', width: '1/3' },
      { type: 'number', name: 'toolTimeoutMs', label: 'aiAgent.executionPolicy.toolTimeoutMs', width: '1/3' },
      {
        type: 'select',
        name: 'fallbackModelConfigId',
        label: 'aiAgent.executionPolicy.fallbackModel',
        width: 'full',
        optionsExpression: 'context.extra?.modelOptions || []'
      },
      { type: 'checkbox', name: 'allowParallelTools', label: 'aiAgent.executionPolicy.allowParallelTools', width: '1/3' },
      { type: 'checkbox', name: 'nativeToolPreferred', label: 'aiAgent.executionPolicy.nativeToolPreferred', width: '1/3' },
      { type: 'checkbox', name: 'enabled', label: 'enabled', width: '1/3' }
    ]
  };

  editId: string | null = null;
  readonly loading = signal(false);
  dependenciesError = '';
  formInitialValue: ExecutionPolicyConfigCreateDto = { ...EXECUTION_POLICY_INITIAL_VALUE };
  readonly formVisible = signal(true);

  constructor(
    private readonly service: ExecutionPolicyService,
    private readonly aiModelService: AiModelService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly destroyRef: DestroyRef,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly i18nService: I18nService
  ) {}

  ngOnInit(): void {
    this.loadDependencies();
  }

  get pageConfig(): CrudPageConfig {
    return {
      title: this.editId ? 'aiAgent.executionPolicy.editTitle' : 'aiAgent.executionPolicy.createTitle',
      description: 'aiAgent.executionPolicy.formDescription',
      actions: [
        { id: 'back', label: 'back', icon: 'pi pi-arrow-left', goBack: true, backLink: EXECUTION_POLICY_ROUTES.list, severity: 'secondary', text: true },
        { id: 'submit', label: this.editId ? 'update' : 'create', icon: 'pi pi-save', loading: this.loading(), submitForm: true }
      ],
      infoSection: {
        title: 'aiAgent.executionPolicy.infoTitle',
        description: 'aiAgent.executionPolicy.infoDescription'
      }
    };
  }

  onSubmitForm(model: ExecutionPolicyConfigCreateDto): void {
    const payload: ExecutionPolicyConfigCreateDto = {
      ...model,
      code: model.code?.trim() || '',
      name: model.name?.trim() || ''
    };
    const request$ = this.editId ? this.service.update(this.editId, payload as ExecutionPolicyConfigUpdateDto) : this.service.create(payload);
    this.loading.set(true);
    this.loadingService.track(request$).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => {
        this.toastService.info(this.i18nService.t(this.editId ? 'updateSuccess' : 'createSuccess'));
        this.crudPage?.markFormPristine();
        void this.router.navigate([EXECUTION_POLICY_ROUTES.list]);
      },
      error: () => this.toastService.error('aiAgent.executionPolicy.toast.saveFailed')
    });
  }

  hasUnsavedChanges(): boolean {
    return this.crudPage?.hasUnsavedChanges() ?? false;
  }

  confirmDiscardChanges(): Promise<boolean> | boolean {
    return this.crudPage?.confirmDiscardChanges() ?? true;
  }

  private loadDependencies(): void {
    this.loading.set(true);
    this.dependenciesError = '';
    this.loadingService.track(this.aiModelService.getAll()).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (models) => {
        this.dependenciesError = '';
        this.formContext.extra = {
          modelOptions: this.toModelOptions(models)
        };
        this.bindRouteMode();
      },
      error: () => {
        this.formContext.extra = { modelOptions: [] };
        this.dependenciesError = 'aiAgent.executionPolicy.dependenciesUnavailable';
        this.toastService.error('aiAgent.executionPolicy.toast.loadDependenciesFailed');
        this.bindRouteMode();
      }
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

  private applyRouteMode(id: string | null): void {
    if (!id) {
      this.editId = null;
      this.formContext.mode = 'create';
      this.formInitialValue = { ...EXECUTION_POLICY_INITIAL_VALUE };
      this.rerenderForm();
      return;
    }

    this.editId = id;
    this.formContext.mode = 'edit';
    this.loading.set(true);
    this.loadingService.track(this.service.getById(id)).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (detail: ExecutionPolicyConfigResponse) => {
        this.formInitialValue = {
          code: detail.code ?? '',
          name: detail.name ?? '',
          maxSteps: detail.maxSteps ?? 6,
          maxToolCallsPerStep: detail.maxToolCallsPerStep ?? 8,
          allowParallelTools: detail.allowParallelTools ?? false,
          modelTimeoutMs: detail.modelTimeoutMs ?? 30000,
          toolTimeoutMs: detail.toolTimeoutMs ?? 10000,
          fallbackModelConfigId: detail.fallbackModelConfigId ?? '',
          nativeToolPreferred: detail.nativeToolPreferred ?? false,
          enabled: detail.enabled ?? true
        };
        this.rerenderForm();
      },
      error: () => {
        this.toastService.error('aiAgent.executionPolicy.toast.loadDetailFailed');
        void this.router.navigate([EXECUTION_POLICY_ROUTES.list]);
      }
    });
  }

  private rerenderForm(): void {
    this.formContext = { ...this.formContext, extra: { ...(this.formContext.extra ?? {}) } };
  }

  private toModelOptions(items: AiModelResponse[]): { label: string; value: string }[] {
    return [{ label: 'none', value: '' }, ...items.map((item) => ({ label: `${item.modelName}${item.code ? ` (${item.code})` : ''}`, value: item.id }))];
  }
}
