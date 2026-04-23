import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { DEFAULT_TABLE_ROWS, DEFAULT_TABLE_ROWS_PER_PAGE } from '../../../../../core/constants/system.constants';
import { BasePageResponse } from '../../../../../core/models/base-response.model';
import { CodexSkillResponse } from '../../../../../core/models/codex-agent/codex-skill.model';
import { CodexSkillService } from '../../../../../core/services/codex-agent-service/codex-skill.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { BasePagedList } from '../../../../../shared/ui/table/component/table/base-paged-list';
import { TableConfig } from '../../../../../shared/ui/table/models/table-config.model';
import { CODEX_SKILL_ROUTES } from '../codex-skill.constants';

@Component({
  selector: 'app-codex-skill-list',
  standalone: false,
  templateUrl: './codex-skill-list.component.html'
})
export class CodexSkillListComponent extends BasePagedList<CodexSkillResponse> implements OnInit {
  readonly tableConfig: TableConfig = {
    title: 'Codex Skills',
    toolbar: { new: { visible: true, label: 'New Skill', icon: 'pi pi-plus', severity: 'success' } },
    filters: [
      { field: 'code', label: 'Code', placeholder: 'Search code' },
      { field: 'name', label: 'Name', placeholder: 'Search name' },
      {
        field: 'enabled',
        label: 'Enabled',
        type: 'select',
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ]
      }
    ],
    filterOptions: { primaryField: 'name' },
    columns: [
      { field: 'code', header: 'Code', sortable: true },
      { field: 'name', header: 'Name', sortable: true },
      { field: 'description', header: 'Description' },
      { field: 'enabled', header: 'Enabled', type: 'boolean' },
      { field: 'status', header: 'Status' },
      {
        field: 'actions',
        header: 'Actions',
        type: 'actions',
        actions: [
          { label: 'Edit', icon: 'pi pi-pencil', severity: 'info', onClick: (row) => this.goEdit(row.id) },
          { label: 'Delete', icon: 'pi pi-trash', severity: 'danger', onClick: (row) => this.remove(row.id) }
        ]
      }
    ],
    pagination: true,
    rows: DEFAULT_TABLE_ROWS,
    rowsPerPageOptions: [...DEFAULT_TABLE_ROWS_PER_PAGE]
  };

  loading = false;

  constructor(
    private readonly service: CodexSkillService,
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
    void this.router.navigate([CODEX_SKILL_ROUTES.create]);
  }

  private goEdit(id: string): void {
    void this.router.navigate([`${CODEX_SKILL_ROUTES.list}/edit`, id]);
  }

  private remove(id: string): void {
    this.loading = true;
    this.loadingService.track(this.service.delete(id)).pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => {
        this.toastService.info(this.i18nService.t('deleteSuccess'));
        this.loadPage();
      },
      error: () => this.toastService.error('Delete Codex skill failed')
    });
  }

  protected loadPage(): void {
    this.loading = true;
    this.loadingService.track(this.service.getPage(this.page, this.pageSize, ['name,asc'], this.filters)).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (res: BasePageResponse<CodexSkillResponse>) => this.setPageResponse(res),
      error: () => this.toastService.error('Load Codex skills failed')
    });
  }
}
