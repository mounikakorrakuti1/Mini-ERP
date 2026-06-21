import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { useDb } from '@/store/db.store';
import { hasPermission } from '@/lib/permissions';
import { MODULE, PERMISSION_ACTION } from '@/types/enums';
import { api } from '@/lib/api';
import { ROUTES } from '@/routes/routeMap';
import {
  TrendingUp, TrendingDown, Users, ShoppingCart, Truck, Factory,
  ShieldCheck, AlertTriangle, Activity, CheckCircle, Package, ArrowUpRight, ArrowDownRight, Clock,
  Plus, BarChart2, ClipboardList, Wrench
} from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { products } = useDb();
  const [salesOrders, setSalesOrders] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [manufacturingOrders, setManufacturingOrders] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [roleSummary, setRoleSummary] = useState<any>({});

  useEffect(() => {
    const load = async () => {
      try {
        const [soRes, poRes, moRes, sumRes, roleRes] = await Promise.all([
          api.get('/sales-orders'),
          api.get('/purchase-orders'),
          api.get('/manufacturing-orders'),
          api.get('/dashboard/summary'),
          api.get('/dashboard/role-summary'),
        ]);
        setSalesOrders(soRes.data.data || []);
        setPurchaseOrders(poRes.data.data || []);
        setManufacturingOrders(moRes.data.data || []);
        setSummary(sumRes.data.data || {});
        setRoleSummary(roleRes.data.data || {});
      } catch { /* silently handle */ }
    };
    load();
  }, []);

  // ── Inventory Stats ──────────────────────────────────────────────
  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.freeToUse > 0 && p.freeToUse < p.reorderPoint).length;
  const outOfStockProducts = products.filter(p => p.freeToUse <= 0).length;
  const totalInventoryValue = products.reduce((sum, p) => sum + p.onHand * p.costPrice, 0);

  // ── Sales Stats ──────────────────────────────────────────────────
  const draftSalesOrders = salesOrders.filter(o => o.status === 'DRAFT').length;
  const confirmedSalesOrders = salesOrders.filter(o => o.status === 'CONFIRMED').length;
  const deliveredSalesOrders = salesOrders.filter(o => o.status === 'DELIVERED' || o.status === 'COMPLETED').length;
  const totalRevenue = salesOrders
    .filter(o => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + (o.items?.reduce((s: number, i: any) => s + i.orderedQty * i.salesPrice, 0) || 0), 0);

  // ── Purchase Stats ───────────────────────────────────────────────
  const draftPOs = purchaseOrders.filter(o => o.status === 'DRAFT').length;
  const confirmedPOs = purchaseOrders.filter(o => o.status === 'CONFIRMED').length;
  const receivedPOs = purchaseOrders.filter(o => o.status === 'RECEIVED').length;

  // ── Manufacturing Stats ──────────────────────────────────────────
  const draftMOs = manufacturingOrders.filter(o => o.status === 'DRAFT').length;
  const inProgressMOs = manufacturingOrders.filter(o => o.status === 'IN_PROGRESS').length;
  const completedMOs = manufacturingOrders.filter(o => o.status === 'COMPLETED').length;

  // ── Procurement Alerts: low + out of stock ───────────────────────
  const procurementAlerts = products
    .filter(p => p.freeToUse < p.reorderPoint)
    .map(p => ({
      ...p,
      suggestedQty: Math.max(p.reorderPoint - p.freeToUse, 0),
    }));

  const SummaryCard = ({
    title, icon: Icon, iconColor, fields, onClick,
  }: {
    title: string;
    icon: any;
    iconColor: string;
    fields: { label: string; value: string | number; highlight?: boolean }[];
    onClick: () => void;
  }) => (
    <div
      className="card"
      onClick={onClick}
      style={{ cursor: 'pointer', transition: 'box-shadow 0.2s', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = '')}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', marginBottom: 'var(--space-xs)' }}>
        <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: `${iconColor}22`, display: 'flex', alignItems: 'center' }}>
          <Icon size={20} color={iconColor} />
        </div>
        <span style={{ fontWeight: 600, fontSize: 'var(--text-md)' }}>{title}</span>
      </div>
      {fields.map(f => (
        <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid var(--border-main)' }}>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{f.label}</span>
          <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: f.highlight ? 'var(--status-danger)' : 'var(--text-main)' }}>{f.value}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* Header */}
      <div>
        <h1 className="h1">Dashboard</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
          Welcome back, <strong>{user?.name}</strong>. Here's a snapshot of your operations.
        </p>
      </div>

      {/* 4 Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-md)' }}>
        <SummaryCard
          title="Inventory"
          icon={Package}
          iconColor="var(--accent-main)"
          onClick={() => navigate(ROUTES.INVENTORY_SUMMARY)}
          fields={[
            { label: 'Total Products', value: totalProducts },
            { label: 'Low Stock Products', value: lowStockProducts, highlight: lowStockProducts > 0 },
            { label: 'Out of Stock Products', value: outOfStockProducts, highlight: outOfStockProducts > 0 },
            { label: 'Total Inventory Value', value: `₹${totalInventoryValue.toLocaleString('en-IN')}` },
          ]}
        />
        <SummaryCard
          title="Sales"
          icon={ShoppingCart}
          iconColor="#8b5cf6"
          onClick={() => navigate(ROUTES.SALES_ORDERS)}
          fields={[
            { label: 'Draft Orders', value: draftSalesOrders },
            { label: 'Confirmed Orders', value: confirmedSalesOrders },
            { label: 'Delivered Orders', value: deliveredSalesOrders },
            { label: 'Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}` },
          ]}
        />
        <SummaryCard
          title="Purchase"
          icon={Truck}
          iconColor="var(--status-warning)"
          onClick={() => navigate(ROUTES.PURCHASE_ORDERS)}
          fields={[
            { label: 'Draft POs', value: draftPOs },
            { label: 'Confirmed POs', value: confirmedPOs },
            { label: 'Received POs', value: receivedPOs },
          ]}
        />
        <SummaryCard
          title="Manufacturing"
          icon={Factory}
          iconColor="var(--status-success)"
          onClick={() => navigate(ROUTES.MANUFACTURING_ORDERS)}
          fields={[
            { label: 'Draft MOs', value: draftMOs },
            { label: 'In Progress MOs', value: inProgressMOs },
            { label: 'Completed MOs', value: completedMOs },
          ]}
        />
      </div>

      {/* Procurement Alerts */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-md)', borderBottom: '1px solid var(--border-main)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
            <AlertTriangle size={18} color="var(--status-warning)" />
            <h2 className="h3">Procurement Alerts</h2>
            {procurementAlerts.length > 0 && (
              <span style={{ background: 'var(--status-danger)', color: '#fff', borderRadius: '9999px', padding: '2px 8px', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                {procurementAlerts.length}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
            <button className="btn btn--outline" onClick={() => navigate(ROUTES.PURCHASE_ORDER_CREATE)} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Plus size={14} /> Create PO
            </button>
            <button className="btn btn--outline" onClick={() => navigate(ROUTES.MANUFACTURING_ORDER_CREATE)} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Plus size={14} /> Create MO
            </button>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border-main)' }}>
                {['Product Name', 'Current Stock', 'Reorder Point', 'Suggested Quantity', 'Actions'].map(h => (
                  <th key={h} style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)', textAlign: h === 'Actions' ? 'right' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {procurementAlerts.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 'var(--space-lg)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                    ✅ All products are within healthy stock levels.
                  </td>
                </tr>
              ) : (
                procurementAlerts.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-main)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-app)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 500, fontSize: 'var(--text-sm)' }}>
                      <div>{p.name}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{p.reference}</div>
                    </td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: 'var(--text-sm)', color: p.freeToUse <= 0 ? 'var(--status-danger)' : 'var(--status-warning)', fontWeight: 600 }}>
                      {p.freeToUse} {p.freeToUse <= 0 ? '(Out)' : ''}
                    </td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: 'var(--text-sm)' }}>{p.reorderPoint}</td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--accent-main)' }}>{p.suggestedQty}</td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                        <button className="btn btn--outline" style={{ fontSize: 'var(--text-xs)', padding: '4px 10px' }} onClick={() => navigate(ROUTES.PURCHASE_ORDER_CREATE)}>
                          <Plus size={12} /> PO
                        </button>
                        <button className="btn btn--outline" style={{ fontSize: 'var(--text-xs)', padding: '4px 10px' }} onClick={() => navigate(ROUTES.MANUFACTURING_ORDER_CREATE)}>
                          <Plus size={12} /> MO
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Nav Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-sm)' }}>
        {[
          { label: 'Inventory Summary', icon: Package, route: ROUTES.INVENTORY_SUMMARY },
          { label: 'Inventory Ledger', icon: BarChart2, route: ROUTES.INVENTORY_LEDGER },
          { label: 'Procurement Inbox', icon: ClipboardList, route: ROUTES.PROCUREMENT_INBOX },
          { label: 'Analytics', icon: TrendingUp, route: ROUTES.ANALYTICS },
          { label: 'BOM', icon: Wrench, route: ROUTES.BOM_LIST },
          { label: 'Audit Logs', icon: ClipboardList, route: ROUTES.AUDIT_LOGS },
        ].map(item => (
          <button
            key={item.label}
            className="card"
            onClick={() => navigate(item.route)}
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', cursor: 'pointer', border: '1px solid var(--border-main)', background: 'var(--bg-surface)', textAlign: 'left', fontWeight: 500, fontSize: 'var(--text-sm)', transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-app)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-surface)')}
          >
            <item.icon size={16} color="var(--accent-main)" />
            {item.label}
          </button>
        ))}
      </div>

      {/* ─── ROLE BASED WIDGETS SECTION ───────────────────────────────── */}

      {/* 1. ADMIN DASHBOARD VIEW */}
      {hasPermission(user?.permissions, MODULE.AUDIT_LOGS, PERMISSION_ACTION.VIEW) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* Reconciliation Health Banner */}
          {summary.reconciliationStatus === 'HEALTHY' ? (
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
                  There are products that fail the standard constraint: On Hand - Reserved !== Free-to-Use.
                </p>
              </div>
            </div>
          )}

          <div className="details">
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
                  <div className="h3" style={{ margin: '4px 0' }}>{roleSummary?.admin?.totalAuditLogs || 0}</div>
                  <div className="text-xs" style={{ color: 'var(--status-success)' }}>Today: +{summary.auditEventsToday || 0} logs</div>
                </div>
                <div style={{ padding: 'var(--space-sm)', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius)' }}>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Active Products</div>
                  <div className="h3" style={{ margin: '4px 0' }}>{roleSummary?.admin?.activeProducts || 0}</div>
                  <div className="text-xs" style={{ color: 'var(--accent-main)' }}>Total managed</div>
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
                Low Stock Alerts ({summary.lowStockProducts?.length || 0})
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-xs)' }}>
                The following products require replenishment (Free-to-Use is below safety reorder threshold):
              </p>
              <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                {summary.lowStockProducts?.length === 0 ? (
                  <div className="text-xs" style={{ padding: 'var(--space-sm)', color: 'var(--status-success)', textAlign: 'center' }}>
                    All products are within healthy stock levels.
                  </div>
                ) : (
                  summary.lowStockProducts?.map((p: any) => (
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
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>SKU: {p.reference} | Reorder ROP: {p.reorderPoint}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="text-sm font-semibold" style={{ color: 'var(--status-danger)' }}>Free: {p.availableQty}</div>
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
          </div>
        </div>
      )}

      {/* 3. BUSINESS OWNER DASHBOARD VIEW */}
      {hasPermission(user?.permissions, MODULE.VENDORS, PERMISSION_ACTION.VIEW) && hasPermission(user?.permissions, MODULE.PRODUCTS, PERMISSION_ACTION.ADMIN) && !hasPermission(user?.permissions, MODULE.AUDIT_LOGS, PERMISSION_ACTION.VIEW) && !hasPermission(user?.permissions, MODULE.INVENTORY, PERMISSION_ACTION.ADMIN) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-md)' }}>
            
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
                    <span>Delayed Sales Orders</span>
                    <strong>{summary.delayedSalesOrders || 0}</strong>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', marginBottom: '2px' }}>
                    <span>Delayed Purchase Orders</span>
                    <strong>{summary.delayedPurchaseOrders || 0}</strong>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', marginBottom: '2px' }}>
                    <span>Manufacturing Throughput (Completed)</span>
                    <strong>{summary.manufacturingThroughput || 0}</strong>
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
