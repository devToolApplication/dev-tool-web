import { FormResolvedSection } from '../../models/form-config.model';
import { FormStatusPanelComponent } from './form-status-panel';

describe('FormStatusPanelComponent', () => {
  let component: FormStatusPanelComponent;

  beforeEach(() => {
    component = new FormStatusPanelComponent();
  });

  it('summarizes section completion, field totals and status priority', () => {
    component.sections = [
      createSection({ completed: true, fieldCount: 2 }),
      createSection({ completed: false, fieldCount: 3 })
    ];

    expect(component.completedCount).toBe(1);
    expect(component.totalFieldCount).toBe(5);
    expect(component.statusKey).toBe('shared.form.status.ready');
    expect(component.statusVariant).toBe('success');

    component.dirty = true;
    expect(component.statusKey).toBe('shared.form.status.unsaved');
    expect(component.statusVariant).toBe('warning');

    component.errorCount = 1;
    expect(component.statusKey).toBe('shared.form.status.fixErrors');
    expect(component.statusVariant).toBe('danger');
  });
});

function createSection(overrides: Partial<FormResolvedSection>): FormResolvedSection {
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
