import { Component, DestroyRef, OnInit, ViewChild, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import {
  JobConfigPageResponse,
  JobAuthTypeOptionResponse,
  JobConfigFormModel,
  JobConfigResponse,
  JobConfigUpsertDto
} from '../data-access/models/job-scheduler.model';
import { JobSchedulerService } from '../data-access/api/job-scheduler.service';
import { JobSecretService } from '../secrets/data-access/api/job-secret.service';
import { I18nService } from '../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../core/ui-services/toast.service';
import { BaseCrudPageComponent } from '../../../../shared/ui/base-crud-page/base-crud-page.component';
import { CrudPageConfig } from '../../../../shared/ui/base-crud-page/base-crud-page.model';
import { FormConfig, FormContext } from '../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../shared/ui/form-input/utils/validation-rules';
import {
  JOB_CONFIG_INITIAL_VALUE,
  JOB_CONCURRENCY_POLICY_OPTIONS,
  JOB_HTTP_METHOD_OPTIONS,
  JOB_SCHEDULER_ROUTES
} from '../job-scheduler.constants';
import { toUniqueTextOptions } from '../../../form-option-utils';

const JOB_CRON_PRESET_VALUES = [
  '*/5 * * * *',
  '*/15 * * * *',
  '0 * * * *',
  '0 0 * * *',
  '0 0 * * 0',
  '0 0 1 * *'
];

const JOB_API_KEY_HEADER_NAME_VALUES = [
  'x-api-key',
  'X-API-Key',
  'Authorization'
];

const JOB_KEYCLOAK_SCOPE_VALUES = [
  'openid',
  'profile',
  'email'
];

const JOB_KEYCLOAK_TOKEN_FIELD_VALUES = [
  'access_token',
  'token'
];

const JOB_KEYCLOAK_HEADER_PREFIX_VALUES = [
  'Bearer'
];

@Component({
  selector: 'app-job-config-form',
  standalone: false,
  templateUrl: './job-config-form.component.html'
})
export class JobConfigFormComponent implements OnInit {
  @ViewChild(BaseCrudPageComponent) private readonly crudPage?: BaseCrudPageComponent;

  formContext: FormContext = {
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
    private readonly jobSecretService: JobSecretService,
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
        this.crudPage?.markFormPristine();
        void this.router.navigate([`${JOB_SCHEDULER_ROUTES.list}/edit`, saved.code]);
      },
      error: () => this.toastService.error('jobScheduler.toast.saveFailed')
    });
  }

  hasUnsavedChanges(): boolean {
    return this.crudPage?.hasUnsavedChanges() ?? false;
  }

  confirmDiscardChanges(): Promise<boolean> | boolean {
    return this.crudPage?.confirmDiscardChanges() ?? true;
  }

  private loadAuthTypes(): void {
    this.loading.set(true);
    const authTypes$ = this.service.getAuthTypes().pipe(
      catchError(() => {
        this.toastService.error('jobScheduler.toast.loadAuthTypesFailed');
        return of({ authTypes: [] });
      })
    );
    const existingJobs$ = this.service.getPage(0, 500, {}, ['code,asc']).pipe(
      catchError(() => of({ data: [] } as JobConfigPageResponse))
    );
    const secrets$ = this.jobSecretService.getOptions().pipe(
      catchError(() => of({ options: [] }))
    );

    this.loadingService.track(forkJoin({ authTypes: authTypes$, existingJobs: existingJobs$, secrets: secrets$ })).pipe(
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: ({ authTypes, existingJobs, secrets }) => {
        this.formContext.extra = this.toFormOptions(authTypes.authTypes, existingJobs.data, secrets.options);
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
        this.formContext.extra = {
          ...this.formContext.extra,
          cronSecondOptions: this.toSelectOptions(this.formInitialValue.cronSecond, this.formContext.extra?.cronSecondOptions || []),
          cronMinuteOptions: this.toSelectOptions(this.formInitialValue.cronMinute, this.formContext.extra?.cronMinuteOptions || []),
          cronHourOptions: this.toSelectOptions(this.formInitialValue.cronHour, this.formContext.extra?.cronHourOptions || []),
          cronDayOfMonthOptions: this.toSelectOptions(this.formInitialValue.cronDayOfMonth, this.formContext.extra?.cronDayOfMonthOptions || []),
          cronMonthOptions: this.toSelectOptions(this.formInitialValue.cronMonth, this.formContext.extra?.cronMonthOptions || []),
          cronDayOfWeekOptions: this.toSelectOptions(this.formInitialValue.cronDayOfWeek, this.formContext.extra?.cronDayOfWeekOptions || [])
        };
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
        {
          type: 'select',
          name: 'concurrencyPolicy',
          label: 'jobScheduler.field.concurrencyPolicy',
          width: '1/3',
          optionsExpression: 'context.extra?.concurrencyPolicyOptions || []',
          validation: [Rules.required('jobScheduler.validation.concurrencyPolicyRequired')]
        },
        {
          type: 'number',
          name: 'maxRunningInstances',
          label: 'jobScheduler.field.maxRunningInstances',
          width: '1/3',
          validation: [Rules.required('jobScheduler.validation.maxRunningInstancesRequired')]
        },
        
        // Visual Cron selections
        {
          type: 'select',
          name: 'cronSecond',
          label: 'jobScheduler.cron.second',
          width: '1/6',
          optionsExpression: 'context.extra?.cronSecondOptions || []',
          validation: [Rules.required('jobScheduler.validation.secondRequired')]
        },
        {
          type: 'select',
          name: 'cronMinute',
          label: 'jobScheduler.cron.minute',
          width: '1/6',
          optionsExpression: 'context.extra?.cronMinuteOptions || []',
          validation: [Rules.required('jobScheduler.validation.minuteRequired')]
        },
        {
          type: 'select',
          name: 'cronHour',
          label: 'jobScheduler.cron.hour',
          width: '1/6',
          optionsExpression: 'context.extra?.cronHourOptions || []',
          validation: [Rules.required('jobScheduler.validation.hourRequired')]
        },
        {
          type: 'select',
          name: 'cronDayOfMonth',
          label: 'jobScheduler.cron.dayOfMonth',
          width: '1/6',
          optionsExpression: 'context.extra?.cronDayOfMonthOptions || []',
          validation: [Rules.required('jobScheduler.validation.dayOfMonthRequired')]
        },
        {
          type: 'select',
          name: 'cronMonth',
          label: 'jobScheduler.cron.month',
          width: '1/6',
          optionsExpression: 'context.extra?.cronMonthOptions || []',
          validation: [Rules.required('jobScheduler.validation.monthRequired')]
        },
        {
          type: 'select',
          name: 'cronDayOfWeek',
          label: 'jobScheduler.cron.dayOfWeek',
          width: '1/6',
          optionsExpression: 'context.extra?.cronDayOfWeekOptions || []',
          validation: [Rules.required('jobScheduler.validation.dayOfWeekRequired')]
        },

        {
          type: 'auto-complete',
          name: 'timezone',
          label: 'jobScheduler.field.timezone',
          width: '1/2',
          optionsExpression: 'context.extra?.timezoneOptions || []',
          validation: [Rules.required('jobScheduler.validation.timezoneRequired')]
        },
        { type: 'number', name: 'retry.maxAttempts', label: 'jobScheduler.field.maxAttempts', width: '1/2', suffix: 'attempts', validation: [Rules.min(1), Rules.max(10)] },
        { type: 'textarea', name: 'description', label: 'description', width: 'full', rows: 3, maxRows: 6 },
        {
          type: 'group',
          name: 'target',
          label: 'jobScheduler.form.target',
          width: 'full',
          children: [
            { type: 'select', name: 'method', label: 'jobScheduler.field.method', width: '1/3', options: JOB_HTTP_METHOD_OPTIONS, validation: [Rules.required('jobScheduler.validation.methodRequired')] },
            {
              type: 'auto-complete',
              name: 'url',
              label: 'jobScheduler.field.url',
              width: '1/3',
              optionsExpression: 'context.extra?.urlOptions || []',
              validation: [Rules.required('jobScheduler.validation.urlRequired')]
            },
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
            { type: 'select', name: 'type', label: 'jobScheduler.field.authType', width: 'full', optionsExpression: 'context.extra?.authTypeOptions || []' },
            {
              type: 'select',
              name: 'secretCode',
              label: 'jobSecret.field.secretRef',
              width: 'full',
              optionsExpression: 'context.extra?.secretRefOptions || []',
              rules: { visible: 'model.auth?.type === "SECRET_REF"' },
              validation: [Rules.required('jobScheduler.validation.secretRequired')]
            },
            {
              type: 'auto-complete',
              name: 'basic.username',
              label: 'jobScheduler.field.username',
              width: '1/2',
              optionsExpression: 'context.extra?.basicUsernameOptions || []',
              rules: { visible: 'model.auth?.type === "BASIC"' },
              validation: [Rules.required('jobScheduler.validation.usernameRequired')]
            },
            { type: 'text', name: 'basic.password', label: 'jobScheduler.field.password', width: '1/2', rules: { visible: 'model.auth?.type === "BASIC"' }, validation: [Rules.required('jobScheduler.validation.passwordRequired')] },
            {
              type: 'auto-complete',
              name: 'apiKey.headerName',
              label: 'jobScheduler.field.headerName',
              width: '1/2',
              optionsExpression: 'context.extra?.apiKeyHeaderNameOptions || []',
              rules: { visible: 'model.auth?.type === "API_KEY"' },
              validation: [Rules.required('jobScheduler.validation.headerNameRequired')]
            },
            { type: 'text', name: 'apiKey.value', label: 'jobScheduler.field.apiKeyValue', width: '1/2', rules: { visible: 'model.auth?.type === "API_KEY"' }, validation: [Rules.required('jobScheduler.validation.apiKeyRequired')] },
            {
              type: 'auto-complete',
              name: 'keycloak.baseUrl',
              label: 'jobScheduler.field.keycloakBaseUrl',
              width: '1/2',
              optionsExpression: 'context.extra?.keycloakBaseUrlOptions || []',
              rules: { visible: 'model.auth?.type === "KEYCLOAK_CLIENT_CREDENTIALS"' },
              validation: [Rules.required('jobScheduler.validation.keycloakBaseUrlRequired')]
            },
            {
              type: 'auto-complete',
              name: 'keycloak.realm',
              label: 'jobScheduler.field.realm',
              width: '1/2',
              optionsExpression: 'context.extra?.keycloakRealmOptions || []',
              rules: { visible: 'model.auth?.type === "KEYCLOAK_CLIENT_CREDENTIALS"' },
              validation: [Rules.required('jobScheduler.validation.realmRequired')]
            },
            {
              type: 'auto-complete',
              name: 'keycloak.clientId',
              label: 'jobScheduler.field.clientId',
              width: '1/2',
              optionsExpression: 'context.extra?.keycloakClientIdOptions || []',
              rules: { visible: 'model.auth?.type === "KEYCLOAK_CLIENT_CREDENTIALS"' },
              validation: [Rules.required('jobScheduler.validation.clientIdRequired')]
            },
            { type: 'text', name: 'keycloak.clientSecret', label: 'jobScheduler.field.clientSecret', width: '1/2', rules: { visible: 'model.auth?.type === "KEYCLOAK_CLIENT_CREDENTIALS"' }, validation: [Rules.required('jobScheduler.validation.clientSecretRequired')] },
            {
              type: 'auto-complete',
              name: 'keycloak.scope',
              label: 'jobScheduler.field.scope',
              width: '1/2',
              optionsExpression: 'context.extra?.keycloakScopeOptions || []',
              rules: { visible: 'model.auth?.type === "KEYCLOAK_CLIENT_CREDENTIALS"' }
            },
            {
              type: 'auto-complete',
              name: 'keycloak.tokenField',
              label: 'jobScheduler.field.tokenField',
              width: '1/2',
              optionsExpression: 'context.extra?.keycloakTokenFieldOptions || []',
              rules: { visible: 'model.auth?.type === "KEYCLOAK_CLIENT_CREDENTIALS"' },
              validation: [Rules.required('jobScheduler.validation.tokenFieldRequired')]
            },
            {
              type: 'auto-complete',
              name: 'keycloak.headerName',
              label: 'jobScheduler.field.headerName',
              width: '1/2',
              optionsExpression: 'context.extra?.keycloakHeaderNameOptions || []',
              rules: { visible: 'model.auth?.type === "KEYCLOAK_CLIENT_CREDENTIALS"' },
              validation: [Rules.required('jobScheduler.validation.headerNameRequired')]
            },
            {
              type: 'auto-complete',
              name: 'keycloak.headerPrefix',
              label: 'jobScheduler.field.headerPrefix',
              width: '1/2',
              optionsExpression: 'context.extra?.keycloakHeaderPrefixOptions || []',
              rules: { visible: 'model.auth?.type === "KEYCLOAK_CLIENT_CREDENTIALS"' }
            }
          ]
        }
      ]
    };
  }

  private createInitialValue(): JobConfigFormModel {
    const initial = JSON.parse(JSON.stringify(JOB_CONFIG_INITIAL_VALUE)) as JobConfigFormModel;
    return {
      ...initial,
      cronSecond: '*',
      cronMinute: '*',
      cronHour: '*',
      cronDayOfMonth: '*',
      cronMonth: '*',
      cronDayOfWeek: '*'
    } as any;
  }

  private toFormModel(detail: JobConfigResponse): JobConfigFormModel {
    const initial = this.createInitialValue();

    const cronParts = (detail.cron || '').trim().split(/\s+/);
    let cronSecond = '*';
    let cronMinute = '*';
    let cronHour = '*';
    let cronDayOfMonth = '*';
    let cronMonth = '*';
    let cronDayOfWeek = '*';

    if (cronParts.length === 6) {
      cronSecond = cronParts[0];
      cronMinute = cronParts[1];
      cronHour = cronParts[2];
      cronDayOfMonth = cronParts[3];
      cronMonth = cronParts[4];
      cronDayOfWeek = cronParts[5];
    } else if (cronParts.length === 5) {
      cronSecond = '0';
      cronMinute = cronParts[0];
      cronHour = cronParts[1];
      cronDayOfMonth = cronParts[2];
      cronMonth = cronParts[3];
      cronDayOfWeek = cronParts[4];
    }

    return {
      ...initial,
      ...detail,
      cronSecond,
      cronMinute,
      cronHour,
      cronDayOfMonth,
      cronMonth,
      cronDayOfWeek,
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
        },
        secretCode: detail.auth.type === 'SECRET_REF' ? (detail.auth as any).secretCode : ''
      },
      retry: {
        maxAttempts: detail.retry?.maxAttempts ?? 1
      }
    };
  }

  private toPayload(model: JobConfigFormModel): JobConfigUpsertDto {
    const cronParts = [
      model.cronSecond || '*',
      model.cronMinute || '*',
      model.cronHour || '*',
      model.cronDayOfMonth || '*',
      model.cronMonth || '*',
      model.cronDayOfWeek || '*'
    ];
    const compiledCron = cronParts.join(' ').trim();

    return {
      code: model.code.trim(),
      name: model.name.trim(),
      description: model.description?.trim() ?? '',
      cron: compiledCron,
      timezone: model.timezone.trim(),
      enabled: model.enabled === true,
      concurrencyPolicy: model.concurrencyPolicy ?? 'ALLOW',
      maxRunningInstances: model.maxRunningInstances ? Number(model.maxRunningInstances) : 1,
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

    if (model.auth.type === 'SECRET_REF') {
      return {
        type: 'SECRET_REF' as const,
        secretCode: (model.auth as any).secretCode ?? ''
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
    const options: any[] = items.length
      ? [...items]
      : [
          { type: 'NONE', label: 'jobScheduler.auth.none', fields: [] },
          { type: 'BASIC', label: 'jobScheduler.auth.basic', fields: [] },
          { type: 'API_KEY', label: 'jobScheduler.auth.apiKey', fields: [] },
          { type: 'KEYCLOAK_CLIENT_CREDENTIALS', label: 'jobScheduler.auth.keycloakClientCredentials', fields: [] },
          { type: 'SECRET_REF', label: 'jobScheduler.auth.secretRef', fields: [] }
        ];
    
    if (items.length && !options.some((item) => item.type === 'SECRET_REF')) {
      options.push({ type: 'SECRET_REF', label: 'jobScheduler.auth.secretRef', fields: [] });
    }
    
    return options.map((item) => ({ label: item.label, value: item.type }));
  }

  private toSelectOptions(value: string | undefined, presets: { label: string, value: string }[]): { label: string, value: string }[] {
    const list = [...presets];
    if (value && !list.some((item) => item.value === value)) {
      list.push({ label: value, value });
    }
    return list;
  }

  private toFormOptions(authTypes: JobAuthTypeOptionResponse[], jobs: JobConfigResponse[], secrets: any[] = []) {
    const initial = this.formInitialValue || {};
    
    const secondPresets = [
      { label: 'jobScheduler.cron.everySecond', value: '*' },
      { label: '0', value: '0' },
      { label: '*/5', value: '*/5' },
      { label: '*/10', value: '*/10' },
      { label: '*/15', value: '*/15' },
      { label: '*/30', value: '*/30' }
    ];
    const minutePresets = [
      { label: 'jobScheduler.cron.everyMinute', value: '*' },
      { label: '0', value: '0' },
      { label: '*/5', value: '*/5' },
      { label: '*/10', value: '*/10' },
      { label: '*/15', value: '*/15' },
      { label: '*/30', value: '*/30' }
    ];
    const hourPresets = [
      { label: 'jobScheduler.cron.everyHour', value: '*' },
      { label: '0', value: '0' },
      { label: '12', value: '12' },
      { label: '*/2', value: '*/2' },
      { label: '*/4', value: '*/4' },
      { label: '*/6', value: '*/6' },
      { label: '*/12', value: '*/12' }
    ];
    const dayPresets = [
      { label: 'jobScheduler.cron.everyDay', value: '*' },
      { label: '1', value: '1' },
      { label: '15', value: '15' }
    ];
    const monthPresets = [
      { label: 'jobScheduler.cron.everyMonth', value: '*' },
      { label: '1', value: '1' },
      { label: '6', value: '6' },
      { label: '12', value: '12' }
    ];
    const dayOfWeekPresets = [
      { label: 'jobScheduler.cron.everyDayOfWeek', value: '*' },
      { label: 'jobScheduler.cron.sunday', value: '0' },
      { label: 'jobScheduler.cron.monday', value: '1' },
      { label: 'jobScheduler.cron.tuesday', value: '2' },
      { label: 'jobScheduler.cron.wednesday', value: '3' },
      { label: 'jobScheduler.cron.thursday', value: '4' },
      { label: 'jobScheduler.cron.friday', value: '5' },
      { label: 'jobScheduler.cron.saturday', value: '6' }
    ];

    return {
      concurrencyPolicyOptions: JOB_CONCURRENCY_POLICY_OPTIONS,
      authTypeOptions: this.toAuthTypeOptions(authTypes),
      timezoneOptions: this.toTimezoneOptions(),
      cronOptions: this.toTextOptions([...JOB_CRON_PRESET_VALUES, ...jobs.map((job) => job.cron)]),
      urlOptions: this.toTextOptions(jobs.map((job) => job.target?.url)),
      basicUsernameOptions: this.toTextOptions(jobs.map((job) => job.auth?.basic?.username)),
      apiKeyHeaderNameOptions: this.toTextOptions([
        ...JOB_API_KEY_HEADER_NAME_VALUES,
        ...jobs.map((job) => job.auth?.apiKey?.headerName)
      ]),
      keycloakBaseUrlOptions: this.toTextOptions(jobs.map((job) => job.auth?.keycloak?.baseUrl)),
      keycloakRealmOptions: this.toTextOptions(jobs.map((job) => job.auth?.keycloak?.realm)),
      keycloakClientIdOptions: this.toTextOptions(jobs.map((job) => job.auth?.keycloak?.clientId)),
      keycloakScopeOptions: this.toTextOptions([
        ...JOB_KEYCLOAK_SCOPE_VALUES,
        ...jobs.map((job) => job.auth?.keycloak?.scope)
      ]),
      keycloakTokenFieldOptions: this.toTextOptions([
        ...JOB_KEYCLOAK_TOKEN_FIELD_VALUES,
        ...jobs.map((job) => job.auth?.keycloak?.tokenField)
      ]),
      keycloakHeaderNameOptions: this.toTextOptions([
        'Authorization',
        ...jobs.map((job) => job.auth?.keycloak?.headerName)
      ]),
      keycloakHeaderPrefixOptions: this.toTextOptions([
        ...JOB_KEYCLOAK_HEADER_PREFIX_VALUES,
        ...jobs.map((job) => job.auth?.keycloak?.headerPrefix)
      ]),
      secretRefOptions: secrets.map((s) => ({ label: `${s.name} (${s.code})`, value: s.code })),
      cronSecondOptions: this.toSelectOptions(initial.cronSecond, secondPresets),
      cronMinuteOptions: this.toSelectOptions(initial.cronMinute, minutePresets),
      cronHourOptions: this.toSelectOptions(initial.cronHour, hourPresets),
      cronDayOfMonthOptions: this.toSelectOptions(initial.cronDayOfMonth, dayPresets),
      cronMonthOptions: this.toSelectOptions(initial.cronMonth, monthPresets),
      cronDayOfWeekOptions: this.toSelectOptions(initial.cronDayOfWeek, dayOfWeekPresets)
    };
  }

  private toTextOptions(values: readonly unknown[]) {
    return toUniqueTextOptions(values, (value) => value);
  }

  private toTimezoneOptions() {
    const supportedValuesOf = (Intl as unknown as { supportedValuesOf?: (key: 'timeZone') => string[] }).supportedValuesOf;
    const values = supportedValuesOf?.('timeZone') ?? [
      'UTC',
      'Asia/Bangkok',
      'Asia/Singapore',
      'Asia/Tokyo',
      'Europe/London',
      'America/New_York'
    ];

    return values.map((value) => ({ label: value, value }));
  }

  private rerenderForm(): void {
    this.formContext = { ...this.formContext, extra: { ...(this.formContext.extra ?? {}) } };
  }
}
