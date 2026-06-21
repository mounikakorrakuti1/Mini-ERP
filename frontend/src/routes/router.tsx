import { createBrowserRouter } from 'react-router-dom';
import { ROUTES } from './routeMap';
import { MODULE, PERMISSION_ACTION } from '@/types/enums';

// Layouts & Guards
import { RootLayout } from './RootLayout';
import AuthLayout from '@/features/auth/AuthLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { PermissionRoute } from './PermissionRoute';
import { NotFoundPage } from './NotFoundPage';

// Landing
import LandingPage from '@/features/landing/LandingPage';

// Auth Pages
import LoginPage from '@/features/auth/pages/LoginPage';
import SignupPage from '@/features/auth/pages/SignupPage';
import ForgotPasswordPage from '@/features/auth/pages/ForgotPasswordPage';

// Dashboard
import DashboardPage from '@/features/dashboard/pages/DashboardPage';

// Products
import ProductListPage from '@/features/products/pages/ProductListPage';
import ProductDetailPage from '@/features/products/pages/ProductDetailPage';
import ProductFormPage from '@/features/products/pages/ProductFormPage';

// Inventory
import InventoryLedgerPage from '@/features/inventory/pages/InventoryLedgerPage';
import InventorySummaryPage from '@/features/inventory/pages/InventorySummaryPage';

// Sales Orders
import SalesOrderListPage from '@/features/sales-orders/pages/SalesOrderListPage';
import SalesOrderDetailPage from '@/features/sales-orders/pages/SalesOrderDetailPage';
import SalesOrderCreatePage from '@/features/sales-orders/pages/SalesOrderCreatePage';

// Purchase Orders
import PurchaseOrderListPage from '@/features/purchase-orders/pages/PurchaseOrderListPage';
import PurchaseOrderDetailPage from '@/features/purchase-orders/pages/PurchaseOrderDetailPage';
import PurchaseOrderCreatePage from '@/features/purchase-orders/pages/PurchaseOrderCreatePage';

// Manufacturing Orders
import ManufacturingOrderListPage from '@/features/manufacturing-orders/pages/ManufacturingOrderListPage';
import ManufacturingOrderDetailPage from '@/features/manufacturing-orders/pages/ManufacturingOrderDetailPage';
import ManufacturingOrderCreatePage from '@/features/manufacturing-orders/pages/ManufacturingOrderCreatePage';
import KanbanBoardPage from '@/features/manufacturing-orders/pages/KanbanBoardPage';

// Bill of Materials
import BomListPage from '@/features/bom/pages/BomListPage';
import BomDetailPage from '@/features/bom/pages/BomDetailPage';
import BomCreatePage from '@/features/bom/pages/BomCreatePage';

// Partners
import VendorListPage from '@/features/partners/pages/VendorListPage';
import CustomerListPage from '@/features/partners/pages/CustomerListPage';

// Procurement
import ProcurementRecommendationPage from '@/features/procurement/pages/ProcurementRecommendationPage';
import TraceabilityPage from '@/features/procurement/pages/TraceabilityPage';

// System & RBAC
import AuditLogPage from '@/features/audit-logs/pages/AuditLogPage';
import AnalyticsPage from '@/features/analytics/pages/AnalyticsPage';
import UserManagementPage from '@/features/rbac/pages/UserManagementPage';
import UserDetailPage from '@/features/rbac/pages/UserDetailPage';
import ProfilePage from '@/features/rbac/pages/ProfilePage';

