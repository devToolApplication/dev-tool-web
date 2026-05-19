import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '../../../shared.module';
import { provideSharedTesting } from '../../../testing/shared-test.providers';
import { ConfirmDialogHostComponent } from './confirm-dialog-host.component';
import { ConfirmDialogService } from './confirm-dialog.service';

describe('ConfirmDialogHostComponent', () => {
  let fixture: ComponentFixture<ConfirmDialogHostComponent>;
  let component: ConfirmDialogHostComponent;
  let service: ConfirmDialogService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting()
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogHostComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(ConfirmDialogService);
    fixture.detectChanges();
  });

  it('opens a dialog with title, message and danger variant', () => {
    void service.confirm({ title: 'Delete item', message: 'Delete cannot be undone', variant: 'danger' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Delete item');
    expect(fixture.nativeElement.textContent).toContain('Delete cannot be undone');
    expect(fixture.nativeElement.querySelector('.confirm-dialog__icon--danger')).toBeTruthy();
  });

  it('returns confirmed when accepted and cancelled when rejected', async () => {
    const confirmedPromise = service.confirm({ message: 'Confirm action' });
    fixture.detectChanges();

    await component.accept();
    await expect(confirmedPromise).resolves.toBe(true);

    const cancelledPromise = service.confirm({ message: 'Cancel action' });
    fixture.detectChanges();

    component.reject();
    await expect(cancelledPromise).resolves.toBe(false);
  });

  it('can return explicit confirmed, cancelled and dismissed results', async () => {
    const confirmedPromise = service.confirmResult({ message: 'Confirm explicit' });
    fixture.detectChanges();
    await component.accept();
    await expect(confirmedPromise).resolves.toBe('confirmed');

    const cancelledPromise = service.confirmResult({ message: 'Cancel explicit' });
    fixture.detectChanges();
    component.reject();
    await expect(cancelledPromise).resolves.toBe('cancelled');

    const dismissedPromise = service.confirmResult({ message: 'Dismiss explicit' });
    fixture.detectChanges();
    component.onBackdropClick();
    await expect(dismissedPromise).resolves.toBe('dismissed');
  });

  it('honors backdrop and escape close config', async () => {
    let settled = false;
    const promise = service.confirm({ message: 'Do not dismiss', closeOnBackdrop: false, closeOnEsc: false });
    promise.then(() => {
      settled = true;
    });
    fixture.detectChanges();

    component.onBackdropClick();
    component.onEscape();
    await Promise.resolve();

    expect(settled).toBe(false);

    component.reject();
    await expect(promise).resolves.toBe(false);
  });

  it('disables buttons while an action is processing and shows error on failure', async () => {
    component.request.set({
      title: 'Run action',
      message: 'Run action now',
      confirmText: 'Run',
      cancelText: 'Cancel',
      icon: 'pi pi-trash',
      variant: 'danger',
      closeOnBackdrop: true,
      closeOnEsc: true,
      action: () => Promise.reject(new Error('failed')),
      errorMessage: 'Action failed',
      resolve: vi.fn()
    });
    fixture.detectChanges();

    await component.accept();
    fixture.detectChanges();

    expect(component.processing()).toBe(false);
    expect(component.actionError()).toBe('Action failed');
    expect(fixture.nativeElement.querySelector('app-alert')).toBeTruthy();
  });

  it('keeps required text and focus behavior safe', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();

    const promise = service.confirm({ message: 'Type DELETE', requireText: 'DELETE' });
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));

    expect(component.confirmDisabled).toBe(true);
    component.typedText.set('DELETE');
    expect(component.confirmDisabled).toBe(false);

    await component.accept();
    await expect(promise).resolves.toBe(true);
    expect(document.activeElement).toBe(trigger);

    document.body.removeChild(trigger);
  });

  it('traps tab focus inside the dialog panel', () => {
    component.request.set({
      title: 'Keyboard confirm',
      message: 'Keyboard stays in dialog',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      icon: 'pi pi-trash',
      variant: 'danger',
      closeOnBackdrop: true,
      closeOnEsc: true,
      errorMessage: 'Action failed',
      resolve: vi.fn()
    });
    fixture.detectChanges();

    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    const cancelButton = buttons.find((button) => button.textContent?.includes('Cancel'));
    const confirmButton = buttons.find((button) => button.textContent?.includes('Confirm'));
    expect(cancelButton).toBeTruthy();
    expect(confirmButton).toBeTruthy();

    confirmButton?.focus();
    const forwardEvent = { shiftKey: false, preventDefault: vi.fn() } as unknown as KeyboardEvent;
    component.onTab(forwardEvent);

    expect(forwardEvent.preventDefault).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(cancelButton);

    cancelButton?.focus();
    const backwardEvent = { shiftKey: true, preventDefault: vi.fn() } as unknown as KeyboardEvent;
    component.onTab(backwardEvent);

    expect(backwardEvent.preventDefault).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(confirmButton);
  });
});
