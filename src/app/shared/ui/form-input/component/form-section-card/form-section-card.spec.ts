import { SimpleChange } from '@angular/core';

import { FormResolvedSection } from '../../models/form-config.model';
import { FormSectionCardComponent } from './form-section-card';

describe('FormSectionCardComponent', () => {
  let component: FormSectionCardComponent;

  beforeEach(() => {
    component = new FormSectionCardComponent();
  });

  it('applies section collapsed defaults and toggles only collapsible sections', () => {
    const section = createSection({ id: 'advanced', collapsible: true, collapsed: true });
    component.section = section;

    component.ngOnChanges({ section: new SimpleChange(undefined, section, true) });
    expect(component.collapsed()).toBe(true);

    component.toggleCollapsed();
    expect(component.collapsed()).toBe(false);

    component.section = createSection({ id: 'general', collapsible: false, collapsed: true });
    component.toggleCollapsed();
    expect(component.collapsed()).toBe(false);
  });
});

function createSection(overrides: Partial<FormResolvedSection> = {}): FormResolvedSection {
  return {
    id: 'section',
    title: 'Section',
    order: 0,
    optional: false,
    disabled: false,
    collapsible: false,
    collapsed: false,
    fieldCount: 0,
    errorCount: 0,
    warningCount: 0,
    completed: false,
    active: false,
    ...overrides
  };
}
