import { of } from 'rxjs';
import { CreateDataFormPageComponent } from './create-data-form-page.component';

describe('CreateDataFormPageComponent', () => {
  it('disables create until required screen values match the JSON config', () => {
    const { component } = createComponent();

    expect(component.canSubmit()).toBe(false);

    fillMatchingGeneralInfo(component);

    expect(component.totalCriticalCount()).toBe(0);
    expect(component.canSubmit()).toBe(true);
  });

  it('keeps create disabled when the form code already exists', async () => {
    const { component, dataFormService } = createComponent({ codeExists: true });
    fillMatchingGeneralInfo(component);

    await component.onValidate();

    expect(dataFormService.checkCodeExists).toHaveBeenCalledWith('CUSTOMER_REGISTER');
    expect(component.canSubmit()).toBe(false);
    expect(component.generalErrorFor('formCode')).toBe('dataForm.validation.formCodeDuplicated');
  });

  it('does not call create when validation has critical errors', async () => {
    const { component, dataFormService, toastService } = createComponent();

    await component.onCreate();

    expect(dataFormService.create).not.toHaveBeenCalled();
    expect(toastService.error).toHaveBeenCalledWith('dataForm.toast.createBlocked');
  });

  function fillMatchingGeneralInfo(component: CreateDataFormPageComponent): void {
    component.onFormNameChange('Customer Register');
    component.onFormCodeChange('CUSTOMER_REGISTER');
  }

  function createComponent(options: { codeExists?: boolean; permissions?: string[] } = {}) {
    const permissions = new Set(options.permissions ?? ['FORM_CONFIG_CREATE', 'FORM_CONFIG_IMPORT', 'FORM_CONFIG_EXPORT', 'FORM_CONFIG_UPDATE']);
    const dataFormService = {
      create: vi.fn().mockReturnValue(of({ id: 'form-1' })),
      checkCodeExists: vi.fn().mockReturnValue(of(options.codeExists === true))
    };
    const loadingService = {
      track: vi.fn((request$) => request$)
    };
    const toastService = {
      success: vi.fn(),
      error: vi.fn()
    };
    const confirmDialogService = {
      confirm: vi.fn().mockResolvedValue(true)
    };
    const router = {
      navigate: vi.fn().mockResolvedValue(true)
    };
    const i18nService = {
      t: vi.fn((key: string, params?: Record<string, unknown>) => {
        if (!params) {
          return key;
        }
        return Object.entries(params).reduce((message, [name, value]) => message.replace(`{{${name}}}`, String(value)), key);
      })
    };
    const permissionService = {
      has: vi.fn((permission: string) => permissions.has(permission))
    };

    const component = new CreateDataFormPageComponent(
      dataFormService as never,
      loadingService as never,
      toastService as never,
      confirmDialogService as never,
      router as never,
      i18nService as never,
      permissionService as never
    );

    return { component, dataFormService, toastService, permissionService };
  }
});
