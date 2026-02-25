import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../../core/ui-services/loading.service';
import { ToastService } from '../../core/ui-services/toast.service';
import { I18nService } from '../../core/ui-services/i18n.service';
import { ProfileItem, ProfileService } from '../../core/services/profile.service';

@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  items: ProfileItem[] = [];
  model: ProfileItem = { name: '', email: '' };
  editingId: number | null = null;
  loading = false;

  constructor(
    private readonly service: ProfileService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly i18nService: I18nService
  ) {}

  title(): string {
    return this.i18nService.t('profile.title');
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
    if (!this.model.name || !this.model.email) {
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

  startEdit(item: ProfileItem): void {
    this.editingId = item.id ?? null;
    this.model = { name: item.name, email: item.email };
  }

  cancelEdit(): void {
    this.editingId = null;
    this.model = { name: '', email: '' };
  }

  remove(item: ProfileItem): void {
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
