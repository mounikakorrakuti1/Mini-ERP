import { useState, useEffect } from 'react';
import { useDb } from '@/store/db.store';
import { api } from '@/lib/api';
import { BookOpen, Search } from 'lucide-react';

type Movement = {
  id: string;
  createdAt: string;
  productId: string;
  direction: 'IN' | 'OUT';
  quantity: number;
  sourceType: 'ADJUSTMENT' | 'SO' | 'PO' | 'MO';
  sourceReference: string;
  performedBy: string;
  reason: string;
  balance?: number;
};

export default function InventoryLedgerPage() {
  const { products } = useDb();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Filters ───────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [productFilter, setProductFilter] = useState('ALL');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/inventory/movements');
        setMovements(res.data.data || []);
      } catch { } finally { setIsLoading(false); }
    };
    load();
  }, []);

  const filtered = movements.filter(m => {
    const product = products.find(p => p.id === m.productId);
    const matchSearch = (product?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.sourceReference || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.reason || '').toLowerCase().includes(search.toLowerCase());
    const matchProduct = productFilter === 'ALL' || m.productId === productFilter;
    const matchModule = moduleFilter === 'ALL' || m.sourceType === moduleFilter;
    const date = new Date(m.createdAt);
    const matchFrom = !dateFrom || date >= new Date(dateFrom);
    const matchTo = !dateTo || date <= new Date(dateTo + 'T23:59:59');
    return matchSearch && matchProduct && matchModule && matchFrom && matchTo;
  });

  const getModuleColor = (type: string) => {
    switch (type) {
      case 'SO': return { bg: 'rgba(139,92,246,0.1)', color: '#8b5cf6' };
      case 'PO': return { bg: 'rgba(221,107,32,0.1)', color: 'var(--status-warning)' };
      case 'MO': return { bg: 'rgba(56,161,105,0.1)', color: 'var(--status-success)' };
      case 'ADJUSTMENT': return { bg: 'rgba(3,105,161,0.1)', color: 'var(--accent-main)' };
      default: return { bg: 'var(--bg-app)', color: 'var(--text-muted)' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* Header */}
      <div>
        <h1 className="h1" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
          <BookOpen size={28} color="var(--accent-main)" /> Inventory Ledger
        </h1>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Full audit trail of all stock IN/OUT movements</p>
      </div>

      {/* Filters */}
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', alignItems: 'center', padding: 'var(--space-sm) var(--space-md)' }}>
        <div className="input-field" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', flex: 1, minWidth: '200px', padding: '0.4rem var(--space-sm)' }}>
          <Search size={16} color="var(--text-muted)" />
          <input type="text" placeholder="Search reference, product, reason..." value={search} onChange={e => setSearch(e.target.value)} style={{ border: 'none', width: '100%', outline: 'none', background: 'transparent' }} />
        </div>
        <select className="input-field" value={productFilter} onChange={e => setProductFilter(e.target.value)} style={{ appearance: 'auto', padding: '0.4rem var(--space-sm)', minWidth: '160px' }}>
          <option value="ALL">All Products</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className="input-field" value={moduleFilter} onChange={e => setModuleFilter(e.target.value)} style={{ appearance: 'auto', padding: '0.4rem var(--space-sm)', minWidth: '130px' }}>
          <option value="ALL">All Modules</option>
          <option value="SO">Sales Orders</option>
          <option value="PO">Purchase Orders</option>
          <option value="MO">Manufacturing</option>
          <option value="ADJUSTMENT">Adjustment</option>
        </select>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <input className="input-field" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding: '0.4rem var(--space-sm)' }} />
          <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>to</span>
          <input className="input-field" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding: '0.4rem var(--space-sm)' }} />
        </div>
        {(search || productFilter !== 'ALL' || moduleFilter !== 'ALL' || dateFrom || dateTo) && (
          <button className="btn btn--outline" style={{ fontSize: 'var(--text-xs)', padding: '0.4rem var(--space-sm)' }} onClick={() => { setSearch(''); setProductFilter('ALL'); setModuleFilter('ALL'); setDateFrom(''); setDateTo(''); }}>
            Clear Filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflowX: 'auto', border: '1px solid var(--border-main)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-main)', backgroundColor: 'var(--bg-app)' }}>
              {['Date', 'Product', 'Reference', 'Transaction Type', 'Qty In', 'Qty Out', 'User / Reason'].map(h => (
                <th key={h} style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)', textAlign: ['Qty In', 'Qty Out'].includes(h) ? 'right' : 'left', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} style={{ padding: 'var(--space-lg)', textAlign: 'center', color: 'var(--text-muted)' }}>Loading ledger...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 'var(--space-lg)', textAlign: 'center', color: 'var(--text-muted)' }}>No movements found.</td></tr>
            ) : (
              filtered.map(m => {
                const product = products.find(p => p.id === m.productId);
                const modStyle = getModuleColor(m.sourceType);
                return (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--border-main)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-app)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: 'var(--text-xs)', whiteSpace: 'nowrap' }}>
                      {new Date(m.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                      <div>{product?.name ?? 'Unknown'}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{product?.code}</div>
                    </td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: 'var(--text-xs)', fontFamily: 'monospace', color: 'var(--accent-main)' }}>
                      {m.sourceReference || '—'}
                    </td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: 'var(--text-xs)', fontWeight: 600, backgroundColor: modStyle.bg, color: modStyle.color }}>{m.sourceType}</span>
                    </td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: m.direction === 'IN' ? 'var(--status-success)' : 'transparent', fontSize: 'var(--text-sm)' }}>
                      {m.direction === 'IN' ? `+${m.quantity}` : ''}
                    </td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: m.direction === 'OUT' ? 'var(--status-danger)' : 'transparent', fontSize: 'var(--text-sm)' }}>
                      {m.direction === 'OUT' ? `-${m.quantity}` : ''}
                    </td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                      <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>{m.performedBy}</div>
                      <div>{m.reason}</div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textAlign: 'right' }}>
        Showing {filtered.length} of {movements.length} movements
      </div>
    </div>
  );
}
