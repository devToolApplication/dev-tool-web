import { BaseCrudPageComponent } from './base-crud-page.component';
import type { BaseCrudPageConfig } from './base-crud-page.model';

describe('BaseCrudPageComponent', () => {
  const config: BaseCrudPageConfig = {
    title: 'Test page',
    form: {
      fields: []
    },
    actions: [
      { id: 'save', label: 'Save', kind: 'submit' },
      { id: 'preview', label: 'Preview', kind: 'button' },
      { id: 'disabled', label: 'Disabled', kind: 'button', disabled: true },
      { id: 'loading', label: 'Loading', kind: 'button', loading: true },
      { id: 'hidden', label: 'Hidden', kind: 'button', visible: false }
    ]
  };

  it('submits the wrapped form for submit actions', () => {
    const component = createComponent();
    const formInput = {
      onSubmit: vi.fn(),
      isDirty: vi.fn().mockReturnValue(false),
      resetDirtyState: vi.fn()
    };
    (component as unknown as { formInput: typeof formInput }).formInput = formInput;

    component.onActionClick(config.actions![0]);
    component.submitForm();
    component.busy = true;
    component.onActionClick(config.actions![0]);

    expect(formInput.onSubmit).toHaveBeenCalledTimes(2);
  });

  it('emits button actions and ignores unavailable actions', () => {
    const component = createComponent();
    const emitted: unknown[] = [];
    component.action.subscribe((event) => emitted.push(event));

    config.actions!.slice(1).forEach((action) => component.onActionClick(action));

    expect(emitted).toEqual([config.actions![1]]);
  });

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

  function createComponent(): BaseCrudPageComponent {
    return new BaseCrudPageComponent();
  }
});
