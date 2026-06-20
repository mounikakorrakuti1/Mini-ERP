# Frontend Engineering Master Execution Document
## Mini ERP — "Shiv Furniture Works" — From Demand to Delivery

**Document type:** Frontend-only execution blueprint. Backend and testing are out of scope by design — this document assumes `FINAL_PRD.md`, `FINAL_WEBAPPFLOW.md`, and `FINAL_TRD.md` as the binding source of truth and translates their contracts into a buildable React frontend.

**Stack (fixed):** React 18 · TypeScript · Vite · TailwindCSS · Shadcn/UI · Zustand · TanStack Query  
**Builder:** Frontend Engineer operating the **Antigravity Agent** against this document, file by file, in the sequence specified in Part XII.  
**Deployment:** Not required. This document stops at `npm run build` passing locally.

> **Architectural premise carried over from the TRD, unchanged:** the frontend never computes On Hand / Reserved / Free-to-Use itself, never decides a status transition is legal, and never enforces RBAC as a security boundary. Every one of those numbers and rules is rendered from a server response. The frontend's job is to **make the ledger, the state machine, and the role boundary legible** — not to reimplement any of them. Every section below is written to that discipline.

---

## Table of Contents

**Part I — Foundations**
1. Tech Stack & Tooling Setup
2. Complete Frontend Folder Structure
3. Complete Frontend File Structure (by layer)
4. Naming Conventions & File Templates
5. Type Sharing Strategy (status/permission enums)

**Part II — System-Wide Architecture**
6. Routing Architecture
7. Layout Architecture
8. Design System & Theme Architecture
9. Shared UI Library (`components/ui`)
10. Shared Cross-Cutting Components (`components/shared`)
11. State Management Architecture (Zustand + TanStack Query)
12. Component Hierarchy (canonical trees)
13. Responsive Architecture

**Part III — Module Specifications**
14. Authentication UI
15. RBAC UI
16. Dashboard Architecture
17. Product Management UI
18. Inventory UI
19. Sales UI
20. Purchase UI
21. Manufacturing UI
22. Bill of Materials (BoM) UI
23. Procurement UI
24. Audit Log UI
25. Analytics UI
26. AI Assistant UI

**Part IV — Execution**
27. Odoo-Inspired Workflows & Enterprise UX Patterns Applied
28. Antigravity Agent Prompts (per module)
29. Development Sequence & File Creation Sequence
30. Commands Reference
31. Integration Checkpoints

---

# PART I — FOUNDATIONS

## 1. Tech Stack & Tooling Setup

| Layer | Choice | Version/Notes |
|---|---|---|
| Build tool | Vite | `vite` + `@vitejs/plugin-react` |
| Language | TypeScript | `strict: true`, no implicit any, path aliases via `@/*` |
| Styling | TailwindCSS | `tailwind.config.ts` driven by design tokens (Part II §8) |
| Component primitives | Shadcn/UI | CLI-generated into `src/components/ui`, never hand-copied from docs without running the CLI |
| Server state | TanStack Query v5 | One `QueryClient`, `staleTime` tuned per data volatility (Part II §11) |
| Client/UI state | Zustand | One store per concern, never a single mega-store |
| Forms | React Hook Form + Zod | `@hookform/resolvers/zod` bridges the two |
| Tables | TanStack Table v8 | Headless; styled via shadcn `Table` primitives |
| Charts | Recharts | KPI sparklines, vendor spend, manufacturing efficiency, reorder point |
| Routing | React Router v6 (data router) | `createBrowserRouter`, nested layouts, lazy-loaded route modules |
| Drag-and-drop | `@dnd-kit/core` | Manufacturing Kanban (work orders), SO Kanban toggle |
| Icons | `lucide-react` | Matches shadcn's default icon set |
| Date handling | `date-fns` | Lightweight, tree-shakeable; used for delay calculations on the client (display only — delay flags themselves come from the server) |
| HTTP | native `fetch` wrapped in a typed client (`lib/api-client.ts`) | One Axios-style wrapper, not Axios itself — avoids an extra dependency for a thin need |

### 1.1 Why each non-obvious choice

- **TanStack Table over a simpler `<table>` map:** every module list view in this system needs the identical capability set — column sort, status-chip filter, pagination, row click-to-detail. Building that once as a headless table config (Part III, every module) is materially faster across 10+ list views than hand-rolling each one.
- **React Hook Form + Zod over a custom form hook:** every Draft → Confirm → Fulfill module (Sales, Purchase, Manufacturing) needs conditional-mandatory validation (PRD FR-2.2, Business Rule 7) and per-status field locking. RHF's `disabled`/`readOnly` field props plus a single shared Zod schema per entity is the only approach that keeps three near-identical modules from drifting in validation behavior.
- **`@dnd-kit` over `react-beautiful-dnd`:** the latter is unmaintained; `@dnd-kit` is the actively maintained, accessible (keyboard-operable) alternative — relevant for both the Manufacturing Kanban (§21) and the SO Kanban toggle (§19).

### 1.2 Initial Setup Commands

```bash
# 1. Scaffold
npm create vite@latest web -- --template react-ts
cd web

# 2. Core dependencies
npm install react-router-dom @tanstack/react-query @tanstack/react-table zustand
npm install react-hook-form @hookform/resolvers zod
npm install date-fns recharts lucide-react @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install clsx tailwind-merge class-variance-authority

# 3. Tailwind
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 4. Shadcn/UI
npx shadcn@latest init
# When prompted: TypeScript = yes, style = "new-york", base color = slate, CSS variables = yes

# 5. Path alias (tsconfig.json + vite.config.ts)
#    "@/*": ["./src/*"]

# 6. Dev server
npm run dev
```

### 1.3 Shadcn Components to Generate

```bash
npx shadcn@latest add button input label textarea select checkbox switch
npx shadcn@latest add table badge card separator tabs dialog alert-dialog
npx shadcn@latest add dropdown-menu popover tooltip toast sonner
npx shadcn@latest add form sheet skeleton avatar progress
npx shadcn@latest add command combobox calendar date-picker
npx shadcn@latest add scroll-area collapsible accordion
```

---

## 2. Complete Frontend Folder Structure

```
apps/web/
├── public/
│   └── favicon.svg
├── src/
│   ├── api/
│   │   ├── auth.api.ts
│   │   ├── users.api.ts
│   │   ├── products.api.ts
│   │   ├── customers.api.ts
│   │   ├── vendors.api.ts
│   │   ├── sales-orders.api.ts
│   │   ├── purchase-orders.api.ts
│   │   ├── manufacturing-orders.api.ts
│   │   ├── bom.api.ts
│   │   ├── work-centers.api.ts
│   │   ├── inventory.api.ts
│   │   ├── procurement.api.ts
│   │   ├── audit-logs.api.ts
│   │   ├── dashboard.api.ts
│   │   ├── analytics.api.ts
│   │   ├── notifications.api.ts
│   │   └── assistant.api.ts
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.tsx, input.tsx, select.tsx, table.tsx, dialog.tsx, ...
│   │   └── shared/
│   │       ├── app-shell/
│   │       │   ├── AppShell.tsx
│   │       │   ├── Topbar.tsx
│   │       │   ├── Sidebar.tsx
│   │       │   ├── SidebarNavItem.tsx
│   │       │   └── Breadcrumbs.tsx
│   │       ├── data-table/
│   │       │   ├── DataTable.tsx
│   │       │   ├── DataTablePagination.tsx
│   │       │   ├── DataTableColumnHeader.tsx
│   │       │   └── DataTableToolbar.tsx
│   │       ├── status/
│   │       │   ├── StatusChip.tsx
│   │       │   ├── StatusFilterBar.tsx
│   │       │   └── statusColorMap.ts
│   │       ├── kpi/
│   │       │   ├── KpiTile.tsx
│   │       │   └── KpiGrid.tsx
│   │       ├── field-lock/
│   │       │   ├── FieldLockBanner.tsx
│   │       │   └── useFieldLock.ts
│   │       ├── audit/
│   │       │   ├── AuditLogDrawer.tsx
│   │       │   └── AuditLogTimeline.tsx
│   │       ├── notifications/
│   │       │   ├── NotificationBell.tsx
│   │       │   └── NotificationPanel.tsx
│   │       ├── empty-state/
│   │       │   └── EmptyState.tsx
│   │       ├── confirm-dialog/
│   │       │   └── ConfirmActionDialog.tsx
│   │       ├── line-items/
│   │       │   ├── LineItemsTable.tsx
│   │       │   └── LineItemRow.tsx
│   │       ├── stock-card/
│   │       │   └── StockCardTimeline.tsx
│   │       ├── rbac/
│   │       │   ├── Can.tsx
│   │       │   └── RequireRole.tsx
│   │       └── feedback/
│   │           ├── PageLoader.tsx
│   │           └── ErrorBoundary.tsx
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/  (LoginForm, SignupForm, ForgotPasswordForm)
│   │   │   ├── pages/       (LoginPage, SignupPage, ForgotPasswordPage)
│   │   │   └── auth.validation.ts
│   │   ├── rbac/
│   │   │   ├── components/  (UserTable, AssignRoleModal, RoleBadge)
│   │   │   └── pages/       (UserManagementPage)
│   │   ├── dashboard/
│   │   │   ├── components/  (one widget component per §16 widget)
│   │   │   └── pages/       (DashboardPage)
│   │   ├── products/
│   │   │   ├── components/  (ProductForm, ProductTable, ProductDetail, StockAdjustmentModal)
│   │   │   ├── pages/       (ProductListPage, ProductDetailPage)
│   │   │   └── products.validation.ts
│   │   ├── inventory/
│   │   │   ├── components/  (StockLedgerTable, InventorySummaryTable, ReorderPointPanel)
│   │   │   └── pages/       (InventoryLedgerPage, InventorySummaryPage)
│   │   ├── sales-orders/
│   │   │   ├── components/  (SalesOrderForm, SalesOrderTable, SalesOrderKanban, DeliverModal, ConfirmSummary)
│   │   │   ├── pages/       (SalesOrderListPage, SalesOrderDetailPage, SalesOrderCreatePage)
│   │   │   └── sales-order.validation.ts
│   │   ├── purchase-orders/
│   │   │   ├── components/  (PurchaseOrderForm, PurchaseOrderTable, ReceiveModal)
│   │   │   ├── pages/       (PurchaseOrderListPage, PurchaseOrderDetailPage, PurchaseOrderCreatePage)
│   │   │   └── purchase-order.validation.ts
│   │   ├── manufacturing-orders/
│   │   │   ├── components/  (ManufacturingOrderForm, ComponentConsumptionTable, WorkOrderKanban, DoneConfirmDialog)
│   │   │   ├── pages/       (ManufacturingOrderListPage, ManufacturingOrderDetailPage, ManufacturingOrderCreatePage, KanbanBoardPage)
│   │   │   └── manufacturing-order.validation.ts
│   │   ├── bom/
│   │   │   ├── components/  (BomForm, BomComponentsTable, BomOperationsTable, CloneBomModal)
│   │   │   ├── pages/       (BomListPage, BomDetailPage, BomCreatePage)
│   │   │   └── bom.validation.ts
│   │   ├── procurement/
│   │   │   ├── components/  (RecommendationCard, TraceabilityStepper, ProcurementInbox)
│   │   │   └── pages/       (ProcurementRecommendationPage, TraceabilityPage)
│   │   ├── audit-logs/
│   │   │   ├── components/  (AuditLogTable, AuditLogFilters, AuditSummaryTiles)
│   │   │   └── pages/       (AuditLogPage)
│   │   ├── analytics/
│   │   │   ├── components/  (VendorSpendChart, ManufacturingEfficiencyChart, ReorderPointChart, DelayTrendChart)
│   │   │   └── pages/       (AnalyticsPage)
│   │   ├── assistant/
│   │   │   ├── components/  (AssistantPanel, AssistantMessage, AssistantSuggestionChip)
│   │   │   └── assistant.store.ts
│   │   └── partners/
│   │       ├── components/  (CustomerForm, CustomerTable, VendorForm, VendorTable)
│   │       └── pages/       (CustomerListPage, VendorListPage)
│   │
│   ├── store/
│   │   ├── auth.store.ts
│   │   ├── ui.store.ts
│   │   ├── notifications.store.ts
│   │   └── theme.store.ts
│   │
│   ├── routes/
│   │   ├── router.tsx
│   │   ├── RootLayout.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── PermissionRoute.tsx
│   │   └── routeMap.ts
│   │
│   ├── types/
│   │   ├── enums.ts
│   │   ├── product.types.ts
│   │   ├── sales-order.types.ts
│   │   ├── purchase-order.types.ts
│   │   ├── manufacturing-order.types.ts
│   │   ├── bom.types.ts
│   │   ├── inventory.types.ts
│   │   ├── audit-log.types.ts
│   │   ├── dashboard.types.ts
│   │   ├── user.types.ts
│   │   └── api-envelope.types.ts
│   │
│   ├── lib/
│   │   ├── api-client.ts
│   │   ├── query-client.ts
│   │   ├── query-keys.ts
│   │   ├── permissions.ts
│   │   ├── format.ts
│   │   └── cn.ts
│   │
│   ├── hooks/
│   │   ├── useDebouncedValue.ts
│   │   ├── usePagination.ts
│   │   ├── useStatusFilter.ts
│   │   └── usePermission.ts
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── index.html
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
├── package.json
└── .env.example
```

