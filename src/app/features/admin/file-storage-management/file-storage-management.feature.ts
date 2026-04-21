import { Routes } from '@angular/router';
import { UploadStorageFormComponent } from './storage-repository/form/upload-storage-form.component';
import { UploadStorageListComponent } from './storage-repository/list/upload-storage-list.component';
import { UploadFileListComponent } from './uploaded-file/list/upload-file-list.component';

export const FILE_STORAGE_FEATURE_COMPONENTS = [UploadStorageListComponent, UploadStorageFormComponent, UploadFileListComponent];

export const fileStorageRoutes: Routes = [
  { path: 'admin/upload-storage', redirectTo: 'admin/upload-storage/storage', pathMatch: 'full' },
  {
    path: 'admin/upload-storage/storage',
    children: [
      { path: '', component: UploadStorageListComponent },
      { path: 'create', component: UploadStorageFormComponent },
      { path: 'edit/:id', component: UploadStorageFormComponent }
    ]
  },
  {
    path: 'admin/upload-storage/files',
    component: UploadFileListComponent
  }
];
