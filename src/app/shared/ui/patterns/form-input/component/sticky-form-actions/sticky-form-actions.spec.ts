import { StickyFormActionsComponent } from './sticky-form-actions';

describe('StickyFormActionsComponent', () => {
  let component: StickyFormActionsComponent;

  beforeEach(() => {
    component = new StickyFormActionsComponent();
  });

  it('prioritizes loading, saving, readonly, error, dirty and warning status labels', () => {
    expect(component.statusKey).toBe('shared.form.status.ready');

    component.warningCount = 1;
    expect(component.statusKey).toBe('shared.form.status.hasWarnings');

    component.dirty = true;
    expect(component.statusKey).toBe('shared.form.status.unsaved');

    component.errorCount = 1;
    expect(component.statusKey).toBe('shared.form.status.fixErrors');

    component.readonly = true;
    expect(component.statusKey).toBe('shared.form.status.readonly');

    component.submitting = true;
    expect(component.statusKey).toBe('shared.form.status.saving');

    component.loading = true;
    expect(component.statusKey).toBe('shared.form.status.loading');
  });

  it('emits secondary action requests', () => {
    const cancel = vi.spyOn(component.cancel, 'emit');
    const reset = vi.spyOn(component.reset, 'emit');
    const reviewErrors = vi.spyOn(component.reviewErrors, 'emit');

    component.cancel.emit();
    component.reset.emit();
    component.reviewErrors.emit();

    expect(cancel).toHaveBeenCalled();
    expect(reset).toHaveBeenCalled();
    expect(reviewErrors).toHaveBeenCalled();
  });
});
