import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { SYSTEM_STATUS_OPTIONS } from '../../../../../core/constants/system.constants';
import { AiModelCreateDto, AiModelResponse, AiModelUpdateDto } from '../../../../../core/models/ai-agent/ai-model.model';
import { AiModelService } from '../../../../../core/services/ai-agent-service/ai-model.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { FormConfig, FormContext } from '../../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../../shared/ui/form-input/utils/validation-rules';
import { AI_MODEL_INITIAL_VALUE, AI_MODEL_ROUTES } from '../ai-model.constants';

@Component({
  selector: 'app-ai-model-form',
  standalone: false,
  templateUrl: './ai-model-form.component.html'
})
export class AiModelFormComponent implements OnInit {
  readonly formContext: FormContext = { user: null, mode: 'create' };
  readonly formConfig: FormConfig = {
    fields: [
      { type: 'text', name: 'code', label: 'Code', width: '1/2' },
      { type: 'text', name: 'modelName', label: 'Model Name', width: '1/2', validation: [Rules.required('Name is required')] },
      {
        type: 'select',
        name: 'providerModelType',
        label: 'Provider',
        width: '1/2',
        options: [
          { label: 'GROQ', value: 'GROQ' },
          { label: 'OPENROUTER', value: 'OPENROUTER' },
          { label: 'PLAYWRIGHT', value: 'PLAYWRIGHT' }
        ],
        validation: [Rules.required('Provider is required')]
      },
      { type: 'text', name: 'modelType', label: 'Model Type', width: '1/2', validation: [Rules.required('Model type is required')] },
      {
        type: 'select',
        name: 'apiType',
        label: 'API Type',
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
        label: 'Tool Support',
        width: '1/2',
        options: [
          { label: 'NATIVE', value: 'NATIVE' },
          { label: 'NONE', value: 'NONE' }
        ]
      },
      { type: 'text', name: 'url', label: 'URL', width: '1/2' },
      { type: 'number', name: 'timeoutMs', label: 'Timeout (ms)', width: '1/2' },
      { type: 'number', name: 'maxContext', label: 'Max Context', width: '1/2' },
      { type: 'select', name: 'status', label: 'Status', width: '1/2', options: [...SYSTEM_STATUS_OPTIONS] },
      { type: 'checkbox', name: 'defaultActive', label: 'Default Active', width: '1/2' },
      {
        type: 'secret-metadata',
        name: 'metadata',
        label: 'Metadata',
        width: 'full',
        service: 'ai-agent-mcrs'
      },
      { type: 'textarea', name: 'description', label: 'Description', width: 'full' }
    ]
  };

  editId: string | null = null;
  loading = false;
  formInitialValue: AiModelCreateDto = { ...AI_MODEL_INITIAL_VALUE };
  readonly formVisible = signal(true);

  constructor(
    private readonly service: AiModelService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly i18nService: I18nService
  ) {}

  ngOnInit(): void {
    this.applyRouteMode(this.route.snapshot.paramMap.get('id'));
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id === this.editId) {
        return;
      }
      this.applyRouteMode(id);
    });
  }

  onSubmitForm(model: AiModelCreateDto): void {
    const payload: AiModelCreateDto = { ...model };
    const request$ = this.editId ? this.service.update(this.editId, payload as AiModelUpdateDto) : this.service.create(payload);
    this.loading = true;
    this.loadingService.track(request$).pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => {
        this.toastService.info(this.i18nService.t(this.editId ? 'updateSuccess' : 'createSuccess'));
        void this.router.navigate([AI_MODEL_ROUTES.list]);
      },
      error: () => this.toastService.error('Save AI model failed')
    });
  }

  private rerenderForm(): void {
    this.formVisible.set(false);
    window.setTimeout(() => this.formVisible.set(true));
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
    this.loading = true;
    this.loadingService.track(this.service.getById(id)).pipe(finalize(() => (this.loading = false))).subscribe({
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
        this.toastService.error('Load AI model detail failed');
        void this.router.navigate([AI_MODEL_ROUTES.list]);
      }
    });
  }
}