**Why `api/` stays flat:** the TRD's React-Query-owns-server-state rule is easiest to keep honest when every server-touching hook lives in one scannable directory — a reviewer can grep `src/api/` and see the system's entire server-state surface in ten files, rather than hunting across ten feature folders.

---

## 3. Complete Frontend File Structure (by layer)

### 3.1 `api/` — canonical template

```ts
// src/api/sales-orders.api.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { SalesOrder, SalesOrderListParams, CreateSalesOrderInput, DeliverInput } from '@/types/sales-order.types';

export function useSalesOrders(params: SalesOrderListParams) {
  return useQuery({
    queryKey: queryKeys.salesOrders.list(params),
    queryFn: () => apiClient.get<SalesOrder[]>('/sales-orders', { params }),
  });
}

export function useSalesOrder(id: string) {
  return useQuery({
    queryKey: queryKeys.salesOrders.detail(id),
    queryFn: () => apiClient.get<SalesOrder>(`/sales-orders/${id}`),
    enabled: !!id,
  });
}

export function useCreateSalesOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSalesOrderInput) => apiClient.post<SalesOrder>('/sales-orders', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.salesOrders.all }),
  });
}

export function useConfirmSalesOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post<SalesOrder>(`/sales-orders/${id}/confirm`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.salesOrders.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.salesOrders.all });
      qc.invalidateQueries({ queryKey: queryKeys.inventory.summary });
      qc.invalidateQueries({ queryKey: queryKeys.purchaseOrders.all });
      qc.invalidateQueries({ queryKey: queryKeys.manufacturingOrders.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

export function useDeliverSalesOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, items }: { id: string; items: DeliverInput[] }) =>
      apiClient.post<SalesOrder>(`/sales-orders/${id}/deliver`, { items }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.salesOrders.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.inventory.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

export function useCancelSalesOrder() { /* same shape, POST /cancel */ }
```

**The invalidation list on every mutation is the frontend's literal acknowledgment of the WEBAPPFLOW Inventory Impact table.** Every mutation's `onSuccess` list is written by reading that table row-by-row, never guessed.

### 3.2 `features/<module>/` internal shape

```
features/sales-orders/
├── components/
│   ├── SalesOrderForm.tsx
│   ├── SalesOrderTable.tsx
│   ├── SalesOrderKanban.tsx
│   ├── SalesOrderDetailHeader.tsx
│   ├── ConfirmSalesOrderDialog.tsx
│   ├── DeliverSalesOrderModal.tsx
│   └── AvailabilityFlag.tsx
├── pages/
│   ├── SalesOrderListPage.tsx
│   ├── SalesOrderCreatePage.tsx
│   └── SalesOrderDetailPage.tsx
└── sales-order.validation.ts
```

### 3.3 `types/enums.ts` — hand-synced with backend

```ts
export const SO_STATUS = {
  DRAFT: 'DRAFT',
  CONFIRMED: 'CONFIRMED',
  PARTIALLY_DELIVERED: 'PARTIALLY_DELIVERED',
  FULLY_DELIVERED: 'FULLY_DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;
export type SoStatus = typeof SO_STATUS[keyof typeof SO_STATUS];

export const PO_STATUS = {
  DRAFT: 'DRAFT', CONFIRMED: 'CONFIRMED',
  PARTIALLY_RECEIVED: 'PARTIALLY_RECEIVED', FULLY_RECEIVED: 'FULLY_RECEIVED',
  CANCELLED: 'CANCELLED',
} as const;

export const MO_STATUS = {
  DRAFT: 'DRAFT', CONFIRMED: 'CONFIRMED', IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE', CANCELLED: 'CANCELLED',
} as const;

export const WORK_ORDER_STATUS = {
  PENDING: 'PENDING', IN_PROGRESS: 'IN_PROGRESS',
  QUALITY_CHECK: 'QUALITY_CHECK', COMPLETED: 'COMPLETED',
} as const;

export const PROCUREMENT_TYPE = { PURCHASE: 'PURCHASE', MANUFACTURING: 'MANUFACTURING' } as const;

export const ROLE = {
  ADMIN: 'ADMIN', BUSINESS_OWNER: 'BUSINESS_OWNER', SALES_USER: 'SALES_USER',
  PURCHASE_USER: 'PURCHASE_USER', MANUFACTURING_USER: 'MANUFACTURING_USER',
  INVENTORY_MANAGER: 'INVENTORY_MANAGER',
} as const;

export const PERMISSION_ACTION = { ADMIN: 'ADMIN', VIEW: 'VIEW', NONE: 'NONE' } as const;

export const MODULE = {
  PRODUCTS: 'PRODUCTS', SALES_ORDERS: 'SALES_ORDERS', PURCHASE_ORDERS: 'PURCHASE_ORDERS',
  MANUFACTURING_ORDERS: 'MANUFACTURING_ORDERS', BOM: 'BOM', VENDORS: 'VENDORS',
  CUSTOMERS: 'CUSTOMERS', INVENTORY: 'INVENTORY', AUDIT_LOGS: 'AUDIT_LOGS',
  USER_MANAGEMENT: 'USER_MANAGEMENT', DASHBOARDS: 'DASHBOARDS',
} as const;
```

---

## 4. Naming Conventions & File Templates

| Artifact | Convention | Example |
|---|---|---|
| Component file | `PascalCase.tsx`, one default export | `SalesOrderForm.tsx` |
| Hook file | `camelCase.ts`, prefixed `use` | `useFieldLock.ts` |
| API hook file | `kebab-case.api.ts`, named exports only | `sales-orders.api.ts` |
| Zustand store | `camelCase.store.ts`, exports `useXStore` | `ui.store.ts` |
| Validation schema | `kebab-case.validation.ts` | `sales-order.validation.ts` |
| Type file | `kebab-case.types.ts` | `sales-order.types.ts` |
| Page component | suffix `Page` | `SalesOrderListPage.tsx` |
| Modal/Dialog | suffix `Modal` or `Dialog` | `DeliverSalesOrderModal.tsx` |

### 4.1 Standard Component Template

```tsx
import { cn } from '@/lib/cn';

interface ComponentNameProps {
  // explicit, no `any`, no optional-everything
}

export function ComponentName({ ...props }: ComponentNameProps) {
  // 1. hooks (queries, mutations, local state)
  // 2. derived values
  // 3. handlers
  // 4. render
  return <div className={cn('...')}>{/* ... */}</div>;
}
```

### 4.2 Standard Status-Aware Form Template

Fields are **disabled, not hidden** once locked — a visibly disabled field with a tooltip ("Locked since Confirmed") makes the lock legible rather than appearing as data loss.

```tsx
const isFieldLocked = (field: keyof SalesOrder, status: SoStatus) =>
  STATUS_LOCK_MAP[status]?.includes(field) ?? false;

<Input
  {...register('customerAddress')}
  disabled={isFieldLocked('customerAddress', order.status)}
  title={isFieldLocked('customerAddress', order.status) ? 'Locked since Confirmed' : undefined}
/>
```

---

# PART II — SYSTEM-WIDE ARCHITECTURE

## 6. Routing Architecture

### 6.1 Route Map

```ts
// src/routes/routeMap.ts
export const ROUTES = {
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  FORGOT_PASSWORD: '/auth/forgot-password',
  DASHBOARD: '/',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: '/products/:id',
  PRODUCT_CREATE: '/products/new',
  INVENTORY_LEDGER: '/inventory/ledger',
  INVENTORY_SUMMARY: '/inventory/summary',
  SALES_ORDERS: '/sales-orders',
  SALES_ORDER_DETAIL: '/sales-orders/:id',
  SALES_ORDER_CREATE: '/sales-orders/new',
  PURCHASE_ORDERS: '/purchase-orders',
  PURCHASE_ORDER_DETAIL: '/purchase-orders/:id',
  PURCHASE_ORDER_CREATE: '/purchase-orders/new',
  MANUFACTURING_ORDERS: '/manufacturing-orders',
  MANUFACTURING_ORDER_DETAIL: '/manufacturing-orders/:id',
  MANUFACTURING_ORDER_CREATE: '/manufacturing-orders/new',
  MANUFACTURING_KANBAN: '/manufacturing-orders/kanban',
  BOM_LIST: '/bom',
  BOM_DETAIL: '/bom/:id',
  BOM_CREATE: '/bom/new',
  VENDORS: '/vendors',
  CUSTOMERS: '/customers',
  PROCUREMENT_INBOX: '/procurement',
  TRACEABILITY: '/procurement/traceability/:soId',
  AUDIT_LOGS: '/audit-logs',
  ANALYTICS: '/analytics',
  USER_MANAGEMENT: '/admin/users',
  PROFILE: '/profile',
} as const;
```

### 6.2 Router Tree

```tsx
const router = createBrowserRouter([
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
    ],
  },
  {
    path: '/',
    element: <ProtectedRoute><RootLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <DashboardPage /> },
      {
        path: 'products',
        children: [
          { index: true, element: <ProductListPage /> },
          { path: 'new', element: <PermissionRoute module="PRODUCTS" action="ADMIN"><ProductFormPage /></PermissionRoute> },
          { path: ':id', element: <ProductDetailPage /> },
        ],
      },
      { path: 'inventory/ledger', element: <PermissionRoute module="INVENTORY" action="VIEW"><InventoryLedgerPage /></PermissionRoute> },
      { path: 'inventory/summary', element: <InventorySummaryPage /> },
      {
        path: 'sales-orders',
        element: <PermissionRoute module="SALES_ORDERS" action="VIEW" />,
        children: [
          { index: true, element: <SalesOrderListPage /> },
          { path: 'new', element: <PermissionRoute module="SALES_ORDERS" action="ADMIN"><SalesOrderCreatePage /></PermissionRoute> },
          { path: ':id', element: <SalesOrderDetailPage /> },
        ],
      },
      // purchase-orders, manufacturing-orders, bom, vendors, customers — identical nested shape
      { path: 'procurement', element: <ProcurementRecommendationPage /> },
      { path: 'procurement/traceability/:soId', element: <TraceabilityPage /> },
      { path: 'audit-logs', element: <PermissionRoute module="AUDIT_LOGS" action="ADMIN"><AuditLogPage /></PermissionRoute> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'admin/users', element: <PermissionRoute module="USER_MANAGEMENT" action="ADMIN"><UserManagementPage /></PermissionRoute> },
      { path: 'profile', element: <ProfilePage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
```

### 6.3 Route Guards

