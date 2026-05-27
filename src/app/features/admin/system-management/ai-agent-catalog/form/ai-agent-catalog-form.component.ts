import { Component, DestroyRef, OnInit, ViewChild, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { AiAgentAgentConfigRequest, AiAgentAgentConfigResponse } from '../../../../../core/models/ai-agent/ai-agent-catalog.model';
import { AiAgentAgentConfigService } from '../../../../../core/services/ai-agent-service/ai-agent-catalog.service';
import { AiAgentModelConfigService } from '../../../../../core/services/ai-agent-service/ai-agent-model.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { BaseCrudPageComponent } from '../../../../../shared/ui/base-crud-page/base-crud-page.component';
import { FormConfig, FormContext } from '../../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../../shared/ui/form-input/utils/validation-rules';
import { AI_AGENT_CATALOG_INITIAL_VALUE, AI_AGENT_CATALOG_ROUTES } from '../ai-agent-catalog.constants';

@Component({
  selector: 'app-ai-agent-catalog-form',
  standalone: false,
  templateUrl: './ai-agent-catalog-form.component.html'
})
export class AiAgentCatalogFormComponent implements OnInit {
  @ViewChild(BaseCrudPageComponent) private readonly crudPage?: BaseCrudPageComponent;

  formContext: FormContext = { user: null, mode: 'create', extra: {} };
  readonly formConfig: FormConfig = {
    fields: [
      { type: 'text', name: 'name', label: 'name', width: '1/2', validation: [Rules.required('systemManagement.validation.nameRequired')] },
      {
        type: 'select',
        name: 'roleType',
        label: 'systemManagement.field.roleType',
        width: '1/2',
        options: [
          { label: 'CUSTOM', value: 'CUSTOM' },
          { label: 'BA', value: 'BA' },
          { label: 'DEV', value: 'DEV' },
          { label: 'REVIEW', value: 'REVIEW' },
          { label: 'QA', value: 'QA' },
          { label: 'SYSTEM', value: 'SYSTEM' }
        ],
        validation: [Rules.required('systemManagement.validation.roleTypeRequired')]
      },
      {
        type: 'text',
        name: 'customRoleType',
        label: 'systemManagement.field.customRoleType',
        width: '1/2',
        visibleWhen: 'model.roleType === "CUSTOM"',
        requiredWhen: 'model.roleType === "CUSTOM"',
        requiredWhenMessage: 'systemManagement.validation.customRoleTypeRequired'
      },
      {
        type: 'select',
        name: 'modelConfigId',
        label: 'systemManagement.field.modelName',
        width: '1/2',
        optionsExpression: 'context.extra?.modelOptions || []',
        validation: [Rules.required('systemManagement.validation.modelRequired')]
      },
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
      { type: 'textarea', name: 'systemPrompt', label: 'systemPrompt', width: 'full', validation: [Rules.required('systemManagement.validation.systemPromptRequired')] },
      { type: 'textarea', name: 'description', label: 'description', width: 'full' }
    ]
  };

  editId: string | null = null;
  readonly loading = signal(false);
  formInitialValue: AiAgentAgentConfigRequest = { ...AI_AGENT_CATALOG_INITIAL_VALUE };
  readonly formVisible = signal(true);

  constructor(
    private readonly service: AiAgentAgentConfigService,
    private readonly modelService: AiAgentModelConfigService,
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
      this.modelService.getAll({ status: 'ENABLED' }).pipe(
        catchError((err) => {
          this.toastService.error(this.i18nService.t('systemManagement.aiAgentCatalog.toast.loadModelsError') || 'Failed to load model options');
          return of([]);
        })
      )
    ).pipe(finalize(() => this.loading.set(false))).subscribe((models) => {
      this.formContext.extra = {
        modelOptions: models.map((m: any) => ({ label: m.name, value: m.id }))
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

  onSubmitForm(model: AiAgentAgentConfigRequest): void {
    const request$ = this.editId ? this.service.update(this.editId, model) : this.service.create(model);
    this.loading.set(true);
    this.loadingService.track(request$).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => {
        this.toastService.info(this.i18nService.t(this.editId ? 'updateSuccess' : 'createSuccess'));
        this.crudPage?.markFormPristine();
        void this.router.navigate([AI_AGENT_CATALOG_ROUTES.list]);
      },
      error: (err) => {
        const errorMsg = err?.error?.message || err?.message || this.i18nService.t('systemManagement.aiAgentCatalog.toast.saveError');
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
      this.formInitialValue = { ...AI_AGENT_CATALOG_INITIAL_VALUE };
      this.rerenderForm();
      return;
    }
    this.editId = id;
    this.formContext.mode = 'edit';
    this.loading.set(true);
    this.loadingService.track(this.service.getById(id)).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (detail: AiAgentAgentConfigResponse) => {
        this.formInitialValue = { ...detail };
        this.rerenderForm();
      },
      error: (err) => {
        const errorMsg = err?.error?.message || err?.message || this.i18nService.t('systemManagement.aiAgentCatalog.toast.loadDetailError');
        this.toastService.error(errorMsg);
        void this.router.navigate([AI_AGENT_CATALOG_ROUTES.list]);
      }
    });
  }
}
