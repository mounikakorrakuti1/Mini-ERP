# Mini ERP Implementation Gap Report

**Assessment date:** 2026-06-20  
**Scope:** Current repository state, including uncommitted user changes  
**Baseline documents:** `docs/FINAL_PRD.md`, `docs/FINAL_TRD.md`, `docs/FINAL_WEBAPPFLOW.md`, and `docs/integration_status.md`

## 1. Executive Summary

The repository contains a substantial prototype: JWT login, database-backed masters and orders, a stock movement ledger, transactional receipt/delivery/completion paths, RBAC middleware, audit rows, traceability, and several connected React screens. Both TypeScript projects currently type-check and the frontend production bundle builds.

It is not yet a conforming or reliably end-to-end Mini ERP implementation. The most serious blockers are:

1. The frontend and backend product contracts are incompatible. Product create sends fields Prisma rejects (`code`, `category`), while product list and order forms assume those missing fields always exist. Core catalog and order workflows can fail at runtime.
2. Sales reservation and shortage behavior contradicts the canonical PRD. Only available stock is reserved; a shortage with procurement disabled aborts confirmation instead of confirming with an availability flag.
3. Multiple generic update endpoints permit mass assignment and bypass status locking. Inventory can be changed directly through product update, and statuses or immutable fields can be altered without their workflow services.
4. Cancellation rules differ from the PRD: confirmed sales and purchase orders can be cancelled, while in-progress manufacturing orders cannot.
5. Manufacturing execution is incomplete. There is no API/UI to record component consumption or actual operation duration before completion, and completion silently substitutes required quantity when consumed quantity is zero.
6. The audit implementation is selective rather than complete and field-level. Several creates log only one field, BoM update logs a no-op `id` change, and user role edits are not represented per changed field.
7. Four backend integration tests are the entire automated suite. There are no frontend, unit, authorization, concurrency, audit-completeness, or manufacturing completion tests. One test codifies behavior opposite to its own name and the PRD.
8. Deployment is incomplete: Compose contains PostgreSQL and the API only, there are no Prisma migrations, and the example database port differs from Compose.

The claim in `docs/integration_status.md` that the application is a “fully functional End-to-End ERP core” is therefore not supported by the current code.

## 2. Repository and Architecture

### Backend

- Stack: Express 5, TypeScript, Prisma/PostgreSQL, JWT, bcrypt, Zod, Socket.IO.
- Entry point and most HTTP behavior live in `backend/src/server.ts` (about 880 lines).
- Domain logic is split mainly across `orders.service.ts`, `inventory.service.ts`, `dashboard.service.ts`, and notification/realtime services.
- Prisma is accessed directly from routes as well as services. The controller/service/repository/module separation specified by the TRD is not present.
- Transaction boundaries exist for important inventory mutations. Product row locks are used in reservation and stock movement paths.
- Request validation is inconsistent: auth, order creation, delivery/receipt, and adjustment use Zod; products, BoMs, MO create/update, generic masters, and most patch endpoints accept unbounded bodies.
- OpenAPI is a hand-maintained partial description and omits several implemented routes and request/response schemas.

### Frontend

- Stack: React 19, React Router, TypeScript, Vite, Axios, global CSS.
- Pages are organized by feature, with route guards and a shared application shell.
- Authentication, theme, and shared database data use React Context. There is no server-state/query library, cache invalidation model, or generated/shared API contract.
- `DbProvider` eagerly fetches inventory, movements, vendors, BoMs, and customers for every authenticated user. A user lacking any one permission causes the whole `Promise.all` to fail and leaves all shared data empty.
- Many page/domain objects are `any`, allowing API shape mismatches to pass TypeScript.
- No Socket.IO client exists, so the backend's realtime broadcasts are unused.

### Database

The schema covers identity/RBAC, customers, vendors, products, BoMs, SO/PO/MO lines, work orders, reservations, stock movements, audit logs, and notifications. Useful status/date and ledger indexes exist.

Important schema gaps:

