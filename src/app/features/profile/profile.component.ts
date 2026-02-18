import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
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

  constructor(private readonly service: ProfileService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.service.getAll().pipe(finalize(() => (this.loading = false))).subscribe((rows) => {
      this.items = rows;
    });
  }

  submit(): void {
    if (!this.model.name || !this.model.email) {
      return;
    }

    const request$ = this.editingId
      ? this.service.update(this.editingId, this.model)
      : this.service.create(this.model);

    request$.subscribe(() => {
      this.cancelEdit();
      this.loadData();
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

    this.service.delete(item.id).subscribe(() => this.loadData());
  }
}
