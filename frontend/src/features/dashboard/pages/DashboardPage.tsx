import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { useDb } from '@/store/db.store';
import { api } from '@/lib/api';
import { ROUTES } from '@/routes/routeMap';
import {
  Package, ShoppingCart, Truck, Factory, AlertTriangle, Plus,
  TrendingUp, BarChart2, ClipboardList, Wrench
} from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { products } = useDb();
  const [salesOrders, setSalesOrders] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [manufacturingOrders, setManufacturingOrders] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [soRes, poRes, moRes] = await Promise.all([
          api.get('/sales-orders'),
          api.get('/purchase-orders'),
          api.get('/manufacturing-orders'),
        ]);
        setSalesOrders(soRes.data.data || []);
        setPurchaseOrders(poRes.data.data || []);
        setManufacturingOrders(moRes.data.data || []);
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
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{p.code}</div>
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
    </div>
  );
}
