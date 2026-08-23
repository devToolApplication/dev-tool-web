import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { ConfirmDialogService } from '@shared/ui/overlay/confirm-dialog/confirm-dialog.service';

export interface ServiceManagementUnsavedChangesAware {
  hasUnsavedChanges?: () => boolean;
  confirmDiscardChanges?: () => Promise<boolean> | boolean;
}

export const serviceManagementUnsavedChangesGuard: CanDeactivateFn<
  ServiceManagementUnsavedChangesAware
> = async (component) => {
  if (!component.hasUnsavedChanges?.()) {
    return true;
  }

  if (component.confirmDiscardChanges) {
    return await component.confirmDiscardChanges();
  }

  return await inject(ConfirmDialogService).confirm({
    title: 'confirm',
    message: 'shared.form.confirmLeave',
    confirmText: 'yes',
    cancelText: 'cancel',
    variant: 'warning',
  });
};
