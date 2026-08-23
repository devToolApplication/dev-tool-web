import { TestBed } from '@angular/core/testing';
import type { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { ConfirmDialogService } from '@shared/ui/overlay/confirm-dialog/confirm-dialog.service';
import { serviceManagementUnsavedChangesGuard } from './service-management-unsaved-changes.guard';

describe('serviceManagementUnsavedChangesGuard', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = {} as RouterStateSnapshot;

  it('allows clean service-management forms to deactivate without confirmation', async () => {
    const confirm = vi.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: ConfirmDialogService, useValue: { confirm } }],
    });

    const result = await TestBed.runInInjectionContext(() =>
      serviceManagementUnsavedChangesGuard({ hasUnsavedChanges: () => false }, route, state, state),
    );

    expect(result).toBe(true);
    expect(confirm).not.toHaveBeenCalled();
  });

  it('asks for confirmation before deactivating dirty service-management forms', async () => {
    const confirm = vi.fn().mockResolvedValue(false);
    TestBed.configureTestingModule({
      providers: [{ provide: ConfirmDialogService, useValue: { confirm } }],
    });

    const result = await TestBed.runInInjectionContext(() =>
      serviceManagementUnsavedChangesGuard({ hasUnsavedChanges: () => true }, route, state, state),
    );

    expect(result).toBe(false);
    expect(confirm).toHaveBeenCalledWith({
      title: 'confirm',
      message: 'shared.form.confirmLeave',
      confirmText: 'yes',
      cancelText: 'cancel',
      variant: 'warning',
    });
  });
});
