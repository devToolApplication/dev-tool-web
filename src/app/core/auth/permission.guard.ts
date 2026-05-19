import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionService } from './permission.service';

export const permissionGuard: CanActivateFn = (route) => {
  const permissions = route.data?.['permissions'] as string[] | undefined;
  if (!permissions?.length || inject(PermissionService).hasAll(permissions)) {
    return true;
  }

  return inject(Router).createUrlTree(['/403']);
};
