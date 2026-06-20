# MISSING COMPONENTS

## Critical Architecture Components

| Component                        | File Path                                          | Priority | Estimated Time | Dependency                                |
| -------------------------------- | -------------------------------------------------- | -------: | -------------: | ----------------------------------------- |
| Vertical module folder structure | `src/modules/**`                                   |     High |           2-3h | Existing `src/server.ts` route extraction |
| Controllers per module           | `src/modules/*/*.controller.ts`                    |     High |           3-4h | Module folder structure                   |
| Repositories per module          | `src/modules/*/*.repository.ts`                    |   Medium |           3-5h | Prisma schema stability                   |
| Route files per module           | `src/modules/*/*.routes.ts`                        |     High |           2-3h | Controllers and middleware                |
| Zod DTO/schema files             | `src/modules/*/*.schema.ts` or `src/types/dtos.ts` |     High |           2-3h | Endpoint contracts                        |
| Shared validation middleware     | `src/middleware/validate.middleware.ts`            |     High |            45m | Zod schemas                               |
| Base service pattern             | `src/services/base.service.ts`                     |   Medium |           1-2h | Audit and field-lock services             |
| Field lock service               | `src/services/field-lock.service.ts`               |     High |         1.5-2h | Status lifecycle rules                    |
| Prisma migrations                | `prisma/migrations/**/migration.sql`               |     High |         30-60m | Stable schema and database access         |
| Environment validation           | `src/config/env.ts`                                |     High |            45m | Startup path                              |

## Auth, Users, RBAC

| Component                         | File Path                                                  | Priority | Estimated Time | Dependency             |
| --------------------------------- | ---------------------------------------------------------- | -------: | -------------: | ---------------------- |
| Auth module                       | `src/modules/auth/*`                                       |     High |         1.5-2h | Existing auth routes   |
| User module                       | `src/modules/users/*`                                      |     High |           2-3h | RBAC permissions       |
| Role assignment endpoint          | `src/modules/users/users.routes.ts`                        |     High |             1h | User service           |
| Role management endpoints         | `src/modules/roles/*`                                      |   Medium |             2h | Role/permission schema |
| Refresh token/session persistence | `prisma/schema.prisma`, `src/modules/auth/auth.service.ts` |   Medium |             2h | Auth module            |
| Admin-only position update logic  | `src/modules/users/users.service.ts`                       |     High |             1h | User module            |

## Products, Customers, Vendors

| Component                                  | File Path                                  | Priority | Estimated Time | Dependency        |
| ------------------------------------------ | ------------------------------------------ | -------: | -------------: | ----------------- |
| Product detail API                         | `src/modules/products/products.routes.ts`  |     High |            30m | Product module    |
| Product stock-card API                     | `src/modules/products/products.service.ts` |     High |             1h | Stock movements   |
| Product delete/deactivate API              | `src/modules/products/products.service.ts` |   Medium |             1h | Field locks/audit |
| Customer detail/delete APIs                | `src/modules/customers/*`                  |   Medium |           1-2h | Customer module   |
| Vendor detail/delete APIs                  | `src/modules/vendors/*`                    |   Medium |           1-2h | Vendor module     |
| Full product/customer/vendor audit logging | `src/modules/*/*.service.ts`               |     High |             2h | Audit service     |

## Sales, Purchase, Manufacturing, BoM

| Component                              | File Path                                                          | Priority | Estimated Time | Dependency                  |
| -------------------------------------- | ------------------------------------------------------------------ | -------: | -------------: | --------------------------- |
| Sales cancel endpoint                  | `src/modules/sales-orders/sales-orders.service.ts`                 |     High |             1h | Reservation release         |
| Sales update endpoint with field locks | `src/modules/sales-orders/sales-orders.service.ts`                 |   Medium |           1.5h | Field lock service          |
| Purchase detail endpoint               | `src/modules/purchase-orders/purchase-orders.routes.ts`            |     High |            30m | Purchase routes             |
| Purchase cancel endpoint               | `src/modules/purchase-orders/purchase-orders.service.ts`           |     High |             1h | Status rules                |
| Manufacturing detail endpoint          | `src/modules/manufacturing-orders/manufacturing-orders.routes.ts`  |     High |            30m | Manufacturing routes        |
| Manufacturing cancel endpoint          | `src/modules/manufacturing-orders/manufacturing-orders.service.ts` |     High |             1h | Reservation release         |
| Work-order execution APIs              | `src/modules/manufacturing-orders/work-orders.service.ts`          |   Medium |           2-3h | Work-order schema additions |
| BoM update/delete endpoints            | `src/modules/bom/bom.service.ts`                                   |     High |         1.5-2h | BoM field locks/audit       |
| BoM detail endpoint                    | `src/modules/bom/bom.routes.ts`                                    |   Medium |            30m | BoM routes                  |

## Inventory And Procurement

