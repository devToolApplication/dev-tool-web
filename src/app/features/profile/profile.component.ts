import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../../core/services/loading.service';
import { ToastService } from '../../core/services/toast.service';
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
    private readonly toastService: ToastService
  ) {}

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
          this.toastService.error('Tải dữ liệu thất bại');
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
        this.toastService.success(this.editingId ? 'Cập nhật thành công' : 'Tạo mới thành công');
        this.cancelEdit();
        this.loadData();
      },
      error: () => {
        this.toastService.error('Lưu dữ liệu thất bại');
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
        this.toastService.info('Đã xoá bản ghi');
        this.loadData();
      },
      error: () => {
        this.toastService.error('Xoá thất bại');
      }
    });
  }
}
