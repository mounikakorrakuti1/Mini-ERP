import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Package, FileText, Ban } from 'lucide-react';
import { ROUTES } from '@/routes/routeMap';

export default function PurchaseOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Simulated status state
  const [status, setStatus] = useState<string>('Confirmed');

  const handleConfirm = () => {
    setStatus('Confirmed');
    alert('Purchase Order confirmed! Vendor has been notified.');
  };

  const handleReceive = () => {
    setStatus('Received');
    alert('Materials received and added to inventory.');
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel this purchase order?')) {
      setStatus('Cancelled');
      alert('Purchase Order has been cancelled.');
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
            onClick={() => navigate(ROUTES.PURCHASE_ORDERS)}
            title="Go back to Purchase Order list"
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
            <p className="text-sm text-muted">Vendor: Lumber Logistics</p>
          </div>
        </div>
        <div className="page-header__actions">
          {status === 'Draft' && (
            <button 
              className="btn btn--primary" 
              onClick={handleConfirm}
              title="Confirm the purchase with the vendor"
            >
              <CheckCircle size={16} /> Confirm Order
            </button>
          )}
          {status === 'Confirmed' && (
            <button 
              className="btn btn--primary" 
              onClick={handleReceive}
              title="Record the physical receipt of materials into the warehouse"
            >
              <Package size={16} /> Receive Materials
            </button>
          )}
          <button 
            className="btn btn--outline" 
            onClick={handlePrint}
            title="Download or print the purchase record for internal filing"
          >
            <FileText size={16} /> Print Record
          </button>
          {status !== 'Cancelled' && status !== 'Received' && (
            <button 
              className="btn btn--outline" 
              style={{ color: 'var(--status-danger)', borderColor: 'var(--status-danger)' }}
              onClick={handleCancel}
              title="Cancel this purchase order"
            >
              <Ban size={16} /> Cancel
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="h3" style={{ marginBottom: 'var(--space-md)' }}>Materials Received</h3>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th className="table__th">Product</th>
                <th className="table__th">Description</th>
                <th className="table__th">Ordered</th>
                <th className="table__th">Received</th>
                <th className="table__th">Unit Price</th>
                <th className="table__th">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr className="table__tr">
                <td className="table__td">Oak Wood Planks</td>
                <td className="table__td">Grade A</td>
                <td className="table__td">100.00</td>
                <td className="table__td">{status === 'Received' ? '100.00' : '0.00'}</td>
                <td className="table__td">$40.00</td>
                <td className="table__td">$4,000.00</td>
              </tr>
              <tr className="table__tr">
                <td className="table__td">Steel Screws</td>
                <td className="table__td">Box of 1000</td>
                <td className="table__td">10.00</td>
                <td className="table__td">{status === 'Received' ? '10.00' : '0.00'}</td>
                <td className="table__td">$20.00</td>
                <td className="table__td">$200.00</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 'var(--space-md)', textAlign: 'right', fontWeight: 600, fontSize: 'var(--text-lg)' }}>
          Total: $4,200.00
        </div>
      </div>
    </div>
  );
}
