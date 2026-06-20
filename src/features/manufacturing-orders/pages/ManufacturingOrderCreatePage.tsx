import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { ROUTES } from '@/routes/routeMap';

export default function ManufacturingOrderCreatePage() {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(ROUTES.MANUFACTURING_ORDERS);
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <button className="btn btn--icon" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="h2">New Manufacturing Order</h1>
            <p className="text-sm text-muted">Create a production request</p>
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
              <label className="input-label">Product to Manufacture</label>
              <select className="input-field">
                <option value="">Select a Product</option>
                <option value="1">Executive Desk</option>
                <option value="2">Ergonomic Chair</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Bill of Materials</label>
              <select className="input-field">
                <option value="">Select BoM</option>
                <option value="1">BOM-001 (Oak)</option>
              </select>
            </div>
            
            <div className="input-group">
              <label className="input-label">Quantity to Produce</label>
              <input type="number" min="1" defaultValue="1" className="input-field" />
            </div>

            <div className="input-group">
              <label className="input-label">Scheduled Date</label>
              <input type="date" className="input-field" />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
