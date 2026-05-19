import { BaseCrudPageComponent } from './base-crud-page.component';

describe('BaseCrudPageComponent', () => {
  it('exposes dirty state and can mark the wrapped form pristine', () => {
    const formInput = {
      isDirty: vi.fn().mockReturnValue(true),
      resetDirtyState: vi.fn()
    };
    const component = createComponent();
    (component as unknown as { formInput: typeof formInput }).formInput = formInput;

    expect(component.hasUnsavedChanges()).toBe(true);

    component.markFormPristine();

    expect(formInput.resetDirtyState).toHaveBeenCalled();
  });

  it('confirms navigation only when the wrapped form is dirty', async () => {
    const confirm = vi.fn().mockResolvedValue(true);
    const component = createComponent(confirm);

    await expect(component.confirmDiscardChanges()).resolves.toBe(true);
    expect(confirm).not.toHaveBeenCalled();

    (component as unknown as { formInput: { isDirty: () => boolean } }).formInput = {
      isDirty: () => true
    };

    await expect(component.confirmDiscardChanges()).resolves.toBe(true);

    expect(confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'shared.form.confirmLeave',
        variant: 'warning'
      })
    );
  });

  function createComponent(confirm = vi.fn().mockResolvedValue(true)): BaseCrudPageComponent {
    return new BaseCrudPageComponent(
      { back: vi.fn() } as never,
      { navigate: vi.fn(), navigateByUrl: vi.fn() } as never,
      { confirm } as never
    );
  }
});
