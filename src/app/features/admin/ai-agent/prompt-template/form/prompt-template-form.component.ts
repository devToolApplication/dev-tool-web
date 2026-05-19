import { Component, DestroyRef, OnInit, ViewChild, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { SYSTEM_STATUS_OPTIONS } from '../../../../../core/constants/system.constants';
import { PromptTemplateCreateDto, PromptTemplateResponse, PromptTemplateUpdateDto } from '../../../../../core/models/ai-agent/prompt-template.model';
import { PromptTemplateService } from '../../../../../core/services/ai-agent-service/prompt-template.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { BaseCrudPageComponent } from '../../../../../shared/ui/base-crud-page/base-crud-page.component';
import { CrudPageConfig } from '../../../../../shared/ui/base-crud-page/base-crud-page.model';
import { FormConfig, FormContext } from '../../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../../shared/ui/form-input/utils/validation-rules';
import { PROMPT_TEMPLATE_INITIAL_VALUE, PROMPT_TEMPLATE_ROUTES } from '../prompt-template.constants';

@Component({
  selector: 'app-prompt-template-form',
  standalone: false,
  templateUrl: './prompt-template-form.component.html'
})
export class PromptTemplateFormComponent implements OnInit {
  @ViewChild(BaseCrudPageComponent) private readonly crudPage?: BaseCrudPageComponent;

  formContext: FormContext = { user: null, mode: 'create' };
  readonly formConfig: FormConfig = {
    fields: [
      { type: 'text', name: 'code', label: 'code', width: '1/2', validation: [Rules.required('aiAgent.promptTemplate.validation.codeRequired')] },
      { type: 'text', name: 'name', label: 'name', width: '1/2', validation: [Rules.required('aiAgent.promptTemplate.validation.nameRequired')] },
      {
        type: 'select',
        name: 'templateType',
        label: 'aiAgent.promptTemplate.templateType',
        width: '1/3',
        options: [
          { label: 'SYSTEM', value: 'SYSTEM' },
          { label: 'USER', value: 'USER' },
          { label: 'TOOL_PROTOCOL', value: 'TOOL_PROTOCOL' },
          { label: 'AGENT', value: 'AGENT' }
        ],
        validation: [Rules.required('aiAgent.promptTemplate.validation.templateTypeRequired')]
      },
      { type: 'number', name: 'version', label: 'aiAgent.promptTemplate.version', width: '1/3' },
      { type: 'checkbox', name: 'enabled', label: 'enabled', width: '1/3' },
      { type: 'select', name: 'status', label: 'status', width: '1/2', options: [...SYSTEM_STATUS_OPTIONS] },
      {
        type: 'textarea',
        name: 'content',
        label: 'aiAgent.promptTemplate.content',
        width: 'full',
        rows: 14,
        showZoomButton: true,
        validation: [Rules.required('aiAgent.promptTemplate.validation.contentRequired')]
      }
    ]
  };

  editId: string | null = null;
  readonly loading = signal(false);
  formInitialValue: PromptTemplateCreateDto = { ...PROMPT_TEMPLATE_INITIAL_VALUE };
  readonly formVisible = signal(true);

  constructor(
    private readonly service: PromptTemplateService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly destroyRef: DestroyRef,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly i18nService: I18nService
  ) {}

  ngOnInit(): void {
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
      title: this.editId ? 'aiAgent.promptTemplate.editTitle' : 'aiAgent.promptTemplate.createTitle',
      description: 'aiAgent.promptTemplate.formDescription',
      actions: [
        { id: 'back', label: 'back', icon: 'pi pi-arrow-left', goBack: true, backLink: PROMPT_TEMPLATE_ROUTES.list, severity: 'secondary', text: true },
        { id: 'submit', label: this.editId ? 'update' : 'create', icon: 'pi pi-save', loading: this.loading(), submitForm: true }
      ],
      infoSection: {
        title: 'aiAgent.promptTemplate.infoTitle',
        description: 'aiAgent.promptTemplate.infoDescription'
      }
    };
  }

  onSubmitForm(model: PromptTemplateCreateDto): void {
    const payload: PromptTemplateCreateDto = {
      ...model,
      code: model.code?.trim() || '',
      name: model.name?.trim() || '',
      content: model.content?.trim() || ''
    };
    const request$ = this.editId ? this.service.update(this.editId, payload as PromptTemplateUpdateDto) : this.service.create(payload);
    this.loading.set(true);
    this.loadingService.track(request$).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => {
        this.toastService.info(this.i18nService.t(this.editId ? 'updateSuccess' : 'createSuccess'));
        this.crudPage?.markFormPristine();
        void this.router.navigate([PROMPT_TEMPLATE_ROUTES.list]);
      },
      error: () => this.toastService.error('aiAgent.promptTemplate.toast.saveFailed')
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
      this.formInitialValue = { ...PROMPT_TEMPLATE_INITIAL_VALUE };
      this.rerenderForm();
      return;
    }

    this.editId = id;
    this.formContext.mode = 'edit';
    this.loading.set(true);
    this.loadingService.track(this.service.getById(id)).pipe(finalize(() => this.loading.set(false))).subscribe({
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
        this.toastService.error('aiAgent.promptTemplate.toast.loadDetailFailed');
        void this.router.navigate([PROMPT_TEMPLATE_ROUTES.list]);
      }
    });
  }
}
