import { Component, DestroyRef, OnInit, ViewChild, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AgentAccountRequest, AgentAccountResponse } from '../../../../../core/models/ai-agent/ai-agent-account.model';
import { AiAgentAccountService } from '../../../../../core/services/ai-agent-service/ai-agent-account.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { BaseCrudPageComponent } from '../../../../../shared/ui/base-crud-page/base-crud-page.component';
import { FormConfig, FormContext } from '../../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../../shared/ui/form-input/utils/validation-rules';
import { AI_AGENT_ACCOUNT_INITIAL_VALUE, AI_AGENT_ACCOUNT_ROUTES } from '../ai-agent-account.constants';

@Component({
  selector: 'app-ai-agent-account-form',
  standalone: false,
  templateUrl: './ai-agent-account-form.component.html'
})
export class AiAgentAccountFormComponent implements OnInit {
  @ViewChild(BaseCrudPageComponent) private readonly crudPage?: BaseCrudPageComponent;

  formContext: FormContext = { user: null, mode: 'create', extra: {} };
  readonly formConfig: FormConfig = {
    fields: [
      { type: 'text', name: 'name', label: 'name', width: '1/2', validation: [Rules.required('systemManagement.validation.nameRequired')] },
      {
        type: 'text',
        name: 'code',
        label: 'code',
        width: '1/2',
        validation: [
          Rules.required('systemManagement.validation.codeRequired'),
          Rules.pattern('^[a-z][a-z0-9._-]*$', 'systemManagement.validation.codePattern')
        ]
      },
      {
        type: 'select',
        name: 'provider',
        label: 'provider',
        width: '1/2',
        options: [
          { label: 'Codex', value: 'codex' },
          { label: 'Claude', value: 'claude' },
          { label: 'Antigravity', value: 'antigravity' }
        ],
        validation: [Rules.required('systemManagement.validation.providerRequired')]
      },
      {
        type: 'select',
        name: 'enabled',
        label: 'status',
        width: '1/2',
        options: [
          { label: 'Enabled', value: true },
          { label: 'Disabled', value: false }
        ],
        validation: [Rules.required('statusRequired')]
      },
      {
        type: 'textarea',
        name: 'authJson',
        label: 'systemManagement.field.authJson',
        width: 'full',
        helpText: 'systemManagement.agentAccount.form.authJsonHint',
        disabledWhen: "model.provider === 'codex'"
      }
    ]
  };

  editId: string | null = null;
  readonly loading = signal(false);
  formInitialValue: AgentAccountRequest = { ...AI_AGENT_ACCOUNT_INITIAL_VALUE };
  readonly formVisible = signal(true);

  constructor(
    private readonly service: AiAgentAccountService,
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
      if (id === this.editId) return;
      this.applyRouteMode(id);
    });
  }

  onSubmitForm(model: AgentAccountRequest): void {
    const request$ = this.editId ? this.service.update(this.editId, model) : this.service.create(model);
    this.loading.set(true);
    this.loadingService.track(request$).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => {
        this.toastService.info(this.i18nService.t(this.editId ? 'updateSuccess' : 'createSuccess'));
        this.crudPage?.markFormPristine();
        void this.router.navigate([AI_AGENT_ACCOUNT_ROUTES.list]);
      },
      error: (err) => {
        const errorMsg = err?.error?.message || err?.message || this.i18nService.t('systemManagement.agentAccount.toast.saveError');
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

  private applyRouteMode(id: string | null): void {
    if (!id) {
      this.editId = null;
      this.formContext = { ...this.formContext, mode: 'create' };
      this.formInitialValue = { ...AI_AGENT_ACCOUNT_INITIAL_VALUE };
      return;
    }
    this.editId = id;
    this.formContext = { ...this.formContext, mode: 'edit' };
    this.loading.set(true);
    this.loadingService.track(this.service.getById(id)).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (detail: AgentAccountResponse) => {
        this.formInitialValue = {
          code: detail.code,
          name: detail.name,
          provider: detail.provider,
          enabled: detail.enabled,
          authJson: ''
        };
      },
      error: (err) => {
        const errorMsg = err?.error?.message || err?.message || this.i18nService.t('systemManagement.agentAccount.toast.loadDetailError');
        this.toastService.error(errorMsg);
        void this.router.navigate([AI_AGENT_ACCOUNT_ROUTES.list]);
      }
    });
  }
}
