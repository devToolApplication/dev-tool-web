import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { SYSTEM_STATUS_OPTIONS } from '../../../../../../core/constants/system.constants';
import { TradeBotSecretCreateDto, TradeBotSecretResponse, TradeBotSecretUpdateDto } from '../../../../../../core/models/trade-bot/trade-bot-secret.model';
import { TradeBotSecretService } from '../../../../../../core/services/trade-bot-service/trade-bot-secret.service';
import { I18nService } from '../../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../../core/ui-services/toast.service';
import { FormConfig, FormContext } from '../../../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../../../shared/ui/form-input/utils/validation-rules';
import { TRADE_BOT_SECRET_INITIAL_VALUE, TRADE_BOT_SECRET_ROUTES } from '../trade-bot-secret.constants';

@Component({
  selector: 'app-trade-bot-secret-form',
  standalone: false,
  templateUrl: './trade-bot-secret-form.component.html'
})
export class TradeBotSecretFormComponent implements OnInit {
  readonly formContext: FormContext = { user: null, mode: 'create' };
  readonly formConfig: FormConfig = {
    fields: [
      { type: 'text', name: 'category', label: 'category', width: '1/2', validation: [Rules.required('systemManagement.validation.categoryRequired')] },
      { type: 'text', name: 'name', label: 'name', width: '1/2', validation: [Rules.required('systemManagement.validation.nameRequired')] },
      { type: 'text', name: 'code', label: 'code', width: '1/2', validation: [Rules.required('systemManagement.validation.codeRequired')] },
      { type: 'select', name: 'status', label: 'status', width: '1/2', options: [...SYSTEM_STATUS_OPTIONS] },
      { type: 'textarea', name: 'secretValue', label: 'systemManagement.field.secretValue', width: 'full', showZoomButton: true, validation: [Rules.required('systemManagement.validation.secretValueRequired')] },
      { type: 'textarea', name: 'description', label: 'description', width: 'full' }
    ]
  };

  editId: string | null = null;
  loading = false;
  formInitialValue: TradeBotSecretCreateDto = { ...TRADE_BOT_SECRET_INITIAL_VALUE };
  readonly formVisible = signal(true);

  constructor(
    private readonly service: TradeBotSecretService,
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

  onSubmitForm(model: TradeBotSecretCreateDto): void {
    const request$ = this.editId ? this.service.update(this.editId, model as TradeBotSecretUpdateDto) : this.service.create(model);
    this.loading = true;
    this.loadingService.track(request$).pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => {
        this.toastService.info(this.i18nService.t(this.editId ? 'updateSuccess' : 'createSuccess'));
        void this.router.navigate([TRADE_BOT_SECRET_ROUTES.list]);
      },
      error: () => this.toastService.error(this.i18nService.t('systemManagement.tradeBotSecret.toast.saveError'))
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
      this.formInitialValue = { ...TRADE_BOT_SECRET_INITIAL_VALUE };
      this.rerenderForm();
      return;
    }
    this.editId = id;
    this.formContext.mode = 'edit';
    this.loading = true;
    this.loadingService.track(this.service.getById(id)).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (detail: TradeBotSecretResponse) => {
        this.formInitialValue = { ...detail };
        this.rerenderForm();
      },
      error: () => {
        this.toastService.error(this.i18nService.t('systemManagement.tradeBotSecret.toast.loadDetailError'));
        void this.router.navigate([TRADE_BOT_SECRET_ROUTES.list]);
      }
    });
  }
}
