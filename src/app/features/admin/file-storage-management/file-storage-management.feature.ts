import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '../../../shared/ui/form-input/unsaved-changes.guard';
import { permissionGuard } from '../../../core/auth/permission.guard';
import { UploadStorageFormComponent } from './storage-repository/form/upload-storage-form.component';
import { UploadStorageListComponent } from './storage-repository/list/upload-storage-list.component';
import { UploadFileListComponent } from './uploaded-file/list/upload-file-list.component';

export const FILE_STORAGE_FEATURE_COMPONENTS = [UploadStorageListComponent, UploadStorageFormComponent, UploadFileListComponent];

export const fileStorageRoutes: Routes = [
  { path: 'admin/file-storage', redirectTo: 'admin/file-storage/repositories', pathMatch: 'full' },
  {
    path: 'admin/file-storage/repositories',
    children: [
      { path: '', component: UploadStorageListComponent },
      { path: 'create', component: UploadStorageFormComponent, canDeactivate: [unsavedChangesGuard] },
      { path: 'edit/:id', component: UploadStorageFormComponent, canDeactivate: [unsavedChangesGuard] }
    ],
    canActivate: [permissionGuard],
    data: { permissions: ['FILE_STORAGE_READ'] }
  },
  {
    path: 'admin/file-storage/files',
    component: UploadFileListComponent,
    canActivate: [permissionGuard],
    data: { permissions: ['FILE_STORAGE_READ'] }
  }
];
