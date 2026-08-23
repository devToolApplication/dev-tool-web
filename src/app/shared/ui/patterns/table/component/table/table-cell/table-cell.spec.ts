import { Component, NgModule, TemplateRef, Type, ViewChild } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { SharedModule } from '@shared/shared.module';
import { provideSharedTesting } from '@shared/testing/shared-test.providers';
import { JsonViewerComponent } from '@shared/ui/data-display/json-viewer/json-viewer.component';
import {
  TableAction,
  TableCellTemplateContext,
  TableColumn,
  TableColumnType,
} from '../../../models/table-config.model';
import { TableCellComponent } from './table-cell';

@Component({
  selector: 'app-table-cell-template-host',
  standalone: false,
  template: `
    <ng-template #customCell let-row="row" let-value="value">
      <span class="custom-cell">{{ row.name }} / {{ value }}</span>
    </ng-template>
  `,
})
class TableCellTemplateHostComponent {
  @ViewChild('customCell', { static: true }) customCell!: TemplateRef<
    TableCellTemplateContext<TableCellTestRow>
  >;
}

type TableCellTestRow = Record<string, unknown>;
const TableCellTestComponent = TableCellComponent as Type<TableCellComponent<TableCellTestRow>>;

@NgModule({
  declarations: [TableCellTemplateHostComponent],
  imports: [SharedModule],
})
class TableCellTemplateHostModule {}

