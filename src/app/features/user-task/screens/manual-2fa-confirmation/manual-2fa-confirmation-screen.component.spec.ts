import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Manual2faConfirmationContent } from '../../models/user-task.model';
import { TaskHostStore } from '../../services/task-host.store';
import { UserTaskModule } from '../../user-task.module';
import { Manual2faConfirmationScreenComponent } from './manual-2fa-confirmation-screen.component';

describe('Manual2faConfirmationScreenComponent', () => {
  let fixture: ComponentFixture<Manual2faConfirmationScreenComponent>;
  let component: Manual2faConfirmationScreenComponent;
  const store = {
    registerAdapter: vi.fn(),
    unregisterAdapter: vi.fn(),
  };

  const render = (content: Manual2faConfirmationContent): void => {
    component.content = content;
    fixture.detectChanges();
  };

  beforeEach(async () => {
    store.registerAdapter.mockClear();
    store.unregisterAdapter.mockClear();
    await TestBed.configureTestingModule({
      imports: [UserTaskModule],
      providers: [{ provide: TaskHostStore, useValue: store }],
    }).compileComponents();
    fixture = TestBed.createComponent(Manual2faConfirmationScreenComponent);
    component = fixture.componentInstance;
  });

  it('renders a supplied verification number through copyable text', () => {
    render({
      platform: 'Google',
      actionRequired: 'Confirm the matching number',
      verificationNumber: '42',
      message: 'Approve the sign-in request',
    });

    expect(component.verificationNumber()).toBe('42');
    expect(fixture.nativeElement.querySelector('app-copyable-text')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-alert')).toBeFalsy();
  });

  it('shows missing-data state for absent or blank numbers without creating a fallback', () => {
    render({
      platform: 'Google',
      actionRequired: 'Confirm the matching number',
      verificationNumber: '   ',
      message: 'Approve the sign-in request',
    });

    expect(component.verificationNumber()).toBeNull();
    expect(fixture.nativeElement.querySelector('app-copyable-text')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('app-alert')).toBeTruthy();
  });

  it('contains no secret input and emits no client variables', () => {
    render({
      platform: 'Google',
      actionRequired: 'Confirm',
      message: 'Use your trusted device',
    });

    expect(fixture.nativeElement.querySelector('input')).toBeFalsy();
    expect(component.validate('CONFIRM')).toBe(true);
    expect(component.validate('APPROVE')).toBe(false);
    expect(component.buildVariables()).toEqual({});
  });

  it('registers and unregisters its adapter', () => {
    render({ platform: 'Google', actionRequired: 'Confirm', message: 'Use device' });
    expect(store.registerAdapter).toHaveBeenCalledWith(component);
    fixture.destroy();
    expect(store.unregisterAdapter).toHaveBeenCalledWith(component);
  });
});
