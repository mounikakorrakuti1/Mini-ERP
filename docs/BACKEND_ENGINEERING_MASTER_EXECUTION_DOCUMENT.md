# BACKEND ENGINEERING MASTER EXECUTION DOCUMENT

## Mini ERP: From Demand to Delivery — "Shiv Furniture Works"

**Version:** 1.0 · **Status:** Production-Ready Execution Guide
**Stack:** Node.js 20 · Express 4 · PostgreSQL 16 · Prisma ORM · JWT + RBAC

---

## TABLE OF CONTENTS

1. [Backend Project Structure](#backend-project-structure)
2. [Database Schema Design](#database-schema-design)
3. [Authentication & Authorization Architecture](#authentication--authorization-architecture)
4. [Core Service Layer Architecture](#core-service-layer-architecture)
5. [Module Architectures](#module-architectures)
6. [Supporting Systems](#supporting-systems)
7. [Development Execution Order](#development-execution-order)
8. [API Endpoint Reference](#api-endpoint-reference)
9. [Database Transactions & Concurrency](#database-transactions--concurrency)
10. [Testing Checkpoints](#testing-checkpoints)
11. [Deployment & Docker Configuration](#deployment--docker-configuration)

---

## 1. BACKEND PROJECT STRUCTURE

### 1.1 Complete Folder Structure

```
apps/api/
├── src/
│   ├── config/
│   │   ├── database.ts                 # Prisma client initialization
│   │   ├── jwt.ts                      # JWT signing/verification config
│   │   ├── env.ts                      # Environment variable validation (Zod)
│   │   └── constants.ts                # Business logic constants
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts          # JWT verification + user context
│   │   ├── rbac.middleware.ts          # Permission enforcement (fail-closed)
│   │   ├── validation.middleware.ts    # Zod schema validation wrapper
│   │   ├── error-handler.middleware.ts # Global error handling
│   │   └── request-logger.middleware.ts# Request/response logging
│   │
│   ├── types/
│   │   ├── index.ts                    # Shared type definitions
│   │   ├── enums.ts                    # Status, role, permission enums
│   │   ├── dtos.ts                     # Request/response DTOs (Zod schemas)
│   │   └── domain.ts                   # Domain model types
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.repository.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── __tests__/
│   │   │       ├── auth.controller.test.ts
│   │   │       ├── auth.service.test.ts
│   │   │       └── auth.integration.test.ts
│   │   │
│   │   ├── users/
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.repository.ts
│   │   │   ├── users.routes.ts
│   │   │   └── __tests__/
│   │   │
│   │   ├── products/
│   │   │   ├── products.controller.ts
│   │   │   ├── products.service.ts
│   │   │   ├── products.repository.ts
│   │   │   ├── products.routes.ts
│   │   │   └── __tests__/
│   │   │
│   │   ├── sales-orders/
│   │   │   ├── sales-orders.controller.ts
│   │   │   ├── sales-orders.service.ts
│   │   │   ├── sales-orders.repository.ts
│   │   │   ├── sales-orders.routes.ts
│   │   │   └── __tests__/
│   │   │
│   │   ├── purchase-orders/
│   │   │   ├── purchase-orders.controller.ts
│   │   │   ├── purchase-orders.service.ts
│   │   │   ├── purchase-orders.repository.ts
│   │   │   ├── purchase-orders.routes.ts
│   │   │   └── __tests__/
│   │   │
│   │   ├── manufacturing-orders/
│   │   │   ├── manufacturing-orders.controller.ts
│   │   │   ├── manufacturing-orders.service.ts
│   │   │   ├── manufacturing-orders.repository.ts
│   │   │   ├── manufacturing-orders.routes.ts
│   │   │   ├── work-orders.service.ts
│   │   │   └── __tests__/
│   │   │
│   │   ├── bom/
│   │   │   ├── bom.controller.ts
│   │   │   ├── bom.service.ts
│   │   │   ├── bom.repository.ts
│   │   │   ├── bom.routes.ts
│   │   │   └── __tests__/
│   │   │
│   │   ├── inventory/
│   │   │   ├── inventory.controller.ts
│   │   │   ├── inventory.service.ts
│   │   │   ├── inventory.repository.ts
│   │   │   ├── inventory.routes.ts
│   │   │   └── __tests__/
│   │   │
│   │   ├── vendors/
│   │   │   ├── vendors.controller.ts
│   │   │   ├── vendors.service.ts
│   │   │   ├── vendors.repository.ts
│   │   │   ├── vendors.routes.ts
│   │   │   └── __tests__/
│   │   │
│   │   ├── customers/
│   │   │   ├── customers.controller.ts
│   │   │   ├── customers.service.ts
│   │   │   ├── customers.repository.ts
│   │   │   ├── customers.routes.ts
│   │   │   └── __tests__/
│   │   │
│   │   ├── audit-logs/
│   │   │   ├── audit-logs.controller.ts
│   │   │   ├── audit-logs.service.ts
│   │   │   ├── audit-logs.repository.ts
│   │   │   ├── audit-logs.routes.ts
│   │   │   └── __tests__/
│   │   │
│   │   ├── dashboard/
│   │   │   ├── dashboard.controller.ts
│   │   │   ├── dashboard.service.ts
│   │   │   ├── dashboard.repository.ts
│   │   │   ├── dashboard.routes.ts
│   │   │   └── __tests__/
│   │   │
│   │   └── notifications/
│   │       ├── notifications.controller.ts
│   │       ├── notifications.service.ts
│   │       ├── notifications.repository.ts
│   │       ├── notifications.routes.ts
│   │       └── __tests__/
│   │
│   ├── services/
│   │   ├── inventory-ledger.service.ts     # Stock movement logic
│   │   ├── procurement-engine.service.ts   # Auto-PO/MO generation
│   │   ├── reservation-engine.service.ts   # Reserve/unreserve logic
│   │   ├── audit-log.service.ts            # Dual-write audit trail
│   │   ├── notification.service.ts         # Notification publishing
│   │   ├── field-lock.service.ts           # Status-based field locking
│   │   └── analytics.service.ts            # Cross-module analytics
│   │
│   ├── repositories/
│   │   ├── base.repository.ts              # Generic repository pattern
│   │   └── (module-specific repos in modules/)
│   │
│   ├── utils/
│   │   ├── logger.ts                       # Winston or Pino logger
│   │   ├── errors.ts                       # Custom error classes
│   │   ├── validators.ts                   # Reusable validation functions
│   │   ├── decorators.ts                   # Logging/caching decorators
│   │   └── date-helpers.ts                 # Date/time utilities
│   │
│   ├── prisma/
│   │   ├── schema.prisma                   # (see section 2 for full schema)
│   │   ├── migrations/
│   │   │   ├── 001_init.sql
│   │   │   ├── 002_audit_logs.sql
│   │   │   ├── 003_inventory_ledger.sql
│   │   │   └── ...
│   │   └── seed.ts                         # Demo data seeding
│   │
│   ├── app.ts                              # Express app initialization
│   ├── server.ts                           # Server startup
│   └── index.ts                            # Module exports
│
├── .env.example
├── .env.test
├── jest.config.js
├── tsconfig.json
├── package.json
└── Dockerfile
```

### 1.2 File Creation Sequence

#### Phase 0: Infrastructure (Hour 0-1)

1. `package.json` + `tsconfig.json`
2. `src/config/env.ts` (Zod validation)
3. `src/config/database.ts` (Prisma init)
4. `src/utils/logger.ts` (Logger setup)
5. `src/types/enums.ts` (All enums)
6. `src/types/dtos.ts` (Validation schemas)
7. `prisma/schema.prisma` (Full DDL)
8. `prisma/migrations/001_init.sql`
9. `prisma/seed.ts` (Demo data)
10. `Dockerfile` + `docker-compose.yml`

#### Phase 1: Authentication (Hour 1-2)

1. `src/middleware/auth.middleware.ts`
2. `src/middleware/rbac.middleware.ts`
3. `src/modules/auth/auth.controller.ts`
4. `src/modules/auth/auth.service.ts`
5. `src/modules/auth/auth.repository.ts`
6. `src/modules/auth/auth.routes.ts`
7. `src/modules/users/users.controller.ts`
8. `src/modules/users/users.service.ts`
9. `src/modules/users/users.repository.ts`
10. `src/modules/users/users.routes.ts`

#### Phase 2: Core Services (Hour 2-3)

1. `src/services/audit-log.service.ts`
2. `src/services/field-lock.service.ts`
3. `src/services/inventory-ledger.service.ts`
4. `src/modules/products/products.controller.ts`
5. `src/modules/products/products.service.ts`
6. `src/modules/products/products.repository.ts`
7. `src/modules/products/products.routes.ts`
8. `src/app.ts` (Bootstrap)

#### Phase 3: Inventory & Ledger (Hour 3-4)

1. `src/services/reservation-engine.service.ts`
2. `src/modules/inventory/inventory.controller.ts`
3. `src/modules/inventory/inventory.service.ts`
4. `src/modules/inventory/inventory.repository.ts`
5. `src/modules/inventory/inventory.routes.ts`

#### Phase 4: Sales Orders (Hour 4-5)

1. `src/modules/sales-orders/sales-orders.controller.ts`
2. `src/modules/sales-orders/sales-orders.service.ts`
3. `src/modules/sales-orders/sales-orders.repository.ts`
4. `src/modules/sales-orders/sales-orders.routes.ts`

#### Phase 5: Purchase Orders (Hour 5-6)

1. `src/modules/purchase-orders/purchase-orders.controller.ts`
2. `src/modules/purchase-orders/purchase-orders.service.ts`
3. `src/modules/purchase-orders/purchase-orders.repository.ts`
4. `src/modules/purchase-orders/purchase-orders.routes.ts`
5. `src/modules/vendors/vendors.controller.ts`
6. `src/modules/vendors/vendors.service.ts`
7. `src/modules/vendors/vendors.routes.ts`

#### Phase 6: Manufacturing (Hour 6-8)

1. `src/modules/bom/bom.controller.ts`
2. `src/modules/bom/bom.service.ts`
3. `src/modules/bom/bom.repository.ts`
4. `src/modules/bom/bom.routes.ts`
5. `src/modules/manufacturing-orders/manufacturing-orders.controller.ts`
6. `src/modules/manufacturing-orders/manufacturing-orders.service.ts`
7. `src/modules/manufacturing-orders/manufacturing-orders.repository.ts`
8. `src/modules/manufacturing-orders/work-orders.service.ts`
9. `src/modules/manufacturing-orders/manufacturing-orders.routes.ts`

#### Phase 7: Procurement Engine (Hour 8-9)

1. `src/services/procurement-engine.service.ts`
2. Wire into `sales-orders.service.ts` (confirm flow)
3. Wire into `purchase-orders.service.ts` (triggered check)
4. Wire into `manufacturing-orders.service.ts` (triggered check)

#### Phase 8: Dashboard & Notifications (Hour 9-10)

1. `src/modules/dashboard/dashboard.controller.ts`
2. `src/modules/dashboard/dashboard.service.ts`
3. `src/modules/dashboard/dashboard.repository.ts`
4. `src/modules/dashboard/dashboard.routes.ts`
5. `src/modules/notifications/notifications.controller.ts`
6. `src/modules/notifications/notifications.service.ts`
7. `src/modules/notifications/notifications.repository.ts`
8. `src/modules/notifications/notifications.routes.ts`
9. `src/services/notification.service.ts`

#### Phase 9: Audit & Testing (Hour 10-11)

1. `src/modules/audit-logs/audit-logs.controller.ts`
2. `src/modules/audit-logs/audit-logs.service.ts`
3. `src/modules/audit-logs/audit-logs.routes.ts`
4. Verification: Audit coverage on all mutating methods
5. Integration test suite

#### Phase 10: Polish & Bug Fixes (Hour 11-12)

1. End-to-end smoke tests
2. Docker Compose final validation
3. Demo data seeding verification
4. Performance benchmarks (<500ms dashboard load)
5. Concurrency testing (dual SO confirmations)

---

## 2. DATABASE SCHEMA DESIGN

### 2.1 Core Principles

1. **Inventory Ledger as Source of Truth**
   - `stock_movements` is append-only
   - `products.on_hand_qty` = SUM(stock_movements.signed_qty) for that product
   - Every mutation writes one ledger row + one cached on_hand update in the same transaction

2. **Dual-Write Pattern**
   - Every mutating action writes to both the operational table (sales_orders, purchase_orders, etc.) and the audit_logs table
   - Transactional atomicity: both succeed or both fail
   - Enables field-level traceability

3. **Status-Driven Field Locking**
   - Certain fields are immutable once an entity leaves Draft
   - Enforced in service layer before any repository write
   - Validated server-side on every mutating API call

4. **Concurrency Safety**
   - `SELECT ... FOR UPDATE` row locks on every stock-affecting transaction
   - Prevents double-booking of scarce inventory
   - Pessimistic locking (not optimistic) chosen for correctness over throughput

### 2.2 Prisma Schema (schema.prisma)

```prisma
// schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ============================================================================
// ENUMS
// ============================================================================

enum UserRole {
  ADMIN
  BUSINESS_OWNER
  SALES_USER
  PURCHASE_USER
  MANUFACTURING_USER
  INVENTORY_MANAGER
  UNASSIGNED
}

enum PermissionType {
  CREATE_PRODUCT
  EDIT_PRODUCT
  DELETE_PRODUCT
  VIEW_PRODUCT

  CREATE_SALES_ORDER
  EDIT_SALES_ORDER
  CONFIRM_SALES_ORDER
  DELIVER_SALES_ORDER
  CANCEL_SALES_ORDER
  VIEW_SALES_ORDER

  CREATE_PURCHASE_ORDER
  EDIT_PURCHASE_ORDER
  CONFIRM_PURCHASE_ORDER
  RECEIVE_PURCHASE_ORDER
  CANCEL_PURCHASE_ORDER
  VIEW_PURCHASE_ORDER

  CREATE_MANUFACTURING_ORDER
  EDIT_MANUFACTURING_ORDER
  CONFIRM_MANUFACTURING_ORDER
  START_MANUFACTURING_ORDER
  COMPLETE_MANUFACTURING_ORDER
  CANCEL_MANUFACTURING_ORDER
  VIEW_MANUFACTURING_ORDER

  CREATE_BOM
  EDIT_BOM
  DELETE_BOM
  VIEW_BOM

  MANAGE_INVENTORY
  ADJUST_INVENTORY
  VIEW_INVENTORY

  MANAGE_VENDORS
  VIEW_VENDORS

  MANAGE_CUSTOMERS
  VIEW_CUSTOMERS

  MANAGE_USERS
  ASSIGN_ROLES
  VIEW_AUDIT_LOGS
  VIEW_DASHBOARD
}

enum SalesOrderStatus {
  DRAFT
  CONFIRMED
  PARTIALLY_DELIVERED
  FULLY_DELIVERED
  CANCELLED
}

enum PurchaseOrderStatus {
  DRAFT
  CONFIRMED
  PARTIALLY_RECEIVED
  FULLY_RECEIVED
  CANCELLED
}

enum ManufacturingOrderStatus {
  DRAFT
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum WorkOrderStatus {
  PENDING
  IN_PROGRESS
  QUALITY_CHECK
  COMPLETED
}

enum StockMovementSource {
  PURCHASE_RECEIPT
  SALES_DELIVERY
  MO_CONSUMPTION
  MO_PRODUCTION
  MANUAL_ADJUSTMENT
  RESERVATION
  UNRESERVATION
}

enum AuditActionType {
  CREATE
  UPDATE
  DELETE
  LOGIN
  LOGOUT
  CONFIRM
  DELIVER
  RECEIVE
}

enum NotificationStatus {
  UNREAD
  READ
  DISMISSED
}

enum ProcurementType {
  PURCHASE
  MANUFACTURING
}

// ============================================================================
// IDENTITY & AUTHORIZATION
// ============================================================================

model User {
  id                String    @id @default(cuid())
  login_id          String    @unique @db.VarChar(12)
  email             String    @unique
  password_hash     String
  full_name         String
  address           String?
  mobile_number     String?
  role_id           String
  position          String?
  is_active         Boolean   @default(true)
  created_at        DateTime  @default(now())
  updated_at        DateTime  @updatedAt
  last_login_at     DateTime?

  // Relations
  role              UserRole
  sales_orders      SalesOrder[]
  purchase_orders   PurchaseOrder[]
  manufacturing_orders ManufacturingOrder[]
  audit_logs        AuditLog[] @relation("actor")

  @@index([role_id])
  @@index([is_active])
}

model RolePermission {
  id              String    @id @default(cuid())
  role_id         String
  permission_type PermissionType
  created_at      DateTime  @default(now())

  // Composite index: queries filter by role_id
  @@unique([role_id, permission_type])
  @@index([role_id])
}

// ============================================================================
// MASTER DATA
// ============================================================================

model Product {
  id                    String      @id @default(cuid())
  reference             String      @unique @db.VarChar(20)  // PROD-0001
  name                  String
  sales_price           Decimal     @db.Numeric(18, 2)
  cost_price            Decimal     @db.Numeric(18, 2)
  on_hand_qty           Int         @default(0)
  reorder_point         Int         @default(0)
  procure_on_demand     Boolean     @default(false)
  procurement_type      ProcurementType?
  default_vendor_id     String?
  default_bom_id        String?
  is_active             Boolean     @default(true)
  created_at            DateTime    @default(now())
  updated_at            DateTime    @updatedAt

  // Relations
  stock_movements       StockMovement[]
  reservations          Reservation[]
  sales_order_items     SalesOrderItem[]
  purchase_order_items  PurchaseOrderItem[]
  mo_items              ManufacturingOrderItem[]
  bom_lines             BOMLine[] @relation("component")
  bom_finished_goods    BOM[] @relation("finished_good")
  work_order_items      WorkOrderItem[]

  @@index([is_active])
  @@index([procure_on_demand])
  @@check("(procure_on_demand = false) OR (procurement_type IS NOT NULL)")
  @@check("(procurement_type != 'PURCHASE'::procurement_type) OR (default_vendor_id IS NOT NULL)")
  @@check("(procurement_type != 'MANUFACTURING'::procurement_type) OR (default_bom_id IS NOT NULL)")
}

model Vendor {
  id                String        @id @default(cuid())
  reference         String        @unique @db.VarChar(20)  // VEND-0001
  name              String
  contact_person    String?
  email             String?
  phone             String?
  address           String?
  city              String?
  state             String?
  postal_code       String?
  payment_terms     String?
  is_active         Boolean       @default(true)
  created_at        DateTime      @default(now())
  updated_at        DateTime      @updatedAt

  // Relations
  purchase_orders   PurchaseOrder[]
  products          Product[]

  @@index([is_active])
}

model Customer {
  id                String        @id @default(cuid())
  reference         String        @unique @db.VarChar(20)  // CUST-0001
  name              String
  contact_person    String?
  email             String?
  phone             String?
  address           String?
  city              String?
  state             String?
  postal_code       String?
  is_active         Boolean       @default(true)
  created_at        DateTime      @default(now())
  updated_at        DateTime      @updatedAt

  // Relations
  sales_orders      SalesOrder[]

  @@index([is_active])
}

// ============================================================================
// SALES ORDER LIFECYCLE
// ============================================================================

model SalesOrder {
  id                    String              @id @default(cuid())
  reference             String              @unique @db.VarChar(20)  // SO-0001
  customer_id           String
  customer_address      String              // Snapshot at creation
  sales_person_id       String
  status                SalesOrderStatus    @default(DRAFT)
  order_date            DateTime            @default(now())
  promised_delivery_date DateTime?
  created_at            DateTime            @default(now())
  updated_at            DateTime            @updatedAt
  confirmed_at          DateTime?
  fully_delivered_at    DateTime?

  // Relations
  customer              Customer            @relation(fields: [customer_id], references: [id])
  sales_person         User                @relation(fields: [sales_person_id], references: [id])
  items                 SalesOrderItem[]
  stock_movements       StockMovement[] @relation("triggering_so")
  reservations          Reservation[] @relation("from_so")
  triggered_mos         ManufacturingOrder[] @relation("triggered_by_so")

  @@index([customer_id])
  @@index([sales_person_id])
  @@index([status])
  @@index([created_at])
}

model SalesOrderItem {
  id                    String    @id @default(cuid())
  sales_order_id        String
  product_id            String
  ordered_qty           Int
  delivered_qty         Int       @default(0)
  sales_price_snapshot  Decimal   @db.Numeric(18, 2)  // Editable snapshot
  is_available          Boolean   @default(false)
  line_total            Decimal   @db.Numeric(18, 2)
  created_at            DateTime  @default(now())
  updated_at            DateTime  @updatedAt

  // Relations
  sales_order           SalesOrder  @relation(fields: [sales_order_id], references: [id], onDelete: Cascade)
  product               Product     @relation(fields: [product_id], references: [id])

  @@unique([sales_order_id, product_id])
  @@index([sales_order_id])
  @@index([product_id])
  @@check("delivered_qty <= ordered_qty")
}

// ============================================================================
// PURCHASE ORDER LIFECYCLE
// ============================================================================

model PurchaseOrder {
  id                    String              @id @default(cuid())
  reference             String              @unique @db.VarChar(20)  // PO-0001
  vendor_id             String
  vendor_address        String              // Snapshot at creation
  responsible_person_id String
  status                PurchaseOrderStatus @default(DRAFT)
  order_date            DateTime            @default(now())
  promised_delivery_date DateTime?
  created_at            DateTime            @default(now())
  updated_at            DateTime            @updatedAt
  confirmed_at          DateTime?
  fully_received_at     DateTime?
  is_auto_created       Boolean             @default(false)
  trigger_source_so_id  String?             // Links back to triggering SO

  // Relations
  vendor                Vendor              @relation(fields: [vendor_id], references: [id])
  responsible_person   User                @relation(fields: [responsible_person_id], references: [id])
  items                 PurchaseOrderItem[]
  stock_movements       StockMovement[] @relation("triggering_po")

  @@index([vendor_id])
  @@index([responsible_person_id])
  @@index([status])
  @@index([is_auto_created])
  @@index([trigger_source_so_id])
}

model PurchaseOrderItem {
  id                    String    @id @default(cuid())
  purchase_order_id     String
  product_id            String
  ordered_qty           Int
  received_qty          Int       @default(0)
  cost_price_snapshot   Decimal   @db.Numeric(18, 2)  // Editable snapshot
  line_total            Decimal   @db.Numeric(18, 2)
  created_at            DateTime  @default(now())
  updated_at            DateTime  @updatedAt

  // Relations
  purchase_order        PurchaseOrder @relation(fields: [purchase_order_id], references: [id], onDelete: Cascade)
  product               Product       @relation(fields: [product_id], references: [id])

  @@unique([purchase_order_id, product_id])
  @@index([purchase_order_id])
  @@index([product_id])
  @@check("received_qty <= ordered_qty")
}

// ============================================================================
// BILL OF MATERIALS
// ============================================================================

model BOM {
  id                    String    @id @default(cuid())
  reference             String    @unique @db.VarChar(20)  // BOM-0001
  finished_good_id      String
  version               Int       @default(1)
  is_active             Boolean   @default(true)
  created_at            DateTime  @default(now())
  updated_at            DateTime  @updatedAt

  // Relations
  finished_good         Product   @relation("finished_good", fields: [finished_good_id], references: [id])
  lines                 BOMLine[]

  @@unique([finished_good_id, version])
  @@index([finished_good_id])
  @@index([is_active])
}

model BOMLine {
  id                    String    @id @default(cuid())
  bom_id                String
  component_id          String
  required_qty          Int
  unit_of_measure       String    @default("units")
  created_at            DateTime  @default(now())
  updated_at            DateTime  @updatedAt

  // Relations
  bom                   BOM       @relation(fields: [bom_id], references: [id], onDelete: Cascade)
  component             Product   @relation("component", fields: [component_id], references: [id])

  @@unique([bom_id, component_id])
  @@index([bom_id])
  @@index([component_id])
}

// ============================================================================
// MANUFACTURING ORDER LIFECYCLE
// ============================================================================

model ManufacturingOrder {
  id                    String                  @id @default(cuid())
  reference             String                  @unique @db.VarChar(20)  // MO-2026-001
  finished_good_id      String
  bom_id                String
  quantity_to_produce   Int
  responsible_person_id String
  status                ManufacturingOrderStatus @default(DRAFT)
  is_auto_created       Boolean                 @default(false)
  trigger_source_so_id  String?                 // Links back to triggering SO
  created_at            DateTime                @default(now())
  updated_at            DateTime                @updatedAt
  confirmed_at          DateTime?
  started_at            DateTime?
  completed_at          DateTime?

  // Relations
  finished_good         Product                 @relation(fields: [finished_good_id], references: [id])
  bom                   BOM                     @relation(fields: [bom_id], references: [id])
  responsible_person   User                    @relation(fields: [responsible_person_id], references: [id])
  items                 ManufacturingOrderItem[]
  work_orders           WorkOrder[]
  stock_movements       StockMovement[] @relation("triggering_mo")
  trigger_sales_order   SalesOrder?             @relation("triggered_by_so", fields: [trigger_source_so_id], references: [id])

  @@index([finished_good_id])
  @@index([responsible_person_id])
  @@index([status])
  @@index([is_auto_created])
  @@index([trigger_source_so_id])
}

model ManufacturingOrderItem {
  id                    String    @id @default(cuid())
  manufacturing_order_id String
  product_id            String
  operation_sequence    Int
  required_qty          Int
  consumed_qty          Int       @default(0)
  created_at            DateTime  @default(now())
  updated_at            DateTime  @updatedAt

  // Relations
  manufacturing_order   ManufacturingOrder @relation(fields: [manufacturing_order_id], references: [id], onDelete: Cascade)
  product               Product           @relation(fields: [product_id], references: [id])

  @@unique([manufacturing_order_id, product_id])
  @@index([manufacturing_order_id])
  @@index([product_id])
}

model WorkOrder {
  id                    String              @id @default(cuid())
  reference             String              @unique @db.VarChar(20)  // WO-2026-001
  manufacturing_order_id String
  work_center           String?
  status                WorkOrderStatus     @default(PENDING)
  duration_minutes      Int?
  started_at            DateTime?
  completed_at          DateTime?
  created_at            DateTime            @default(now())
  updated_at            DateTime            @updatedAt

  // Relations
  manufacturing_order   ManufacturingOrder  @relation(fields: [manufacturing_order_id], references: [id], onDelete: Cascade)
  items                 WorkOrderItem[]

  @@index([manufacturing_order_id])
  @@index([status])
}

model WorkOrderItem {
  id                    String    @id @default(cuid())
  work_order_id         String
  product_id            String
  required_qty          Int
  completed_qty         Int       @default(0)
  created_at            DateTime  @default(now())
  updated_at            DateTime  @updatedAt

  // Relations
  work_order            WorkOrder @relation(fields: [work_order_id], references: [id], onDelete: Cascade)
  product               Product   @relation(fields: [product_id], references: [id])

  @@unique([work_order_id, product_id])
  @@index([work_order_id])
  @@index([product_id])
}

// ============================================================================
// INVENTORY LEDGER (SOURCE OF TRUTH)
// ============================================================================

model StockMovement {
  id                    String              @id @default(cuid())
  product_id            String
  source_type           StockMovementSource
  signed_qty            Int                 // positive for inbound, negative for outbound
  reference_document    String?             // "SO-0001", "PO-0001", "MO-2026-001"
  triggering_sales_order_id     String?
  triggering_purchase_order_id   String?
  triggering_manufacturing_order_id String?
  notes                 String?
  created_at            DateTime            @default(now())

  // Relations
  product               Product             @relation(fields: [product_id], references: [id])
  sales_order           SalesOrder?         @relation("triggering_so", fields: [triggering_sales_order_id], references: [id])
  purchase_order        PurchaseOrder?      @relation("triggering_po", fields: [triggering_purchase_order_id], references: [id])
  manufacturing_order   ManufacturingOrder? @relation("triggering_mo", fields: [triggering_manufacturing_order_id], references: [id])

  @@index([product_id])
  @@index([created_at])
  @@index([source_type])
  @@index([triggering_sales_order_id])
  @@index([triggering_purchase_order_id])
  @@index([triggering_manufacturing_order_id])
}

// ============================================================================
// RESERVATIONS (DERIVED STATE)
// ============================================================================

model Reservation {
  id                    String    @id @default(cuid())
  product_id            String
  source_sales_order_id String
  reserved_qty          Int
  created_at            DateTime  @default(now())

  // Relations
  product               Product   @relation(fields: [product_id], references: [id])
  sales_order           SalesOrder @relation("from_so", fields: [source_sales_order_id], references: [id], onDelete: Cascade)

  @@unique([product_id, source_sales_order_id])
  @@index([product_id])
  @@index([source_sales_order_id])
}

// ============================================================================
// AUDIT LOG (APPEND-ONLY)
// ============================================================================

model AuditLog {
  id                    String              @id @default(cuid())
  actor_id              String
  action_type           AuditActionType
  module_name           String              // "products", "sales_orders", "purchase_orders", etc.
  record_type           String              // "Product", "SalesOrder", "PurchaseOrder", etc.
  record_id             String
  field_name            String?             // null if action is CREATE
  old_value             String?             // JSON string, never includes password
  new_value             String?             // JSON string, never includes password
  ip_address            String?
  user_agent            String?
  occurred_at           DateTime            @default(now())

  // Relations
  actor                 User                @relation("actor", fields: [actor_id], references: [id])

  @@index([actor_id])
  @@index([module_name])
  @@index([record_type, record_id])
  @@index([occurred_at])
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

model Notification {
  id                    String                @id @default(cuid())
  recipient_id          String?               // null = broadcast to role
  recipient_role        UserRole?
  title                 String
  message               String
  notification_type     String                // "LOW_STOCK", "PO_RECEIVED", "MO_COMPLETED", "ORDER_DELAYED"
  reference_document    String?               // "SO-0001", "PO-0001", etc.
  status                NotificationStatus    @default(UNREAD)
  created_at            DateTime              @default(now())
  read_at               DateTime?

  @@index([recipient_id])
  @@index([recipient_role])
  @@index([status])
  @@index([created_at])
}

// ============================================================================
// DASHBOARD VIEW (Materialized for Performance)
// ============================================================================

model DashboardOrderCounter {
  id                    String    @id @default(cuid())
  metric_key            String    @unique
  so_total              Int       @default(0)
  so_confirmed          Int       @default(0)
  so_partially_delivered Int     @default(0)
  so_fully_delivered    Int       @default(0)
  po_total              Int       @default(0)
  po_confirmed          Int       @default(0)
  po_partially_received Int       @default(0)
  po_fully_received     Int       @default(0)
  mo_total              Int       @default(0)
  mo_confirmed          Int       @default(0)
  mo_in_progress        Int       @default(0)
  mo_completed          Int       @default(0)
  updated_at            DateTime  @updatedAt
}
```

### 2.3 Database Views (SQL)

```sql
-- product_inventory_summary: Computes On-Hand, Reserved, Free-to-Use for every product
CREATE OR REPLACE VIEW product_inventory_summary AS
SELECT
  p.id,
  p.reference,
  p.name,
  COALESCE(SUM(CASE WHEN sm.source_type IS NOT NULL THEN sm.signed_qty ELSE 0 END), 0) as on_hand_qty,
  COALESCE(SUM(CASE WHEN r.reserved_qty > 0 THEN r.reserved_qty ELSE 0 END), 0) as reserved_qty,
  COALESCE(SUM(CASE WHEN sm.source_type IS NOT NULL THEN sm.signed_qty ELSE 0 END), 0)
    - COALESCE(SUM(CASE WHEN r.reserved_qty > 0 THEN r.reserved_qty ELSE 0 END), 0) as free_to_use_qty
FROM
  products p
LEFT JOIN stock_movements sm ON p.id = sm.product_id
LEFT JOIN reservations r ON p.id = r.product_id
GROUP BY p.id, p.reference, p.name;

-- sales_order_status_summary: Counts of SO by status
CREATE OR REPLACE VIEW sales_order_status_summary AS
SELECT
  COUNT(*) FILTER (WHERE status = 'DRAFT') as draft_count,
  COUNT(*) FILTER (WHERE status = 'CONFIRMED') as confirmed_count,
  COUNT(*) FILTER (WHERE status = 'PARTIALLY_DELIVERED') as partially_delivered_count,
  COUNT(*) FILTER (WHERE status = 'FULLY_DELIVERED') as fully_delivered_count,
  COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled_count,
  COUNT(*) as total_count
FROM sales_orders;

-- purchase_order_status_summary: Counts of PO by status
CREATE OR REPLACE VIEW purchase_order_status_summary AS
SELECT
  COUNT(*) FILTER (WHERE status = 'DRAFT') as draft_count,
  COUNT(*) FILTER (WHERE status = 'CONFIRMED') as confirmed_count,
  COUNT(*) FILTER (WHERE status = 'PARTIALLY_RECEIVED') as partially_received_count,
  COUNT(*) FILTER (WHERE status = 'FULLY_RECEIVED') as fully_received_count,
  COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled_count,
  COUNT(*) as total_count
FROM purchase_orders;

-- manufacturing_order_status_summary: Counts of MO by status
CREATE OR REPLACE VIEW manufacturing_order_status_summary AS
SELECT
  COUNT(*) FILTER (WHERE status = 'DRAFT') as draft_count,
  COUNT(*) FILTER (WHERE status = 'CONFIRMED') as confirmed_count,
  COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') as in_progress_count,
  COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_count,
  COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled_count,
  COUNT(*) as total_count
FROM manufacturing_orders;

-- delayed_orders: Orders overdue for delivery/receipt
CREATE OR REPLACE VIEW delayed_orders AS
SELECT
  'SO' as order_type,
  id,
  reference,
  promised_delivery_date,
  CURRENT_DATE - promised_delivery_date::DATE as days_overdue
FROM sales_orders
WHERE status IN ('CONFIRMED', 'PARTIALLY_DELIVERED')
  AND promised_delivery_date < CURRENT_DATE
UNION ALL
SELECT
  'PO' as order_type,
  id,
  reference,
  promised_delivery_date,
  CURRENT_DATE - promised_delivery_date::DATE as days_overdue
FROM purchase_orders
WHERE status IN ('CONFIRMED', 'PARTIALLY_RECEIVED')
  AND promised_delivery_date < CURRENT_DATE
UNION ALL
SELECT
  'MO' as order_type,
  id,
  reference,
  NULL,
  CURRENT_DATE - CURRENT_DATE as days_overdue
FROM manufacturing_orders
WHERE status IN ('CONFIRMED', 'IN_PROGRESS')
  AND completed_at IS NULL
  AND CURRENT_DATE > DATE(created_at) + INTERVAL '7 days';
```

---

## 3. AUTHENTICATION & AUTHORIZATION ARCHITECTURE

### 3.1 JWT & Session Management

#### JWT Structure

```typescript
// types/jwt.ts

export interface JWTPayload {
  sub: string; // user.id
  login_id: string;
  email: string;
  role: UserRole;
  permissions: PermissionType[]; // Embedded for fast checks
  iat: number; // Issued at
  exp: number; // 1 hour from iat
  aud: 'erp-system';
}
```

#### JWT Signing & Verification

```typescript
// config/jwt.ts

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = '1h';

export function issueJWT(user: User, permissions: PermissionType[]): string {
  const payload: JWTPayload = {
    sub: user.id,
    login_id: user.login_id,
    email: user.email,
    role: user.role_id as UserRole,
    permissions,
    aud: 'erp-system',
  };

  return jwt.sign(payload, JWT_SECRET!, {
    expiresIn: JWT_EXPIRY,
    algorithm: 'HS256',
  });
}

export function verifyJWT(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET!, {
    audience: 'erp-system',
  }) as JWTPayload;
}
```

### 3.2 Authentication Middleware

```typescript
// middleware/auth.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { verifyJWT, JWTPayload } from '../config/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);

  try {
    req.user = verifyJWT(token);
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

### 3.3 RBAC Middleware

```typescript
// middleware/rbac.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

// Decorator factory: requirePermission(['CREATE_SALES_ORDER', 'EDIT_SALES_ORDER'])
export function rbacMiddleware(requiredPermissions: PermissionType[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }

    // On every MUTATING request, re-check permissions against live DB
    // (not just the embedded JWT claims) to protect against mid-session role changes
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
      const livePermissions = await prisma.rolePermission.findMany({
        where: { role_id: req.user.role },
        select: { permission_type: true },
      });

      const hasAnyPermission = requiredPermissions.some((perm) =>
        livePermissions.some((rp) => rp.permission_type === perm),
      );

      if (!hasAnyPermission) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          required: requiredPermissions,
        });
      }
    }

    // For GET requests, use embedded JWT claims (faster, no DB hit)
    const hasAnyPermission = requiredPermissions.some((perm) =>
      req.user!.permissions.includes(perm),
    );

    if (!hasAnyPermission) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: requiredPermissions,
      });
    }

    next();
  };
}
```

### 3.4 Password Management

```typescript
// modules/auth/auth.service.ts (excerpt)

import bcrypt from 'bcrypt';

export class AuthService {
  async createUser(
    login_id: string,
    email: string,
    password: string,
    full_name: string,
  ): Promise<User> {
    // Password validation: ≥8 chars, ≥1 uppercase, ≥1 lowercase, ≥1 special char
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*])(.{8,})$/;
    if (!passwordRegex.test(password)) {
      throw new BadRequestError(
        'Password must be ≥8 chars, include uppercase, lowercase, and special character',
      );
    }

    // Hash password with bcrypt cost 12 (slower = more secure against brute-force)
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user with hashed password
    const user = await prisma.user.create({
      data: {
        login_id,
        email,
        password_hash: passwordHash,
        full_name,
        role_id: 'UNASSIGNED',
      },
    });

    // Log the signup event (but never log the password)
    await this.auditLog.log({
      actor_id: 'SYSTEM',
      action_type: 'CREATE',
      module_name: 'auth',
      record_type: 'User',
      record_id: user.id,
      field_name: null,
    });

    return user;
  }

  async login(login_id: string, password: string): Promise<{ user: User; token: string }> {
    const user = await prisma.user.findUnique({
      where: { login_id },
      include: { role_permissions: true },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid Login Id or Password');
    }

    // bcrypt.compare() always returns false in the same amount of time,
    // whether the hash matches or not — timing-attack resistant
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid Login Id or Password');
    }

    // Extract permission types from role
    const permissions = user.role_permissions.map((rp) => rp.permission_type);

    // Issue JWT
    const token = issueJWT(user, permissions);

    // Log the login event
    await this.auditLog.log({
      actor_id: user.id,
      action_type: 'LOGIN',
      module_name: 'auth',
      record_type: 'User',
      record_id: user.id,
      field_name: null,
    });

    return { user, token };
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');

    const isValid = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isValid) {
      throw new BadRequestError('Current password is incorrect');
    }

    const newHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { password_hash: newHash },
    });

    // Audit log: only log that a password change occurred, never the actual password
    await this.auditLog.log({
      actor_id: userId,
      action_type: 'UPDATE',
      module_name: 'users',
      record_type: 'User',
      record_id: userId,
      field_name: 'password_hash',
      old_value: null, // Never expose hash fragments
      new_value: 'Password changed.', // Literal string, not the hash
    });
  }
}
```

---

## 4. CORE SERVICE LAYER ARCHITECTURE

### 4.1 Service Layer Principles

Every service layer method:

1. **Validates business rules** (not just shape)
2. **Enforces status-driven field locking** (before repository write)
3. **Coordinates multi-table mutations** within a Prisma transaction
4. **Calls audit, inventory, and procurement services** inside the same transaction
5. **Never directly queries repositories** for read-only checks (done in the service)

### 4.2 Base Service Pattern

```typescript
// services/base.service.ts

