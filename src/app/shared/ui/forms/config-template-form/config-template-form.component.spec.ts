import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '../../../shared.module';
import { provideSharedTesting } from '../../../testing/shared-test.providers';
import { ConfigTemplateFormComponent } from './config-template-form.component';

describe('ConfigTemplateFormComponent', () => {
  let fixture: ComponentFixture<ConfigTemplateFormComponent>;
  let component: ConfigTemplateFormComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting()
    }).compileComponents();

    fixture = TestBed.createComponent(ConfigTemplateFormComponent);
    component = fixture.componentInstance;
    component.config = {
      title: 'Generic form',
      fields: [
        {
          name: 'name',
          type: 'text',
          label: 'Name'
        }
      ]
    };
    component.context = { user: null, mode: 'edit' };
    component.initialValue = { name: 'Initial' };
  });

  it('wraps app-form-input and keeps advanced JSON collapsed by default', () => {
    fixture.detectChanges();

    expect(component.advancedCollapsed).toBe(true);
    expect(fixture.nativeElement.querySelector('app-form-input')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-section-panel')).toBeTruthy();
  });

  it('emits form value changes and resets JSON draft when input value changes', () => {
    const valueChange = vi.fn();
    component.valueChange.subscribe(valueChange);

    component.onValueChange({ name: 'Updated' });

    expect(component.currentValue()).toEqual({ name: 'Updated' });
    expect(valueChange).toHaveBeenCalledWith({ name: 'Updated' });
  });

  it('applies editable advanced JSON and reports invalid JSON safely', () => {
    const valueChange = vi.fn();
    component.valueChange.subscribe(valueChange);
    component.ngOnChanges({
      initialValue: {
        currentValue: { name: 'Initial' },
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true
      }
    });

    component.onAdvancedJsonChange('{"name":"From JSON"}');
    component.applyAdvancedJson();

    expect(component.formInitialValue()).toEqual({ name: 'From JSON' });
    expect(component.currentValue()).toEqual({ name: 'From JSON' });
    expect(component.advancedJsonError()).toBeNull();
    expect(valueChange).toHaveBeenCalledWith({ name: 'From JSON' });

    component.onAdvancedJsonChange('{broken');
    component.applyAdvancedJson();

    expect(component.advancedJsonError()).toBe('shared.json.invalid');
  });
});
