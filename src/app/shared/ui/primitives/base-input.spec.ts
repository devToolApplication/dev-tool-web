import { BaseInput } from './base-input';

class TestInput extends BaseInput<string> {}

describe('BaseInput', () => {
  let input: TestInput;

  beforeEach(() => {
    input = new TestInput();
  });

  it('implements the ControlValueAccessor value and disabled contract', () => {
    const onChange = vi.fn();
    const valueChange = vi.spyOn(input.valueChange, 'emit');

    input.registerOnChange(onChange);
    input.writeValue('initial');
    input.setDisabledState(true);
    input.onChange('next');

    expect(input.value).toBe('next');
    expect(input.disabled).toBe(true);
    expect(onChange).toHaveBeenCalledWith('next');
    expect(valueChange).toHaveBeenCalledWith('next');
  });

  it('emits focus and blur while marking the control as touched', () => {
    const onTouched = vi.fn();
    const focus = vi.spyOn(input.focus, 'emit');
    const blur = vi.spyOn(input.blur, 'emit');

    input.registerOnTouched(onTouched);
    input.onFocus();
    input.onBlur();

    expect(focus).toHaveBeenCalled();
    expect(onTouched).toHaveBeenCalled();
    expect(blur).toHaveBeenCalled();
  });
});
