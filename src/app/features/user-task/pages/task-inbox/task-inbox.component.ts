import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { KeycloakService } from '../../../../core/auth/keycloak.service';
import type { ActionToolbarAction } from '../../../../shared/ui/layout/action-toolbar/action-toolbar.component';
import type { TableAction } from '../../../../shared/ui/patterns/table/models/table-config.model';
import type { TablePageChangeEvent } from '../../../../shared/ui/patterns/table/component/table/table';
import {
  UserTaskQuery,
  UserTaskSummary,
  UserTaskView,
} from '../../models/user-task.model';
import { UserTaskApiService } from '../../services/user-task-api.service';
import {
  ALL_COLUMN_FIELDS,
  PRIMARY_COLUMN_FIELDS,
  buildUserTaskFilterFields,
  buildUserTaskTableConfig,
  buildUserTaskToolbarActions,
  buildUserTaskViewTabs,
  extractInboxError,
  filterValuesToQuery,
  isAiAgentAdmin,
  parseUserTaskQuery,
  queryToFilterValues,
  serializeUserTaskQuery,
} from './task-inbox.config';

// ponytail: inbox uses client-side viewport check; upgrade to BreakpointObserver if multi-window docking needed.
@Component({
  selector: 'app-task-inbox',
  standalone: false,
  template: `
    <app-page-shell
      [title]="'userTask.nav.title' | translateContent"
      [subtitle]="'userTask.nav.subtitle' | translateContent"
      layout="wide"
    >
      <app-action-toolbar
        page-actions
        [actions]="toolbarActions"
        (actionClick)="onToolbarAction($event)"
      ></app-action-toolbar>

      <div class="user-task-inbox flex flex-col gap-4">
        <!-- View Switcher Tabs: MY / CLAIMABLE / (ALL if admin) -->
        <div class="user-task-inbox__views">
          <app-tabs
            [tabs]="viewTabs()"
            [value]="activeView()"
            (valueChange)="onViewTabChange($event)"
          ></app-tabs>
        </div>

        <!-- Filter Panel -->
        <app-filter-panel
          [filters]="filterFields"
          [values]="filterValues()"
          [initialValues]="initialFilterValues"
          (apply)="onFilterApply($event)"
          (reset)="onFilterReset()"
        ></app-filter-panel>

        <!-- Error State or Table -->
        @if (errorState(); as err) {
          <app-error-state
            [title]="'shared.table.errorTitle' | translateContent"
            [message]="err.errorMessage"
            [errorCode]="err.errorCode"
            retryLabel="retry"
            (retry)="onRefresh()"
          ></app-error-state>
        } @else {
          <app-table
            [config]="tableConfig"
            [data]="tasks()"
            [loading]="loading()"
            [totalRecords]="totalRecords()"
            [currentPage]="currentPage()"
            [rows]="pageSize()"
            [columnVisibility]="visibleColumnFields()"
            [customTemplates]="{
              task: taskCellTpl,
              workflow: workflowCellTpl,
              formKey: formKeyCellTpl,
              assignee: assigneeCellTpl,
              createdAt: createdCellTpl,
              status: statusCellTpl
            }"
            (rowClick)="onRowClick($event)"
            (actionClick)="onTableAction($event)"
            (pageChange)="onPageChange($event)"
            (refresh)="onRefresh()"
          ></app-table>
        }
      </div>

      <!-- Custom Cell Templates -->
      <ng-template #taskCellTpl let-row="row">
        <div class="flex flex-col min-w-0 max-w-full">
          <span class="font-medium text-[var(--app-text)] truncate select-all">{{ row.taskName }}</span>
          <span class="text-xs text-[var(--app-text-muted)] font-mono truncate">ID: {{ row.taskId }}</span>
        </div>
      </ng-template>

      <ng-template #workflowCellTpl let-row="row">
        <div class="flex flex-col min-w-0 max-w-full">
          <span class="text-sm text-[var(--app-text)] truncate">{{ row.processDefinitionName || row.processInstanceId || '-' }}</span>
          @if (row.businessKey) {
            <div class="flex items-center gap-1 text-xs text-[var(--app-text-muted)] font-mono truncate">
              <span class="truncate">BK: {{ row.businessKey }}</span>
              <app-copyable-text [value]="row.businessKey"></app-copyable-text>
            </div>
          }
        </div>
      </ng-template>

      <ng-template #formKeyCellTpl let-row="row">
        <app-badge [label]="row.formKey" variant="info" size="sm"></app-badge>
      </ng-template>

      <ng-template #assigneeCellTpl let-row="row">
        <span class="text-sm text-[var(--app-text)] truncate">{{ row.assignee || '-' }}</span>
      </ng-template>

      <ng-template #createdCellTpl let-row="row">
        <div class="flex flex-col min-w-0">
          <span class="text-xs text-[var(--app-text)]">{{ row.createdAt | date: 'dd/MM/yyyy HH:mm' }}</span>
          @if (row.dueAt) {
            <span class="text-xs text-[var(--app-control-warn-text)]">
              {{ 'workflowStudio.lifecycle.taskDueDate' | translateContent }}: {{ row.dueAt | date: 'dd/MM/yyyy HH:mm' }}
            </span>
          }
        </div>
      </ng-template>

      <ng-template #statusCellTpl let-row="row">
        <app-badge
          [label]="row.completed ? ('userTask.status.completed' | translateContent) : ('userTask.status.active' | translateContent)"
          [variant]="row.completed ? 'muted' : 'success'"
        ></app-badge>
      </ng-template>
    </app-page-shell>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .user-task-inbox {
        min-width: 0;
      }
      .user-task-inbox__views {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      @media (max-width: 767px) {
        :host ::ng-deep .filter-panel__fields {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskInboxComponent implements OnInit {
  private readonly api = inject(UserTaskApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly keycloak = inject(KeycloakService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly tasks = signal<UserTaskSummary[]>([]);
  readonly totalRecords = signal(0);
  readonly errorState = signal<{ errorCode: string; errorMessage: string } | null>(null);

  readonly currentQuery = signal<UserTaskQuery>({
    view: 'MY',
    page: 0,
    size: 10,
    sort: 'createdAt,desc',
  });
  readonly filterValues = signal<Record<string, unknown>>({});
  readonly initialFilterValues: Record<string, unknown> = {};

  readonly isMobile = signal(false);
  readonly isAdmin = signal(false);

  readonly viewTabs = computed(() => buildUserTaskViewTabs(this.isAdmin()));
  readonly activeView = computed(() => this.currentQuery().view ?? 'MY');
  readonly currentPage = computed(() => this.currentQuery().page ?? 0);
  readonly pageSize = computed(() => this.currentQuery().size ?? 10);
  readonly visibleColumnFields = computed(() =>
    this.isMobile() ? [...PRIMARY_COLUMN_FIELDS] : [...ALL_COLUMN_FIELDS],
  );

  readonly toolbarActions = buildUserTaskToolbarActions();
  readonly filterFields = buildUserTaskFilterFields();
  readonly tableConfig = buildUserTaskTableConfig((taskId) => this.navigateToTask(taskId));

  ngOnInit(): void {
    this.isAdmin.set(isAiAgentAdmin(this.keycloak));
    this.checkMobile();

    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const query = parseUserTaskQuery(params, this.isAdmin());
        if (params['view'] === 'ALL' && !this.isAdmin()) {
          void this.router.navigate([], {
            relativeTo: this.route,
            queryParams: serializeUserTaskQuery(query),
            replaceUrl: true,
          });
          return;
        }

        this.currentQuery.set(query);
        this.filterValues.set(queryToFilterValues(query));
        this.loadTasks(query);
      });
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkMobile();
  }

  onViewTabChange(view: string): void {
    const nextQuery: UserTaskQuery = {
      ...this.currentQuery(),
      view: view as UserTaskView,
      page: 0,
    };
    this.updateQueryParams(nextQuery);
  }

  onFilterApply(values: Record<string, unknown>): void {
    const nextQuery = filterValuesToQuery(values, this.currentQuery());
    this.updateQueryParams(nextQuery);
  }

  onFilterReset(): void {
    const nextQuery: UserTaskQuery = {
      view: this.currentQuery().view,
      page: 0,
      size: this.currentQuery().size,
      sort: this.currentQuery().sort,
    };
    this.updateQueryParams(nextQuery);
  }

  onPageChange(event: TablePageChangeEvent): void {
    const nextQuery: UserTaskQuery = {
      ...this.currentQuery(),
      page: event.page,
      size: event.rows,
    };
    this.updateQueryParams(nextQuery);
  }

  onRefresh(): void {
    this.loadTasks(this.currentQuery());
  }

  onToolbarAction(action: ActionToolbarAction): void {
    if (action.id === 'refresh') {
      this.onRefresh();
    }
  }

  onRowClick(row: UserTaskSummary): void {
    if (row?.taskId) {
      this.navigateToTask(row.taskId);
    }
  }

  onTableAction(event: { action: TableAction<UserTaskSummary>; row: UserTaskSummary }): void {
    if (event?.row?.taskId) {
      this.navigateToTask(event.row.taskId);
    }
  }

  navigateToTask(taskId: string): void {
    void this.router.navigate(['/tasks', taskId]);
  }

  private loadTasks(query: UserTaskQuery): void {
    this.loading.set(true);
    this.errorState.set(null);

    this.api
      .getTasks(query)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          this.tasks.set(res?.data ?? []);
          this.totalRecords.set(res?.metadata?.totalElements ?? res?.data?.length ?? 0);
        },
        error: (err) => {
          this.loading.set(false);
          this.tasks.set([]);
          this.totalRecords.set(0);
          this.errorState.set(extractInboxError(err));
        },
      });
  }

  private updateQueryParams(query: UserTaskQuery): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: serializeUserTaskQuery(query),
    });
  }

  private checkMobile(): void {
    if (typeof window !== 'undefined') {
      this.isMobile.set(window.innerWidth < 768);
    }
  }
}
