# HIGH PRIORITY REMAINING WORK

## Current Completion

Overall backend implementation is approximately **42% complete**.

Strongest implemented areas:

- Prisma schema for the main ERP domains.
- JWT login/register foundation.
- Basic RBAC middleware.
- Core stock movement ledger.
- Sales confirmation with reservation and simple MTO/MTS auto creation.
- Purchase receipt and manufacturing completion stock movements.
- Demo seed data.

Highest-risk missing areas:

- No tests.
- No Swagger/OpenAPI.
- No dashboard APIs.
- No traceability API.
- No Prisma migrations.
- No row-level locking for inventory correctness.
- No full per-field audit logging.
- No specified module/controller/repository architecture.

## Next 4 Hours: Hackathon Score Maximizer

### 1. Build dashboard APIs

File path:

- `src/modules/dashboard/dashboard.routes.ts`
- `src/modules/dashboard/dashboard.service.ts`
- Temporary acceptable path if avoiding refactor: `src/server.ts`

Priority: Critical

Estimated implementation time: 60-90 minutes

Dependency: Existing Prisma schema and order status fields

Why it matters: PRD and web flow explicitly expect dashboard counters and role summaries. This is highly visible in demos and currently 0% implemented.

### 2. Build traceability endpoint

File path:

- `src/modules/traceability/traceability.routes.ts`
- `src/modules/traceability/traceability.service.ts`
- Temporary acceptable path if avoiding refactor: `src/server.ts`

Priority: Critical

Estimated implementation time: 60-90 minutes

Dependency: `triggerSourceSoId` relations already present on purchase orders and manufacturing orders

Why it matters: Traceability is one of the “innovative” features and can be implemented mostly as read queries over existing relationships.

### 3. Add Swagger/OpenAPI for existing endpoints

File path:

- `src/swagger.ts`
- `src/openapi.yaml`
- `src/server.ts`

Priority: Critical

Estimated implementation time: 60-90 minutes

Dependency: Current endpoint list in `src/server.ts`

Why it matters: Swagger coverage is 0%. A visible API document makes the backend look substantially more complete without changing business logic.

### 4. Add inventory reconciliation endpoint

File path:

- `src/modules/inventory/inventory.routes.ts`
- `src/modules/inventory/inventory.service.ts`
- Temporary acceptable path if avoiding refactor: `src/server.ts`

Priority: High

Estimated implementation time: 45-60 minutes

Dependency: `products.onHandQty` and `stock_movements.signedQty`

Why it matters: Inventory-as-ledger is the core architecture promise. A reconciliation endpoint proves ledger integrity to judges.

### 5. Add one full demand-to-delivery integration test or executable verification script

File path:

- `src/__tests__/demand-to-delivery.integration.test.ts`
- Alternative: `scripts/demo-api.ts`

Priority: Critical

Estimated implementation time: 90-120 minutes

Dependency: Running API and seeded database

Why it matters: Testing is effectively 0%. One end-to-end proof covering SO confirmation, auto procurement, receipt/MO completion, delivery, and stock movement gives the biggest quality signal.

## Do Not Prioritize First

These are important but lower scoring within the next 4 hours:

- Full architectural refactor into `src/modules/**`
- Complete repository layer
- Full role-management UI support
- Perfect per-field audit on every endpoint
- Work-order execution depth
- Refresh-token persistence
- Notification fanout polish

## Recommended 4-Hour Build Order

1. Dashboard counters and role-summary.
2. Traceability endpoint.
3. Inventory reconciliation endpoint.
4. Swagger/OpenAPI page.
5. One full demo verification script/test.

This order maximizes visible feature completion, maps directly to PRD/TRD acceptance criteria, and avoids spending the limited window on a large architecture refactor that judges may not see.
