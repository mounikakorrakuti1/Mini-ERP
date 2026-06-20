import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { ROUTES } from '@/routes/routeMap';
import { useDb } from '@/store/db.store';
import { api } from '@/lib/api';

export default function ManufacturingOrderCreatePage() {
  const navigate = useNavigate();
  const { products, boms } = useDb();

  const [finishedProductId, setFinishedProductId] = useState('');
  const [bomId, setBomId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [plannedCompletionDate, setPlannedCompletionDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finishedProductId || !bomId || Number(quantity) <= 0) {
      alert('Please fill in all required fields.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/manufacturing-orders', {
        finishedProductId,
        bomId,
        quantity: Number(quantity),
        plannedCompletionDate: plannedCompletionDate ? new Date(plannedCompletionDate).toISOString() : undefined,
      });
      navigate(ROUTES.MANUFACTURING_ORDERS);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create manufacturing order');
      setIsSubmitting(false);
    }
  };

  const filteredBoms = boms.filter(b => b.finishedProductId === finishedProductId);

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
          <button className="btn btn--primary" onClick={handleSubmit} disabled={isSubmitting}>
            <Save size={16} /> {isSubmitting ? 'Saving...' : 'Save Draft'}
          </button>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            <div className="input-group">
              <label className="input-label">Product to Manufacture</label>
              <select className="input-field" value={finishedProductId} onChange={(e) => {
                setFinishedProductId(e.target.value);
                setBomId('');
              }} required>
                <option value="">Select a Product</option>
                {products?.filter(p => p.category === 'Finished Good').map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Bill of Materials</label>
              <select className="input-field" value={bomId} onChange={e => setBomId(e.target.value)} required disabled={!finishedProductId}>
                <option value="">Select BoM</option>
                {filteredBoms.map(b => (
                  <option key={b.id} value={b.id}>{b.reference}</option>
                ))}
              </select>
            </div>
            
            <div className="input-group">
              <label className="input-label">Quantity to Produce</label>
              <input type="number" min="1" step="0.1" value={quantity} onChange={e => setQuantity(e.target.value)} className="input-field" required />
            </div>

            <div className="input-group">
              <label className="input-label">Scheduled Date</label>
              <input type="date" value={plannedCompletionDate} onChange={e => setPlannedCompletionDate(e.target.value)} className="input-field" />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
