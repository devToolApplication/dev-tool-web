import { Component, Input } from '@angular/core';
import { DashboardOverview } from '../../dashboard.models';

@Component({
  selector: 'app-file-storage-dashboard',
  standalone: false,
  templateUrl: './file-storage-dashboard.component.html',
  styleUrl: './file-storage-dashboard.component.css'
})
export class FileStorageDashboardComponent {
  @Input() overview: DashboardOverview | null = null;
  @Input() loading = false;
  @Input() error = '';
}
