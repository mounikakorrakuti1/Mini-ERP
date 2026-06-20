import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, Filter } from 'lucide-react';
import { ROUTES } from '@/routes/routeMap';

interface PurchaseOrder {
  id: string;
  vendorName: string;
  date: string;
  total: number;
  status: 'Draft' | 'Confirmed' | 'Received' | 'Cancelled';
}

const mockOrders: PurchaseOrder[] = [
  { id: 'PO-2026-0001', vendorName: 'Lumber Logistics', date: '2026-06-15', total: 4200, status: 'Received' as any },
  { id: 'PO-2026-0002', vendorName: 'Steel & Co', date: '2026-06-18', total: 6800, status: 'Confirmed' },
  { id: 'PO-2026-0003', vendorName: 'Fasteners Inc', date: '2026-06-20', total: 350, status: 'Draft' },
];

export default function PurchaseOrderListPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Draft': return 'status-badge--draft';
      case 'Confirmed': return 'status-badge--confirmed';
      case 'Received': return 'status-badge--success';
      case 'Cancelled': return 'status-badge--danger';
      default: return 'status-badge--draft';
    }
  };

  const filteredOrders = mockOrders.filter(o => 
    o.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    o.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <button className="btn btn--outline"><Filter size={16} /> Filter</button>
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
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
              <tr key={order.id} className="table__tr">
                <td className="table__td" style={{ fontWeight: 500 }}>{order.id}</td>
                <td className="table__td">{order.vendorName}</td>
                <td className="table__td">{order.date}</td>
                <td className="table__td">${order.total.toLocaleString()}</td>
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
