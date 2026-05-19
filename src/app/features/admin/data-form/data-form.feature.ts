import { Routes } from '@angular/router';
import { FeaturePlaceholderComponent } from '../../feature-placeholder/feature-placeholder.component';
import { permissionGuard } from '../../../core/auth/permission.guard';
import { unsavedChangesGuard } from '../../../shared/ui/form-input/unsaved-changes.guard';
import { CreateDataFormPageComponent } from './create/create-data-form-page.component';

export const DATA_FORM_FEATURE_COMPONENTS = [CreateDataFormPageComponent];

export const dataFormRoutes: Routes = [
  {
    path: 'admin/data-forms',
    children: [
      {
        path: '',
        pathMatch: 'full',
        component: FeaturePlaceholderComponent,
        data: {
          title: 'dataForm.list.title',
          description: 'dataForm.list.description'
        }
      },
      {
        path: 'create',
        component: CreateDataFormPageComponent,
        canActivate: [permissionGuard],
        canDeactivate: [unsavedChangesGuard],
        data: { permissions: ['FORM_CONFIG_CREATE'] }
      }
    ]
  }
];