import { PrismaClient } from '@prisma/client';
import { AuditLogService } from './audit-log.service';
import { FieldLockService } from './field-lock.service';
import { Logger } from '../utils/logger';

export abstract class BaseService {
  protected logger: Logger;

  constructor(
    protected prisma: PrismaClient,
    protected auditService: AuditLogService,
    protected fieldLockService: FieldLockService,
  ) {
    this.logger = new Logger(this.constructor.name);
  }

  /**
   * Execute a business operation in a database transaction.
   * All changes commit together or all fail together.
   */
  protected async transaction<T>(operation: (tx: PrismaClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(operation);
  }

  /**
   * Log any field change to the audit trail.
   */
  protected async logFieldChange(
    actor_id: string,
    record_type: string,
    record_id: string,
    field_name: string,
    old_value: any,
    new_value: any,
  ): Promise<void> {
    await this.auditService.log({
      actor_id,
      action_type: 'UPDATE',
      module_name: record_type.toLowerCase(),
      record_type,
      record_id,
      field_name,
      old_value: JSON.stringify(old_value),
      new_value: JSON.stringify(new_value),
    });
  }

  /**
   * Prevent writes to locked fields based on entity status.
   */
  protected assertFieldNotLocked(
    status: string,
    field: string,
    lockedFieldsByStatus: Record<string, string[]>,
  ): void {
    const lockedFields = lockedFieldsByStatus[status] || [];
    if (lockedFields.includes(field)) {
      throw new BadRequestError(`Cannot modify ${field} when status is ${status}`);
    }
  }
}
```

### 4.3 Inventory Ledger Service

```typescript
// services/inventory-ledger.service.ts

export class InventoryLedgerService extends BaseService {
  /**
   * Record a stock movement and atomically update the product's on_hand_qty.
   *
   * Critical constraint: This method MUST be called within a Prisma transaction
   * so that the ledger insert and the cached on_hand update are atomic.
   */
  async recordMovement(
    tx: PrismaClient,
    product_id: string,
    source_type: StockMovementSource,
    signed_qty: number,
    reference_document: string,
    triggering_so_id?: string,
    triggering_po_id?: string,
    triggering_mo_id?: string,
  ): Promise<StockMovement> {
    // 1. Insert ledger row
    const movement = await tx.stockMovement.create({
      data: {
        product_id,
        source_type,
        signed_qty,
        reference_document,
        triggering_sales_order_id: triggering_so_id,
        triggering_purchase_order_id: triggering_po_id,
        triggering_manufacturing_order_id: triggering_mo_id,
      },
    });

    // 2. Atomically update product's cached on_hand_qty
    const sumMovements = await tx.stockMovement.aggregate({
      where: { product_id },
      _sum: { signed_qty: true },
    });

    await tx.product.update({
      where: { id: product_id },
      data: {
        on_hand_qty: sumMovements._sum.signed_qty || 0,
      },
    });

    this.logger.info(`Movement recorded: ${reference_document} (${signed_qty} units)`);
    return movement;
  }

