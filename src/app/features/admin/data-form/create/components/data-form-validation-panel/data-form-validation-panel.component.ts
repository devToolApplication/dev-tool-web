import { Component, Input } from '@angular/core';

interface ValidationIssue {
  level: string;
  path?: string;
  message: string;
}

interface ValidationGroups {
  critical: ValidationIssue[];
  warnings: ValidationIssue[];
  suggestions: ValidationIssue[];
}

@Component({
  selector: 'app-data-form-validation-panel',
  standalone: false,
  templateUrl: './data-form-validation-panel.component.html'
})
export class DataFormValidationPanelComponent {
  @Input() validated = false;
  @Input() validationGroups: ValidationGroups = { critical: [], warnings: [], suggestions: [] };
}
