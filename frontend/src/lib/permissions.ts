import { MODULE, PERMISSION_ACTION } from '@/types/enums';
import type { ModuleName, PermissionAction } from '@/types/enums';

export interface DynamicPermission {
  module: string;
  accessLevel: 'ADMIN' | 'VIEW' | 'NONE';
}

export function hasPermission(
  permissions: DynamicPermission[] | undefined,
  module: ModuleName | string,
  action: PermissionAction,
): boolean {
  if (!permissions) return false;
  if (module === MODULE.DASHBOARDS) return true; // Everyone can see dashboards

  // Find the permission entry for this specific module
  // Backend returns strings like 'SALES_ORDERS' matching the enum.
  const moduleUpper = module.toUpperCase();
  const p = permissions.find(x => x.module === moduleUpper);
  
  if (!p) return false; // NONE implies no row exists

  if (action === PERMISSION_ACTION.VIEW) {
    return p.accessLevel === 'VIEW' || p.accessLevel === 'ADMIN';
  }
  
  if (action === PERMISSION_ACTION.ADMIN) {
    return p.accessLevel === 'ADMIN';
  }

  return false;
}
