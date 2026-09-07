import { Component, OnInit, inject, signal } from '@angular/core';
import { ActionToolbarAction } from '@shared/ui/layout/action-toolbar/action-toolbar.component';
import { FilterPanelField } from '@shared/ui/layout/filter-panel/filter-panel.component';
import { TableConfig } from '@shared/ui/patterns/table/models/table-config.model';
import { CodexThreadItem } from '../../models/codex-sdk.model';
import { CodexSdkService } from '../../services/codex-sdk.service';

@Component({
  selector: 'app-codex-thread-list',
  standalone: false,
  templateUrl: './codex-thread-list.component.html',
  styleUrl: './codex-thread-list.component.scss',
})
export class CodexThreadListPageComponent implements OnInit {
  private readonly codexService = inject(CodexSdkService);

  readonly threads = signal<CodexThreadItem[]>([]);
  readonly loading = signal<boolean>(false);
  readonly currentCursor = signal<string | null>(null);
  readonly nextCursor = signal<string | null>(null);
  readonly cursorHistory = signal<string[]>([]);
  readonly searchTerm = signal<string>('');
  readonly archivedFilter = signal<boolean | undefined>(undefined);
  readonly filterValues = signal<Record<string, unknown>>({});

  readonly drawerVisible = signal<boolean>(false);
  readonly selectedThreadId = signal<string | null>(null);

  readonly filterFields: FilterPanelField[] = [
    {
      key: 'searchTerm',
      label: 'codexSdk.filter.search',
      type: 'text',
      placeholder: 'codexSdk.filter.searchPlaceholder',
    },
    {
      key: 'archived',
      label: 'codexSdk.filter.archived',
      type: 'select',
      options: [
        { label: 'codexSdk.filter.all', value: '' },
        { label: 'codexSdk.filter.activeOnly', value: 'false' },
        { label: 'codexSdk.filter.archivedOnly', value: 'true' },
      ],
    },
  ];

  readonly tableConfig: TableConfig<CodexThreadItem> = {
    emptyTitle: 'codexSdk.table.emptyTitle',
    emptyDescription: 'codexSdk.table.emptyDesc',
    columns: [
      {
        field: 'id',
        header: 'codexSdk.table.id',
        type: 'custom',
        width: '200px',
      },
      {
        field: 'previewText',
        header: 'codexSdk.table.preview',
        type: 'custom',
      },
      {
        field: 'turnCount',
        header: 'codexSdk.table.turnCount',
        type: 'custom',
        width: '140px',
      },
      {
        field: 'actions',
        header: 'codexSdk.table.actions',
        type: 'custom',
        width: '140px',
        align: 'right',
      },
    ],
  };

  get toolbarActions(): ActionToolbarAction[] {
    return [
      {
        id: 'new-workbench',
        label: 'codexSdk.toolbar.newWorkbench',
        icon: 'pi pi-plus',
        variant: 'primary',
      },
      {
        id: 'prev-page',
        label: 'codexSdk.toolbar.prev',
        icon: 'pi pi-chevron-left',
        variant: 'secondary',
        disabled: this.cursorHistory().length === 0,
      },
      {
        id: 'next-page',
        label: 'codexSdk.toolbar.next',
        icon: 'pi pi-chevron-right',
        variant: 'secondary',
        disabled: !this.nextCursor(),
      },
      {
        id: 'refresh',
        label: 'common.action.refresh',
        icon: 'pi pi-refresh',
        variant: 'secondary',
      },
    ];
  }

  ngOnInit(): void {
    this.loadThreads();
  }

  loadThreads(): void {
    this.loading.set(true);
    this.codexService
      .getThreads({
        limit: 20,
        cursor: this.currentCursor() || undefined,
        searchTerm: this.searchTerm() || undefined,
        archived: this.archivedFilter(),
      })
      .subscribe({
        next: (res) => {
          this.threads.set(res.data || []);
          this.nextCursor.set(res.nextCursor || null);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  onToolbarAction(action: ActionToolbarAction): void {
    switch (action.id) {
      case 'new-workbench':
        this.openNewWorkbench();
        break;
      case 'prev-page':
        this.goToPrevPage();
        break;
      case 'next-page':
        this.goToNextPage();
        break;
      case 'refresh':
        this.loadThreads();
        break;
    }
  }

  goToNextPage(): void {
    const next = this.nextCursor();
    if (!next) return;
    this.cursorHistory.update((history) => [...history, this.currentCursor() || '']);
    this.currentCursor.set(next);
    this.loadThreads();
  }

  goToPrevPage(): void {
    const history = this.cursorHistory();
    if (history.length === 0) return;
    const prevCursor = history[history.length - 1];
    this.cursorHistory.update((h) => h.slice(0, -1));
    this.currentCursor.set(prevCursor || null);
    this.loadThreads();
  }

  onFilterChange(values: Record<string, unknown>): void {
    this.filterValues.set(values);
    this.searchTerm.set((values['searchTerm'] as string) || '');
    const archivedVal = values['archived'] as string;
    this.archivedFilter.set(archivedVal === 'true' ? true : archivedVal === 'false' ? false : undefined);
    this.cursorHistory.set([]);
    this.currentCursor.set(null);
    this.loadThreads();
  }

  onFilterReset(): void {
    this.filterValues.set({});
    this.searchTerm.set('');
    this.archivedFilter.set(undefined);
    this.cursorHistory.set([]);
    this.currentCursor.set(null);
    this.loadThreads();
  }

  openThread(id: string): void {
    this.selectedThreadId.set(id);
    this.drawerVisible.set(true);
  }

  openNewWorkbench(): void {
    this.selectedThreadId.set(null);
    this.drawerVisible.set(true);
  }

  onDrawerClosed(): void {
    this.drawerVisible.set(false);
  }
}
