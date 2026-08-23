import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '@shared/shared.module';
import { provideSharedTesting } from '@shared/testing/shared-test.providers';
import { InputText } from './input-text';

describe('InputText', () => {
  let component: InputText;
  let fixture: ComponentFixture<InputText>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, SharedModule],
      providers: provideSharedTesting(),
    }).compileComponents();

    fixture = TestBed.createComponent(InputText);
    component = fixture.componentInstance;
  });

  it('binds input value, autocomplete, name and connects describedBy', async () => {
    component.inputId = 'test-input';
    component.name = 'user-email';
    component.autocomplete = 'email';
    component.describedBy = 'test-input-hint';
    component.value = 'initial@example.com';
    fixture.detectChanges();
    await fixture.whenStable();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(input.id).toBe('test-input');
    expect(input.name).toBe('user-email');
    expect(input.autocomplete).toBe('email');
    expect(input.getAttribute('aria-describedby')).toBe('test-input-hint');
  });

  it('updates model and emits valueChange on text entry', () => {
    const valueSpy = vi.spyOn(component.valueChange, 'emit');
    fixture.detectChanges();

    component.onChange('new text');
    expect(component.value).toBe('new text');
    expect(valueSpy).toHaveBeenCalledWith('new text');
  });
});
