import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { DEFAULT_TABLE_ROWS, DEFAULT_TABLE_ROWS_PER_PAGE } from '../../../../../core/constants/system.constants';
import { CodexAgentResponse } from '../../../../../core/models/codex-agent/codex-agent.model';
import { BasePageResponse } from '../../../../../core/models/base-response.model';
import { CodexAgentService } from '../../../../../core/services/codex-agent-service/codex-agent.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { BasePagedList } from '../../../../../shared/ui/table/component/table/base-paged-list';
import { TableConfig } from '../../../../../shared/ui/table/models/table-config.model';
import { CODEX_AGENT_ROUTES } from '../codex-agent.constants';

@Component({
  selector: 'app-codex-agent-list',
  standalone: false,
  templateUrl: './codex-agent-list.component.html'
})
export class CodexAgentListComponent extends BasePagedList<CodexAgentResponse> implements OnInit {
  tableConfig!: TableConfig;
  readonly loading = signal(false);

  constructor(
    private readonly service: CodexAgentService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly i18nService: I18nService
  ) {
    super(route, router, DEFAULT_TABLE_ROWS);
    this.tableConfig = this.createTableConfig();
  }

  ngOnInit(): void {
    this.loadPage();
  }

  onCreate(): void {
    void this.router.navigate([CODEX_AGENT_ROUTES.create]);
  }

  private goEdit(id: string): void {
    void this.router.navigate([`${CODEX_AGENT_ROUTES.list}/edit`, id]);
  }

  private remove(id: string): void {
    this.loading.set(true);
    this.loadingService.track(this.service.delete(id)).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => {
        this.toastService.info(this.i18nService.t('deleteSuccess'));
        this.loadPage();
      },
      error: () => this.toastService.error('codexAgent.form.toast.deleteFailed')
    });
  }

  protected loadPage(): void {
    this.loading.set(true);
    this.loadingService.track(this.service.getPage(this.page, this.pageSize, ['name,asc'], this.filters)).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (res: BasePageResponse<CodexAgentResponse>) => this.setPageResponse(res),
      error: () => this.toastService.error('codexAgent.form.toast.loadListFailed')
    });
  }

  private createTableConfig(): TableConfig {
    return {
      title: 'codexAgent.form.listTitle',
      toolbar: {
        new: {
          visible: true,
          label: 'codexAgent.form.new',
          icon: 'pi pi-plus',
          severity: 'success'
        }
      },
      filters: [
        { field: 'code', label: 'code', placeholder: 'codexAgent.form.searchCode' },
        { field: 'name', label: 'name', placeholder: 'codexAgent.form.searchName' },
        {
          field: 'enabled',
          label: 'enabled',
          type: 'select',
          options: [
            { label: 'yes', value: true },
            { label: 'no', value: false }
          ]
        }
      ],
      filterOptions: { primaryField: 'name' },
      columns: [
        { field: 'code', header: 'code', sortable: true },
        { field: 'name', header: 'name', sortable: true },
        { field: 'model', header: 'codexAgent.form.model' },
        { field: 'reasoningEffort', header: 'codexAgent.form.reasoningEffort' },
        { field: 'approvalPolicy', header: 'codexAgent.form.approvalPolicy' },
        { field: 'enabled', header: 'enabled', type: 'boolean' },
        { field: 'status', header: 'status' },
        {
          field: 'actions',
          header: 'actions',
          type: 'actions',
          actions: [
            { label: 'codexAgent.form.viewDetail', icon: 'pi pi-eye', severity: 'info', onClick: (row) => this.goEdit(row.id) },
            { label: 'delete', icon: 'pi pi-trash', severity: 'danger', onClick: (row) => this.remove(row.id) }
          ]
        }
      ],
      pagination: true,
      rows: DEFAULT_TABLE_ROWS,
      rowsPerPageOptions: [...DEFAULT_TABLE_ROWS_PER_PAGE]
    };
  }
}
