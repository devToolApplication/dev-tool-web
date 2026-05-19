import { Component, EventEmitter, Input, Output } from '@angular/core';

export type ValidationSummarySeverity = 'error' | 'warning';

export interface ValidationSummaryItem {
  fieldPath?: string;
  label?: string;
  message: string;
  section?: string;
  severity?: ValidationSummarySeverity;
  nodeId?: string;
}

@Component({
  selector: 'app-validation-summary',
  standalone: false,
  templateUrl: './validation-summary.component.html',
  styleUrl: './validation-summary.component.css'
})
export class ValidationSummaryComponent {
  @Input() items: ValidationSummaryItem[] = [];
  @Input() title = 'shared.validation.title';

  @Output() itemClick = new EventEmitter<ValidationSummaryItem>();

  get errorCount(): number {
    return this.items.filter((item) => (item.severity ?? 'error') === 'error').length;
  }

  get warningCount(): number {
    return this.items.filter((item) => item.severity === 'warning').length;
  }
}
