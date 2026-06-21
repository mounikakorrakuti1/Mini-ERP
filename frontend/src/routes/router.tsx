import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { MODULE, PERMISSION_ACTION } from '@/types/enums';

import { RootLayout } from './RootLayout';
import AuthLayout from '@/features/auth/AuthLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { PermissionRoute } from './PermissionRoute';
import { NotFoundPage } from './NotFoundPage';

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: '3px solid var(--border-main)',
          borderTopColor: 'var(--accent-main)',
          animation: 'spin 0.8s linear infinite',
        }}
      />
    </div>
  );
}

function suspense(Lazy: LazyExoticComponent<ComponentType>) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Lazy />
    </Suspense>
  );
}

const LandingPage = lazy(() => import('@/features/landing/LandingPage'));
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const SignupPage = lazy(() => import('@/features/auth/pages/SignupPage'));
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage'));
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'));
const ProductListPage = lazy(() => import('@/features/products/pages/ProductListPage'));
const ProductDetailPage = lazy(() => import('@/features/products/pages/ProductDetailPage'));
const ProductFormPage = lazy(() => import('@/features/products/pages/ProductFormPage'));
const InventoryLedgerPage = lazy(() => import('@/features/inventory/pages/InventoryLedgerPage'));
const InventorySummaryPage = lazy(() => import('@/features/inventory/pages/InventorySummaryPage'));
const SalesOrderListPage = lazy(() => import('@/features/sales-orders/pages/SalesOrderListPage'));
const SalesOrderDetailPage = lazy(() => import('@/features/sales-orders/pages/SalesOrderDetailPage'));
const SalesOrderCreatePage = lazy(() => import('@/features/sales-orders/pages/SalesOrderCreatePage'));
const PurchaseOrderListPage = lazy(() => import('@/features/purchase-orders/pages/PurchaseOrderListPage'));
const PurchaseOrderDetailPage = lazy(() => import('@/features/purchase-orders/pages/PurchaseOrderDetailPage'));
const PurchaseOrderCreatePage = lazy(() => import('@/features/purchase-orders/pages/PurchaseOrderCreatePage'));
const ManufacturingOrderListPage = lazy(() => import('@/features/manufacturing-orders/pages/ManufacturingOrderListPage'));
const ManufacturingOrderDetailPage = lazy(() => import('@/features/manufacturing-orders/pages/ManufacturingOrderDetailPage'));
const ManufacturingOrderCreatePage = lazy(() => import('@/features/manufacturing-orders/pages/ManufacturingOrderCreatePage'));
const KanbanBoardPage = lazy(() => import('@/features/manufacturing-orders/pages/KanbanBoardPage'));
const BomListPage = lazy(() => import('@/features/bom/pages/BomListPage'));
const BomDetailPage = lazy(() => import('@/features/bom/pages/BomDetailPage'));
const BomCreatePage = lazy(() => import('@/features/bom/pages/BomCreatePage'));
const VendorListPage = lazy(() => import('@/features/partners/pages/VendorListPage'));
const CustomerListPage = lazy(() => import('@/features/partners/pages/CustomerListPage'));
const ProcurementRecommendationPage = lazy(() => import('@/features/procurement/pages/ProcurementRecommendationPage'));
const TraceabilityPage = lazy(() => import('@/features/procurement/pages/TraceabilityPage'));
const AuditLogPage = lazy(() => import('@/features/audit-logs/pages/AuditLogPage'));
const AnalyticsPage = lazy(() => import('@/features/analytics/pages/AnalyticsPage'));
const UserManagementPage = lazy(() => import('@/features/rbac/pages/UserManagementPage'));
const UserDetailPage = lazy(() => import('@/features/rbac/pages/UserDetailPage'));
const ProfilePage = lazy(() => import('@/features/rbac/pages/ProfilePage'));

