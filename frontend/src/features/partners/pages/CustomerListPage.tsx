import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useDb } from '@/store/db.store';
import { Users, Phone, Mail, MapPin, ShoppingCart, TrendingUp, Eye, Search, Plus } from 'lucide-react';
import { ROUTES } from '@/routes/routeMap';

export default function CustomerListPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<any[]>([]);
  const [salesOrders, setSalesOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [custRes, soRes] = await Promise.all([
          api.get('/customers'),
          api.get('/sales-orders'),
        ]);
        setCustomers(custRes.data.data || []);
        setSalesOrders(soRes.data.data || []);
      } catch { } finally { setIsLoading(false); }
    };
    load();
  }, []);

  const filtered = customers.filter(c =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').toLowerCase().includes(search.toLowerCase())
  );

  const getCustomerOrders = (cId: string) => salesOrders.filter(o => o.customerId === cId || o.customer?.id === cId);
  const getRevenue = (cId: string) => getCustomerOrders(cId)
    .filter(o => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + (o.items?.reduce((s: number, i: any) => s + i.orderedQty * (i.salesPrice || 0), 0) || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
        <div>
          <h1 className="h1" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
            <Users size={28} color="var(--accent-main)" /> Customers
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{customers.length} registered customers</p>
        </div>
        <button className="btn btn--primary" onClick={() => navigate(ROUTES.SALES_ORDER_CREATE)} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Plus size={16} /> New Sales Order
        </button>
      </div>

      {/* Search */}
      <div className="card" style={{ padding: 'var(--space-sm) var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
        <Search size={16} color="var(--text-muted)" />
        <input type="text" placeholder="Search by name, email, or phone..." value={search} onChange={e => setSearch(e.target.value)} style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontSize: 'var(--text-sm)' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 'var(--space-md)', transition: 'all 0.3s' }}>
        {/* Table */}
        <div className="card" style={{ padding: 0, overflowX: 'auto', border: '1px solid var(--border-main)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '650px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-main)', backgroundColor: 'var(--bg-app)' }}>
                {['Customer Name', 'Phone', 'Email', 'Address', 'Total Orders', 'Revenue', 'Actions'].map(h => (
                  <th key={h} style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)', whiteSpace: 'nowrap', textAlign: h === 'Actions' ? 'right' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} style={{ padding: 'var(--space-lg)', textAlign: 'center', color: 'var(--text-muted)' }}>Loading customers...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 'var(--space-lg)', textAlign: 'center', color: 'var(--text-muted)' }}>No customers found.</td></tr>
              ) : (
                filtered.map(c => {
                  const orders = getCustomerOrders(c.id);
                  const revenue = getRevenue(c.id);
                  return (
                    <tr key={c.id}
                      style={{ borderBottom: '1px solid var(--border-main)', cursor: 'pointer', backgroundColor: selected?.id === c.id ? 'var(--bg-app)' : '' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-app)')}
                      onMouseLeave={e => (e.currentTarget.style.background = selected?.id === c.id ? 'var(--bg-app)' : '')}>
                      <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--accent-main)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-sm)', fontWeight: 700, flexShrink: 0 }}>
                            {(c.name || 'C').charAt(0).toUpperCase()}
                          </div>
                          {c.name}
                        </div>
                      </td>
                      <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12} /> {c.phone || '—'}</div>
                      </td>
                      <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={12} /> {c.email || '—'}</div>
                      </td>
                      <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.address || '—'}
                      </td>
                      <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)', textAlign: 'center' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '9999px', backgroundColor: 'rgba(3,105,161,0.1)', color: 'var(--accent-main)', fontWeight: 700 }}>{orders.length}</span>
                      </td>
                      <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 700, fontFamily: 'monospace', fontSize: 'var(--text-sm)', color: 'var(--status-success)' }}>
                        ₹{revenue.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: 'var(--space-xs) var(--space-sm)', textAlign: 'right' }}>
                        <button className="btn btn--icon" title="View Details" onClick={() => setSelected(selected?.id === c.id ? null : c)}>
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
              <h3 className="h3">Customer Detail</h3>
              <button className="btn btn--icon" onClick={() => setSelected(null)} style={{ fontSize: '1.2rem', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--accent-main)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-2xl)', fontWeight: 700 }}>
              {(selected.name || 'C').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 'var(--text-md)' }}>{selected.name}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: 'var(--space-xs)' }}>
                {selected.email && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}><Mail size={12} /> {selected.email}</div>}
                {selected.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}><Phone size={12} /> {selected.phone}</div>}
                {selected.address && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}><MapPin size={12} /> {selected.address}</div>}
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--border-main)', paddingTop: 'var(--space-sm)' }}>
              <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-xs)' }}>Order History</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                {getCustomerOrders(selected.id).length === 0 ? (
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-sm)' }}>No orders yet</div>
                ) : (
                  getCustomerOrders(selected.id).map(o => (
                    <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid var(--border-main)', cursor: 'pointer' }} onClick={() => navigate(`${ROUTES.SALES_ORDERS}/${o.id}`)}>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 'var(--text-xs)' }}>{o.reference || o.id.slice(0, 8)}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{new Date(o.createdAt).toLocaleDateString()}</div>
                      </div>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, padding: '2px 6px', borderRadius: '9999px', backgroundColor: o.status === 'DELIVERED' ? 'rgba(56,161,105,0.1)' : o.status === 'CANCELLED' ? 'rgba(229,62,62,0.1)' : 'rgba(3,105,161,0.1)', color: o.status === 'DELIVERED' ? 'var(--status-success)' : o.status === 'CANCELLED' ? 'var(--status-danger)' : 'var(--accent-main)' }}>
                        {o.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--border-main)', paddingTop: 'var(--space-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Total Revenue</span>
              <span style={{ fontWeight: 700, color: 'var(--status-success)', fontFamily: 'monospace' }}>₹{getRevenue(selected.id).toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
