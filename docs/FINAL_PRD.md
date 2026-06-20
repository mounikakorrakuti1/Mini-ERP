# FINAL PRODUCT REQUIREMENTS DOCUMENT (PRD)

## Mini ERP: From Demand to Delivery — "Shiv Furniture Works"

**Version:** Final (Architecture Review Consolidation) · **Stack:** React + TypeScript + Tailwind · Node.js + Express · PostgreSQL + Prisma · JWT + RBAC

---

## 1. Executive Summary

Shiv Furniture Works is a growing furniture manufacturer currently run on Excel sheets, WhatsApp threads, paper stock registers, and verbal handoffs between Sales, Purchase, Manufacturing, and Inventory. As volume grew, this informal system broke: Sales sells stock that doesn't exist, Purchase finds out about shortages only when it's urgent, Manufacturing has no digital BoM or production queue, and Inventory cannot state an accurate on-hand number at any given moment. Management has no visibility into any of it.

This PRD defines a **Mini ERP** built on one non-negotiable architectural premise: **inventory is not a module — it is the ledger every other module writes to.** Sales, Purchase, Manufacturing, and Procurement do not "update stock"; they each emit a stock movement, and On-Hand, Reserved, and Free-to-Use quantities are always _derived_ from that ledger, never hand-set. This is the same principle as double-entry bookkeeping, and it is the single biggest differentiator between a credible ERP and a CRUD app with a `quantity` column.

The product must be built and demoed within a 12-hour hackathon window, on a fixed stack (React/TypeScript/Tailwind, Node/Express, PostgreSQL/Prisma, JWT/RBAC), with zero AI-based decision-making anywhere in the procurement or recommendation logic — every automated decision must be deterministic, explainable, and auditable.

---

## 2. Problem Statement

| Department    | Pain Today                                                                                                                            | Root Cause                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Sales         | Sells products without checking real stock; customers get delayed deliveries with no visibility into reserved vs. available inventory | No real-time, trustworthy stock number                                        |
| Purchase      | Finds out about shortages only when Sales/Manufacturing is already blocked; last-minute, panicked vendor orders                       | No automatic link between confirmed demand and replenishment                  |
| Manufacturing | BoMs exist on paper; operators don't know what to build next; work orders are untracked                                               | No digital production queue or recipe system                                  |
| Inventory     | No accurate balance at any point in time; component consumption and finished-goods counts are manually maintained and wrong           | Stock treated as a manually-edited field, not a derived ledger balance        |
| Management    | Zero visibility into pending orders, delays, shortages, or manufacturing efficiency; decisions made on gut feel                       | No single source of truth connecting demand → supply → production → inventory |

**Root cause, stated once:** there is no centralized system in which a sale, a purchase, and a production run are all the _same kind of event_ — a mutation against one shared inventory state, permanently recorded.

---

## 3. Product Philosophy — Inventory as Ledger

```
On Hand Quantity     = Σ all stock movements ever recorded for a product
Reserved Quantity    = Σ (outstanding committed qty on open Sales Order lines)
                      + Σ (consumed qty on open Manufacturing Order components)
Free To Use Quantity = On Hand Quantity − Reserved Quantity
```

Design consequences this PRD treats as binding, not aspirational:

1. **No module ever writes directly to a stock quantity field.** Every change is a row in a stock-movement ledger; any cached "on-hand" column is updated only inside the same database transaction as that ledger insert.
2. **Reservation is a derived state, not a manually-typed number.** It exists because an order is `Confirmed`/`Partially Delivered` (Sales) or `Confirmed`/`In Progress` (Manufacturing) — the moment the order leaves that state, its contribution to Reserved disappears.
3. **Procurement is a side-effect of a shortage being detected at confirmation time**, not a separate manual decision a human must remember to make.
4. **Every mutation is dual-written**: one row to the operational table, one row to the audit log, in the same transaction — traceability is never best-effort.

---

## 4. Goals

