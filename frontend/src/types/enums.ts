// ─── Status Enums ───────────────────────────────────────────────

export const SO_STATUS = {
  DRAFT: 'DRAFT',
  CONFIRMED: 'CONFIRMED',
  PARTIALLY_DELIVERED: 'PARTIALLY_DELIVERED',
  FULLY_DELIVERED: 'FULLY_DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;
export type SoStatus = (typeof SO_STATUS)[keyof typeof SO_STATUS];

export const PO_STATUS = {
  DRAFT: 'DRAFT',
  CONFIRMED: 'CONFIRMED',
  PARTIALLY_RECEIVED: 'PARTIALLY_RECEIVED',
  FULLY_RECEIVED: 'FULLY_RECEIVED',
  CANCELLED: 'CANCELLED',
} as const;
export type PoStatus = (typeof PO_STATUS)[keyof typeof PO_STATUS];

export const MO_STATUS = {
  DRAFT: 'DRAFT',
  CONFIRMED: 'CONFIRMED',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
  CANCELLED: 'CANCELLED',
} as const;
export type MoStatus = (typeof MO_STATUS)[keyof typeof MO_STATUS];

export const WORK_ORDER_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  QUALITY_CHECK: 'QUALITY_CHECK',
  COMPLETED: 'COMPLETED',
} as const;
export type WorkOrderStatus = (typeof WORK_ORDER_STATUS)[keyof typeof WORK_ORDER_STATUS];

export const PROCUREMENT_TYPE = {
  PURCHASE: 'PURCHASE',
  MANUFACTURING: 'MANUFACTURING',
} as const;
export type ProcurementType = (typeof PROCUREMENT_TYPE)[keyof typeof PROCUREMENT_TYPE];

// ─── RBAC Enums ─────────────────────────────────────────────────

export const ROLE = {
  ADMIN: 'ADMIN',
  BUSINESS_OWNER: 'BUSINESS_OWNER',
  SALES_USER: 'SALES_USER',
  PURCHASE_USER: 'PURCHASE_USER',
  MANUFACTURING_USER: 'MANUFACTURING_USER',
  INVENTORY_MANAGER: 'INVENTORY_MANAGER',
} as const;
export type Role = (typeof ROLE)[keyof typeof ROLE];

export const PERMISSION_ACTION = {
  ADMIN: 'ADMIN',
  VIEW: 'VIEW',
  NONE: 'NONE',
} as const;
export type PermissionAction = (typeof PERMISSION_ACTION)[keyof typeof PERMISSION_ACTION];

export const MODULE = {
  PRODUCTS: 'PRODUCTS',
  SALES_ORDERS: 'SALES_ORDERS',
  PURCHASE_ORDERS: 'PURCHASE_ORDERS',
  MANUFACTURING_ORDERS: 'MANUFACTURING_ORDERS',
  BOM: 'BOM',
  VENDORS: 'VENDORS',
  CUSTOMERS: 'CUSTOMERS',
  INVENTORY: 'INVENTORY',
  AUDIT_LOGS: 'AUDIT_LOGS',
  USER_MANAGEMENT: 'USER_MANAGEMENT',
  DASHBOARDS: 'DASHBOARDS',
  PROCUREMENT: 'PROCUREMENT',
  ANALYTICS: 'ANALYTICS',
} as const;
export type ModuleName = (typeof MODULE)[keyof typeof MODULE];
