import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionService } from './permission.service';

export const permissionGuard: CanActivateFn = (route) => {
  const permissions = route.data?.['permissions'] as string[] | undefined;
  if (!permissions?.length) {
    return true;
  }

  const permissionService = inject(PermissionService);
  const mode = route.data?.['permissionsMode'] as 'all' | 'any' | undefined;

  const hasAccess =
    mode === 'any' ? permissionService.hasAny(permissions) : permissionService.hasAll(permissions);

  if (hasAccess) {
    return true;
  }

  return inject(Router).createUrlTree(['/403']);
};
