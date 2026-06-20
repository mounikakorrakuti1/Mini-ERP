import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, Filter } from 'lucide-react';
import { ROUTES } from '@/routes/routeMap';

interface MfgOrder {
  id: string;
  product: string;
  quantity: number;
  date: string;
  status: 'Draft' | 'Confirmed' | 'In_Progress' | 'Done' | 'Cancelled';
}

const mockOrders: MfgOrder[] = [
  { id: 'MO-2026-0001', product: 'Executive Desk', quantity: 5, date: '2026-06-20', status: 'In_Progress' },
  { id: 'MO-2026-0002', product: 'Ergonomic Chair', quantity: 20, date: '2026-06-21', status: 'Confirmed' },
  { id: 'MO-2026-0003', product: 'Meeting Table', quantity: 2, date: '2026-06-25', status: 'Draft' },
];

export default function ManufacturingOrderListPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Draft': return 'status-badge--draft';
      case 'Confirmed': return 'status-badge--warning';
      case 'In_Progress': return 'status-badge--confirmed';
      case 'Done': return 'status-badge--success';
      case 'Cancelled': return 'status-badge--danger';
      default: return 'status-badge--draft';
    }
  };

  const filteredOrders = mockOrders.filter(o => 
    o.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    o.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="h2">Manufacturing Orders</h1>
          <p className="text-sm text-muted">Manage production runs</p>
        </div>
        <div className="page-header__actions">
          <div className="page-header__search">
            <Search size={16} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Search MOs..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Link to={`${ROUTES.MANUFACTURING_ORDERS}/kanban`} className="btn btn--outline">
            Kanban Board
          </Link>
          <Link to={`${ROUTES.MANUFACTURING_ORDERS}/new`} className="btn btn--primary">
            <Plus size={16} /> New MO
          </Link>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th className="table__th">Ref</th>
              <th className="table__th">Finished Product</th>
              <th className="table__th">Quantity</th>
              <th className="table__th">Scheduled Date</th>
              <th className="table__th">Status</th>
              <th className="table__th" style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
              <tr key={order.id} className="table__tr">
                <td className="table__td" style={{ fontWeight: 500 }}>{order.id}</td>
                <td className="table__td">{order.product}</td>
                <td className="table__td">{order.quantity}</td>
                <td className="table__td">{order.date}</td>
                <td className="table__td">
                  <span className={`status-badge ${getStatusClass(order.status)}`}>
                    {order.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="table__td" style={{ textAlign: 'right' }}>
                  <Link to={`${ROUTES.MANUFACTURING_ORDERS}/${order.id}`} className="btn btn--icon">
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
