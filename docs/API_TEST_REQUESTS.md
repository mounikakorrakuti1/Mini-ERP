# Demo API requests and expected responses

Base URL: `http://localhost:3000`

## Login

```http
POST /auth/login
Content-Type: application/json

{"loginId":"admin01","password":"Admin@123"}
```

Expected `200`:

```json
{ "success": true, "data": { "accessToken": "<jwt>", "user": { "loginId": "admin01" } } }
```

Use `Authorization: Bearer <jwt>` for the remaining requests.

## Inventory summary

```http
GET /inventory/summary
Authorization: Bearer <jwt>
```

Expected `200`: Teak Wood Plank has `onHand: 200`, `reserved: 10`, `available: 190`; Classic Teak Chair has `onHand: 10`, `reserved: 3`, `available: 7`.

## Sales order detail

```http
GET /sales-orders
Authorization: Bearer <jwt>
```

Expected `200`: contains `SO-000001` with status `CONFIRMED` and ordered quantity `3`.

## PO receipt validation

```http
PATCH /purchase-orders/<po-id>/receive
Authorization: Bearer <jwt>
Content-Type: application/json

{"items":[{"itemId":"<po-item-id>","receivedQty":100}]}
```

Expected `200`: status becomes `FULLY_RECEIVED`; a `PURCHASE_RECEIPT` movement of `50` is added.

## Sales delivery validation

```http
PATCH /sales-orders/<so-id>/deliver
Authorization: Bearer <jwt>
Content-Type: application/json

{"items":[{"itemId":"<so-item-id>","deliveredQty":3}]}
```

Expected `200`: status becomes `FULLY_DELIVERED`; a `SALES_DELIVERY` movement of `3` is added and SO reservation is released.