```tsx
// ProtectedRoute — session boundary only
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const location = useLocation();
  if (!token) return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  return <>{children}</>;
}

// PermissionRoute — UX convenience guard, NOT a security boundary
export function PermissionRoute({ module, action, children }: {
  module: ModuleName; action: PermissionAction; children?: ReactNode;
}) {
  const can = usePermission(module, action);
  if (!can) return <Navigate to={ROUTES.DASHBOARD} replace />;
  return children ? <>{children}</> : <Outlet />;
}
```

**Critical:** `PermissionRoute`'s entire job is to avoid a confused user staring at a blank page. It is never what stands between a Sales User and a Purchase-only endpoint — that boundary is server-side only.

### 6.4 Code Splitting

```tsx
const SalesOrderListPage = lazy(() => import('@/features/sales-orders/pages/SalesOrderListPage'));
// Wrapped in a single <Suspense fallback={<PageLoader />}> at RootLayout
```

### 6.5 Breadcrumbs

Derived from `routeMap.ts` + active route params. The human-readable record `reference` is substituted once its detail query resolves — never the raw UUID.

---

## 7. Layout Architecture

### 7.1 Layout Hierarchy

```
RootLayout
└── AppShell
    ├── Topbar
    │   ├── Logo / Org name
    │   ├── GlobalSearch (Cmd+K)
    │   ├── NotificationBell → NotificationPanel
    │   ├── AssistantTrigger → AssistantPanel
    │   └── UserMenu (Profile / Logout)
    ├── Sidebar
    │   ├── SidebarNavItem × N (role-filtered)
    │   └── CollapseToggle
    └── <main>
        ├── Breadcrumbs
        ├── PageHeader (title + primary actions)
        └── <Outlet />
```

### 7.2 Layout Variants

| Layout | Used by | Distinguishing trait |
|---|---|---|
| `AuthLayout` | Login, Signup, Forgot Password | No Sidebar/Topbar; centered card |
| `AppShell` (default) | Every authenticated route | Sidebar + Topbar + content area |
| `FullBleedLayout` | Manufacturing Kanban, Traceability | Sidebar collapses to icon-rail by default |

### 7.3 List/Detail Page Layout Convention

```
[List Page]                                    [Detail Page]
┌─────────────────────────────────┐            ┌─────────────────────────────────┐
│ PageHeader: "Sales Orders" [+New]│            │ Breadcrumb · SO-000031 [StatusChip]│
├─────────────────────────────────┤            ├─────────────────────────────────┤
│ StatusFilterBar (chip row)       │            │ Header fields (locked per status)│
│ [Kanban|List toggle — SO only]   │            │ [Confirm] [Deliver] [Cancel] [Logs]│
├─────────────────────────────────┤            ├─────────────────────────────────┤
│ DataTableToolbar (search, filters)│           │ Tabs: Lines | Reservations |    │
├─────────────────────────────────┤            │       Procurement | Audit Log   │
│ DataTable                        │            ├─────────────────────────────────┤
│ DataTablePagination              │            │ LineItemsTable (status-aware)   │
└─────────────────────────────────┘            └─────────────────────────────────┘
```

This convention is **identical** across Sales, Purchase, Manufacturing, and BoM — a user who has learned the Sales Order screen has already learned 80% of the others.

---

## 8. Design System & Theme Architecture

### 8.1 Design Direction

Dense over whitespace, legibility over decoration, status color over icon-only signaling. Odoo's own visual language — dense list views, left-hand module rail, status badges as the primary state signal — is the explicit reference point.

