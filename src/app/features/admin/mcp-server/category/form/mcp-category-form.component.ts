import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { SYSTEM_STATUS_OPTIONS } from '../../../../../core/constants/system.constants';
import { McpCategoryCreateDto, McpCategoryResponse, McpCategoryUpdateDto } from '../../../../../core/models/mcp-server/mcp-tool.model';
import { McpCategoryService } from '../../../../../core/services/ai-agent-service/mcp-category.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { FormConfig, FormContext } from '../../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../../shared/ui/form-input/utils/validation-rules';
import { MCP_CATEGORY_INITIAL_VALUE, MCP_TOOL_CONFIG_ROUTES } from '../../mcp-server.constants';

@Component({
  selector: 'app-mcp-category-form',
  standalone: false,
  templateUrl: './mcp-category-form.component.html'
})
export class McpCategoryFormComponent implements OnInit {
  readonly formContext: FormContext = { user: null, mode: 'create' };
  readonly formConfig: FormConfig = {
    fields: [
      { type: 'text', name: 'name', label: 'Name', width: '1/2', validation: [Rules.required('Name is required')] },
      { type: 'text', name: 'code', label: 'Code', width: '1/2', validation: [Rules.required('Code is required')] },
      { type: 'select', name: 'status', label: 'Status', width: '1/2', options: [...SYSTEM_STATUS_OPTIONS] },
      { type: 'textarea', name: 'description', label: 'Description', width: 'full' }
    ]
  };

  editId: string | null = null;
  loading = false;
  formInitialValue: McpCategoryCreateDto = { ...MCP_CATEGORY_INITIAL_VALUE };
  readonly formVisible = signal(true);

  constructor(
    private readonly service: McpCategoryService,
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

  onSubmitForm(model: McpCategoryCreateDto): void {
    const request$ = this.editId ? this.service.update(this.editId, model as McpCategoryUpdateDto) : this.service.create(model);
    this.loading = true;
    this.loadingService.track(request$).pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => {
        this.toastService.info(this.i18nService.t(this.editId ? 'updateSuccess' : 'createSuccess'));
        void this.router.navigate([MCP_TOOL_CONFIG_ROUTES.categoryList]);
      },
      error: () => this.toastService.error('Save MCP category failed')
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
      this.formInitialValue = { ...MCP_CATEGORY_INITIAL_VALUE };
      this.rerenderForm();
      return;
    }

    this.editId = id;
    this.formContext.mode = 'edit';
    this.loading = true;
    this.loadingService.track(this.service.getById(id)).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (detail: McpCategoryResponse) => {
        this.formInitialValue = {
          name: detail.name,
          code: detail.code,
          description: detail.description ?? '',
          status: detail.status ?? 'ACTIVE'
        };
        this.rerenderForm();
      },
      error: () => {
        this.toastService.error('Load MCP category detail failed');
        void this.router.navigate([MCP_TOOL_CONFIG_ROUTES.categoryList]);
      }
    });
  }
}
