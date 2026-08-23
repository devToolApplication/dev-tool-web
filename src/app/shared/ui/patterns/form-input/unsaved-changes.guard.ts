import { inject } from '@angular/core';
import type { CanDeactivateFn } from '@angular/router';
import { ConfirmDialogService } from '@shared/ui/overlay/confirm-dialog/confirm-dialog.service';

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

  return await inject(ConfirmDialogService).confirm({
    title: 'confirm',
    message: 'shared.form.confirmLeave',
    confirmText: 'yes',
    cancelText: 'cancel',
    variant: 'warning',
  });
};