  /**
   * Reconciliation check: Verify that every product's on_hand_qty
   * equals the sum of its movements.
   *
   * Returns an array of mismatches, empty if all products reconcile.
   */
  async reconcileInventory(): Promise<{ product_id: string; expected: number; actual: number }[]> {
    const mismatches = await this.prisma.$queryRaw<
      { product_id: string; expected: number; actual: number }[]
    >`
      SELECT
        p.id as product_id,
        COALESCE(SUM(sm.signed_qty), 0) as expected,
        p.on_hand_qty as actual
      FROM products p
      LEFT JOIN stock_movements sm ON p.id = sm.product_id
      GROUP BY p.id, p.on_hand_qty
      HAVING COALESCE(SUM(sm.signed_qty), 0) != p.on_hand_qty
    `;

    if (mismatches.length > 0) {
      this.logger.warn(`Inventory reconciliation found ${mismatches.length} mismatches`);
    }

    return mismatches;
  }
}
```

### 4.4 Reservation Engine Service

```typescript
// services/reservation-engine.service.ts

export class ReservationEngineService extends BaseService {
  /**
   * Reserve stock for a confirmed sales order.
   *
   * Reservation represents a commitment: the SO is confirmed,
   * so its ordered quantity is "claimed" and reduces free-to-use.
   *
   * Must be called within a transaction alongside inventory ledger writes.
   */
  async reserve(
    tx: PrismaClient,
    product_id: string,
    sales_order_id: string,
    qty: number,
  ): Promise<Reservation> {
    return tx.reservation.upsert({
      where: {
        product_id_source_sales_order_id: {
          product_id,
          source_sales_order_id: sales_order_id,
        },
      },
      create: {
        product_id,
        source_sales_order_id: sales_order_id,
        reserved_qty: qty,
      },
      update: {
        reserved_qty: qty,
      },
    });
  }

