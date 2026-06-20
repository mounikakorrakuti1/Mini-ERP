import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, ListTree, Copy } from 'lucide-react';
import { ROUTES } from '@/routes/routeMap';

export default function BomDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const handleEdit = () => {
    alert('Opening BoM editor...');
  };

  const handleDuplicate = () => {
    alert(`Duplicating BoM ${id}... New draft created.`);
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <button 
            className="btn btn--icon" 
            onClick={() => navigate(ROUTES.BOM_LIST)}
            title="Return to Bill of Materials list"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <h1 className="h2">{id}</h1>
              <span className="status-badge status-badge--success">Active</span>
            </div>
            <p className="text-sm text-muted">Product: Executive Desk | Ref: BOM-001</p>
          </div>
        </div>
        <div className="page-header__actions">
          <button 
            className="btn btn--primary" 
            onClick={handleEdit}
            title="Modify components, quantities, or routing for this BoM"
          >
            <Edit size={16} /> Edit Details
          </button>
          <button 
            className="btn btn--outline" 
            onClick={handleDuplicate}
            title="Create a new BoM based on this configuration"
          >
            <Copy size={16} /> Duplicate BoM
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 'var(--space-lg)' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', marginBottom: 'var(--space-md)' }}>
            <ListTree size={20} color="var(--accent-main)" />
            <h3 className="h3">Component Hierarchy</h3>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th className="table__th">Material</th>
                  <th className="table__th">Quantity</th>
                  <th className="table__th">Unit Price</th>
                  <th className="table__th">BoM Cost</th>
                </tr>
              </thead>
              <tbody>
                <tr className="table__tr">
                  <td className="table__td">Oak Wood Planks</td>
                  <td className="table__td">5.00</td>
                  <td className="table__td">$40.00</td>
                  <td className="table__td">$200.00</td>
                </tr>
                <tr className="table__tr">
                  <td className="table__td">Steel Screws</td>
                  <td className="table__td">100.00</td>
                  <td className="table__td">$0.20</td>
                  <td className="table__td">$20.00</td>
                </tr>
                <tr className="table__tr">
                  <td className="table__td">Wood Glue</td>
                  <td className="table__td">1.00</td>
                  <td className="table__td">$5.00</td>
                  <td className="table__td">$5.00</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 'var(--space-md)', textAlign: 'right', fontWeight: 600, fontSize: 'var(--text-lg)' }}>
            Total Material Cost: $225.00
          </div>
        </div>

        <div className="card">
          <h3 className="h3" style={{ marginBottom: 'var(--space-md)' }}>Information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            <div>
              <div className="input-label">Quantity Produced</div>
              <div className="text-md">1.00 Units</div>
            </div>
            <div>
              <div className="input-label">Routing</div>
              <div className="text-md">Main Assembly Line</div>
            </div>
            <div>
              <div className="input-label">Created</div>
              <div className="text-md text-muted">June 15, 2026</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
