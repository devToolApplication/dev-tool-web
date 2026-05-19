import { createFieldState } from '../../../../testing/field-state.stub';
import { JsonFieldBlockComponent } from './json-field-block';

describe('JsonFieldBlockComponent', () => {
  let component: JsonFieldBlockComponent;

  beforeEach(() => {
    component = new JsonFieldBlockComponent();
    component.field = createFieldState({ type: 'json', name: 'payload', label: 'Payload' }, '{"a":1}');
  });

  it('formats valid JSON and marks the field touched', () => {
    component.formatJson();

    expect(component.field.value()).toBe('{\n  "a": 1\n}');
    expect(component.field.touched()).toBe(true);
    expect(component.localError()).toBeNull();
  });

  it('keeps invalid JSON local to the block and preserves current value', () => {
    component.field.setValue('{bad');

    component.validateJson();

    expect(component.field.value()).toBe('{bad');
    expect(component.field.touched()).toBe(true);
    expect(component.localError()).toBe('shared.json.invalid');
  });
});
