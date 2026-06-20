import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { ROUTES } from '@/routes/routeMap';
import { useDb } from '@/store/db.store';
import { api } from '@/lib/api';

export default function BomCreatePage() {
  const navigate = useNavigate();
  const { products, refreshData } = useDb();
  
  const [finishedProductId, setFinishedProductId] = useState('');
  const [referenceQty, setReferenceQty] = useState('1');
  const [items, setItems] = useState<any[]>([{ productId: '', quantity: 1 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finishedProductId || items.some(i => !i.productId || i.quantity <= 0)) {
      alert('Please fill in all required fields properly.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/bom', {
        finishedProductId,
        referenceQty: Number(referenceQty),
        items: items.map(i => ({
          productId: i.productId,
          quantity: Number(i.quantity)
        }))
      });
      await refreshData();
      navigate(ROUTES.BOM_LIST);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create BoM');
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
            <h1 className="h2">New Bill of Materials</h1>
            <p className="text-sm text-muted">Define a product recipe</p>
          </div>
        </div>
        <div className="page-header__actions">
          <button className="btn btn--outline" onClick={() => navigate(-1)}>Cancel</button>
          <button className="btn btn--primary" onClick={handleSubmit} disabled={isSubmitting}>
            <Save size={16} /> {isSubmitting ? 'Saving...' : 'Save Recipe'}
          </button>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            <div className="input-group">
              <label className="input-label">Finished Product</label>
              <select className="input-field" value={finishedProductId} onChange={(e) => setFinishedProductId(e.target.value)} required>
                <option value="">Select a Product</option>
                {products?.filter(p => p.category === 'Finished Good').map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
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
                          {products?.filter(p => p.category !== 'Service').map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
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
        </form>
      </div>
    </div>
  );
}
