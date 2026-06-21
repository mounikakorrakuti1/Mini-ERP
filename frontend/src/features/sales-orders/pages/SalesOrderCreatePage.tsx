import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { ROUTES } from '@/routes/routeMap';
import { useDb } from '@/store/db.store';
import { api } from '@/lib/api';

export default function SalesOrderCreatePage() {
  const navigate = useNavigate();
  const { customers, products } = useDb();
  
  const [customerId, setCustomerId] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [items, setItems] = useState<any[]>([{ productId: '', orderedQty: 1, salesPrice: 0 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    const newItems = [...items];
    newItems[index] = { 
      ...newItems[index], 
      productId, 
      salesPrice: product ? product.salesPrice : 0 
    };
    setItems(newItems);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { productId: '', orderedQty: 1, salesPrice: 0 }]);
  
  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || items.length === 0 || items.some(i => !i.productId || i.orderedQty <= 0)) {
      alert('Please fill in all required fields properly, and ensure there is at least one item.');
      return;
    }
    const productIds = items.map(i => i.productId);
    if (new Set(productIds).size !== productIds.length) {
      alert('Duplicate products are not allowed in the same order. Please combine quantities for the same product.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/sales-orders', {
        customerId,
        expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate).toISOString() : undefined,
        items: items.map(i => ({
          productId: i.productId,
          orderedQty: Number(i.orderedQty),
          salesPrice: Number(i.salesPrice)
        }))
      });
      navigate(ROUTES.SALES_ORDERS);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create sales order');
      setIsSubmitting(false);
    }
  };

  const total = items.reduce((sum, item) => sum + (item.orderedQty * item.salesPrice), 0);

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <button className="btn btn--icon" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="h2">New Sales Order</h1>
            <p className="text-sm text-muted">Create a new order for a customer</p>
          </div>
        </div>
        <div className="page-header__actions">
          <button className="btn btn--outline" onClick={() => navigate(-1)}>Cancel</button>
          <button className="btn btn--primary" onClick={handleSubmit} disabled={isSubmitting}>
            <Save size={16} /> {isSubmitting ? 'Saving...' : 'Save Order'}
          </button>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            <div className="input-group">
              <label className="input-label">Customer</label>
              <select className="input-field" value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
                <option value="">Select a Customer</option>
                {customers?.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            
            <div className="input-group">
              <label className="input-label">Expected Date</label>
              <input type="date" className="input-field" value={expectedDeliveryDate} onChange={e => setExpectedDeliveryDate(e.target.value)} />
            </div>
          </div>

          <div>
            <h3 className="h3" style={{ marginBottom: 'var(--space-xs)' }}>Order Lines</h3>
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
                          <option value="">Select Product...</option>
                          {products?.filter(p => p.category === 'FINISHED_GOOD' || p.category === 'SERVICE').map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.reference})</option>
                          ))}
                        </select>
                      </td>
                      <td className="table__td"><input type="number" min="1" value={item.orderedQty} onChange={(e) => handleItemChange(index, 'orderedQty', e.target.value)} className="input-field" style={{ width: '100px' }} required /></td>
                      <td className="table__td"><input type="number" min="0" step="0.01" value={item.salesPrice} onChange={(e) => handleItemChange(index, 'salesPrice', e.target.value)} className="input-field" style={{ width: '140px' }} required /></td>
                      <td className="table__td" style={{ verticalAlign: 'middle' }}>${(item.orderedQty * item.salesPrice).toLocaleString()}</td>
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
                <Plus size={16} /> Add Line Item
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
