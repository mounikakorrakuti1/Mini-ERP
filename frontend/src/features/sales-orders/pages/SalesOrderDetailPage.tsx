import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Truck, FileText, Ban, AlertCircle } from 'lucide-react';
import { ROUTES } from '@/routes/routeMap';
import { api } from '@/lib/api';
import { useDb } from '@/store/db.store';

export default function SalesOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, refreshData } = useDb();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrder = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/sales-orders/${id}`);
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
      await api.patch(`/sales-orders/${id}/confirm`);
      alert('Order Confirmed successfully!');
      fetchOrder();
      refreshData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to confirm order');
    }
  };

  const handleCreateDelivery = async () => {
    if (!order) return;
    try {
      const itemsToDeliver = order.items.map((item: any) => ({
        itemId: item.id,
        deliveredQty: item.orderedQty - item.deliveredQty,
      })).filter((i: any) => i.deliveredQty > 0);

      await api.patch(`/sales-orders/${id}/deliver`, { items: itemsToDeliver });
      alert('Delivery created! Status updated.');
      fetchOrder();
      refreshData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create delivery');
    }
  };

  const handleCancel = async () => {
    if (confirm('Are you sure you want to cancel this order?')) {
      try {
        await api.patch(`/sales-orders/${id}/cancel`);
        alert('Order has been cancelled.');
        fetchOrder();
        refreshData();
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

  const total = order.items.reduce((sum: number, item: any) => sum + (item.orderedQty * item.salesPrice), 0);

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
              <h1 className="h2">{order.reference || order.id.slice(0,8)}</h1>
              <span className={`status-badge ${
                order.status === 'DRAFT' ? 'status-badge--draft' : 
                order.status === 'CONFIRMED' ? 'status-badge--confirmed' : 
                order.status === 'CANCELLED' ? 'status-badge--danger' : 
                'status-badge--success'
              }`}>{order.status}</span>
            </div>
            <p className="text-sm text-muted">Customer: {order.customer?.name || 'Unknown'}</p>
          </div>
        </div>
        <div className="page-header__actions">
          {order.status === 'DRAFT' && (
            <button 
              className="btn btn--primary" 
              onClick={handleConfirm}
              title="Validate this order and lock it for fulfillment"
            >
              <CheckCircle size={16} /> Confirm Order
            </button>
          )}
          {(order.status === 'CONFIRMED' || order.status === 'PARTIALLY_DELIVERED') && (
            <button 
              className="btn btn--primary" 
              onClick={handleCreateDelivery}
              title="Create a warehouse delivery for the items in this order"
            >
              <Truck size={16} /> Deliver Remaining
            </button>
          )}
          <button 
            className="btn btn--outline" 
            onClick={handlePrint}
            title="Generate and download/print the invoice PDF for this order"
          >
            <FileText size={16} /> Print Invoice
          </button>
          {order.status !== 'CANCELLED' && order.status !== 'FULLY_DELIVERED' && (
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
                <th className="table__th">Ordered Qty</th>
                <th className="table__th">Delivered Qty</th>
                <th className="table__th">Availability</th>
                <th className="table__th">Unit Price</th>
                <th className="table__th">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item: any) => {
                const globalProduct = products.find(p => p.id === item.productId);
                const remaining = item.orderedQty - item.deliveredQty;
                const canFulfill = globalProduct && globalProduct.freeToUse >= remaining;
                return (
                  <tr className="table__tr" key={item.id}>
                    <td className="table__td">
                      <div style={{ fontWeight: 500 }}>{item.product?.code || 'Unknown'}</div>
                      <div className="text-xs text-muted">{item.product?.name}</div>
                    </td>
                    <td className="table__td">{item.orderedQty}</td>
                    <td className="table__td">{item.deliveredQty}</td>
                    <td className="table__td">
                      {order.status === 'DRAFT' || order.status === 'CONFIRMED' || order.status === 'PARTIALLY_DELIVERED' ? (
                        canFulfill ? (
                          <span style={{ color: 'var(--status-success)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={14}/> In Stock
                          </span>
                        ) : (
                          <span style={{ color: 'var(--status-danger)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertCircle size={14}/> 
                            Need {remaining - (globalProduct?.freeToUse || 0)} 
                            ({globalProduct?.procurementType || 'Procurement'})
                          </span>
                        )
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td className="table__td">${Number(item.salesPrice).toLocaleString()}</td>
                    <td className="table__td">${(item.orderedQty * item.salesPrice).toLocaleString()}</td>
                  </tr>
                );
              })}
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
