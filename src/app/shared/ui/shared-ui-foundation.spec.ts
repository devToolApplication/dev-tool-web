import { SimpleChange, Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '@shared/shared.module';
import { AvatarComponent } from '@shared/ui/primitives/avatar/avatar';
import { PrimeConfirmDialogComponent } from '@shared/ui/primitives/confirm-dialog/confirm-dialog';
import { DialogComponent } from '@shared/ui/primitives/dialog/dialog';
import { FluidComponent } from '@shared/ui/primitives/fluid/fluid';
import { IconFieldComponent } from '@shared/ui/primitives/icon-field/icon-field';
import { MessageComponent } from '@shared/ui/primitives/message/message';
import { PanelMenuComponent } from '@shared/ui/primitives/panel-menu/panel-menu';
import { PrimeBadgeComponent } from '@shared/ui/primitives/prime-badge/prime-badge';
import { RippleComponent } from '@shared/ui/primitives/ripple/ripple';
import { TieredMenuComponent } from '@shared/ui/primitives/tiered-menu/tiered-menu';
import { ToastComponent } from '@shared/ui/primitives/toast/toast';
import { ToolbarComponent } from '@shared/ui/primitives/toolbar/toolbar';
import { TooltipComponent } from '@shared/ui/primitives/tooltip/tooltip';
import { provideSharedTesting } from '@shared/testing/shared-test.providers';
import { BadgeComponent } from './data-display/badge/badge.component';
import { CopyableTextComponent } from './data-display/copyable-text/copyable-text.component';
import { DiffViewerComponent } from './data-display/diff-viewer/diff-viewer.component';
import { JsonViewerComponent } from './data-display/json-viewer/json-viewer.component';
import { KeyValueListComponent } from './data-display/key-value-list/key-value-list.component';
import { TimelineComponent as DataTimelineComponent } from './data-display/timeline/timeline.component';
import { AlertComponent } from './feedback/alert/alert.component';
import { EmptyStateComponent } from './feedback/empty-state/empty-state.component';
import { ErrorStateComponent } from './feedback/error-state/error-state.component';
import { LoadingSkeletonComponent } from './feedback/loading-skeleton/loading-skeleton.component';
import { FormInput } from './patterns/form-input/form-input';
import { ConfigTemplateFormComponent } from './forms/config-template-form/config-template-form.component';
import { ValidationSummaryComponent } from './forms/validation-summary/validation-summary.component';
import { ActionToolbarComponent } from './layout/action-toolbar/action-toolbar.component';
import { FilterPanelComponent } from './layout/filter-panel/filter-panel.component';
import { PageHeaderComponent } from './layout/page-header/page-header.component';
import { PageShellComponent } from './layout/page-shell/page-shell.component';
import { SectionPanelComponent } from './layout/section-panel/section-panel.component';
import { ConfirmDialogHostComponent } from './overlay/confirm-dialog/confirm-dialog-host.component';
import { DrawerComponent } from './overlay/drawer/drawer.component';
import { TableComponent } from './patterns/table/component/table/table';

describe('Shared UI foundation', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting()
    }).compileComponents();
  });

  it('should create generic feedback, overlay, layout and data-display components', () => {
    const components: Array<Type<unknown>> = [
      EmptyStateComponent,
      ErrorStateComponent,
      LoadingSkeletonComponent,
      AlertComponent,
      ConfirmDialogHostComponent,
      DrawerComponent,
      PageHeaderComponent,
      PageShellComponent,
      SectionPanelComponent,
      FilterPanelComponent,
      ActionToolbarComponent,
      BadgeComponent,
      CopyableTextComponent,
      JsonViewerComponent,
      KeyValueListComponent,
      DiffViewerComponent,
      DataTimelineComponent,
      ValidationSummaryComponent,
      AvatarComponent,
      DialogComponent,
      MessageComponent,
      TieredMenuComponent,
      ToastComponent,
      ToolbarComponent,
      PrimeBadgeComponent,
      PanelMenuComponent,
      PrimeConfirmDialogComponent,
      FluidComponent,
      IconFieldComponent,
      RippleComponent,
      TooltipComponent
    ];

    components.forEach((componentType) => {
      const fixture = TestBed.createComponent(componentType);
      fixture.detectChanges();
      expect(fixture.componentInstance).toBeTruthy();
      fixture.destroy();
    });
  });

  it('should expose table toolbar density and column visibility state', () => {
    const fixture = TestBed.createComponent(TableComponent);
    const component = fixture.componentInstance;
    component.config = {
      toolbar: {
        search: { visible: true },
        refresh: { visible: true },
        columnVisibility: { visible: true },
        density: { visible: true }
      },
      columns: [
        { field: 'id', header: 'id', type: 'copyable', hideable: false },
        { field: 'name', header: 'name', type: 'text' },
        { field: 'state', header: 'status', type: 'badge', visible: false }
      ]
    };
    component.data = [{ id: 'item-1', name: 'Alpha', state: 'ACTIVE' }];
    component.ngOnChanges({ config: new SimpleChange(undefined, component.config, true) });

    fixture.detectChanges();

    expect(component.visibleColumns.map((column) => column.field)).toEqual(['id', 'name']);

    component.onColumnFieldsChange([]);
    expect(component.visibleColumns.map((column) => column.field)).toEqual(['id']);

    component.onDensityChange('compact');
    expect(component.density()).toBe('compact');
  });

  it('should map API field errors into the shared form validation summary', async () => {
    const fixture: ComponentFixture<FormInput> = TestBed.createComponent(FormInput);
    const component = fixture.componentInstance;
    component.config = {
      fields: [
        {
          name: 'name',
          type: 'text',
          label: 'name'
        }
      ]
    };
    component.context = { user: null, mode: 'create' };
    component.initialValue = { name: '' };
    component.apiFieldErrors = [{ fieldPath: 'name', message: 'Name is already used' }];

    fixture.detectChanges();
    await fixture.whenStable();

    component.markAllAsTouched();

    expect(component.validationSummaryItems()).toEqual([
      {
        fieldPath: 'name',
        label: 'name',
        section: 'shared.form.section.general',
        message: 'Name is already used',
        severity: 'error'
      }
    ]);
  });

  it('should create config template form with advanced JSON collapsed by default', () => {
    const fixture = TestBed.createComponent(ConfigTemplateFormComponent);
    const component = fixture.componentInstance;
    component.config = { fields: [] };
    component.context = { user: null, mode: 'create' };
    component.initialValue = {};

    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(component.advancedCollapsed).toBe(true);
  });
});