export const router = createBrowserRouter([
  { path: '/', element: suspense(LandingPage) },

  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: suspense(LoginPage) },
      { path: 'signup', element: suspense(SignupPage) },
      { path: 'forgot-password', element: suspense(ForgotPasswordPage) },
    ],
  },

  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <RootLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: suspense(DashboardPage) },

      {
        path: 'products',
        children: [
          { index: true, element: suspense(ProductListPage) },
          {
            path: 'new',
            element: (
              <PermissionRoute module={MODULE.PRODUCTS} action={PERMISSION_ACTION.ADMIN}>
                {suspense(ProductFormPage)}
              </PermissionRoute>
            ),
          },
          {
            path: ':id/edit',
            element: (
              <PermissionRoute module={MODULE.PRODUCTS} action={PERMISSION_ACTION.ADMIN}>
                {suspense(ProductFormPage)}
              </PermissionRoute>
            ),
          },
          { path: ':id', element: suspense(ProductDetailPage) },
        ],
      },

      {
        path: 'inventory/ledger',
        element: (
          <PermissionRoute module={MODULE.INVENTORY} action={PERMISSION_ACTION.VIEW}>
            {suspense(InventoryLedgerPage)}
          </PermissionRoute>
        ),
      },
      { path: 'inventory/summary', element: suspense(InventorySummaryPage) },

      {
        path: 'sales-orders',
        element: <PermissionRoute module={MODULE.SALES_ORDERS} action={PERMISSION_ACTION.VIEW} />,
        children: [
          { index: true, element: suspense(SalesOrderListPage) },
          {
            path: 'new',
            element: (
              <PermissionRoute module={MODULE.SALES_ORDERS} action={PERMISSION_ACTION.ADMIN}>
                {suspense(SalesOrderCreatePage)}
              </PermissionRoute>
            ),
          },
          { path: ':id', element: suspense(SalesOrderDetailPage) },
        ],
      },

      {
        path: 'purchase-orders',
        element: <PermissionRoute module={MODULE.PURCHASE_ORDERS} action={PERMISSION_ACTION.VIEW} />,
        children: [
          { index: true, element: suspense(PurchaseOrderListPage) },
          {
            path: 'new',
            element: (
              <PermissionRoute module={MODULE.PURCHASE_ORDERS} action={PERMISSION_ACTION.ADMIN}>
                {suspense(PurchaseOrderCreatePage)}
              </PermissionRoute>
            ),
          },
          { path: ':id', element: suspense(PurchaseOrderDetailPage) },
        ],
      },

      {
        path: 'manufacturing-orders',
        element: <PermissionRoute module={MODULE.MANUFACTURING_ORDERS} action={PERMISSION_ACTION.VIEW} />,
        children: [
          { index: true, element: suspense(ManufacturingOrderListPage) },
          { path: 'kanban', element: suspense(KanbanBoardPage) },
          {
            path: 'new',
            element: (
              <PermissionRoute module={MODULE.MANUFACTURING_ORDERS} action={PERMISSION_ACTION.ADMIN}>
                {suspense(ManufacturingOrderCreatePage)}
              </PermissionRoute>
            ),
          },
          { path: ':id', element: suspense(ManufacturingOrderDetailPage) },
        ],
      },

      {
        path: 'bom',
        element: <PermissionRoute module={MODULE.BOM} action={PERMISSION_ACTION.VIEW} />,
        children: [
          { index: true, element: suspense(BomListPage) },
          {
            path: 'new',
            element: (
              <PermissionRoute module={MODULE.BOM} action={PERMISSION_ACTION.ADMIN}>
                {suspense(BomCreatePage)}
              </PermissionRoute>
            ),
          },
          {
            path: ':id/edit',
            element: (
              <PermissionRoute module={MODULE.BOM} action={PERMISSION_ACTION.ADMIN}>
                {suspense(BomCreatePage)}
              </PermissionRoute>
            ),
          },
          { path: ':id', element: suspense(BomDetailPage) },
        ],
      },

      { path: 'vendors', element: suspense(VendorListPage) },
      { path: 'customers', element: suspense(CustomerListPage) },

      { path: 'procurement', element: suspense(ProcurementRecommendationPage) },
      { path: 'procurement/traceability/:soId', element: suspense(TraceabilityPage) },

      {
        path: 'audit-logs',
        element: (
          <PermissionRoute module={MODULE.AUDIT_LOGS} action={PERMISSION_ACTION.ADMIN}>
            {suspense(AuditLogPage)}
          </PermissionRoute>
        ),
      },
      { path: 'analytics', element: suspense(AnalyticsPage) },
      {
        path: 'admin/users',
        element: <PermissionRoute module={MODULE.USER_MANAGEMENT} action={PERMISSION_ACTION.ADMIN} />,
        children: [
          { index: true, element: suspense(UserManagementPage) },
          { path: ':id', element: suspense(UserDetailPage) },
        ],
      },
      { path: 'profile', element: suspense(ProfilePage) },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
