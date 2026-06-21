import { useState } from 'react';
import { useDb } from '@/store/db.store';
import { BarChart3, Calendar, ShieldCheck, ChevronRight, Info } from 'lucide-react';

export default function AnalyticsPage() {
  const { products } = useDb();

  // ─── Filter State ────────────────────────────────────────────────
  const [dateRange, setDateRange] = useState<'30days' | '90days' | 'year'>('30days');
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');

  const selectedProduct = products.find(p => p.id === selectedProductId) || products[0];

  // ─── Chart 1: Vendor Spend Data (Mocked but linked to DB) ─────────
  const vendorSpendData = [
    { name: 'Sharma Lumber Yard', spend: 58000, color: 'var(--accent-main)' },
    { name: 'Fasteners Depot', spend: 12500, color: 'var(--status-warning)' },
    { name: 'Finishing Touches Co.', spend: 28900, color: '#8b5cf6' },
  ];
  const maxSpend = Math.max(...vendorSpendData.map(d => d.spend));

  // ─── Chart 2: Manufacturing Efficiency Data ──────────────────────
  const mfgEfficiencyData = [
    { label: 'Mon', value: 85 },
    { label: 'Tue', value: 92 },
    { label: 'Wed', value: 88 },
    { label: 'Thu', value: 94 },
    { label: 'Fri', value: 96 },
  ];
  // Convert line points to SVG coordinate path
  const width2 = 500;
  const height2 = 180;
  const padding2 = 40;
  const chartWidth2 = width2 - padding2 * 2;
  const chartHeight2 = height2 - padding2 * 2;

  const points2 = mfgEfficiencyData.map((d, i) => {
    const x = padding2 + (i / (mfgEfficiencyData.length - 1)) * chartWidth2;
    const y = padding2 + chartHeight2 - (d.value / 100) * chartHeight2;
    return { x, y, label: d.label, val: d.value };
  });
  const pathD2 = points2.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // ─── Chart 3: Reorder Point Multi-Series (Product Linked) ────────
  // Get selected product's values and construct a mock trend for demonstration
  const ropValue = selectedProduct ? selectedProduct.reorderPoint : 50;
  const safetyStockValue = Math.round(ropValue * 0.4);
  const currentStock = selectedProduct ? selectedProduct.freeToUse : 90;

  const rPoints = [
    { label: 'Day 1', stock: currentStock + 30 },
    { label: 'Day 2', stock: currentStock + 10 },
    { label: 'Day 3', stock: currentStock - 5 },
    { label: 'Day 4', stock: currentStock },
    { label: 'Day 5', stock: currentStock },
  ];

  const points3 = rPoints.map((d, i) => {
    const x = padding2 + (i / (rPoints.length - 1)) * chartWidth2;
    const maxVal = Math.max(150, currentStock + 50, ropValue + 20);
    const yStock = padding2 + chartHeight2 - (d.stock / maxVal) * chartHeight2;
    const yRop = padding2 + chartHeight2 - (ropValue / maxVal) * chartHeight2;
    const ySafety = padding2 + chartHeight2 - (safetyStockValue / maxVal) * chartHeight2;
    return { x, yStock, yRop, ySafety, label: d.label, stock: d.stock };
  });

  const pathStock3 = points3.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yStock}`).join(' ');
  const pathRop3 = points3.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yRop}`).join(' ');
  const pathSafety3 = points3.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.ySafety}`).join(' ');

  // ─── Chart 4: Delay Trend Chart (Stacked bar) ───────────────────
  const delayData = [
    { name: 'Week 1', sales: 2, purchase: 1, mfg: 3 },
    { name: 'Week 2', sales: 1, purchase: 2, mfg: 1 },
    { name: 'Week 3', sales: 3, purchase: 0, mfg: 2 },
    { name: 'Week 4', sales: 0, purchase: 1, mfg: 1 },
  ];

  // ─── Chart 5: Stock Movement Volume Chart (Paired columns) ──────
  const volData = [
    { day: 'Mon', in: 120, out: 40 },
    { day: 'Tue', in: 100, out: 60 },
    { day: 'Wed', in: 0, out: 15 },
    { day: 'Thu', in: 15, out: 10 },
    { day: 'Fri', in: 50, out: 100 },
  ];
  const maxVol = 150; // max volume bounds

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
        <div>
          <h1 className="h1" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
            <BarChart3 size={28} color="var(--accent-main)" />
            Operations Analytics & Reports
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Consolidated operational charts, vendor performance metrics, and inventory safety stock limits.
          </p>
        </div>

        {/* Date Filter Bar */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px var(--space-sm)' }}>
          <Calendar size={16} color="var(--text-muted)" />
          <button
            onClick={() => setDateRange('30days')}
            className="btn text-xs"
            style={{
              padding: '4px 10px',
              backgroundColor: dateRange === '30days' ? 'var(--accent-main)' : 'transparent',
              color: dateRange === '30days' ? '#fff' : 'inherit',
            }}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setDateRange('90days')}
            className="btn text-xs"
            style={{
              padding: '4px 10px',
              backgroundColor: dateRange === '90days' ? 'var(--accent-main)' : 'transparent',
              color: dateRange === '90days' ? '#fff' : 'inherit',
            }}
          >
            Last 90 Days
          </button>
          <button
            onClick={() => setDateRange('year')}
            className="btn text-xs"
            style={{
              padding: '4px 10px',
              backgroundColor: dateRange === 'year' ? 'var(--accent-main)' : 'transparent',
              color: dateRange === 'year' ? '#fff' : 'inherit',
            }}
          >
            Historical Year
          </button>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 'var(--space-md)' }}>
        
        {/* Widget 1: Vendor Spend Performance (Horizontal Bar Chart) */}
        <div className="card">
          <h3 className="h3" style={{ borderBottom: '1px solid var(--border-main)', paddingBottom: 'var(--space-xs)', marginBottom: 'var(--space-sm)' }}>
            Vendor Supplier Spend Analysis
          </h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
            Cumulative purchasing spend (INR) per primary raw material supplier.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {vendorSpendData.map((v) => {
              const percentage = (v.spend / maxSpend) * 100;
              return (
                <div key={v.name} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                    <span style={{ fontWeight: 500 }}>{v.name}</span>
                    <strong style={{ fontFamily: 'monospace' }}>₹{v.spend.toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ width: '100%', height: '24px', backgroundColor: 'var(--bg-app)', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                    <div
                      style={{
                        width: `${percentage}%`,
                        height: '100%',
                        backgroundColor: v.color,
                        borderRadius: '4px',
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Widget 2: Manufacturing Execution Efficiency (Line Chart) */}
        <div className="card">
          <h3 className="h3" style={{ borderBottom: '1px solid var(--border-main)', paddingBottom: 'var(--space-xs)', marginBottom: 'var(--space-sm)' }}>
            Production Efficiency Trend (%)
          </h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-xs)' }}>
            On-time work center completions compared to 90% benchmark efficiency.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <svg width="100%" height={height2} viewBox={`0 0 ${width2} ${height2}`} style={{ overflow: 'visible' }}>
              {/* Grid Lines */}
              {[25, 50, 75, 100].map((level) => {
                const y = padding2 + chartHeight2 - (level / 100) * chartHeight2;
                return (
                  <g key={level}>
                    <line x1={padding2} y1={y} x2={width2 - padding2} y2={y} stroke="var(--border-main)" strokeWidth={1} strokeDasharray="3 3" />
                    <text x={padding2 - 10} y={y + 4} textAnchor="end" fontSize="10" fill="var(--text-muted)" fontFamily="monospace">{level}%</text>
                  </g>
                );
              })}

              {/* Benchmark Reference Line */}
              <line
                x1={padding2}
                y1={padding2 + chartHeight2 - (90 / 100) * chartHeight2}
                x2={width2 - padding2}
                y2={padding2 + chartHeight2 - (90 / 100) * chartHeight2}
                stroke="var(--status-warning)"
                strokeWidth={1.5}
                strokeDasharray="4 2"
              />
              <text x={width2 - padding2 - 10} y={padding2 + chartHeight2 - (90 / 100) * chartHeight2 - 5} fontSize="9" fill="var(--status-warning)" fontWeight="bold">
                Target (90%)
              </text>

              {/* Data Line */}
              <path d={pathD2} fill="none" stroke="var(--accent-main)" strokeWidth={3} strokeLinecap="round" />

              {/* Data points */}
              {points2.map((p) => (
                <g key={p.label}>
                  <circle cx={p.x} cy={p.y} r={5} fill="var(--bg-surface)" stroke="var(--accent-main)" strokeWidth={3} />
                  <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="10" fontWeight="bold" fontFamily="monospace">{p.val}%</text>
                  <text x={p.x} y={height2 - padding2 + 15} textAnchor="middle" fontSize="10" fill="var(--text-muted)">{p.label}</text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Widget 3: Reorder Point Chart (Dynamic Product Multi-Line Chart) */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-main)', paddingBottom: 'var(--space-xs)', marginBottom: 'var(--space-sm)' }}>
            <h3 className="h3">Safety stock & ROP simulation</h3>
            
            {/* Interactive Selector */}
            <select
              className="input-field"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              style={{ appearance: 'auto', padding: '2px 8px', fontSize: 'var(--text-xs)', minWidth: '150px' }}
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.reference}</option>
              ))}
            </select>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-xs)' }}>
            Free-to-Use stock level compared to safety thresholds for SKU: <strong>{selectedProduct?.name}</strong>.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <svg width="100%" height={height2} viewBox={`0 0 ${width2} ${height2}`} style={{ overflow: 'visible' }}>
              {/* Grid Lines */}
              <line x1={padding2} y1={padding2} x2={padding2} y2={height2 - padding2} stroke="var(--border-main)" />
              <line x1={padding2} y1={height2 - padding2} x2={width2 - padding2} y2={height2 - padding2} stroke="var(--border-main)" />

              {/* Path 1: Free to Use Stock */}
              <path d={pathStock3} fill="none" stroke="var(--accent-main)" strokeWidth={2.5} />
              
              {/* Path 2: Reorder Point */}
              <path d={pathRop3} fill="none" stroke="var(--status-warning)" strokeWidth={2} strokeDasharray="4 2" />

              {/* Path 3: Safety Stock */}
              <path d={pathSafety3} fill="none" stroke="var(--status-danger)" strokeWidth={1.5} strokeDasharray="2 3" />

              {/* Data Labels & X Axis */}
              {points3.map((p) => (
                <g key={p.label}>
                  <circle cx={p.x} cy={p.yStock} r={4} fill="var(--accent-main)" />
                  <text x={p.x} y={p.yStock - 8} textAnchor="middle" fontSize="9" fontWeight="500" fontFamily="monospace">{p.stock}</text>
                  <text x={p.x} y={height2 - padding2 + 15} textAnchor="middle" fontSize="10" fill="var(--text-muted)">{p.label}</text>
                </g>
              ))}

              {/* Chart Legend */}
              <g transform={`translate(${padding2}, 10)`} fontSize="9" fontWeight="500">
                <rect x={0} y={0} width={10} height={6} fill="var(--accent-main)" />
                <text x={15} y={7}>Free-to-Use ({currentStock})</text>

                <line x1={110} y1={3} x2={125} y2={3} stroke="var(--status-warning)" strokeWidth={2} strokeDasharray="3 2" />
                <text x={130} y={7}>ROP ({ropValue})</text>

                <line x1={200} y1={3} x2={215} y2={3} stroke="var(--status-danger)" strokeWidth={2} strokeDasharray="1 2" />
                <text x={220} y={7}>Safety Stock ({safetyStockValue})</text>
              </g>
            </svg>
          </div>
        </div>

        {/* Widget 4: Delay Trends by Department (Stacked Bar Chart) */}
        <div className="card">
          <h3 className="h3" style={{ borderBottom: '1px solid var(--border-main)', paddingBottom: 'var(--space-xs)', marginBottom: 'var(--space-sm)' }}>
            Department Order Delay Incidents
          </h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>
            Weekly summary of order delays logged across core business components.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <svg width="100%" height={height2} viewBox={`0 0 ${width2} ${height2}`} style={{ overflow: 'visible' }}>
              {/* Y Axis Grid lines */}
              {[2, 4, 6].map((grid) => {
                const y = padding2 + chartHeight2 - (grid / 6) * chartHeight2;
                return (
                  <g key={grid}>
                    <line x1={padding2} y1={y} x2={width2 - padding2} y2={y} stroke="var(--border-main)" strokeWidth={1} strokeDasharray="3 3" />
                    <text x={padding2 - 10} y={y + 4} textAnchor="end" fontSize="10" fill="var(--text-muted)" fontFamily="monospace">{grid}</text>
                  </g>
                );
              })}

              {/* Render Stacked Bars */}
              {delayData.map((d, i) => {
                const barWidth = 32;
                const x = padding2 + (i / delayData.length) * chartWidth2 + (chartWidth2 / delayData.length) / 2 - barWidth / 2;
                const total = d.sales + d.purchase + d.mfg;

                // heights
                const hMfg = (d.mfg / 6) * chartHeight2;
                const hPurchase = (d.purchase / 6) * chartHeight2;
                const hSales = (d.sales / 6) * chartHeight2;

                // y anchors
                const yMfg = padding2 + chartHeight2 - hMfg;
                const yPurchase = yMfg - hPurchase;
                const ySales = yPurchase - hSales;

                return (
                  <g key={d.name}>
                    {/* Mfg portion */}
                    <rect x={x} y={yMfg} width={barWidth} height={hMfg} fill="var(--status-success)" rx={1} />
                    {/* Purchase portion */}
                    <rect x={x} y={yPurchase} width={barWidth} height={hPurchase} fill="var(--status-warning)" rx={1} />
                    {/* Sales portion */}
                    <rect x={x} y={ySales} width={barWidth} height={hSales} fill="var(--accent-main)" rx={1} />

                    {total > 0 && (
                      <text x={x + barWidth / 2} y={ySales - 5} textAnchor="middle" fontSize="9" fontWeight="bold" fontFamily="monospace">
                        {total}
                      </text>
                    )}
                    <text x={x + barWidth / 2} y={height2 - padding2 + 15} textAnchor="middle" fontSize="10" fill="var(--text-muted)">{d.name}</text>
                  </g>
                );
              })}

              {/* Legend */}
              <g transform={`translate(${padding2}, 10)`} fontSize="9" fontWeight="500">
                <rect x={0} y={0} width={8} height={8} fill="var(--accent-main)" />
                <text x={12} y={8}>Sales</text>

                <rect x={70} y={0} width={8} height={8} fill="var(--status-warning)" />
                <text x={82} y={8}>Purchase</text>

                <rect x={150} y={0} width={8} height={8} fill="var(--status-success)" />
                <text x={162} y={8}>Manufacturing</text>
              </g>
            </svg>
          </div>
        </div>

        {/* Widget 5: Stock Movement Volumes (Grouped Column Chart) */}
        <div className="card" style={{ gridColumn: 'span 1' }}>
          <h3 className="h3" style={{ borderBottom: '1px solid var(--border-main)', paddingBottom: 'var(--space-xs)', marginBottom: 'var(--space-sm)' }}>
            Daily Stock Volumetric Throughput
          </h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>
            Comparison of stock receipts (IN) vs deliveries/staging consumptions (OUT) per day.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <svg width="100%" height={height2} viewBox={`0 0 ${width2} ${height2}`} style={{ overflow: 'visible' }}>
              {/* Y Axis values */}
              {[50, 100, 150].map((v) => {
                const y = padding2 + chartHeight2 - (v / maxVol) * chartHeight2;
                return (
                  <g key={v}>
                    <line x1={padding2} y1={y} x2={width2 - padding2} y2={y} stroke="var(--border-main)" strokeWidth={1} strokeDasharray="2 2" />
                    <text x={padding2 - 10} y={y + 4} textAnchor="end" fontSize="10" fill="var(--text-muted)" fontFamily="monospace">{v}</text>
                  </g>
                );
              })}

              {/* Paired columns */}
              {volData.map((d, i) => {
                const colWidth = 14;
                const groupWidth = 36;
                const xGroup = padding2 + (i / volData.length) * chartWidth2 + (chartWidth2 / volData.length) / 2 - groupWidth / 2;

                const hIn = (d.in / maxVol) * chartHeight2;
                const hOut = (d.out / maxVol) * chartHeight2;

                const yIn = padding2 + chartHeight2 - hIn;
                const yOut = padding2 + chartHeight2 - hOut;

                return (
                  <g key={d.day}>
                    {/* IN Bar */}
                    <rect x={xGroup} y={yIn} width={colWidth} height={hIn} fill="var(--status-success)" rx={2} />
                    {/* OUT Bar */}
                    <rect x={xGroup + colWidth + 4} y={yOut} width={colWidth} height={hOut} fill="var(--status-danger)" rx={2} />

                    {/* X axis Label */}
                    <text x={xGroup + colWidth + 2} y={height2 - padding2 + 15} textAnchor="middle" fontSize="10" fill="var(--text-muted)">{d.day}</text>
                  </g>
                );
              })}

              {/* Legend */}
              <g transform={`translate(${padding2}, 10)`} fontSize="9" fontWeight="500">
                <rect x={0} y={0} width={10} height={8} fill="var(--status-success)" />
                <text x={15} y={8}>IN (Inventory Inflow)</text>

                <rect x={120} y={0} width={10} height={8} fill="var(--status-danger)" />
                <text x={135} y={8}>OUT (Inventory Outflow)</text>
              </g>
            </svg>
          </div>
        </div>

      </div>
    </div>
  );
}
