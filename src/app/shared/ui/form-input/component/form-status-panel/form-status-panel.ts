import { Component, Input } from '@angular/core';
import { FormResolvedSection } from '../../models/form-config.model';

@Component({
  selector: 'app-form-status-panel',
  standalone: false,
  templateUrl: './form-status-panel.html',
  styleUrl: './form-status-panel.css'
})
export class FormStatusPanelComponent {
  @Input() sections: FormResolvedSection[] = [];
  @Input() dirty = false;
  @Input() submitting = false;
  @Input() loading = false;
  @Input() readonly = false;
  @Input() errorCount = 0;
  @Input() warningCount = 0;
  @Input() mode: 'create' | 'edit' | 'view' | undefined;

  get completedCount(): number {
    return this.sections.filter((section) => section.completed).length;
  }

  get totalFieldCount(): number {
    return this.sections.reduce((total, section) => total + section.fieldCount, 0);
  }

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
    return 'shared.form.status.ready';
  }

  get statusVariant(): 'success' | 'warning' | 'danger' | 'info' | 'muted' {
    if (this.errorCount > 0) {
      return 'danger';
    }
    if (this.warningCount > 0 || this.dirty) {
      return 'warning';
    }
    if (this.readonly) {
      return 'muted';
    }
    return 'success';
  }
}
