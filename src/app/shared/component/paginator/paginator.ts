import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PaginatorState } from 'primeng/paginator';

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
  @Output() pageChange = new EventEmitter<PaginatorState>();
}
