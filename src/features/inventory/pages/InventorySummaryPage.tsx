import { useState } from 'react';
import { useDb } from '@/store/db.store';
import { Boxes, Search, AlertTriangle, Calculator, RefreshCw, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes/routeMap';

export default function InventorySummaryPage() {
  const navigate = useNavigate();
  const { products } = useDb();

  // ─── Filters State ───────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState<'ALL' | 'LOW_STOCK' | 'OK'>('ALL');

  // ─── Calculator State ────────────────────────────────────────────
  const [calcAdu, setCalcAdu] = useState('10'); // Average Daily Usage
  const [calcLeadTime, setCalcLeadTime] = useState('5'); // Vendor Lead Time
  const [calcMdu, setCalcMdu] = useState('18'); // Maximum Daily Usage
  const [calcMaxDelay, setCalcMaxDelay] = useState('3'); // Max delay days

  // Derived calculations
  const avgLeadTime = parseFloat(calcLeadTime) || 0;
  const adu = parseFloat(calcAdu) || 0;
  const mdu = parseFloat(calcMdu) || 0;
  const maxDelay = parseFloat(calcMaxDelay) || 0;
  const maxLeadTime = avgLeadTime + maxDelay;

  const computedSafetyStock = Math.max(0, Math.round((mdu * maxLeadTime) - (adu * avgLeadTime)));
  const computedReorderPoint = Math.max(0, Math.round((adu * avgLeadTime) + computedSafetyStock));

  // Filter products list
  const filteredProducts = products.filter((p) => {
    const query = search.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(query) || p.code.toLowerCase().includes(query);

    const isLowStock = p.freeToUse < p.reorderPoint;
    const matchesStatus =
      stockStatusFilter === 'ALL' ||
      (stockStatusFilter === 'LOW_STOCK' && isLowStock) ||
      (stockStatusFilter === 'OK' && !isLowStock);

    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* Header */}
      <div>
        <h1 className="h1" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
          <Boxes size={28} color="var(--accent-main)" />
          Warehouse Inventory Summary
        </h1>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Real-time stock levels, reservations, and reorder point indicator flags across the entire catalog.
        </p>
      </div>

      {/* Main Content Grid (Two Columns: Table vs Formula Calculator) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-md)' }}>
        
        {/* Left Side: Summary Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {/* Table Filters */}
          <div
            className="card"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--space-sm)',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--space-sm) var(--space-md)',
            }}
          >
            <div style={{ display: 'flex', gap: 'var(--space-sm)', flex: 1, minWidth: '280px' }}>
              {/* Search */}
              <div
                className="input-field"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-xs)',
                  flex: 1,
                  padding: '0.4rem var(--space-sm)',
                }}
              >
                <Search size={16} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Search SKU or Name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ border: 'none', width: '100%', outline: 'none', background: 'transparent' }}
                />
              </div>

              {/* Status Filter */}
              <select
                className="input-field"
                value={stockStatusFilter}
                onChange={(e) => setStockStatusFilter(e.target.value as any)}
                style={{ appearance: 'auto', padding: '0.4rem var(--space-sm)', minWidth: '160px' }}
              >
                <option value="ALL">All Stock Levels</option>
                <option value="LOW_STOCK">⚠️ Low Stock / Under Threshold</option>
                <option value="OK">✅ Healthy / Sufficient Stock</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="card" style={{ padding: 0, overflowX: 'auto', border: '1px solid var(--border-main)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-main)', backgroundColor: 'var(--bg-app)', height: '40px' }}>
                  <th style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>SKU Code</th>
                  <th style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>Product Name</th>
                  <th style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)', textAlign: 'right' }}>On Hand</th>
                  <th style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)', textAlign: 'right' }}>Reserved</th>
                  <th style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)', textAlign: 'right' }}>Free-to-Use</th>
                  <th style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)', textAlign: 'right' }}>Reorder Point</th>
                  <th style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)', textAlign: 'center' }}>Stock Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 'var(--space-lg)', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No inventory records found.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const isLowStock = p.freeToUse < p.reorderPoint;
                    return (
                      <tr
                        key={p.id}
                        onClick={() => navigate(ROUTES.PRODUCTS + '/' + p.id)}
                        style={{
                          borderBottom: '1px solid var(--border-main)',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease',
                          height: '44px',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-app)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontFamily: 'monospace' }}>
                          {p.code}
                        </td>
                        <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 500 }}>
                          {p.name}
                        </td>
                        <td style={{ padding: 'var(--space-xs) var(--space-sm)', textAlign: 'right', fontFamily: 'monospace' }}>
                          {p.onHand}
                        </td>
                        <td style={{ padding: 'var(--space-xs) var(--space-sm)', textAlign: 'right', fontFamily: 'monospace', color: p.reserved > 0 ? 'var(--status-warning)' : 'inherit' }}>
                          {p.reserved}
                        </td>
                        <td
                          style={{
                            padding: 'var(--space-xs) var(--space-sm)',
                            textAlign: 'right',
                            fontFamily: 'monospace',
                            fontWeight: 600,
                            color: isLowStock ? 'var(--status-danger)' : 'var(--status-success)',
                          }}
                        >
                          {p.freeToUse}
                        </td>
                        <td style={{ padding: 'var(--space-xs) var(--space-sm)', textAlign: 'right', fontFamily: 'monospace' }}>
                          {p.reorderPoint}
                        </td>
                        <td style={{ padding: 'var(--space-xs) var(--space-sm)', textAlign: 'center' }}>
                          {isLowStock ? (
                            <span
                              className="text-xs"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                backgroundColor: 'rgba(229, 62, 62, 0.1)',
                                color: 'var(--status-danger)',
                                fontWeight: 600,
                              }}
                            >
                              <AlertTriangle size={12} /> Low Stock
                            </span>
                          ) : (
                            <span
                              className="text-xs"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                backgroundColor: 'rgba(56, 161, 105, 0.1)',
                                color: 'var(--status-success)',
                                fontWeight: 600,
                              }}
                            >
                              Sufficient
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Panel: Interactive Reorder Point Calculator */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', borderBottom: '1px solid var(--border-main)', paddingBottom: 'var(--space-xs)' }}>
            <Calculator size={20} color="var(--accent-main)" />
            <h3 className="h3">Reorder Point & Safety Stock Calculator</h3>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Understand the mathematical framework behind our replenishment recommendations.
            Formulas: <em>Safety Stock = (MDU × Max Lead Time) - (ADU × Avg Lead Time)</em> and <em>Reorder Point = (ADU × Avg Lead Time) + Safety Stock</em>.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)', marginTop: 'var(--space-xs)' }}>
            {/* ADU */}
            <div className="input-group">
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                Average Daily Usage (ADU)
                <span title="Average quantity sold/consumed per day." style={{ cursor: 'help', color: 'var(--text-muted)' }}>
                  <HelpCircle size={12} />
                </span>
              </label>
              <input
                type="number"
                className="input-field"
                value={calcAdu}
                onChange={(e) => setCalcAdu(e.target.value)}
              />
            </div>

            {/* Avg Lead Time */}
            <div className="input-group">
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                Vendor Lead Time (Days)
                <span title="Average days it takes to receive order from supplier." style={{ cursor: 'help', color: 'var(--text-muted)' }}>
                  <HelpCircle size={12} />
                </span>
              </label>
              <input
                type="number"
                className="input-field"
                value={calcLeadTime}
                onChange={(e) => setCalcLeadTime(e.target.value)}
              />
            </div>

            {/* MDU */}
            <div className="input-group">
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                Max Daily Usage (MDU)
                <span title="Maximum quantity ever sold/consumed in a single day." style={{ cursor: 'help', color: 'var(--text-muted)' }}>
                  <HelpCircle size={12} />
                </span>
              </label>
              <input
                type="number"
                className="input-field"
                value={calcMdu}
                onChange={(e) => setCalcMdu(e.target.value)}
              />
            </div>

            {/* Max Delay */}
            <div className="input-group">
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                Max Delivery Delay (Days)
                <span title="Maximum historical delivery delay beyond typical lead time." style={{ cursor: 'help', color: 'var(--text-muted)' }}>
                  <HelpCircle size={12} />
                </span>
              </label>
              <input
                type="number"
                className="input-field"
                value={calcMaxDelay}
                onChange={(e) => setCalcMaxDelay(e.target.value)}
              />
            </div>
          </div>

          {/* Results Summary Box */}
          <div
            style={{
              marginTop: 'var(--space-sm)',
              padding: 'var(--space-md)',
              backgroundColor: 'var(--bg-app)',
              border: '1px solid var(--border-main)',
              borderRadius: 'var(--radius)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--space-md)',
            }}
          >
            <div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Calculated Safety Stock</div>
              <div className="h3" style={{ color: 'var(--status-warning)', fontFamily: 'monospace', margin: '4px 0' }}>
                {computedSafetyStock} units
              </div>
              <p className="text-xs">Buffer reserved to prevent shortages due to lead-time variations.</p>
            </div>
            
            <div style={{ borderLeft: '1px solid var(--border-main)', paddingLeft: 'var(--space-md)' }}>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Suggested Reorder Point (ROP)</div>
              <div className="h3" style={{ color: 'var(--accent-main)', fontFamily: 'monospace', margin: '4px 0' }}>
                {computedReorderPoint} units
              </div>
              <p className="text-xs">Order replenishment immediately when Free-to-Use drops below this level.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
