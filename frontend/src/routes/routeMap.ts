export const ROUTES = {
  // Auth
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  FORGOT_PASSWORD: '/auth/forgot-password',

  // Main
  DASHBOARD: '/',

  // Products
  PRODUCTS: '/products',
  PRODUCT_DETAIL: '/products/:id',
  PRODUCT_CREATE: '/products/new',
  PRODUCT_EDIT: '/products/:id/edit',

  // Inventory
  INVENTORY_LEDGER: '/inventory/ledger',
  INVENTORY_SUMMARY: '/inventory/summary',

  // Sales Orders
  SALES_ORDERS: '/sales-orders',
  SALES_ORDER_DETAIL: '/sales-orders/:id',
  SALES_ORDER_CREATE: '/sales-orders/new',

  // Purchase Orders
  PURCHASE_ORDERS: '/purchase-orders',
  PURCHASE_ORDER_DETAIL: '/purchase-orders/:id',
  PURCHASE_ORDER_CREATE: '/purchase-orders/new',

  // Manufacturing Orders
  MANUFACTURING_ORDERS: '/manufacturing-orders',
  MANUFACTURING_ORDER_DETAIL: '/manufacturing-orders/:id',
  MANUFACTURING_ORDER_CREATE: '/manufacturing-orders/new',
  MANUFACTURING_KANBAN: '/manufacturing-orders/kanban',

  // Bill of Materials
  BOM_LIST: '/bom',
  BOM_DETAIL: '/bom/:id',
  BOM_CREATE: '/bom/new',

  // Partners
  VENDORS: '/vendors',
  CUSTOMERS: '/customers',

  // Procurement
  PROCUREMENT_INBOX: '/procurement',
  TRACEABILITY: '/procurement/traceability/:soId',

  // System
  AUDIT_LOGS: '/audit-logs',
  ANALYTICS: '/analytics',
  USER_MANAGEMENT: '/admin/users',
  PROFILE: '/profile',
} as const;
