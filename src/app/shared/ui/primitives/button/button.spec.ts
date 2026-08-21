import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SharedModule } from '@shared/shared.module';
import { provideSharedTesting } from '@shared/testing/shared-test.providers';
import { Button } from './button';

describe('Button', () => {
  let component: Button;
  let fixture: ComponentFixture<Button>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting()
    }).compileComponents();

    fixture = TestBed.createComponent(Button);
    component = fixture.componentInstance;
  });

  it('should create and default to type=button and variant=primary', () => {
    fixture.detectChanges();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(component).toBeTruthy();
    expect(button.type).toBe('button');
    expect(button.classList.contains('app-button--primary')).toBe(true);
  });

  it('uses tooltip/ariaLabel as accessible name when label is absent', async () => {
    component.icon = 'pi pi-refresh';
    component.tooltip = 'test.iconOnlyRefresh';
    component.iconOnly = true;

    fixture.detectChanges();
    await fixture.whenStable();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.getAttribute('aria-label')).toBe('test.iconOnlyRefresh');
  });

  it('handles loading state with aria-busy and prevents buttonClick event', () => {
    const clickSpy = vi.spyOn(component.buttonClick, 'emit');
    component.loading = true;
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.disabled).toBe(true);

    button.click();
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('emits buttonClick when clicked normally and not disabled', () => {
    const clickSpy = vi.spyOn(component.buttonClick, 'emit');
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    button.click();

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('maps variant classes correctly', () => {
    component.variant = 'destructive';
    component.size = 'sm';
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.classList.contains('app-button--destructive')).toBe(true);
    expect(button.classList.contains('app-button--sm')).toBe(true);
  });
});
