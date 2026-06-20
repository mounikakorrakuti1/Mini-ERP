import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { ROUTES } from '@/routes/routeMap';

export default function BomCreatePage() {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(ROUTES.BOM_LIST);
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <button className="btn btn--icon" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="h2">New Bill of Materials</h1>
            <p className="text-sm text-muted">Define a product recipe</p>
          </div>
        </div>
        <div className="page-header__actions">
          <button className="btn btn--outline" onClick={() => navigate(-1)}>Cancel</button>
          <button className="btn btn--primary" onClick={handleSubmit}>
            <Save size={16} /> Save Recipe
          </button>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            <div className="input-group">
              <label className="input-label">Finished Product</label>
              <select className="input-field">
                <option value="">Select a Product</option>
                <option value="1">Executive Desk</option>
              </select>
            </div>
            
            <div className="input-group">
              <label className="input-label">Quantity to Produce</label>
              <input type="number" min="1" defaultValue="1" className="input-field" />
            </div>
          </div>

          <div>
            <h3 className="h3" style={{ marginBottom: 'var(--space-xs)' }}>Components</h3>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th className="table__th">Material</th>
                    <th className="table__th">Quantity</th>
                    <th className="table__th">Unit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="table__tr">
                    <td className="table__td">
                      <select className="input-field" style={{ width: '100%' }}>
                        <option value="">Select Material...</option>
                        <option value="m1">Oak Wood Planks</option>
                      </select>
                    </td>
                    <td className="table__td"><input type="number" min="0.1" step="0.1" defaultValue="5" className="input-field" style={{ width: '120px' }} /></td>
                    <td className="table__td">units</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button type="button" className="btn btn--outline" style={{ marginTop: 'var(--space-sm)' }}>
              Add Component
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