### 8.2 CSS Variables (`index.css`)

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  --card: 0 0% 100%;
  --border: 214 32% 91%;
  --primary: 221 83% 53%;
  --primary-foreground: 0 0% 100%;
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
  --destructive: 0 72% 51%;
  --radius: 0.5rem;

  /* Status colors */
  --status-draft: 215 16% 47%;
  --status-confirmed: 221 83% 53%;
  --status-in-progress: 38 92% 50%;
  --status-partial: 38 92% 50%;
  --status-done: 142 71% 35%;
  --status-cancelled: 0 0% 60%;
  --status-shortage: 0 72% 51%;

  /* Inventory accents */
  --inventory-in: 142 71% 35%;
  --inventory-out: 0 72% 51%;
}
```

### 8.3 Status Color Map

```ts
// src/components/shared/status/statusColorMap.ts
export const STATUS_COLOR_MAP: Record<string, { bg: string; text: string; dot: string }> = {
  DRAFT:               { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' },
  CONFIRMED:           { bg: 'bg-blue-100',  text: 'text-blue-700',  dot: 'bg-blue-500' },
  IN_PROGRESS:         { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  PARTIALLY_DELIVERED: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  PARTIALLY_RECEIVED:  { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  FULLY_DELIVERED:     { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  FULLY_RECEIVED:      { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  DONE:                { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  CANCELLED:           { bg: 'bg-gray-100',  text: 'text-gray-500',  dot: 'bg-gray-400' },
};
```

**One rule, no exceptions:** a status string is never colored by an inline conditional inside a component — every status badge resolves color through this single map.

### 8.4 Typography

| Token | Use |
|---|---|
| `text-2xl font-semibold` | Page titles |
| `text-lg font-medium` | Section/card headers |
| `text-sm font-medium` | Table column headers, form labels |
| `text-sm` | Body / table cell default |
| `text-xs text-muted-foreground` | Helper text, timestamps |
| `font-mono text-sm` | Reference codes, quantities, currency |

### 8.5 Spacing & Density

ERP list views default to **compact row height** (`h-10` table rows) and **8px base spacing rhythm** (`gap-2`/`p-2`), matching Odoo's list-density convention.

### 8.6 Iconography (`lucide-react`)

| Concept | Icon |
|---|---|
| Sales Order | `ShoppingCart` |
| Purchase Order | `Truck` |
| Manufacturing Order | `Factory` |
| BoM | `ListTree` |
| Inventory / Stock | `Package` |
| Shortage / Alert | `AlertTriangle` |
| Confirmed/Done | `CheckCircle2` |
| Locked field | `Lock` |
| Audit Log | `History` |
| Procurement (auto) | `Workflow` |
| Traceability | `GitBranch` |
| Notification | `Bell` |
| Assistant | `Sparkles` |

---

## 9. Shared UI Library (`components/ui`)

| Component | Primary use |
|---|---|
| `Button` (variants: default, secondary, destructive, ghost, outline) | Every action |
| `Input`, `Textarea`, `Label` | Every form field |
| `Select`, `Combobox` | Customer/Vendor/Product/BoM pickers |
| `Checkbox`, `Switch` | `Procure on Demand` toggle, boolean filters |
| `Table` | Base table primitive |
| `Badge` | Base primitive wrapped by `StatusChip` |
| `Card` | Dashboard tiles, detail section grouping |
| `Tabs` | Detail-page sections |
| `Dialog`, `AlertDialog` | Modals; `AlertDialog` for destructive actions |
| `Sheet` | Slide-over panels (Audit Log, Notifications, Assistant) |
| `DropdownMenu` | Row-level actions, UserMenu |
| `Popover`, `Tooltip` | Field-lock explanations, computed field hints |
| `Toast` (sonner) | Mutation success/error feedback |
| `Form` (RHF integration) | Every form |
| `Skeleton` | Loading state for all async content |
| `Avatar` | UserMenu, audit log "performed by" |
| `Progress` | Work Order completion, MO progress |
| `Calendar`, `DatePicker` | Date fields, date-range filters |
| `ScrollArea` | Kanban columns, long dropdown lists |
| `Collapsible`, `Accordion` | BoM operations list, traceability nodes |

**Rule:** components in `components/ui` are never edited for one screen's special case. Variants go through `class-variance-authority`, never one-off overrides.

---

## 10. Shared Cross-Cutting Components (`components/shared`)

### 10.1 `DataTable` family

```tsx
interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  isLoading?: boolean;
  pageCount: number;
  pagination: { pageIndex: number; pageSize: number };
  onPaginationChange: (p: PaginationState) => void;
  onRowClick?: (row: TData) => void;
  emptyState?: ReactNode;
}
```

- Server-side pagination/sorting/filtering only — never re-sorts or re-paginates client-side data
- `Skeleton` rows during `isLoading`, `EmptyState` when empty and not loading
- Row click navigates to entity detail page — identical across all 10+ modules

### 10.2 `StatusChip` / `StatusFilterBar`

```tsx
<StatusChip status={order.status} />
<StatusFilterBar
  statuses={SO_STATUS_LIST}
  counts={statusCounts}
  active={activeStatus}
  onChange={setActiveStatus}
/>
```

### 10.3 `KpiTile` / `KpiGrid`

```tsx
<KpiGrid>
  <KpiTile label="Total Sales Orders" value={counters.totalSalesOrders} icon={ShoppingCart} />
  <KpiTile label="Pending Deliveries" value={counters.pendingDeliveries} icon={Truck} tone="warning" />
  <KpiTile label="Delayed Orders" value={counters.delayedOrders} icon={AlertTriangle} tone="danger" />
</KpiGrid>
```

### 10.4 `FieldLockBanner` / `useFieldLock`

```tsx
export function useFieldLock<TStatus extends string>(
  status: TStatus,
  lockMap: Record<TStatus, string[]>,
) {
  return (field: string) => lockMap[status]?.includes(field) ?? false;
}
```

`FieldLockBanner` renders a small inline notice ("Locked since Confirmed — Customer, Address, and Order Date are fixed") at the top of any form section containing a locked field.

### 10.5 `AuditLogDrawer`

```tsx
<AuditLogDrawer recordType="SalesOrder" recordId={order.id} open={open} onOpenChange={setOpen} />
```

A `Sheet` that mounts `useAuditLogs({ recordType, recordId })` and renders an `AuditLogTimeline`. Opened from a **"Logs" button present on every record detail page** — one component backs all those buttons.

### 10.6 `LineItemsTable` / `LineItemRow`

Shared editable grid backing Sales Order lines, Purchase Order lines, MO components, and BoM components/operations:

```tsx
<LineItemsTable
  items={order.items}
  columns={salesOrderLineColumns}
  onAddLine={addLine}
  onRemoveLine={removeLine}
  readOnly={isFieldLocked('items')}
/>
```

### 10.7 `ConfirmActionDialog`

Generic confirmation before any irreversible status transition. Renders a **preview of consequences** — e.g. for SO Confirm: "This will reserve 20 units of Dining Table. Free-to-Use is currently 5 — a Draft Manufacturing Order for 15 units will be created automatically."

### 10.8 `StockCardTimeline`

```
2026-06-01  PURCHASE_RECEIPT   +100   PO-000012
2026-06-07  SALES_DELIVERY      -10   SO-000031
2026-06-10  MO_CONSUMPTION      -40   MO-2026-004
```

Each row's reference code links to that source record's detail page.

### 10.9 `Can` (RBAC render guard)

```tsx
<Can module="SALES_ORDERS" action="ADMIN">
  <Button onClick={onConfirm}>Confirm</Button>
</Can>
```

Renders nothing if the user lacks the permission — **purely a "don't show a button that would 403" convenience**, never security.

---

## 11. State Management Architecture

### 11.1 The One Rule

**If a value is ever fetched from or written to the API, it lives in TanStack Query. Full stop.** Zustand never caches, mirrors, or duplicates server data.

### 11.2 Zustand Stores

| Store | Holds | Persisted? |
|---|---|---|
| `auth.store.ts` | `token`, decoded `user` + `permissions`, `login()`, `logout()` | Memory only |
| `ui.store.ts` | Active status filter per module, Kanban/List toggle, modal flags, sidebar collapsed | Sidebar-collapsed to localStorage |
| `notifications.store.ts` | Unread count + panel open flag | No |
| `theme.store.ts` | Light/dark toggle | Yes |
| `assistant.store.ts` | Conversation history (ephemeral) | No |

```ts
interface UiState {
  statusFilters: Record<string, string | null>;
  setStatusFilter: (module: string, status: string | null) => void;
  kanbanView: Record<string, boolean>;
  toggleKanbanView: (module: string) => void;
  openModal: string | null;
  setOpenModal: (id: string | null) => void;
}
export const useUiStore = create<UiState>((set) => ({ /* ... */ }));
```

### 11.3 TanStack Query Conventions

**Centralized query-key factory:**

```ts
// src/lib/query-keys.ts
export const queryKeys = {
  salesOrders: {
    all: ['sales-orders'] as const,
    list: (params: SalesOrderListParams) => ['sales-orders', 'list', params] as const,
    detail: (id: string) => ['sales-orders', 'detail', id] as const,
    auditLogs: (id: string) => ['sales-orders', id, 'audit-logs'] as const,
  },
  inventory: {
    all: ['inventory'] as const,
    summary: ['inventory', 'summary'] as const,
    movements: (params: object) => ['inventory', 'movements', params] as const,
  },
  dashboard: {
    all: ['dashboard'] as const,
    counters: ['dashboard', 'counters'] as const,
    roleSummary: ['dashboard', 'role-summary'] as const,
  },
  // one block per module
};
```

**`staleTime` policy:**

| Data category | `staleTime` | `refetchInterval` |
|---|---|---|
| Reference data (Customers, Vendors) | 5 min | — |
| Order lists/details | 0 | — |
| Dashboard KPI counters | 0 | 5–10s |
| Notifications | 0 | 5–10s |
| Inventory summary / Stock Card | 0 | — (invalidation-driven) |
| Audit Logs | 30s | — |

**Mutation pattern:**
```ts
useMutation({
  mutationFn,
  onSuccess: (data, variables) => {
    // 1. invalidate every query the Inventory Impact table says this touches
    // 2. toast.success('...') naming the resulting status
  },
  onError: (error) => toast.error(getErrorMessage(error)),
});
```

### 11.4 Why Auth Lives in Zustand

A JWT is session state, not server data. Modeling it as a Query would invite accidental refetch/cache-eviction to silently drop a live session.

---

## 12. Component Hierarchy (canonical trees)

### 12.1 App Shell

```
App
└── QueryClientProvider
    └── RouterProvider
        └── ProtectedRoute
            └── RootLayout
                └── AppShell
                    ├── Topbar
                    │   ├── GlobalSearch
                    │   ├── NotificationBell → NotificationPanel(Sheet)
                    │   ├── AssistantTrigger → AssistantPanel(Sheet)
                    │   └── UserMenu(DropdownMenu)
                    ├── Sidebar
                    │   └── SidebarNavItem × N (role-filtered)
                    └── <Suspense>
                        └── Outlet → [active page]
```

### 12.2 Canonical Order-Lifecycle Detail Page

```
SalesOrderDetailPage
├── Breadcrumbs
├── SalesOrderDetailHeader
│   ├── StatusChip
│   ├── Action buttons: <Can>Confirm</Can> <Can>Deliver</Can> <Can>Cancel</Can>
│   └── "Logs" button → AuditLogDrawer
├── FieldLockBanner (conditional)
├── Card: Header fields (Customer, Address, Sales Person, Order Date)
└── Tabs
    ├── Tab "Lines" → LineItemsTable → LineItemRow × N → AvailabilityFlag (conditional)
    ├── Tab "Reservations"
    ├── Tab "Procurement" → RecommendationCard (if applicable)
    └── Tab "Audit Log" → AuditLogTimeline (embedded)
```

### 12.3 Dashboard Page (role-resolved widget composition)

```
DashboardPage
├── KpiGrid → KpiTile × 6
└── RoleWidgetSection
    ├── [Admin]        AuditSummaryTiles · ActiveUsersByRole · ReconciliationHealthBanner
    ├── [BizOwner]     DelayedOrdersByModule · ManufacturingEfficiencyChart · MaterialShortageWatch
    ├── [Sales]        OrdersByStatusChart · DelayedDeliveriesList · RevenueThisMonthTile
    ├── [Purchase]     PartialReceiptsList · AutoCreatedPOsInbox · SpendByVendorChart
    ├── [Manufacturing] ManufacturingKanbanPreview · AutoCreatedMOsInbox · WorkCenterUtilizationChart
    └── [Inventory]    LowStockAlertsList · LiveStockMovementFeed · InventorySnapshotTable
```

**The page never contains an `if (role === 'SALES') ...` branch for data fetching** — it renders whatever the single `GET /dashboard/role-summary` response contains.

### 12.4 Manufacturing Kanban (drag-and-drop)

```
KanbanBoardPage
└── DndContext (@dnd-kit)
    └── KanbanColumn × 4  (Pending | In Progress | Quality Check | Completed)
        └── SortableContext
            └── WorkOrderCard × N
                ├── operation name + work center
                ├── MO reference (links to MO detail)
                └── expected vs real duration
```

Drag between columns → `usePatchWorkOrder()` fires `onDragEnd`; optimistic update via `onMutate` with rollback in `onError`.

---

## 13. Responsive Architecture

### 13.1 Breakpoints

| Breakpoint | Width | Primary layout shift |
|---|---|---|
| `base` (<640px) | Phone | Sidebar hidden behind hamburger; tables collapse to stacked cards |
| `sm` (≥640px) | Large phone | Tables gain horizontal scroll |
| `md` (≥768px) | Tablet | Sidebar becomes persistent icon-rail |
| `lg` (≥1024px) | Laptop | **Primary design target** — Sidebar persistent and expanded |
| `xl` (≥1280px) | Desktop | Detail pages gain secondary right-hand panel |

**Design priority: desktop/laptop first, tablet second, phone third.** ERP operators are at a desk or shop-floor tablet, not entering Sales Orders one-handed.

### 13.2 Table → Card Collapse Pattern

Below `sm`, every `DataTable` switches from `<tr>` to stacked `Card` showing: reference, status chip, and 2–3 fields marked `priority: true`. `DataTable` owns the breakpoint switch — no module re-implements responsive collapse independently.

### 13.3 Form Responsive Behavior

`grid-cols-1` below `md`, `grid-cols-2` at `md`+, `grid-cols-3` at `xl`+. Never more than 3 columns — 4+-column forms measurably increase miskeyed entry.

---

# PART III — MODULE SPECIFICATIONS

> Every module follows the same specification template: **Folder · Files · Components · Hooks · Services · Zustand · TanStack Query · Forms · Tables · Charts · Modals · Validation.** Where a module has no need for a category, that line states "None — by design."

## 14. Authentication UI

**Folder:** `src/features/auth/`

**Files:**
```
features/auth/
├── components/
│   ├── LoginForm.tsx
│   ├── SignupForm.tsx
│   └── ForgotPasswordForm.tsx
├── pages/
│   ├── LoginPage.tsx
│   ├── SignupPage.tsx
│   └── ForgotPasswordPage.tsx
└── auth.validation.ts
```

**Components:**
- `LoginForm` — Login ID + Password fields, single error slot rendering the exact server string `"Invalid Login Id or Password"` — **never a field-specific error** (anti-enumeration).
- `SignupForm` — Login ID, Email, Password, Confirm Password, Name. Inline complexity hints under Password that light up live — client-side hinting only, server is the actual validator.
- `ForgotPasswordForm` — Email field only; gated behind a feature flag so it can be cut without touching routing.

**Services (`api/auth.api.ts`):**
```ts
export function useLogin() {
  return useMutation({
    mutationFn: (input: LoginInput) => apiClient.post<LoginResponse>('/auth/login', input),
  });
}
export function useSignup() {
  return useMutation({ mutationFn: (input: SignupInput) => apiClient.post('/auth/signup', input) });
}
```

**Zustand:** `auth.store.ts` — `login(token, user)` called from `LoginForm`'s `onSuccess`. On success, also triggers the first `useDashboardCounters()` prefetch so Dashboard renders with warm cache.

**Post-signup state (critical):** success screen must say *"Account created. An administrator will assign your role before you can access the system."* — not a generic success, and not an auto-redirect into the app shell.

**Validation (`auth.validation.ts`):**
```ts
export const loginSchema = z.object({
  loginId: z.string().min(1, 'Login ID is required'),
  password: z.string().min(1, 'Password is required'),
});

export const signupSchema = z.object({
  loginId: z.string().min(6).max(12),
  email: z.string().email(),
  password: z.string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
  confirmPassword: z.string(),
  name: z.string().min(1),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match', path: ['confirmPassword'],
});
```

**Forms:** React Hook Form + `zodResolver`. **Tables:** None. **Charts:** None. **Modals:** None.

---

## 15. RBAC UI

> The frontend's only two RBAC responsibilities: (1) **hide what a role can't act on** as a courtesy, and (2) **give Admins a screen to assign roles.** Nothing here is a security boundary.

**Folder:** `src/features/rbac/`, `src/lib/permissions.ts`, `src/components/shared/rbac/`

**Files:**
```
features/rbac/
├── components/
│   ├── UserTable.tsx
│   ├── AssignRoleModal.tsx
│   └── RoleBadge.tsx
└── pages/
    └── UserManagementPage.tsx
```

**Components:**
- `UserTable` — Admin-only list: Login ID, Name, Email, Role, Position, Active, "Pending Assignment" badge.
- `AssignRoleModal` — Role select + Position input; submits `PATCH /users/:id`.
- `RoleBadge` — distinct palette from status colors so role and status are never visually confused.

**Hooks:**
```ts
export function usePermission(module: ModuleName, action: PermissionAction) {
  const claims = useAuthStore((s) => s.user?.permissions);
  return hasPermission(claims, module, action);
}
```

**Profile form (self-edit):** Email renders read-only with tooltip "Email cannot be changed." Position renders read-only unless viewer is Admin. **These are two separate form components** — they have opposite field-editability rules and merging them invites permission-bleed bugs.

**Tables:** `UserTable` via shared `DataTable`, columns: Login ID, Name, Email, Role (`RoleBadge`), Position, Status, Actions.

**Modals:** `AssignRoleModal` (`Dialog`).

**Validation:**
```ts
export const assignRoleSchema = z.object({
  roleId: z.string().uuid('Select a role'),
  position: z.string().min(1, 'Position is required'),
});
export const selfProfileSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  mobileNumber: z.string().regex(/^[0-9]{10}$/, 'Enter a 10-digit mobile number').optional(),
});
```

### 15.4 Sidebar Nav Config

```ts
const NAV_CONFIG = [
  { label: 'Dashboard',        path: ROUTES.DASHBOARD,          icon: LayoutDashboard, module: 'DASHBOARDS' },
  { label: 'Products',         path: ROUTES.PRODUCTS,           icon: Package,         module: 'PRODUCTS' },
  { label: 'Sales Orders',     path: ROUTES.SALES_ORDERS,       icon: ShoppingCart,    module: 'SALES_ORDERS' },
  { label: 'Purchase Orders',  path: ROUTES.PURCHASE_ORDERS,    icon: Truck,           module: 'PURCHASE_ORDERS' },
  { label: 'Manufacturing',    path: ROUTES.MANUFACTURING_ORDERS,icon: Factory,        module: 'MANUFACTURING_ORDERS' },
  { label: 'Bill of Materials',path: ROUTES.BOM_LIST,           icon: ListTree,        module: 'BOM' },
  { label: 'Inventory',        path: ROUTES.INVENTORY_SUMMARY,  icon: Boxes,           module: 'INVENTORY' },
  { label: 'Vendors',          path: ROUTES.VENDORS,            icon: Building2,       module: 'VENDORS' },
  { label: 'Customers',        path: ROUTES.CUSTOMERS,          icon: Users,           module: 'CUSTOMERS' },
  { label: 'Audit Logs',       path: ROUTES.AUDIT_LOGS,         icon: History,         module: 'AUDIT_LOGS' },
  { label: 'Analytics',        path: ROUTES.ANALYTICS,          icon: BarChart3,       module: 'DASHBOARDS' },
  { label: 'User Management',  path: ROUTES.USER_MANAGEMENT,    icon: ShieldCheck,     module: 'USER_MANAGEMENT' },
];
// Sidebar.tsx: NAV_CONFIG.filter(item => hasPermission(claims, item.module, 'VIEW'))
```

The hidden nav item is a courtesy. The 403 from the server is the actual wall.

---

## 16. Dashboard Architecture

**Folder:** `src/features/dashboard/`

**Files:**
```
features/dashboard/
├── components/
│   ├── KpiCounterRow.tsx
│   ├── AuditSummaryTiles.tsx              # Admin
│   ├── ActiveUsersByRole.tsx              # Admin
│   ├── ReconciliationHealthBanner.tsx     # Admin
│   ├── DelayedOrdersByModule.tsx          # Business Owner
│   ├── ManufacturingEfficiencyWidget.tsx  # Business Owner
│   ├── MaterialShortageWatch.tsx          # Business Owner
│   ├── OrdersByStatusChart.tsx            # Sales
│   ├── DelayedDeliveriesList.tsx          # Sales
│   ├── RevenueThisMonthTile.tsx           # Sales
│   ├── PartialReceiptsList.tsx            # Purchase
│   ├── AutoCreatedPOsInbox.tsx            # Purchase
│   ├── SpendByVendorChart.tsx             # Purchase
│   ├── OpenMOsList.tsx                    # Manufacturing
│   ├── AutoCreatedMOsInbox.tsx            # Manufacturing
│   ├── ManufacturingKanbanPreview.tsx     # Manufacturing
│   ├── WorkCenterUtilizationChart.tsx     # Manufacturing
│   ├── LowStockAlertsList.tsx             # Inventory Manager
│   ├── LiveStockMovementFeed.tsx          # Inventory Manager
│   └── InventorySnapshotTable.tsx         # Inventory Manager
└── pages/
    └── DashboardPage.tsx
```

**Services (`api/dashboard.api.ts`):**
```ts
export function useDashboardCounters() {
  return useQuery({
    queryKey: queryKeys.dashboard.counters,
    queryFn: () => apiClient.get<DashboardCounters>('/dashboard/counters'),
    refetchInterval: 7000,
  });
}
export function useDashboardRoleSummary() {
  return useQuery({
    queryKey: queryKeys.dashboard.roleSummary,
    queryFn: () => apiClient.get<RoleSummaryPayload>('/dashboard/role-summary'),
    refetchInterval: 7000,
  });
}
```

**Key rule:** widgets are dumb rendering components that receive data as props — **no widget issues its own independent fetch.** This is what makes the <500ms load NFR achievable: one network round trip, not twelve.

**Reconciliation Health Banner (Admin):** reads `GET /inventory/reconciliation-check`. Renders green "Ledger reconciled — 0 mismatches" or a red banner naming affected product IDs. Can be cut to a one-time pre-demo script with a one-line removal from `DashboardPage`.

**Forms:** None. **Tables:** `InventorySnapshotTable`. **Charts:** `OrdersByStatusChart` (donut), `SpendByVendorChart` (bar), `WorkCenterUtilizationChart` (horizontal bar). **Modals:** None — "view more" navigates to the full list page.

---

## 17. Product Management UI

**Folder:** `src/features/products/`

**Files:**
```
features/products/
├── components/
│   ├── ProductForm.tsx
│   ├── ProductTable.tsx
│   ├── ProductFilters.tsx
│   ├── ProductDetailHeader.tsx
│   ├── InventorySnapshotCard.tsx
│   ├── StockAdjustmentModal.tsx
│   └── ProcurementConfigSection.tsx
├── pages/
│   ├── ProductListPage.tsx
│   ├── ProductDetailPage.tsx
│   └── ProductFormPage.tsx
└── products.validation.ts
```

**`ProcurementConfigSection`** — the most behaviorally important component in this module:

```tsx
function ProcurementConfigSection({ control, watch }: ProductFormSectionProps) {
  const procureOnDemand = watch('procureOnDemand');
  const procurementType = watch('procurementType');
  return (
    <>
      <Switch {...register('procureOnDemand')} label="Procure on Demand" />
      {procureOnDemand && (
        <Select {...register('procurementType')} required>
          <option value="PURCHASE">Purchase</option>
          <option value="MANUFACTURING">Manufacturing</option>
        </Select>
      )}
      {procureOnDemand && procurementType === 'PURCHASE' && (
        <Combobox {...register('defaultVendorId')} options={vendors} required label="Default Vendor" />
      )}
      {procureOnDemand && procurementType === 'MANUFACTURING' && (
        <Combobox {...register('defaultBomId')} options={bomsForThisProduct} required label="Default BoM" />
      )}
    </>
  );
}
```

**Critical:** On Hand / Reserved / Free-to-Use are **never form fields** — rendered only as read-only `InventorySnapshotCard` values on the detail page. The `StockAdjustmentModal` renders only behind `<Can module="INVENTORY" action="ADMIN">` and states: *"This is the only way to directly change On Hand outside of order fulfillment. This action is logged."*

**Invalidation cross-wiring:** `queryKeys.products.detail(id)` is added to the `onSuccess` invalidation list of `useDeliverSalesOrder`, `useReceivePurchaseOrder`, and `useCompleteManufacturingOrder` — the easiest cross-module wiring to forget.

**Validation (`products.validation.ts`):**
```ts
export const productSchema = z.object({
  name: z.string().min(1),
  salesPrice: z.coerce.number().min(0),
  costPrice: z.coerce.number().min(0),
  reorderPoint: z.coerce.number().min(0).optional(),
  procureOnDemand: z.boolean(),
  procurementType: z.enum(['PURCHASE', 'MANUFACTURING']).optional(),
  defaultVendorId: z.string().uuid().optional(),
  defaultBomId: z.string().uuid().optional(),
}).superRefine((data, ctx) => {
  if (data.procureOnDemand && !data.procurementType) {
    ctx.addIssue({ code: 'custom', path: ['procurementType'], message: 'Required when Procure on Demand is on' });
  }
  if (data.procurementType === 'PURCHASE' && !data.defaultVendorId) {
    ctx.addIssue({ code: 'custom', path: ['defaultVendorId'], message: 'Vendor is required for Purchase' });
  }
  if (data.procurementType === 'MANUFACTURING' && !data.defaultBomId) {
    ctx.addIssue({ code: 'custom', path: ['defaultBomId'], message: 'BoM is required for Manufacturing' });
  }
});

export const stockAdjustmentSchema = z.object({
  direction: z.enum(['IN', 'OUT']),
  quantity: z.coerce.number().positive(),
  reason: z.string().min(1, 'Reason is required'),
});
```

---

## 18. Inventory UI

**Folder:** `src/features/inventory/`

**Files:**
```
features/inventory/
├── components/
│   ├── StockLedgerTable.tsx
│   ├── StockLedgerFilters.tsx
│   ├── InventorySummaryTable.tsx
│   ├── ReorderPointPanel.tsx
│   └── ReconciliationCheckPanel.tsx
└── pages/
    ├── InventoryLedgerPage.tsx
    └── InventorySummaryPage.tsx
```

**`ReorderPointPanel`** — renders formula inputs (Average Daily Usage, Vendor Lead Time, Maximum Daily Usage, Maximum Historical Delivery Delay) alongside computed Reorder Point and Safety Stock — the literal "how did the system arrive at this number" surface.

**Services (`api/inventory.api.ts`):**
```ts
export function useInventorySummary(params: PaginationParams) { /* GET /inventory/summary */ }
export function useStockMovements(params: { productId?: string; sourceType?: string; dateFrom?: string; dateTo?: string }) {
  /* GET /inventory/movements */
}
```

**`useStockMovements` is invalidated by every mutation the Inventory Impact table marks as having a stock effect** — the broadest invalidation fan-in in the application.

**Tables:** `StockLedgerTable` columns: Date, Direction (colored per `--inventory-in`/`--inventory-out`), Quantity, Source Type, Source Reference (links to SO/PO/MO), Performed By. `InventorySummaryTable`: Reference, Name, On Hand, Reserved, Free-to-Use, Reorder Point, Low-Stock flag.

**Forms:** None. **Charts:** None (trend visualization is Analytics). **Modals:** None.

---

## 19. Sales UI

**Folder:** `src/features/sales-orders/`

**Files:**
```
features/sales-orders/
├── components/
│   ├── SalesOrderForm.tsx
│   ├── SalesOrderTable.tsx
│   ├── SalesOrderKanban.tsx
│   ├── SalesOrderDetailHeader.tsx
│   ├── AvailabilityFlag.tsx
│   ├── ConfirmSalesOrderDialog.tsx
│   ├── DeliverSalesOrderModal.tsx
│   └── CancelSalesOrderDialog.tsx
├── pages/
│   ├── SalesOrderListPage.tsx
│   ├── SalesOrderCreatePage.tsx
│   └── SalesOrderDetailPage.tsx
└── sales-order.validation.ts
```

**Field lock map:**
```ts
const SO_LOCK_MAP: Record<SoStatus, string[]> = {
  DRAFT: [],
  CONFIRMED: ['customerId', 'customerAddress', 'orderDate'],
  PARTIALLY_DELIVERED: ['customerId', 'customerAddress', 'orderDate', 'items[].orderedQty', 'items[].salesPrice'],
  FULLY_DELIVERED: ['*'],
  CANCELLED: ['*'],
};
```

**`ConfirmSalesOrderDialog`** — preview text phrased as a **forecast** ("will reserve," "will be created"), never as already-decided fact. Concurrent confirmations by another user may have changed Free-to-Use between dialog-open and submit; the actual result is the authoritative truth, not the preview.

**`DeliverSalesOrderModal`** — per-line "Delivered Qty" input seeded with the **current cumulative** value (never zero, never a delta). The modal's UI text says: *"Enter the new total delivered quantity, not the additional amount."*

**`AvailabilityFlag`** — renders only when `line.isAvailable === false` (server-computed). Never blocks the Save button at Draft.

**`SalesOrderKanban`** — columns = SO_STATUS values (minus `CANCELLED`, shown via filter toggle). Cards show reference, customer, total, and AvailabilityFlag if any line is short.

**`useConfirmSalesOrder` invalidation list (widest blast radius in the entire frontend):**
```ts
qc.invalidateQueries({ queryKey: queryKeys.salesOrders.detail(id) });
qc.invalidateQueries({ queryKey: queryKeys.salesOrders.all });
qc.invalidateQueries({ queryKey: queryKeys.inventory.summary });
qc.invalidateQueries({ queryKey: queryKeys.purchaseOrders.all });
qc.invalidateQueries({ queryKey: queryKeys.manufacturingOrders.all });
qc.invalidateQueries({ queryKey: queryKeys.dashboard.all });
```

**No optimistic updates** on this module — a confirmed SO can create auto-MOs/POs; an optimistic state would misrepresent those side effects.

**Validation (`sales-order.validation.ts`):**
```ts
export const salesOrderCreateSchema = z.object({
  customerId: z.string().uuid('Select a customer'),
  customerAddress: z.string().min(1),
  salesPersonId: z.string().uuid(),
  expectedDeliveryDate: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    orderedQty: z.coerce.number().positive('Quantity must be greater than 0'),
    salesPrice: z.coerce.number().min(0),
  })).min(1, 'Add at least one line item'),
});
```

---

## 20. Purchase UI

**Folder:** `src/features/purchase-orders/`

> Structural mirror of Sales Orders — `vendorId`/`vendorAddress`/`responsiblePersonId`/`costPrice` in place of customer-side fields. Only differences documented below.

**What's genuinely different from Sales:**

- **No custom Confirm preview dialog** — PO Confirm has zero inventory effect. Uses a plain `ConfirmActionDialog` with copy: *"Confirming locks Vendor, Address, and Order Date. This does not affect stock — stock increases only when goods are received."*
- **`AutoCreatedBadge`** — renders "Triggered by SO-000031" link when `auto_created = true`.
- **`ReceiveModal`** — identical interaction pattern to `DeliverSalesOrderModal` (cumulative qty entry).
- **`useConfirmPurchaseOrder` invalidation list is SHORTER than Sales'** — only `purchaseOrders.detail`, `purchaseOrders.all`, `dashboard.all`. No inventory keys — Confirm has no stock effect.
- **`useReceivePurchaseOrder` invalidation list:** `purchaseOrders.*`, `inventory.*`, `products.detail(productId)` per received line, `dashboard.all`.

**Do not copy Sales Confirm's invalidation list onto Purchase Confirm** — this is the single most important distinction in this module.

---

## 21. Manufacturing UI

**Folder:** `src/features/manufacturing-orders/`

**Files:**
```
features/manufacturing-orders/
├── components/
│   ├── ManufacturingOrderForm.tsx
│   ├── ManufacturingOrderTable.tsx
│   ├── ManufacturingOrderDetailHeader.tsx
│   ├── ComponentConsumptionTable.tsx
│   ├── WorkOrderList.tsx
│   ├── WorkOrderKanban.tsx
│   ├── StartMODialog.tsx
│   ├── DoneConfirmDialog.tsx
│   ├── CancelMODialog.tsx
│   └── AutoCreatedBadge.tsx
├── pages/
│   ├── ManufacturingOrderListPage.tsx
│   ├── ManufacturingOrderCreatePage.tsx
│   ├── ManufacturingOrderDetailPage.tsx
│   └── KanbanBoardPage.tsx
└── manufacturing-order.validation.ts
```

**`ManufacturingOrderForm`** — Finished Product `Combobox` first → filters BoM `Combobox` to only BoMs whose `finishedProductId` matches. Selecting a BoM triggers a **client-side copy preview** of components and work orders (scaled by quantity) before save — cosmetic only, authoritative copy happens server-side.

**`ComponentConsumptionTable`** — Required Qty always read-only. Consumed Qty: **hidden in Draft**, editable in Confirmed/In Progress, **locked in Done/Cancelled**. Requires `useComponentLock` (a separate hook from `useFieldLock` because this field's *visibility* changes, not just its editability).

**`DoneConfirmDialog`** — highest-stakes confirmation in the system. Preview text generated from the loaded MO's actual components:
*"Completing this will write OUT 40 Legs, 10 Tops, 120 Screws and IN 10 Wooden Tables — in one transaction."*

**Field lock map:**
```ts
const MO_LOCK_MAP: Record<MoStatus, string[]> = {
  DRAFT: [],
  CONFIRMED: ['finishedProductId', 'bomId', 'quantity'],
  IN_PROGRESS: ['finishedProductId', 'bomId', 'quantity'],
  DONE: ['*'],
  CANCELLED: ['*'],
};
```

**`useCompleteManufacturingOrder` — widest single-mutation invalidation in the system:**
```ts
qc.invalidateQueries({ queryKey: queryKeys.manufacturingOrders.detail(id) });
qc.invalidateQueries({ queryKey: queryKeys.manufacturingOrders.all });
qc.invalidateQueries({ queryKey: queryKeys.inventory.all });
qc.invalidateQueries({ queryKey: queryKeys.products.all });  // NOT just inventory.all — these back different screens
qc.invalidateQueries({ queryKey: queryKeys.dashboard.all });
```

**`useCancelManufacturingOrder` must NOT invalidate any inventory/product key** — cancellation has no stock effect.

**Validation:**
```ts
export const manufacturingOrderCreateSchema = z.object({
  finishedProductId: z.string().uuid(),
  bomId: z.string().uuid(),
  quantity: z.coerce.number().positive(),
  assigneeId: z.string().uuid().optional(),
  plannedStartDate: z.string().optional(),
  expectedCompletionDate: z.string().optional(),
});
```

---

## 22. Bill of Materials (BoM) UI

**Folder:** `src/features/bom/`

**Files:**
```
features/bom/
├── components/
│   ├── BomForm.tsx
│   ├── BomComponentsTable.tsx
│   ├── BomOperationsTable.tsx
│   ├── BomTable.tsx
│   ├── CloneBomModal.tsx
│   └── DeleteBomGuardDialog.tsx
├── pages/
│   ├── BomListPage.tsx
│   ├── BomCreatePage.tsx
│   └── BomDetailPage.tsx
└── bom.validation.ts
```

**Two separate table instances** — components (Product + Qty) and operations (Name + Work Center + Duration) have different column shapes; do not merge into one grid.

**Self-reference guard:** component Product `Combobox` excludes the BoM's own Finished Product client-side — the server also rejects it, but the UI provides instant feedback.

**`CloneBomModal`** — pre-fills a fresh `BomCreatePage` form with source BoM's data; the actual `POST /bom` call on save is identical to from-scratch creation (no dedicated clone endpoint).

**`DeleteBomGuardDialog`** — on a `409`, renders: *"This BoM is the default for [Product Name]'s auto-procurement. Remove it as the default first."* Never a bare "Conflict" or raw status code.

**BoM has no status/lifecycle** — do not add `StatusChip` or a status lock map. An active BoM stays editable indefinitely (editing never retroactively touches in-flight MOs, which snapshot at creation).

**Validation:**
```ts
export const bomSchema = z.object({
  finishedProductId: z.string().uuid(),
  referenceQuantity: z.coerce.number().positive(),
  items: z.array(z.object({
    componentId: z.string().uuid(),
    quantity: z.coerce.number().positive(),
  })).min(1, 'A BoM needs at least one component'),
  operations: z.array(z.object({
    operationName: z.string().min(1),
    workCenterId: z.string().uuid().optional(),
    durationMinutes: z.coerce.number().positive(),
    sequence: z.coerce.number().int().min(0),
  })),
}).superRefine((data, ctx) => {
  if (data.items.some((i) => i.componentId === data.finishedProductId)) {
    ctx.addIssue({ code: 'custom', path: ['items'], message: 'A product cannot be a component of its own BoM' });
  }
});
```

---

## 23. Procurement UI

**Folder:** `src/features/procurement/`

> Pure read-models over data that already exists elsewhere. **No AI anywhere in this module** — every number is either a stored field or a disclosed, fixed-weight formula reproducible with a calculator.

**Files:**
```
features/procurement/
├── components/
│   ├── ProcurementInbox.tsx
│   ├── RecommendationCard.tsx
│   ├── TraceabilityStepper.tsx
│   └── ReorderPointBadge.tsx
└── pages/
    ├── ProcurementRecommendationPage.tsx
    └── TraceabilityPage.tsx
