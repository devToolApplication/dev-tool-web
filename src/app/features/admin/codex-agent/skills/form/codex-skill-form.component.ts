import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { SYSTEM_STATUS_OPTIONS } from '../../../../../core/constants/system.constants';
import { CodexSkillCreateDto, CodexSkillFile, CodexSkillResponse, CodexSkillUpdateDto } from '../../../../../core/models/codex-agent/codex-skill.model';
import { CodexSkillService } from '../../../../../core/services/codex-agent-service/codex-skill.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { FormConfig, FormContext } from '../../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../../shared/ui/form-input/utils/validation-rules';
import { CODEX_SKILL_INITIAL_VALUE, CODEX_SKILL_ROUTES } from '../codex-skill.constants';

interface CodexSkillFormValue extends Omit<CodexSkillCreateDto, 'files'> {
  filesJson: string;
}

@Component({
  selector: 'app-codex-skill-form',
  standalone: false,
  templateUrl: './codex-skill-form.component.html'
})
export class CodexSkillFormComponent implements OnInit {
  readonly formContext: FormContext = { user: null, mode: 'create', extra: {} };
  readonly formConfig: FormConfig = {
    fields: [
      { type: 'text', name: 'code', label: 'Code', width: '1/2', validation: [Rules.required('Code is required')] },
      { type: 'text', name: 'name', label: 'Name', width: '1/2', validation: [Rules.required('Name is required')] },
      { type: 'checkbox', name: 'enabled', label: 'Enabled', width: '1/3' },
      { type: 'select', name: 'status', label: 'Status', width: '1/3', options: [...SYSTEM_STATUS_OPTIONS] },
      { type: 'textarea', name: 'description', label: 'Description', width: 'full' },
      {
        type: 'textarea',
        name: 'filesJson',
        label: 'Skill Files JSON',
        width: 'full',
        rows: 16,
        showZoomButton: true,
        contentType: 'json',
        jsonValidationMessage: 'Invalid JSON',
        validation: [Rules.required('Skill files are required')]
      }
    ]
  };

  editId: string | null = null;
  loading = false;
  formInitialValue: CodexSkillFormValue = this.createInitialValue();
  readonly formVisible = signal(true);

  constructor(
    private readonly service: CodexSkillService,
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

  onSubmitForm(model: CodexSkillFormValue): void {
    const files = this.parseFiles(model.filesJson);
    if (!files) {
      this.toastService.error('Skill files JSON is invalid');
      return;
    }

    const payload: CodexSkillCreateDto = {
      code: model.code?.trim() || '',
      name: model.name?.trim() || '',
      description: model.description?.trim() || '',
      enabled: model.enabled ?? true,
      status: model.status,
      files
    };

    const request$ = this.editId
      ? this.service.update(this.editId, payload as CodexSkillUpdateDto)
      : this.service.create(payload);

    this.loading = true;
    this.loadingService.track(request$).pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => {
        this.toastService.info(this.i18nService.t(this.editId ? 'updateSuccess' : 'createSuccess'));
        void this.router.navigate([CODEX_SKILL_ROUTES.list]);
      },
      error: () => this.toastService.error('Save Codex skill failed')
    });
  }

  private applyRouteMode(id: string | null): void {
    if (!id) {
      this.editId = null;
      this.formContext.mode = 'create';
      this.formInitialValue = this.createInitialValue();
      this.rerenderForm();
      return;
    }

    this.editId = id;
    this.formContext.mode = 'edit';
    this.loading = true;
    this.loadingService.track(this.service.getById(id)).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (detail: CodexSkillResponse) => {
        this.formInitialValue = {
          code: detail.code,
          name: detail.name,
          description: detail.description ?? '',
          enabled: detail.enabled ?? true,
          status: detail.status ?? 'ACTIVE',
          filesJson: this.stringifyFiles(detail.files)
        };
        this.rerenderForm();
      },
      error: () => {
        this.toastService.error('Load Codex skill detail failed');
        void this.router.navigate([CODEX_SKILL_ROUTES.list]);
      }
    });
  }

  private createInitialValue(): CodexSkillFormValue {
    return {
      ...(CODEX_SKILL_INITIAL_VALUE as Omit<CodexSkillFormValue, 'filesJson'>),
      filesJson: this.stringifyFiles(CODEX_SKILL_INITIAL_VALUE.files)
    };
  }

  private stringifyFiles(files?: CodexSkillFile[]): string {
    return JSON.stringify(files ?? [], null, 2);
  }

  private parseFiles(value: string): CodexSkillFile[] | null {
    try {
      const parsed = JSON.parse(value || '[]');
      if (!Array.isArray(parsed)) {
        return null;
      }
      return parsed.map((item) => ({
        path: String(item?.path ?? ''),
        content: String(item?.content ?? ''),
        contentType: item?.contentType ? String(item.contentType) : undefined
      }));
    } catch {
      return null;
    }
  }

  private rerenderForm(): void {
    this.formVisible.set(false);
    window.setTimeout(() => this.formVisible.set(true));
  }
}
