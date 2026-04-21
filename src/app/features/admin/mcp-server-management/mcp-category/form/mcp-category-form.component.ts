import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { SYSTEM_STATUS_OPTIONS } from '../../../../../core/constants/system.constants';
import { McpCategoryCreateDto, McpCategoryResponse, McpCategoryUpdateDto, McpMetadataEntry } from '../../../../../core/models/mcp-server/mcp-tool.model';
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
      { type: 'text', name: 'name', label: 'name', width: '1/2', validation: [Rules.required('mcpCategory.nameRequired')] },
      { type: 'text', name: 'code', label: 'code', width: '1/2', validation: [Rules.required('mcpCategory.codeRequired')] },
      { type: 'select', name: 'status', label: 'status', width: '1/2', options: [...SYSTEM_STATUS_OPTIONS] },
      {
        type: 'secret-metadata',
        name: 'metadata',
        label: 'mcpCategory.metadata',
        width: 'full',
        service: 'ai-agent-mcrs',
        addButtonLabel: 'mcpCategory.addMetadata',
        keyPlaceholder: 'mcpCategory.metadataKeyPlaceholder',
        valuePlaceholder: 'mcpCategory.metadataValuePlaceholder',
        secretPlaceholder: 'mcpCategory.metadataSecretPlaceholder'
      },
      { type: 'textarea', name: 'description', label: 'description', width: 'full' }
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
    const payload: McpCategoryCreateDto = {
      ...model,
      name: (model.name ?? '').trim(),
      code: (model.code ?? '').trim(),
      description: (model.description ?? '').trim(),
      metadata: this.normalizeMetadataEntries(model.metadata)
    };
    const request$ = this.editId ? this.service.update(this.editId, payload as McpCategoryUpdateDto) : this.service.create(payload);
    this.loading = true;
    this.loadingService.track(request$).pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => {
        this.toastService.info(this.i18nService.t(this.editId ? 'updateSuccess' : 'createSuccess'));
        void this.router.navigate([MCP_TOOL_CONFIG_ROUTES.categoryList]);
      },
      error: () => this.toastService.error(this.i18nService.t('mcpCategory.saveError'))
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
          status: detail.status ?? 'ACTIVE',
          metadata: this.normalizeMetadataEntries(detail.metadata)
        };
        this.rerenderForm();
      },
      error: () => {
        this.toastService.error(this.i18nService.t('mcpCategory.loadDetailError'));
        void this.router.navigate([MCP_TOOL_CONFIG_ROUTES.categoryList]);
      }
    });
  }

  private normalizeMetadataEntries(value: unknown): McpMetadataEntry[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.reduce<McpMetadataEntry[]>((acc, item) => {
      const record = item && typeof item === 'object' && !Array.isArray(item) ? (item as Record<string, unknown>) : {};
      const key = String(record['key'] ?? '').trim();
      const metadataValue = String(record['value'] ?? '').trim();
      if (!key || !metadataValue) {
        return acc;
      }
      acc.push({
        key,
        type: record['type'] === 'SECRET' ? 'SECRET' : 'CONFIG',
        value: metadataValue
      });
      return acc;
    }, []);
  }
}
