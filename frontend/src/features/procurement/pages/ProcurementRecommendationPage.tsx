import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDb } from '@/store/db.store';
import { api } from '@/lib/api';
import { ROUTES } from '@/routes/routeMap';
import { Workflow, Plus, RefreshCw, ShoppingCart, Factory } from 'lucide-react';

export default function ProcurementRecommendationPage() {
  const navigate = useNavigate();
  const { products, refreshData } = useDb();
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const alerts = products
    .filter(p => p.freeToUse < p.reorderPoint)
    .filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase());
      const matchMethod = methodFilter === 'ALL' || (p.procurementType || 'PURCHASE') === methodFilter || (!p.procurementType && methodFilter === 'PURCHASE');
      return matchSearch && matchMethod;
    })
    .map(p => ({
      ...p,
      suggestedQty: Math.max(p.reorderPoint - p.freeToUse, 1),
      method: p.procurementType || (p.procureOnDemand ? 'PURCHASE' : 'PURCHASE'),
    }));

  const handleGeneratePO = async (productId: string, vendorId?: string) => {
    setLoadingId(productId);
    try {
      await api.post('/purchase-orders', {
        vendorId: vendorId || null,
        items: [{ productId, orderedQty: alerts.find(a => a.id === productId)?.suggestedQty || 1 }],
      });
      navigate(ROUTES.PURCHASE_ORDERS);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to create PO. Please create manually.');
      navigate(ROUTES.PURCHASE_ORDER_CREATE);
    } finally {
      setLoadingId(null);
    }
  };

  const handleGenerateMO = async (productId: string, bomId?: string) => {
    setLoadingId(productId);
    try {
      await api.post('/manufacturing-orders', {
        finishedProductId: productId,
        bomId: bomId || null,
        plannedQty: alerts.find(a => a.id === productId)?.suggestedQty || 1,
      });
      navigate(ROUTES.MANUFACTURING_ORDERS);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to create MO. Please create manually.');
      navigate(ROUTES.MANUFACTURING_ORDER_CREATE);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
        <div>
          <h1 className="h1" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
            <Workflow size={28} color="var(--accent-main)" /> Procurement Recommendations
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            Products where <strong>Free to Use &lt; Reorder Point</strong> — auto-generate PO or MO to replenish
          </p>
        </div>
        <button className="btn btn--outline" onClick={() => refreshData()} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-sm)' }}>
        {[
          { label: 'Needs Attention', value: products.filter(p => p.freeToUse < p.reorderPoint).length, color: 'var(--status-danger)' },
          { label: 'Via Purchase', value: products.filter(p => p.freeToUse < p.reorderPoint && (!p.procurementType || p.procurementType === 'PURCHASE')).length, color: 'var(--status-warning)' },
          { label: 'Via Manufacturing', value: products.filter(p => p.freeToUse < p.reorderPoint && p.procurementType === 'MANUFACTURING').length, color: 'var(--status-success)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center', padding: 'var(--space-sm) var(--space-md)', flexWrap: 'wrap' }}>
        <input className="input-field" placeholder="Search product..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: '0.4rem var(--space-sm)', flex: 1, minWidth: '200px' }} />
        <select className="input-field" value={methodFilter} onChange={e => setMethodFilter(e.target.value)} style={{ appearance: 'auto', padding: '0.4rem var(--space-sm)', minWidth: '160px' }}>
          <option value="ALL">All Methods</option>
          <option value="PURCHASE">Purchase Only</option>
          <option value="MANUFACTURING">Manufacturing Only</option>
        </select>
        <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
          <button className="btn btn--primary" onClick={() => navigate(ROUTES.PURCHASE_ORDER_CREATE)} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-sm)' }}>
            <Plus size={14} /> New PO
          </button>
          <button className="btn btn--primary" onClick={() => navigate(ROUTES.MANUFACTURING_ORDER_CREATE)} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-sm)', backgroundColor: 'var(--status-success)' }}>
            <Plus size={14} /> New MO
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflowX: 'auto', border: '1px solid var(--border-main)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '750px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-main)', backgroundColor: 'var(--bg-app)' }}>
              {['Product', 'Current Stock (Free to Use)', 'Reorder Point', 'Suggested Qty', 'Procurement Method', 'Actions'].map(h => (
                <th key={h} style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)', whiteSpace: 'nowrap', textAlign: h === 'Actions' ? 'right' : 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {alerts.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--status-success)', fontSize: 'var(--text-sm)' }}>
                  ✅ All products are within healthy reorder thresholds. No procurement action needed.
                </td>
              </tr>
            ) : (
              alerts.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border-main)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-app)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}>
                  <td style={{ padding: 'var(--space-xs) var(--space-sm)' }}>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{p.name}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.code}</div>
                  </td>
                  <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 700, color: p.freeToUse <= 0 ? 'var(--status-danger)' : 'var(--status-warning)', fontFamily: 'monospace', fontSize: 'var(--text-sm)' }}>
                    {p.freeToUse} {p.freeToUse <= 0 ? '⚠ Out' : ''}
                  </td>
                  <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontFamily: 'monospace', fontSize: 'var(--text-sm)' }}>{p.reorderPoint}</td>
                  <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 700, fontFamily: 'monospace', fontSize: 'var(--text-sm)', color: 'var(--accent-main)' }}>{p.suggestedQty}</td>
                  <td style={{ padding: 'var(--space-xs) var(--space-sm)' }}>
                    <span style={{ padding: '2px 10px', borderRadius: '9999px', fontSize: 'var(--text-xs)', fontWeight: 600, backgroundColor: p.method === 'MANUFACTURING' ? 'rgba(56,161,105,0.1)' : 'rgba(221,107,32,0.1)', color: p.method === 'MANUFACTURING' ? 'var(--status-success)' : 'var(--status-warning)' }}>
                      {p.method}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-xs) var(--space-sm)', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                      <button
                        disabled={loadingId === p.id}
                        className="btn btn--outline"
                        style={{ fontSize: 'var(--text-xs)', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => handleGeneratePO(p.id, p.defaultVendorId)}
                      >
                        <ShoppingCart size={12} /> Generate PO
                      </button>
                      <button
                        disabled={loadingId === p.id}
                        className="btn btn--outline"
                        style={{ fontSize: 'var(--text-xs)', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--status-success)', borderColor: 'var(--status-success)' }}
                        onClick={() => handleGenerateMO(p.id, p.defaultBomId)}
                      >
                        <Factory size={12} /> Generate MO
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
  );
}
