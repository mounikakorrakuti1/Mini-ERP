# Implementation Status

## Business modules

| Module                 | Status        | Delivered scope                                                                                                 |
| ---------------------- | ------------- | --------------------------------------------------------------------------------------------------------------- |
| Auth and RBAC          | Partial       | Registration, login, JWT, live permission checks on mutations, seeded Admin role. Refresh/logout are stateless. |
| Master data            | Partial       | Customer, vendor and product CRUD foundations.                                                                  |
| Inventory ledger       | Complete core | Immutable movements, cached on-hand update in the same transaction, reservations and computed available stock.  |
| Sales                  | Partial       | Create, confirm/reserve/procure, delta delivery.                                                                |
| Procurement            | Partial       | Deterministic Purchase/Manufacturing shortfall creation at SO confirmation.                                     |
| Purchase               | Partial       | Create, confirm and delta receipt.                                                                              |
| BoM                    | Partial       | Create/list and snapshot copying to MOs.                                                                        |
| Manufacturing          | Partial       | Create/snapshot, confirm/start, completion consumption and production.                                          |
| Audit                  | Partial       | Core transaction actions and log query.                                                                         |
| Notifications          | Partial       | Read/list/mark-read API.                                                                                        |
| Dashboards and Swagger | Missing       | Not yet implemented.                                                                                            |

## Dependency graph

`Sales confirmation -> Reservation -> Available stock calculation -> Procurement -> Draft PO/MO -> Receipt/Completion -> Stock ledger -> Sales delivery`

## Critical business flows

- Short sales demand can confirm; configured MTO products generate a draft replenishment document for only the shortage.
- Stock movement is the inventory source of truth; all physical change uses the transactional inventory service.
- Partial receipt and delivery are delta-based and reject quantities above the ordered amount.
- Manufacturing completion consumes component movement rows before producing the finished-good movement.

## Risk areas / remaining work

- Add a committed Prisma migration after running `prisma migrate dev` against PostgreSQL.
- Finish cancel/update/delete endpoints, full field-level auditing, MO reservation ramp-up, dashboards, Swagger, integration tests, refresh-token persistence, and low-stock notifications.
- Enforce raw `SELECT ... FOR UPDATE` locking when connected to PostgreSQL; Prisma relation updates alone do not provide the mandated row lock.
