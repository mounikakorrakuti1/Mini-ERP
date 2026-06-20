import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { ROUTES } from '@/routes/routeMap';
import { Building2, Search, Phone, Mail, Eye, Plus, Package, Clock, TrendingUp } from 'lucide-react';

export default function VendorListPage() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [vendRes, poRes] = await Promise.all([
          api.get('/vendors'),
          api.get('/purchase-orders'),
        ]);
        setVendors(vendRes.data.data || []);
        setPurchaseOrders(poRes.data.data || []);
      } catch { } finally { setIsLoading(false); }
    };
    load();
  }, []);

  const filtered = vendors.filter(v =>
    (v.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.code || '').toLowerCase().includes(search.toLowerCase())
  );

  const getVendorOrders = (vId: string) => purchaseOrders.filter(o => o.vendorId === vId || o.vendor?.id === vId);
  const getTotalSpend = (vId: string) => getVendorOrders(vId)
    .filter(o => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + (o.items?.reduce((s: number, i: any) => s + (i.orderedQty || 0) * (i.costPrice || 0), 0) || 0), 0);
  const getOnTimeRate = (vId: string) => {
    const orders = getVendorOrders(vId).filter(o => o.status === 'RECEIVED');
    if (!orders.length) return null;
    const onTime = orders.filter(o => {
      if (!o.expectedDate || !o.receivedAt) return true;
      return new Date(o.receivedAt) <= new Date(o.expectedDate);
    }).length;
    return Math.round((onTime / orders.length) * 100);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
        <div>
          <h1 className="h1" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
            <Building2 size={28} color="var(--accent-main)" /> Vendors
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{vendors.length} registered vendors</p>
        </div>
        <button className="btn btn--primary" onClick={() => navigate(ROUTES.PURCHASE_ORDER_CREATE)} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Plus size={16} /> New Purchase Order
        </button>
      </div>

      {/* Search */}
      <div className="card" style={{ padding: 'var(--space-sm) var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
        <Search size={16} color="var(--text-muted)" />
        <input type="text" placeholder="Search by name, code, or email..." value={search} onChange={e => setSearch(e.target.value)} style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontSize: 'var(--text-sm)' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 'var(--space-md)', transition: 'all 0.3s' }}>
        {/* Table */}
        <div className="card" style={{ padding: 0, overflowX: 'auto', border: '1px solid var(--border-main)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '650px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-main)', backgroundColor: 'var(--bg-app)' }}>
                {['Vendor Name', 'Code', 'Contact', 'Email', 'Lead Time', 'Total POs', 'Total Spend', 'Actions'].map(h => (
                  <th key={h} style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)', whiteSpace: 'nowrap', textAlign: h === 'Actions' ? 'right' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} style={{ padding: 'var(--space-lg)', textAlign: 'center', color: 'var(--text-muted)' }}>Loading vendors...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 'var(--space-lg)', textAlign: 'center', color: 'var(--text-muted)' }}>No vendors found.</td></tr>
              ) : (
                filtered.map(v => {
                  const orders = getVendorOrders(v.id);
                  const spend = getTotalSpend(v.id);
                  const onTime = getOnTimeRate(v.id);
                  return (
                    <tr key={v.id}
                      style={{ borderBottom: '1px solid var(--border-main)', cursor: 'pointer', backgroundColor: selected?.id === v.id ? 'var(--bg-app)' : '' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-app)')}
                      onMouseLeave={e => (e.currentTarget.style.background = selected?.id === v.id ? 'var(--bg-app)' : '')}>
                      <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--accent-soft, rgba(3,105,161,0.1))', color: 'var(--accent-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 'var(--text-sm)', flexShrink: 0 }}>
                            {(v.name || 'V').charAt(0).toUpperCase()}
                          </div>
                          {v.name}
                        </div>
                      </td>
                      <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontFamily: 'monospace', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{v.code}</td>
                      <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12} /> {v.phone || '—'}</div>
                      </td>
                      <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={12} /> {v.email || '—'}</div>
                      </td>
                      <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: 'var(--text-sm)' }}>
                        {v.leadTime ? <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {v.leadTime}d</span> : '—'}
                      </td>
                      <td style={{ padding: 'var(--space-xs) var(--space-sm)', textAlign: 'center' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '9999px', backgroundColor: 'rgba(3,105,161,0.1)', color: 'var(--accent-main)', fontWeight: 700, fontSize: 'var(--text-xs)' }}>{orders.length}</span>
                      </td>
                      <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 700, fontFamily: 'monospace', fontSize: 'var(--text-sm)', color: 'var(--status-success)' }}>
                        ₹{spend.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: 'var(--space-xs) var(--space-sm)', textAlign: 'right' }}>
                        <button className="btn btn--icon" title="View Details" onClick={() => setSelected(selected?.id === v.id ? null : v)}>
                          <Eye size={15} color="var(--accent-main)" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Side Panel */}
        {selected && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', alignSelf: 'flex-start', position: 'sticky', top: '80px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="h3">Vendor Detail</h3>
              <button className="btn btn--icon" onClick={() => setSelected(null)} style={{ fontSize: '1.2rem', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: 'var(--accent-main)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xl)', fontWeight: 700 }}>
                {(selected.name || 'V').charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 'var(--text-md)' }}>{selected.name}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{selected.code}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {selected.email && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}><Mail size={12} /> {selected.email}</div>}
              {selected.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}><Phone size={12} /> {selected.phone}</div>}
              {selected.leadTime && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}><Clock size={12} /> Lead Time: {selected.leadTime} days</div>}
            </div>

            {/* Metrics */}
            <div style={{ borderTop: '1px solid var(--border-main)', paddingTop: 'var(--space-sm)' }}>
              <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-xs)' }}>Delivery Performance</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xs)' }}>
                <div style={{ padding: 'var(--space-xs)', border: '1px solid var(--border-main)', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Avg Lead Time</div>
                  <div style={{ fontWeight: 700, color: 'var(--accent-main)' }}>{selected.leadTime ? `${selected.leadTime}d` : '—'}</div>
                </div>
                <div style={{ padding: 'var(--space-xs)', border: '1px solid var(--border-main)', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>On-Time %</div>
                  <div style={{ fontWeight: 700, color: 'var(--status-success)' }}>
                    {getOnTimeRate(selected.id) !== null ? `${getOnTimeRate(selected.id)}%` : '—'}
                  </div>
                </div>
                <div style={{ padding: 'var(--space-xs)', border: '1px solid var(--border-main)', borderRadius: '8px', textAlign: 'center', gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Total Spend</div>
                  <div style={{ fontWeight: 700, color: 'var(--status-success)', fontFamily: 'monospace' }}>₹{getTotalSpend(selected.id).toLocaleString('en-IN')}</div>
                </div>
              </div>
            </div>

            {/* Purchase History */}
            <div style={{ borderTop: '1px solid var(--border-main)', paddingTop: 'var(--space-sm)' }}>
              <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-xs)' }}>Purchase History</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                {getVendorOrders(selected.id).length === 0 ? (
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-sm)' }}>No purchase orders yet.</div>
                ) : (
                  getVendorOrders(selected.id).map(o => (
                    <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid var(--border-main)', cursor: 'pointer' }} onClick={() => navigate(`${ROUTES.PURCHASE_ORDERS}/${o.id}`)}>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 'var(--text-xs)' }}>{o.reference || o.id.slice(0, 8)}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{new Date(o.createdAt).toLocaleDateString()}</div>
                      </div>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, padding: '2px 6px', borderRadius: '9999px', backgroundColor: o.status === 'RECEIVED' ? 'rgba(56,161,105,0.1)' : 'rgba(3,105,161,0.1)', color: o.status === 'RECEIVED' ? 'var(--status-success)' : 'var(--accent-main)' }}>
                        {o.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