  /**
   * Unreserve stock (called when an SO is cancelled or delivery is completed).
   */
  async unreserve(tx: PrismaClient, product_id: string, sales_order_id: string): Promise<void> {
    await tx.reservation.deleteMany({
      where: {
        product_id,
        source_sales_order_id: sales_order_id,
      },
    });
  }

  /**
   * Compute free-to-use for a product at this moment.
   *
   * Free-to-Use = On-Hand - Reserved
   *
   * On-Hand is cached; Reserved is computed from the reservations table.
   */
  async computeFreeToUse(product_id: string): Promise<number> {
    const product = await this.prisma.product.findUnique({
      where: { id: product_id },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    const reserved = await this.prisma.reservation.aggregate({
      where: { product_id },
      _sum: { reserved_qty: true },
    });

    const reservedQty = reserved._sum.reserved_qty || 0;
    return Math.max(0, product.on_hand_qty - reservedQty);
  }

  /**
   * Compute current reserved quantity for a product.
   */
  async computeReservedQty(product_id: string): Promise<number> {
    const reserved = await this.prisma.reservation.aggregate({
      where: { product_id },
      _sum: { reserved_qty: true },
    });

    return reserved._sum.reserved_qty || 0;
  }
}
```

### 4.5 Procurement Engine Service

```typescript
// services/procurement-engine.service.ts

export class ProcurementEngineService extends BaseService {
  constructor(
    protected prisma: PrismaClient,
    protected auditService: AuditLogService,
    protected fieldLockService: FieldLockService,
    protected reservationEngine: ReservationEngineService,
  ) {
    super(prisma, auditService, fieldLockService);
  }

  /**
   * Evaluate procurement strategy for a sales order confirmation.
   *
   * If a product is configured with "Procure on Demand" and the ordered
   * quantity exceeds free-to-use, automatically generate a Draft PO or MO
   * for the shortfall, linked back to this SO.
   *
   * This method is called synchronously inside the SO confirm transaction,
   * so a single API call creates both the SO and any triggered replenishment orders.
   */
  async evaluateForSalesOrder(
    tx: PrismaClient,
    salesOrder: SalesOrder,
    items: SalesOrderItem[],
  ): Promise<{ createdPOs: string[]; createdMOs: string[] }> {
    const createdPOs: string[] = [];
    const createdMOs: string[] = [];

    for (const item of items) {
      const product = await tx.product.findUnique({
        where: { id: item.product_id },
      });

      if (!product) continue;

      // Check if this product is configured for on-demand procurement
      if (!product.procure_on_demand) continue;

      // Compute free-to-use at this moment
      const freeToUse = await this.computeFreeToUseInTx(tx, product.id);

      // Determine if a shortfall exists
      const shortfall = Math.max(0, item.ordered_qty - freeToUse);

      if (shortfall <= 0) continue; // No shortage, no procurement action needed

      // Decide: Purchase or Manufacture?
      if (product.procurement_type === ProcurementType.PURCHASE) {
        const po = await this.createDraftPOForShortfall(tx, product, shortfall, salesOrder.id);
        createdPOs.push(po.id);
      } else if (product.procurement_type === ProcurementType.MANUFACTURING) {
        const mo = await this.createDraftMOForShortfall(tx, product, shortfall, salesOrder.id);
        createdMOs.push(mo.id);
      }
    }

    return { createdPOs, createdMOs };
  }

  private async createDraftPOForShortfall(
    tx: PrismaClient,
    product: Product,
    shortfall: number,
    triggeringSalesOrderId: string,
  ): Promise<PurchaseOrder> {
    if (!product.default_vendor_id) {
      throw new BadRequestError(
        `Product ${product.reference} is configured for purchase procurement but has no default vendor`,
      );
    }

    const vendor = await tx.vendor.findUnique({
      where: { id: product.default_vendor_id },
    });

    if (!vendor) {
      throw new BadRequestError(`Vendor not found for product ${product.reference}`);
    }

    // Generate PO reference (POYYYYMMDD-XXX)
    const poReference = await this.generatePOReference(tx);

    const po = await tx.purchaseOrder.create({
      data: {
        reference: poReference,
        vendor_id: vendor.id,
        vendor_address: vendor.address || '',
        responsible_person_id: 'SYSTEM', // Auto-created, no specific person
        status: PurchaseOrderStatus.DRAFT,
        is_auto_created: true,
        trigger_source_so_id: triggeringSalesOrderId,
        items: {
          create: [
            {
              product_id: product.id,
              ordered_qty: shortfall,
              cost_price_snapshot: product.cost_price,
              line_total: product.cost_price.times(shortfall),
            },
          ],
        },
      },
    });

    // Audit log
    await this.auditService.log({
      actor_id: 'SYSTEM',
      action_type: 'CREATE',
      module_name: 'purchase_orders',
      record_type: 'PurchaseOrder',
      record_id: po.id,
      field_name: null,
    });

    this.logger.info(
      `Auto-created Draft PO ${po.reference} for shortfall: ${shortfall} units of ${product.reference}`,
    );

    return po;
  }

  private async createDraftMOForShortfall(
    tx: PrismaClient,
    product: Product,
    shortfall: number,
    triggeringSalesOrderId: string,
  ): Promise<ManufacturingOrder> {
    if (!product.default_bom_id) {
      throw new BadRequestError(
        `Product ${product.reference} is configured for manufacturing but has no default BoM`,
      );
    }

    const bom = await tx.bom.findUnique({
      where: { id: product.default_bom_id },
    });

    if (!bom) {
      throw new BadRequestError(`BoM not found for product ${product.reference}`);
    }

    // Generate MO reference (MO-YYYYMMDD-XXX)
    const moReference = await this.generateMOReference(tx);

    const mo = await tx.manufacturingOrder.create({
      data: {
        reference: moReference,
        finished_good_id: product.id,
        bom_id: bom.id,
        quantity_to_produce: shortfall,
        responsible_person_id: 'SYSTEM',
        status: ManufacturingOrderStatus.DRAFT,
        is_auto_created: true,
        trigger_source_so_id: triggeringSalesOrderId,
        items: {
          create: (await this.getBOMComponentsInTx(tx, bom.id)).map((line, idx) => ({
            product_id: line.component_id,
            required_qty: line.required_qty * shortfall,
            operation_sequence: idx,
          })),
        },
      },
    });

    // Audit log
    await this.auditService.log({
      actor_id: 'SYSTEM',
      action_type: 'CREATE',
      module_name: 'manufacturing_orders',
      record_type: 'ManufacturingOrder',
      record_id: mo.id,
      field_name: null,
    });

    this.logger.info(
      `Auto-created Draft MO ${mo.reference} for shortfall: ${shortfall} units of ${product.reference}`,
    );

    return mo;
  }

  private async computeFreeToUseInTx(tx: PrismaClient, product_id: string): Promise<number> {
    const product = await tx.product.findUnique({
      where: { id: product_id },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    const reserved = await tx.reservation.aggregate({
      where: { product_id },
      _sum: { reserved_qty: true },
    });

    const reservedQty = reserved._sum.reserved_qty || 0;
    return Math.max(0, product.on_hand_qty - reservedQty);
  }

  private async getBOMComponentsInTx(tx: PrismaClient, bomId: string): Promise<BOMLine[]> {
    return tx.bomLine.findMany({
      where: { bom_id: bomId },
    });
  }

  private async generatePOReference(tx: PrismaClient): Promise<string> {
    // Count existing POs today
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const count = await tx.purchaseOrder.count({
      where: {
        created_at: {
          gte: new Date(today),
          lt: new Date(new Date(today).getTime() + 86400000),
        },
      },
    });

    const formatted = today.replace(/-/g, '');
    return `PO${formatted}-${String(count + 1).padStart(3, '0')}`;
  }

  private async generateMOReference(tx: PrismaClient): Promise<string> {
    const year = new Date().getFullYear();
    const count = await tx.manufacturingOrder.count({
      where: {
        created_at: {
          gte: new Date(`${year}-01-01`),
        },
      },
    });

    return `MO-${year}-${String(count + 1).padStart(3, '0')}`;
  }
}
```

### 4.6 Audit Log Service

```typescript
// services/audit-log.service.ts

export class AuditLogService extends BaseService {
  /**
   * Log any mutation (CREATE, UPDATE, DELETE, LOGIN, CONFIRM, DELIVER, etc.)
   * to the audit trail.
   *
   * Design note: Never logs password values, only the string "Password changed."
   * All old and new values are JSON stringified so numeric, boolean, and null
   * values are distinguishable.
   */
  async log(args: {
    actor_id: string;
    action_type: AuditActionType;
    module_name: string;
    record_type: string;
    record_id: string;
    field_name?: string | null;
    old_value?: string | null;
    new_value?: string | null;
    ip_address?: string;
    user_agent?: string;
  }): Promise<AuditLog> {
    // Never write actual password strings to the audit log
    if (args.field_name === 'password_hash') {
      args.old_value = null;
      args.new_value = 'Password changed.';
    }

    const log = await this.prisma.auditLog.create({
      data: {
        actor_id: args.actor_id,
        action_type: args.action_type,
        module_name: args.module_name,
        record_type: args.record_type,
        record_id: args.record_id,
        field_name: args.field_name || null,
        old_value: args.old_value || null,
        new_value: args.new_value || null,
        ip_address: args.ip_address,
        user_agent: args.user_agent,
      },
    });

    this.logger.debug(
      `[AUDIT] ${args.actor_id} ${args.action_type} ${args.record_type}/${args.record_id}`,
    );

    return log;
  }

  /**
   * Retrieve audit logs with filtering and pagination.
   */
  async getLogsForRecord(
    record_type: string,
    record_id: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      where: {
        record_type,
        record_id,
      },
      orderBy: { occurred_at: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get all logs for a specific user (actor) between two dates.
   */
  async getLogsForActor(
    actor_id: string,
    startDate: Date,
    endDate: Date,
    limit: number = 100,
  ): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      where: {
        actor_id,
        occurred_at: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { occurred_at: 'desc' },
      take: limit,
    });
  }

  /**
   * Summary statistics for the audit log (used on Admin dashboard).
   */
  async getSummary(
    startDate: Date,
    endDate: Date,
  ): Promise<{
    total: number;
    creates: number;
    updates: number;
    deletes: number;
    logins: number;
  }> {
    const logs = await this.prisma.auditLog.groupBy({
      by: ['action_type'],
      where: {
        occurred_at: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: true,
    });

    let creates = 0,
      updates = 0,
      deletes = 0,
      logins = 0,
      total = 0;

    logs.forEach((log) => {
      total += log._count;
      if (log.action_type === 'CREATE') creates = log._count;
      if (log.action_type === 'UPDATE') updates = log._count;
      if (log.action_type === 'DELETE') deletes = log._count;
      if (log.action_type === 'LOGIN') logins = log._count;
    });

    return { total, creates, updates, deletes, logins };
  }
}
```

---

## 5. MODULE ARCHITECTURES

This section describes the complete architecture for each functional module.

### 5.1 Products Module

#### 5.1.1 Folder Structure

```
src/modules/products/
├── products.controller.ts
├── products.service.ts
├── products.repository.ts
├── products.routes.ts
└── __tests__/
    ├── products.service.test.ts
    └── products.integration.test.ts
```

#### 5.1.2 Product Service

```typescript
// modules/products/products.service.ts

import { Product, BOM, ProcurementType } from '@prisma/client';
import { BaseService } from '../../services/base.service';
import { BadRequestError, NotFoundError } from '../../utils/errors';

export class ProductsService extends BaseService {
  constructor(
    prisma,
    auditService,
    fieldLockService,
    private productsRepository,
  ) {
    super(prisma, auditService, fieldLockService);
  }

  /**
   * Create a new product.
   *
   * Validation:
   * - If `procure_on_demand` is true, `procurement_type` becomes mandatory.
   * - If `procurement_type` is PURCHASE, `default_vendor_id` becomes mandatory.
   * - If `procurement_type` is MANUFACTURING, `default_bom_id` becomes mandatory.
   * - Never both simultaneously.
   */
  async createProduct(
    actor_id: string,
    data: {
      name: string;
      sales_price: number;
      cost_price: number;
      procure_on_demand?: boolean;
      procurement_type?: ProcurementType;
      default_vendor_id?: string;
      default_bom_id?: string;
    },
  ): Promise<Product> {
    // Validate conditional requirements
    if (data.procure_on_demand) {
      if (!data.procurement_type) {
        throw new BadRequestError('procurement_type is mandatory when procure_on_demand is true');
      }

      if (data.procurement_type === ProcurementType.PURCHASE && !data.default_vendor_id) {
        throw new BadRequestError('default_vendor_id is mandatory for PURCHASE procurement type');
      }

      if (data.procurement_type === ProcurementType.MANUFACTURING && !data.default_bom_id) {
        throw new BadRequestError('default_bom_id is mandatory for MANUFACTURING procurement type');
      }
    }

    // Generate product reference (PROD-0001, PROD-0002, etc.)
    const reference = await this.generateProductReference();

    // Create product in transaction
    const product = await this.transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          reference,
          name: data.name,
          sales_price: data.sales_price,
          cost_price: data.cost_price,
          procure_on_demand: data.procure_on_demand || false,
          procurement_type: data.procurement_type,
          default_vendor_id: data.default_vendor_id,
          default_bom_id: data.default_bom_id,
          on_hand_qty: 0,
        },
      });

      // Audit log
      await this.auditService.log({
        actor_id,
        action_type: 'CREATE',
        module_name: 'products',
        record_type: 'Product',
        record_id: created.id,
      });

      return created;
    });

    this.logger.info(`Product created: ${product.reference} - ${product.name}`);
    return product;
  }

