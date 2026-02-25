import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../../core/ui-services/loading.service';
import { ToastService } from '../../core/ui-services/toast.service';
import { I18nService } from '../../core/ui-services/i18n.service';
import { MailItem, MailService } from '../../core/services/mail.service';

@Component({
  selector: 'app-mail',
  standalone: false,
  templateUrl: './mail.component.html',
  styleUrl: './mail.component.css'
})
export class MailComponent implements OnInit {
  items: MailItem[] = [];
  model: MailItem = { title: '', content: '' };
  editingId: number | null = null;
  loading = false;

  constructor(
    private readonly service: MailService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly i18nService: I18nService
  ) {}

  title(): string {
    return this.i18nService.t('mail.title');
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.loadingService.track(this.service.getAll())
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (rows) => {
          this.items = rows;
        },
        error: () => {
          this.toastService.error(this.i18nService.t('toast.loadError'));
        }
      });
  }

  submit(): void {
    if (!this.model.title || !this.model.content) {
      return;
    }

    const request$ = this.editingId
      ? this.service.update(this.editingId, this.model)
      : this.service.create(this.model);

    this.loadingService.track(request$).subscribe({
      next: () => {
        this.toastService.success(this.editingId ? this.i18nService.t('toast.saveUpdateSuccess') : this.i18nService.t('toast.saveCreateSuccess'));
        this.cancelEdit();
        this.loadData();
      },
      error: () => {
        this.toastService.error(this.i18nService.t('toast.saveError'));
      }
    });
  }

  startEdit(item: MailItem): void {
    this.editingId = item.id ?? null;
    this.model = { title: item.title, content: item.content };
  }

  cancelEdit(): void {
    this.editingId = null;
    this.model = { title: '', content: '' };
  }

  remove(item: MailItem): void {
    if (!item.id) {
      return;
    }

    this.loadingService.track(this.service.delete(item.id)).subscribe({
      next: () => {
        this.toastService.info(this.i18nService.t('toast.deleteSuccess'));
        this.loadData();
      },
      error: () => {
        this.toastService.error(this.i18nService.t('toast.deleteError'));
      }
    });
  }
}
