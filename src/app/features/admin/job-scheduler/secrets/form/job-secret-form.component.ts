import { Component, DestroyRef, OnInit, ViewChild, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, Observable } from 'rxjs';
import { SecretCreateDto, SecretResponse, SecretType, SecretUpdateDto } from '../data-access/models/job-secret.model';
import { JobSecretService } from '../data-access/api/job-secret.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { BaseCrudPageComponent } from '../../../../../shared/ui/base-crud-page/base-crud-page.component';
import { CrudPageConfig } from '../../../../../shared/ui/base-crud-page/base-crud-page.model';
import { FormConfig, FormContext } from '../../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../../shared/ui/form-input/utils/validation-rules';
import { JOB_SECRET_KEYCLOAK_INITIAL_VALUE, JOB_SECRET_PLAINTEXT_INITIAL_VALUE, JOB_SECRET_ROUTES } from '../job-secret.constants';

@Component({
  selector: 'app-job-secret-form',
  standalone: false,
  templateUrl: './job-secret-form.component.html'
})
export class JobSecretFormComponent implements OnInit {
  @ViewChild(BaseCrudPageComponent) private readonly crudPage?: BaseCrudPageComponent;

  formContext: FormContext = { user: null, mode: 'create', extra: {} };
  formConfig: FormConfig = this.buildPlaintextFormConfig();
  readonly loading = signal(false);
  readonly formVisible = signal(true);
  editCode: string | null = null;
  secretType: SecretType = 'PLAINTEXT';
  formInitialValue: any = { ...JOB_SECRET_PLAINTEXT_INITIAL_VALUE };

  constructor(
    private readonly service: JobSecretService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly i18nService: I18nService,
    private readonly destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    const code = this.route.snapshot.paramMap.get('code');

    if (code) {
      this.editCode = code;
      this.formContext.mode = 'edit';
      this.loadDetail(code);
    } else {
      this.secretType = 'PLAINTEXT';
      this.formConfig = this.buildPlaintextFormConfig();
      this.formInitialValue = {
        type: 'PLAINTEXT',
        code: '',
        name: '',
        secretValue: '',
        description: ''
      };
    }
  }

  onValueChange(model: any): void {
    if (model && model.type && model.type !== this.secretType && !this.editCode) {
      this.secretType = model.type;
      this.formConfig = this.secretType === 'KEYCLOAK_CLIENT_CREDENTIALS' ? this.buildKeycloakFormConfig() : this.buildPlaintextFormConfig();
      this.formInitialValue = this.secretType === 'KEYCLOAK_CLIENT_CREDENTIALS'
        ? {
            type: 'KEYCLOAK_CLIENT_CREDENTIALS',
            code: model.code ?? '',
            name: model.name ?? '',
            baseUrl: '',
            realm: '',
            clientId: '',
            clientSecret: '',
            scope: 'openid',
            tokenField: 'access_token',
            headerName: 'Authorization',
            headerPrefix: 'Bearer',
            description: model.description ?? ''
          }
        : {
            type: 'PLAINTEXT',
            code: model.code ?? '',
            name: model.name ?? '',
            secretValue: '',
            description: model.description ?? ''
          };
      this.rerenderForm();
    }
  }

  get pageConfig(): CrudPageConfig {
    return {
      title: this.editCode ? 'jobSecret.form.editTitle' : 'jobSecret.form.createTitle',
      description: 'jobSecret.form.description',
      actions: [
        { id: 'back', label: 'back', icon: 'pi pi-arrow-left', goBack: true },
        { id: 'save', label: this.editCode ? 'update' : 'create', icon: 'pi pi-save', submitForm: true, loading: this.loading() }
      ]
    };
  }

  onSubmitForm(model: any): void {
    if (this.editCode) {
      const payload: SecretUpdateDto = {
        name: model.name,
        description: model.description,
        data: this.secretType === 'KEYCLOAK_CLIENT_CREDENTIALS'
          ? { baseUrl: model.baseUrl, realm: model.realm, clientId: model.clientId, clientSecret: model.clientSecret, scope: model.scope, tokenField: model.tokenField, headerName: model.headerName, headerPrefix: model.headerPrefix }
          : { value: model.secretValue }
      };
      this.save(this.service.update(this.editCode, payload));
    } else {
      const payload: SecretCreateDto = {
        code: model.code,
        name: model.name,
        type: this.secretType,
        description: model.description,
        data: this.secretType === 'KEYCLOAK_CLIENT_CREDENTIALS'
          ? { baseUrl: model.baseUrl, realm: model.realm, clientId: model.clientId, clientSecret: model.clientSecret, scope: model.scope, tokenField: model.tokenField, headerName: model.headerName, headerPrefix: model.headerPrefix }
          : { value: model.secretValue }
      };
      this.save(this.service.create(payload));
    }
  }

  hasUnsavedChanges(): boolean {
    return this.crudPage?.hasUnsavedChanges() ?? false;
  }

  confirmDiscardChanges(): Promise<boolean> | boolean {
    return this.crudPage?.confirmDiscardChanges() ?? true;
  }