```

**`ProcurementInbox`** — filtered list of `auto_created = true AND status = 'DRAFT'` POs and MOs, role-scoped by server. Each row's action navigates to that record's own detail page — this Inbox is a routing surface only, not a place where Confirm happens.

**`RecommendationCard`** — renders the exact layout from the WEBAPPFLOW §8.2:
```
┌──────────────────────────────────────────────────────────┐
│  Wooden Table — Shortage: 15 units                        │
│  Triggered by: SO-000031 (Ramesh Traders)                 │
│                                                            │
│   MANUFACTURE          │   PURCHASE                       │
│   Cost: ₹40,000        │   Cost: ₹50,000                 │
│   Lead Time: 3 Days    │   Lead Time: 2 Days              │
│   Score: 2.1           │   Score: 3.4                     │
│   Components: ✅ Ready │   Vendor: Sharma Supplies        │
│                                                            │
│   ★ Recommendation: Manufacture (lower score)             │
│   [View Draft MO]   [Override: Create PO Instead]         │
└──────────────────────────────────────────────────────────┘
```

**Every number is rendered from API response fields — the component performs zero arithmetic of its own.** `purchaseCost`, `purchaseLeadTimeDays`, `manufactureCost`, `manufactureLeadTimeDays`, `purchaseScore`, `manufactureScore` are all server-returned fields, never client-computed.

**"Override: Create PO Instead"** navigates to a pre-filled `PurchaseOrderCreatePage` — never silently creates a record.

**`TraceabilityStepper`** — horizontal (vertical on mobile) stepper showing:
```
Customer Order (Ramesh, 10 Tables)
  └── Sales Order [SO-000031]
        └── Manufacturing Order [MO-007] (auto-triggered)
              ├── Work Order: Assembly [WO-021]
              ├── Work Order: Painting [WO-022]
              └── Inventory Movement: +10 Tables, -40 Legs
                    └── Delivery [DEL-005]
