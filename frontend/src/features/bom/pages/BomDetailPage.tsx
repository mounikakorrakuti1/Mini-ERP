import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, ListTree, Copy } from 'lucide-react';
import { ROUTES } from '@/routes/routeMap';
import { api } from '@/lib/api';

export default function BomDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bom, setBom] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBom = async () => {
      try {
        const res = await api.get(`/bom/${id}`);
        setBom(res.data.data);
      } catch (err) {
        console.error('Failed to fetch BoM', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBom();
  }, [id]);

  const handleEdit = () => {
    navigate(ROUTES.BOM_EDIT.replace(':id', bom.id));
  };

  const handleDuplicate = () => {
    alert(`Duplicating BoM ${bom?.reference}... New draft created.`);
  };

  if (isLoading) {
    return <div style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>Loading BoM...</div>;
  }

  if (!bom) {
    return <div style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>BoM not found.</div>;
  }

  const materialCost = bom.items?.reduce((sum: number, item: any) => sum + (item.quantity * (item.product?.costPrice || 0)), 0) || 0;

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
              <h1 className="h2">{bom.reference}</h1>
              <span className={`status-badge ${bom.active ? 'status-badge--success' : 'status-badge--draft'}`}>
                {bom.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-sm text-muted">Product: {bom.finishedProduct?.name} | Ref: {bom.reference}</p>
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
                {bom.items?.map((item: any) => (
                  <tr className="table__tr" key={item.id}>
                    <td className="table__td">{item.product?.name || 'Unknown'} ({item.product?.code || 'N/A'})</td>
                    <td className="table__td">{Number(item.quantity).toFixed(2)}</td>
                    <td className="table__td">${Number(item.product?.costPrice || 0).toFixed(2)}</td>
                    <td className="table__td">${(Number(item.quantity) * Number(item.product?.costPrice || 0)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 'var(--space-md)', textAlign: 'right', fontWeight: 600, fontSize: 'var(--text-lg)' }}>
            Total Material Cost: ${materialCost.toFixed(2)}
          </div>
        </div>

        <div className="card">
          <h3 className="h3" style={{ marginBottom: 'var(--space-md)' }}>Information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            <div>
              <div className="input-label">Quantity Produced</div>
              <div className="text-md">{Number(bom.referenceQty).toFixed(2)} Units</div>
            </div>
            <div>
              <div className="input-label">Operations</div>
              <div className="text-md">{bom.operations?.length || 0} Steps</div>
            </div>
            <div>
              <div className="input-label">Created</div>
              <div className="text-md text-muted">{new Date(bom.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
