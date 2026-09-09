import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GenericApprovalContent } from '../../models/user-task.model';
import { TaskHostStore } from '../../services/task-host.store';
import { UserTaskModule } from '../../user-task.module';
import { GenericApprovalScreenComponent } from './generic-approval-screen.component';

describe('GenericApprovalScreenComponent', () => {
  let fixture: ComponentFixture<GenericApprovalScreenComponent>;
  let component: GenericApprovalScreenComponent;
  const store = {
    registerAdapter: vi.fn(),
    unregisterAdapter: vi.fn(),
  };

  beforeEach(async () => {
    store.registerAdapter.mockClear();
    store.unregisterAdapter.mockClear();
    await TestBed.configureTestingModule({
      imports: [UserTaskModule],
      providers: [{ provide: TaskHostStore, useValue: store }],
    }).compileComponents();
    fixture = TestBed.createComponent(GenericApprovalScreenComponent);
    component = fixture.componentInstance;
  });

  it('renders header metadata and scalar fields with key-value lists', () => {
    const content: GenericApprovalContent = {
      title: 'Budget Approval',
      summary: 'Quarterly budget request',
      reference: 'REF-1',
      requester: 'Alice',
      submittedAt: '2026-09-09T01:00:00Z',
      fields: [{ key: 'amount', label: 'Amount', value: '5000' }],
    };
    component.content = content;
    fixture.detectChanges();

    expect(component.headerItems()).toHaveLength(3);
    expect(component.fieldItems()).toEqual([{ label: 'Amount', value: '5000' }]);
    expect(fixture.nativeElement.querySelectorAll('app-key-value-list').length).toBe(2);
    expect(fixture.nativeElement.querySelector('app-json-viewer')).toBeFalsy();
  });

  it('suppresses nested values defensively', () => {
    component.content = {
      title: 'Approval',
      fields: [
        { key: 'safe', label: 'Safe', value: 'visible' },
        { key: 'nested', label: 'Nested', value: { secret: true } },
      ],
    } as unknown as GenericApprovalContent;

    expect(component.fieldItems()).toEqual([{ label: 'Safe', value: 'visible' }]);
  });

  it('accepts the three generic actions and sends no client variables', () => {
    expect(component.validate('APPROVE')).toBe(true);
    expect(component.validate('REJECT')).toBe(true);
    expect(component.validate('RETURN')).toBe(true);
    expect(component.validate('CONFIRM')).toBe(false);
    expect(component.buildVariables()).toEqual({});
  });

  it('registers and unregisters its adapter', () => {
    fixture.detectChanges();
    expect(store.registerAdapter).toHaveBeenCalledWith(component);
    fixture.destroy();
    expect(store.unregisterAdapter).toHaveBeenCalledWith(component);
  });
});