```
Each step is a `Card` with status chip and link to that record's detail page.

**Forms:** None. **Tables:** None. **Charts:** None. **Modals:** None.

---

## 24. Audit Log UI

**Folder:** `src/features/audit-logs/`

**Files:**
```
features/audit-logs/
├── components/
│   ├── AuditLogTable.tsx
│   ├── AuditLogFilters.tsx
│   ├── AuditSummaryTiles.tsx
│   └── AuditLogTimeline.tsx
└── pages/
    └── AuditLogPage.tsx
```

**`AuditLogTable`** — dense Admin browser. **`AuditLogTimeline`** — chronological stack for single-record context (Drawer, embedded tab). Both render the same field set: Date & Time, User, Module, Record Type, Record Reference (human-readable, not raw UUID), Action, Field Changed, Old Value, New Value.

Password fields render the literal string `"Password changed."` exactly as the backend sends it — no special-case formatting or client-side masking.

**Services:**
```ts
export function useAuditLogs(params: { dateFrom?: string; dateTo?: string; userId?: string; module?: string; action?: string; recordType?: string; recordId?: string }) {
  return useQuery({
    queryKey: queryKeys.auditLogs.list(params),
    queryFn: () => apiClient.get('/audit-logs', { params }),
    staleTime: 30_000,
  });
}
```

The same hook backs both the full Admin browser and every record-scoped Drawer/tab (called with `recordType`/`recordId` fixed).

**This is a strictly read-only module — there is no `useDeleteAuditLog` or `useUpdateAuditLog` hook, not even as dead code.** Append-only, on principle.

**Forms:** `AuditLogFilters` filter form only (Date Range, User, Module, Action). **Tables:** `AuditLogTable`. **Charts:** None. **Modals:** None.

---

## 25. Analytics UI

**Folder:** `src/features/analytics/`

**Files:**
```
features/analytics/
├── components/
│   ├── VendorSpendChart.tsx
│   ├── ManufacturingEfficiencyChart.tsx
│   ├── ReorderPointChart.tsx
│   ├── DelayTrendChart.tsx
│   ├── StockMovementVolumeChart.tsx
│   └── AnalyticsFiltersBar.tsx
└── pages/
    └── AnalyticsPage.tsx
