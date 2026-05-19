import { FieldGuidePanelComponent } from './field-guide-panel.component';

describe('FieldGuidePanelComponent', () => {
  let component: FieldGuidePanelComponent;

  beforeEach(() => {
    component = new FieldGuidePanelComponent();
  });

  it('reports whether any guide content is available', () => {
    expect(component.hasBody).toBe(false);

    component.fields = [{ key: 'code', label: 'Code', description: 'Unique code' }];

    expect(component.hasBody).toBe(true);
  });

  it('toggles only when collapsible', () => {
    component.toggleCollapsed();
    expect(component.collapsed()).toBe(true);

    component.collapsible = false;
    component.toggleCollapsed();

    expect(component.collapsed()).toBe(true);
  });
});
