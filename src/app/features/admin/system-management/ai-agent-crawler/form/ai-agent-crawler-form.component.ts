import { Component, DestroyRef, OnInit, ViewChild, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AiAgentCrawlerConfigRequest, AiAgentCrawlerConfigResponse } from '../../../../../core/models/ai-agent/ai-agent-crawler.model';
import { AiAgentCrawlerConfigService } from '../../../../../core/services/ai-agent-service/ai-agent-crawler.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { BaseCrudPageComponent } from '../../../../../shared/ui/base-crud-page/base-crud-page.component';
import { FormConfig, FormContext } from '../../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../../shared/ui/form-input/utils/validation-rules';
import { AI_AGENT_CRAWLER_INITIAL_VALUE, AI_AGENT_CRAWLER_ROUTES } from '../ai-agent-crawler.constants';

@Component({
  selector: 'app-ai-agent-crawler-form',
  standalone: false,
  templateUrl: './ai-agent-crawler-form.component.html'
})
export class AiAgentCrawlerFormComponent implements OnInit {
  @ViewChild(BaseCrudPageComponent) private readonly crudPage?: BaseCrudPageComponent;

  formContext: FormContext = { user: null, mode: 'create', extra: {} };
  readonly formConfig: FormConfig = {
    fields: [
      { type: 'text', name: 'name', label: 'name', width: '1/2', validation: [Rules.required('systemManagement.validation.nameRequired')] },
      {
        type: 'select',
        name: 'crawlerType',
        label: 'systemManagement.field.crawlerType',
        width: '1/2',
        options: [
          { label: 'WEB', value: 'WEB' },
          { label: 'FILE', value: 'FILE' },
          { label: 'ACTION_RESPONSE', value: 'ACTION_RESPONSE' }
        ],
        validation: [Rules.required('systemManagement.validation.crawlerTypeRequired')]
      },
      { type: 'number', name: 'timeoutSeconds', label: 'systemManagement.field.timeoutSeconds', width: '1/2', validation: [Rules.required('systemManagement.validation.timeoutSecondsRequired')] },
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
      {
        type: 'textarea',
        name: 'configJson',
        label: 'systemManagement.field.configJson',
        width: 'full',
        contentType: 'json',
        jsonValidationMessage: 'systemManagement.validation.invalidJson',
        validation: [Rules.required('systemManagement.validation.configJsonRequired')]
      },
      { type: 'textarea', name: 'description', label: 'description', width: 'full' }
    ]
  };

  editId: string | null = null;
  readonly loading = signal(false);
  formInitialValue: AiAgentCrawlerConfigRequest = { ...AI_AGENT_CRAWLER_INITIAL_VALUE };
  readonly formVisible = signal(true);

  constructor(
    private readonly service: AiAgentCrawlerConfigService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly destroyRef: DestroyRef,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly i18nService: I18nService
  ) {}

  ngOnInit(): void {
    this.bindRouteMode();
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

  onSubmitForm(model: AiAgentCrawlerConfigRequest): void {
    const request$ = this.editId ? this.service.update(this.editId, model) : this.service.create(model);
    this.loading.set(true);
    this.loadingService.track(request$).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => {
        this.toastService.info(this.i18nService.t(this.editId ? 'updateSuccess' : 'createSuccess'));
        this.crudPage?.markFormPristine();
        void this.router.navigate([AI_AGENT_CRAWLER_ROUTES.list]);
      },
      error: (err) => {
        const errorMsg = err?.error?.message || err?.message || this.i18nService.t('systemManagement.aiAgentCrawler.toast.saveError');
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
      this.formInitialValue = { ...AI_AGENT_CRAWLER_INITIAL_VALUE };
      this.rerenderForm();
      return;
    }
    this.editId = id;
    this.formContext.mode = 'edit';
    this.loading.set(true);
    this.loadingService.track(this.service.getById(id)).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (detail: AiAgentCrawlerConfigResponse) => {
        this.formInitialValue = { ...detail };
        this.rerenderForm();
      },
      error: (err) => {
        const errorMsg = err?.error?.message || err?.message || this.i18nService.t('systemManagement.aiAgentCrawler.toast.loadDetailError');
        this.toastService.error(errorMsg);
        void this.router.navigate([AI_AGENT_CRAWLER_ROUTES.list]);
      }
    });
  }
}