```

Each chart component independently data-fetches (unlike Dashboard widgets — Analytics is a deliberately-visited page, the <500ms first-paint discipline doesn't apply here the same way).

**`useAnalyticsDateRange()`** — shared date-range `useState` synced to `ui.store` so changing the range in `AnalyticsFiltersBar` re-queries every chart in one action.

**Charts (all Recharts):**
- `VendorSpendChart` — horizontal `BarChart`, one bar per vendor
- `ManufacturingEfficiencyChart` — `LineChart`, on-time completion %, reference line at target
- `ReorderPointChart` — `LineChart` with three series: On Hand (solid), Reorder Point (dashed), Safety Stock (dotted) — all three values from backend, never client-computed
- `DelayTrendChart` — stacked `BarChart`, one segment per module
- `StockMovementVolumeChart` — grouped `BarChart`, IN (green) vs OUT (red) per day

**"View more" for any chart** navigates to the relevant module's own filtered list — never duplicates a table here.

**Forms:** Filter bar only. **Tables:** None. **Modals:** None.

---

## 26. AI Assistant UI

> **Scope discipline:** The Assistant is a **contextual, read-only explainer and navigator**. It never calls a mutating endpoint on the user's behalf, never computes a procurement score or formula output, never fabricates record data, and never renders arbitrary HTML. It only navigates users to the relevant screens — it never opens the door for them.

**Folder:** `src/features/assistant/`

**Files:**
```
features/assistant/
├── components/
│   ├── AssistantTrigger.tsx
│   ├── AssistantPanel.tsx
│   ├── AssistantMessage.tsx
│   ├── AssistantSuggestionChip.tsx
│   └── AssistantContextBadge.tsx
└── assistant.store.ts
```

**`AssistantPanel`** — `Sheet` (right-side slide-over). Opens **context-aware**: if triggered from a Sales Order detail page, `AssistantContextBadge` shows "Talking about SO-000031" and suggestion chips are scoped to that record.

**`AssistantMessage`** — renders structured, pre-formatted content only: `{ text, links, explainTable }`. **No `dangerouslySetInnerHTML`, no markdown-to-HTML pipeline.** The response shape is a constrained set of renderable blocks.

**`AssistantSuggestionChip`** — pre-canned, context-derived prompts:
- *"Explain the Free-to-Use number"*
- *"Why did this trigger a Manufacturing Order?"*
- *"Show me everything that happened to this record"* (→ opens `AuditLogDrawer`)
- *"Take me to delayed Purchase Orders"* (→ navigates to pre-filtered list)

**Services:**
```ts
export function useAssistantAsk() {
  return useMutation({
    mutationFn: (input: { message: string; context?: AssistantContext }) =>
      apiClient.post<AssistantResponse>('/assistant/ask', input),
  });
}
```

`AssistantResponse` shape: `{ text: string; links?: { label: string; route: string }[]; explainTable?: { label: string; value: string }[] }`

**`assistant.store.ts` (Zustand):**
```ts
interface AssistantState {
  messages: { role: 'user' | 'assistant'; content: AssistantResponse | string }[];
  isOpen: boolean;
  activeContext: AssistantContext | null;
  addMessage: (m: Message) => void;
  setOpen: (open: boolean) => void;
  setContext: (ctx: AssistantContext | null) => void;
  reset: () => void;  // called on logout and on explicit "clear conversation"
}
```

Conversation history is **ephemeral, in-memory, cleared on page reload** — session state, not domain data.

**`useAssistantAsk` never triggers invalidation of any other query key** — the Assistant has no mutating side effects.

### 26.1 What the Assistant must never do

1. Never call a mutating endpoint (Confirm/Deliver/Receive/Done/Cancel/Adjustment) on the user's behalf
2. Never compute or display a procurement score, reorder point, or any formula output using its own arithmetic
3. Never fabricate a record reference, status, or quantity — if it doesn't have the data, it says so and offers to navigate to where the user can look it up
4. Never render arbitrary HTML/markdown — only the constrained block types defined above

---

# PART IV — EXECUTION

## 27. Odoo-Inspired Workflows & Enterprise UX Patterns Applied

| Pattern | Odoo precedent | Where implemented | Why it matters |
|---|---|---|---|
| **Status as a colored chip** | Every Odoo document shows status as a pill in the form header | `StatusChip`, `STATUS_COLOR_MAP` (§8.3) | A glance at a list tells you what needs action without reading a word |
| **State-button workflow bar** | Odoo's header buttons literally are the state machine | Every detail-page header renders only buttons legal for the current status | The UI never offers an action the backend would reject |
| **Smart buttons** | Odoo shows small clickable counters linking to related records | "Logs" button, `AutoCreatedBadge` link (§20–21) | One-click lateral navigation across the data model |
| **List-view status-button filtering** | Clicking a status pill filters the view | `StatusFilterBar` wired to every module's list page | PRD FR-9.2's explicit requirement |
| **Kanban as a first-class list view alternative** | Odoo's Kanban/List toggle shares filters with the list | `SalesOrderKanban` toggle (§19), `WorkOrderKanban` (§21) | Users switch mental models without losing their place |
| **Conditional-mandatory fields** | Odoo's "Make to Order" only reveals Vendor/Route fields when relevant | `ProcurementConfigSection` (§17) | Reduces form complexity to exactly what the current configuration requires |
| **Snapshot fields on confirmed documents** | An Odoo SO's customer address is a copy at confirmation, not a live link | `customerAddress`/`vendorAddress` snapshot fields, rendered with field-lock pattern | Historical documents stay historically accurate |
| **Audit trail accessible from any record** | Odoo's chatter on every record | `AuditLogDrawer` reachable from every detail page (§10.5) | Auditability is first-class, not a bolt-on |
| **Breadcrumb + reference-code-first navigation** | Odoo always shows "SO0023" style references | Breadcrumbs (§6.5), every table/detail header | Matches how the business actually talks about its own orders |
| **Dense, compact tables** | Odoo's list views are famously information-dense | `h-10` row height, 8px spacing rhythm (§8.5) | An operator scanning 50 rows needs density, not airiness |

---

## 28. Antigravity Agent Prompts (per module)

### 28.0 Bootstrap Prompt (run once, before Prompt 1)

```
You are building the frontend for the Mini ERP "Shiv Furniture Works," strictly
following the attached Frontend Engineering Master Execution Document, Part I
(§1–5). Scaffold the Vite + React + TypeScript project exactly as specified:
run the setup commands in §1.2, configure the @/* path alias, initialize
Tailwind with the design tokens in Part II §8.2 pasted verbatim into
src/index.css, and initialize shadcn/ui with style "new-york", base color
slate, CSS variables enabled. Create the full folder structure in §2 as empty
directories with .gitkeep placeholders where no file exists yet — do not
invent files not listed in §2 or §3. Create src/types/enums.ts exactly per
§3.3, but STOP and ask me for the backend's actual Prisma enum values before
filling in any enum that isn't already given verbatim in this document — never
guess a backend enum string. Do not write any feature code yet.
```

### 28.1 Prompt — Shared UI Library & Design System

```
Using Part II §8 and §9 of the Frontend Engineering Master Execution Document,
generate every shadcn component listed in §9's table via the CLI commands in
§1.3 (do not hand-write shadcn primitives). Then apply the theme tokens from
§8.2 to src/index.css and confirm tailwind.config.ts reads them as CSS
variables (not hardcoded hex). Do not add any component, color token, or
Tailwind plugin not named in this document.
```

### 28.2 Prompt — Shared Cross-Cutting Components

```
Build every component in Part II §10 (components/shared/*) exactly as
specified: DataTable family (§10.1), StatusChip/StatusFilterBar (§10.2),
KpiTile/KpiGrid (§10.3), FieldLockBanner/useFieldLock (§10.4), AuditLogDrawer
(§10.5), LineItemsTable/LineItemRow (§10.6), ConfirmActionDialog (§10.7),
StockCardTimeline (§10.8), Can/RequireRole (§10.9). These components are
consumed by every module that follows — they must be generic and
configuration-driven (props/column-defs), never hardcoded to one module's
field names. Do not call any API endpoint from inside these components; they
receive data via props only.
```

### 28.3 Prompt — App Shell, Routing, State Foundations

```
Build the routing tree (Part II §6), layout hierarchy (§7), and the four
Zustand stores (§11.2: auth, ui, notifications, theme) exactly as specified.
Implement ProtectedRoute and PermissionRoute per §6.3 — restate to yourself
before writing this code: PermissionRoute is a UX convenience, never a
security boundary; do not write any logic that treats it as one. Build the
query-key factory (§11.3) and api-client wrapper (it must unwrap the
{data, meta, error} envelope from TRD §4.2 and attach the JWT from auth.store
as a Bearer header on every request).
```

### 28.4 Prompt — Authentication UI

```
Build the Authentication module exactly per §14: LoginForm, SignupForm,
ForgotPasswordForm and their pages, auth.api.ts hooks, and auth.validation.ts.
The Login error state must render only the literal server string "Invalid Login
Id or Password" — never a field-specific error, never your own inferred message.
The post-signup screen must explicitly tell the user an Admin needs to assign
their role before they get module access — do not auto-redirect into the app
shell after signup.
```

### 28.5 Prompt — RBAC UI

```
Build the RBAC module per §15: UserTable, AssignRoleModal, RoleBadge,
usePermission hook, and the role-filtered Sidebar nav config in §15.4. Also
build the self-profile-edit form (Profile page) per §15's description —
Email must render read-only with a tooltip, Position must render read-only
unless the viewer is an Admin. Build these as two separate form components,
not one shared one, per the explicit reasoning in §15. Do not add any
client-side check whose comment or naming implies it is a security boundary.
```

### 28.6 Prompt — Dashboard

```
Build the Dashboard module per §16: every widget component listed, fed by
exactly two hooks (useDashboardCounters, useDashboardRoleSummary) with a
5-10 second refetchInterval. Widgets must be dumb rendering components that
receive their data slice as a prop — no widget may issue its own independent
fetch. DashboardPage must not contain any `if (role === ...)` branching to
decide what to fetch; it renders whichever widget set the role-summary
payload's shape implies, per §12.3.
```

### 28.7 Prompt — Product Management UI

```
Build the Products module per §17, with special attention to
ProcurementConfigSection's conditional-mandatory rendering (Procure on Demand
→ Procurement Type → Vendor|BoM) and the matching Zod superRefine in
products.validation.ts. On Hand, Reserved, and Free-to-Use must never appear
as form fields anywhere, not even disabled — render them only as read-only
values on the detail page's InventorySnapshotCard. Wire StockAdjustmentModal
behind a <Can module="INVENTORY" action="ADMIN"> guard. Remember to add
products.detail(id) to the invalidation list of any other module's mutation
that the Inventory Impact table says affects stock for that product.
```

### 28.8 Prompt — Inventory UI

```
Build the Inventory module per §18: StockLedgerTable, InventorySummaryTable,
ReorderPointPanel, ReconciliationCheckPanel. ReorderPointPanel must render
the formula's raw inputs (Average Daily Usage, Vendor Lead Time, Maximum
Daily Usage, Maximum Historical Delivery Delay) alongside the computed
Reorder Point and Safety Stock — never just the final number alone. Do not
perform the reorder-point arithmetic in the frontend; render only what the
backend returns.
```

### 28.9 Prompt — Sales Order UI

```
Build the Sales Orders module per §19 in full, including SalesOrderForm,
SalesOrderKanban, AvailabilityFlag, ConfirmSalesOrderDialog,
DeliverSalesOrderModal, CancelSalesOrderDialog, the SO field-lock map, and
sales-order.validation.ts. ConfirmSalesOrderDialog's preview text must be
phrased as a forecast ("will reserve," "will be created") per §19's exact
reasoning about concurrency — never phrase it as already-decided fact before
the mutation actually succeeds. DeliverSalesOrderModal must seed each line
input with the CURRENT CUMULATIVE delivered quantity, never zero and never a
delta — and must label the field so the user understands they are entering a
new total, not an additional amount. Wire useConfirmSalesOrder's onSuccess
invalidation list to match §3.1's worked example exactly: SO detail+list,
inventory.summary, purchaseOrders.all, manufacturingOrders.all, dashboard.all.
```

### 28.10 Prompt — Purchase Order UI

```
Build the Purchase Orders module per §20. This module structurally mirrors
Sales Orders (§19). The one deliberate divergence: do NOT build a custom
confirm-preview dialog with a reservation/procurement forecast for PO Confirm —
that action has zero inventory effect (FR-4.3). Use a plain ConfirmActionDialog
whose copy explicitly states stock only changes on Receive, not Confirm. Build
AutoCreatedBadge to show "Triggered by SO-XXXXXX" with a working link when
auto_created is true. Get the invalidation-list asymmetry right: Confirm's
mutation invalidates only PO + dashboard keys; Receive's mutation invalidates
PO + inventory + the affected products + dashboard keys. Do not copy Sales
Order's Confirm invalidation list onto Purchase Order's Confirm mutation.
```

### 28.11 Prompt — Manufacturing Order UI

```
Build the Manufacturing Orders module per §21 in full: ManufacturingOrderForm
with the BoM-filtered-by-Finished-Product Combobox and the client-side copy
preview, ComponentConsumptionTable with its own visibility/lock rules (hidden
in Draft, editable Confirmed/In Progress, locked Done/Cancelled — note this
needs useComponentLock, not the generic useFieldLock), WorkOrderKanban using
@dnd-kit per §12.4's tree, and DoneConfirmDialog. DoneConfirmDialog's preview
text must be generated from the loaded MO's actual components and quantities,
in the exact phrasing style of the PRD's literal acceptance criterion ("writes
OUT 40 Legs, 10 Tops, 120 Screws and IN 10 Wooden Tables — in one
transaction"). useCompleteManufacturingOrder's invalidation list must include
manufacturingOrders.*, inventory.all, products.all (not just inventory.all),
and dashboard.all. useCancelManufacturingOrder must NOT invalidate any
inventory/product key — cancellation has no stock effect.
```

### 28.12 Prompt — BoM UI

```
Build the BoM module per §22: BomForm with separate BomComponentsTable and
BomOperationsTable (do not merge them into one grid), a client-side
self-reference guard excluding the BoM's own Finished Product from the
component picker, CloneBomModal that pre-fills a fresh create form rather than
calling a dedicated clone endpoint, and DeleteBomGuardDialog that renders a 409
as a named, actionable conflict message (which product's default BoM this is)
rather than a generic error toast. BoM has no status/lifecycle — do not add a
StatusChip or status-based field lock map to this module; an active BoM stays
editable indefinitely per §22's explicit reasoning.
```

### 28.13 Prompt — Procurement UI

```
Build the Procurement module per §23: ProcurementInbox, RecommendationCard,
TraceabilityStepper. CRITICAL CONSTRAINT, restated from the PRD: this system
has zero AI-based decision-making anywhere. RecommendationCard must render
every number (cost, lead time, shortage penalty, both scores) directly from
API response fields and must perform NO arithmetic of its own — do not
recompute, round, or re-derive any score client-side. The "Override: Create PO
Instead" action must navigate to a pre-filled PurchaseOrderCreatePage, never
silently create a record or skip the normal Confirm flow.
```

### 28.14 Prompt — Audit Log UI

```
Build the Audit Log module per §24: AuditLogTable, AuditLogFilters,
AuditSummaryTiles, AuditLogTimeline. This is a strictly read-only module — do
not create any mutation hook in audit-logs.api.ts, including update or delete,
even as dead code or a "for completeness" stub. Render old_value/new_value
fields exactly as the backend returns them, including the literal string
"Password changed." for password fields — do not add special-case formatting
logic for that field.
```

### 28.15 Prompt — Analytics UI

```
Build the Analytics module per §25: VendorSpendChart, ManufacturingEfficiency
Chart, ReorderPointChart, DelayTrendChart, StockMovementVolumeChart, and
AnalyticsFiltersBar with a shared date range synced to ui.store. Each chart
fetches independently (unlike Dashboard widgets) per §25's stated reasoning.
ReorderPointChart must plot On Hand as a solid actual-data line against
Reorder Point and Safety Stock as separate reference lines sourced from the
backend's own computed values — never hardcode or client-compute either
reference line.
```

### 28.16 Prompt — AI Assistant UI

```
Build the Assistant module per §26. Before writing any code, read §26.1's
four explicit prohibitions and treat them as hard constraints, not suggestions:
(1) never call a mutating endpoint on the user's behalf, (2) never compute a
procurement score, reorder point, or any other formula output itself, (3) never
fabricate a record reference, status, or quantity, (4) never render arbitrary
HTML/markdown — only the constrained {text, links, explainTable} response shape.
AssistantMessage must not use dangerouslySetInnerHTML or any markdown-to-HTML
pipeline. Conversation state lives in assistant.store.ts (Zustand) and is
cleared on logout and on explicit reset — it is not persisted to any storage.
```

---

## 29. Development Sequence & File Creation Sequence

| Step | Builds | Depends on | Antigravity Prompt |
|---|---|---|---|
| 0 | Project scaffold, Tailwind, shadcn init, folder tree | Nothing | §28.0 |
| 1 | Shared UI library (`components/ui`) | Step 0 | §28.1 |
| 2 | Shared cross-cutting components (`components/shared`) | Step 1 | §28.2 |
| 3 | App shell, routing skeleton, Zustand stores, query-key factory, api-client | Step 2 | §28.3 |
| 4 | Authentication UI | Step 3 | §28.4 |
| 5 | RBAC UI | Step 4 | §28.5 |
| 6 | Dashboard shell (KPI tiles only; role widgets backfilled as modules land) | Step 5 | §28.6 (partial) |
| 7 | Products module | Step 6 | §28.7 |
| 8 | Inventory module | Step 7 | §28.8 |
| 9 | Sales Orders module | Step 8 | §28.9 |
| 10 | Purchase Orders module | Step 9 | §28.10 |
| 11 | BoM module (must precede Manufacturing) | Step 8 | §28.12 |
| 12 | Manufacturing Orders module (incl. Work Order Kanban) | Step 11 | §28.11 |
| 13 | Procurement module | Steps 9, 10, 12 | §28.13 |
| 14 | Audit Log module | Step 3 | §28.14 |
| 15 | Dashboard role-widget backfill (all source modules now exist) | Steps 7–14 | §28.6 (completion) |
| 16 | Analytics module | Step 15 | §28.15 |
| 17 | AI Assistant module (last — links into every other module) | Step 16 | §28.16 |
| 18 | Full responsive pass (§13) across all screens | Step 17 | — |
| 19 | End-to-end demo dry run (§31) | Step 18 | — |

**Critical sequencing rules:**
1. Shared primitives (Steps 1–3) are never revisited mid-build to add a one-off variant. Fixes go into the generic shared component, not a local override.
2. **BoM must exist before Manufacturing's create form** — the MO BoM Combobox needs `useBomsByFinishedProduct`.
3. **Procurement is sequenced last** among order-lifecycle modules — its Traceability and Recommendation are read-models over Sales+Purchase+Manufacturing data.

### 29.1 File Creation Order Within Each Module Step

1. `*.types.ts` (if any module-specific types)
2. `*.validation.ts`
3. `api/<module>.api.ts`
4. `features/<module>/components/*` (forms and tables first, modals second)
5. `features/<module>/pages/*`
6. Route wiring in `routes/router.tsx`
7. Sidebar nav entry in `routeMap.ts`/`NAV_CONFIG`

---

## 30. Commands Reference

```bash
# One-time setup
npm create vite@latest web -- --template react-ts
cd web
npm install react-router-dom @tanstack/react-query @tanstack/react-table zustand
npm install react-hook-form @hookform/resolvers zod
npm install date-fns recharts lucide-react @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install clsx tailwind-merge class-variance-authority
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npx shadcn@latest init

# Component generation (run as each module first needs a new primitive)
npx shadcn@latest add button input label textarea select checkbox switch
npx shadcn@latest add table badge card separator tabs dialog alert-dialog
npx shadcn@latest add dropdown-menu popover tooltip toast sonner
npx shadcn@latest add form sheet skeleton avatar progress
npx shadcn@latest add command combobox calendar date-picker
npx shadcn@latest add scroll-area collapsible accordion

# Day-to-day
npm run dev
npm run build
npm run preview
npm run lint
npx tsc --noEmit

# Environment
cp .env.example .env
# VITE_API_BASE_URL=http://localhost:4000/api/v1
```

---

## 31. Integration Checkpoints

### 31.1 After Step 3 (App Shell / Auth Foundations)

- [ ] `apiClient` correctly unwraps `{ data, meta, error }` for both success and error responses
- [ ] A `401` response triggers `auth.store.logout()` and redirect to `/auth/login`, globally (via response interceptor), not per-call
- [ ] JWT is held only in `auth.store` memory — confirm via DevTools that nothing related to the token appears in `localStorage`/`sessionStorage`

### 31.2 After Step 4–5 (Auth + RBAC)

- [ ] Login with valid credentials populates `auth.store.user.permissions` with the exact `(module, action)` shape `usePermission`/`Can`/`PermissionRoute` expect
- [ ] A freshly signed-up account sees a Dashboard with zero sidebar nav items beyond "Profile" — confirming the unassigned-role-has-no-access path
- [ ] Admin's `AssignRoleModal` save is reflected in that user's nav on their next login (claims are JWT-embedded, re-resolved on next token issuance)

### 31.3 After Step 7 (Products)

- [ ] `ProcurementConfigSection` client validation and backend constraints agree on all four combinations: `{off}`, `{on, Purchase, vendor set}`, `{on, Manufacturing, BoM set}`, `{on, Purchase, no vendor}`, `{on, Manufacturing, no BoM}`
- [ ] On Hand/Reserved/Free-to-Use render from `product_inventory_summary` fields, never from a client-side subtraction — verify the network response actually contains `freeToUseQty`

### 31.4 After Step 9 (Sales Orders) — highest-risk checkpoint

- [ ] Confirming an SO line where Ordered Qty > Free-to-Use and `procure_on_demand=true, Manufacturing` produces: updated SO status, Availability flag, **and** a new Draft MO in the Manufacturing list, linked via `trigger_source_so_id` — visible in Procurement Inbox without a manual refresh
- [ ] Two browser sessions confirming the same SO/product concurrently: second session shows a clear error or a correctly re-read Free-to-Use number — never a silently-wrong optimistic success (this module has **no optimistic updates**)
- [ ] Partial Deliver twice (0→6 then 6→10): modal shows current cumulative as starting point both times; Stock Card shows two separate rows — OUT 6 then OUT 4, never OUT 10

### 31.5 After Step 10 (Purchase Orders)

- [ ] Confirming a PO produces **zero** change to any product's On Hand/Free-to-Use — verify by checking Product Detail numbers before and after PO Confirm
- [ ] Auto-created PO renders `AutoCreatedBadge` with working link back to `trigger_source_so_id`; that SO's Procurement tab shows the reverse link

### 31.6 After Step 12 (Manufacturing)

- [ ] `DoneConfirmDialog` preview matches actual MO components exactly — test against the PRD's literal example (10 Tables, BoM 4 Legs/1 Top/12 Screws → "writes OUT 40 Legs / 10 Tops / 120 Screws and IN 10 Tables")
- [ ] After Done: MO status = Done, every component's On Hand decreased by consumed qty, finished product's On Hand increased by `mo.quantity`, Stock Card for each product shows the correct new row — verify in one pass across all affected screens
- [ ] Cancel from Confirmed: zero Stock Card rows added anywhere, only a reservation-release effect on Free-to-Use

### 31.7 After Step 13 (Procurement)

- [ ] Every number on `RecommendationCard` matches the raw API response field-for-field — paste response JSON next to the rendered card; arithmetic differences (not just formatting) are bugs
- [ ] `TraceabilityStepper` for the full worked example (SO → MO → components → PO → Vendor → stock movements → Delivery) renders the complete chain with every node's link navigating correctly

### 31.8 After Step 17 (Assistant)

- [ ] No file under `features/assistant/` imports any mutation hook from another module's `api/*.ts`
- [ ] `AssistantMessage` has no `dangerouslySetInnerHTML` and no markdown-rendering library import

### 31.9 Final Checkpoint — Step 19, Demo Dry Run

Walk the WEBAPPFLOW "closing beat" end-to-end through the UI only (no DB inspection):

Sales Order → Confirm (watch auto-MO/PO get created) → open the auto-created record → Confirm/Done it → return to original SO → open Traceability → confirm full chain renders → open Stock Card for finished product → confirm ledger rows match what was narrated at each step.

**If this walk-through requires a manual page refresh anywhere to see a consequence of a prior action, that is an invalidation-list bug to fix before considering the frontend complete — not an acceptable demo caveat.**

---

*End of Frontend Engineering Master Execution Document.*  
*Companion documents: `PRD.md` (requirements) · `WebAppFlow.md` (end-to-end flows) · `TRD.md` (backend architecture & schema this frontend is contractually bound to).*
