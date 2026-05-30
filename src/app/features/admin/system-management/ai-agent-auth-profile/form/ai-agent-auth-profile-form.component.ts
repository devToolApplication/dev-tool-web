import { Component, DestroyRef, OnInit, ViewChild, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { AiAgentAuthProfileRequest, AiAgentAuthProfileResponse } from '../../../../../core/models/ai-agent/ai-agent-auth-profile.model';
import { AiAgentAuthProfileService } from '../../../../../core/services/ai-agent-service/ai-agent-auth-profile.service';
import { AiAgentSecretService } from '../../../../../core/services/ai-agent-service/ai-agent-secret.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { BaseCrudPageComponent } from '../../../../../shared/ui/base-crud-page/base-crud-page.component';
import { FormConfig, FormContext } from '../../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../../shared/ui/form-input/utils/validation-rules';
import { AI_AGENT_AUTH_PROFILE_INITIAL_VALUE, AI_AGENT_AUTH_PROFILE_ROUTES } from '../ai-agent-auth-profile.constants';

@Component({
  selector: 'app-ai-agent-auth-profile-form',
  standalone: false,
  templateUrl: './ai-agent-auth-profile-form.component.html'
})
export class AiAgentAuthProfileFormComponent implements OnInit {
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
          Rules.pattern('^[a-z][a-z0-9-]*$', 'systemManagement.validation.codePattern')
        ]
      },
      {
        type: 'select',
        name: 'providerCode',
        label: 'systemManagement.field.providerCode',
        width: '1/2',
        options: [
          { label: 'CODEX', value: 'CODEX' },
          { label: 'CLAUDE', value: 'CLAUDE' },
          { label: 'ANTIGRAVITY', value: 'ANTIGRAVITY' }
        ],
        validation: [Rules.required('systemManagement.validation.providerCodeRequired')]
      },
      {
        type: 'select',
        name: 'authMethod',
        label: 'systemManagement.field.authMethod',
        width: '1/2',
        options: [
          { label: 'API_KEY', value: 'API_KEY' },
          { label: 'OAUTH_TOKEN', value: 'OAUTH_TOKEN' },
          { label: 'SESSION_CREDENTIALS', value: 'SESSION_CREDENTIALS' }
        ],
        validation: [Rules.required('systemManagement.validation.authMethodRequired')]
      },
      { type: 'text', name: 'tokenEndpoint', label: 'systemManagement.field.tokenEndpoint', width: '1/2' },
      {
        type: 'select',
        name: 'secretReferenceId',
        label: 'systemManagement.field.secretReferenceName',
        width: '1/2',
        optionsExpression: 'context.extra?.secretOptions || []'
      },
      {
        type: 'select',
        name: 'scopeType',
        label: 'systemManagement.field.scopeType',
        width: '1/2',
        options: [
          { label: 'GLOBAL', value: 'GLOBAL' },
          { label: 'AGENT', value: 'AGENT' },
          { label: 'USER', value: 'USER' }
        ]
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
      { type: 'textarea', name: 'description', label: 'description', width: 'full' }
    ]
  };

  editId: string | null = null;
  readonly loading = signal(false);
  formInitialValue: AiAgentAuthProfileRequest = { ...AI_AGENT_AUTH_PROFILE_INITIAL_VALUE };
  readonly formVisible = signal(true);

  constructor(
    private readonly service: AiAgentAuthProfileService,
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
        catchError(() => {
          this.toastService.error(this.i18nService.t('systemManagement.aiAgentAuthProfile.toast.loadSecretsError'));
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

  onSubmitForm(model: AiAgentAuthProfileRequest): void {
    const request$ = this.editId ? this.service.update(this.editId, model) : this.service.create(model);
    this.loading.set(true);
    this.loadingService.track(request$).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => {
        this.toastService.info(this.i18nService.t(this.editId ? 'updateSuccess' : 'createSuccess'));
        this.crudPage?.markFormPristine();
        void this.router.navigate([AI_AGENT_AUTH_PROFILE_ROUTES.list]);
      },
      error: (err) => {
        const errorMsg = err?.error?.message || err?.message || this.i18nService.t('systemManagement.aiAgentAuthProfile.toast.saveError');
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
      this.formInitialValue = { ...AI_AGENT_AUTH_PROFILE_INITIAL_VALUE };
      this.rerenderForm();
      return;
    }
    this.editId = id;
    this.formContext.mode = 'edit';
    this.loading.set(true);
    this.loadingService.track(this.service.getById(id)).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (detail: AiAgentAuthProfileResponse) => {
        this.formInitialValue = { ...detail } as any;
        this.rerenderForm();
      },
      error: (err) => {
        const errorMsg = err?.error?.message || err?.message || this.i18nService.t('systemManagement.aiAgentAuthProfile.toast.loadDetailError');
        this.toastService.error(errorMsg);
        void this.router.navigate([AI_AGENT_AUTH_PROFILE_ROUTES.list]);
      }
    });
  }
}
