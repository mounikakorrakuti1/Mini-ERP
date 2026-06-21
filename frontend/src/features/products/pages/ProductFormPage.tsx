import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDb } from '@/store/db.store';
import { ROUTES } from '@/routes/routeMap';
import { api } from '@/lib/api';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';

interface FormState {
  name: string;
  reference: string;
  description: string;
  category: 'Raw Material' | 'Finished Good' | 'Service';
  costPrice: string;
  salesPrice: string;
  reorderPoint: string;
  safetyStock: string;
  procureOnDemand: boolean;
  procurementType: 'PURCHASE' | 'MANUFACTURING';
  defaultVendorId: string;
  defaultBomId: string;
}

const initial: FormState = {
  name: '', reference: '', description: '', category: 'Raw Material',
  costPrice: '', salesPrice: '', reorderPoint: '', safetyStock: '',
  procureOnDemand: false, procurementType: 'PURCHASE',
  defaultVendorId: '', defaultBomId: '',
};

export default function ProductFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const { addProduct, updateProduct, vendors, boms, refreshData } = useDb();

  const [form, setForm] = useState<FormState>(initial);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit && id) {
      api.get(`/products/${id}`).then(res => {
        const p = res.data.data;
        setForm({
          name: p.name || '',
          reference: p.reference || '',
          description: p.description || '',
          category: p.category || 'Raw Material',
          costPrice: String(p.costPrice ?? ''),
          salesPrice: String(p.salesPrice ?? ''),
          reorderPoint: String(p.reorderPoint ?? ''),
          safetyStock: String(p.safetyStock ?? ''),
          procureOnDemand: p.procureOnDemand ?? false,
          procurementType: p.procurementType || 'PURCHASE',
          defaultVendorId: p.defaultVendorId || '',
          defaultBomId: p.defaultBomId || '',
        });
      }).catch(() => {});
    }
  }, [id, isEdit]);

  const set = (field: keyof FormState, value: any) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.reference) { setError('Product Name and SKU are required.'); return; }
    setIsSaving(true);
    try {
      const payload = {
        name: form.name,
        reference: form.reference,
        description: form.description,
        category: form.category,
        costPrice: parseFloat(form.costPrice) || 0,
        salesPrice: parseFloat(form.salesPrice) || 0,
        reorderPoint: parseInt(form.reorderPoint) || 0,
        safetyStock: parseInt(form.safetyStock) || 0,
        procureOnDemand: form.procureOnDemand,
        procurementType: form.procureOnDemand ? form.procurementType : undefined,
        defaultVendorId: form.procurementType === 'PURCHASE' && form.defaultVendorId ? form.defaultVendorId : undefined,
        defaultBomId: form.procurementType === 'MANUFACTURING' && form.defaultBomId ? form.defaultBomId : undefined,
      };
      if (isEdit && id) {
        await updateProduct(id, payload);
      } else {
        await addProduct(payload);
      }
      navigate(ROUTES.PRODUCTS);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save product.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Delete this product? This cannot be undone.')) return;
    setIsDeleting(true);
    try {
      await api.delete(`/products/${id}`);
      await refreshData();
      navigate(ROUTES.PRODUCTS);
    } catch {
      setError('Failed to delete product.');
      setIsDeleting(false);
    }
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
      <h3 className="h3" style={{ borderBottom: '1px solid var(--border-main)', paddingBottom: 'var(--space-xs)', marginBottom: 'var(--space-xs)' }}>{title}</h3>
      {children}
    </div>
  );

  const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <div className="input-group">
      <label className="input-label">{label}{required && <span style={{ color: 'var(--status-danger)' }}> *</span>}</label>
      {children}
    </div>
  );

  const inputStyle = { padding: '0.45rem var(--space-sm)', appearance: 'auto' as any };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' as any, gap: 'var(--space-md)' }}>
      {/* Back + Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
        <div>
          <button type="button" className="btn btn--outline" onClick={() => navigate(ROUTES.PRODUCTS)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: 'var(--space-xs)' }}>
            <ArrowLeft size={14} /> Back
          </button>
          <h1 className="h1">{isEdit ? 'Edit Product' : 'New Product'}</h1>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
          {isEdit && (
            <button type="button" className="btn btn--outline" onClick={handleDelete} disabled={isDeleting} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--status-danger)', borderColor: 'var(--status-danger)' }}>
              <Trash2 size={16} /> {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          )}
          <button type="submit" className="btn btn--primary" disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Save size={16} /> {isSaving ? 'Saving...' : isEdit ? 'Update' : 'Save'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: 'var(--space-sm) var(--space-md)', backgroundColor: 'rgba(229,62,62,0.08)', border: '1px solid var(--status-danger)', borderRadius: '8px', color: 'var(--status-danger)', fontSize: 'var(--text-sm)' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-md)' }}>
        {/* Basic Info */}
        <Section title="Basic">
          <Field label="Product Name" required>
            <input className="input-field" style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Oak Dining Chair" />
          </Field>
          <Field label="SKU Code" required>
            <input className="input-field" style={inputStyle} value={form.reference} onChange={e => set('reference', e.target.value)} placeholder="e.g. SKU-001" />
          </Field>
          <Field label="Description">
            <textarea className="input-field" style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Product description..." />
          </Field>
          <Field label="Category">
            <select className="input-field" style={inputStyle} value={form.category} onChange={e => set('category', e.target.value as any)}>
              <option value="Raw Material">Raw Material</option>
              <option value="Finished Good">Finished Good</option>
              <option value="Service">Service</option>
            </select>
          </Field>
        </Section>

        {/* Pricing */}
        <Section title="Pricing">
          <Field label="Cost Price (₹)">
            <input className="input-field" style={inputStyle} type="number" min="0" step="0.01" value={form.costPrice} onChange={e => set('costPrice', e.target.value)} placeholder="0.00" />
          </Field>
          <Field label="Sales Price (₹)">
            <input className="input-field" style={inputStyle} type="number" min="0" step="0.01" value={form.salesPrice} onChange={e => set('salesPrice', e.target.value)} placeholder="0.00" />
          </Field>
        </Section>

        {/* Inventory */}
        <Section title="Inventory">
          <Field label="Reorder Point">
            <input className="input-field" style={inputStyle} type="number" min="0" value={form.reorderPoint} onChange={e => set('reorderPoint', e.target.value)} placeholder="e.g. 10" />
          </Field>
          <Field label="Safety Stock">
            <input className="input-field" style={inputStyle} type="number" min="0" value={form.safetyStock} onChange={e => set('safetyStock', e.target.value)} placeholder="e.g. 5" />
          </Field>
        </Section>

        {/* Procurement */}
        <Section title="Procurement">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: 'var(--space-xs) 0' }}>
            <input type="checkbox" id="procureOnDemand" checked={form.procureOnDemand} onChange={e => set('procureOnDemand', e.target.checked)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
            <label htmlFor="procureOnDemand" className="input-label" style={{ cursor: 'pointer', marginBottom: 0 }}>Procure On Demand (MTO)</label>
          </div>

          {form.procureOnDemand && (
            <>
              <Field label="Procurement Method">
                <select className="input-field" style={inputStyle} value={form.procurementType} onChange={e => set('procurementType', e.target.value as any)}>
                  <option value="PURCHASE">Purchase (from Vendor)</option>
                  <option value="MANUFACTURING">Manufacturing (from BOM)</option>
                </select>
              </Field>

              {form.procurementType === 'PURCHASE' && (
                <Field label="Default Vendor">
                  <select className="input-field" style={inputStyle} value={form.defaultVendorId} onChange={e => set('defaultVendorId', e.target.value)}>
                    <option value="">-- Select Vendor --</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </Field>
              )}

              {form.procurementType === 'MANUFACTURING' && (
                <Field label="Default BOM">
                  <select className="input-field" style={inputStyle} value={form.defaultBomId} onChange={e => set('defaultBomId', e.target.value)}>
                    <option value="">-- Select BOM --</option>
                    {boms.map(b => <option key={b.id} value={b.id}>{b.name || b.code}</option>)}
                  </select>
                </Field>
              )}
            </>
          )}
        </Section>
      </div>
    </form>
  );
}
