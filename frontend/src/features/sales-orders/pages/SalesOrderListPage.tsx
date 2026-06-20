import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye } from 'lucide-react';
import { ROUTES } from '@/routes/routeMap';
import { api } from '@/lib/api';

export default function SalesOrderListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/sales-orders');
        setOrders(res.data.data);
      } catch (err) {
        console.error('Failed to fetch sales orders', err);
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
      case 'COMPLETED': 
      case 'DELIVERED': return 'status-badge--success';
      case 'CANCELLED': return 'status-badge--danger';
      default: return 'status-badge--draft';
    }
  };

  const filteredOrders = orders.filter(o => {
    const q = searchQuery.toLowerCase();
    const ref = (o.reference || o.id).toLowerCase();
    const cust = (o.customer?.name || '').toLowerCase();
    const status = (o.status || '').toLowerCase();
    return ref.includes(q) || cust.includes(q) || status.includes(q);
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="h2">Sales Orders</h1>
          <p className="text-sm text-muted">Manage your customer orders</p>
        </div>
        <div className="page-header__actions">
          <div className="page-header__search">
            <Search size={16} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Search orders..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Link to={`${ROUTES.SALES_ORDERS}/new`} className="btn btn--primary">
            <Plus size={16} /> New Order
          </Link>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th className="table__th">Order Ref</th>
              <th className="table__th">Customer</th>
              <th className="table__th">Date</th>
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
                <td className="table__td">{order.customer?.name || 'Unknown'}</td>
                <td className="table__td">{new Date(order.createdAt).toLocaleDateString()}</td>
                <td className="table__td">
                  ${order.items?.reduce((sum: number, item: any) => sum + (item.orderedQty * item.salesPrice), 0).toLocaleString()}
                </td>
                <td className="table__td">
                  <span className={`status-badge ${getStatusClass(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className="table__td" style={{ textAlign: 'right' }}>
                  <Link to={`${ROUTES.SALES_ORDERS}/${order.id}`} className="btn btn--icon">
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
