import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { TranslateContentPipe } from '@shared/pipes/translate-content.pipe';
import { AccountListComponent } from './account-list.component';
import { AccountService } from '../../services/account.service';
import { ConfirmDialogService } from '@shared/ui/overlay/confirm-dialog/confirm-dialog.service';

describe('AccountListComponent', () => {
  let fixture: ComponentFixture<AccountListComponent>;
  let component: AccountListComponent;
  let accountService: {
    getPage: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let confirmDialog: { confirm: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    accountService = {
      getPage: vi.fn().mockReturnValue(
        of({
          data: [
            {
              id: 'acc-1',
              name: 'OpenAI Plus',
              type: 'OPENAI',
              username: 'admin@openai.com',
              status: 'ACTIVE',
              twoFactorSecret: 'JBSWY3DPEHPK3PXP',
            },
          ],
          metadata: { totalElements: 1 },
        })
      ),
      create: vi.fn().mockReturnValue(of({})),
      update: vi.fn().mockReturnValue(of({})),
      delete: vi.fn().mockReturnValue(of({})),
    };
    confirmDialog = { confirm: vi.fn().mockResolvedValue(true) };

    await TestBed.configureTestingModule({
      declarations: [AccountListComponent, TranslateContentPipe],
      providers: [
        { provide: AccountService, useValue: accountService },
        { provide: ConfirmDialogService, useValue: confirmDialog },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders and loads account list on init', () => {
    expect(accountService.getPage).toHaveBeenCalled();
    expect(component.accounts().length).toBe(1);
    expect(component.accounts()[0].name).toBe('OpenAI Plus');
  });

  it('opens and closes create modal dialog', () => {
    component.openCreate();
    expect(component.formDialogVisible).toBe(true);
    expect(component.isEdit).toBe(false);

    component.closeFormDialog();
    expect(component.formDialogVisible).toBe(false);
  });

  it('opens drawer on account selection', () => {
    const acc = component.accounts()[0];
    component.openDetail(acc);
    expect(component.drawerOpen()).toBe(true);
    expect(component.selectedAccount()?.id).toBe('acc-1');

    component.closeDrawer();
    expect(component.drawerOpen()).toBe(false);
  });

  it('toggles password visibility state', () => {
    const mockEvent = new MouseEvent('click');
    expect(component.visiblePasswords()['acc-1']).toBeFalsy();

    component.togglePassword('acc-1', mockEvent);
    expect(component.visiblePasswords()['acc-1']).toBe(true);

    component.togglePassword('acc-1', mockEvent);
    expect(component.visiblePasswords()['acc-1']).toBe(false);
  });
});