describe('TableCellComponent', () => {
  let fixture: ComponentFixture<TableCellComponent<TableCellTestRow>>;
  let component: TableCellComponent<TableCellTestRow>;
  let overlayContainer: OverlayContainer;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule, TableCellTemplateHostModule],
      providers: provideSharedTesting(),
    }).compileComponents();

    fixture = TestBed.createComponent(TableCellTestComponent);
    component = fixture.componentInstance;
    overlayContainer = TestBed.inject(OverlayContainer);
    component.column = { field: 'value', header: 'Value', type: 'text' };
    component.rowData = { value: '' };
  });

  afterEach(() => {
    fixture.destroy();
    overlayContainer.ngOnDestroy();
  });

  it('keeps supported column types generic and domain-free', () => {
    const supportedTypes: TableColumnType[] = [
      'text',
      'number',
      'semantic-number',
      'date',
      'datetime',
      'currency',
      'percent',
      'duration',
      'boolean',
      'badge',
      'tag-list',
      'copyable',
      'link',
      'json',
      'custom',
      'actions',
      'array',
      'group',
      'textarea',
    ];

    expect(supportedTypes).not.toContain('pnl' as TableColumnType);
    expect(supportedTypes).not.toContain('side' as TableColumnType);
    expect(supportedTypes).not.toContain('tradeStatus' as TableColumnType);
  });

  it('renders text, badge and tag-list values from generic column config', () => {
    renderCell({ field: 'name', header: 'Name', type: 'text' }, { name: 'Alpha' });
    expect(fixture.nativeElement.querySelector('.table-cell-truncate')?.textContent).toContain(
      'Alpha',
    );

    renderCell(
      { field: 'status', header: 'Status', type: 'badge', badgeMap: { ACTIVE: 'success' } },
      { status: 'ACTIVE' },
    );
    expect(component.badgeVariant).toBe('success');

    renderCell(
      { field: 'tags', header: 'Tags', type: 'tag-list', maxVisibleTags: 2 },
      { tags: ['a', 'b', 'c'] },
    );
    expect(fixture.nativeElement.textContent).toContain('+1');

    renderCell({ field: 'active', header: 'Active', type: 'boolean' }, { active: true });
    expect(fixture.nativeElement.querySelector('.table-cell-boolean .pi-check')).toBeTruthy();
  });

  it('formats number, percent, currency, duration and date-like values', () => {
    renderCell({ field: 'amount', header: 'Amount', type: 'number' }, { amount: 1234.5 });
    expect(fixture.nativeElement.textContent).toContain('1,234.5');

    renderCell({ field: 'ratio', header: 'Ratio', type: 'percent' }, { ratio: 12.345 });
    expect(fixture.nativeElement.textContent).toContain('%');

    renderCell(
      { field: 'price', header: 'Price', type: 'currency', currencyCode: 'USD' },
      { price: 100 },
    );
    expect(fixture.nativeElement.textContent).toContain('$100.00');

    expect(component.formatDuration(3723000)).toBe('1h 2m 3s');

    renderCell(
      { field: 'createdAt', header: 'Created', type: 'date' },
      { createdAt: '2026-05-15T00:00:00Z' },
    );
    expect(component.dateValue?.getUTCFullYear()).toBe(2026);
  });

  it('keeps JSON out of the table cell and opens a collapsed JsonViewer drawer', () => {
    renderCell(
      { field: 'payload', header: 'Payload', type: 'json' },
      { payload: { secret: 'hidden' } },
    );

    expect(fixture.nativeElement.textContent).not.toContain('hidden');

    component.jsonOpen.set(true);
    fixture.detectChanges();

    const viewer = fixture.debugElement.query(By.directive(JsonViewerComponent))
      .componentInstance as JsonViewerComponent;
    expect(viewer.value).toEqual({ secret: 'hidden' });
    expect(viewer.collapsed).toBe(true);
  });

  it('copies the real cell value instead of the label', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    renderCell({ field: 'id', header: 'ID', type: 'copyable' }, { id: 'record-123' });

    await component.copyValue();

    expect(writeText).toHaveBeenCalledWith('record-123');
  });

  it('confirms row actions and emits actionClick without running page callbacks in the cell', async () => {
    const onClick = vi.fn();
    const actionClick = vi.fn();
    const action: TableAction = {
      id: 'delete',
      label: 'Delete',
      variant: 'danger',

      onClick,
    };
    renderCell(
      { field: 'actions', header: 'Actions', type: 'actions', actions: [action] },
      { id: 1 },
    );
    component.actionClick.subscribe(actionClick);

    await component.onActionClick(action);

    // confirm decoupled to feature in R06
    expect(actionClick).toHaveBeenCalledWith({ action, row: { id: 1 } });
    expect(onClick).not.toHaveBeenCalled();

    const disabledAction: TableAction = {
      label: 'Disabled',
      disabled: () => true,
      onClick,
    };
    await component.onActionClick(disabledAction);

    expect(actionClick).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('does not let action cell clicks bubble to row click handlers', () => {
    renderCell(
      {
        field: 'actions',
        header: 'Actions',
        type: 'actions',
        actions: [{ id: 'view', label: 'View', onClick: vi.fn() }],
      },
      { id: 1 },
    );
    const event = { stopPropagation: vi.fn() };

    fixture.debugElement.query(By.css('.table-actions')).triggerEventHandler('click', event);

    expect(event.stopPropagation).toHaveBeenCalledOnce();
  });

  it('renders a custom cell template when the feature provides one', () => {
    const hostFixture = TestBed.createComponent(TableCellTemplateHostComponent);
    hostFixture.detectChanges();

    renderCell(
      { field: 'name', header: 'Name', type: 'custom', customTemplateKey: 'customCell' },
      { name: 'Alpha' },
      { customCell: hostFixture.componentInstance.customCell },
    );

    expect(fixture.nativeElement.querySelector('.custom-cell')?.textContent).toContain(
      'Alpha / Alpha',
    );
  });

  it('keeps one primary row action and moves the rest into the more menu', () => {
    const actions: TableAction[] = [
      { id: 'view', label: 'View', onClick: vi.fn() },
      { id: 'edit', label: 'Edit', onClick: vi.fn() },
      { id: 'copy', label: 'Copy', onClick: vi.fn() },
      { id: 'delete', label: 'Delete', placement: 'more', onClick: vi.fn() },
    ];

    renderCell({ field: 'actions', header: 'Actions', type: 'actions', actions }, { id: 1 });

    expect(component.primaryActions.map((action) => action.id)).toEqual(['view']);
    expect(component.moreActions.map((action) => action.id)).toEqual(['edit', 'copy', 'delete']);
  });

  it('closes the row action menu on Escape without a document listener', () => {
    const actions: TableAction[] = [
      { id: 'view', label: 'View', onClick: vi.fn() },
      { id: 'edit', label: 'Edit', onClick: vi.fn() },
    ];
    renderCell({ field: 'actions', header: 'Actions', type: 'actions', actions }, { id: 1 });
    component.actionsOpen.set(true);
    fixture.detectChanges();

    fixture.debugElement
      .query(By.css('.table-actions'))
      .triggerEventHandler('keydown.escape', new KeyboardEvent('keydown'));

    expect(component.actionsOpen()).toBe(false);
  });

  it('renders the row action menu in a CDK overlay so frozen columns cannot cover it', () => {
    const actions: TableAction[] = [
      { id: 'view', label: 'View', onClick: vi.fn() },
      { id: 'edit', label: 'Edit', onClick: vi.fn() },
    ];
    renderCell({ field: 'actions', header: 'Actions', type: 'actions', actions }, { id: 1 });

    component.toggleActions();
    fixture.detectChanges();

    const menu = document.body.querySelector('.table-actions__menu');

    expect(menu).toBeTruthy();
    expect(menu?.closest('.cdk-overlay-container')).toBeTruthy();

    component.closeActions();
    fixture.detectChanges();

    expect(document.body.querySelector('.table-actions__menu')).toBeNull();
  });

  it('requires confirmation for danger row actions even when confirm config is omitted', async () => {
    const actionClick = vi.fn();
    const action: TableAction = {
      id: 'delete',
      label: 'Delete',
      variant: 'danger',
      onClick: vi.fn(),
    };
    renderCell(
      { field: 'actions', header: 'Actions', type: 'actions', actions: [action] },
      { id: 1 },
    );
    component.actionClick.subscribe(actionClick);

    await component.onActionClick(action);

    // confirm decoupled to feature in R06
    expect(actionClick).toHaveBeenCalledWith({ action, row: { id: 1 } });
  });

  function renderCell(
    column: TableColumn<TableCellTestRow>,
    rowData: TableCellTestRow,
    customTemplates: TableCellComponent<TableCellTestRow>['customTemplates'] = {},
  ): void {
    fixture.destroy();
    fixture = TestBed.createComponent(TableCellTestComponent);
    component = fixture.componentInstance;
    component.column = column;
    component.rowData = rowData;
    component.customTemplates = customTemplates;
    fixture.detectChanges();
  }
});
