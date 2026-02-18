import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
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

  constructor(private readonly service: ReportsService) {}

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
    if (!this.model.name) {
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

    this.service.delete(item.id).subscribe(() => this.loadData());
  }
}
