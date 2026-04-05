import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { SYSTEM_STATUS_OPTIONS } from '../../../../../../core/constants/system.constants';
import { AiAgentConfigCreateDto, AiAgentConfigResponse, AiAgentConfigUpdateDto } from '../../../../../../core/models/ai-agent/ai-agent-config.model';
import { AiAgentConfigService } from '../../../../../../core/services/ai-agent-service/ai-agent-config.service';
import { I18nService } from '../../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../../core/ui-services/toast.service';
import { FormConfig, FormContext } from '../../../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../../../shared/ui/form-input/utils/validation-rules';
import { AI_AGENT_CONFIG_INITIAL_VALUE, AI_AGENT_CONFIG_ROUTES } from '../ai-agent-config.constants';

@Component({
  selector: 'app-ai-agent-config-form',
  standalone: false,
  templateUrl: './ai-agent-config-form.component.html'
})
export class AiAgentConfigFormComponent implements OnInit {
  readonly formContext: FormContext = { user: null, mode: 'create' };
  readonly formConfig: FormConfig = {
    fields: [
      { type: 'text', name: 'category', label: 'category', width: '1/2', validation: [Rules.required('systemManagement.validation.categoryRequired')] },
      { type: 'text', name: 'key', label: 'key', width: '1/2', validation: [Rules.required('systemManagement.validation.keyRequired')] },
      { type: 'select', name: 'status', label: 'status', width: '1/2', options: [...SYSTEM_STATUS_OPTIONS] },
      { type: 'textarea', name: 'value', label: 'systemManagement.field.jsonValue', width: 'full', showZoomButton: true, contentType: 'json', jsonValidationMessage: 'systemManagement.validation.invalidJson', validation: [Rules.required('systemManagement.validation.valueRequired')] },
      { type: 'textarea', name: 'description', label: 'description', width: 'full' }
    ]
  };

  editId: string | null = null;
  loading = false;
  formInitialValue: AiAgentConfigCreateDto = { ...AI_AGENT_CONFIG_INITIAL_VALUE };
  readonly formVisible = signal(true);

  constructor(
    private readonly service: AiAgentConfigService,
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

  onSubmitForm(model: AiAgentConfigCreateDto): void {
    const request$ = this.editId ? this.service.update(this.editId, model as AiAgentConfigUpdateDto) : this.service.create(model);
    this.loading = true;
    this.loadingService.track(request$).pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => {
        this.toastService.info(this.i18nService.t(this.editId ? 'updateSuccess' : 'createSuccess'));
        void this.router.navigate([AI_AGENT_CONFIG_ROUTES.list]);
      },
      error: () => this.toastService.error(this.i18nService.t('systemManagement.aiAgentConfig.toast.saveError'))
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
      this.formInitialValue = { ...AI_AGENT_CONFIG_INITIAL_VALUE };
      this.rerenderForm();
      return;
    }
    this.editId = id;
    this.formContext.mode = 'edit';
    this.loading = true;
    this.loadingService.track(this.service.getById(id)).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (detail: AiAgentConfigResponse) => {
        this.formInitialValue = { ...detail };
        this.rerenderForm();
      },
      error: () => {
        this.toastService.error(this.i18nService.t('systemManagement.aiAgentConfig.toast.loadDetailError'));
        void this.router.navigate([AI_AGENT_CONFIG_ROUTES.list]);
      }
    });
  }
}
