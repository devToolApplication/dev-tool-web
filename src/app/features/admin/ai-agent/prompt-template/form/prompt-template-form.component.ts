import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { SYSTEM_STATUS_OPTIONS } from '../../../../../core/constants/system.constants';
import { PromptTemplateCreateDto, PromptTemplateResponse, PromptTemplateUpdateDto } from '../../../../../core/models/ai-agent/prompt-template.model';
import { PromptTemplateService } from '../../../../../core/services/ai-agent-service/prompt-template.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { FormConfig, FormContext } from '../../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../../shared/ui/form-input/utils/validation-rules';
import { PROMPT_TEMPLATE_INITIAL_VALUE, PROMPT_TEMPLATE_ROUTES } from '../prompt-template.constants';

@Component({
  selector: 'app-prompt-template-form',
  standalone: false,
  templateUrl: './prompt-template-form.component.html'
})
export class PromptTemplateFormComponent implements OnInit {
  readonly formContext: FormContext = { user: null, mode: 'create' };
  readonly formConfig: FormConfig = {
    fields: [
      { type: 'text', name: 'code', label: 'Code', width: '1/2', validation: [Rules.required('Code is required')] },
      { type: 'text', name: 'name', label: 'Name', width: '1/2', validation: [Rules.required('Name is required')] },
      {
        type: 'select',
        name: 'templateType',
        label: 'Template Type',
        width: '1/3',
        options: [
          { label: 'SYSTEM', value: 'SYSTEM' },
          { label: 'USER', value: 'USER' },
          { label: 'TOOL_PROTOCOL', value: 'TOOL_PROTOCOL' },
          { label: 'AGENT', value: 'AGENT' }
        ],
        validation: [Rules.required('Template type is required')]
      },
      { type: 'number', name: 'version', label: 'Version', width: '1/3' },
      { type: 'checkbox', name: 'enabled', label: 'Enabled', width: '1/3' },
      { type: 'select', name: 'status', label: 'Status', width: '1/2', options: [...SYSTEM_STATUS_OPTIONS] },
      {
        type: 'textarea',
        name: 'content',
        label: 'Template Content',
        width: 'full',
        rows: 14,
        showZoomButton: true,
        validation: [Rules.required('Template content is required')]
      }
    ]
  };

  editId: string | null = null;
  loading = false;
  formInitialValue: PromptTemplateCreateDto = { ...PROMPT_TEMPLATE_INITIAL_VALUE };
  readonly formVisible = signal(true);

  constructor(
    private readonly service: PromptTemplateService,
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

  onSubmitForm(model: PromptTemplateCreateDto): void {
    const payload: PromptTemplateCreateDto = {
      ...model,
      code: model.code?.trim() || '',
      name: model.name?.trim() || '',
      content: model.content?.trim() || ''
    };
    const request$ = this.editId ? this.service.update(this.editId, payload as PromptTemplateUpdateDto) : this.service.create(payload);
    this.loading = true;
    this.loadingService.track(request$).pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => {
        this.toastService.info(this.i18nService.t(this.editId ? 'updateSuccess' : 'createSuccess'));
        void this.router.navigate([PROMPT_TEMPLATE_ROUTES.list]);
      },
      error: () => this.toastService.error('Save prompt template failed')
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
      this.formInitialValue = { ...PROMPT_TEMPLATE_INITIAL_VALUE };
      this.rerenderForm();
      return;
    }

    this.editId = id;
    this.formContext.mode = 'edit';
    this.loading = true;
    this.loadingService.track(this.service.getById(id)).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (detail: PromptTemplateResponse) => {
        this.formInitialValue = {
          code: detail.code ?? '',
          name: detail.name ?? '',
          templateType: detail.templateType ?? 'SYSTEM',
          content: detail.content ?? '',
          version: detail.version ?? 1,
          enabled: detail.enabled ?? true,
          status: detail.status ?? 'ACTIVE'
        };
        this.rerenderForm();
      },
      error: () => {
        this.toastService.error('Load prompt template detail failed');
        void this.router.navigate([PROMPT_TEMPLATE_ROUTES.list]);
      }
    });
  }
}
