import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Factory, Ban } from 'lucide-react';
import { ROUTES } from '@/routes/routeMap';

export default function ManufacturingOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Simulated status state
  const [status, setStatus] = useState<string>('In Progress');

  const handleMarkDone = () => {
    setStatus('Done');
    alert('Manufacturing Order marked as Done. Finished goods added to stock.');
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel this manufacturing order?')) {
      setStatus('Cancelled');
      alert('Manufacturing Order has been cancelled.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <button 
            className="btn btn--icon" 
            onClick={() => navigate(ROUTES.MANUFACTURING_ORDERS)}
            title="Go back to Manufacturing Order list"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <h1 className="h2">{id}</h1>
              <span className={`status-badge ${
                status === 'Draft' ? 'status-badge--draft' : 
                status === 'Done' ? 'status-badge--success' : 
                status === 'Cancelled' ? 'status-badge--danger' : 
                'status-badge--confirmed'
              }`}>{status}</span>
            </div>
            <p className="text-sm text-muted">Product: Executive Desk | Qty: 5</p>
          </div>
        </div>
        <div className="page-header__actions">
          {status === 'In Progress' && (
            <button 
              className="btn btn--primary" 
              onClick={handleMarkDone}
              title="Finalize production and move items to finished goods inventory"
            >
              <CheckCircle size={16} /> Mark as Done
            </button>
          )}
          {status !== 'Cancelled' && status !== 'Done' && (
            <button 
              className="btn btn--outline" 
              style={{ color: 'var(--status-danger)', borderColor: 'var(--status-danger)' }}
              onClick={handleCancel}
              title="Cancel the production run"
            >
              <Ban size={16} /> Cancel
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="h3" style={{ marginBottom: 'var(--space-md)' }}>Components to Consume</h3>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th className="table__th">Product</th>
                <th className="table__th">To Consume</th>
                <th className="table__th">Consumed</th>
                <th className="table__th">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="table__tr">
                <td className="table__td">Oak Wood Planks</td>
                <td className="table__td">25.00</td>
                <td className="table__td">{status === 'Done' ? '25.00' : '0.00'}</td>
                <td className="table__td"><span className="status-badge status-badge--success">Available</span></td>
              </tr>
              <tr className="table__tr">
                <td className="table__td">Steel Screws</td>
                <td className="table__td">500.00</td>
                <td className="table__td">{status === 'Done' ? '500.00' : '0.00'}</td>
                <td className="table__td"><span className="status-badge status-badge--success">Available</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
