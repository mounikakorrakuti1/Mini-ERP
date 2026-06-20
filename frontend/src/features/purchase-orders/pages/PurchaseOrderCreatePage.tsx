import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { ROUTES } from '@/routes/routeMap';
import { useDb } from '@/store/db.store';
import { api } from '@/lib/api';

export default function PurchaseOrderCreatePage() {
  const navigate = useNavigate();
  const { vendors, products } = useDb();
  
  const [vendorId, setVendorId] = useState('');
  const [expectedReceiptDate, setExpectedReceiptDate] = useState('');
  const [items, setItems] = useState<any[]>([{ productId: '', orderedQty: 1, costPrice: 0 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    const newItems = [...items];
    newItems[index] = { 
      ...newItems[index], 
      productId, 
      costPrice: product ? product.costPrice : 0 
    };
    setItems(newItems);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { productId: '', orderedQty: 1, costPrice: 0 }]);
  
  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId || items.some(i => !i.productId || i.orderedQty <= 0)) {
      alert('Please fill in all required fields properly.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/purchase-orders', {
        vendorId,
        expectedReceiptDate: expectedReceiptDate ? new Date(expectedReceiptDate).toISOString() : undefined,
        items: items.map(i => ({
          productId: i.productId,
          orderedQty: Number(i.orderedQty),
          costPrice: Number(i.costPrice)
        }))
      });
      navigate(ROUTES.PURCHASE_ORDERS);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create purchase order');
      setIsSubmitting(false);
    }
  };

  const total = items.reduce((sum, item) => sum + (item.orderedQty * item.costPrice), 0);

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
          <button className="btn btn--primary" onClick={handleSubmit} disabled={isSubmitting}>
            <Save size={16} /> {isSubmitting ? 'Saving...' : 'Save Draft'}
          </button>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            <div className="input-group">
              <label className="input-label">Vendor</label>
              <select className="input-field" value={vendorId} onChange={(e) => setVendorId(e.target.value)} required>
                <option value="">Select a Vendor</option>
                {vendors?.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            
            <div className="input-group">
              <label className="input-label">Expected Date</label>
              <input type="date" className="input-field" value={expectedReceiptDate} onChange={e => setExpectedReceiptDate(e.target.value)} />
            </div>
          </div>

          <div>
            <h3 className="h3" style={{ marginBottom: 'var(--space-xs)' }}>Products</h3>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th className="table__th">Product</th>
                    <th className="table__th">Quantity</th>
                    <th className="table__th">Unit Price</th>
                    <th className="table__th">Subtotal</th>
                    <th className="table__th"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr className="table__tr" key={index}>
                      <td className="table__td">
                        <select className="input-field" style={{ width: '100%' }} value={item.productId} onChange={(e) => handleProductChange(index, e.target.value)} required>
                          <option value="">Select Material...</option>
                          {products?.filter(p => p.category === 'Raw Material' || p.category === 'Component').map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                          ))}
                        </select>
                      </td>
                      <td className="table__td"><input type="number" min="1" value={item.orderedQty} onChange={(e) => handleItemChange(index, 'orderedQty', e.target.value)} className="input-field" style={{ width: '100px' }} required /></td>
                      <td className="table__td"><input type="number" step="0.01" value={item.costPrice} onChange={(e) => handleItemChange(index, 'costPrice', e.target.value)} className="input-field" style={{ width: '140px' }} required /></td>
                      <td className="table__td" style={{ verticalAlign: 'middle' }}>${(item.orderedQty * item.costPrice).toLocaleString()}</td>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-sm)' }}>
              <button type="button" className="btn btn--outline" onClick={addItem}>
                <Plus size={16} /> Add Product
              </button>
              <div style={{ fontWeight: 600, fontSize: 'var(--text-lg)' }}>
                Total: ${total.toLocaleString()}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
