import { Component, Input } from '@angular/core';
import { DashboardItem } from '../../dashboard.models';

@Component({
  selector: 'app-file-storage-dashboard',
  standalone: false,
  templateUrl: './file-storage-dashboard.component.html',
  styleUrl: './file-storage-dashboard.component.css'
})
export class FileStorageDashboardComponent {
  @Input() items: DashboardItem[] = [];
}