| Component                             | File Path                                               | Priority | Estimated Time | Dependency                 |
| ------------------------------------- | ------------------------------------------------------- | -------: | -------------: | -------------------------- |
| Dedicated reservation engine          | `src/modules/inventory/reservation-engine.service.ts`   |     High |             2h | Existing reservation table |
| `reserveStock()`                      | `src/modules/inventory/inventory.service.ts`            |     High |            45m | Reservation engine         |
| `releaseStock()`                      | `src/modules/inventory/inventory.service.ts`            |     High |            45m | Reservation engine         |
| `consumeStock()`                      | `src/modules/inventory/inventory.service.ts`            |     High |            45m | Stock ledger               |
| `receiveStock()`                      | `src/modules/inventory/inventory.service.ts`            |   Medium |            30m | Stock ledger               |
| `produceStock()`                      | `src/modules/inventory/inventory.service.ts`            |   Medium |            30m | Stock ledger               |
| `calculateAvailableStock()` named API | `src/modules/inventory/inventory.service.ts`            |   Medium |            30m | Existing `balances()`      |
| Row-level locking                     | `src/modules/inventory/inventory.repository.ts`         | Critical |           1-2h | PostgreSQL connection      |
| Inventory reconciliation endpoint     | `src/modules/inventory/inventory.routes.ts`             |     High |             1h | Ledger query               |
| Procurement engine service            | `src/modules/procurement/procurement-engine.service.ts` |     High |           2-3h | Product/BOM/vendor data    |
| Strategic procurement recommendations | `src/modules/procurement/procurement.routes.ts`         |   Medium |             2h | Procurement engine         |
| MTS reorder-point planning            | `src/modules/procurement/procurement-engine.service.ts` |   Medium |           1.5h | Reorder fields             |

## Audit, Notifications, Dashboard, Traceability

| Component                         | File Path                                            | Priority | Estimated Time | Dependency           |
| --------------------------------- | ---------------------------------------------------- | -------: | -------------: | -------------------- |
| Audit log service                 | `src/modules/audit-logs/audit-logs.service.ts`       |     High |           1.5h | Base service         |
| Per-field audit for all mutations | `src/modules/*/*.service.ts`                         |     High |           3-4h | Audit service        |
| Audit filters and counters        | `src/modules/audit-logs/audit-logs.routes.ts`        |     High |             1h | Audit indexes        |
| Notification service              | `src/modules/notifications/notifications.service.ts` |   Medium |           1.5h | Notification table   |
| Low-stock notification trigger    | `src/modules/inventory/inventory.service.ts`         |   Medium |             1h | Notification service |
| PO/MO/SO event notifications      | `src/modules/*/*.service.ts`                         |   Medium |           1-2h | Notification service |
| Dashboard counters endpoint       | `src/modules/dashboard/dashboard.routes.ts`          | Critical |             1h | Aggregate queries    |
| Dashboard role-summary endpoint   | `src/modules/dashboard/dashboard.service.ts`         | Critical |           1.5h | RBAC/user roles      |
| Dashboard database view           | `prisma/migrations/**/migration.sql`                 |     High |             1h | Migration setup      |
| Traceability endpoint             | `src/modules/traceability/traceability.routes.ts`    | Critical |           1.5h | Trigger SO relations |

## API Documentation And Tests

| Component                  | File Path                                                                             | Priority | Estimated Time | Dependency          |
| -------------------------- | ------------------------------------------------------------------------------------- | -------: | -------------: | ------------------- |
| Swagger setup              | `src/swagger.ts`                                                                      | Critical |             1h | Existing route list |
| Swagger route              | `src/server.ts` or `src/app.ts`                                                       | Critical |            30m | Swagger setup       |
| Endpoint annotations/spec  | `src/modules/**/*.routes.ts` or `src/openapi.yaml`                                    |     High |           2-3h | Final endpoint list |
| Unit test framework setup  | `package.json`, `vitest.config.ts`                                                    |     High |            45m | Dev dependencies    |
| Product service tests      | `src/modules/products/__tests__/products.service.test.ts`                             |   Medium |             1h | Product service     |
| Inventory tests            | `src/modules/inventory/__tests__/inventory.service.test.ts`                           | Critical |           1.5h | Inventory service   |
| Sales flow tests           | `src/modules/sales-orders/__tests__/sales-orders.integration.test.ts`                 | Critical |             2h | Test database       |
| Purchase flow tests        | `src/modules/purchase-orders/__tests__/purchase-orders.integration.test.ts`           |     High |           1.5h | Test database       |
| Manufacturing tests        | `src/modules/manufacturing-orders/__tests__/manufacturing-orders.integration.test.ts` |     High |             2h | Test database       |
| Full demo integration test | `src/__tests__/demand-to-delivery.integration.test.ts`                                | Critical |             2h | Seed/test database  |