### 4.1 Primary Goals

1. Replace fragmented manual operations with one connected platform across Sales, Purchase, Manufacturing, and Inventory.
2. Make the Inventory Ledger the single, provable source of truth for stock — On-Hand must always reconcile to the sum of movements.
3. Automatically detect shortages at the moment of commitment (Sales Order confirmation) and trigger the correct replenishment (Purchase or Manufacturing) for exactly the shortfall — supporting both Make-to-Stock (MTS) and Make-to-Order (MTO).
4. Provide full, click-through traceability from a customer's order to the vendor or work order that ultimately fulfilled it.
5. Log every state-changing action, at the field level, with zero exceptions.

### 4.2 Secondary Goals

1. Role-based access so each department sees and can act only within its remit.
2. Role-aware dashboards that make delays, shortages, and bottlenecks visible without anyone asking.
3. A deterministic, explainable Procurement Recommendation Engine — explicitly **not** AI-based — for the Purchase-vs-Manufacture decision.
4. A demo that can be run start-to-finish without manual data patching.

---

## 5. Target Users

| Role                             | Responsibility                                                | Primary Modules                                            | Pain Solved                                      |
| -------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------ |
| **Admin (System Administrator)** | Full system access, user/role administration, audit oversight | All modules                                                | No oversight across teams today                  |
| **Business Owner**               | Monitors the whole business; owns product master data         | Dashboard, Products (full), all modules (read)             | Zero visibility into delays/shortages/efficiency |
| **Sales User**                   | Creates and fulfills Sales Orders                             | Sales (full), Products (read)                              | Sells without knowing real stock                 |
| **Purchase User**                | Manages vendors and Purchase Orders                           | Purchase (full), Vendors                                   | Finds out about shortages too late               |
| **Manufacturing User**           | Runs Manufacturing Orders, BoMs, Work Orders                  | Manufacturing (full), BoM (edit)                           | No digital BoM, no production queue              |
| **Inventory Manager**            | Owns stock accuracy and manual corrections                    | Inventory/Ledger (full), read-access elsewhere for context | No accurate balance, ever                        |

---

## 6. Functional Requirements

### FR-1 Authentication & User Management

- FR-1.1 Sign-up with Login ID (unique, 6–12 characters), unique Email, and a password meeting complexity rules (≥8 chars, ≥1 uppercase, ≥1 lowercase, ≥1 special character).
- FR-1.2 Login validates credentials server-side; on failure, return the exact message `"Invalid Login Id or Password"`. Role is resolved server-side — never selected by the user at login.
- FR-1.3 New users default to an unassigned/basic role; an Admin must assign Role and Position via the System Administrator Dashboard before the user gets module access.
- FR-1.4 A user may self-edit Name, Address, and Mobile Number. Email is immutable post-signup. Position is read-only to the user and editable only by an Admin.
- FR-1.5 Every login event is written to the audit log.
- FR-1.6 Forgot-password flow exists on the login page (P1 — not required for the demo to function end-to-end).

### FR-2 Product Management

- FR-2.1 A Product has: name, Sales Price, Cost Price, computed On Hand Qty, computed Free-to-Use Qty, and a `Procure on Demand` flag.
- FR-2.2 When `Procure on Demand` is enabled, `Procurement Type` (Purchase | Manufacturing) becomes mandatory. Selecting Purchase makes Vendor mandatory; selecting Manufacturing makes BoM mandatory. Both are never required simultaneously.
- FR-2.3 Sales Price auto-populates onto a new Sales Order line when the product is added; Cost Price auto-populates onto a new Purchase Order line. Both are editable per-line snapshots, not live references.
- FR-2.4 On Hand Qty increases on PO receipt and MO production; decreases on MO consumption and SO delivery. It is never directly editable by any role through the standard product form — only through a dedicated, audited Manual Adjustment action.
- FR-2.5 Free To Use Qty = On Hand Qty − Reserved Qty, always computed, never stored as an editable field.
- FR-2.6 Products are searchable/filterable by name and stock status (in-stock / low-stock / out-of-stock).

