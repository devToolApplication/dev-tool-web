import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AiAgentAskRequest, AiAgentAskResponse } from '../../../../../core/models/ai-agent/ai-agent-ask.model';
import { DEFAULT_TABLE_ROWS, DEFAULT_TABLE_ROWS_PER_PAGE } from '../../../../../core/constants/system.constants';
import { AiModelResponse } from '../../../../../core/models/ai-agent/ai-model.model';
import { BasePageResponse } from '../../../../../core/models/base-response.model';
import { AiAgentAdminService } from '../../../../../core/services/ai-agent-service/ai-agent-admin.service';
import { AiModelService } from '../../../../../core/services/ai-agent-service/ai-model.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { FormConfig, FormContext } from '../../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../../shared/ui/form-input/utils/validation-rules';
import { BasePagedList } from '../../../../../shared/ui/table/component/table/base-paged-list';
import { TableConfig } from '../../../../../shared/ui/table/models/table-config.model';
import { AI_MODEL_ROUTES } from '../ai-model.constants';

@Component({
  selector: 'app-ai-model-list',
  standalone: false,
  templateUrl: './ai-model-list.component.html',
  styleUrl: './ai-model-list.component.css'
})
export class AiModelListComponent extends BasePagedList<AiModelResponse> implements OnInit {
  readonly tableConfig: TableConfig = {
    title: 'aiAgent.aiModel.title',
    toolbar: { new: { visible: true, label: 'aiAgent.aiModel.new', icon: 'pi pi-plus', severity: 'success' } },
    filters: [
      { field: 'modelName', label: 'aiAgent.aiModel.modelName', placeholder: 'aiAgent.aiModel.searchModelName' },
      { field: 'providerModelType', label: 'aiAgent.aiModel.provider', placeholder: 'aiAgent.aiModel.searchProvider' },
      { field: 'modelType', label: 'aiAgent.aiModel.modelType', placeholder: 'aiAgent.aiModel.searchModelType' }
    ],
    filterOptions: { primaryField: 'modelName' },
    columns: [
      { field: 'code', header: 'code', sortable: true },
      { field: 'modelName', header: 'aiAgent.aiModel.modelName', sortable: true },
      { field: 'providerModelType', header: 'aiAgent.aiModel.provider', sortable: true },
      { field: 'modelType', header: 'aiAgent.aiModel.modelType', sortable: true },
      { field: 'toolSupportMode', header: 'aiAgent.aiModel.toolSupport', sortable: true },
      { field: 'defaultActive', header: 'default', type: 'boolean' },
      { field: 'status', header: 'status' },
      {
        field: 'actions',
        header: 'actions',
        type: 'actions',
        actions: [
          { label: 'aiAgent.aiModel.testPrompt.action', icon: 'pi pi-comments', severity: 'help', onClick: (row) => this.openTestPrompt(row) },
          { label: 'edit', icon: 'pi pi-pencil', severity: 'info', onClick: (row) => this.goEdit(row.id) },
          { label: 'delete', icon: 'pi pi-trash', severity: 'danger', onClick: (row) => this.remove(row.id) }
        ]
      }
    ],
    pagination: true,
    rows: DEFAULT_TABLE_ROWS,
    rowsPerPageOptions: [...DEFAULT_TABLE_ROWS_PER_PAGE]
  };

  readonly promptFormContext: FormContext = {
    user: null,
    mode: 'create'
  };

  readonly promptFormConfig: FormConfig = {
    fields: [
      {
        type: 'textarea',
        name: 'systemPrompt',
        label: 'aiAgent.systemPrompt',
        width: 'full',
        rows: 4
      },
      {
        type: 'textarea',
        name: 'userPrompt',
        label: 'aiAgent.userPrompt',
        width: 'full',
        rows: 8,
        validation: [Rules.required('aiAgent.validation.userPromptRequired')]
      }
    ]
  };