- No migrations are committed under `backend/prisma/migrations`; `prisma migrate deploy` in the Docker image has nothing to deploy.
- Product lacks the frontend-required SKU/code and category fields.
- Work center is a free-text field, not the TRD work-center entity.
- Reservation rows do not enforce exactly one owner (SO XOR MO), positive quantity, or ownership at the database level.
- Stock movements do not enforce positive `quantity` or consistency between direction and `signedQty` at the database level.
- Monetary/quantity non-negativity and order-line invariants rely mostly on application code.
- `defaultBomId` is unique, preventing one BoM from being the default for more than one product whether or not that restriction is intended.
- There are no explicit receipt/delivery event tables; cumulative line quantities plus ledger rows carry the history.

## 3. API Surface Observed

Implemented route groups include:

- Auth: register, login, refresh, logout.
- Masters: list/create/update customers and vendors; list/create/update products; stock adjustment.
- Dashboard: summary, business health, role summary.
- Sales: list/detail/create/update/confirm/deliver/cancel.
- Purchase: list/detail/create/update/confirm/receive/cancel.
- BoM: list/detail/create/update.
- Manufacturing: list/detail/create/update/confirm/start/complete/cancel.
- Inventory: summary, movements, reconciliation.
- Cross-cutting: SO traceability, audit log list, notifications, admin roles/users.

Missing or materially incomplete API capabilities include:

- Self profile read/update and password change; forgot/reset password.
- Product detail endpoint, safe deactivate/delete semantics, and validated product DTOs.
- Master detail/delete endpoints and generated master references.
- Draft order-line editing.
- Work-order execution, actual duration entry, component consumption entry, and operator assignment.
- BoM clone and protected delete/deactivate workflow.
- Procurement recommendation/scoring endpoint and procurement inbox.
- Audit filters, counters, record-scoped query contract, and pagination.
- Inventory movement filtering/pagination and reservation/allocation browsing.
- Notification unread count and ownership-safe mark-as-read.
- Analytics/time-series endpoints required by rendered charts.

## 4. Critical and High-Priority Findings

### P0-1: Product API contract makes core UI workflows fail

**Evidence:** `ProductForm` sends `code` and `category`; Prisma `Product` has neither. Product create spreads the entire body into `tx.product.create`. Returned inventory products therefore also lack these fields, while product and inventory lists call `p.code.toLowerCase()` and order/BoM/MO forms filter on `p.category`.

**Impact:** Creating a product from the UI is expected to fail with an unknown Prisma argument. With seeded/backend-created products, catalog pages can throw at render time and product selectors can be empty. Sales, purchasing, BoM, and manufacturing creation are consequently not reliably operable from the UI.

### P0-2: Mass assignment bypasses workflow and ledger rules

**Evidence:** Product patch forwards `q.body` directly to Prisma, so callers with product admin permission can set `onHandQty`, `active`, procurement references, or other columns. SO/PO/MO update services similarly forward most arbitrary fields and lock only small deny-lists. For example, post-confirm MO update does not lock `quantity`, `finishedProductId`, or `status`; sales/purchase update can accept `status` and other workflow-owned fields.

**Impact:** API clients can mutate stock without a movement, force statuses without reservation/audit side effects, or alter committed documents. This violates the ledger, immutability, auditability, and server-side locking requirements.

### P0-3: Canonical sales reservation/shortage behavior is wrong

**Evidence:** Confirmation reserves `min(ordered, available)`, although the PRD defines reservation as the full committed quantity. When a shortage exists and `procureOnDemand` is false, `createProcurement` throws instead of allowing confirmation with an availability flag.

**Impact:** Reserved and free-to-use values do not represent full commitments; non-procured shortage orders cannot confirm; downstream availability and shortage calculations are not the specified business truth.

### P1-1: Cancellation state rules contradict requirements

