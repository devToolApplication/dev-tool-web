import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { I18nService } from '@core/i18n/i18n.service';
import { ToastService } from '@core/notifications/toast.service';
import { ConfirmDialogService } from '@shared/ui/overlay/confirm-dialog/confirm-dialog.service';
import { TableAction } from '@shared/ui/patterns/table/models/table-config.model';
import {
  accountDetailItems,
  buildAccountFilterFields,
  buildAccountListActions,
  buildAccountTableConfig,
} from '../../models/account.config';
import { AccountItem, AccountStatus, AccountType } from '../../models/account.model';
import { AccountService } from '../../services/account.service';
import { TotpService } from '../../services/totp.service';

@Component({
  selector: 'app-account-list',
  standalone: false,
  templateUrl: './account-list.component.html',
  styleUrl: './account-list.component.scss',
})
export class AccountListComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly accountService = inject(AccountService);
  private readonly totpService = inject(TotpService);
  private readonly toastService = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly i18nService = inject(I18nService);

  readonly actions = buildAccountListActions();
  readonly filterFields = buildAccountFilterFields();
  readonly tableConfig = buildAccountTableConfig();

  readonly accounts = signal<AccountItem[]>([]);
  readonly loading = signal(false);
  readonly totalRecords = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly filterValues = signal<Record<string, unknown>>({});

  readonly visiblePasswords = signal<Record<string, boolean>>({});
  readonly otps = signal<Record<string, string>>({});
  readonly remainingSeconds = signal(30);
  private otpTimer: any;

  readonly drawerOpen = signal(false);
  readonly selectedAccount = signal<AccountItem | null>(null);
  readonly detailItems = computed(() => {
    const acc = this.selectedAccount();
    if (!acc) return [];
    return accountDetailItems(acc, this.otps()[acc.id]);
  });

  // Form Dialog state
  formDialogVisible = false;
  isEdit = false;
  submitting = false;
  form!: FormGroup;
  previewOtp = '';
  previewRemaining = 30;

  readonly typeOptions = [
    { label: 'OpenAI / ChatGPT', value: 'OPENAI' },
    { label: 'Google', value: 'GOOGLE' },
    { label: 'Claude / Anthropic', value: 'CLAUDE' },
    { label: 'GitHub', value: 'GITHUB' },
    { label: 'Twitter / X', value: 'TWITTER' },
    { label: 'Custom / Other', value: 'CUSTOM' },
  ];

  readonly statusOptions = [
    { label: 'accountManagement.status.active', value: 'ACTIVE' },
    { label: 'accountManagement.status.inactive', value: 'INACTIVE' },
  ];

  ngOnInit(): void {
    this.initForm();
    this.loadData();
    this.startOtpTicker();
  }

  ngOnDestroy(): void {
    if (this.otpTimer) {
      clearInterval(this.otpTimer);
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      type: ['OPENAI', [Validators.required]],
      username: ['', [Validators.required]],
      password: [''],
      twoFactorSecret: [''],
      backupCodesStr: [''],
      status: ['ACTIVE'],
      note: [''],
      tagsStr: [''],
      metadataStr: [''],
    });
  }

  loadData(): void {
    this.loading.set(true);
    const filter = this.filterValues();
    this.accountService
      .getPage({
        page: this.pageIndex(),
        size: this.pageSize(),
        keyword: (filter['keyword'] as string) || undefined,
        type: (filter['type'] as string) || undefined,
        status: (filter['status'] as string) || undefined,
      })
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          const list = res?.data || [];
          this.accounts.set(list);
          this.totalRecords.set(res?.metadata?.totalElements ?? list.length);
          this.refreshOtps(list);
        },
        error: (err) => {
          this.loading.set(false);
          this.toastService.error('error', err?.message || 'shared.error.loadFailed');
        },
      });
  }

  onFilterChange(values: Record<string, unknown>): void {
    this.filterValues.set(values);
    this.pageIndex.set(0);
    this.loadData();
  }

  onFilterReset(): void {
    this.filterValues.set({});
    this.pageIndex.set(0);
    this.loadData();
  }

  onPageChange(event: { page: number; rows: number }): void {
    this.pageIndex.set(event.page);
    this.pageSize.set(event.rows);
    this.loadData();
  }

  onToolbarAction(action: { id: string }): void {
    if (action.id === 'create') {
      this.openCreate();
    } else if (action.id === 'refresh') {
      this.loadData();
    }
  }

  onTableAction(event: { action: TableAction<AccountItem>; row: AccountItem }): void {
    if (event.action.id === 'view') {
      this.openDetail(event.row);
    } else if (event.action.id === 'edit') {
      this.openEdit(event.row);
    } else if (event.action.id === 'delete') {
      void this.confirmDelete(event.row);
    }
  }

  openDetail(acc: AccountItem): void {
    this.selectedAccount.set(acc);
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  editFromDrawer(): void {
    const acc = this.selectedAccount();
    if (acc) {
      this.closeDrawer();
      this.openEdit(acc);
    }
  }

  openCreate(): void {
    this.selectedAccount.set(null);
    this.isEdit = false;
    this.form.reset({
      name: '',
      type: 'OPENAI',
      username: '',
      password: '',
      twoFactorSecret: '',
      backupCodesStr: '',
      status: 'ACTIVE',
      note: '',
      tagsStr: '',
      metadataStr: '',
    });
    this.form.get('password')?.setValidators([Validators.required]);
    this.form.get('password')?.updateValueAndValidity();
    this.previewOtp = '';
    this.formDialogVisible = true;
  }

  openEdit(acc: AccountItem): void {
    this.selectedAccount.set(acc);
    this.isEdit = true;
    this.form.patchValue({
      name: acc.name,
      type: acc.type,
      username: acc.username,
      password: '',
      twoFactorSecret: acc.twoFactorSecret || '',
      backupCodesStr: (acc.backupCodes || []).join(', '),
      status: acc.status || 'ACTIVE',
      note: acc.note || '',
      tagsStr: (acc.tags || []).join(', '),
      metadataStr: acc.metadata ? JSON.stringify(acc.metadata, null, 2) : '',
    });
    this.form.get('password')?.clearValidators();
    this.form.get('password')?.updateValueAndValidity();
    this.onSecretChange();
    this.formDialogVisible = true;
  }

  closeFormDialog(): void {
    this.formDialogVisible = false;
  }

  async onSecretChange(): Promise<void> {
    const secret = this.form.get('twoFactorSecret')?.value;
    if (secret) {
      this.previewOtp = await this.totpService.generateOtp(secret);
      this.previewRemaining = this.totpService.getRemainingSeconds();
    } else {
      this.previewOtp = '';
    }
  }

  submitForm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const val = this.form.value;
    let metadata: Record<string, any> | undefined;
    if (val.metadataStr && val.metadataStr.trim()) {
      try {
        metadata = JSON.parse(val.metadataStr);
      } catch {
        this.toastService.error('error', 'accountManagement.toast.invalidJson');
        return;
      }
    }

    const backupCodes = val.backupCodesStr
      ? val.backupCodesStr.split(',').map((s: string) => s.trim()).filter((s: string) => !!s)
      : [];

    const tags = val.tagsStr
      ? val.tagsStr.split(',').map((s: string) => s.trim()).filter((s: string) => !!s)
      : [];

    this.submitting = true;
    const acc = this.selectedAccount();

    if (this.isEdit && acc?.id) {
      this.accountService.update(acc.id, {
        name: val.name,
        type: val.type,
        username: val.username,
        password: val.password ? val.password : undefined,
        twoFactorSecret: val.twoFactorSecret,
        backupCodes,
        status: val.status,
        note: val.note,
        metadata,
        tags,
      }).subscribe({
        next: () => {
          this.submitting = false;
          this.toastService.success('success', 'accountManagement.toast.updated');
          this.closeFormDialog();
          this.loadData();
        },
        error: (err) => {
          this.submitting = false;
          this.toastService.error('error', err?.message || 'shared.error.actionFailed');
        },
      });
    } else {
      this.accountService.create({
        name: val.name,
        type: val.type,
        username: val.username,
        password: val.password,
        twoFactorSecret: val.twoFactorSecret,
        backupCodes,
        status: val.status,
        note: val.note,
        metadata,
        tags,
      }).subscribe({
        next: () => {
          this.submitting = false;
          this.toastService.success('success', 'accountManagement.toast.created');
          this.closeFormDialog();
          this.loadData();
        },
        error: (err) => {
          this.submitting = false;
          this.toastService.error('error', err?.message || 'shared.error.actionFailed');
        },
      });
    }
  }

  togglePassword(id: string, event: Event): void {
    event.stopPropagation();
    const current = { ...this.visiblePasswords() };
    current[id] = !current[id];
    this.visiblePasswords.set(current);
  }

  private startOtpTicker(): void {
    this.otpTimer = setInterval(() => {
      this.remainingSeconds.set(this.totpService.getRemainingSeconds());
      if (this.remainingSeconds() === 30 || Object.keys(this.otps()).length === 0) {
        this.refreshOtps(this.accounts());
      }
      if (this.formDialogVisible && this.form?.get('twoFactorSecret')?.value) {
        this.previewRemaining = this.totpService.getRemainingSeconds();
        void this.onSecretChange();
      }
    }, 1000);
  }

  private async refreshOtps(list: AccountItem[]): Promise<void> {
    const map: Record<string, string> = {};
    for (const acc of list) {
      if (acc.twoFactorSecret) {
        map[acc.id] = await this.totpService.generateOtp(acc.twoFactorSecret);
      }
    }
    this.otps.set(map);
  }

  async confirmDelete(account: AccountItem): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'accountManagement.confirm.deleteTitle',
      message: `${this.i18nService.t('accountManagement.confirm.deleteMessage')} (${account.name} - ${account.username})`,
      confirmText: 'delete',
      cancelText: 'cancel',
      variant: 'danger',
    });

    if (confirmed) {
      this.accountService.delete(account.id).subscribe({
        next: () => {
          this.toastService.success('success', 'accountManagement.toast.deleted');
          this.loadData();
        },
        error: (err) => {
          this.toastService.error('error', err?.message || 'shared.error.actionFailed');
        },
      });
    }
  }
}