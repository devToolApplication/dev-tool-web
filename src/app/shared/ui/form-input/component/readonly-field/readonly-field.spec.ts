import { createFieldState } from '../../../../testing/field-state.stub';
import { ReadonlyFieldComponent } from './readonly-field';

describe('ReadonlyFieldComponent', () => {
  let component: ReadonlyFieldComponent;

  beforeEach(() => {
    component = new ReadonlyFieldComponent();
  });

  it('maps field types and ui metadata into generic value display options', () => {
    component.field = createFieldState(
      {
        type: 'percent',
        name: 'successRate',
        label: 'Success rate',
        suffix: ' pct',
        ui: { copyable: true, prefix: '~' }
      },
      12
    );

    expect(component.displayType).toBe('percent');
    expect(component.isCopyable).toBe(true);
    expect(component.prefix).toBe('~');
    expect(component.suffix).toBe(' pct');
  });

  it('masks secret metadata and treats json-like fields as JSON display', () => {
    component.field = createFieldState(
      { type: 'secret-metadata', name: 'secretValue', label: 'Secret' },
      { token: 'secret' }
    );

    expect(component.displayType).toBe('json');
    expect(component.isJsonValue).toBe(true);
    expect(component.maskSecrets).toBe(true);
  });
});
