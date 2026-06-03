import { Component, DestroyRef, OnInit, ViewChild, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { SYSTEM_STATUS_OPTIONS } from '../../../../../../core/constants/system.constants';
import { TradeBotSecretCreateDto, TradeBotSecretResponse, TradeBotSecretUpdateDto } from '../../../../../../core/models/trade-bot/trade-bot-secret.model';
import { TradeBotSecretService } from '../../../../../../core/services/trade-bot-service/trade-bot-secret.service';
import { I18nService } from '../../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../../core/ui-services/toast.service';
import { BaseCrudPageComponent } from '../../../../../../shared/ui/base-crud-page/base-crud-page.component';
import { FormConfig, FormContext } from '../../../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../../../shared/ui/form-input/utils/validation-rules';
import { toUniqueTextOptions } from '../../../../../form-option-utils';
import { TRADE_BOT_SECRET_INITIAL_VALUE, TRADE_BOT_SECRET_ROUTES } from '../trade-bot-secret.constants';

@Component({
  selector: 'app-trade-bot-secret-form',
  standalone: false,
  templateUrl: './trade-bot-secret-form.component.html'
})
export class TradeBotSecretFormComponent implements OnInit {
  @ViewChild(BaseCrudPageComponent) private readonly crudPage?: BaseCrudPageComponent;

  formContext: FormContext = { user: null, mode: 'create', extra: {} };
  formConfig: FormConfig = this.buildFormConfig('PLAIN_TEXT');

  editId: string | null = null;
  readonly loading = signal(false);
  formInitialValue: any = {
    type: 'PLAIN_TEXT',
    category: '',
    name: '',
    code: '',
    secretValue: '',
    description: '',
    status: 'ACTIVE'
  };
  readonly formVisible = signal(true);
  secretType = 'PLAIN_TEXT';

  constructor(
    private readonly service: TradeBotSecretService,
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

  private buildFormConfig(type: string): FormConfig {
    const baseFields: any[] = [
      {
        type: 'select',
        name: 'type',
        label: 'type',
        width: 'full',
        options: [
          { label: 'jobSecret.tab.plaintext', value: 'PLAIN_TEXT' },
          { label: 'systemManagement.secret.type.keycloakClientSecret', value: 'KEYCLOAK_CLIENT_SECRET' }
        ],
        disabledWhen: this.editId ? 'true' : ''
      },
      {
        type: 'auto-complete',
        name: 'category',
        label: 'category',
        width: '1/2',
        optionsExpression: 'context.extra?.categoryOptions || []',
        validation: [Rules.required('systemManagement.validation.categoryRequired')]
      },
      { type: 'text', name: 'name', label: 'name', width: '1/2', validation: [Rules.required('systemManagement.validation.nameRequired')] },
      { type: 'text', name: 'code', label: 'code', width: '1/2', validation: [Rules.required('systemManagement.validation.codeRequired')], disabledWhen: this.editId ? 'true' : '' },
      { type: 'select', name: 'status', label: 'status', width: '1/2', options: [...SYSTEM_STATUS_OPTIONS] }
    ];

    if (type === 'KEYCLOAK_CLIENT_SECRET') {
      return {
        fields: [
          ...baseFields,
          { type: 'text', name: 'keycloakUrl', label: 'jobSecret.field.baseUrl', width: 'full', validation: [Rules.required('jobSecret.validation.baseUrlRequired')] },
          { type: 'text', name: 'clientId', label: 'jobSecret.field.clientId', width: '1/2', validation: [Rules.required('jobSecret.validation.clientIdRequired')] },
          { type: 'text', name: 'clientSecret', label: 'jobSecret.field.clientSecret', width: '1/2', validation: [Rules.required('jobSecret.validation.clientSecretRequired')] },
          { type: 'textarea', name: 'description', label: 'description', width: 'full' }
        ]
      };
    }

    return {
      fields: [
        ...baseFields,
        { type: 'textarea', name: 'secretValue', label: 'systemManagement.field.secretValue', width: 'full', showZoomButton: true, validation: [Rules.required('systemManagement.validation.secretValueRequired')] },
        { type: 'textarea', name: 'description', label: 'description', width: 'full' }
      ]
    };
  }

  private loadOptions(): void {
    this.loading.set(true);
    this.loadingService.track(
      this.service.getAll().pipe(
        catchError(() => {
          this.toastService.error(this.i18nService.t('systemManagement.tradeBotSecret.toast.loadCategoriesError') || 'Failed to load category options');
          return of([] as TradeBotSecretResponse[]);
        })
      )
    ).pipe(finalize(() => this.loading.set(false))).subscribe((secrets) => {
      this.formContext.extra = {
        categoryOptions: toUniqueTextOptions(secrets, (item) => item.category)
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

  onSubmitForm(model: any): void {
    const payload: any = {
      category: model.category,
      name: model.name,
      code: model.code,
      status: model.status,
      description: model.description,
      type: this.secretType,
      secretValue: this.secretType === 'KEYCLOAK_CLIENT_SECRET'
        ? JSON.stringify({ url: model.keycloakUrl, clientId: model.clientId, secret: model.clientSecret })
        : model.secretValue
    };

    const request$ = this.editId
      ? this.service.update(this.editId, payload as TradeBotSecretUpdateDto)
      : this.service.create(payload as TradeBotSecretCreateDto);

    this.loading.set(true);
    this.loadingService.track(request$).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => {
        this.toastService.info(this.i18nService.t(this.editId ? 'updateSuccess' : 'createSuccess'));
        this.crudPage?.markFormPristine();
        void this.router.navigate([TRADE_BOT_SECRET_ROUTES.list]);
      },
      error: (err) => {
        const errorMsg = err?.error?.message || err?.message || this.i18nService.t('systemManagement.tradeBotSecret.toast.saveError');
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

  onValueChange(model: any): void {
    if (model && model.type && model.type !== this.secretType && !this.editId) {
      this.secretType = model.type;
      this.formConfig = this.buildFormConfig(model.type);
      this.formInitialValue = {
        ...model,
        keycloakUrl: '',
        clientId: '',
        clientSecret: '',
        secretValue: ''
      };
      this.rerenderForm();
    }
  }

  private rerenderForm(): void {
    this.formVisible.set(false);
    setTimeout(() => this.formVisible.set(true));
  }

  private applyRouteMode(id: string | null): void {
    if (!id) {
      this.editId = null;
      this.formContext.mode = 'create';
      this.secretType = 'PLAIN_TEXT';
      this.formConfig = this.buildFormConfig('PLAIN_TEXT');
      this.formInitialValue = {
        type: 'PLAIN_TEXT',
        category: '',
        name: '',
        code: '',
        secretValue: '',
        description: '',
        status: 'ACTIVE'
      };
      this.rerenderForm();
      return;
    }

    this.editId = id;
    this.formContext.mode = 'edit';
    this.loading.set(true);
    this.loadingService.track(this.service.getById(id)).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (detail: TradeBotSecretResponse) => {
        const type = detail.type || 'PLAIN_TEXT';
        this.secretType = type;
        this.formConfig = this.buildFormConfig(type);

        let keycloakUrl = '';
        let clientId = '';
        let clientSecret = '';
        let secretValue = detail.secretValue;

        if (type === 'KEYCLOAK_CLIENT_SECRET' && detail.secretValue) {
          try {
            const parsed = JSON.parse(detail.secretValue);
            keycloakUrl = parsed.url ?? '';
            clientId = parsed.clientId ?? '';
            clientSecret = parsed.secret ?? '';
          } catch {
            secretValue = detail.secretValue;
          }
        }

        this.formInitialValue = {
          ...detail,
          type,
          keycloakUrl,
          clientId,
          clientSecret,
          secretValue
        };
        this.rerenderForm();
      },
      error: (err) => {
        const errorMsg = err?.error?.message || err?.message || this.i18nService.t('systemManagement.tradeBotSecret.toast.loadDetailError');
        this.toastService.error(errorMsg);
        void this.router.navigate([TRADE_BOT_SECRET_ROUTES.list]);
      }
    });
  }
}
