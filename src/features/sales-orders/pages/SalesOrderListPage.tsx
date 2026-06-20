import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye } from 'lucide-react';
import { ROUTES } from '@/routes/routeMap';

interface SalesOrder {
  id: string;
  customerName: string;
  date: string;
  total: number;
  status: 'Draft' | 'Confirmed' | 'Delivered' | 'Cancelled';
}

const mockOrders: SalesOrder[] = [
  { id: 'SO-2026-0001', customerName: 'Acme Corp', date: '2026-06-19', total: 12500, status: 'Completed' as any },
  { id: 'SO-2026-0002', customerName: 'Global Enterprises', date: '2026-06-20', total: 4500, status: 'Confirmed' },
  { id: 'SO-2026-0003', customerName: 'Stark Industries', date: '2026-06-20', total: 8900, status: 'Draft' },
];

export default function SalesOrderListPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Draft': return 'status-badge--draft';
      case 'Confirmed': return 'status-badge--confirmed';
      case 'Completed': 
      case 'Delivered': return 'status-badge--success';
      case 'Cancelled': return 'status-badge--danger';
      default: return 'status-badge--draft';
    }
  };

  const filteredOrders = mockOrders.filter(o => 
    o.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
              <tr key={order.id} className="table__tr">
                <td className="table__td" style={{ fontWeight: 500 }}>{order.id}</td>
                <td className="table__td">{order.customerName}</td>
                <td className="table__td">{order.date}</td>
                <td className="table__td">${order.total.toLocaleString()}</td>
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
