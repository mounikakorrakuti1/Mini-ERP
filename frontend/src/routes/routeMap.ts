export const ROUTES = {
  // Landing
  LANDING: '/',

  // Auth
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  FORGOT_PASSWORD: '/auth/forgot-password',

  // Main app (all under /app)
  DASHBOARD: '/app',

  // Products
  PRODUCTS: '/app/products',
  PRODUCT_DETAIL: '/app/products/:id',
  PRODUCT_CREATE: '/app/products/new',
  PRODUCT_EDIT: '/app/products/:id/edit',

  // Inventory
  INVENTORY_LEDGER: '/app/inventory/ledger',
  INVENTORY_SUMMARY: '/app/inventory/summary',

  // Sales Orders
  SALES_ORDERS: '/app/sales-orders',
  SALES_ORDER_DETAIL: '/app/sales-orders/:id',
  SALES_ORDER_CREATE: '/app/sales-orders/new',

  // Purchase Orders
  PURCHASE_ORDERS: '/app/purchase-orders',
  PURCHASE_ORDER_DETAIL: '/app/purchase-orders/:id',
  PURCHASE_ORDER_CREATE: '/app/purchase-orders/new',

  // Manufacturing Orders
  MANUFACTURING_ORDERS: '/app/manufacturing-orders',
  MANUFACTURING_ORDER_DETAIL: '/app/manufacturing-orders/:id',
  MANUFACTURING_ORDER_CREATE: '/app/manufacturing-orders/new',
  MANUFACTURING_KANBAN: '/app/manufacturing-orders/kanban',

  // Bill of Materials
  BOM_LIST: '/app/bom',
  BOM_DETAIL: '/app/bom/:id',
  BOM_CREATE: '/app/bom/new',
  BOM_EDIT: '/app/bom/:id/edit',

  // Partners
  VENDORS: '/app/vendors',
  CUSTOMERS: '/app/customers',

  // Procurement
  PROCUREMENT_INBOX: '/app/procurement',
  TRACEABILITY: '/app/procurement/traceability/:soId',

  // System
  AUDIT_LOGS: '/app/audit-logs',
  ANALYTICS: '/app/analytics',
  USER_MANAGEMENT: '/app/admin/users',
  USER_DETAIL: '/app/admin/users/:id',
  PROFILE: '/app/profile',
} as const;