  private save(request$: Observable<SecretResponse>): void {
    this.loading.set(true);
    this.loadingService.track(request$).pipe(
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (saved: SecretResponse) => {
        this.toastService.info(this.i18nService.t(this.editCode ? 'updateSuccess' : 'createSuccess'));
        this.crudPage?.markFormPristine();
        void this.router.navigate([`${JOB_SECRET_ROUTES.list}/edit`, saved.code]);
      },
      error: () => this.toastService.error('jobSecret.toast.saveFailed')
    });
  }

  private loadDetail(code: string): void {
    this.loading.set(true);
    this.loadingService.track(this.service.getByCode(code)).pipe(
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (detail) => {
        this.secretType = detail.type;
        this.formConfig = detail.type === 'KEYCLOAK_CLIENT_CREDENTIALS' ? this.buildKeycloakFormConfig() : this.buildPlaintextFormConfig();
        this.formInitialValue = this.toFormModel(detail);
        this.rerenderForm();
      },
      error: () => {
        this.toastService.error('jobSecret.toast.loadDetailFailed');
        void this.router.navigate([JOB_SECRET_ROUTES.list]);
      }
    });
  }

  private toFormModel(detail: SecretResponse): any {
    if (detail.type === 'KEYCLOAK_CLIENT_CREDENTIALS') {
      const data = detail.data as any;
      return {
        code: detail.code,
        name: detail.name,
        type: detail.type,
        description: detail.description,
        baseUrl: data.baseUrl ?? '',
        realm: data.realm ?? '',
        clientId: data.clientId ?? '',
        clientSecret: data.clientSecret ?? '',
        scope: data.scope ?? 'openid',
        tokenField: data.tokenField ?? 'access_token',
        headerName: data.headerName ?? 'Authorization',
        headerPrefix: data.headerPrefix ?? 'Bearer'
      };
    }
    return {
      code: detail.code,
      name: detail.name,
      type: detail.type,
      description: detail.description,
      secretValue: (detail.data as any).value ?? ''
    };
  }

  private rerenderForm(): void {
    this.formVisible.set(false);
    setTimeout(() => this.formVisible.set(true));
  }

  private buildPlaintextFormConfig(): FormConfig {
    return {
      fields: [
        {
          type: 'select',
          name: 'type',
          label: 'type',
          width: 'full',
          options: [
            { label: 'jobSecret.tab.plaintext', value: 'PLAINTEXT' },
            { label: 'jobSecret.tab.keycloak', value: 'KEYCLOAK_CLIENT_CREDENTIALS' }
          ],
          disabledWhen: this.editCode ? 'true' : ''
        },
        { type: 'text', name: 'code', label: 'code', width: '1/2', validation: [Rules.required('jobSecret.validation.codeRequired')], disabledWhen: this.editCode ? 'true' : '' },
        { type: 'text', name: 'name', label: 'name', width: '1/2', validation: [Rules.required('jobSecret.validation.nameRequired')] },
        { type: 'textarea', name: 'secretValue', label: 'jobSecret.field.secretValue', width: 'full', showZoomButton: true, validation: [Rules.required('jobSecret.validation.valueRequired')] },
        { type: 'textarea', name: 'description', label: 'description', width: 'full' }
      ]
    };
  }

  private buildKeycloakFormConfig(): FormConfig {
    return {
      fields: [
        {
          type: 'select',
          name: 'type',
          label: 'type',
          width: 'full',
          options: [
            { label: 'jobSecret.tab.plaintext', value: 'PLAINTEXT' },
            { label: 'jobSecret.tab.keycloak', value: 'KEYCLOAK_CLIENT_CREDENTIALS' }
          ],
          disabledWhen: this.editCode ? 'true' : ''
        },
        { type: 'text', name: 'code', label: 'code', width: '1/2', validation: [Rules.required('jobSecret.validation.codeRequired')], disabledWhen: this.editCode ? 'true' : '' },
        { type: 'text', name: 'name', label: 'name', width: '1/2', validation: [Rules.required('jobSecret.validation.nameRequired')] },
        { type: 'text', name: 'baseUrl', label: 'jobSecret.field.baseUrl', width: '1/2', validation: [Rules.required('jobSecret.validation.baseUrlRequired')] },
        { type: 'text', name: 'realm', label: 'jobSecret.field.realm', width: '1/2', validation: [Rules.required('jobSecret.validation.realmRequired')] },
        { type: 'text', name: 'clientId', label: 'jobSecret.field.clientId', width: '1/2', validation: [Rules.required('jobSecret.validation.clientIdRequired')] },
        { type: 'text', name: 'clientSecret', label: 'jobSecret.field.clientSecret', width: '1/2', validation: [Rules.required('jobSecret.validation.clientSecretRequired')] },
        { type: 'text', name: 'scope', label: 'jobSecret.field.scope', width: '1/2' },
        { type: 'text', name: 'tokenField', label: 'jobSecret.field.tokenField', width: '1/2' },
        { type: 'text', name: 'headerName', label: 'jobSecret.field.headerName', width: '1/2' },
        { type: 'text', name: 'headerPrefix', label: 'jobSecret.field.headerPrefix', width: '1/2' },
        { type: 'textarea', name: 'description', label: 'description', width: 'full' }
      ]
    };
  }
}