- SO cancellation accepts `DRAFT` and `CONFIRMED`; PRD permits Draft only.
- PO cancellation accepts `DRAFT` and `CONFIRMED`; PRD permits Draft only.
- MO cancellation accepts Draft/Confirmed but rejects In Progress; PRD permits Draft/Confirmed/In Progress.
- Cancelling an SO does not cancel or otherwise resolve its auto-created draft PO/MO, leaving orphan supply.

### P1-2: Manufacturing reservation and execution model is inconsistent

The PRD says component reservation ramps with logged consumption. The implementation reserves as much available required stock as possible at MO confirmation. There is no endpoint to log `consumedQty`, update `actualMinutes`, or assign operators. Completion treats zero consumed quantity as “consume all required,” so users cannot intentionally record zero and cannot review final actuals before posting stock.

In addition, MO update can change protected fields after confirmation, and the cancel path cannot handle In Progress as required.

### P1-3: Audit logging is not complete or consistently field-level

- Entity creates commonly log only `reference`/`id`, not one row per populated field.
- BoM update writes an `id -> id` audit row rather than component/operation/field changes.
- Admin user update writes a single row without field, old value, new value, or a `PERMISSION_CHANGE` action.
- Registration is not audited as a user create.
- Reservation release/update is generally not audited.
- Draft item mutations are unavailable rather than audited.
- Audit API ignores required date/user/module/action/record filters and returns a fixed latest 500 rows; UI offers only client-side text search and no counters.

### P1-4: Authorization has stale-token and ownership problems

- GET authorization trusts permissions embedded in the access token; role removal is not effective for reads until token expiry. Mutations re-query permissions, producing inconsistent behavior.
- Refresh accepts the current access token and re-signs its embedded permissions; there is no refresh-token rotation/session/revocation design.
- Logout is a no-op HTTP 204.
- `PATCH /notifications/:id/read` updates by notification ID without checking `userId`, enabling an authenticated user to modify another user's notification if the ID is known.
- Dashboard endpoints require authentication but no module permission and return business-wide aggregates.
- CORS and Socket.IO allow all origins.

### P1-5: Frontend RBAC and shared loading can break valid role flows

Partner, procurement, inventory summary, analytics, profile, and traceability routes are not consistently permission-guarded. Conversely, audit logs require ADMIN in the UI even though the backend permits VIEW. `DbProvider` requests five modules in one `Promise.all`; a specialized user without Inventory, Vendor, BoM, or Customer access receives 403 on one call and loses all shared data.

Action buttons on detail pages are not consistently guarded by ADMIN permission, relying on backend rejection for users who can view the page.

### P1-6: Integration-status assertions are inaccurate

The integration report references `/auth/signup` and `/auth/me`, neither of which is implemented or used (the actual registration route is `/auth/register`). Vendor/customer pages, procurement recommendation, profile, and Kanban are placeholders. Notifications have no UI. Analytics and dashboard contain hard-coded/mock values. “Stock reconciliation” on the dashboard checks arithmetic on already-derived client values rather than calling `/inventory/reconciliation`.

## 5. Business Rule Compliance Matrix

| Area | Status | Main gaps |
|---|---|---|
| Authentication/user management | Partial | No default role record, profile edit, immutable-email endpoint, password flow, real logout/session model; incomplete user audit |
| Product management | Blocked | Frontend/schema mismatch; unsafe mass assignment; direct on-hand update possible; missing search API/category/SKU |
| Sales orders | Partial/non-conformant | Partial rather than full reservation; shortage-disabled confirm fails; draft line editing absent; wrong cancel states; weak patch locking |
| Purchase orders | Partial/non-conformant | Draft line editing absent; wrong cancel states; weak patch locking; responsible person not accepted by create schema |
| Manufacturing orders | Partial/non-conformant | No consumption/actual-time workflow; wrong reservation model; immutable fields bypassable; wrong cancel states |
| BoM | Partial | Create/view/update exist; no clone/delete; no field-level audit; no work-center entity; update can affect templates without richer controls |
| Procurement automation | Partial | Auto PO/MO exists for shortage; disabled path is wrong; fixed 7/5-day dates ignore vendor lead time; no recommendation engine/scoring/explanation |
| Inventory ledger | Strong foundation, unsafe edges | Atomic movement/cache update exists; direct product patch bypass exists; limited query API; missing DB constraints |
| Audit | Partial/non-conformant | Not 100%, not consistently per-field, no required filters/counters/record link behavior |
| Dashboard/analytics | Partial/mock | Backend aggregates exist but UI does not use most; hard-coded KPI/efficiency values; not reliably role-scoped |
| Vendors/customers | Backend CRUD partial, UI missing | Placeholder pages; no delete/detail UX; raw unvalidated bodies; create requires caller-supplied reference |
| Traceability | Partial | SO-to-auto-supply view exists; UI movement field names mismatch backend; no generalized finished-good/component/vendor chain guarantee |
| Notifications/realtime | Backend partial, UI missing | No client connection/bell; broadcasts are global; notification ownership flaw |

