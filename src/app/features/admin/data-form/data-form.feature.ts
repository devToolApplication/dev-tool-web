import { Routes } from '@angular/router';
import { permissionGuard } from '../../../core/auth/permission.guard';
import { unsavedChangesGuard } from '../../../shared/ui/form-input/unsaved-changes.guard';
import { CreateDataFormPageComponent } from './create/create-data-form-page.component';
import { DataFormValidationPanelComponent } from './create/components/data-form-validation-panel/data-form-validation-panel.component';
import { DataFormPermissionSectionComponent } from './create/components/data-form-permission-section/data-form-permission-section.component';
import { DataFormListComponent } from './list/data-form-list.component';

export const DATA_FORM_FEATURE_COMPONENTS = [
  DataFormListComponent,
  CreateDataFormPageComponent,
  DataFormValidationPanelComponent,
  DataFormPermissionSectionComponent
];

export const dataFormRoutes: Routes = [
  {
    path: 'admin/data-forms',
    children: [
      {
        path: '',
        pathMatch: 'full',
        component: DataFormListComponent,
        canActivate: [permissionGuard],
        data: { permissions: ['DATA_FORM_READ'] }
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
