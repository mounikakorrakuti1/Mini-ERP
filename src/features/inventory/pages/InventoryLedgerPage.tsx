import { useState } from 'react';
import { useDb } from '@/store/db.store';
import { History, Search, ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react';

export default function InventoryLedgerPage() {
  const { stockMovements, products } = useDb();

  // ─── Filters State ───────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string>('ALL');

  // ─── Filtering Logic ─────────────────────────────────────────────
  const filteredMovements = stockMovements.filter((m) => {
    const product = products.find((p) => p.id === m.productId);
    const productName = product?.name.toLowerCase() || '';
    const productCode = product?.code.toLowerCase() || '';
    const query = search.toLowerCase();

    const matchesSearch = productName.includes(query) || productCode.includes(query);
    const matchesDirection = directionFilter === 'ALL' || m.direction === directionFilter;
    const matchesSourceType = sourceTypeFilter === 'ALL' || m.sourceType === sourceTypeFilter;

    return matchesSearch && matchesDirection && matchesSourceType;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* Header */}
      <div>
        <h1 className="h1" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
          <History size={28} color="var(--accent-main)" />
          Stock Transaction Ledger
        </h1>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Chronological audit trail of all warehouse stock movements: purchase order receipts, manufacturing logs, sales shipments, and inventory adjustments.
        </p>
      </div>

      {/* Filters Toolbar */}
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', flex: 1, minWidth: '320px' }}>
          {/* Search */}
          <div
            className="input-field"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-xs)',
              flex: 1,
              minWidth: '220px',
              padding: '0.4rem var(--space-sm)',
            }}
          >
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search product code or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', width: '100%', outline: 'none', background: 'transparent' }}
            />
          </div>

          {/* Direction Filter */}
          <select
            className="input-field"
            value={directionFilter}
            onChange={(e) => setDirectionFilter(e.target.value as any)}
            style={{ appearance: 'auto', padding: '0.4rem var(--space-sm)', minWidth: '130px' }}
          >
            <option value="ALL">All Directions</option>
            <option value="IN">IN (Receipts)</option>
            <option value="OUT">OUT (Shipments)</option>
          </select>

          {/* Source Type Filter */}
          <select
            className="input-field"
            value={sourceTypeFilter}
            onChange={(e) => setSourceTypeFilter(e.target.value)}
            style={{ appearance: 'auto', padding: '0.4rem var(--space-sm)', minWidth: '150px' }}
          >
            <option value="ALL">All Sources</option>
            <option value="ADJUSTMENT">Manual Adjustments</option>
            <option value="SO">Sales Deliveries</option>
            <option value="PO">Purchase Receipts</option>
            <option value="MO">Manufacturing Logs</option>
          </select>
        </div>

        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Showing {filteredMovements.length} records
        </div>
      </div>

      {/* Ledger Table */}
      <div className="card" style={{ padding: 0, overflowX: 'auto', border: '1px solid var(--border-main)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-main)', backgroundColor: 'var(--bg-app)', height: '40px' }}>
              <th style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>Date & Time</th>
              <th style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>Product SKU</th>
              <th style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>Product Name</th>
              <th style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)', textAlign: 'center' }}>Direction</th>
              <th style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)', textAlign: 'right' }}>Quantity</th>
              <th style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>Source</th>
              <th style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>Reference</th>
              <th style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>Performed By</th>
              <th style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>Reason / Description</th>
            </tr>
          </thead>
          <tbody>
            {filteredMovements.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: 'var(--space-lg)', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No stock transactions match the selected criteria.
                </td>
              </tr>
            ) : (
              filteredMovements.map((m) => {
                const product = products.find((p) => p.id === m.productId);
                return (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--border-main)', height: '44px' }}>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>
                      {new Date(m.date).toLocaleString()}
                    </td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontFamily: 'monospace', fontWeight: 500 }}>
                      {product?.code ?? 'N/A'}
                    </td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                      {product?.name ?? 'Deleted Product'}
                    </td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', textAlign: 'center' }}>
                      <span
                        className="text-xs"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                          padding: '2px 8px',
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
                      <span
                        className="text-xs"
                        style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor:
                            m.sourceType === 'ADJUSTMENT'
                              ? 'rgba(113, 128, 150, 0.1)'
                              : m.sourceType === 'SO'
                              ? 'rgba(3, 105, 161, 0.1)'
                              : m.sourceType === 'PO'
                              ? 'rgba(221, 107, 32, 0.1)'
                              : 'rgba(56, 161, 105, 0.1)',
                          color:
                            m.sourceType === 'ADJUSTMENT'
                              ? 'var(--text-muted)'
                              : m.sourceType === 'SO'
                              ? 'var(--accent-main)'
                              : m.sourceType === 'PO'
                              ? 'var(--status-warning)'
                              : 'var(--status-success)',
                          fontWeight: 600,
                        }}
                      >
                        {m.sourceType}
                      </span>
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
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
