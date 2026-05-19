import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '../../../shared.module';
import { provideSharedTesting } from '../../../testing/shared-test.providers';
import { ErrorStateComponent } from './error-state.component';

describe('ErrorStateComponent', () => {
  let fixture: ComponentFixture<ErrorStateComponent>;
  let component: ErrorStateComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting()
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorStateComponent);
    component = fixture.componentInstance;
  });

  it('renders title, message, code and accessibility role', () => {
    component.title = 'Load failed';
    component.message = 'Service unavailable';
    component.errorCode = 'REQ-1';
    fixture.detectChanges();

    const state: HTMLElement = fixture.nativeElement.querySelector('.error-state');
    expect(state.getAttribute('role')).toBe('alert');
    expect(fixture.nativeElement.textContent).toContain('Load failed');
    expect(fixture.nativeElement.textContent).toContain('Service unavailable');
    expect(fixture.nativeElement.textContent).toContain('REQ-1');
  });

  it('emits retry without owning API behavior', () => {
    const retry = vi.spyOn(component.retry, 'emit');
    component.retryLabel = 'Retry';
    fixture.detectChanges();

    fixture.nativeElement.querySelector('button')?.click();

    expect(retry).toHaveBeenCalledOnce();
  });

  it('handles string and object errors without exposing raw stack by default', () => {
    component.error = 'String error';
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('String error');

    fixture.destroy();
    fixture = TestBed.createComponent(ErrorStateComponent);
    component = fixture.componentInstance;
    component.error = { message: 'Object error', stack: 'sensitive stack trace' };
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Object error');
    expect(fixture.nativeElement.textContent).not.toContain('sensitive stack trace');
  });

  it('copies detail when explicitly enabled', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const copied = vi.spyOn(component.copyDetail, 'emit');
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText }
    });
    component.detail = { requestId: 'REQ-2' };
    component.showCopyDetail = true;
    fixture.detectChanges();

    await component.onCopyDetail();

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('REQ-2'));
    expect(copied).toHaveBeenCalledWith(expect.stringContaining('REQ-2'));
  });

  it('supports warning/info variants generically', () => {
    component.variant = 'warning';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.error-state--warning')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.pi-exclamation-triangle')).toBeTruthy();
  });
});
