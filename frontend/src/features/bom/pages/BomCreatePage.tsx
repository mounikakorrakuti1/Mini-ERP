import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, GitMerge } from 'lucide-react';
import { ROUTES } from '@/routes/routeMap';
import { useDb } from '@/store/db.store';
import { api } from '@/lib/api';

export default function BomCreatePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, refreshData } = useDb();
  
  const isEditMode = Boolean(id);

  const [finishedProductId, setFinishedProductId] = useState('');
  const [referenceQty, setReferenceQty] = useState('1');
  const [items, setItems] = useState<any[]>([{ productId: '', quantity: 1 }]);
  const [operations, setOperations] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      const fetchBom = async () => {
        try {
          const res = await api.get(`/bom/${id}`);
          const data = res.data.data;
          setFinishedProductId(data.finishedProductId);
          setReferenceQty(data.referenceQty.toString());
          if (data.items?.length) {
            setItems(data.items.map((i: any) => ({ productId: i.productId, quantity: i.quantity })));
          }
          if (data.operations?.length) {
            setOperations(data.operations.map((o: any) => ({ name: o.name, workCenter: o.workCenter || '', expectedMinutes: o.expectedMinutes })));
          }
        } catch (err) {
          console.error('Failed to fetch BoM', err);
          alert('Failed to load BoM details for editing');
        }
      };
      fetchBom();
    }
  }, [id]);

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { productId: '', quantity: 1 }]);
  
  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleOperationChange = (index: number, field: string, value: any) => {
    const newOps = [...operations];
    newOps[index] = { ...newOps[index], [field]: value };
    setOperations(newOps);
  };

  const addOperation = () => setOperations([...operations, { name: '', workCenter: '', expectedMinutes: 15 }]);
  
  const removeOperation = (index: number) => {
    const newOps = [...operations];
    newOps.splice(index, 1);
    setOperations(newOps);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finishedProductId || items.some(i => !i.productId || i.quantity <= 0)) {
      alert('Please fill in all required fields properly, and ensure at least one component exists.');
      return;
    }
    if (operations.some(o => !o.name || o.expectedMinutes <= 0)) {
      alert('Please ensure all operations have a valid name and expected minutes.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        finishedProductId,
        referenceQty: Number(referenceQty),
        items: items.map(i => ({
          productId: i.productId,
          quantity: Number(i.quantity)
        })),
        operations: operations.map(o => ({
          name: o.name,
          workCenter: o.workCenter || undefined,
          expectedMinutes: Number(o.expectedMinutes)
        }))
      };

      if (isEditMode) {
        await api.patch(`/bom/${id}`, payload);
      } else {
        await api.post('/bom', payload);
      }
      
      await refreshData();
      navigate(ROUTES.BOM_LIST);
    } catch (error: any) {
      alert(error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} BoM`);
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <button className="btn btn--icon" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="h2">{isEditMode ? 'Edit Bill of Materials' : 'New Bill of Materials'}</h1>
            <p className="text-sm text-muted">{isEditMode ? 'Modify an existing product recipe' : 'Define a product recipe'}</p>
          </div>
        </div>
        <div className="page-header__actions">
          <button type="button" className="btn btn--outline" onClick={() => navigate(-1)}>Cancel</button>
          <button type="button" className="btn btn--primary" onClick={handleSubmit} disabled={isSubmitting}>
            <Save size={16} /> {isSubmitting ? 'Saving...' : 'Save Recipe'}
          </button>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            <div className="input-group">
              <label className="input-label">Finished Product</label>
              <select className="input-field" value={finishedProductId} onChange={(e) => setFinishedProductId(e.target.value)} required>
                <option value="">Select a Product</option>
                {products?.filter(p => p.category === 'FINISHED_GOOD').map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.reference})</option>
                ))}
              </select>
            </div>
            
            <div className="input-group">
              <label className="input-label">Quantity to Produce</label>
              <input type="number" min="1" step="0.1" value={referenceQty} onChange={(e) => setReferenceQty(e.target.value)} className="input-field" required />
            </div>
          </div>

          <div>
            <h3 className="h3" style={{ marginBottom: 'var(--space-xs)' }}>Components</h3>
            <p className="text-sm text-muted" style={{ marginBottom: 'var(--space-sm)' }}>Define the raw materials required to produce this item.</p>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th className="table__th">Material</th>
                    <th className="table__th">Quantity</th>
                    <th className="table__th"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr className="table__tr" key={index}>
                      <td className="table__td">
                        <select className="input-field" style={{ width: '100%' }} value={item.productId} onChange={(e) => handleItemChange(index, 'productId', e.target.value)} required>
                          <option value="">Select Material...</option>
                          {products?.filter(p => p.category !== 'SERVICE').map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.reference})</option>
                          ))}
                        </select>
                      </td>
                      <td className="table__td"><input type="number" min="0.1" step="0.1" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} className="input-field" style={{ width: '120px' }} required /></td>
                      <td className="table__td" style={{ textAlign: 'right' }}>
                        <button type="button" className="btn btn--icon" style={{ color: 'var(--status-danger)' }} onClick={() => removeItem(index)}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" className="btn btn--outline" style={{ marginTop: 'var(--space-sm)' }} onClick={addItem}>
              <Plus size={16} /> Add Component
            </button>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', marginBottom: 'var(--space-xs)' }}>
              <GitMerge size={20} color="var(--accent-main)" />
              <h3 className="h3">Operations (Routing)</h3>
            </div>
            <p className="text-sm text-muted" style={{ marginBottom: 'var(--space-sm)' }}>Optional: Define the manufacturing steps and work centers.</p>
            {operations.length > 0 && (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th className="table__th">Operation Name</th>
                      <th className="table__th">Work Center</th>
                      <th className="table__th">Expected Time (mins)</th>
                      <th className="table__th"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {operations.map((op, index) => (
                      <tr className="table__tr" key={index}>
                        <td className="table__td">
                          <input type="text" value={op.name} onChange={(e) => handleOperationChange(index, 'name', e.target.value)} className="input-field" style={{ width: '100%' }} placeholder="e.g. Assembly" required />
                        </td>
                        <td className="table__td">
                          <input type="text" value={op.workCenter} onChange={(e) => handleOperationChange(index, 'workCenter', e.target.value)} className="input-field" style={{ width: '100%' }} placeholder="e.g. Workstation 1" />
                        </td>
                        <td className="table__td">
                          <input type="number" min="1" step="1" value={op.expectedMinutes} onChange={(e) => handleOperationChange(index, 'expectedMinutes', e.target.value)} className="input-field" style={{ width: '140px' }} required />
                        </td>
                        <td className="table__td" style={{ textAlign: 'right' }}>
                          <button type="button" className="btn btn--icon" style={{ color: 'var(--status-danger)' }} onClick={() => removeOperation(index)}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <button type="button" className="btn btn--outline" style={{ marginTop: 'var(--space-sm)' }} onClick={addOperation}>
              <Plus size={16} /> Add Operation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
