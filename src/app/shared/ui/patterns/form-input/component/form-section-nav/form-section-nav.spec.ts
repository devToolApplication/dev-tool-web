import { FormResolvedSection } from '../../models/form-config.model';
import { FormSectionNavComponent } from './form-section-nav';

describe('FormSectionNavComponent', () => {
  let component: FormSectionNavComponent;

  beforeEach(() => {
    component = new FormSectionNavComponent();
  });

  it('tracks and emits section ids without owning form state', () => {
    const section = createSection('advanced');
    const sectionSelect = vi.spyOn(component.sectionSelect, 'emit');

    expect(component.trackBySection(0, section)).toBe('advanced');

    component.sectionSelect.emit(section.id);

    expect(sectionSelect).toHaveBeenCalledWith('advanced');
  });
});

function createSection(id: string): FormResolvedSection {
  return {
    id,
    title: id,
    order: 0,
    optional: false,
    disabled: false,
    collapsible: false,
    collapsed: false,
    fieldCount: 0,
    errorCount: 0,
    warningCount: 0,
    completed: false,
    active: false
  };
}
