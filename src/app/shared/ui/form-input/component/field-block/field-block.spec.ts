import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '../../../../shared.module';
import { provideSharedTesting } from '../../../../testing/shared-test.providers';
import { FieldBlockComponent } from './field-block';

describe('FieldBlockComponent', () => {
  let component: FieldBlockComponent;
  let fixture: ComponentFixture<FieldBlockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting()
    }).compileComponents();

    fixture = TestBed.createComponent(FieldBlockComponent);
    component = fixture.componentInstance;
  });

  it('renders label, required marker and invalid state', () => {
    component.label = 'shared.field.name';
    component.required = true;
    component.invalid = true;
    component.errorMessage = 'shared.validation.required';
    component.inputId = 'field-name';

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('label')?.getAttribute('for')).toBe('field-name');
    expect(fixture.nativeElement.textContent).toContain('shared.field.name');
    expect(fixture.nativeElement.querySelector('.field-block--invalid')).toBeTruthy();
  });
});