  /**
   * Update product (editable fields: name, sales_price, cost_price, procurement config).
   *
   * Note: on_hand_qty is NEVER directly editable through this method.
   * Changes to on_hand_qty only happen through stock movements via Manual Adjustment.
   */
  async updateProduct(
    actor_id: string,
    productId: string,
    data: {
      name?: string;
      sales_price?: number;
      cost_price?: number;
      reorder_point?: number;
      procure_on_demand?: boolean;
      procurement_type?: ProcurementType;
      default_vendor_id?: string;
      default_bom_id?: string;
    },
  ): Promise<Product> {
    const product = await this.productsRepository.findById(productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    const updates: any = {};

    // Track changes for audit
    const oldValues: Record<string, any> = {};
    const newValues: Record<string, any> = {};

    if (data.name !== undefined && data.name !== product.name) {
      oldValues.name = product.name;
      newValues.name = data.name;
      updates.name = data.name;
    }

    if (data.sales_price !== undefined && data.sales_price !== product.sales_price) {
      oldValues.sales_price = product.sales_price;
      newValues.sales_price = data.sales_price;
      updates.sales_price = data.sales_price;
    }

    // ... similar for other fields

    if (data.procure_on_demand !== undefined) {
      if (data.procure_on_demand && !data.procurement_type) {
        throw new BadRequestError('procurement_type is required when procure_on_demand is true');
      }
      updates.procure_on_demand = data.procure_on_demand;
      updates.procurement_type = data.procurement_type;
      updates.default_vendor_id = data.default_vendor_id;
      updates.default_bom_id = data.default_bom_id;
    }

    if (Object.keys(updates).length === 0) {
      // No changes
      return product;
    }

    const updated = await this.transaction(async (tx) => {
      const result = await tx.product.update({
        where: { id: productId },
        data: updates,
      });

      // Log each changed field
      for (const field of Object.keys(oldValues)) {
        await this.auditService.log({
          actor_id,
          action_type: 'UPDATE',
          module_name: 'products',
          record_type: 'Product',
          record_id: productId,
          field_name: field,
          old_value: JSON.stringify(oldValues[field]),
          new_value: JSON.stringify(newValues[field]),
        });
      }

      return result;
    });

    this.logger.info(`Product updated: ${product.reference}`);
    return updated;
  }

  /**
   * Get product detail with computed inventory values.
   */
  async getProduct(productId: string): Promise<Product & { free_to_use: number }> {
    const product = await this.productsRepository.findById(productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Compute free-to-use
    const reserved = await this.prisma.reservation.aggregate({
      where: { product_id: productId },
      _sum: { reserved_qty: true },
    });

    const reservedQty = reserved._sum.reserved_qty || 0;
    const freeToUse = Math.max(0, product.on_hand_qty - reservedQty);

    return { ...product, free_to_use: freeToUse };
  }

  /**
   * Record a manual stock adjustment (IN or OUT).
   *
   * Only Inventory Manager and Admin can call this.
   * Creates a stock movement and updates on_hand_qty atomically.
   */
  async adjustStock(
    actor_id: string,
    productId: string,
    direction: 'IN' | 'OUT',
    quantity: number,
    reason: string,
  ): Promise<StockMovement> {
    const product = await this.productsRepository.findById(productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    if (direction === 'OUT' && quantity > product.on_hand_qty) {
      throw new BadRequestError(
        `Cannot adjust out ${quantity} units; only ${product.on_hand_qty} on hand`,
      );
    }

    const signed_qty = direction === 'IN' ? quantity : -quantity;

    const movement = await this.transaction(async (tx) => {
      // Record movement
      const mov = await tx.stockMovement.create({
        data: {
          product_id: productId,
          source_type: 'MANUAL_ADJUSTMENT',
          signed_qty,
          reference_document: `MANUAL-${new Date().getTime()}`,
          notes: reason,
        },
      });

      // Update cached on_hand_qty
      const sumMovements = await tx.stockMovement.aggregate({
        where: { product_id: productId },
        _sum: { signed_qty: true },
      });

      await tx.product.update({
        where: { id: productId },
        data: {
          on_hand_qty: sumMovements._sum.signed_qty || 0,
        },
      });

      // Audit log
      await this.auditService.log({
        actor_id,
        action_type: 'UPDATE',
        module_name: 'inventory',
        record_type: 'Product',
        record_id: productId,
        field_name: 'on_hand_qty',
        old_value: JSON.stringify(product.on_hand_qty),
        new_value: JSON.stringify(sumMovements._sum.signed_qty || 0),
      });

      return mov;
    });

    this.logger.info(`Stock adjustment: ${product.reference} ${direction} ${quantity} units`);
    return movement;
  }

  /**
   * List all products with optional filters.
   */
  async listProducts(filters?: {
    search?: string;
    procure_on_demand?: boolean;
    is_active?: boolean;
    offset?: number;
    limit?: number;
  }): Promise<{ products: Product[]; total: number }> {
    const where: any = {};

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { reference: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.procure_on_demand !== undefined) {
      where.procure_on_demand = filters.procure_on_demand;
    }

    if (filters?.is_active !== undefined) {
      where.is_active = filters.is_active;
    }

    const total = await this.prisma.product.count({ where });

    const products = await this.prisma.product.findMany({
      where,
      skip: filters?.offset || 0,
      take: filters?.limit || 50,
      orderBy: { created_at: 'desc' },
    });

    return { products, total };
  }

  /**
   * Get stock card (movements) for a product.
   */
  async getStockCard(productId: string, limit: number = 50): Promise<StockMovement[]> {
    return this.prisma.stockMovement.findMany({
      where: { product_id: productId },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  }

  private async generateProductReference(): Promise<string> {
    const count = await this.prisma.product.count();
    return `PROD-${String(count + 1).padStart(4, '0')}`;
  }
}
```

#### 5.1.3 Product Repository

```typescript
// modules/products/products.repository.ts

import { Prisma, Product } from '@prisma/client';

export class ProductsRepository {
  constructor(private prisma) {}

  async findById(id: string): Promise<Product | null> {
    return this.prisma.product.findUnique({
      where: { id },
    });
  }

  async findByReference(reference: string): Promise<Product | null> {
    return this.prisma.product.findUnique({
      where: { reference },
    });
  }

  /**
   * Fetch a product FOR UPDATE — row-level lock to prevent concurrent stock issues.
   * Used before any stock-affecting operation.
   */
  async findForUpdate(tx: PrismaClient, id: string): Promise<Product | null> {
    return tx.$queryRaw<Product[]>`
      SELECT * FROM products WHERE id = ${id} FOR UPDATE
    `;
  }

  /**
   * Increment on_hand_qty atomically (used by inventory ledger).
   */
  async incrementOnHand(id: string, amount: number): Promise<Product> {
    return this.prisma.product.update({
      where: { id },
      data: {
        on_hand_qty: {
          increment: amount,
        },
      },
    });
  }

  async create(data: Prisma.ProductCreateInput): Promise<Product> {
    return this.prisma.product.create({ data });
  }

  async update(id: string, data: Prisma.ProductUpdateInput): Promise<Product> {
    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Product> {
    return this.prisma.product.update({
      where: { id },
      data: { is_active: false }, // Soft delete
    });
  }
}
```

#### 5.1.4 Product Routes

```typescript
// modules/products/products.routes.ts

import { Router, Request, Response, NextFunction } from 'express';
import { rbacMiddleware } from '../../middleware/rbac.middleware';
import { z } from 'zod';
import { ProductsController } from './products.controller';

const router = Router();

const createProductSchema = z.object({
  name: z.string().min(1),
  sales_price: z.number().positive(),
  cost_price: z.number().positive(),
  procure_on_demand: z.boolean().optional(),
  procurement_type: z.enum(['PURCHASE', 'MANUFACTURING']).optional(),
  default_vendor_id: z.string().optional(),
  default_bom_id: z.string().optional(),
});

// POST /products — Create product
router.post(
  '/',
  rbacMiddleware(['CREATE_PRODUCT']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = createProductSchema.parse(req.body);
      const result = await controller.createProduct(req.user!.sub, body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// GET /products — List products
router.get(
  '/',
  rbacMiddleware(['VIEW_PRODUCT']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        search: req.query.search as string,
        procure_on_demand: req.query.procure_on_demand === 'true',
        is_active: req.query.is_active !== 'false',
        offset: parseInt(req.query.offset as string) || 0,
        limit: parseInt(req.query.limit as string) || 50,
      };
      const result = await controller.listProducts(filters);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// GET /products/:id — Get product detail
router.get(
  '/:id',
  rbacMiddleware(['VIEW_PRODUCT']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await controller.getProduct(req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /products/:id — Update product
router.patch(
  '/:id',
  rbacMiddleware(['EDIT_PRODUCT']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await controller.updateProduct(req.user!.sub, req.params.id, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// POST /products/:id/stock-adjustments — Adjust stock (Inventory Manager only)
router.post(
  '/:id/stock-adjustments',
  rbacMiddleware(['ADJUST_INVENTORY']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { direction, quantity, reason } = z
        .object({
          direction: z.enum(['IN', 'OUT']),
          quantity: z.number().positive(),
          reason: z.string(),
        })
        .parse(req.body);

      const result = await controller.adjustStock(
        req.user!.sub,
        req.params.id,
        direction,
        quantity,
        reason,
      );
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// GET /products/:id/stock-card — Get stock movements
router.get(
  '/:id/stock-card',
  rbacMiddleware(['VIEW_INVENTORY']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const result = await controller.getStockCard(req.params.id, limit);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// GET /products/:id/audit-logs — Get audit trail for product
router.get(
  '/:id/audit-logs',
  rbacMiddleware(['VIEW_AUDIT_LOGS']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await controller.getAuditLogs(req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
```

### 5.2 Sales Orders Module

Due to space constraints, I'll provide a condensed version. Full implementation follows the same pattern as Products.

#### 5.2.1 Sales Orders Service (Key Methods)

```typescript
// modules/sales-orders/sales-orders.service.ts

export class SalesOrdersService extends BaseService {
  /**
   * Create sales order in DRAFT status.
   *
   * No reservations happen here; they happen on CONFIRM.
   */
  async createSalesOrder(
    actor_id: string,
    data: {
      customer_id: string;
      customer_address: string;
      sales_person_id: string;
      items: Array<{
        product_id: string;
        ordered_qty: number;
      }>;
    },
  ): Promise<SalesOrder & { items: SalesOrderItem[] }> {
    // Validate customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: data.customer_id },
    });
    if (!customer) throw new NotFoundError('Customer not found');

    // Generate SO reference
    const reference = await this.generateSOReference();

    const so = await this.transaction(async (tx) => {
      // Create SO
      const created = await tx.salesOrder.create({
        data: {
          reference,
          customer_id: data.customer_id,
          customer_address: data.customer_address,
          sales_person_id: data.sales_person_id,
          status: SalesOrderStatus.DRAFT,
          items: {
            create: [],
          },
        },
        include: { items: true },
      });

      // Add items
      const items: SalesOrderItem[] = [];
      for (const item of data.items) {
        const product = await tx.product.findUnique({
          where: { id: item.product_id },
        });
        if (!product) throw new NotFoundError(`Product ${item.product_id} not found`);

        const soItem = await tx.salesOrderItem.create({
          data: {
            sales_order_id: created.id,
            product_id: item.product_id,
            ordered_qty: item.ordered_qty,
            sales_price_snapshot: product.sales_price,
            line_total: product.sales_price.times(item.ordered_qty),
            is_available: false, // Will compute on confirm
          },
        });
        items.push(soItem);
      }

      // Audit log
      await this.auditService.log({
        actor_id,
        action_type: 'CREATE',
        module_name: 'sales_orders',
        record_type: 'SalesOrder',
        record_id: created.id,
      });

      return { ...created, items };
    });

    this.logger.info(`Sales Order created: ${so.reference}`);
    return so;
  }

  /**
   * Confirm sales order: DRAFT → CONFIRMED.
   *
   * This is the critical step where:
   * 1. Customer, address, order date are locked
   * 2. Stock is reserved for all items
   * 3. Procurement engine is evaluated for shortfalls
   * 4. Auto-POs or MOs are created if needed
   * 5. All changes happen in one transaction
   */
  async confirmSalesOrder(
    actor_id: string,
    salesOrderId: string,
    procurementEngine: ProcurementEngineService,
    reservationEngine: ReservationEngineService,
    inventoryLedger: InventoryLedgerService,
  ): Promise<SalesOrder> {
    const so = await this.prisma.salesOrder.findUnique({
      where: { id: salesOrderId },
      include: { items: true },
    });

    if (!so) throw new NotFoundError('Sales Order not found');
    if (so.status !== SalesOrderStatus.DRAFT) {
      throw new BadRequestError(`Cannot confirm SO with status ${so.status}`);
    }

    const confirmed = await this.transaction(async (tx) => {
      // 1. Lock products and check availability
      const productsToLock = so.items.map((item) => item.product_id);
      const products = await Promise.all(
        productsToLock.map(
          (id) =>
            tx.$queryRaw<[Product]>`
            SELECT * FROM products WHERE id = ${id} FOR UPDATE
          `,
        ),
      );

      // 2. Reserve stock for each item
      for (const item of so.items) {
        await reservationEngine.reserve(tx, item.product_id, so.id, item.ordered_qty);

        // Mark as available or not
        const freeToUse = await this.computeFreeToUseInTx(tx, item.product_id);
        const isAvailable = item.ordered_qty <= freeToUse;

        await tx.salesOrderItem.update({
          where: { id: item.id },
          data: { is_available: isAvailable },
        });
      }

      // 3. Evaluate procurement strategy for shortfalls
      const { createdPOs, createdMOs } = await procurementEngine.evaluateForSalesOrder(
        tx,
        so,
        so.items,
      );

      // 4. Update SO status
      const updated = await tx.salesOrder.update({
        where: { id: so.id },
        data: {
          status: SalesOrderStatus.CONFIRMED,
          confirmed_at: new Date(),
        },
      });

      // 5. Audit log
      await this.auditService.log({
        actor_id,
        action_type: 'CONFIRM',
        module_name: 'sales_orders',
        record_type: 'SalesOrder',
        record_id: so.id,
        field_name: 'status',
        old_value: JSON.stringify(so.status),
        new_value: JSON.stringify(SalesOrderStatus.CONFIRMED),
      });

      // 6. Publish notifications
      if (createdPOs.length > 0) {
        await this.notificationService.publish(
          tx,
          `Auto-created ${createdPOs.length} Purchase Order(s) for SO ${so.reference}`,
          `Short stock detected on SO ${so.reference}; purchase orders have been created automatically.`,
          'SHORT_STOCK_MITIGATION',
          so.reference,
          'PURCHASE_USER',
        );
      }

      if (createdMOs.length > 0) {
        await this.notificationService.publish(
          tx,
          `Auto-created ${createdMOs.length} Manufacturing Order(s) for SO ${so.reference}`,
          `Short stock detected on SO ${so.reference}; manufacturing orders have been created automatically.`,
          'SHORT_STOCK_MITIGATION',
          so.reference,
          'MANUFACTURING_USER',
        );
      }

      return updated;
    });

    this.logger.info(`Sales Order confirmed: ${so.reference}`);
    return confirmed;
  }

  /**
   * Deliver sales order items.
   *
   * Key constraints:
   * - Cumulative delivered_qty can never exceed ordered_qty
   * - Each call emits a stock movement for the **delta** (new - previous)
   * - On full delivery, SO → FULLY_DELIVERED (locked state)
   * - On partial delivery, SO → PARTIALLY_DELIVERED (can continue delivering)
   * - Reservation is released proportionally to the delivery
   */
  async deliverSalesOrder(
    actor_id: string,
    salesOrderId: string,
    items: Array<{
      sales_order_item_id: string;
      delivered_qty: number;
    }>,
    inventoryLedger: InventoryLedgerService,
    reservationEngine: ReservationEngineService,
  ): Promise<SalesOrder> {
    const so = await this.prisma.salesOrder.findUnique({
      where: { id: salesOrderId },
      include: { items: true },
    });

    if (!so) throw new NotFoundError('Sales Order not found');
    if (![SalesOrderStatus.CONFIRMED, SalesOrderStatus.PARTIALLY_DELIVERED].includes(so.status)) {
      throw new BadRequestError(
        `Cannot deliver SO with status ${so.status}; must be CONFIRMED or PARTIALLY_DELIVERED`,
      );
    }

    const updated = await this.transaction(async (tx) => {
      let isFullyDelivered = true;

      for (const deliveryItem of items) {
        const soItem = so.items.find((i) => i.id === deliveryItem.sales_order_item_id);
        if (!soItem) throw new NotFoundError('Sales Order Item not found');

        // Validate cumulative constraint
        const newCumulative = soItem.delivered_qty + deliveryItem.delivered_qty;
        if (newCumulative > soItem.ordered_qty) {
          throw new BadRequestError(
            `Delivery qty exceeds ordered qty for item ${soItem.id}: ${newCumulative} > ${soItem.ordered_qty}`,
          );
        }

        // Emit stock movement for the **delta** (not the cumulative)
        const delta = deliveryItem.delivered_qty;
        await inventoryLedger.recordMovement(
          tx,
          soItem.product_id,
          StockMovementSource.SALES_DELIVERY,
          -delta, // Negative: outbound
          so.reference,
          so.id,
        );

        // Release proportion of reservation
        const releaseQty = delta;
        const current_reservation = await tx.reservation.findUnique({
          where: {
            product_id_source_sales_order_id: {
              product_id: soItem.product_id,
              source_sales_order_id: so.id,
            },
          },
        });

        if (current_reservation) {
          const remaining_reserved = Math.max(0, current_reservation.reserved_qty - releaseQty);
          if (remaining_reserved > 0) {
            await tx.reservation.update({
              where: { id: current_reservation.id },
              data: { reserved_qty: remaining_reserved },
            });
          } else {
            await tx.reservation.delete({
              where: { id: current_reservation.id },
            });
          }
        }

        // Update delivered_qty on item
        await tx.salesOrderItem.update({
          where: { id: soItem.id },
          data: {
            delivered_qty: newCumulative,
          },
        });

        // Check if this item is fully delivered
        if (newCumulative < soItem.ordered_qty) {
          isFullyDelivered = false;
        }
      }

      // Determine final status
      const finalStatus = isFullyDelivered
        ? SalesOrderStatus.FULLY_DELIVERED
        : SalesOrderStatus.PARTIALLY_DELIVERED;

      const result = await tx.salesOrder.update({
        where: { id: so.id },
        data: {
          status: finalStatus,
          fully_delivered_at: isFullyDelivered ? new Date() : null,
        },
      });

      // Audit log
      await this.auditService.log({
        actor_id,
        action_type: 'DELIVER',
        module_name: 'sales_orders',
        record_type: 'SalesOrder',
        record_id: so.id,
        field_name: 'status',
        old_value: JSON.stringify(so.status),
        new_value: JSON.stringify(finalStatus),
      });

      return result;
    });

    this.logger.info(`Sales Order delivered: ${so.reference} → ${updated.status}`);
    return updated;
  }

  /**
   * Cancel sales order: DRAFT → CANCELLED.
   *
   * If the SO was confirmed (and thus had reservations),
   * those reservations are released.
   */
  async cancelSalesOrder(
    actor_id: string,
    salesOrderId: string,
    reservationEngine: ReservationEngineService,
  ): Promise<SalesOrder> {
    const so = await this.prisma.salesOrder.findUnique({
      where: { id: salesOrderId },
      include: { items: true },
    });

    if (!so) throw new NotFoundError('Sales Order not found');
    if (so.status !== SalesOrderStatus.DRAFT) {
      throw new BadRequestError(`Can only cancel DRAFT sales orders; this SO is ${so.status}`);
    }

    const cancelled = await this.transaction(async (tx) => {
      // Release all reservations (defensive; Draft shouldn't normally hold one)
      for (const item of so.items) {
        await reservationEngine.unreserve(tx, item.product_id, so.id);
      }

      const result = await tx.salesOrder.update({
        where: { id: so.id },
        data: { status: SalesOrderStatus.CANCELLED },
      });

      // Audit log
      await this.auditService.log({
        actor_id,
        action_type: 'UPDATE',
        module_name: 'sales_orders',
        record_type: 'SalesOrder',
        record_id: so.id,
        field_name: 'status',
        old_value: JSON.stringify(so.status),
        new_value: JSON.stringify(SalesOrderStatus.CANCELLED),
      });

      return result;
    });

    this.logger.info(`Sales Order cancelled: ${so.reference}`);
    return cancelled;
  }

  private async computeFreeToUseInTx(tx: PrismaClient, product_id: string): Promise<number> {
    const product = await tx.product.findUnique({
      where: { id: product_id },
    });

    if (!product) return 0;

    const reserved = await tx.reservation.aggregate({
      where: { product_id },
      _sum: { reserved_qty: true },
    });

    const reservedQty = reserved._sum.reserved_qty || 0;
    return Math.max(0, product.on_hand_qty - reservedQty);
  }

  private async generateSOReference(): Promise<string> {
    const count = await this.prisma.salesOrder.count();
    return `SO-${String(count + 1).padStart(5, '0')}`;
  }
}
```

### 5.3 Purchase Orders Module

(Follows same pattern as Sales Orders, key difference: receiving increases stock instead of decreasing it.)

### 5.4 Manufacturing Orders & BoM Modules

(Most complex module; includes work order tracking, component consumption, and finished goods production in single transaction.)

---

## 6. SUPPORTING SYSTEMS

### 6.1 Notification Service

```typescript
// modules/notifications/notifications.service.ts

export class NotificationsService extends BaseService {
  async publishNotification(
    tx: PrismaClient,
    title: string,
    message: string,
    notification_type: string,
    reference_document: string,
    recipient_role?: UserRole,
    recipient_id?: string,
  ): Promise<Notification> {
    const notif = await tx.notification.create({
      data: {
        title,
        message,
        notification_type,
        reference_document,
        recipient_role,
        recipient_id,
        status: 'UNREAD',
      },
    });

    return notif;
  }

  /**
   * Get unread notifications for a user or role.
   */
  async getUnreadNotifications(
    limit: number = 50,
    offset: number = 0,
    filter?: {
      recipient_id?: string;
      recipient_role?: UserRole;
    },
  ): Promise<{ notifications: Notification[]; total: number }> {
    const where: any = { status: 'UNREAD' };

    if (filter?.recipient_id) {
      where.recipient_id = filter.recipient_id;
    }
    if (filter?.recipient_role) {
      where.recipient_role = filter.recipient_role;
    }

    const total = await this.prisma.notification.count({ where });

    const notifications = await this.prisma.notification.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: limit,
    });

    return { notifications, total };
  }

  /**
   * Mark notification as read.
   */
  async markAsRead(notificationId: string): Promise<Notification> {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: 'READ',
        read_at: new Date(),
      },
    });
  }

  /**
   * Check for low-stock alerts.
   */
  async checkLowStockAlerts(): Promise<void> {
    const lowStockProducts = await this.prisma.product.findMany({
      where: {
        on_hand_qty: {
          lte: this.prisma.product.fields.reorder_point,
        },
        is_active: true,
      },
    });

    for (const product of lowStockProducts) {
      // Check if notification already exists (today)
      const existingNotif = await this.prisma.notification.findFirst({
        where: {
          notification_type: 'LOW_STOCK',
          reference_document: product.reference,
          created_at: {
            gte: new Date(new Date().toDateString()),
          },
        },
      });

      if (!existingNotif) {
        await this.publishNotification(
          this.prisma,
          `Low Stock: ${product.name}`,
          `Product ${product.reference} has dropped below reorder point (${product.on_hand_qty} / ${product.reorder_point} units)`,
          'LOW_STOCK',
          product.reference,
          'INVENTORY_MANAGER',
        );
      }
    }
  }
}
```

### 6.2 Dashboard Service

```typescript
// modules/dashboard/dashboard.service.ts

export class DashboardService extends BaseService {
  /**
   * Get the six mandatory KPI counters.
   */
  async getKpiCounters(): Promise<{
    total_so: number;
    confirmed_so: number;
    pending_deliveries: number;
    total_po: number;
    confirmed_po: number;
    pending_receipts: number;
    total_mo: number;
    confirmed_mo: number;
    in_progress_mo: number;
    delayed_orders: number;
    low_stock_products: number;
    total_revenue_mtd: Decimal;
  }> {
    const [soStatus, poStatus, moStatus] = await Promise.all([
      this.prisma.salesOrder.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.purchaseOrder.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.manufacturingOrder.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    const delayedOrders = await this.prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*) as count FROM delayed_orders
    `;

    const lowStockProducts = await this.prisma.product.count({
      where: {
        on_hand_qty: {
          lte: this.prisma.product.fields.reorder_point,
        },
      },
    });

    const totalRevenueMtd = await this.prisma.salesOrderItem.aggregate({
      where: {
        sales_order: {
          status: SalesOrderStatus.FULLY_DELIVERED,
          created_at: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      },
      _sum: {
        line_total: true,
      },
    });

    return {
      total_so: soStatus.reduce((s, g) => s + (g._count || 0), 0),
      confirmed_so: soStatus.find((g) => g.status === 'CONFIRMED')?._count || 0,
      pending_deliveries: soStatus.find((g) => g.status === 'PARTIALLY_DELIVERED')?._count || 0,
      total_po: poStatus.reduce((s, g) => s + (g._count || 0), 0),
      confirmed_po: poStatus.find((g) => g.status === 'CONFIRMED')?._count || 0,
      pending_receipts: poStatus.find((g) => g.status === 'PARTIALLY_RECEIVED')?._count || 0,
      total_mo: moStatus.reduce((s, g) => s + (g._count || 0), 0),
      confirmed_mo: moStatus.find((g) => g.status === 'CONFIRMED')?._count || 0,
      in_progress_mo: moStatus.find((g) => g.status === 'IN_PROGRESS')?._count || 0,
      delayed_orders: delayedOrders[0]?.count || 0,
      low_stock_products: lowStockProducts,
      total_revenue_mtd: totalRevenueMtd._sum.line_total || 0,
    };
  }

  /**
   * Get role-specific dashboard data.
   *
   * The shape and contents vary by role.
   */
  async getRoleSummary(userId: string, userRole: UserRole): Promise<Record<string, any>> {
    switch (userRole) {
      case 'ADMIN':
        return {
          audit_summary: await this.getAuditSummary(),
          active_users_by_role: await this.getActiveUsersByRole(),
          reconciliation_health: await this.getReconciliationHealth(),
        };

      case 'SALES_USER':
        return {
          total_sos: await this.prisma.salesOrder.count({
            where: { status: { not: 'CANCELLED' } },
          }),
          pending_deliveries: await this.prisma.salesOrder.count({
            where: { status: 'PARTIALLY_DELIVERED' },
          }),
          delayed_sos: await this.prisma.salesOrder.count({
            where: {
              status: { in: ['CONFIRMED', 'PARTIALLY_DELIVERED'] },
              promised_delivery_date: { lt: new Date() },
            },
          }),
        };

      case 'MANUFACTURING_USER':
        return {
          open_mos: await this.prisma.manufacturingOrder.count({
            where: { status: { in: ['CONFIRMED', 'IN_PROGRESS'] } },
          }),
          auto_created_mos: await this.prisma.manufacturingOrder.count({
            where: { is_auto_created: true, status: 'DRAFT' },
          }),
          work_in_progress: await this.prisma.manufacturingOrder.count({
            where: { status: 'IN_PROGRESS' },
          }),
        };

      // ... similar for other roles

      default:
        return {};
    }
  }

  private async getAuditSummary(): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const logs = await this.prisma.auditLog.groupBy({
      by: ['action_type'],
      where: {
        occurred_at: { gte: today },
      },
      _count: true,
    });

    return logs.reduce((acc, log) => {
      acc[log.action_type] = log._count;
      return acc;
    }, {});
  }

  private async getActiveUsersByRole(): Promise<Record<string, number>> {
    const users = await this.prisma.user.groupBy({
      by: ['role_id'],
      where: { is_active: true },
      _count: true,
    });

    return users.reduce((acc, u) => {
      acc[u.role_id] = u._count;
      return acc;
    }, {});
  }

  private async getReconciliationHealth(): Promise<{
    total_products: number;
    reconciled: number;
    mismatches: number;
  }> {
    const mismatches = await this.prisma.$queryRaw<any[]>`
      SELECT
        p.id
      FROM products p
      LEFT JOIN stock_movements sm ON p.id = sm.product_id
      GROUP BY p.id, p.on_hand_qty
      HAVING COALESCE(SUM(sm.signed_qty), 0) != p.on_hand_qty
    `;

    const total = await this.prisma.product.count();

    return {
      total_products: total,
      reconciled: total - mismatches.length,
      mismatches: mismatches.length,
    };
  }
}
```

---

## 7. DEVELOPMENT EXECUTION ORDER

### 7.1 Hour-by-Hour Breakdown

#### Hour 0–1: Infrastructure & Schema

- [ ] Create repo scaffold (Express, Prisma, TypeScript)
- [ ] Docker Compose setup (Postgres, Node service, volumes)
- [ ] Environment configuration (.env, Zod validation)
- [ ] Prisma schema creation (complete DDL from Section 2.2)
- [ ] Initial migration + DB views
- [ ] Logger setup (Winston/Pino)

**Checkpoint:** `docker-compose up` brings up Postgres + can run `npx prisma migrate dev`

#### Hour 1–2: Authentication

- [ ] JWT config (signing/verification)
- [ ] Auth middleware (token extraction, verification)
- [ ] RBAC middleware (fail-closed permission checks)
- [ ] `auth.service`: signup, login, password hashing
- [ ] `users.service`: role assignment (Admin only)
- [ ] Seed script: 6 roles + 5 demo users with different roles
- [ ] Auth routes: POST /auth/signup, POST /auth/login

**Checkpoint:** `POST /auth/signup` → `POST /auth/login` → JWT issued → logged in audit_logs

#### Hour 2–3: Products & Core Services

- [ ] `audit-log.service`: logging infrastructure
- [ ] `field-lock.service`: status-driven locking rules
- [ ] `inventory-ledger.service`: movement recording + caching
- [ ] `products.service` & routes (full CRUD + stock adjustment)
- [ ] Seed: 10 demo products (mix of MTS/MTO)
- [ ] Express app bootstrap with all middleware

**Checkpoint:** `GET /products` lists all, `POST /products` creates, `GET /products/:id/stock-card` shows movements

#### Hour 3–4: Inventory & Reservations

- [ ] `reservation-engine.service`: reserve/unreserve logic
- [ ] `inventory.service` & routes (ledger view, reconciliation)
- [ ] Seed: some manual stock movements to test ledger reconciliation

**Checkpoint:** `/inventory/reconcile` returns zero mismatches

#### Hour 4–5: Sales Orders

- [ ] `sales-orders.service`: full lifecycle (create, confirm, deliver, cancel)
- [ ] Sales order routes
- [ ] Integration with reservation engine on confirm
- [ ] Seed: 5 sample SOs in various statuses

**Checkpoint:** Confirm SO → reservations created; Deliver SO → movements recorded → stock decreases

#### Hour 5–6: Purchase Orders

- [ ] `purchase-orders.service`: full lifecycle (create, confirm, receive, cancel)
- [ ] Purchase order routes
- [ ] Integration with inventory ledger on receipt
- [ ] `vendors.service` & routes
- [ ] Seed: 5 sample POs

**Checkpoint:** Receive PO → stock movements recorded → on_hand_qty increases

#### Hour 6–8: Manufacturing (Most Complex)

- [ ] `bom.service` & routes (create, list, get with lines)
- [ ] `manufacturing-orders.service`: full lifecycle
- [ ] `work-orders.service`: tracking
- [ ] Component consumption + finished goods production (dual write in transaction)
- [ ] Seed: 3 BoMs, 3 MOs in various statuses

**Checkpoint:** Complete MO → components consumed, finished goods produced, stock updated correctly

#### Hour 8–9: Procurement Engine

- [ ] `procurement-engine.service`: shortfall detection + auto-PO/MO generation
- [ ] Wire into `sales-orders.confirm()`
- [ ] End-to-end test: confirm SO with shortfall → auto PO/MO created
- [ ] Audit logs on auto-creation

**Checkpoint:** SO confirm with shortfall → Draft PO/MO auto-created with `trigger_source_so_id` set

#### Hour 9–10: Dashboard & Notifications

- [ ] `dashboard.service`: KPI counters + role-specific widgets
- [ ] Dashboard routes
- [ ] `notifications.service`: pub/sub (in-DB, polled)
- [ ] Notification triggers (low-stock, PO received, MO completed)

**Checkpoint:** `GET /dashboard/counters` returns six KPIs in <500ms; `GET /notifications` returns unread

#### Hour 10–11: Audit Logs & Testing

- [ ] `audit-logs.service` & routes (get logs, filter by record/actor/date)
- [ ] Audit log UI support (pre-filtered views)
- [ ] Full integration test suite (demo scenario)
- [ ] Reconciliation check run

**Checkpoint:** All mutating operations logged; `GET /audit-logs?record_type=SalesOrder&record_id=X` shows full history

#### Hour 11–12: Polish & Demo

- [ ] End-to-end smoke test (from PRD demo scenario)
- [ ] Docker Compose final check
- [ ] Performance tuning (dashboard <500ms)
- [ ] Concurrency test (dual SO confirmations)
- [ ] Bug triage & fixes
- [ ] Code cleanup

---

## 8. API ENDPOINT REFERENCE

### 8.1 Authentication Endpoints

| Method | Path                    | Permission    | Purpose                                  |
| ------ | ----------------------- | ------------- | ---------------------------------------- |
| POST   | `/auth/signup`          | Public        | Register new user (gets UNASSIGNED role) |
| POST   | `/auth/login`           | Public        | Login → JWT issued                       |
| POST   | `/auth/change-password` | Authenticated | Change own password                      |
| PATCH  | `/users/:id`            | MANAGE_USERS  | Admin assigns role/position              |

### 8.2 Product Endpoints

| Method | Path                              | Permission       | Purpose                        |
| ------ | --------------------------------- | ---------------- | ------------------------------ |
| GET    | `/products`                       | VIEW_PRODUCT     | List all products              |
| POST   | `/products`                       | CREATE_PRODUCT   | Create product                 |
| GET    | `/products/:id`                   | VIEW_PRODUCT     | Get product detail + inventory |
| PATCH  | `/products/:id`                   | EDIT_PRODUCT     | Update product                 |
| POST   | `/products/:id/stock-adjustments` | ADJUST_INVENTORY | Manual stock in/out            |
| GET    | `/products/:id/stock-card`        | VIEW_INVENTORY   | Stock movement history         |
| GET    | `/products/:id/audit-logs`        | VIEW_AUDIT_LOGS  | Product audit trail            |

### 8.3 Sales Order Endpoints

| Method | Path                           | Permission          | Purpose                                                     |
| ------ | ------------------------------ | ------------------- | ----------------------------------------------------------- |
| GET    | `/sales-orders`                | VIEW_SALES_ORDER    | List SOs (filter by status)                                 |
| POST   | `/sales-orders`                | CREATE_SALES_ORDER  | Create SO in DRAFT                                          |
| GET    | `/sales-orders/:id`            | VIEW_SALES_ORDER    | Get SO detail + items + movements                           |
| PATCH  | `/sales-orders/:id/confirm`    | CONFIRM_SALES_ORDER | DRAFT → CONFIRMED (triggers reservation + procurement)      |
| PATCH  | `/sales-orders/:id/deliver`    | DELIVER_SALES_ORDER | Record delivery (moves items from Confirmed → Partial/Full) |
| PATCH  | `/sales-orders/:id/cancel`     | CANCEL_SALES_ORDER  | DRAFT → CANCELLED                                           |
| GET    | `/sales-orders/:id/audit-logs` | VIEW_AUDIT_LOGS     | SO audit trail                                              |

### 8.4 Purchase Order Endpoints

| Method | Path                           | Permission             | Purpose                          |
| ------ | ------------------------------ | ---------------------- | -------------------------------- |
| GET    | `/purchase-orders`             | VIEW_PURCHASE_ORDER    | List POs                         |
| POST   | `/purchase-orders`             | CREATE_PURCHASE_ORDER  | Create PO in DRAFT               |
| GET    | `/purchase-orders/:id`         | VIEW_PURCHASE_ORDER    | Get PO detail                    |
| PATCH  | `/purchase-orders/:id/confirm` | CONFIRM_PURCHASE_ORDER | DRAFT → CONFIRMED                |
| PATCH  | `/purchase-orders/:id/receive` | RECEIVE_PURCHASE_ORDER | Record receipt (increases stock) |
| PATCH  | `/purchase-orders/:id/cancel`  | CANCEL_PURCHASE_ORDER  | DRAFT → CANCELLED                |

### 8.5 Manufacturing Order Endpoints

| Method | Path                                 | Permission                   | Purpose                                                              |
| ------ | ------------------------------------ | ---------------------------- | -------------------------------------------------------------------- |
| GET    | `/manufacturing-orders`              | VIEW_MANUFACTURING_ORDER     | List MOs                                                             |
| POST   | `/manufacturing-orders`              | CREATE_MANUFACTURING_ORDER   | Create MO in DRAFT (auto-copy BoM lines)                             |
| GET    | `/manufacturing-orders/:id`          | VIEW_MANUFACTURING_ORDER     | Get MO detail + work orders                                          |
| PATCH  | `/manufacturing-orders/:id/confirm`  | CONFIRM_MANUFACTURING_ORDER  | DRAFT → CONFIRMED                                                    |
| PATCH  | `/manufacturing-orders/:id/start`    | START_MANUFACTURING_ORDER    | CONFIRMED → IN_PROGRESS                                              |
| PATCH  | `/manufacturing-orders/:id/complete` | COMPLETE_MANUFACTURING_ORDER | IN_PROGRESS → COMPLETED (consume components, produce finished goods) |
| PATCH  | `/manufacturing-orders/:id/cancel`   | CANCEL_MANUFACTURING_ORDER   | DRAFT → CANCELLED                                                    |

### 8.6 BoM Endpoints

| Method | Path             | Permission | Purpose                        |
| ------ | ---------------- | ---------- | ------------------------------ |
| GET    | `/bom`           | VIEW_BOM   | List BoMs                      |
| POST   | `/bom`           | CREATE_BOM | Create BoM for a finished good |
| GET    | `/bom/:id`       | VIEW_BOM   | Get BoM + component lines      |
| PATCH  | `/bom/:id`       | EDIT_BOM   | Update BoM                     |
| POST   | `/bom/:id/lines` | EDIT_BOM   | Add/remove BoM lines           |

### 8.7 Inventory Endpoints

| Method | Path                   | Permission     | Purpose                                           |
| ------ | ---------------------- | -------------- | ------------------------------------------------- |
| GET    | `/inventory/summary`   | VIEW_INVENTORY | All products + on-hand/reserved/free-to-use       |
| GET    | `/inventory/low-stock` | VIEW_INVENTORY | Products below reorder point                      |
| GET    | `/inventory/reconcile` | VIEW_INVENTORY | Check for any mismatches (should be empty)        |
| GET    | `/inventory/movements` | VIEW_INVENTORY | Stock movement ledger (filterable by date/source) |

### 8.8 Dashboard Endpoints

| Method | Path                       | Permission              | Purpose               |
| ------ | -------------------------- | ----------------------- | --------------------- |
| GET    | `/dashboard/counters`      | VIEW_DASHBOARD          | Six KPI counters      |
| GET    | `/dashboard/role-summary`  | VIEW_DASHBOARD          | Role-specific widgets |
| GET    | `/dashboard/audit-summary` | VIEW_AUDIT_LOGS (Admin) | Audit stats           |

### 8.9 Audit Log Endpoints

| Method | Path                                  | Permission      | Purpose                                        |
| ------ | ------------------------------------- | --------------- | ---------------------------------------------- |
| GET    | `/audit-logs`                         | VIEW_AUDIT_LOGS | List logs (filter by record/actor/date/action) |
| GET    | `/audit-logs/:record_type/:record_id` | VIEW_AUDIT_LOGS | All logs for a specific record                 |
| GET    | `/audit-logs/actor/:user_id`          | VIEW_AUDIT_LOGS | All actions by a user                          |

### 8.10 Notification Endpoints

| Method | Path                      | Permission    | Purpose                   |
| ------ | ------------------------- | ------------- | ------------------------- |
| GET    | `/notifications`          | Authenticated | Get unread notifications  |
| PATCH  | `/notifications/:id/read` | Authenticated | Mark notification as read |
| DELETE | `/notifications/:id`      | Authenticated | Dismiss notification      |

---

## 9. DATABASE TRANSACTIONS & CONCURRENCY

### 9.1 Transaction Pattern (Prisma)

Every service method that mutates multiple tables must use Prisma's `$transaction()`:

```typescript
const result = await prisma.$transaction(async (tx) => {
  // All writes happen inside here
  const so = await tx.salesOrder.update(/* ... */);
  const mov = await tx.stockMovement.create(/* ... */);
  const audit = await tx.auditLog.create(/* ... */);

  // All succeed or all fail together
  return so;
});
```

### 9.2 Row-Level Locking (SELECT FOR UPDATE)

Before any stock-affecting operation, lock the product row:

```typescript
const product = await tx.$queryRaw`
  SELECT * FROM products WHERE id = ${product_id} FOR UPDATE
`;

// Now no other transaction can modify this row until this transaction commits
// Other transactions will wait
```

### 9.3 Concurrency Scenario: Dual SO Confirmations

**Scenario:** Two users confirm sales orders for the same product at the same time. Product has 100 units free. First SO wants 60, second wants 60.

**Expected result:** First succeeds (reservation of 60), second waits, detects shortage (60 > 40 remaining), auto-creates replenishment order.

**Implementation:**

1. Both transactions lock the product row with `FOR UPDATE`
2. First transaction commits, reducing free-to-use to 40
3. Second transaction proceeds (waiting finished), now sees 40 free, shortfall of 20, creates auto-PO
4. Both transactions complete successfully

---

## 10. TESTING CHECKPOINTS

### 10.1 Unit Test Examples

```typescript
// modules/products/__tests__/products.service.test.ts

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: PrismaClient;

  beforeEach(() => {
    prisma = new PrismaClient();
    service = new ProductsService(prisma, auditService, fieldLockService, repo);
  });

  describe('createProduct', () => {
    it('should create a product with procure_on_demand=false', async () => {
      const result = await service.createProduct('user-1', {
        name: 'Table',
        sales_price: 5000,
        cost_price: 3000,
        procure_on_demand: false,
      });

      expect(result.reference).toMatch(/^PROD-/);
      expect(result.on_hand_qty).toBe(0);
      expect(result.procure_on_demand).toBe(false);
    });

    it('should require procurement_type when procure_on_demand=true', async () => {
      await expect(
        service.createProduct('user-1', {
          name: 'Chair',
          sales_price: 2000,
          cost_price: 1000,
          procure_on_demand: true,
          // procurement_type missing
        }),
      ).rejects.toThrow('procurement_type is mandatory');
    });

    it('should require vendor when procurement_type=PURCHASE', async () => {
      await expect(
        service.createProduct('user-1', {
          name: 'Wood',
          sales_price: 100,
          cost_price: 50,
          procure_on_demand: true,
          procurement_type: 'PURCHASE',
          // default_vendor_id missing
        }),
      ).rejects.toThrow('default_vendor_id is mandatory');
    });
  });

  describe('adjustStock', () => {
    it('should increase on_hand_qty for IN adjustment', async () => {
      const product = await prisma.product.create({
        data: {
          reference: 'PROD-TEST',
          name: 'Test Product',
          sales_price: 100,
          cost_price: 50,
        },
      });

      await service.adjustStock('user-1', product.id, 'IN', 50, 'Initial stock');

      const updated = await prisma.product.findUnique({
        where: { id: product.id },
      });

      expect(updated!.on_hand_qty).toBe(50);
    });

    it('should fail for OUT adjustment exceeding current stock', async () => {
      const product = await prisma.product.create({
        data: {
          reference: 'PROD-TEST-2',
          name: 'Test Product 2',
          sales_price: 100,
          cost_price: 50,
          on_hand_qty: 10,
        },
      });

      await expect(
        service.adjustStock('user-1', product.id, 'OUT', 20, 'Too much'),
      ).rejects.toThrow('Cannot adjust out');
    });
  });
});
```

### 10.2 Integration Test: Full Demo Scenario

```typescript
// __tests__/demo-scenario.integration.test.ts

describe('End-to-End Demo Scenario', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    // Seed database with demo data
    await seedDemoData();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should complete full SO → shortage → auto-PO → receipt → delivery flow', async () => {
    // 1. Create product configured for on-demand purchase
    const product = await prisma.product.create({
      data: {
        reference: 'TABLE-PRO',
        name: 'Professional Table',
        sales_price: 10000,
        cost_price: 6000,
        procure_on_demand: true,
        procurement_type: 'PURCHASE',
        default_vendor_id: vendorId,
        on_hand_qty: 5,
      },
    });

    // 2. Create customer and SO with ordered qty exceeding stock
    const customer = await prisma.customer.create({
      data: { reference: 'CUST-001', name: 'Acme Corp' },
    });

    const soService = new SalesOrdersService(/* ... */);
    const so = await soService.createSalesOrder('sales-user-1', {
      customer_id: customer.id,
      customer_address: '123 Main St',
      sales_person_id: 'sales-user-1',
      items: [{ product_id: product.id, ordered_qty: 20 }],
    });

    expect(so.status).toBe(SalesOrderStatus.DRAFT);

    // 3. Confirm SO → should auto-create Draft PO for shortfall (20 - 5 = 15)
    const confirmed = await soService.confirmSalesOrder(so.id, 'sales-user-1' /* deps */);

    expect(confirmed.status).toBe(SalesOrderStatus.CONFIRMED);

    // Check auto-created PO
    const autoPO = await prisma.purchaseOrder.findFirst({
      where: { trigger_source_so_id: so.id },
    });

    expect(autoPO).toBeTruthy();
    expect(autoPO!.is_auto_created).toBe(true);
    expect(autoPO!.items[0].ordered_qty).toBe(15);

    // 4. Confirm the auto-PO
    const poService = new PurchaseOrdersService(/* ... */);
    const confirmedPO = await poService.confirmPurchaseOrder(autoPO!.id, 'purchase-user-1');

    expect(confirmedPO.status).toBe(PurchaseOrderStatus.CONFIRMED);

    // 5. Receive the PO → stock increases
    const receivedPO = await poService.receivePurchaseOrder('purchase-user-1', autoPO!.id, [
      { item_id: autoPO!.items[0].id, received_qty: 15 },
    ]);

    expect(receivedPO.status).toBe(PurchaseOrderStatus.FULLY_RECEIVED);

    // Check product stock: was 5, received 15, now 20
    const updatedProduct = await prisma.product.findUnique({
      where: { id: product.id },
    });
    expect(updatedProduct!.on_hand_qty).toBe(20);

    // 6. Deliver the SO → stock decreases by 20
    const deliveredSO = await soService.deliverSalesOrder('sales-user-1', so.id, [
      { sales_order_item_id: so.items[0].id, delivered_qty: 20 },
    ]);

    expect(deliveredSO.status).toBe(SalesOrderStatus.FULLY_DELIVERED);

    // Final stock: 20 - 20 = 0
    const finalProduct = await prisma.product.findUnique({
      where: { id: product.id },
    });
    expect(finalProduct!.on_hand_qty).toBe(0);

    // 7. Verify audit trail
    const logs = await prisma.auditLog.findMany({
      where: { record_id: so.id },
    });

    expect(logs.length).toBeGreaterThan(0);
    expect(logs.some((l) => l.action_type === 'CREATE')).toBe(true);
    expect(logs.some((l) => l.action_type === 'CONFIRM')).toBe(true);
    expect(logs.some((l) => l.action_type === 'DELIVER')).toBe(true);

    // 8. Verify inventory reconciliation
    const mismatches = await prisma.$queryRaw<any[]>`
      SELECT p.id
      FROM products p
      LEFT JOIN stock_movements sm ON p.id = sm.product_id
      GROUP BY p.id, p.on_hand_qty
      HAVING COALESCE(SUM(sm.signed_qty), 0) != p.on_hand_qty
    `;

    expect(mismatches.filter((m) => m.id === product.id)).toHaveLength(0);
  });
});
```

### 10.3 Load Testing

```bash
# Test concurrent SO confirmations (benchmark 10 simultaneous requests)
artillery quick -c 10 -n 100 \
  POST /sales-orders/:id/confirm \
  --var=access_token=<JWT>
```

---

## 11. DEPLOYMENT & DOCKER CONFIGURATION

### 11.1 Docker Compose

```yaml
# docker-compose.yml

version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: erp-postgres
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${DB_USER} -d ${DB_NAME}']
      interval: 5s
      timeout: 5s
      retries: 5

  api:
    build: ./apps/api
    container_name: erp-api
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      JWT_SECRET: ${JWT_SECRET}
      PORT: 3000
    ports:
      - '3000:3000'
    depends_on:
      postgres:
        condition: service_healthy
    command: >
      sh -c "npx prisma migrate deploy &&
             npx prisma db seed &&
             node dist/server.js"
    volumes:
      - ./apps/api/dist:/app/dist
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3000/health']
      interval: 10s
      timeout: 5s
      retries: 3

  web:
    build: ./apps/web
    container_name: erp-web
    environment:
      REACT_APP_API_URL: http://api:3000
    ports:
      - '3001:3000'
    depends_on:
      - api
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3000']
      interval: 10s
      timeout: 5s
      retries: 3

volumes:
  postgres_data:

networks:
  default:
    name: erp-network
```

### 11.2 Dockerfile (Backend)

```dockerfile
# apps/api/Dockerfile

FROM node:20-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["node", "dist/server.js"]
```

### 11.3 Environment Configuration

```bash
# .env.example

# Database
DATABASE_URL=postgresql://erp_user:secure_password@localhost:5432/erp_db
DB_USER=erp_user
DB_PASSWORD=secure_password
DB_NAME=erp_db

# JWT
JWT_SECRET=your-secret-key-min-32-chars-long

# Server
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000

# Frontend
REACT_APP_API_URL=http://localhost:3000

# Logging
LOG_LEVEL=info

# Pagination
DEFAULT_PAGE_SIZE=50
MAX_PAGE_SIZE=500
```

### 11.4 Startup Sequence

```bash
# Single command to bring up entire system
docker-compose up --build

# This will:
# 1. Start Postgres (wait for health check)
# 2. Build API image
# 3. Build Web image
# 4. Run Prisma migrations (first time)
# 5. Seed demo data (first time)
# 6. Start API server
# 7. Start Web frontend
# All with health checks ensuring dependencies are ready
```

---

## 12. CODEX PROMPTS FOR AI ASSISTANCE

### 12.1 Sales Order Confirm (Complex Transaction)

```
You are generating backend code for an ERP system. The Sales Order confirm operation must:

1. Accept a confirmed status change request
2. Inside a Prisma transaction:
   a. Lock each product row with SELECT FOR UPDATE
   b. Create reservations for each item's ordered quantity
   c. Call the procurement engine to evaluate shortfalls
   d. Update the sales order status to CONFIRMED
   e. Write audit logs for the status change
3. After transaction commits, return the confirmed order

Key constraints:
- Reservation = commitment, not capped by available stock
- Shortfall = max(0, ordered_qty - free_to_use_qty)
- Free-to-use = on_hand - SUM(reserved from other confirmed SOs)
- Procurement decision is rules-based (not AI):
  * If procure_on_demand=true and procurement_type='PURCHASE', auto-create Draft PO
  * If procurement_type='MANUFACTURING', auto-create Draft MO
  * Link back to this SO via trigger_source_so_id
- All changes must be atomic (succeed together or fail together)
- Write one audit log per mutated table/field

Generate the complete service method `confirmSalesOrder` for the SalesOrdersService class.
Include error handling, logging, and inline comments.
```

### 12.2 Manufacturing Order Completion (Multi-Table Writes)

```
Generate the backend code for completing a Manufacturing Order. The completion must:

1. Accept the manufacturing order ID
2. Inside a transaction:
   a. For each component (ManufacturingOrderItem):
      - Record a stock movement (source: MO_CONSUMPTION)
      - Update consumed_qty
   b. For the finished good (Product matching MO's finished_good_id):
      - Record a stock movement (source: MO_PRODUCTION)
   c. Update all three cached on_hand_qty values atomically
   d. Update the MO status to COMPLETED
   e. Write audit logs
3. Release any reservations from the triggering SO (if this MO was auto-created)

Key constraints:
- Consumption qty = required_qty × quantity_to_produce (from BoM)
- Production qty = quantity_to_produce
- If component stock goes negative, reject the operation
- Log each stock movement with appropriate reference documents
- Preserve traceability: stock movements link back to the MO via triggering_manufacturing_order_id

Generate the service method `completeManufa cturingOrder` for ManufacturingOrdersService.
```

### 12.3 RBAC Middleware

```
Generate a fail-closed RBAC middleware for Express that:

1. Extracts JWT from Authorization header
2. On mutating requests (POST, PATCH, PUT, DELETE):
   - Re-checks permissions against the live DB (role_permissions table)
   - Protects against mid-session role changes
3. On read-only requests (GET):
   - Uses embedded JWT claims for speed
4. Returns 403 Forbidden if permission is missing
5. Logs all permission checks to audit_logs with action_type='PERMISSION_CHECK'

The middleware should:
- Fail closed (reject by default unless explicitly allowed)
- Not cache DB lookups (always check on mutating requests)
- Distinguish between missing permission (403) and unauthenticated (401)
- Accept an array of required permissions: requirePermission(['CREATE_SALES_ORDER', 'EDIT_SALES_ORDER'])

Generate the middleware function and integration example.
```

---

## CONCLUSION

This Backend Engineering Master Execution Document provides:

1. **Complete folder and file structure** ready for scaffolding
2. **Full Prisma schema** with constraints, indexes, and views
3. **Service layer patterns** for all core operations
4. **Transaction-safe implementations** using row-level locking
5. **Audit trail mechanism** (dual-write pattern)
6. **RBAC enforcement** (fail-closed, server-side)
7. **Hour-by-hour execution roadmap** for 12-hour hackathon
8. **API endpoint reference** with all REST operations
9. **Testing checkpoints** to verify implementation
10. **Docker setup** for one-command deployment
11. **Codex prompts** for AI pair programming

**Critical design principles maintained throughout:**

- Inventory is a ledger (movements are source of truth, on_hand_qty is cached)
- Every mutation is dual-written (operational table + audit log, same transaction)
- Status-driven field locking (enforced server-side, not just hidden in UI)
- Concurrency safety (row-level locks prevent race conditions)
- RBAC is fail-closed (missing permission = 403, not 200)
- Procurement is deterministic (rules-based, not AI-driven, fully auditable)

Estimated implementation time: **11–12 hours** for P0 completeness (full demo scenario working end-to-end).

---

**Version:** 1.0 | **Last Updated:** 2026-06-20 | **Status:** Ready for Execution
