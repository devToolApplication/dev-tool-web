import { Component, DestroyRef, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import {
  JobAuthTypeOptionResponse,
  JobConfigFormModel,
  JobConfigResponse,
  JobConfigUpsertDto
} from '../data-access/models/job-scheduler.model';
import { JobSchedulerService } from '../data-access/api/job-scheduler.service';
import { I18nService } from '../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../core/ui-services/toast.service';
import { CrudPageConfig } from '../../../../shared/ui/base-crud-page/base-crud-page.model';
import { FormConfig, FormContext } from '../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../shared/ui/form-input/utils/validation-rules';
import {
  JOB_CONFIG_INITIAL_VALUE,
  JOB_HTTP_METHOD_OPTIONS,
  JOB_SCHEDULER_ROUTES
} from '../job-scheduler.constants';

@Component({
  selector: 'app-job-config-form',
  standalone: false,
  templateUrl: './job-config-form.component.html'
})
export class JobConfigFormComponent implements OnInit {
  readonly formContext: FormContext = {
    user: null,
    mode: 'create',
    extra: {
      authTypeOptions: []
    }
  };
  readonly formConfig: FormConfig = this.createFormConfig();
  readonly loading = signal(false);
  readonly formVisible = signal(true);
  editCode: string | null = null;
  formInitialValue: JobConfigFormModel = this.createInitialValue();

  constructor(
    private readonly service: JobSchedulerService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly i18nService: I18nService,
    private readonly destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    this.loadAuthTypes();
  }

  get pageConfig(): CrudPageConfig {
    return {
      title: this.editCode ? 'jobScheduler.form.editTitle' : 'jobScheduler.form.createTitle',
      description: 'jobScheduler.form.description',
      actions: [
        { id: 'back', label: 'back', icon: 'pi pi-arrow-left', goBack: true },
        { id: 'save', label: this.editCode ? 'update' : 'create', icon: 'pi pi-save', submitForm: true, loading: this.loading() }
      ]
    };
  }

  onSubmitForm(model: JobConfigFormModel): void {
    let payload: JobConfigUpsertDto;
    try {
      payload = this.toPayload(model);
    } catch {
      this.toastService.error('jobScheduler.toast.invalidBodyJson');
      return;
    }

    const request$ = this.editCode
      ? this.service.update(this.editCode, payload)
      : this.service.create(payload);

    this.loading.set(true);
    this.loadingService.track(request$).pipe(
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (saved) => {
        this.toastService.info(this.i18nService.t(this.editCode ? 'updateSuccess' : 'createSuccess'));
        void this.router.navigate([`${JOB_SCHEDULER_ROUTES.list}/edit`, saved.code]);
      },
      error: () => this.toastService.error('jobScheduler.toast.saveFailed')
    });
  }

  private loadAuthTypes(): void {
    this.loading.set(true);
    this.loadingService.track(this.service.getAuthTypes()).pipe(
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.formContext.extra = {
          authTypeOptions: this.toAuthTypeOptions(res.authTypes)
        };
        this.bindRouteMode();
      },
      error: () => {
        this.formContext.extra = {
          authTypeOptions: this.toAuthTypeOptions([])
        };
        this.toastService.error('jobScheduler.toast.loadAuthTypesFailed');
        this.bindRouteMode();
      }
    });
  }

  private bindRouteMode(): void {
    this.applyRouteMode(this.route.snapshot.paramMap.get('code'));
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const code = params.get('code');
      if (code === this.editCode) {
        return;
      }
      this.applyRouteMode(code);
    });
  }

  private applyRouteMode(code: string | null): void {
    if (!code) {
      this.editCode = null;
      this.formContext.mode = 'create';
      this.formInitialValue = this.createInitialValue();
      this.rerenderForm();
      return;
    }

    this.editCode = code;
    this.formContext.mode = 'edit';
    this.loadDetail(code);
  }

  private loadDetail(code: string): void {
    this.loading.set(true);
    this.loadingService.track(this.service.getByCode(code)).pipe(
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (detail) => {
        this.formInitialValue = this.toFormModel(detail);
        this.rerenderForm();
      },
      error: () => {
        this.toastService.error('jobScheduler.toast.loadDetailFailed');
        void this.router.navigate([JOB_SCHEDULER_ROUTES.list]);
      }
    });
  }

  private createFormConfig(): FormConfig {
    return {
      fields: [
        {
          type: 'text',
          name: 'code',
          label: 'code',
          width: '1/3',
          validation: [
            Rules.required('jobScheduler.validation.codeRequired'),
            Rules.pattern('^[a-zA-Z0-9_-]+$', 'jobScheduler.validation.codePattern')
          ],
          rules: { disabled: 'context.mode === "edit"' }
        },
        { type: 'text', name: 'name', label: 'name', width: '1/3', validation: [Rules.required('jobScheduler.validation.nameRequired')] },
        { type: 'checkbox', name: 'enabled', label: 'enabled', width: '1/3' },
        { type: 'text', name: 'cron', label: 'jobScheduler.field.cron', width: '1/3', validation: [Rules.required('jobScheduler.validation.cronRequired')] },
        { type: 'text', name: 'timezone', label: 'jobScheduler.field.timezone', width: '1/3', validation: [Rules.required('jobScheduler.validation.timezoneRequired')] },
        { type: 'number', name: 'retry.maxAttempts', label: 'jobScheduler.field.maxAttempts', width: '1/3', suffix: 'attempts', validation: [Rules.min(1), Rules.max(10)] },
        { type: 'textarea', name: 'description', label: 'description', width: 'full', rows: 3, maxRows: 6 },
        {
          type: 'group',
          name: 'target',
          label: 'jobScheduler.form.target',
          width: 'full',
          children: [
            { type: 'select', name: 'method', label: 'jobScheduler.field.method', width: '1/3', options: JOB_HTTP_METHOD_OPTIONS, validation: [Rules.required('jobScheduler.validation.methodRequired')] },
            { type: 'text', name: 'url', label: 'jobScheduler.field.url', width: '1/3', validation: [Rules.required('jobScheduler.validation.urlRequired')] },
            { type: 'number', name: 'timeoutMs', label: 'jobScheduler.field.timeoutMs', width: '1/3', suffix: 'ms', validation: [Rules.min(1000), Rules.max(300000)] },
            { type: 'record', name: 'headers', label: 'jobScheduler.field.headers', keyLabel: 'jobScheduler.field.headerName', valueLabel: 'jobScheduler.field.headerValue', addButtonLabel: 'addRow', width: 'full' },
            {
              type: 'textarea',
              name: 'body',
              label: 'jobScheduler.field.body',
              width: 'full',
              rows: 8,
              maxRows: 14,
              showZoomButton: true,
              contentType: 'json',
              jsonValidationMessage: 'jobScheduler.validation.bodyJsonInvalid'
            }
          ]
        },
        {
          type: 'group',
          name: 'auth',
          label: 'jobScheduler.form.auth',
          width: 'full',
          children: [
            { type: 'select', name: 'type', label: 'jobScheduler.field.authType', width: '1/2', optionsExpression: 'context.extra?.authTypeOptions || []' },
            { type: 'text', name: 'basic.username', label: 'jobScheduler.field.username', width: '1/2', rules: { visible: 'model.auth?.type === "BASIC"' }, validation: [Rules.required('jobScheduler.validation.usernameRequired')] },
            { type: 'text', name: 'basic.password', label: 'jobScheduler.field.password', width: '1/2', rules: { visible: 'model.auth?.type === "BASIC"' }, validation: [Rules.required('jobScheduler.validation.passwordRequired')] },
            { type: 'text', name: 'apiKey.headerName', label: 'jobScheduler.field.headerName', width: '1/2', rules: { visible: 'model.auth?.type === "API_KEY"' }, validation: [Rules.required('jobScheduler.validation.headerNameRequired')] },
            { type: 'text', name: 'apiKey.value', label: 'jobScheduler.field.apiKeyValue', width: '1/2', rules: { visible: 'model.auth?.type === "API_KEY"' }, validation: [Rules.required('jobScheduler.validation.apiKeyRequired')] },
            { type: 'text', name: 'keycloak.baseUrl', label: 'jobScheduler.field.keycloakBaseUrl', width: '1/2', rules: { visible: 'model.auth?.type === "KEYCLOAK_CLIENT_CREDENTIALS"' }, validation: [Rules.required('jobScheduler.validation.keycloakBaseUrlRequired')] },
            { type: 'text', name: 'keycloak.realm', label: 'jobScheduler.field.realm', width: '1/2', rules: { visible: 'model.auth?.type === "KEYCLOAK_CLIENT_CREDENTIALS"' }, validation: [Rules.required('jobScheduler.validation.realmRequired')] },
            { type: 'text', name: 'keycloak.clientId', label: 'jobScheduler.field.clientId', width: '1/2', rules: { visible: 'model.auth?.type === "KEYCLOAK_CLIENT_CREDENTIALS"' }, validation: [Rules.required('jobScheduler.validation.clientIdRequired')] },
            { type: 'text', name: 'keycloak.clientSecret', label: 'jobScheduler.field.clientSecret', width: '1/2', rules: { visible: 'model.auth?.type === "KEYCLOAK_CLIENT_CREDENTIALS"' }, validation: [Rules.required('jobScheduler.validation.clientSecretRequired')] },
            { type: 'text', name: 'keycloak.scope', label: 'jobScheduler.field.scope', width: '1/2', rules: { visible: 'model.auth?.type === "KEYCLOAK_CLIENT_CREDENTIALS"' } },
            { type: 'text', name: 'keycloak.tokenField', label: 'jobScheduler.field.tokenField', width: '1/2', rules: { visible: 'model.auth?.type === "KEYCLOAK_CLIENT_CREDENTIALS"' }, validation: [Rules.required('jobScheduler.validation.tokenFieldRequired')] },
            { type: 'text', name: 'keycloak.headerName', label: 'jobScheduler.field.headerName', width: '1/2', rules: { visible: 'model.auth?.type === "KEYCLOAK_CLIENT_CREDENTIALS"' }, validation: [Rules.required('jobScheduler.validation.headerNameRequired')] },
            { type: 'text', name: 'keycloak.headerPrefix', label: 'jobScheduler.field.headerPrefix', width: '1/2', rules: { visible: 'model.auth?.type === "KEYCLOAK_CLIENT_CREDENTIALS"' } }
          ]
        }
      ]
    };
  }

  private createInitialValue(): JobConfigFormModel {
    return JSON.parse(JSON.stringify(JOB_CONFIG_INITIAL_VALUE)) as JobConfigFormModel;
  }

  private toFormModel(detail: JobConfigResponse): JobConfigFormModel {
    const initial = this.createInitialValue();
    return {
      ...initial,
      ...detail,
      description: detail.description ?? '',
      target: {
        ...initial.target,
        ...detail.target,
        headers: detail.target.headers ?? {},
        body: this.formatJson(detail.target.body),
        timeoutMs: detail.target.timeoutMs ?? 30000
      },
      auth: {
        ...initial.auth,
        ...detail.auth,
        basic: {
          ...initial.auth.basic,
          ...detail.auth.basic
        },
        apiKey: {
          ...initial.auth.apiKey,
          ...detail.auth.apiKey
        },
        keycloak: {
          ...initial.auth.keycloak,
          ...detail.auth.keycloak
        }
      },
      retry: {
        maxAttempts: detail.retry?.maxAttempts ?? 1
      }
    };
  }

  private toPayload(model: JobConfigFormModel): JobConfigUpsertDto {
    return {
      code: model.code.trim(),
      name: model.name.trim(),
      description: model.description?.trim() ?? '',
      cron: model.cron.trim(),
      timezone: model.timezone.trim(),
      enabled: model.enabled === true,
      target: {
        method: model.target.method,
        url: model.target.url.trim(),
        headers: model.target.headers ?? {},
        body: this.parseJson(model.target.body),
        timeoutMs: model.target.timeoutMs ?? 30000
      },
      auth: this.normalizeAuth(model),
      retry: {
        maxAttempts: model.retry?.maxAttempts ?? 1
      }
    };
  }

  private normalizeAuth(model: JobConfigFormModel) {
    if (model.auth.type === 'BASIC') {
      return {
        type: 'BASIC' as const,
        basic: {
          username: model.auth.basic?.username?.trim() ?? '',
          password: model.auth.basic?.password ?? ''
        }
      };
    }

    if (model.auth.type === 'API_KEY') {
      return {
        type: 'API_KEY' as const,
        apiKey: {
          headerName: model.auth.apiKey?.headerName?.trim() || 'x-api-key',
          value: model.auth.apiKey?.value ?? ''
        }
      };
    }

    if (model.auth.type === 'KEYCLOAK_CLIENT_CREDENTIALS') {
      return {
        type: 'KEYCLOAK_CLIENT_CREDENTIALS' as const,
        keycloak: {
          baseUrl: model.auth.keycloak?.baseUrl?.trim() ?? '',
          realm: model.auth.keycloak?.realm?.trim() ?? '',
          clientId: model.auth.keycloak?.clientId?.trim() ?? '',
          clientSecret: model.auth.keycloak?.clientSecret ?? '',
          scope: model.auth.keycloak?.scope?.trim() ?? '',
          tokenField: model.auth.keycloak?.tokenField?.trim() || 'access_token',
          headerName: model.auth.keycloak?.headerName?.trim() || 'Authorization',
          headerPrefix: model.auth.keycloak?.headerPrefix?.trim() ?? 'Bearer'
        }
      };
    }

    return { type: 'NONE' as const };
  }

  private parseJson(value: string): unknown {
    const raw = String(value ?? '').trim();
    return raw ? JSON.parse(raw) : {};
  }

  private formatJson(value: unknown): string {
    if (value === undefined || value === null || value === '') {
      return '{}';
    }
    return JSON.stringify(value, null, 2);
  }

  private toAuthTypeOptions(items: JobAuthTypeOptionResponse[]) {
    const options = items.length
      ? items
      : [
          { type: 'NONE', label: 'No Auth' },
          { type: 'BASIC', label: 'Basic Auth' },
          { type: 'API_KEY', label: 'API Key' },
          { type: 'KEYCLOAK_CLIENT_CREDENTIALS', label: 'Keycloak Client Credentials' }
        ];
    return options.map((item) => ({ label: item.label, value: item.type }));
  }

  private rerenderForm(): void {
    this.formVisible.set(false);
    window.setTimeout(() => this.formVisible.set(true));
  }
}

