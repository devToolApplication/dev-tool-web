import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormResolvedSection } from '../../models/form-config.model';
import { ValidationSummaryItem } from '../../../forms/validation-summary/validation-summary.component';

@Component({
  selector: 'app-smart-form-shell',
  standalone: false,
  templateUrl: './smart-form-shell.html',
  styleUrl: './smart-form-shell.css'
})
export class SmartFormShellComponent {
  @Input() title?: string;
  @Input() description?: string;
  @Input() sections: FormResolvedSection[] = [];
  @Input() validationItems: ValidationSummaryItem[] = [];
  @Input() apiError?: string | null;
  @Input() loading = false;
  @Input() submitting = false;
  @Input() dirty = false;
  @Input() readonly = false;
  @Input() showSubmit = true;
  @Input() showStatusPanel = true;
  @Input() showValidationSummary = true;
  @Input() sectionNavigation: 'sidebar' | 'tabs' | 'dropdown' | 'none' = 'sidebar';
  @Input() density: 'compact' | 'comfortable' | 'spacious' = 'comfortable';
  @Input() submitDisabled = false;
  @Input() submitLabel = 'shared.form.actions.saveChanges';
  @Input() cancelLabel = 'cancel';
  @Input() resetLabel = 'reset';
  @Input() reviewErrorsLabel = 'shared.form.actions.reviewErrors';
  @Input() showCancel = false;
  @Input() showReset = false;
  @Input() mode: 'create' | 'edit' | 'view' | undefined;
  @Input() errorCount = 0;
  @Input() warningCount = 0;

  @Output() submitRequested = new EventEmitter<void>();
  @Output() sectionSelect = new EventEmitter<string>();
  @Output() summaryItemClick = new EventEmitter<ValidationSummaryItem>();
  @Output() reviewErrors = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() reset = new EventEmitter<void>();
}
