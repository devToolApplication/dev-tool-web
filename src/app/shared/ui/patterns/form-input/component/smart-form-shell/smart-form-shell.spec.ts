import { SmartFormShellComponent } from './smart-form-shell';

describe('SmartFormShellComponent', () => {
  let component: SmartFormShellComponent;

  beforeEach(() => {
    component = new SmartFormShellComponent();
  });

  it('emits orchestration events without owning submit or navigation behavior', () => {
    const submitRequested = vi.spyOn(component.submitRequested, 'emit');
    const sectionSelect = vi.spyOn(component.sectionSelect, 'emit');
    const cancel = vi.spyOn(component.cancel, 'emit');
    const reset = vi.spyOn(component.reset, 'emit');

    component.submitRequested.emit();
    component.sectionSelect.emit('advanced');
    component.cancel.emit();
    component.reset.emit();

    expect(submitRequested).toHaveBeenCalled();
    expect(sectionSelect).toHaveBeenCalledWith('advanced');
    expect(cancel).toHaveBeenCalled();
    expect(reset).toHaveBeenCalled();
  });
});
