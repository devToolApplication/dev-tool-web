import { Component, Input } from '@angular/core';

export interface FieldGuideFieldItem {
  key: string;
  label: string;
  description: string;
}

export interface FieldGuideOptionItem {
  title: string;
  description: string;
}

@Component({
  selector: 'app-field-guide-panel',
  standalone: false,
  templateUrl: './field-guide-panel.component.html'
})
export class FieldGuidePanelComponent {
  @Input() title = 'Field Guide';
  @Input() description = '';
  @Input() fields: FieldGuideFieldItem[] = [];
  @Input() selections: FieldGuideOptionItem[] = [];
}
