import { useState, useEffect } from 'react';
import { useDb } from '@/store/db.store';
import { validateProduct, type ProductFormData, type ProductFormErrors } from '../products.validation';
import type { Product } from '@/store/db.store';

interface ProductFormProps {
  initialData?: Product;
  onSubmit: (data: ProductFormData) => void;
  onCancel: () => void;
}

export function ProductForm({ initialData, onSubmit, onCancel }: ProductFormProps) {
  const { vendors, boms } = useDb();

  // ─── Local State ─────────────────────────────────────────────────
  const [name, setName] = useState(initialData?.name ?? '');
  const [reference, setReference] = useState(initialData?.reference ?? '');
  const [category, setCategory] = useState<'RAW_MATERIAL' | 'FINISHED_GOOD' | 'SERVICE'>(
    initialData?.category ?? 'RAW_MATERIAL'
  );
  const [salesPrice, setSalesPrice] = useState(initialData?.salesPrice?.toString() ?? '0');
  const [costPrice, setCostPrice] = useState(initialData?.costPrice?.toString() ?? '0');
  const [reorderPoint, setReorderPoint] = useState(initialData?.reorderPoint?.toString() ?? '0');
  const [procureOnDemand, setProcureOnDemand] = useState(initialData?.procureOnDemand ?? false);
  const [procurementType, setProcurementType] = useState<'PURCHASE' | 'MANUFACTURING' | undefined>(
    initialData?.procurementType
  );
  const [defaultVendorId, setDefaultVendorId] = useState(initialData?.defaultVendorId ?? '');
  const [defaultBomId, setDefaultBomId] = useState(initialData?.defaultBomId ?? '');

  const [errors, setErrors] = useState<ProductFormErrors>({});

  // ─── Dropdowns Filtering ─────────────────────────────────────────
  // Filter BoMs to show only ones matching the current finished product's code or code being edited
  const filteredBoms = boms.filter(b => b.finishedProductId === initialData?.id);

  // If procureOnDemand is toggled off, reset sub-options
  useEffect(() => {
    if (!procureOnDemand) {
      setProcurementType(undefined);
      setDefaultVendorId('');
      setDefaultBomId('');
    } else if (!procurementType) {
      setProcurementType('PURCHASE');
    }
  }, [procureOnDemand]);

  // Adjust procurement choices based on category dynamically for helpful defaults
  useEffect(() => {
    if (procureOnDemand && !initialData) {
      if (category === 'FINISHED_GOOD') {
        setProcurementType('MANUFACTURING');
      } else {
        setProcurementType('PURCHASE');
      }
    }
  }, [category, procureOnDemand, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData: ProductFormData = {
      name,
      reference,
      category,
      salesPrice: parseFloat(salesPrice) || 0,
      costPrice: parseFloat(costPrice) || 0,
      reorderPoint: parseFloat(reorderPoint) || 0,
      procureOnDemand,
      procurementType: procureOnDemand ? procurementType : undefined,
      defaultVendorId: procureOnDemand && procurementType === 'PURCHASE' ? defaultVendorId : undefined,
      defaultBomId: procureOnDemand && procurementType === 'MANUFACTURING' ? defaultBomId : undefined,
    };

    const validation = validateProduct(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      <div style={{ borderBottom: '1px solid var(--border-main)', paddingBottom: 'var(--space-xs)', marginBottom: 'var(--space-xs)' }}>
        <h2 className="h2">{initialData ? 'Edit Product Details' : 'Create Product Catalog Entry'}</h2>
        <p className="text-xs">Configure the metadata, prices, inventory triggers and procurement paths.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-md)' }}>
        {/* Code */}
        <div className="input-group">
          <label className="input-label">Product SKU Code *</label>
          <input
            type="text"
            className="input-field"
            value={reference}
            onChange={(e) => {
              setReference(e.target.value);
              if (errors.reference) setErrors(prev => ({ ...prev, reference: undefined }));
            }}
            placeholder="e.g. TEAK-WOOD-PLK"
          />
          {errors.reference && <span className="text-xs" style={{ color: 'var(--status-danger)' }}>{errors.reference}</span>}
        </div>

        {/* Name */}
        <div className="input-group">
          <label className="input-label">Product Name *</label>
          <input
            type="text"
            className="input-field"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
            }}
            placeholder="e.g. Teak Wood Planks"
          />
          {errors.name && <span className="text-xs" style={{ color: 'var(--status-danger)' }}>{errors.name}</span>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-md)' }}>
        {/* Category */}
        <div className="input-group">
          <label className="input-label">Product Category</label>
          <select
            className="input-field"
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            style={{ appearance: 'auto' }}
          >
            <option value="RAW_MATERIAL">Raw Material</option>
            <option value="FINISHED_GOOD">Finished Good</option>
            <option value="SERVICE">Service</option>
          </select>
        </div>

        {/* Reorder Point */}
        <div className="input-group">
          <label className="input-label">Reorder Point Threshold (Qty)</label>
          <input
            type="number"
            className="input-field"
            value={reorderPoint}
            onChange={(e) => {
              setReorderPoint(e.target.value);
              if (errors.reorderPoint) setErrors(prev => ({ ...prev, reorderPoint: undefined }));
            }}
            placeholder="0"
          />
          {errors.reorderPoint && <span className="text-xs" style={{ color: 'var(--status-danger)' }}>{errors.reorderPoint}</span>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-md)' }}>
        {/* Sales Price */}
        <div className="input-group">
          <label className="input-label">Sales Price (₹)</label>
          <input
            type="number"
            className="input-field"
            value={salesPrice}
            onChange={(e) => {
              setSalesPrice(e.target.value);
              if (errors.salesPrice) setErrors(prev => ({ ...prev, salesPrice: undefined }));
            }}
            placeholder="0"
          />
          {errors.salesPrice && <span className="text-xs" style={{ color: 'var(--status-danger)' }}>{errors.salesPrice}</span>}
        </div>

        {/* Cost Price */}
        <div className="input-group">
          <label className="input-label">Cost Price (₹)</label>
          <input
            type="number"
            className="input-field"
            value={costPrice}
            onChange={(e) => {
              setCostPrice(e.target.value);
              if (errors.costPrice) setErrors(prev => ({ ...prev, costPrice: undefined }));
            }}
            placeholder="0"
          />
          {errors.costPrice && <span className="text-xs" style={{ color: 'var(--status-danger)' }}>{errors.costPrice}</span>}
        </div>
      </div>

      {/* Procure on Demand Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', margin: 'var(--space-xs) 0' }}>
        <input
          type="checkbox"
          id="procureOnDemand"
          checked={procureOnDemand}
          onChange={(e) => setProcureOnDemand(e.target.checked)}
          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
        />
        <label htmlFor="procureOnDemand" className="input-label" style={{ cursor: 'pointer' }}>
          Procure on Demand (MTO — Make to Order / Trigger replenishment immediately upon demand shortage)
        </label>
      </div>

      {/* Conditional Procurement Fields */}
      {procureOnDemand && (
        <div className="card" style={{ backgroundColor: 'var(--bg-app)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <h4 className="text-md">Replenishment Configuration</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-md)' }}>
            
            {/* Procurement Type */}
            <div className="input-group">
              <label className="input-label">Procurement Method</label>
              <select
                className="input-field"
                value={procurementType}
                onChange={(e) => {
                  setProcurementType(e.target.value as any);
                  if (errors.procurementType) setErrors(prev => ({ ...prev, procurementType: undefined }));
                }}
                style={{ appearance: 'auto' }}
              >
                <option value="PURCHASE">Purchase (Buy from supplier)</option>
                <option value="MANUFACTURING">Manufacturing (Produce in-house)</option>
              </select>
              {errors.procurementType && <span className="text-xs" style={{ color: 'var(--status-danger)' }}>{errors.procurementType}</span>}
            </div>

            {/* Default Supplier Vendor */}
            {procurementType === 'PURCHASE' && (
              <div className="input-group">
                <label className="input-label">Default Supplier Vendor *</label>
                <select
                  className="input-field"
                  value={defaultVendorId}
                  onChange={(e) => {
                    setDefaultVendorId(e.target.value);
                    if (errors.defaultVendorId) setErrors(prev => ({ ...prev, defaultVendorId: undefined }));
                  }}
                  style={{ appearance: 'auto' }}
                >
                  <option value="">-- Select Vendor --</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.code})</option>
                  ))}
                </select>
                {errors.defaultVendorId && <span className="text-xs" style={{ color: 'var(--status-danger)' }}>{errors.defaultVendorId}</span>}
              </div>
            )}

            {/* Default Bill of Materials (BoM) */}
            {procurementType === 'MANUFACTURING' && (
              <div className="input-group">
                <label className="input-label">Default Bill of Materials (BoM) *</label>
                <select
                  className="input-field"
                  value={defaultBomId}
                  onChange={(e) => {
                    setDefaultBomId(e.target.value);
                    if (errors.defaultBomId) setErrors(prev => ({ ...prev, defaultBomId: undefined }));
                  }}
                  style={{ appearance: 'auto' }}
                >
                  <option value="">-- Select BoM --</option>
                  {boms.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                {errors.defaultBomId && <span className="text-xs" style={{ color: 'var(--status-danger)' }}>{errors.defaultBomId}</span>}
              </div>
            )}

          </div>
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
        <button type="button" className="btn btn--outline" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary">
          {initialData ? 'Save Changes' : 'Create Product'}
        </button>
      </div>
    </form>
  );
}
