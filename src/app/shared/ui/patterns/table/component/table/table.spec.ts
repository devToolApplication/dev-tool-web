import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';


import { SharedModule } from '@shared/shared.module';
import { provideSharedTesting } from '@shared/testing/shared-test.providers';
import { ConfirmDialogService } from '@shared/ui/overlay/confirm-dialog/confirm-dialog.service';
import { TableBulkAction, TableConfig } from '../../models/table-config.model';
import { TableComponent } from './table';

describe('TableComponent', () => {
  let fixture: ComponentFixture<TableComponent>;
  let component: TableComponent;
  let confirmDialogService: { confirm: ReturnType<typeof vi.fn> };

  const baseConfig: TableConfig = {
    title: 'Items',
    pagination: false,
    columns: [
      { field: 'name', header: 'Name', type: 'text' },
      { field: 'status', header: 'Status', type: 'badge', badgeMap: { ACTIVE: 'success' } }
    ],
    emptyTitle: 'No rows',
    emptyDescription: 'Nothing matched',
    errorTitle: 'Could not load',
    toolbar: {
      search: { visible: true, field: 'keyword' },
      refresh: { visible: true },
      columnVisibility: { visible: true },
      density: { visible: true },
      bulkActions: []
    }
  };

  beforeEach(async () => {
    confirmDialogService = {
      confirm: vi.fn().mockResolvedValue(true)
    };
    
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: [
        ...provideSharedTesting(),
        { provide: ConfirmDialogService, useValue: confirmDialogService },
              ]
    }).compileComponents();

    fixture = TestBed.createComponent(TableComponent);
    component = fixture.componentInstance;
    component.config = baseConfig;
  });

  it('renders loading, empty and error states with retry output', () => {
    renderTable({ loading: true, data: [] });

    expect(fixture.nativeElement.querySelector('.loading-skeleton')).toBeTruthy();

    renderTable({ loading: false, data: [] });

    expect(fixture.nativeElement.querySelector('.empty-state')?.textContent).toContain('No rows');

    renderTable({ error: 'Load failed', data: [] });
    const retry = vi.fn();
    component.retry.subscribe(retry);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.error-state')?.textContent).toContain('Load failed');
    fixture.debugElement.query(By.css('app-error-state')).componentInstance.retry.emit();

    expect(retry).toHaveBeenCalled();
  });

  it('emits page, sort, search, refresh and row events without calling APIs', () => {
    const pageChange = vi.fn();
    const sortChange = vi.fn();
    const search = vi.fn();
    const refresh = vi.fn();
    const retry = vi.fn();
    const rowClick = vi.fn();

    component.pageChange.subscribe(pageChange);
    component.sortChange.subscribe(sortChange);
    component.search.subscribe(search);
    component.refresh.subscribe(refresh);
    component.retry.subscribe(retry);
    component.rowClick.subscribe(rowClick);
    component.config = { ...baseConfig, rowClickable: true };
    component.quickSearchTerm.set('  alpha  ');

    component.onPage({ page: 2, rows: 25, first: 50 });
    component.onSort({ field: 'name', order: 1 });
    component.onQuickSearch();
    component.onRefresh();
    component.onRowClick({ id: 'row-1' });

    expect(pageChange).toHaveBeenCalledWith({ page: 2, rows: 25, first: 50 });
    expect(sortChange).toHaveBeenCalledWith({ field: 'name', order: 1 });
    expect(search).toHaveBeenCalledWith({ keyword: 'alpha' });
    expect(refresh).toHaveBeenCalled();
    expect(retry).not.toHaveBeenCalled();
    expect(rowClick).toHaveBeenCalledWith({ id: 'row-1' });
  });

  it('downloads current page CSV without emitting external export', () => {
    const exportSpy = vi.fn();
    const anchor = document.createElement('a');
    const clickSpy = vi.spyOn(anchor, 'click').mockImplementation(() => undefined);
    const createObjectUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:table-export');
    const revokeObjectUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation(((tagName: string, options?: ElementCreationOptions) => {
      if (tagName.toLowerCase() === 'a') {
        return anchor;
      }
      return originalCreateElement(tagName, options);
    }) as typeof document.createElement);
    component.config = {
      ...baseConfig,
      toolbar: {
        export: {
          visible: true,
          scope: 'current-page',
          fileName: 'items'
        }
      }
    };
    component.data = [{ name: 'Alpha', status: 'ACTIVE' }];
    component.export.subscribe(exportSpy);

    component.onExport();

    expect(clickSpy).toHaveBeenCalled();
    expect(anchor.download).toBe('items.csv');
    expect(exportSpy).not.toHaveBeenCalled();

    createElementSpy.mockRestore();
    createObjectUrlSpy.mockRestore();
    revokeObjectUrlSpy.mockRestore();
  });

  it('emits export context for page-owned filtered exports', () => {
    const exportSpy = vi.fn();
    component.config = {
      ...baseConfig,
      toolbar: {
        export: {
          visible: true,
          scope: 'external'
        }
      }
    };
    component.data = [{ name: 'Alpha', status: 'ACTIVE' }];
    component.sortField = 'name';
    component.sortOrder = 1;
    component.ngOnChanges({
      config: {
        currentValue: component.config,
        previousValue: baseConfig,
        firstChange: false,
        isFirstChange: () => false
      }
    });
    component.export.subscribe(exportSpy);

    component.onSearch({ status: 'ACTIVE' });
    component.onExport();

    expect(exportSpy).toHaveBeenCalledWith({
      scope: 'external',
      filters: { status: 'ACTIVE' },
      sortField: 'name',
      sortOrder: 1,
      visibleColumns: ['name', 'status'],
      rows: component.data
    });
  });

  it('handles column visibility, density and selection outputs', () => {
    const columns = vi.fn();
    const density = vi.fn();
    const selection = vi.fn();
    component.columnVisibilityChange.subscribe(columns);
    component.densityChange.subscribe(density);
    component.selectionChange.subscribe(selection);
    component.config = {
      ...baseConfig,
      selection: { mode: 'multiple' },
      columns: [
        { field: 'id', header: 'ID', hideable: false },
        { field: 'name', header: 'Name' }
      ]
    };
    component.data = [{ id: 1 }, { id: 2 }];
    component.ngOnChanges({
      config: {
        currentValue: component.config,
        previousValue: baseConfig,
        firstChange: false,
        isFirstChange: () => false
      }
    });

    component.onColumnFieldsChange(['name']);
    component.onDensityChange('compact');
    component.toggleAllCurrentRows(true);

    expect(component.visibleColumns.map((column) => column.field)).toEqual(['id', 'name']);
    expect(columns).toHaveBeenCalledWith(['name']);
    expect(density).toHaveBeenCalledWith('compact');
    expect(selection).toHaveBeenCalledWith(component.data);
  });

  it('persists column visibility and density when stateKey is configured', () => {
    component.config = {
      ...baseConfig,
      stateKey: 'table-spec',
      columns: [
        { field: 'id', header: 'ID', hideable: false },
        { field: 'name', header: 'Name' },
        { field: 'status', header: 'Status' }
      ]
    };
    component.ngOnChanges({
      config: {
        currentValue: component.config,
        previousValue: baseConfig,
        firstChange: false,
        isFirstChange: () => false
      }
    });

    component.onColumnFieldsChange(['status']);
    component.onDensityChange('compact');

    const persistedState = JSON.parse(localStorage.getItem('dev-tool.table.table-spec') ?? '{}');
    expect(persistedState).toEqual({ columns: ['status'], density: 'compact' });

    fixture.destroy();
    fixture = TestBed.createComponent(TableComponent);
    component = fixture.componentInstance;
    component.config = {
      ...baseConfig,
      stateKey: 'table-spec',
      columns: [
        { field: 'id', header: 'ID', hideable: false },
        { field: 'name', header: 'Name' },
        { field: 'status', header: 'Status' }
      ]
    };
    component.ngOnChanges({
      config: {
        currentValue: component.config,
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true
      }
    });

    expect(component.selectedColumnFields()).toEqual(['status']);
    expect(component.density()).toBe('compact');
  });

  it('applies frozen column styles and keeps non-hideable actions visible from config', () => {
    localStorage.setItem(
      'dev-tool.table.frozen-actions',
      JSON.stringify({ columns: ['name'], density: 'compact' })
    );
    component.config = {
      ...baseConfig,
      stateKey: 'frozen-actions',
      minWidth: '90rem',
      columns: [
        { field: 'name', header: 'Name', minWidth: '16rem' },
        { field: 'status', header: 'Status', minWidth: '12rem' },
        {
          field: 'actions',
          header: 'Actions',
          type: 'actions',
          minWidth: '10rem',
          frozen: true,
          alignFrozen: 'right',
          hideable: false,
          actions: [{ label: 'View', onClick: vi.fn() }]
        }
      ]
    };
    component.data = [{ name: 'Alpha', status: 'ACTIVE' }];
    component.ngOnChanges({
      config: {
        currentValue: component.config,
        previousValue: baseConfig,
        firstChange: false,
        isFirstChange: () => false
      }
    });

    fixture.detectChanges();

    expect(component.selectedColumnFields()).toEqual(['name']);
    expect(component.visibleColumns.map((column) => column.field)).toEqual(['name', 'actions']);
    expect(component.columnOptions.map((option) => option.value)).toEqual(['name', 'status']);
    expect(fixture.nativeElement.querySelector('table')?.style.minWidth).toBe('90rem');

    const actionHeader = fixture.nativeElement.querySelector('thead th.app-table-cell--frozen-right') as HTMLElement;
    const actionCell = fixture.nativeElement.querySelector('tbody td.app-table-cell--frozen-right') as HTMLElement;

    expect(actionHeader).toBeTruthy();
    expect(actionCell).toBeTruthy();
    expect(actionHeader.style.right).toMatch(/^0(px)?$/);
    expect(actionCell.style.right).toMatch(/^0(px)?$/);

    component.onColumnFieldsChange([]);

    expect(component.visibleColumns.map((column) => column.field)).toEqual(['actions']);
  });

  it('uses a filtered empty state with clear filters action when search is active', () => {
    renderTable({ loading: false, data: [] });
    component.config = {
      ...baseConfig,
      emptyFilteredTitle: 'Filtered empty',
      emptyFilteredDescription: 'Adjust filters'
    };
    component.onSearch({ keyword: 'alpha' });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.empty-state')?.textContent).toContain('Filtered empty');
    expect(fixture.nativeElement.querySelector('.empty-state')?.textContent).toContain('Adjust filters');
  });

  it('confirms dangerous bulk actions before emitting selected rows', async () => {
    const actionClick = vi.fn();
    const bulkAction = vi.fn();
    const action: TableBulkAction = {
      id: 'delete',
      label: 'Delete',
      variant: 'danger',
      
      onClick: actionClick
    };
    const rows = [{ id: 1 }];
    component.config = {
      ...baseConfig,
      selection: { mode: 'multiple' },
      toolbar: { bulkActions: [action] }
    };
    component.selectedRows.set(rows);
    component.selectedRowKeys.set(['1']);
    component.bulkAction.subscribe(bulkAction);

    await component.onBulkAction(action);

    // confirm decoupled to feature in R06
    expect(actionClick).toHaveBeenCalledWith(rows);
    expect(bulkAction).toHaveBeenCalledWith({ action, rows });
  });

  it('runs row action callbacks at table boundary and emits actionClick to the page', () => {
    const row = { id: 1 };
    const action = {
      id: 'view',
      label: 'View',
      onClick: vi.fn()
    };
    const actionClick = vi.fn();
    component.actionClick.subscribe(actionClick);

    component.onActionClick({ action, row });

    expect(action.onClick).toHaveBeenCalledWith(row);
    expect(actionClick).toHaveBeenCalledWith({ action, row });
  });

  it('requires confirmation for danger bulk actions even when confirm config is omitted', async () => {
    const actionClick = vi.fn();
    const bulkAction = vi.fn();
    const action: TableBulkAction = {
      id: 'delete',
      label: 'Delete',
      variant: 'danger',
      onClick: actionClick
    };
    const rows = [{ id: 1 }];
    component.selectedRows.set(rows);
    component.selectedRowKeys.set(['1']);
    component.bulkAction.subscribe(bulkAction);

    await component.onBulkAction(action);

    // confirm decoupled to feature in R06
    expect(actionClick).toHaveBeenCalledWith(rows);
    expect(bulkAction).toHaveBeenCalledWith({ action, rows });
  });

    it('handles toolbar buttons and bulk actions visibility and state', () => {
    const action: TableBulkAction = {
      id: 'export-selected',
      label: 'Export selected',
      onClick: vi.fn()
    };
    component.config = {
      ...baseConfig,
      selection: { mode: 'multiple' },
      toolbar: {
        new: { visible: true },
        delete: { visible: false },
        bulkActions: [action]
      }
    };
    component.selectedRows.set([{ id: 1 }]);

    expect(component.isButtonVisible(component.newButtonConfig)).toBe(true);
    expect(component.isButtonDisabled(component.newButtonConfig)).toBe(false);
    expect(component.isButtonVisible(component.deleteButtonConfig)).toBe(false);
    expect(component.visibleBulkActions).toEqual([action]);
    expect(component.isBulkActionDisabled(action)).toBe(false);
  });

  function renderTable(state: Partial<Pick<TableComponent, 'loading' | 'error' | 'data'>>): void {
    fixture.destroy();
    fixture = TestBed.createComponent(TableComponent);
    component = fixture.componentInstance;
    component.config = baseConfig;
    component.loading = state.loading ?? false;
    component.error = state.error ?? null;
    component.data = state.data ?? [];
    fixture.detectChanges();
  }
});







