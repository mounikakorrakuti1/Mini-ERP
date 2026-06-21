import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, Filter } from 'lucide-react';
import { ROUTES } from '@/routes/routeMap';
import { api } from '@/lib/api';

export default function PurchaseOrderListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/purchase-orders');
        setOrders(res.data.data);
      } catch (err) {
        console.error('Failed to fetch purchase orders', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'status-badge--draft';
      case 'CONFIRMED': return 'status-badge--confirmed';
      case 'PARTIALLY_RECEIVED': return 'status-badge--warning';
      case 'FULLY_RECEIVED': return 'status-badge--success';
      case 'CANCELLED': return 'status-badge--danger';
      default: return 'status-badge--draft';
    }
  };

  const filteredOrders = orders.filter(o => {
    const q = searchQuery.toLowerCase();
    const ref = (o.reference || o.id).toLowerCase();
    const vendor = (o.vendor?.name || '').toLowerCase();
    const status = (o.status || '').toLowerCase();
    const matchesSearch = ref.includes(q) || vendor.includes(q) || status.includes(q);
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="h2">Purchase Orders</h1>
          <p className="text-sm text-muted">Procure raw materials from vendors</p>
        </div>
        <div className="page-header__actions">
          <div className="page-header__search">
            <Search size={16} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Search POs..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select className="input-field" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ appearance: 'auto', padding: '0.4rem var(--space-sm)', minWidth: '130px' }}>
            <option value="ALL">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PARTIALLY_RECEIVED">Partially Received</option>
            <option value="FULLY_RECEIVED">Fully Received</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <Link to={`${ROUTES.PURCHASE_ORDERS}/new`} className="btn btn--primary">
            <Plus size={16} /> New PO
          </Link>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th className="table__th">PO Ref</th>
              <th className="table__th">Vendor</th>
              <th className="table__th">Order Date</th>
              <th className="table__th">Total Amount</th>
              <th className="table__th">Status</th>
              <th className="table__th" style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="table__td" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-md)' }}>
                  Loading orders...
                </td>
              </tr>
            ) : filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
              <tr key={order.id} className="table__tr">
                <td className="table__td" style={{ fontWeight: 500 }}>{order.reference || order.id.slice(0,8)}</td>
                <td className="table__td">{order.vendor?.name || 'Unknown'}</td>
                <td className="table__td">{new Date(order.createdAt).toLocaleDateString()}</td>
                <td className="table__td">
                  ${order.items?.reduce((sum: number, item: any) => sum + (item.orderedQty * item.costPrice), 0).toLocaleString()}
                </td>
                <td className="table__td">
                  <span className={`status-badge ${getStatusClass(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className="table__td" style={{ textAlign: 'right' }}>
                  <Link to={`${ROUTES.PURCHASE_ORDERS}/${order.id}`} className="btn btn--icon">
                    <Eye size={18} color="var(--text-muted)" />
                  </Link>
                </td>
              </tr>
            ))
            ) : (
              <tr>
                <td colSpan={6} className="table__td" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-md)' }}>
                  No orders match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