## 6. Additional Correctness Issues

- Product create/update validates procurement configuration only on create. Update can leave invalid combinations or both default references populated.
- Manufacturing auto-procurement checks that a BoM exists but not that it is active, belongs to the product, has components, or has nonzero reference quantity.
- PO expected date is hard-coded to seven days rather than using `Vendor.leadTimeDays`.
- Delivery/receipt accept an empty line array and can change status without a quantity movement; duplicate item IDs in a request are not rejected.
- SO/PO confirmed header fields beyond the small deny-list remain editable; cancelled/completed records can still be patched.
- Manual stock OUT checks on-hand but does not protect other orders' reservations, so an adjustment can make free-to-use deeply negative and prevent committed fulfillment.
- Master create/update routes have no schemas, generate no customer/vendor reference, and can expose raw Prisma errors.
- Reference generation based on `Date.now()` plus a small random suffix is not a durable sequence strategy.
- Audit and inventory list endpoints are capped at 500 without pagination metadata.
- Notification creation broadcasts inside the surrounding transaction before commit; clients could be notified about work that later rolls back.
- Server startup uses `app.listen` rather than `httpServer.listen`, so the HTTP server holding Socket.IO is never actually started. Realtime cannot function.
- Production frontend uses relative `/api`, but the repository provides no production reverse proxy or Compose frontend service.
- `backend/.env.example` uses host port `55432`; Compose publishes PostgreSQL on `55433`.

## 7. Frontend Feature Gaps

Fully or substantially implemented screens: auth forms, product display/form/adjustment, inventory summary/ledger, SO/PO/MO list/create/detail actions, BoM list/create/detail, audit list, user role assignment, and SO traceability.

Missing or placeholder screens/features:

- Customer management.
- Vendor management.
- Profile edit.
- Procurement recommendation/inbox.
- Manufacturing Kanban.
- Notification center.
- Forgot-password submission.
- Sales Kanban toggle.
- BoM clone/edit/delete UX.
- Draft order editing.
- Work order execution and actual duration/consumption entry.
- Audit filters/counters and record-scoped log links.

Displayed data mismatches include:

- Frontend movement fields (`sourceType`, `sourceReference`, `performedBy`, `reason`) versus backend fields (`source`, `referenceType`, `referenceId`, `actorId`).
- Frontend BoM fields (`code`, `name`, `referenceQuantity`) versus backend (`reference`, no name, `referenceQty`).
- Frontend product (`code`, `category`, `freeToUse`) versus backend (`reference`, no category, computed `available`).
- Dashboard metrics are derived from products/movements and hard-coded values rather than the implemented dashboard endpoints.

## 8. Test and Verification Assessment

### Existing coverage

There is one backend integration file with four tests:

1. Purchase-procured demand-to-delivery happy path.
2. Sales locked edit/over-delivery/duplicate confirmation/cancellation behavior.
3. Purchase locked edit/over-receipt/late cancellation behavior.
4. Manufacturing transition/locked BoM/duplicate confirmation behavior.

