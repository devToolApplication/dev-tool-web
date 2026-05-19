import { Component, Input, OnChanges, signal, SimpleChanges } from '@angular/core';
import { FormResolvedSection } from '../../models/form-config.model';

@Component({
  selector: 'app-form-section-card',
  standalone: false,
  templateUrl: './form-section-card.html',
  styleUrl: './form-section-card.css'
})
export class FormSectionCardComponent implements OnChanges {
  @Input({ required: true }) section!: FormResolvedSection;
  @Input() density: 'compact' | 'comfortable' | 'spacious' = 'comfortable';

  readonly collapsed = signal(false);

  ngOnChanges(changes: SimpleChanges): void {
    const sectionChange = changes['section'];
    const previous = sectionChange?.previousValue as FormResolvedSection | undefined;
    const sectionDefaultsChanged =
      !previous ||
      previous.id !== this.section?.id ||
      previous.collapsible !== this.section?.collapsible ||
      previous.collapsed !== this.section?.collapsed;

    if (sectionChange && sectionDefaultsChanged) {
      this.collapsed.set(this.section?.collapsible ? this.section.collapsed : false);
    }
  }

  toggleCollapsed(): void {
    if (!this.section?.collapsible) {
      return;
    }
    this.collapsed.update((value) => !value);
  }
}
