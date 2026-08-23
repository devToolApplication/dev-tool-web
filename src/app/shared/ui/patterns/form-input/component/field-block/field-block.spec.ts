import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SharedModule } from '@shared/shared.module';
import { provideSharedTesting } from '@shared/testing/shared-test.providers';
import { FieldBlockComponent } from './field-block';

describe('FieldBlockComponent (FormField foundation)', () => {
  let component: FieldBlockComponent;
  let fixture: ComponentFixture<FieldBlockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting(),
    }).compileComponents();

    fixture = TestBed.createComponent(FieldBlockComponent);
    component = fixture.componentInstance;
  });

  it('renders label with required indicator and connects controlId', () => {
    component.label = 'Username';
    component.required = true;
    component.inputId = 'username-input';
    fixture.detectChanges();

    const label: HTMLLabelElement = fixture.nativeElement.querySelector('label');
    expect(label.getAttribute('for')).toBe('username-input');
    expect(fixture.nativeElement.querySelector('.field-block__required')).toBeTruthy();
  });

  it('renders description and creates describedBy id connection', () => {
    component.inputId = 'field-1';
    component.description = 'Helper description';
    component.hint = 'Format hint';
    fixture.detectChanges();

    expect(component.describedBy).toBe('field-1-description field-1-hint');
    const desc = fixture.nativeElement.querySelector('#field-1-description');
    expect(desc).toBeTruthy();
  });

  it('displays error in place of hint when invalid', () => {
    component.inputId = 'field-1';
    component.hint = 'Format hint';
    component.errorMessage = 'Field is required';
    component.invalid = true;
    fixture.detectChanges();

    expect(component.describedBy).toBe('field-1-error');
    const error = fixture.nativeElement.querySelector('.field-block__error');
    const hint = fixture.nativeElement.querySelector('.field-block__hint');
    expect(error).toBeTruthy();
    expect(hint).toBeNull();
  });
});
