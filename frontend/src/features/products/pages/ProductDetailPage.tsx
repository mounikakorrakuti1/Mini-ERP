import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDb } from '@/store/db.store';
import { useAuthStore } from '@/store/auth.store';
import { hasPermission } from '@/lib/permissions';
import { MODULE, PERMISSION_ACTION } from '@/types/enums';
import { ArrowLeft, Edit3, ShieldAlert, BadgeInfo, Boxes, History, Settings2, Package, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { ROUTES } from '@/routes/routeMap';
import { ProductForm } from '../components/ProductForm';
import { StockAdjustmentModal } from '../components/StockAdjustmentModal';
import type { ProductFormData } from '../products.validation';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, stockMovements, vendors, boms, updateProduct, adjustStock } = useDb();
  const { user } = useAuthStore();

  // Find product
  const product = products.find((p) => p.id === id);

  // ─── Local State ─────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'history' | 'procurement'>('inventory');

  if (!product) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
        <h2 className="h2" style={{ color: 'var(--status-danger)' }}>Product Not Found</h2>
        <p className="text-sm" style={{ margin: 'var(--space-sm) 0' }}>
          The product SKU or ID you are trying to view does not exist in the database.
        </p>
        <button className="btn btn--outline" onClick={() => navigate(ROUTES.PRODUCTS)}>
          <ArrowLeft size={16} /> Back to Catalog
        </button>
      </div>
    );
  }

  // ─── RBAC Checks ─────────────────────────────────────────────────
  const canEdit = hasPermission(user?.permissions, MODULE.PRODUCTS, PERMISSION_ACTION.ADMIN);
  const canAdjustStock = hasPermission(user?.permissions, MODULE.INVENTORY, PERMISSION_ACTION.ADMIN);

  // ─── Handlers ────────────────────────────────────────────────────
  const handleUpdate = async (data: ProductFormData) => {
    try {
      await updateProduct(product.id, {
        ...data,
      });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert('Failed to update product details. Please check your inputs.');
    }
  };

  const handleStockAdjustment = (direction: 'IN' | 'OUT', quantity: number, reason: string) => {
    adjustStock(product.id, direction, quantity, reason);
  };

  // Filter stock movements relating to this product
  const productMovements = stockMovements.filter((m) => m.productId === product.id);

  // Reorder point stats
  const isLowStock = product.available < product.reorderPoint;
  const defaultVendor = vendors.find(v => v.id === product.defaultVendorId);
  const defaultBom = boms.find(b => b.id === product.defaultBomId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* Back button */}
      <div>
        <button
          className="btn btn--outline"
          onClick={() => navigate(ROUTES.PRODUCTS)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-xs)' }}
        >
          <ArrowLeft size={16} />
          <span>Back to Catalog</span>
        </button>
      </div>

      {isEditing ? (
        <ProductForm
          initialData={product}
          onSubmit={handleUpdate}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <>
          {/* Main Details Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <h1 className="h1">{product.name}</h1>
                  <span
                    className="text-xs"
                    style={{
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      backgroundColor:
                        product.category === 'RAW_MATERIAL'
                          ? 'rgba(3, 105, 161, 0.1)'
                          : product.category === 'FINISHED_GOOD'
                            ? 'rgba(56, 161, 105, 0.1)'
                            : 'rgba(113, 128, 150, 0.1)',
                      color:
                        product.category === 'RAW_MATERIAL'
                          ? 'var(--accent-main)'
                          : product.category === 'FINISHED_GOOD'
                            ? 'var(--status-success)'
                            : 'var(--text-muted)',
                      fontWeight: 600,
                    }}
                  >
                    {product.category}
                  </span>
                </div>
                <div className="text-sm" style={{ color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '2px' }}>
                  SKU Code: {product.reference}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                {canAdjustStock && (
                  <button className="btn btn--outline" onClick={() => setIsAdjusting(true)}>
                    <Boxes size={16} />
                    <span>Adjust Stock</span>
                  </button>
                )}
                {canEdit && (
                  <button className="btn btn--primary" onClick={() => setIsEditing(true)}>
                    <Edit3 size={16} />
                    <span>Edit Product</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-md)', marginTop: 'var(--space-xs)' }}>
              <div className="card" style={{ padding: 'var(--space-sm) var(--space-md)', backgroundColor: 'var(--bg-app)', borderLeft: '4px solid var(--accent-main)' }}>
                <div className="text-xs">Sales Price</div>
                <div className="h3" style={{ fontFamily: 'monospace' }}>₹{product.salesPrice.toLocaleString('en-IN')}</div>
              </div>
              <div className="card" style={{ padding: 'var(--space-sm) var(--space-md)', backgroundColor: 'var(--bg-app)', borderLeft: '4px solid var(--text-muted)' }}>
                <div className="text-xs">Cost Price</div>
                <div className="h3" style={{ fontFamily: 'monospace' }}>₹{product.costPrice.toLocaleString('en-IN')}</div>
              </div>
              <div className="card" style={{ padding: 'var(--space-sm) var(--space-md)', backgroundColor: 'var(--bg-app)', borderLeft: `4px solid ${isLowStock ? 'var(--status-danger)' : 'var(--status-success)'}` }}>
                <div className="text-xs">Free-to-Use</div>
                <div className="h3" style={{ fontFamily: 'monospace', color: isLowStock ? 'var(--status-danger)' : 'var(--status-success)' }}>
                  {product.available}
                </div>
              </div>
              <div className="card" style={{ padding: 'var(--space-sm) var(--space-md)', backgroundColor: 'var(--bg-app)', borderLeft: '4px solid var(--status-warning)' }}>
                <div className="text-xs">Reorder Point</div>
                <div className="h3" style={{ fontFamily: 'monospace' }}>{product.reorderPoint}</div>
              </div>
            </div>
          </div>

          {/* Low Stock Warning Banner */}
          {isLowStock && (
            <div
              className="card"
              style={{
                backgroundColor: 'rgba(229, 62, 62, 0.08)',
                border: '1px solid var(--status-danger)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-sm)',
                padding: 'var(--space-sm) var(--space-md)',
              }}
            >
              <ShieldAlert size={20} color="var(--status-danger)" />
              <div>
                <strong style={{ color: 'var(--status-danger)', fontSize: 'var(--text-sm)' }}>Low Stock Alert! </strong>
                <span className="text-sm">
                  The Free-to-Use stock level ({product.freeToUse}) has dropped below the configured reorder threshold ({product.reorderPoint}).
                  {product.procureOnDemand && ` This item will automatically trigger a replenishment order via ${product.procurementType} when sales order request is confirmed.`}
                </span>
              </div>
            </div>
          )}

          {/* Detailed Info Tabs */}
          <div>
            {/* Tabs Header */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-main)', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
              <button
                style={{
                  padding: 'var(--space-xs) var(--space-md)',
                  fontWeight: 500,
                  fontSize: 'var(--text-sm)',
                  color: activeTab === 'inventory' ? 'var(--accent-main)' : 'var(--text-muted)',
                  borderBottom: activeTab === 'inventory' ? '2px solid var(--accent-main)' : '2px solid transparent',
                  transition: 'all 0.15s ease',
                }}
                onClick={() => setActiveTab('inventory')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Boxes size={16} /> Inventory Snapshot
                </div>
              </button>
              <button
                style={{
                  padding: 'var(--space-xs) var(--space-md)',
                  fontWeight: 500,
                  fontSize: 'var(--text-sm)',
                  color: activeTab === 'history' ? 'var(--accent-main)' : 'var(--text-muted)',
                  borderBottom: activeTab === 'history' ? '2px solid var(--accent-main)' : '2px solid transparent',
                  transition: 'all 0.15s ease',
                }}
                onClick={() => setActiveTab('history')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <History size={16} /> Stock Card Timeline ({productMovements.length})
                </div>
              </button>
              <button
                style={{
                  padding: 'var(--space-xs) var(--space-md)',
                  fontWeight: 500,
                  fontSize: 'var(--text-sm)',
                  color: activeTab === 'procurement' ? 'var(--accent-main)' : 'var(--text-muted)',
                  borderBottom: activeTab === 'procurement' ? '2px solid var(--accent-main)' : '2px solid transparent',
                  transition: 'all 0.15s ease',
                }}
                onClick={() => setActiveTab('procurement')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Settings2 size={16} /> Procurement Settings
                </div>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="card" style={{ minHeight: '200px' }}>
              {activeTab === 'inventory' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                  <h3 className="h3">Current Warehouse Quantities</h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)', marginTop: '-8px' }}>
                    Standard mathematical constraint: Free-to-Use = On Hand - Reserved.
                  </p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-md)', marginTop: 'var(--space-sm)' }}>
                    <div style={{ padding: 'var(--space-md)', border: '1px solid var(--border-main)', borderRadius: 'var(--radius)' }}>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>On Hand Quantity</div>
                      <div className="h2" style={{ fontFamily: 'monospace', margin: '4px 0' }}>{product.onHand}</div>
                      <p className="text-xs">Physical inventory count in the warehouse shelves.</p>
                    </div>

                    <div style={{ padding: 'var(--space-md)', border: '1px solid var(--border-main)', borderRadius: 'var(--radius)' }}>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Reserved Quantity</div>
                      <div className="h2" style={{ fontFamily: 'monospace', margin: '4px 0', color: product.reserved > 0 ? 'var(--status-warning)' : 'inherit' }}>
                        {product.reserved}
                      </div>
                      <p className="text-xs">Allocated to confirmed sales orders that have not yet shipped.</p>
                    </div>

                    <div style={{ padding: 'var(--space-md)', border: '1px solid var(--border-main)', borderRadius: 'var(--radius)', backgroundColor: 'var(--bg-app)' }}>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Free-to-Use Quantity</div>
                      <div className="h2" style={{ fontFamily: 'monospace', margin: '4px 0', color: isLowStock ? 'var(--status-danger)' : 'var(--status-success)' }}>
                        {product.freeToUse}
                      </div>
                      <p className="text-xs">Available for assignment to new customer inquiries and sales orders.</p>
                    </div>
                  </div>

                  {!canAdjustStock && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: 'var(--space-md)', color: 'var(--text-muted)' }}>
                      <BadgeInfo size={14} />
                      <span className="text-xs">Manual stock adjustments require the Inventory Manager or Admin role.</span>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                  <h3 className="h3">Product Stock Card Feed</h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)', marginTop: '-8px' }}>
                    Audit trail logs showing this product's inventory increases and consumption.
                  </p>

                  <div style={{ overflowX: 'auto', border: '1px solid var(--border-main)', borderRadius: 'var(--radius)', marginTop: 'var(--space-sm)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-main)', backgroundColor: 'var(--bg-app)', height: '36px' }}>
                          <th style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>Date</th>
                          <th style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)', textAlign: 'center' }}>Direction</th>
                          <th style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)', textAlign: 'right' }}>Qty</th>
                          <th style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>Source</th>
                          <th style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>Reference</th>
                          <th style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>User</th>
                          <th style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productMovements.length === 0 ? (
                          <tr>
                            <td colSpan={7} style={{ padding: 'var(--space-md)', textAlign: 'center', color: 'var(--text-muted)' }}>
                              No stock movements logged for this product.
                            </td>
                          </tr>
                        ) : (
                          productMovements.map((m) => (
                            <tr key={m.id} style={{ borderBottom: '1px solid var(--border-main)', height: '40px' }}>
                              <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>
                                {new Date(m.createdAt).toLocaleString()}
                              </td>
                              <td style={{ padding: 'var(--space-xs) var(--space-sm)', textAlign: 'center' }}>
                                <span
                                  className="text-xs"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '2px',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontWeight: 'bold',
                                    backgroundColor: m.direction === 'IN' ? 'rgba(56, 161, 105, 0.1)' : 'rgba(229, 62, 62, 0.1)',
                                    color: m.direction === 'IN' ? 'var(--status-success)' : 'var(--status-danger)',
                                  }}
                                >
                                  {m.direction === 'IN' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                  {m.direction}
                                </span>
                              </td>
                              <td style={{ padding: 'var(--space-xs) var(--space-sm)', textAlign: 'right', fontWeight: 600, fontFamily: 'monospace' }}>
                                {m.quantity}
                              </td>
                              <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: 'var(--text-sm)' }}>
                                {m.sourceType}
                              </td>
                              <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontFamily: 'monospace', fontSize: 'var(--text-sm)' }}>
                                {m.sourceReference}
                              </td>
                              <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: 'var(--text-sm)' }}>
                                {m.performedBy}
                              </td>
                              <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                {m.reason}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'procurement' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                  <h3 className="h3">Replenishment Logic Parameters</h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)', marginTop: '-8px' }}>
                    Configure how the system automatically fills stock gaps upon demand.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-md)', marginTop: 'var(--space-sm)' }}>
                    {/* General Settings */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                      <h4 className="text-md">Procurement Routing</h4>
                      <div className="input-group">
                        <label className="input-label">Procure on Demand Status</label>
                        <div style={{ marginTop: '2px' }}>
                          {product.procureOnDemand ? (
                            <span className="text-sm" style={{ color: 'var(--accent-main)', fontWeight: 'bold' }}>
                              ENABLED (Make-to-Order)
                            </span>
                          ) : (
                            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                              DISABLED (Fulfill from existing warehouse stock)
                            </span>
                          )}
                        </div>
                      </div>

                      {product.procureOnDemand && (
                        <>
                          <div className="input-group">
                            <label className="input-label">Replenishment Path</label>
                            <div className="text-sm" style={{ fontWeight: 500 }}>
                              {product.procurementType === 'PURCHASE'
                                ? 'Purchase Order (Procure from Supplier Vendor)'
                                : 'Manufacturing Order (Produce In-House BoM)'}
                            </div>
                          </div>

                          {product.procurementType === 'PURCHASE' && (
                            <div className="input-group">
                              <label className="input-label">Default Supplier Vendor</label>
                              <div className="text-sm" style={{ fontWeight: 500, color: 'var(--accent-main)' }}>
                                {defaultVendor ? defaultVendor.name : 'Not Configured'}
                              </div>
                            </div>
                          )}

                          {product.procurementType === 'MANUFACTURING' && (
                            <div className="input-group">
                              <label className="input-label">Default Bill of Materials</label>
                              <div className="text-sm" style={{ fontWeight: 500, color: 'var(--status-success)' }}>
                                {defaultBom ? defaultBom.name : 'Not Configured'}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Stocking Limits */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', borderLeft: '1px solid var(--border-main)', paddingLeft: 'var(--space-md)' }}>
                      <h4 className="text-md">Stocking Thresholds</h4>
                      <div className="input-group">
                        <label className="input-label">Minimum Safety Threshold (Reorder Point)</label>
                        <div className="text-sm">
                          <strong>{product.reorderPoint}</strong> units
                        </div>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          When Free-to-Use stock falls below this level, replenishment is flagged.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Stock Adjustment Modal overlay */}
      <StockAdjustmentModal
        isOpen={isAdjusting}
        onClose={() => setIsAdjusting(false)}
        productName={product.name}
        onSave={handleStockAdjustment}
      />
    </div>
  );
}
