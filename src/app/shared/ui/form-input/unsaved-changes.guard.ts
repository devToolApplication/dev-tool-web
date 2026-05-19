import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { ConfirmDialogService } from '../overlay/confirm-dialog/confirm-dialog.service';

export interface UnsavedChangesAware {
  hasUnsavedChanges?: () => boolean;
  confirmDiscardChanges?: () => Promise<boolean> | boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<UnsavedChangesAware> = async (component) => {
  if (!component.hasUnsavedChanges?.()) {
    return true;
  }

  if (component.confirmDiscardChanges) {
    return await component.confirmDiscardChanges();
  }

  const confirmDialogService = inject(ConfirmDialogService);
  return await confirmDialogService.confirm({
    title: 'confirm',
    message: 'shared.form.confirmLeave',
    confirmText: 'yes',
    cancelText: 'cancel',
    variant: 'warning'
  });
};
