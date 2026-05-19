import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '../../../shared.module';
import { provideSharedTesting } from '../../../testing/shared-test.providers';
import { AlertComponent, AlertVariant } from './alert.component';

describe('AlertComponent', () => {
  let fixture: ComponentFixture<AlertComponent>;
  let component: AlertComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting()
    }).compileComponents();

    fixture = TestBed.createComponent(AlertComponent);
    component = fixture.componentInstance;
  });

  it('renders each generic variant with text and icon signal', () => {
    const variants: AlertVariant[] = ['info', 'success', 'warning', 'danger'];

    variants.forEach((variant) => {
      render({ variant, title: `Title ${variant}`, message: `Message ${variant}` });

      const alert: HTMLElement = fixture.nativeElement.querySelector('.app-alert');
      expect(alert.textContent).toContain(`Title ${variant}`);
      expect(alert.textContent).toContain(`Message ${variant}`);
      expect(alert.classList.contains(`app-alert--${variant}`)).toBe(true);
      expect(alert.getAttribute('role')).toBe(variant === 'warning' || variant === 'danger' ? 'alert' : 'status');
    });
  });

  it('emits dismiss and hides itself', () => {
    const dismissed = vi.spyOn(component.dismissed, 'emit');
    component.dismissible = true;
    fixture.detectChanges();

    fixture.nativeElement.querySelector('button')?.click();
    fixture.detectChanges();

    expect(dismissed).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.querySelector('.app-alert')).toBeNull();
  });

  it('emits optional action without business logic', () => {
    const action = vi.spyOn(component.action, 'emit');
    component.actionLabel = 'Resolve';
    fixture.detectChanges();

    fixture.nativeElement.querySelector('button')?.click();

    expect(action).toHaveBeenCalledOnce();
  });

  it('supports title omission and fallback variant', () => {
    component.variant = 'unsupported' as AlertVariant;
    component.message = 'Only message';
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Only message');
    expect(fixture.nativeElement.querySelector('strong')).toBeNull();
    expect(fixture.nativeElement.querySelector('.app-alert--info')).toBeTruthy();
  });

  function render(inputs: Partial<AlertComponent>): void {
    fixture.destroy();
    fixture = TestBed.createComponent(AlertComponent);
    component = fixture.componentInstance;
    Object.assign(component, inputs);
    fixture.detectChanges();
  }
});