export const router = createBrowserRouter([
  // Public landing page
  { path: '/', element: <LandingPage /> },

  // Auth routes
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
    ],
  },

  // Protected app routes
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <RootLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },

      // Products
      {
        path: 'products',
        children: [
          { index: true, element: <ProductListPage /> },
          {
            path: 'new',
            element: (
              <PermissionRoute module={MODULE.PRODUCTS} action={PERMISSION_ACTION.ADMIN}>
                <ProductFormPage />
              </PermissionRoute>
            ),
          },
          {
            path: ':id/edit',
            element: (
              <PermissionRoute module={MODULE.PRODUCTS} action={PERMISSION_ACTION.ADMIN}>
                <ProductFormPage />
              </PermissionRoute>
            ),
          },
          { path: ':id', element: <ProductDetailPage /> },
        ],
      },

      // Inventory
      {
        path: 'inventory/ledger',
        element: (
          <PermissionRoute module={MODULE.INVENTORY} action={PERMISSION_ACTION.VIEW}>
            <InventoryLedgerPage />
          </PermissionRoute>
        ),
      },
      { path: 'inventory/summary', element: <InventorySummaryPage /> },

      // Sales Orders
      {
        path: 'sales-orders',
        element: <PermissionRoute module={MODULE.SALES_ORDERS} action={PERMISSION_ACTION.VIEW} />,
        children: [
          { index: true, element: <SalesOrderListPage /> },
          {
            path: 'new',
            element: (
              <PermissionRoute module={MODULE.SALES_ORDERS} action={PERMISSION_ACTION.ADMIN}>
                <SalesOrderCreatePage />
              </PermissionRoute>
            ),
          },
          { path: ':id', element: <SalesOrderDetailPage /> },
        ],
      },

      // Purchase Orders
      {
        path: 'purchase-orders',
        element: <PermissionRoute module={MODULE.PURCHASE_ORDERS} action={PERMISSION_ACTION.VIEW} />,
        children: [
          { index: true, element: <PurchaseOrderListPage /> },
          {
            path: 'new',
            element: (
              <PermissionRoute module={MODULE.PURCHASE_ORDERS} action={PERMISSION_ACTION.ADMIN}>
                <PurchaseOrderCreatePage />
              </PermissionRoute>
            ),
          },
          { path: ':id', element: <PurchaseOrderDetailPage /> },
        ],
      },

      // Manufacturing Orders
      {
        path: 'manufacturing-orders',
        element: <PermissionRoute module={MODULE.MANUFACTURING_ORDERS} action={PERMISSION_ACTION.VIEW} />,
        children: [
          { index: true, element: <ManufacturingOrderListPage /> },
          { path: 'kanban', element: <KanbanBoardPage /> },
          {
            path: 'new',
            element: (
              <PermissionRoute module={MODULE.MANUFACTURING_ORDERS} action={PERMISSION_ACTION.ADMIN}>
                <ManufacturingOrderCreatePage />
              </PermissionRoute>
            ),
          },
          { path: ':id', element: <ManufacturingOrderDetailPage /> },
        ],
      },

      // Bill of Materials
      {
        path: 'bom',
        element: <PermissionRoute module={MODULE.BOM} action={PERMISSION_ACTION.VIEW} />,
        children: [
          { index: true, element: <BomListPage /> },
          {
            path: 'new',
            element: (
              <PermissionRoute module={MODULE.BOM} action={PERMISSION_ACTION.ADMIN}>
                <BomCreatePage />
              </PermissionRoute>
            ),
          },
          { path: ':id', element: <BomDetailPage /> },
        ],
      },

      // Partners
      { path: 'vendors', element: <VendorListPage /> },
      { path: 'customers', element: <CustomerListPage /> },

      // Procurement
      { path: 'procurement', element: <ProcurementRecommendationPage /> },
      { path: 'procurement/traceability/:soId', element: <TraceabilityPage /> },

      // System
      {
        path: 'audit-logs',
        element: (
          <PermissionRoute module={MODULE.AUDIT_LOGS} action={PERMISSION_ACTION.ADMIN}>
            <AuditLogPage />
          </PermissionRoute>
        ),
      },
      { path: 'analytics', element: <AnalyticsPage /> },
      {
        path: 'admin/users',
        element: <PermissionRoute module={MODULE.USER_MANAGEMENT} action={PERMISSION_ACTION.ADMIN} />,
        children: [
          { index: true, element: <UserManagementPage /> },
          { path: ':id', element: <UserDetailPage /> },
        ],
      },
      { path: 'profile', element: <ProfilePage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