### FR-3 Sales Order Management

- FR-3.1 Create a Sales Order in `Draft`: Customer, Customer Address, Sales Person, and line items (Product, Ordered Qty, Sales Price).
- FR-3.2 Line Total = Ordered Qty × Sales Price while Draft/Confirmed; switches basis to Delivered Qty × Sales Price the moment any delivery occurs.
- FR-3.3 Availability check: a line is flagged if Ordered Qty > current Free-to-Use Qty. This flag never blocks Draft save.
- FR-3.4 **Confirm:** `Draft → Confirmed`. Locks Customer, Customer Address, and Creation Date. Reserves the full ordered quantity per line (reservation represents commitment, not capped availability). Evaluates the Procurement Engine for every line.
- FR-3.5 **Deliver:** if cumulative Delivered Qty == Ordered Qty for all lines → `Fully Delivered` (lock all fields, hide Deliver). If less → `Partially Delivered` (lock all fields except Delivered Qty; Deliver remains available). Each delivery call emits a stock movement for the **delta** between the new and previous delivered quantity — never the cumulative total — so repeated partial calls never double-count.
- FR-3.6 **Cancel:** only from `Draft`. Releases any reservation (defensive; Draft shouldn't normally hold one) and locks the record.
- FR-3.7 Cumulative Delivered Qty can never exceed Ordered Qty; the API rejects any call that would violate this.

### FR-4 Purchase Order Management

- FR-4.1 Create a Purchase Order in `Draft`: Vendor, Vendor Address, Responsible Person, line items (Product, Ordered Qty, Cost Price).
- FR-4.2 Line Total = Ordered Qty × Cost Price pre-receipt; switches to Received Qty × Cost Price once any receipt occurs.
- FR-4.3 **Confirm:** `Draft → Confirmed`. Locks Vendor, Vendor Address, Creation Date. No stock effect — receiving moves stock, confirming does not.
- FR-4.4 **Receive:** delta-based, identical pattern to Sales delivery. Full receipt of every line → `Fully Received` (lock all, hide Receive); partial → `Partially Received` (Receive remains available).
- FR-4.5 **Cancel:** only from `Draft`.
- FR-4.6 A PO may be auto-created by the Procurement Engine; in that case it carries `auto_created = true` and a reference back to the triggering Sales Order, and still requires a human Confirm before it proceeds (the engine never auto-confirms).

### FR-5 Manufacturing Order Management

- FR-5.1 Create a Manufacturing Order in `Draft`: Finished Product (must already exist as a Product — an MO never implicitly creates one), Quantity, and a BoM whose finished product matches. Selecting the BoM **copies** its components and operations onto the MO at that moment (a snapshot, not a live reference — editing the BoM later never retroactively changes an in-flight MO).
- FR-5.2 Component Required Qty is computed as `bom_component_qty × (mo_quantity / bom_reference_quantity)`. Consumed Qty is a manual numeric field, visible once Confirmed, locked once Done/Cancelled.
- FR-5.3 Operation Expected Duration scales the same way from the BoM's per-unit duration. Real Duration is hidden in Draft, editable Confirmed/In Progress, locked once Done/Cancelled.
- FR-5.4 **Confirm:** `Draft → Confirmed`. Locks Finished Product, BoM, Creation Date. Begins tracking component reservation, which ramps up with logged Consumed Qty rather than spiking fully at Confirm.
- FR-5.5 **Start:** `Confirmed → In Progress`. Unlocks Real Duration entry on Work Orders.
- FR-5.6 **Done:** in one transaction — write an OUT stock movement per component for its final Consumed Qty, write one IN stock movement for the finished product at MO Quantity, release all of this MO's reservations, set status `Done`.
- FR-5.7 **Cancel:** only from `Draft`/`Confirmed`/`In Progress`. Releases reservations; emits **no** stock movement, since nothing was physically consumed or produced.
- FR-5.8 An MO's Quantity, Finished Product, and BoM are immutable once Confirmed — a quantity change requires Cancel + a new MO.

### FR-6 Bill of Materials (BoM)

- FR-6.1 A BoM belongs to one Finished Product, with a Reference Quantity (the "per X units" basis), a component list (product + quantity), and an operation list (name, work center, duration).
- FR-6.2 Creating a BoM never touches inventory — it is a pure template.
- FR-6.3 Selecting a BoM on an MO populates every BoM field onto the MO. A "+New from template" action clones an existing BoM's structure for reuse.
- FR-6.4 A BoM referenced as any product's auto-procurement default cannot be deleted while that reference exists.

### FR-7 Procurement Automation

- FR-7.1 Trigger condition: a Sales Order line is confirmed (or its ordered quantity increases) AND the product has `Procure on Demand = true` AND Free-to-Use Qty is less than the quantity needed.
- FR-7.2 If Procurement Type = Purchase → auto-create a `Draft` PO for the configured Vendor, quantity = shortfall **only** (never the full order quantity).
- FR-7.3 If Procurement Type = Manufacturing → auto-create a `Draft` MO for the configured BoM, quantity = shortfall only.
- FR-7.4 If `Procure on Demand` is unchecked, no automatic PO/MO is ever created — the SO simply confirms with an Availability flag if short.
- FR-7.5 The system additionally computes a **Procurement Recommendation** (Section 11) using deterministic, auditable scoring — never AI — when both a vendor and a BoM are plausible routes for a product.

### FR-8 Audit Logging

- FR-8.1 Every Create, Update, Delete, and status-change action on Sales Orders, Purchase Orders, Manufacturing Orders, BoM, Products, and Users writes one row per **changed field** with: Date & Time, User, Module, Record Type, Record ID, Action, Field Changed, Old Value, New Value.
- FR-8.2 The Audit Log list supports filters (Date Range, User, Module, Action) and shows summary counters: Total Logs, Create, Update, Delete.
- FR-8.3 Every record's detail view exposes a "Logs" action that opens the Audit Log pre-filtered to that record.
- FR-8.4 Audit logs are append-only. No UI or API path permits editing or deleting a log entry. Password values are never written to old/new value fields — only the literal string "Password changed."

### FR-9 Dashboards

- FR-9.1 Six PDF-mandated KPI counters, role-scoped: Total Sales Orders, Pending Deliveries, Open Manufacturing Orders, Delayed Orders, Total Purchase Orders, Partial Receipts.
- FR-9.2 List views support state-button filtering (click a status chip to filter and highlight it) and, for Sales Orders, a Kanban toggle.
- FR-9.3 Role-specific widgets beyond the bare counters (Section 13).

### FR-10 Vendor & Customer Management

- FR-10.1 Vendor master: name, address, contact, lead time (days) — used by both PO creation and the Procurement Recommendation Engine.
- FR-10.2 Customer master: name, address, contact. Customers do not log in; they are a billing/shipping party referenced by Sales Orders.

---

## 7. Non-Functional Requirements

| Category               | Requirement                                                                                                                                                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Consistency**        | Every inventory-affecting action (deliver, receive, MO done) is atomic — the stock movement, the cached on-hand update, the reservation change, and the audit log write succeed or fail together in one DB transaction.        |
| **Auditability**       | 100% of mutating actions across in-scope modules are logged; logs are immutable.                                                                                                                                               |
| **Performance**        | Dashboard KPI and list queries return in under 500ms against hackathon-scale seed data, via indexed status/date columns and pre-aggregated views — not full table scans.                                                       |
| **Security**           | JWT auth with short-lived access tokens; passwords hashed with bcrypt; RBAC enforced server-side on every endpoint, independent of what the UI hides; SQL injection prevented structurally via Prisma's parameterized queries. |
| **Concurrency Safety** | Two simultaneous confirmations against the same limited-stock product must not both succeed if only one has sufficient Free-to-Use Qty — enforced via row-level locking, not optimistic hope.                                  |
| **Usability**          | Status-driven field locking is enforced server-side (so API tampering can't bypass it), not merely hidden in the UI.                                                                                                           |
| **Traceability**       | Any finished-good unit is traceable back through its MO, BoM, and components to any auto-procured Purchase Order and vendor, in at most 3 clicks.                                                                              |
| **Reliability**        | No partial state corruption: a failed step inside any multi-table operation rolls back the entire operation.                                                                                                                   |
| **Portability**        | The full stack runs via a single `docker-compose up`, with no manual seed steps beyond one migration + seed script.                                                                                                            |

---

## 8. Business Rules (canonical, cross-module)

1. No module is ever allowed to silently let Free-to-Use go negative without either auto-triggering procurement or surfacing an Availability flag.
2. Reservation is always status-derived — never a manually-typed number on any form.
3. Status transitions are one-directional, except Cancel, which is only available pre-Confirm for SO/PO and pre-Done for MO.
4. Reference codes (SO-000001, PO-000001, MO-2026-001, BOM-0001) are generated server-side on creation and are never client-suppliable or editable.
5. A line's Total switches basis from Ordered/ordered-equivalent Qty to the fulfilled-Qty basis the moment any fulfillment occurs (delivery for SO, receipt for PO).
6. An MO can only consume materials belonging to the BoM of the Finished Product actually selected — selecting Finished Product first restricts which BoMs are selectable.
7. Vendor and BoM on a Product are conditionally mandatory based on Procurement Type, never both required at once.

---

## 9. Edge Cases

| Edge Case                                                                          | Required Behavior                                                                                                                             |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| SO confirmed with Ordered Qty > Free-to-Use, `Procure on Demand` OFF               | Confirm proceeds; Availability flag shown; no auto PO/MO                                                                                      |
| SO confirmed with `Procure on Demand` ON, but the product's Vendor/BoM is missing  | Block at **Product save time**, not at SO confirm time — an invalid procurement config should never reach this point                          |
| Two SOs confirmed concurrently against the same limited-stock product              | Row-level lock (`SELECT … FOR UPDATE`) on the product during reservation; the second transaction re-reads Free-to-Use after the first commits |
| MO cancelled after Confirm (components reserved, not consumed)                     | Release the reservation; emit no stock movement                                                                                               |
| PO partially received, remainder never received                                    | Stays "Partially Received" indefinitely; surfaces under Delayed Orders once past its expected date                                            |
| Default BoM on a procure-on-demand product is later deleted                        | Blocked — FK/soft-delete check                                                                                                                |
| A user with open SOs as Sales Person is deactivated                                | Field becomes a historical text reference; no cascade delete; Admin reassigns manually                                                        |
| MO quantity changed after Confirm                                                  | Not permitted — Cancel + new MO required                                                                                                      |
| Cumulative delivered/received/consumed exceeds ordered/required (data entry error) | Rejected with a clear validation error                                                                                                        |

---

## 10. Validation Rules

| Field                                         | Rule                                                                                         |
| --------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Login ID                                      | Unique, 6–12 characters                                                                      |
| Email                                         | Unique, valid format, immutable after creation                                               |
| Password                                      | ≥8 chars, ≥1 uppercase, ≥1 lowercase, ≥1 special character                                   |
| Sales Price / Cost Price                      | Monetary, ≥ 0                                                                                |
| Ordered / Received / Delivered / Consumed Qty | Numeric, > 0 on creation; cumulative fulfillment can never exceed the ordered/required basis |
| `Procure on Demand` → Procurement Type        | Required if true                                                                             |
| Procurement Type = Purchase → Vendor          | Required                                                                                     |
| Procurement Type = Manufacturing → BoM        | Required                                                                                     |
| Reference codes                               | Server-generated only; client-supplied values rejected                                       |

---

## 11. Innovative Features

### 11.1 Strategic Procurement Recommendation Engine (deterministic, no AI)

When a shortage is detected and the product could plausibly go either route (or as an advisory layer beyond the automatic single-vendor trigger), the engine scores both options:

```
Score(Purchase)     = 0.5 × NormalizedCost + 0.3 × NormalizedLeadTime
Score(Manufacture)  = 0.5 × NormalizedCost + 0.3 × NormalizedLeadTime + 0.2 × MaterialShortagePenalty

MaterialShortagePenalty = (components currently short) / (total components) × 1.0

Lower score wins. All inputs (vendor cost & lead time, BoM cost, component availability)
are read from existing data — nothing is invented or estimated by a model.
```

Output is shown to the user with both raw numbers and the resulting score, so the recommendation is fully explainable and reproducible — exactly what a hackathon judge will probe.

### 11.2 Reorder Point & Safety Stock (Operations Management depth)

To go beyond a static low-stock flag, reorder point is exposed using the standard OM formula, computed from real PO/SO history rather than a guessed constant:

```
Reorder Point  = (Average Daily Usage × Vendor Lead Time) + Safety Stock
Safety Stock   = Maximum Daily Usage × Maximum Historical Delivery Delay
```

This demonstrates real Operations Management reasoning rather than a hard-coded threshold, while remaining a pure read-model over existing `stock_movements` and `purchase_orders` data — no new write paths, no AI.

### 11.3 End-to-End Traceability View

Click a Sales Order → see the full chain: SO → (auto-created) MO → BoM → Components → (auto-created) POs for short components → Vendor. Built entirely from the `trigger_source_so_id` foreign keys that already exist on `purchase_orders` and `manufacturing_orders` — no new schema, no new write path, purely a query + a stepper UI.

### 11.4 Inventory Timeline ("Stock Card")

A per-product, chronological view of every stock movement:

```
2026-06-01  PURCHASE_RECEIPT   +100   PO-000012
2026-06-05  RESERVATION        — (reservation table, not a movement)
2026-06-07  SALES_DELIVERY      -10   SO-000031
2026-06-10  MO_CONSUMPTION      -40   MO-2026-004
```

This is the literal proof, in the demo, that On-Hand is computed, not typed.

### 11.5 Real-Time Notification Center

Low-stock crossing reorder point, MO completed, PO received, and delayed-order checks all fire from existing service methods into a generic `notifications` table — polled by the frontend every few seconds rather than via WebSockets, an explicit, judge-facing call that correctness and demoability beat infrastructure risk in a 12-hour window.

### 11.6 Manufacturing Kanban Board

A drag-and-drop view of Work Orders by status (`Pending → In Progress → Quality Check → Completed`), built almost entirely on the frontend since the backend status column already exists as a side-effect of building Work Orders correctly.

---

## 12. User Stories

**Authentication**

- As a user, I want to log in with my Login ID and password so I can access only my role's modules.
- As an Admin, I want to assign roles and positions so the right people see the right data.

**Products**

- As a Business Owner, I want to set procurement strategy on a product so the system knows how to replenish it automatically.
- As any user, I want to see live On-Hand, Reserved, and Free-to-Use numbers so I trust what I'm looking at.

**Sales**

- As a Sales User, I want the system to flag insufficient stock at order entry so I can set honest customer expectations.
- As a Sales User, I want delivery to automatically reduce stock so I never have to remember a manual step.

**Purchase**

- As a Purchase User, I want shortages to auto-generate a Draft PO so I'm never the last to know.
- As a Purchase User, I want receiving goods to increase stock automatically and correctly handle partial shipments.

**Manufacturing**

- As a Manufacturing User, I want selecting a BoM to auto-populate components and operations so I don't hand-enter every material.
- As a Manufacturing User, I want to log consumption and completion so finished goods and component stock update correctly in one action.

**Procurement & Dashboard**

- As any user, I want shortages to trigger the _right_ type of order (Purchase or Manufacture) without anyone deciding manually.
- As a Business Owner, I want a single dashboard view showing delays, shortages, and efficiency across every module.

---

## 13. Acceptance Criteria

| Feature          | Acceptance Criteria                                                                                                                                                           |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Inventory Ledger | At any time, `products.on_hand_qty` equals `SUM(signed stock_movements)` for that product — a reconciliation query returns zero mismatched rows                               |
| SO Confirmation  | Confirming an SO line for 20 units when only 5 are free-to-use, on a Manufacturing-type product, creates exactly one Draft MO for 15 units, linked via `trigger_source_so_id` |
| MO Completion    | Completing an MO for 10 Tables (BoM: 4 Legs, 1 Top, 12 Screws) writes OUT 40 Legs / 10 Tops / 120 Screws and IN 10 Tables, in one transaction                                 |
| RBAC             | A Sales User's API call to a Purchase-only endpoint returns `403 Forbidden`, independent of any UI state                                                                      |
| Audit Log        | Every SO status change produces a row with the exact old and new status values; password changes never expose the actual password string                                      |
| Concurrency      | Two simultaneous SO confirmations against a product with only enough stock for one succeed sequentially, never both fully                                                     |

---

## 14. Dashboards (overview — full widget tables in FINAL_WEBAPPFLOW.md §Dashboard Flow)

| Dashboard         | Headline Widgets                                                                                           |
| ----------------- | ---------------------------------------------------------------------------------------------------------- |
| Admin             | Audit summary tiles, active users by role, all-module order counters, reconciliation health banner         |
| Sales             | Total SOs, pending deliveries, orders by status, delayed deliveries, revenue this month                    |
| Purchase          | Total POs, partial receipts, auto-created POs awaiting action, delayed receipts, spend by vendor           |
| Manufacturing     | Open MOs, auto-created MOs awaiting confirm, delayed MOs, Manufacturing Kanban, work center utilization    |
| Inventory Manager | Low-stock alerts, live stock-movement feed, On Hand/Reserved/Free-to-Use snapshot table                    |
| Business Owner    | Six cross-module KPI counters, delayed orders by module, manufacturing efficiency, material shortage watch |

---

## 15. Constraints

- Implementation window: ~12 hours.
- Fixed stack: React + TypeScript + Tailwind · Node.js + Express · PostgreSQL + Prisma · JWT + RBAC. No FastAPI/Python backend, no Firebase/Supabase/MongoDB, no mandatory Redis or WebSockets (notification polling is sufficient).
- Procurement and any recommendation logic must be deterministic, rule-based, and auditable — explicitly not AI-driven.
- Single company, single currency (INR), single warehouse. Multi-tenancy and multi-currency are out of scope.
- Demo data is seeded; no production data migration concerns.

---

## 16. Success Metrics

| Metric                         | Target                                                                                                         |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Inventory reconciliation       | 100% — `on_hand_qty` always equals ledger sum                                                                  |
| Procurement automation latency | Synchronous, within the same request/transaction as confirmation                                               |
| Traceability depth             | Sales Order → Vendor navigable in ≤ 3 clicks                                                                   |
| Audit log completeness         | 100% of mutating actions logged                                                                                |
| Dashboard load time            | < 500ms for KPI queries                                                                                        |
| Demo completeness              | Full P0 flow (SO → shortage → auto-PO/MO → fulfillment → delivery) runs end-to-end without manual intervention |

---

## 17. Future Scope (Post-Hackathon)

- Multi-warehouse / multi-location inventory.
- Email/SMS notification delivery (current scope is in-app only).
- Forecasting engine built on historical sales velocity (explicitly heuristic, not AI, to preserve auditability).
- Capacity planning (workers × hours × efficiency) gating delivery-date promises.
- BoM versioning with full history.
- Customer self-service portal for order tracking.
- Accounting/GL integration.
- Multi-currency support.
