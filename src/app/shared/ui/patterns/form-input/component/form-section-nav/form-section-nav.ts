import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormResolvedSection } from '../../models/form-config.model';

@Component({
  selector: 'app-form-section-nav',
  standalone: false,
  templateUrl: './form-section-nav.html',
  styleUrl: './form-section-nav.css'
})
export class FormSectionNavComponent {
  @Input() sections: FormResolvedSection[] = [];
  @Input() mode: 'sidebar' | 'tabs' | 'dropdown' | 'none' = 'sidebar';

  @Output() sectionSelect = new EventEmitter<string>();

  trackBySection(_: number, section: FormResolvedSection): string {
    return section.id;
  }
}
