export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Furnexa Demand to Delivery API',
    version: '1.0.0',
    description:
      'Hackathon-ready backend API for auth, masters, orders, inventory, dashboard, traceability, audit logs, and notifications.',
  },
  servers: [{ url: 'http://localhost:3000' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      ApiEnvelope: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: { type: 'object' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/health': {
      get: {
        security: [],
        summary: 'Health check',
        responses: { '200': { description: 'API is healthy' } },
      },
    },
    '/auth/register': {
      post: {
        security: [],
        summary: 'Register user',
        responses: { '201': { description: 'User created' } },
      },
    },
    '/auth/login': {
      post: {
        security: [],
        summary: 'Login and receive JWT',
        responses: { '200': { description: 'Authenticated' } },
      },
    },
    '/auth/refresh': {
      post: {
        summary: 'Refresh stateless JWT',
        responses: { '200': { description: 'Token refreshed' } },
      },
    },
    '/auth/logout': {
      post: {
        summary: 'Logout current session',
        responses: { '204': { description: 'Logged out' } },
      },
    },
    '/customers': {
      get: { summary: 'List customers', responses: { '200': { description: 'Customers' } } },
      post: {
        summary: 'Create customer',
        responses: { '201': { description: 'Customer created' } },
      },
    },
    '/customers/{id}': {
      patch: {
        summary: 'Update customer',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { '200': { description: 'Customer updated' } },
      },
    },
    '/vendors': {
      get: { summary: 'List vendors', responses: { '200': { description: 'Vendors' } } },
      post: { summary: 'Create vendor', responses: { '201': { description: 'Vendor created' } } },
    },
    '/vendors/{id}': {
      patch: {
        summary: 'Update vendor',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { '200': { description: 'Vendor updated' } },
      },
    },
    '/products': {
      get: { summary: 'List active products', responses: { '200': { description: 'Products' } } },
      post: { summary: 'Create product', responses: { '201': { description: 'Product created' } } },
    },
    '/products/{id}': {
      patch: {
        summary: 'Update product with field audit',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { '200': { description: 'Product updated' } },
      },
    },
    '/products/{id}/adjust-stock': {
      post: {
        summary: 'Manual stock adjustment',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { '200': { description: 'Stock adjusted' } },
      },
    },
    '/dashboard/summary': {
      get: {
        summary: 'Business-wide dashboard counters',
        responses: { '200': { description: 'Dashboard summary' } },
      },
    },
    '/dashboard/role-summary': {
      get: {
        summary: 'Role-specific dashboard counters',
        responses: { '200': { description: 'Role summary' } },
      },
    },
    '/sales-orders': {
      get: { summary: 'List sales orders', responses: { '200': { description: 'Sales orders' } } },
      post: {
        summary: 'Create draft sales order',
        responses: { '201': { description: 'Sales order created' } },
      },
    },
    '/sales-orders/{id}': {
      get: {
        summary: 'Get sales order detail',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { '200': { description: 'Sales order detail' } },
      },
    },
    '/sales-orders/{id}/confirm': {
      patch: {
        summary: 'Confirm sales order, reserve stock, auto-create procurement',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { '200': { description: 'Sales order confirmed' } },
      },
    },
    '/sales-orders/{id}/deliver': {
      patch: {
        summary: 'Deliver sales order lines',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { '200': { description: 'Sales order delivered' } },
      },
    },
    '/purchase-orders': {
      get: {
        summary: 'List purchase orders',
        responses: { '200': { description: 'Purchase orders' } },
      },
      post: {
        summary: 'Create purchase order',
        responses: { '201': { description: 'Purchase order created' } },
      },
    },
    '/purchase-orders/{id}/confirm': {
      patch: {
        summary: 'Confirm purchase order',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { '200': { description: 'Purchase order confirmed' } },
      },
    },
    '/purchase-orders/{id}/receive': {
      patch: {
        summary: 'Receive purchase order lines and write stock ledger',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { '200': { description: 'Purchase order received' } },
      },
    },
    '/bom': {
      get: { summary: 'List BoMs', responses: { '200': { description: 'BoMs' } } },
      post: { summary: 'Create BoM', responses: { '201': { description: 'BoM created' } } },
    },
    '/manufacturing-orders': {
      get: {
        summary: 'List manufacturing orders',
        responses: { '200': { description: 'Manufacturing orders' } },
      },
      post: {
        summary: 'Create manufacturing order from BoM',
        responses: { '201': { description: 'Manufacturing order created' } },
      },
    },
    '/manufacturing-orders/{id}/confirm': {
      patch: {
        summary: 'Confirm manufacturing order',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { '200': { description: 'Manufacturing order confirmed' } },
      },
    },
    '/manufacturing-orders/{id}/start': {
      patch: {
        summary: 'Start manufacturing order',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { '200': { description: 'Manufacturing order started' } },
      },
    },
    '/manufacturing-orders/{id}/complete': {
      patch: {
        summary: 'Complete manufacturing order, consume components, produce finished good',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { '200': { description: 'Manufacturing order completed' } },
      },
    },
    '/inventory/summary': {
      get: {
        summary: 'Inventory balances with reserved and available stock',
        responses: { '200': { description: 'Inventory summary' } },
      },
    },
    '/inventory/movements': {
      get: {
        summary: 'Stock movement ledger',
        responses: { '200': { description: 'Stock movements' } },
      },
    },
    '/inventory/reconciliation': {
      get: {
        summary: 'Compare product on-hand quantity with stock movement ledger sum',
        responses: { '200': { description: 'Ledger reconciliation' } },
      },
    },
    '/traceability/sales-order/{id}': {
      get: {
        summary:
          'Trace sales order to triggered PO/MO, reservations, stock movements, and audit logs',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { '200': { description: 'Traceability chain' } },
      },
    },
    '/audit-logs': {
      get: { summary: 'List audit logs', responses: { '200': { description: 'Audit logs' } } },
    },
    '/notifications': {
      get: {
        summary: 'List unread notifications',
        responses: { '200': { description: 'Notifications' } },
      },
    },
    '/notifications/{id}/read': {
      patch: {
        summary: 'Mark notification as read',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { '200': { description: 'Notification marked read' } },
      },
    },
  },
};
