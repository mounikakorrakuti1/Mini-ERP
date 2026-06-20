import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Truck, FileText, Ban } from 'lucide-react';
import { ROUTES } from '@/routes/routeMap';

export default function SalesOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Simulated status state
  const [status, setStatus] = useState<string>('Confirmed');

  const handleConfirm = () => {
    setStatus('Confirmed');
    alert('Order Confirmed successfully!');
  };

  const handleCreateDelivery = () => {
    setStatus('Partially Delivered');
    alert('Delivery created! Status updated to Partially Delivered.');
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel this order?')) {
      setStatus('Cancelled');
      alert('Order has been cancelled.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <button 
            className="btn btn--icon" 
            onClick={() => navigate(ROUTES.SALES_ORDERS)}
            title="Go back to Sales Order list"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <h1 className="h2">{id}</h1>
              <span className={`status-badge ${
                status === 'Draft' ? 'status-badge--draft' : 
                status === 'Confirmed' ? 'status-badge--confirmed' : 
                status === 'Cancelled' ? 'status-badge--danger' : 
                'status-badge--success'
              }`}>{status}</span>
            </div>
            <p className="text-sm text-muted">Customer: Global Enterprises</p>
          </div>
        </div>
        <div className="page-header__actions">
          {status === 'Draft' && (
            <button 
              className="btn btn--primary" 
              onClick={handleConfirm}
              title="Validate this order and lock it for fulfillment"
            >
              <CheckCircle size={16} /> Confirm Order
            </button>
          )}
          {(status === 'Confirmed' || status === 'Partially Delivered') && (
            <button 
              className="btn btn--primary" 
              onClick={handleCreateDelivery}
              title="Create a warehouse delivery for the items in this order"
            >
              <Truck size={16} /> Create Delivery
            </button>
          )}
          <button 
            className="btn btn--outline" 
            onClick={handlePrint}
            title="Generate and download/print the invoice PDF for this order"
          >
            <FileText size={16} /> Print Invoice
          </button>
          {status !== 'Cancelled' && status !== 'Fully Delivered' && (
            <button 
              className="btn btn--outline" 
              style={{ color: 'var(--status-danger)', borderColor: 'var(--status-danger)' }}
              onClick={handleCancel}
              title="Void this order and release any reserved inventory items"
            >
              <Ban size={16} /> Cancel
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="h3" style={{ marginBottom: 'var(--space-md)' }}>Order Lines</h3>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th className="table__th">Product</th>
                <th className="table__th">Description</th>
                <th className="table__th">Quantity</th>
                <th className="table__th">Delivered</th>
                <th className="table__th">Unit Price</th>
                <th className="table__th">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr className="table__tr">
                <td className="table__td">Executive Desk</td>
                <td className="table__td">Oak wood finish</td>
                <td className="table__td">5.00</td>
                <td className="table__td">{status.includes('Delivered') ? '5.00' : '0.00'}</td>
                <td className="table__td">$500.00</td>
                <td className="table__td">$2,500.00</td>
              </tr>
              <tr className="table__tr">
                <td className="table__td">Ergonomic Chair</td>
                <td className="table__td">Mesh back, adjustable</td>
                <td className="table__td">10.00</td>
                <td className="table__td">{status === 'Partially Delivered' ? '2.00' : status === 'Fully Delivered' ? '10.00' : '0.00'}</td>
                <td className="table__td">$200.00</td>
                <td className="table__td">$2,000.00</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 'var(--space-md)', textAlign: 'right', fontWeight: 600, fontSize: 'var(--text-lg)' }}>
          Total: $4,500.00
        </div>
      </div>
    </div>
  );
}
