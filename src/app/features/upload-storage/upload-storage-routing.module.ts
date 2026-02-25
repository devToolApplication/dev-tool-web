import { Routes } from '@angular/router';
import { UploadStorageFormComponent } from './upload-storage-form.component';
import { UploadStorageListComponent } from './upload-storage-list.component';

export const uploadStorageRoutes: Routes = [
  { path: 'admin/upload-storage', redirectTo: 'admin/upload-storage/storage', pathMatch: 'full' },
  {
    path: 'admin/upload-storage/storage',
    children: [
      { path: '', component: UploadStorageListComponent },
      { path: 'create', component: UploadStorageFormComponent },
      { path: 'edit/:id', component: UploadStorageFormComponent }
    ]
  }
];
