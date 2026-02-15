import { Component, Input } from '@angular/core';
import { TableConfig } from './models/table-config.model';

@Component({
  selector: 'app-table',
  standalone: false,
  templateUrl: './table.html',
  styleUrls: ['./table.css']
})
export class TableComponent {

  @Input() config!: TableConfig;
  @Input() data: any[] = [];
  @Input() loading = false;

}