  loading = false;
  testPromptVisible = false;
  testPromptSubmitting = false;
  selectedModel: AiModelResponse | null = null;
  testPromptInitialValue: AiAgentAskRequest = {
    modelId: '',
    systemPrompt: '',
    userPrompt: ''
  };
  testPromptFormValue: AiAgentAskRequest = {
    modelId: '',
    systemPrompt: '',
    userPrompt: ''
  };
  testPromptAnswer: AiAgentAskResponse | null = null;

  constructor(
    private readonly service: AiModelService,
    private readonly aiAgentAdminService: AiAgentAdminService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly i18nService: I18nService
  ) {
    super(route, router, DEFAULT_TABLE_ROWS);
  }

  ngOnInit(): void {
    this.loadPage();
  }

  onCreate(): void {
    void this.router.navigate([AI_MODEL_ROUTES.create]);
  }

  openTestPrompt(model: AiModelResponse): void {
    this.selectedModel = model;
    this.testPromptAnswer = null;
    this.testPromptInitialValue = {
      modelId: model.id,
      systemPrompt: '',
      userPrompt: ''
    };
    this.testPromptFormValue = { ...this.testPromptInitialValue };
    this.testPromptVisible = true;
  }

  onPromptVisibleChange(visible: boolean): void {
    this.testPromptVisible = visible;
    if (!visible) {
      this.resetPromptState();
    }
  }

  onPromptCancel(): void {
    this.testPromptVisible = false;
    this.resetPromptState();
  }

  onPromptValueChange(model: AiAgentAskRequest): void {
    this.testPromptFormValue = {
      modelId: this.selectedModel?.id || '',
      systemPrompt: model?.systemPrompt || '',
      userPrompt: model?.userPrompt || ''
    };
  }

  onSubmitPrompt(model: AiAgentAskRequest): void {
    if (!this.selectedModel || this.testPromptSubmitting) {
      return;
    }

    const userPrompt = model.userPrompt?.trim() || '';
    if (!userPrompt) {
      this.toastService.error('aiAgent.validation.userPromptRequired');
      return;
    }

    const payload: AiAgentAskRequest = {
      modelId: this.selectedModel.id,
      systemPrompt: model.systemPrompt?.trim() || '',
      userPrompt
    };

    this.testPromptSubmitting = true;
    this.testPromptAnswer = null;
    this.loadingService.track(this.aiAgentAdminService.ask(payload)).pipe(finalize(() => (this.testPromptSubmitting = false))).subscribe({
      next: (response) => {
        this.testPromptAnswer = response;
        if (!response.success) {
          this.toastService.error(response.errorMessage || 'aiAgent.aiModel.testPrompt.askFailed');
        }
      },
      error: () => {
        this.toastService.error('aiAgent.aiModel.testPrompt.askFailed');
      }
    });
  }

  private goEdit(id: string): void {
    void this.router.navigate([`${AI_MODEL_ROUTES.list}/edit`, id]);
  }

  private remove(id: string): void {
    this.loading = true;
    this.loadingService.track(this.service.delete(id)).pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => {
        this.toastService.info(this.i18nService.t('deleteSuccess'));
        this.loadPage();
      },
      error: () => this.toastService.error(this.i18nService.t('deleteError'))
    });
  }

  protected loadPage(): void {
    this.loading = true;
    this.loadingService
      .track(this.service.getPage(this.page, this.pageSize, ['modelName,asc'], this.filters))
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res: BasePageResponse<AiModelResponse>) => this.setPageResponse(res),
        error: () => this.toastService.error('aiAgent.aiModel.toast.loadListFailed')
      });
  }

  private resetPromptState(): void {
    this.selectedModel = null;
    this.testPromptAnswer = null;
    this.testPromptInitialValue = {
      modelId: '',
      systemPrompt: '',
      userPrompt: ''
    };
    this.testPromptFormValue = {
      modelId: '',
      systemPrompt: '',
      userPrompt: ''
    };
  }
}
