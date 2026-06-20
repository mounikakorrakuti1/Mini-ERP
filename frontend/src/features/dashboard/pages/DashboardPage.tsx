import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { hasPermission } from '@/lib/permissions';
import { MODULE, PERMISSION_ACTION } from '@/types/enums';
import { useDb } from '@/store/db.store';
import { ROLE } from '@/types/enums';
import type { Role } from '@/types/enums';
import {
  TrendingUp, TrendingDown, Users, ShoppingCart, Truck, Factory,
  ShieldCheck, AlertTriangle, Activity, CheckCircle, Package, ArrowUpRight, ArrowDownRight, Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes/routeMap';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { products, stockMovements } = useDb();

  // ─── Dynamic Metrics derived from DB Store ───────────────────────
  const lowStockCount = products.filter((p) => p.freeToUse < p.reorderPoint).length;
  const recentMovements = stockMovements.slice(0, 5); // Last 5 movements for live feed
  const rawMaterialsCount = products.filter((p) => p.category === 'Raw Material').length;
  const finishedGoodsCount = products.filter((p) => p.category === 'Finished Good').length;

  // Let's check for any inventory ledger reconciliation issues:
  // Math check: On Hand - Reserved !== Free-to-Use (should not occur by design in our store, which is correct)
  const reconciliationMismatches = products.filter((p) => p.onHand - p.reserved !== p.freeToUse);

  // Active metrics counters
  const metrics = [
    { label: 'Low Stock Products', value: lowStockCount.toString(), trend: lowStockCount > 0 ? 'Action required' : 'Optimal', isPositive: lowStockCount === 0, icon: AlertTriangle, color: lowStockCount > 0 ? 'var(--status-danger)' : 'var(--status-success)' },
    { label: 'Raw SKU Materials', value: rawMaterialsCount.toString(), trend: 'Active in ledger', isPositive: true, icon: Package, color: 'var(--accent-main)' },
    { label: 'Finished Goods catalog', value: finishedGoodsCount.toString(), trend: 'Active in catalog', isPositive: true, icon: Factory, color: '#8b5cf6' },
    { label: 'Total Stock Actions', value: stockMovements.length.toString(), trend: 'Movements logged', isPositive: true, icon: Activity, color: 'var(--status-success)' },
  ];

  return (
    <div className="dashboard" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
        <div>
          <h1 className="h1">Dashboard Overview</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Welcome back, <strong>{user?.name}</strong>. Position: <strong>{user?.position || 'Staff'}</strong>.
          </p>
        </div>
      </div>

      {/* KPI Counters Grid -> .cardBox */}
      <div className="cardBox">
        {metrics.map((metric) => (
          <div key={metric.label} className="card">
            <div>
              <div className="numbers">{metric.value}</div>
              <div className="cardName">{metric.label}</div>
            </div>
            <div className="iconBx">
              <metric.icon size={48} />
            </div>
          </div>
        ))}
      </div>

      {/* ─── ROLE BASED WIDGETS SECTION ───────────────────────────────── */}

      {/* 1. ADMIN DASHBOARD VIEW */}
      {hasPermission(user?.permissions, MODULE.AUDIT_LOGS, PERMISSION_ACTION.VIEW) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* Reconciliation Health Banner */}
          {reconciliationMismatches.length === 0 ? (
            <div
              className="card"
              style={{
                backgroundColor: 'rgba(56, 161, 105, 0.08)',
                border: '1px solid var(--status-success)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-sm)',
                padding: 'var(--space-sm) var(--space-md)',
              }}
            >
              <CheckCircle size={20} color="var(--status-success)" />
              <div>
                <strong style={{ color: 'var(--status-success)' }}>Reconciliation Health: PASS</strong>
                <p className="text-xs" style={{ marginTop: '2px' }}>
                  Standard mathematical constraints hold true. All product ledgers reconciled: 0 discrepancies detected.
                </p>
              </div>
            </div>
          ) : (
            <div
              className="card"
              style={{
                backgroundColor: 'rgba(229, 62, 62, 0.08)',
                border: '1px solid var(--status-danger)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-sm)',
                padding: 'var(--space-sm) var(--space-md)',
              }}
            >
              <AlertTriangle size={20} color="var(--status-danger)" />
              <div>
                <strong style={{ color: 'var(--status-danger)' }}>Ledger Reconciliation Mismatch Alert!</strong>
                <p className="text-xs" style={{ marginTop: '2px' }}>
                  {reconciliationMismatches.length} products fail the standard constraint: On Hand - Reserved !== Free-to-Use.
                </p>
              </div>
            </div>
          )}

          <div className="details">
            {/* Active Users By Role Widget */}
            <div className="card">
              <h3 className="h3" style={{ borderBottom: '1px solid var(--border-main)', paddingBottom: 'var(--space-xs)', marginBottom: 'var(--space-sm)' }}>
                Active Users By Role
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                {[
                  { role: 'Administrator', count: 1, active: 'admin001 (Admin User)' },
                  { role: 'Business Owner', count: 1, active: 'owner001 (Owner)' },
                  { role: 'Inventory Manager', count: 2, active: 'inv001 (Shelf Stocker)' },
                  { role: 'Sales Representatives', count: 3, active: 'sales002 (Representative)' },
                  { role: 'Manufacturing Assignees', count: 4, active: 'mfg001 (Operator)' },
                ].map((u) => (
                  <div key={u.role} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--bg-app)' }}>
                    <div>
                      <div className="text-sm" style={{ fontWeight: 500 }}>{u.role}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Active: {u.active}</div>
                    </div>
                    <span className="kanban__badge">{u.count} active</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit Summary Tile */}
            <div className="card">
              <h3 className="h3" style={{ borderBottom: '1px solid var(--border-main)', paddingBottom: 'var(--space-xs)', marginBottom: 'var(--space-sm)' }}>
                System Status & Logs Summary
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>
                Quick metrics of recent system action logs.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-sm)' }}>
                <div style={{ padding: 'var(--space-sm)', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius)' }}>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Audit Log Entries</div>
                  <div className="h3" style={{ margin: '4px 0' }}>148</div>
                  <div className="text-xs" style={{ color: 'var(--status-success)' }}>Last 24h: +15 logs</div>
                </div>
                <div style={{ padding: 'var(--space-sm)', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius)' }}>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Active Session JWTs</div>
                  <div className="h3" style={{ margin: '4px 0' }}>1</div>
                  <div className="text-xs" style={{ color: 'var(--accent-main)' }}>Mock authentication</div>
                </div>
              </div>
              <button
                className="btn btn--outline w-full"
                onClick={() => navigate(ROUTES.AUDIT_LOGS)}
                style={{ marginTop: 'var(--space-sm)', width: '100%', justifyContent: 'center' }}
              >
                Go to System Audit Logs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. INVENTORY MANAGER DASHBOARD VIEW */}
      {hasPermission(user?.permissions, MODULE.INVENTORY, PERMISSION_ACTION.ADMIN) && !hasPermission(user?.permissions, MODULE.AUDIT_LOGS, PERMISSION_ACTION.VIEW) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-md)' }}>
          {/* Main layout */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-md)' }}>
            {/* Low Stock Alerts list */}
            <div className="card">
              <h3 className="h3" style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid var(--border-main)', paddingBottom: 'var(--space-xs)', marginBottom: 'var(--space-sm)' }}>
                <AlertTriangle size={18} color="var(--status-danger)" />
                Low Stock Alerts ({lowStockCount})
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-xs)' }}>
                The following products require replenishment (Free-to-Use is below safety reorder threshold):
              </p>
              <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                {products.filter(p => p.freeToUse < p.reorderPoint).length === 0 ? (
                  <div className="text-xs" style={{ padding: 'var(--space-sm)', color: 'var(--status-success)', textAlign: 'center' }}>
                    All products are within healthy stock levels.
                  </div>
                ) : (
                  products.filter(p => p.freeToUse < p.reorderPoint).map(p => (
                    <div
                      key={p.id}
                      onClick={() => navigate(ROUTES.PRODUCTS + '/' + p.id)}
                      style={{
                        padding: 'var(--space-xs)',
                        border: '1px solid var(--border-main)',
                        borderRadius: 'var(--radius)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-app)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <div>
                        <div className="text-sm" style={{ fontWeight: 500 }}>{p.name}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>SKU: {p.code} | Reorder ROP: {p.reorderPoint}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="text-sm font-semibold" style={{ color: 'var(--status-danger)' }}>Free: {p.freeToUse}</div>
                        <div className="text-xs">On Hand: {p.onHand}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <button
                className="btn btn--outline w-full"
                onClick={() => navigate(ROUTES.INVENTORY_SUMMARY)}
                style={{ marginTop: 'var(--space-sm)', width: '100%', justifyContent: 'center' }}
              >
                Go to Inventory Summary
              </button>
            </div>

            {/* Live Stock Movement Feed */}
            <div className="card">
              <h3 className="h3" style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid var(--border-main)', paddingBottom: 'var(--space-xs)', marginBottom: 'var(--space-sm)' }}>
                <Clock size={18} color="var(--accent-main)" />
                Live Stock Movement Feed
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-xs)' }}>
                Real-time stock logs feed from warehouse transactions:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                {recentMovements.map((m) => {
                  const product = products.find((p) => p.id === m.productId);
                  return (
                    <div
                      key={m.id}
                      style={{
                        padding: '6px var(--space-xs)',
                        borderBottom: '1px solid var(--border-main)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div className="text-xs" style={{ fontWeight: 600 }}>{product?.name ?? 'Product'}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {m.sourceType} {m.sourceReference} | {m.reason}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span
                          className="text-xs font-semibold"
                          style={{
                            color: m.direction === 'IN' ? 'var(--status-success)' : 'var(--status-danger)',
                            backgroundColor: m.direction === 'IN' ? 'rgba(56, 161, 105, 0.1)' : 'rgba(229, 62, 62, 0.1)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          {m.direction === 'IN' ? '+' : '-'}{m.quantity}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                className="btn btn--outline w-full"
                onClick={() => navigate(ROUTES.INVENTORY_LEDGER)}
                style={{ marginTop: 'var(--space-sm)', width: '100%', justifyContent: 'center' }}
              >
                Go to Stock Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. BUSINESS OWNER DASHBOARD VIEW */}
      {hasPermission(user?.permissions, MODULE.VENDORS, PERMISSION_ACTION.VIEW) && hasPermission(user?.permissions, MODULE.PRODUCTS, PERMISSION_ACTION.ADMIN) && !hasPermission(user?.permissions, MODULE.AUDIT_LOGS, PERMISSION_ACTION.VIEW) && !hasPermission(user?.permissions, MODULE.INVENTORY, PERMISSION_ACTION.ADMIN) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-md)' }}>
            
            {/* Material Shortage Watch */}
            <div className="card">
              <h3 className="h3" style={{ borderBottom: '1px solid var(--border-main)', paddingBottom: 'var(--space-xs)', marginBottom: 'var(--space-sm)' }}>
                Material Shortage Watch
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>
                Watchlist of critical materials in short supply based on demand signals:
              </p>
              {products.filter(p => p.freeToUse < p.reorderPoint).length === 0 ? (
                <div className="text-sm" style={{ padding: 'var(--space-md)', color: 'var(--status-success)', textAlign: 'center' }}>
                  No materials reporting shortages. Catalog is healthy.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                  {products.filter(p => p.freeToUse < p.reorderPoint).slice(0, 3).map(p => (
                    <div key={p.id} style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', padding: 'var(--space-xs) 0', borderBottom: '1px solid var(--bg-app)' }}>
                      <div>
                        <div className="text-sm" style={{ fontWeight: 500 }}>{p.name}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Suggested action: Trigger {p.procurementType || 'Purchase'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className="text-xs font-semibold" style={{ color: 'var(--status-danger)', backgroundColor: 'rgba(229, 62, 62, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                          Shortage: {p.reorderPoint - p.freeToUse} units
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Delay Watch / Efficiency widget */}
            <div className="card">
              <h3 className="h3" style={{ borderBottom: '1px solid var(--border-main)', paddingBottom: 'var(--space-xs)', marginBottom: 'var(--space-sm)' }}>
                Operations Efficiency
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>
                Key operational metrics across departments.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', marginBottom: '2px' }}>
                    <span>Manufacturing Execution Efficiency</span>
                    <strong>94%</strong>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-main)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '94%', height: '100%', backgroundColor: 'var(--status-success)' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', marginBottom: '2px' }}>
                    <span>Vendor Supplier On-Time Rate</span>
                    <strong>88%</strong>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-main)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '88%', height: '100%', backgroundColor: 'var(--accent-main)' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', marginBottom: '2px' }}>
                    <span>Sales Orders Fulfillment Rate</span>
                    <strong>97%</strong>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-main)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '97%', height: '100%', backgroundColor: 'var(--status-success)' }} />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 4. DEFAULT COMPLEMENTARY MSG FOR SPECIALIZED OPERATIONAL USERS */}
      {(!hasPermission(user?.permissions, MODULE.AUDIT_LOGS, PERMISSION_ACTION.VIEW) && !hasPermission(user?.permissions, MODULE.INVENTORY, PERMISSION_ACTION.ADMIN) && !hasPermission(user?.permissions, MODULE.PRODUCTS, PERMISSION_ACTION.ADMIN)) && (
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: 'var(--space-md)' }}>
          <Users size={24} color="var(--accent-main)" />
          <div>
            <h4 className="text-md">Operational Workflow View</h4>
            <p className="text-xs" style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
              Your account is assigned to specialized transactional screens. You can review core catalog listings in the sidebar.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
