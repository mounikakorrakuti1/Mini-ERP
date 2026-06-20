import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Package, FileText, Ban } from 'lucide-react';
import { ROUTES } from '@/routes/routeMap';
import { api } from '@/lib/api';

export default function PurchaseOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrder = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/purchase-orders/${id}`);
      setOrder(res.data.data);
    } catch (err) {
      console.error('Failed to fetch order', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleConfirm = async () => {
    try {
      await api.patch(`/purchase-orders/${id}/confirm`);
      alert('Purchase Order confirmed! Vendor has been notified.');
      fetchOrder();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to confirm order');
    }
  };

  const handleReceive = async () => {
    if (!order) return;
    try {
      // Auto-receive all remaining items
      const itemsToReceive = order.items.map((item: any) => ({
        itemId: item.id,
        receivedQty: item.orderedQty - item.receivedQty,
      })).filter((i: any) => i.receivedQty > 0);

      await api.patch(`/purchase-orders/${id}/receive`, { items: itemsToReceive });
      alert('Materials received and added to inventory.');
      fetchOrder();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to receive materials');
    }
  };

  const handleCancel = async () => {
    if (confirm('Are you sure you want to cancel this purchase order?')) {
      try {
        await api.patch(`/purchase-orders/${id}/cancel`);
        alert('Purchase Order has been cancelled.');
        fetchOrder();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to cancel order');
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return <div style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>Loading order details...</div>;
  }

  if (!order) {
    return <div style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>Order not found.</div>;
  }

  const total = order.items.reduce((sum: number, item: any) => sum + (item.orderedQty * item.costPrice), 0);

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
              <h1 className="h2">{order.reference || order.id.slice(0,8)}</h1>
              <span className={`status-badge ${
                order.status === 'DRAFT' ? 'status-badge--draft' : 
                order.status === 'CONFIRMED' ? 'status-badge--confirmed' : 
                order.status === 'CANCELLED' ? 'status-badge--danger' : 
                'status-badge--success'
              }`}>{order.status}</span>
            </div>
            <p className="text-sm text-muted">Vendor: {order.vendor?.name || 'Unknown'}</p>
          </div>
        </div>
        <div className="page-header__actions">
          {order.status === 'DRAFT' && (
            <button 
              className="btn btn--primary" 
              onClick={handleConfirm}
              title="Confirm the purchase with the vendor"
            >
              <CheckCircle size={16} /> Confirm Order
            </button>
          )}
          {(order.status === 'CONFIRMED' || order.status === 'PARTIALLY_RECEIVED') && (
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
          {order.status !== 'CANCELLED' && order.status !== 'RECEIVED' && (
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
                <th className="table__th">Ordered Qty</th>
                <th className="table__th">Received Qty</th>
                <th className="table__th">Unit Price</th>
                <th className="table__th">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item: any) => (
                <tr className="table__tr" key={item.id}>
                  <td className="table__td">{item.product?.code || 'Unknown'}</td>
                  <td className="table__td">{item.product?.name || 'Unknown'}</td>
                  <td className="table__td">{item.orderedQty}</td>
                  <td className="table__td">{item.receivedQty}</td>
                  <td className="table__td">${Number(item.costPrice).toLocaleString()}</td>
                  <td className="table__td">${(item.orderedQty * item.costPrice).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 'var(--space-md)', textAlign: 'right', fontWeight: 600, fontSize: 'var(--text-lg)' }}>
          Total: ${total.toLocaleString()}
        </div>
      </div>
    </div>
  );
}