The tests require a separately running API and seeded database. There is no test script named `test`; only `test:e2e`. The sales test named “late cancellation” actually confirms an SO and expects cancellation to succeed, which conflicts with both its name and PRD FR-3.6.

### Missing coverage

- Frontend component, route, form, API-contract, and end-to-end browser tests.
- Unit tests for inventory, procurement, dashboard, permission, and validation logic.
- Manufacturing happy path and manufacturing auto-procurement.
- Partial repeated delivery/receipt delta idempotency.
- Full reservation and non-procured shortage behavior.
- Concurrent confirmation/stock mutation tests.
- Transaction rollback/failure injection tests.
- Audit completeness and secret redaction tests.
- RBAC matrix and notification ownership tests.
- Invalid/malicious patch and direct-stock mutation tests.
- Reconciliation corruption detection.
- BoM cycles beyond default-BoM traversal and delete protection.

### Commands run

- Frontend `npm run build`: passed.
- Backend `npx tsc --noEmit`: passed.
- Backend `npm run build`: could not complete because `prisma generate` hit a Windows `EPERM` rename on the Prisma query-engine DLL. TypeScript itself passed separately.
- Backend E2E suite was not run because it requires the API/database to be running and the repository provides no self-contained test harness.

## 9. Non-Functional Requirement Gaps

- **Consistency:** Core stock services are transactional, but generic mass-assignment routes bypass them.
- **Auditability:** Coverage is selective and not field-level across all mutations.
- **Performance:** Inventory summary performs per-product reservation aggregation (N+1). Dashboard business health also computes per-product balances. Required sub-500ms behavior is untested.
- **Security:** JWT basics and password hashing exist, but refresh/logout, ownership checks, CORS, stale permissions, validation, and mass assignment need correction.
- **Concurrency:** Product/order row locks exist in core actions, but no concurrency tests demonstrate the requirement. The stated PRD rule that one of two confirmations must fail also conflicts with the PRD's full-commitment/shortage model and needs a clarified acceptance rule.
- **Usability:** Server-side locking is incomplete and frontend error handling often uses alerts or silently logs shared-load failures.
- **Traceability:** A useful SO trace endpoint exists, but UI field mismatches and missing generalized chain logic prevent the promised guarantee.
- **Reliability:** Transactions are used well in core flows; realtime notification timing and bypass routes undermine the guarantee.
- **Portability:** A single Compose command does not run the full stack, migrations are absent, and configuration ports disagree.

## 10. Recommended Implementation Order

1. Establish one shared API/domain contract: add or remove SKU/category deliberately, map backend DTOs explicitly, validate every mutation, and eliminate `any` at integration boundaries.
2. Close mass-assignment paths with allow-listed DTOs and enforce all status transitions/immutable fields in services.
3. Correct canonical reservation, shortage, cancellation, and procurement rules; add tests before changing behavior.
4. Complete manufacturing execution: consumption, work-order actuals, operator fields, completion validation, and cancellation semantics.
5. Make audit logging comprehensive, field-level, filtered, paginated, and covered by tests.
6. Fix authorization/session/ownership issues and make frontend data loading permission-aware.
7. Replace placeholders and hard-coded dashboards with connected customer/vendor/profile/procurement/notification/Kanban flows.
8. Add migrations, a frontend/reverse-proxy deployment path, consistent environment configuration, and a self-contained integration test harness.
9. Add browser E2E tests for the complete purchase and manufacturing demand-to-delivery demonstrations, plus concurrency and rollback tests.

## 11. Overall Readiness

**Prototype readiness:** Moderate. The backend demonstrates the intended ledger-centered architecture and several transactional flows.  
**Demo readiness:** Low without carefully controlled seed data and avoiding broken product/placeholder paths.  
**PRD/TRD compliance:** Low to moderate; core concepts are present, but multiple binding business rules and architecture/security requirements are violated.  
**Production readiness:** Low. Contract integrity, mutation safety, tests, deployment, security, and audit completeness must be addressed first.
