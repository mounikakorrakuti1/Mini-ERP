import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { ROUTES } from '@/routes/routeMap';

export default function PurchaseOrderCreatePage() {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(ROUTES.PURCHASE_ORDERS);
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <button className="btn btn--icon" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="h2">New Purchase Order</h1>
            <p className="text-sm text-muted">Order materials from a vendor</p>
          </div>
        </div>
        <div className="page-header__actions">
          <button className="btn btn--outline" onClick={() => navigate(-1)}>Cancel</button>
          <button className="btn btn--primary" onClick={handleSubmit}>
            <Save size={16} /> Save Draft
          </button>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            <div className="input-group">
              <label className="input-label">Vendor</label>
              <select className="input-field">
                <option value="">Select a Vendor</option>
                <option value="1">Lumber Logistics</option>
                <option value="2">Steel & Co</option>
              </select>
            </div>
            
            <div className="input-group">
              <label className="input-label">Expected Date</label>
              <input type="date" className="input-field" />
            </div>
          </div>

          <div>
            <h3 className="h3" style={{ marginBottom: 'var(--space-xs)' }}>Products</h3>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th className="table__th">Product</th>
                    <th className="table__th">Description</th>
                    <th className="table__th">Quantity</th>
                    <th className="table__th">Unit Price</th>
                    <th className="table__th">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="table__tr">
                    <td className="table__td">
                      <select className="input-field" style={{ width: '100%' }}>
                        <option value="">Select Material...</option>
                        <option value="m1">Oak Wood Planks</option>
                        <option value="m2">Steel Screws</option>
                      </select>
                    </td>
                    <td className="table__td"><input type="text" className="input-field" placeholder="Description" style={{ width: '100%' }} /></td>
                    <td className="table__td"><input type="number" min="1" defaultValue="1" className="input-field" style={{ width: '80px' }} /></td>
                    <td className="table__td"><input type="number" step="0.01" className="input-field" style={{ width: '120px' }} /></td>
                    <td className="table__td">$0.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button type="button" className="btn btn--outline" style={{ marginTop: 'var(--space-sm)' }}>
              Add Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
