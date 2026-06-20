import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { hasPermission } from '@/lib/permissions';
import { ROUTES } from '@/routes/routeMap';
import type { ModuleName, PermissionAction } from '@/types/enums';

interface PermissionRouteProps {
  module: ModuleName;
  action: PermissionAction;
  children?: ReactNode;
}

/**
 * UX convenience guard — hides pages the user's role can't access.
 * NOT a security boundary; the server enforces actual access control.
 */
export function PermissionRoute({ module, action, children }: PermissionRouteProps) {
  const { user } = useAuthStore();
  const can = hasPermission(user?.role, module, action);

  if (!can) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
