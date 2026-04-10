import { Component, OnInit, signal } from '@angular/core';
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
import { FormConfig, FormContext } from '../../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../../shared/ui/form-input/utils/validation-rules';
import { EXECUTION_POLICY_INITIAL_VALUE, EXECUTION_POLICY_ROUTES } from '../execution-policy.constants';

@Component({
  selector: 'app-execution-policy-form',
  standalone: false,
  templateUrl: './execution-policy-form.component.html'
})
export class ExecutionPolicyFormComponent implements OnInit {
  readonly formContext: FormContext = { user: null, mode: 'create', extra: {} };
  readonly formConfig: FormConfig = {
    fields: [
      { type: 'text', name: 'code', label: 'Code', width: '1/2', validation: [Rules.required('Code is required')] },
      { type: 'text', name: 'name', label: 'Name', width: '1/2', validation: [Rules.required('Name is required')] },
      { type: 'number', name: 'maxSteps', label: 'Max Steps', width: '1/3' },
      { type: 'number', name: 'maxToolCallsPerStep', label: 'Max Tool Calls Per Step', width: '1/3' },
      { type: 'number', name: 'modelTimeoutMs', label: 'Model Timeout (ms)', width: '1/3' },
      { type: 'number', name: 'toolTimeoutMs', label: 'Tool Timeout (ms)', width: '1/3' },
      {
        type: 'select',
        name: 'fallbackModelConfigId',
        label: 'Fallback Model',
        width: 'full',
        optionsExpression: 'context.extra?.modelOptions || []'
      },
      { type: 'checkbox', name: 'allowParallelTools', label: 'Allow Parallel Tools', width: '1/3' },
      { type: 'checkbox', name: 'nativeToolPreferred', label: 'Prefer Native Tool Call', width: '1/3' },
      { type: 'checkbox', name: 'enabled', label: 'Enabled', width: '1/3' }
    ]
  };

  editId: string | null = null;
  loading = false;
  formInitialValue: ExecutionPolicyConfigCreateDto = { ...EXECUTION_POLICY_INITIAL_VALUE };
  readonly formVisible = signal(true);

  constructor(
    private readonly service: ExecutionPolicyService,
    private readonly aiModelService: AiModelService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly i18nService: I18nService
  ) {}

  ngOnInit(): void {
    this.loadDependencies();
  }

  onSubmitForm(model: ExecutionPolicyConfigCreateDto): void {
    const payload: ExecutionPolicyConfigCreateDto = {
      ...model,
      code: model.code?.trim() || '',
      name: model.name?.trim() || ''
    };
    const request$ = this.editId ? this.service.update(this.editId, payload as ExecutionPolicyConfigUpdateDto) : this.service.create(payload);
    this.loading = true;
    this.loadingService.track(request$).pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => {
        this.toastService.info(this.i18nService.t(this.editId ? 'updateSuccess' : 'createSuccess'));
        void this.router.navigate([EXECUTION_POLICY_ROUTES.list]);
      },
      error: () => this.toastService.error('Save execution policy failed')
    });
  }

  private loadDependencies(): void {
    this.loading = true;
    this.loadingService.track(this.aiModelService.getAll()).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (models) => {
        this.formContext.extra = {
          modelOptions: this.toModelOptions(models)
        };
        this.bindRouteMode();
      },
      error: () => {
        this.formContext.extra = { modelOptions: [] };
        this.toastService.error('Load execution policy dependencies failed');
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
      this.formInitialValue = { ...EXECUTION_POLICY_INITIAL_VALUE };
      this.rerenderForm();
      return;
    }

    this.editId = id;
    this.formContext.mode = 'edit';
    this.loading = true;
    this.loadingService.track(this.service.getById(id)).pipe(finalize(() => (this.loading = false))).subscribe({
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
        this.toastService.error('Load execution policy detail failed');
        void this.router.navigate([EXECUTION_POLICY_ROUTES.list]);
      }
    });
  }

  private rerenderForm(): void {
    this.formVisible.set(false);
    window.setTimeout(() => this.formVisible.set(true));
  }

  private toModelOptions(items: AiModelResponse[]): { label: string; value: string }[] {
    return [{ label: 'None', value: '' }, ...items.map((item) => ({ label: `${item.modelName}${item.code ? ` (${item.code})` : ''}`, value: item.id }))];
  }
}
