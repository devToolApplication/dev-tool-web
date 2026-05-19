import { createArrayFieldState, createFieldState, createGroupFieldState } from '../../../../testing/field-state.stub';
import { ReadonlySectionComponent } from './readonly-section';

describe('ReadonlySectionComponent', () => {
  let component: ReadonlySectionComponent;

  beforeEach(() => {
    component = new ReadonlySectionComponent();
  });

  it('flattens child rows and exposes field type guards', () => {
    const group = createGroupFieldState();
    const textField = createFieldState({ type: 'text', name: 'name', label: 'Name' });
    group.children = [textField];
    component.field = group;

    expect(component.children).toEqual([textField]);
    expect(component.isGroupField(group)).toBe(true);
    expect(component.isArrayField(createArrayFieldState())).toBe(true);
    expect(component.isTreeField({ ...group, type: 'tree' } as never)).toBe(true);
    expect(component.getCol('1/2')).toContain('md:col-span-6');
  });
});
