import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Factory, Ban } from 'lucide-react';
import { ROUTES } from '@/routes/routeMap';
import { api } from '@/lib/api';

export default function ManufacturingOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrder = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/manufacturing-orders/${id}`);
      setOrder(res.data.data);
    } catch (err) {
      console.error('Failed to fetch manufacturing order', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleStart = async () => {
    try {
      await api.patch(`/manufacturing-orders/${id}/start`);
      alert('Manufacturing Order started.');
      fetchOrder();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to start order');
    }
  };

  const handleConfirm = async () => {
    try {
      await api.patch(`/manufacturing-orders/${id}/confirm`);
      alert('Manufacturing Order confirmed.');
      fetchOrder();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to confirm order');
    }
  };

  const handleComplete = async () => {
    try {
      await api.patch(`/manufacturing-orders/${id}/complete`);
      alert('Manufacturing Order marked as Done. Finished goods added to stock.');
      fetchOrder();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to complete order');
    }
  };

  const handleCancel = async () => {
    if (confirm('Are you sure you want to cancel this manufacturing order?')) {
      try {
        await api.patch(`/manufacturing-orders/${id}/cancel`);
        alert('Manufacturing Order has been cancelled.');
        fetchOrder();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to cancel order');
      }
    }
  };

  if (isLoading) {
    return <div style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>Loading order details...</div>;
  }

  if (!order) {
    return <div style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>Order not found.</div>;
  }

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
              <h1 className="h2">{order.reference || order.id.slice(0,8)}</h1>
              <span className={`status-badge ${
                order.status === 'DRAFT' ? 'status-badge--draft' : 
                order.status === 'COMPLETED' ? 'status-badge--success' : 
                order.status === 'CANCELLED' ? 'status-badge--danger' : 
                order.status === 'IN_PROGRESS' ? 'status-badge--confirmed' :
                'status-badge--warning'
              }`}>{order.status}</span>
            </div>
            <p className="text-sm text-muted">Product: {order.finishedProduct?.name || 'Unknown'} | Qty: {Number(order.quantity)}</p>
          </div>
        </div>
        <div className="page-header__actions">
          {order.status === 'DRAFT' && (
            <button 
              className="btn btn--primary" 
              onClick={handleConfirm}
            >
              <CheckCircle size={16} /> Confirm Order
            </button>
          )}
          {order.status === 'CONFIRMED' && (
            <button 
              className="btn btn--primary" 
              onClick={handleStart}
            >
              <Factory size={16} /> Start Production
            </button>
          )}
          {order.status === 'IN_PROGRESS' && (
            <button 
              className="btn btn--primary" 
              onClick={handleComplete}
              title="Finalize production and move items to finished goods inventory"
            >
              <CheckCircle size={16} /> Mark as Done
            </button>
          )}
          {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
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
              {order.items?.map((item: any) => (
                <tr className="table__tr" key={item.id}>
                  <td className="table__td">{item.product?.name || 'Unknown'}</td>
                  <td className="table__td">{Number(item.requiredQty).toFixed(2)}</td>
                  <td className="table__td">{Number(item.consumedQty).toFixed(2)}</td>
                  <td className="table__td">
                    <span className={`status-badge ${Number(item.consumedQty) >= Number(item.requiredQty) ? 'status-badge--success' : 'status-badge--warning'}`}>
                      {Number(item.consumedQty) >= Number(item.requiredQty) ? 'Consumed' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
