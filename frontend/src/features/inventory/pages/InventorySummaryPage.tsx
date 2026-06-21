import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDb } from '@/store/db.store';
import { api } from '@/lib/api';
import { ROUTES } from '@/routes/routeMap';
import { Package, AlertTriangle, Plus, Calculator, RefreshCw } from 'lucide-react';

export default function InventorySummaryPage() {
  const navigate = useNavigate();
  const { products, refreshData, isLoading } = useDb();

  // ── Calculator State ────────────────────────────────────────────
  const [adu, setAdu] = useState('');
  const [leadTime, setLeadTime] = useState('');
  const [mdu, setMdu] = useState('');
  const [delay, setDelay] = useState('');

  const aduN = parseFloat(adu) || 0;
  const leadTimeN = parseFloat(leadTime) || 0;
  const mduN = parseFloat(mdu) || 0;
  const delayN = parseFloat(delay) || 0;
  const maxLeadTime = leadTimeN + delayN;
  const safetyStock = mduN * maxLeadTime - aduN * leadTimeN;
  const rop = aduN * leadTimeN + safetyStock;
  const hasCalc = aduN > 0 && leadTimeN > 0;

  // ── Filter ───────────────────────────────────────────────────────
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'LOW' | 'OUT' | 'OK'>('ALL');
  const [search, setSearch] = useState('');

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.reference.toLowerCase().includes(search.toLowerCase());
    const isLow = p.freeToUse > 0 && p.freeToUse < p.reorderPoint;
    const isOut = p.freeToUse <= 0;
    if (filterStatus === 'LOW') return matchSearch && isLow;
    if (filterStatus === 'OUT') return matchSearch && isOut;
    if (filterStatus === 'OK') return matchSearch && !isLow && !isOut;
    return matchSearch;
  });

  const getStatus = (p: typeof products[0]) => {
    if (p.freeToUse <= 0) return { label: 'Out of Stock', color: 'var(--status-danger)', bg: 'rgba(229,62,62,0.1)' };
    if (p.freeToUse < p.reorderPoint) return { label: 'Low Stock', color: 'var(--status-warning)', bg: 'rgba(221,107,32,0.1)' };
    return { label: 'Healthy', color: 'var(--status-success)', bg: 'rgba(56,161,105,0.1)' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
        <div>
          <h1 className="h1" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
            <Package size={28} color="var(--accent-main)" /> Inventory Summary
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Stock levels across all SKUs</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
          <button className="btn btn--outline" onClick={() => refreshData()} disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="btn btn--primary" onClick={() => navigate(ROUTES.PROCUREMENT_INBOX)} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Plus size={14} /> Generate Procurement
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-sm)' }}>
        {[
          { label: 'Total SKUs', value: products.length, color: 'var(--accent-main)' },
          { label: 'Healthy', value: products.filter(p => p.freeToUse >= p.reorderPoint).length, color: 'var(--status-success)' },
          { label: 'Low Stock', value: products.filter(p => p.freeToUse > 0 && p.freeToUse < p.reorderPoint).length, color: 'var(--status-warning)' },
          { label: 'Out of Stock', value: products.filter(p => p.freeToUse <= 0).length, color: 'var(--status-danger)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Safety Stock / ROP Calculator ── */}
      <div className="card">
        <h2 className="h3" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)', borderBottom: '1px solid var(--border-main)', paddingBottom: 'var(--space-xs)' }}>
          <Calculator size={18} color="var(--accent-main)" /> Safety Stock & ROP Calculator
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            <h4 className="text-md" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Inputs</h4>
            {[
              { label: 'ADU — Avg. Daily Usage (units/day)', value: adu, setter: setAdu, placeholder: 'e.g. 5' },
              { label: 'Lead Time (days)', value: leadTime, setter: setLeadTime, placeholder: 'e.g. 7' },
              { label: 'MDU — Max Daily Usage (units/day)', value: mdu, setter: setMdu, placeholder: 'e.g. 8' },
              { label: 'Max Lead Time Delay (days)', value: delay, setter: setDelay, placeholder: 'e.g. 3' },
            ].map(f => (
              <div key={f.label} className="input-group">
                <label className="input-label" style={{ fontSize: 'var(--text-xs)' }}>{f.label}</label>
                <input className="input-field" type="number" min="0" step="0.1" placeholder={f.placeholder} value={f.value} onChange={e => f.setter(e.target.value)} style={{ padding: '0.4rem var(--space-sm)' }} />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            <h4 className="text-md" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Outputs</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
              {[
                { label: 'Max Lead Time', formula: `${leadTimeN} + ${delayN} days`, value: maxLeadTime },
                { label: 'Safety Stock', formula: `(MDU × Max LT) − (ADU × LT)`, value: safetyStock },
                { label: 'Reorder Point (ROP)', formula: `(ADU × LT) + Safety Stock`, value: rop },
              ].map(o => (
                <div key={o.label} style={{ padding: 'var(--space-sm)', borderRadius: '8px', border: '1px solid var(--border-main)', backgroundColor: 'var(--bg-app)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{o.label}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 'var(--text-xs)', color: 'var(--accent-main)', margin: '2px 0' }}>{o.formula}</div>
                  <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: hasCalc ? 'var(--text-main)' : 'var(--text-muted)' }}>
                    {hasCalc ? o.value.toFixed(1) : '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="input-field" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: '0.4rem var(--space-sm)', flex: 1, minWidth: '200px' }} />
        {(['ALL', 'OK', 'LOW', 'OUT'] as const).map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: '6px 14px', borderRadius: '20px', fontWeight: 500, fontSize: 'var(--text-sm)', cursor: 'pointer', border: filterStatus === s ? '2px solid var(--accent-main)' : '1px solid var(--border-main)', backgroundColor: filterStatus === s ? 'var(--accent-main)' : 'var(--bg-surface)', color: filterStatus === s ? '#fff' : 'var(--text-main)', transition: 'all 0.15s' }}>
            {s === 'ALL' ? 'All' : s === 'OK' ? 'Healthy' : s === 'LOW' ? 'Low Stock' : 'Out of Stock'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflowX: 'auto', border: '1px solid var(--border-main)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-main)', backgroundColor: 'var(--bg-app)' }}>
              {['SKU', 'Product', 'On Hand', 'Reserved', 'Free to Use', 'Reorder Point', 'Status'].map(h => (
                <th key={h} style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)', textAlign: ['On Hand', 'Reserved', 'Free to Use', 'Reorder Point'].includes(h) ? 'right' : 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 'var(--space-lg)', textAlign: 'center', color: 'var(--text-muted)' }}>No products found.</td></tr>
            ) : (
              filtered.map(p => {
                const s = getStatus(p);
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-main)', cursor: 'pointer' }}
                    onClick={() => navigate(`${ROUTES.PRODUCTS}/${p.id}`)}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-app)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontFamily: 'monospace', fontSize: 'var(--text-sm)' }}>{p.reference}</td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 500, fontSize: 'var(--text-sm)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {p.name}
                        {p.freeToUse < p.reorderPoint && <AlertTriangle size={12} color="var(--status-warning)" />}
                      </div>
                    </td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', textAlign: 'right', fontFamily: 'monospace', fontSize: 'var(--text-sm)' }}>{p.onHand}</td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', textAlign: 'right', fontFamily: 'monospace', fontSize: 'var(--text-sm)', color: p.reserved > 0 ? 'var(--status-warning)' : 'inherit' }}>{p.reserved}</td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', textAlign: 'right', fontFamily: 'monospace', fontSize: 'var(--text-sm)', fontWeight: 700, color: p.freeToUse < p.reorderPoint ? 'var(--status-danger)' : 'var(--status-success)' }}>{p.freeToUse}</td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', textAlign: 'right', fontFamily: 'monospace', fontSize: 'var(--text-sm)' }}>{p.reorderPoint}</td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)' }}>
                      <span style={{ padding: '2px 10px', borderRadius: '9999px', fontSize: 'var(--text-xs)', fontWeight: 600, backgroundColor: s.bg, color: s.color }}>{s.label}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
