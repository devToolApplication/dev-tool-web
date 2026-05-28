import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface AppPaginatorState {
  first: number;
  rows: number;
  page: number;
  pageCount: number;
}

@Component({
  selector: 'app-paginator',
  standalone: false,
  templateUrl: './paginator.html',
  styleUrl: './paginator.css'
})
export class Paginator {
  @Input() first = 0;
  @Input() rows = 10;
  @Input() totalRecords = 0;
  @Input() rowsPerPageOptions = [5, 10, 20];
  @Output() pageChange = new EventEmitter<AppPaginatorState>();

  get currentPage(): number {
    return Math.floor(this.first / this.rows);
  }

  get pageCount(): number {
    return Math.ceil(this.totalRecords / this.rows) || 1;
  }

  get pages(): number[] {
    const total = this.pageCount;
    const current = this.currentPage;
    const start = Math.max(0, current - 2);
    const end = Math.min(total, start + 5);
    return Array.from({ length: end - start }, (_, i) => start + i);
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.pageCount) return;
    this.first = page * this.rows;
    this.emit();
  }

  onRowsChange(rows: number): void {
    this.rows = rows;
    this.first = 0;
    this.emit();
  }

  private emit(): void {
    this.pageChange.emit({ first: this.first, rows: this.rows, page: this.currentPage, pageCount: this.pageCount });
  }
}
