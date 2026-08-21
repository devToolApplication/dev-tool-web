import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-sticky-form-actions',
  standalone: false,
  templateUrl: './sticky-form-actions.html',
  styleUrl: './sticky-form-actions.css'
})
export class StickyFormActionsComponent {
  @Input() showSubmit = true;
  @Input() showCancel = false;
  @Input() showReset = false;
  @Input() dirty = false;
  @Input() submitting = false;
  @Input() loading = false;
  @Input() readonly = false;
  @Input() submitDisabled = false;
  @Input() errorCount = 0;
  @Input() warningCount = 0;
  @Input() submitLabel = 'shared.form.actions.saveChanges';
  @Input() cancelLabel = 'cancel';
  @Input() resetLabel = 'reset';
  @Input() reviewErrorsLabel = 'shared.form.actions.reviewErrors';

  @Output() cancel = new EventEmitter<void>();
  @Output() reset = new EventEmitter<void>();
  @Output() reviewErrors = new EventEmitter<void>();

  get statusKey(): string {
    if (this.loading) {
      return 'shared.form.status.loading';
    }
    if (this.submitting) {
      return 'shared.form.status.saving';
    }
    if (this.readonly) {
      return 'shared.form.status.readonly';
    }
    if (this.errorCount > 0) {
      return 'shared.form.status.fixErrors';
    }
    if (this.dirty) {
      return 'shared.form.status.unsaved';
    }
    if (this.warningCount > 0) {
      return 'shared.form.status.hasWarnings';
    }
    return 'shared.form.status.ready';
  }
}
