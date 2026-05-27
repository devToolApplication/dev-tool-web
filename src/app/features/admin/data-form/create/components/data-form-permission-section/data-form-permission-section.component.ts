import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-data-form-permission-section',
  standalone: false,
  templateUrl: './data-form-permission-section.component.html'
})
export class DataFormPermissionSectionComponent {
  @Input() permissionCreateAdmin = true;
  @Input() permissionCreateManager = false;
  @Input() permissionUpdateAdmin = true;
  @Input() permissionImportExportAdmin = true;
  @Output() permissionCreateAdminChange = new EventEmitter<boolean>();
  @Output() permissionCreateManagerChange = new EventEmitter<boolean>();
  @Output() permissionUpdateAdminChange = new EventEmitter<boolean>();
  @Output() permissionImportExportAdminChange = new EventEmitter<boolean>();
}
