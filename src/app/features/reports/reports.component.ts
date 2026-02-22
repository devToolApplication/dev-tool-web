import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../../core/services/loading.service';
import { ToastService } from '../../core/services/toast.service';
import { I18nService } from '../../core/services/i18n.service';
import { ReportItem, ReportsService } from '../../core/services/reports.service';

@Component({
  selector: 'app-reports',
  standalone: false,
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent implements OnInit {
  items: ReportItem[] = [];
  model: ReportItem = { name: '', done: false };
  editingId: number | null = null;
  loading = false;

  constructor(
    private readonly service: ReportsService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly i18nService: I18nService
  ) {}

  title(): string {
    return this.i18nService.t('reports.title');
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
    if (!this.model.name) {
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

  startEdit(item: ReportItem): void {
    this.editingId = item.id ?? null;
    this.model = { name: item.name, done: item.done };
  }

  cancelEdit(): void {
    this.editingId = null;
    this.model = { name: '', done: false };
  }

  remove(item: ReportItem): void {
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
