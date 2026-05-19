import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '../../../shared.module';
import { provideSharedTesting } from '../../../testing/shared-test.providers';
import { PermissionService } from '../../../../core/auth/permission.service';
import { ConfirmDialogService } from '../../overlay/confirm-dialog/confirm-dialog.service';
import { ActionToolbarComponent } from './action-toolbar.component';

describe('ActionToolbarComponent', () => {
  let fixture: ComponentFixture<ActionToolbarComponent>;
  let component: ActionToolbarComponent;
  let confirmDialogService: { confirm: ReturnType<typeof vi.fn> };
  let permissionService: { hasAll: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    confirmDialogService = { confirm: vi.fn().mockResolvedValue(true) };
    permissionService = { hasAll: vi.fn().mockReturnValue(true) };

    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: [
        ...provideSharedTesting(),
        { provide: ConfirmDialogService, useValue: confirmDialogService },
        { provide: PermissionService, useValue: permissionService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ActionToolbarComponent);
    component = fixture.componentInstance;
  });

  it('emits primary action clicks', async () => {
    const action = { id: 'create', label: 'Create', placement: 'primary' as const, variant: 'primary' as const };
    const emit = vi.spyOn(component.actionClick, 'emit');
    component.actions = [action];
    fixture.detectChanges();

    await component.emitAction(action);

    expect(emit).toHaveBeenCalledWith(action);
  });

  it('does not emit disabled or loading actions', async () => {
    const emit = vi.spyOn(component.actionClick, 'emit');

    await component.emitAction({ id: 'disabled', label: 'Disabled', disabled: true });
    await component.emitAction({ id: 'loading', label: 'Loading', loading: true });

    expect(emit).not.toHaveBeenCalled();
  });

  it('renders and emits more actions through the menu', async () => {
    const moreAction = { id: 'archive', label: 'Archive', placement: 'more' as const };
    const emit = vi.spyOn(component.actionClick, 'emit');
    component.actions = [moreAction];
    fixture.detectChanges();

    component.toggleMore();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="menu"]')).toBeTruthy();
    await component.emitAction(moreAction);

    expect(emit).toHaveBeenCalledWith(moreAction);
    expect(component.moreOpen()).toBe(false);
  });

  it('confirms danger actions before emitting', async () => {
    const action = {
      id: 'delete',
      label: 'Delete',
      variant: 'danger' as const,
      confirm: { message: 'Delete item?' }
    };
    const emit = vi.spyOn(component.actionClick, 'emit');

    await component.emitAction(action);

    expect(confirmDialogService.confirm).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Delete item?', variant: 'danger' })
    );
    expect(emit).toHaveBeenCalledWith(action);

    confirmDialogService.confirm.mockResolvedValueOnce(false);
    await component.emitAction(action);
    expect(emit).toHaveBeenCalledTimes(1);
  });

  it('requires a default confirm for danger actions even when confirm config is omitted', async () => {
    const action = {
      id: 'clear',
      label: 'Clear',
      variant: 'danger' as const
    };
    const emit = vi.spyOn(component.actionClick, 'emit');

    await component.emitAction(action);

    expect(confirmDialogService.confirm).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'shared.confirm.dangerAction', variant: 'danger' })
    );
    expect(emit).toHaveBeenCalledWith(action);
  });

  it('disables unauthorized actions with a permission tooltip', async () => {
    permissionService.hasAll.mockReturnValue(false);
    const action = { id: 'export', label: 'Export', permissions: ['REPORT_EXPORT'] };
    const emit = vi.spyOn(component.actionClick, 'emit');

    component.actions = [action];
    fixture.detectChanges();

    expect(component.visibleActions('secondary')).toEqual([action]);
    expect(component.isActionDisabled(action)).toBe(true);
    expect(component.actionTooltip(action)).toBe('shared.permission.deniedAction');

    await component.emitAction(action);
    expect(emit).not.toHaveBeenCalled();
  });
});
