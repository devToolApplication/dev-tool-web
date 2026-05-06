import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-prime-table',
  standalone: false,
  templateUrl: './prime-table.component.html'
})
export class PrimeTableComponent<T = unknown> {
  @Input() value: T[] = [];
  @Input() loading = false;
  @Input() paginator = false;
  @Input() rows = 10;
  @Input() rowsPerPageOptions: number[] = [10, 20, 50];
  @Input() rowTrackBy: (index: number, item: T) => unknown = (_, item) => item;
  @Input() responsiveLayout: 'stack' | 'scroll' = 'scroll';
  @Input() styleClass = '';
}
