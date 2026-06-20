import { useState, useEffect } from 'react';
import { Workflow, Package, Factory, Truck, ShoppingCart } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { ROUTES } from '@/routes/routeMap';

export default function TraceabilityPage() {
  const { soId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTraceability = async () => {
      try {
        const res = await api.get(`/traceability/sales-order/${soId}`);
        setData(res.data.data);
      } catch (err) {
        console.error('Failed to fetch traceability', err);
      } finally {
        setIsLoading(false);
      }
    };
    if (soId) fetchTraceability();
  }, [soId]);

  if (isLoading) {
    return <div style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>Loading Traceability Data...</div>;
  }

  if (!data) {
    return <div style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>Data not found.</div>;
  }

  const { salesOrder, purchaseOrders, manufacturingOrders, stockMovements } = data;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="h2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Workflow size={24} color="var(--accent-main)" />
            Order Traceability
          </h1>
          <p className="text-sm text-muted">Supply chain traceability tree for {salesOrder?.reference || soId}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 'var(--space-lg)' }}>
        <div className="card">
          <h3 className="h3" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)' }}>
            <ShoppingCart size={20} color="var(--accent-main)" />
            Sales Order: {salesOrder?.reference}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            <div>
              <div className="text-xs text-muted">Customer</div>
              <div className="text-sm font-semibold">{salesOrder?.customer?.name || 'Unknown'}</div>
            </div>
            <div>
              <div className="text-xs text-muted">Status</div>
              <div className="text-sm font-semibold">{salesOrder?.status}</div>
            </div>
          </div>
        </div>

        {manufacturingOrders?.length > 0 && (
          <div className="card">
            <h3 className="h3" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)' }}>
              <Factory size={20} color="var(--accent-main)" />
              Manufacturing Orders ({manufacturingOrders.length})
            </h3>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th className="table__th">Reference</th>
                    <th className="table__th">Product</th>
                    <th className="table__th">Quantity</th>
                    <th className="table__th">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {manufacturingOrders.map((mo: any) => (
                    <tr className="table__tr" key={mo.id}>
                      <td className="table__td" style={{ cursor: 'pointer', color: 'var(--accent-main)' }} onClick={() => navigate(`${ROUTES.MANUFACTURING_ORDERS}/${mo.id}`)}>{mo.reference}</td>
                      <td className="table__td">{mo.finishedProduct?.name || 'Unknown'}</td>
                      <td className="table__td">{Number(mo.quantity)}</td>
                      <td className="table__td">{mo.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {purchaseOrders?.length > 0 && (
          <div className="card">
            <h3 className="h3" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)' }}>
              <Truck size={20} color="var(--accent-main)" />
              Purchase Orders ({purchaseOrders.length})
            </h3>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th className="table__th">Reference</th>
                    <th className="table__th">Vendor</th>
                    <th className="table__th">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrders.map((po: any) => (
                    <tr className="table__tr" key={po.id}>
                      <td className="table__td" style={{ cursor: 'pointer', color: 'var(--accent-main)' }} onClick={() => navigate(`${ROUTES.PURCHASE_ORDERS}/${po.id}`)}>{po.reference}</td>
                      <td className="table__td">{po.vendor?.name || 'Unknown'}</td>
                      <td className="table__td">{po.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="card">
          <h3 className="h3" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)' }}>
            <Package size={20} color="var(--accent-main)" />
            Related Stock Movements ({stockMovements?.length || 0})
          </h3>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th className="table__th">Date</th>
                  <th className="table__th">Product</th>
                  <th className="table__th">Source</th>
                  <th className="table__th">Qty</th>
                </tr>
              </thead>
              <tbody>
                {stockMovements?.length === 0 ? (
                  <tr><td colSpan={4} className="table__td" style={{ textAlign: 'center', padding: 'var(--space-md)' }}>No movements found.</td></tr>
                ) : stockMovements?.map((mov: any) => (
                  <tr className="table__tr" key={mov.id}>
                    <td className="table__td">{new Date(mov.createdAt).toLocaleString()}</td>
                    <td className="table__td">{mov.product?.name || 'Unknown'}</td>
                    <td className="table__td">{mov.sourceType} ({mov.sourceReference})</td>
                    <td className="table__td">
                      <span style={{ color: mov.direction === 'IN' ? 'var(--status-success)' : 'var(--status-danger)' }}>
                        {mov.direction === 'IN' ? '+' : '-'}{Number(mov.quantity)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
