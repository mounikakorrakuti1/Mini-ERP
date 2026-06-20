import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDb } from '@/store/db.store';
import { useAuthStore } from '@/store/auth.store';
import { hasPermission } from '@/lib/permissions';
import { MODULE, PERMISSION_ACTION } from '@/types/enums';
import { Plus, Search, Package, AlertTriangle, ArrowUpDown } from 'lucide-react';
import { ROUTES } from '@/routes/routeMap';

export default function ProductListPage() {
  const navigate = useNavigate();
  const { products } = useDb();
  const { user } = useAuthStore();

  // ─── Filters & Sort State ────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'code' | 'name' | 'salesPrice' | 'costPrice' | 'freeToUse'>('code');
  const [sortAsc, setSortAsc] = useState(true);

  // ─── RBAC Authorization conveniency ──────────────────────────────
  const canCreate = hasPermission(user?.permissions, MODULE.PRODUCTS, PERMISSION_ACTION.ADMIN);

  // ─── Apply Filtering & Sorting ──────────────────────────────────
  const filteredProducts = products
    .filter((product) => {
      const query = search.toLowerCase();
      const matchesSearch =
        product.name.toLowerCase().includes(query) ||
        product.code.toLowerCase().includes(query);
      const matchesCategory =
        categoryFilter === 'ALL' || product.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      return 0;
    });

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="h1" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
            <Package size={28} color="var(--accent-main)" />
            Product Catalog
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Manage finished furniture designs, raw lumber materials, and assembly components.
          </p>
        </div>
        
        {canCreate && (
          <button
            className="btn btn--primary"
            onClick={() => navigate(ROUTES.PRODUCT_CREATE)}
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}
          >
            <Plus size={16} />
            <span>Add Product</span>
          </button>
        )}
      </div>

      {/* Toolbar */}
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
              placeholder="Search by code or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', width: '100%', outline: 'none', background: 'transparent' }}
            />
          </div>

          {/* Category Filter */}
          <select
            className="input-field"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ appearance: 'auto', padding: '0.4rem var(--space-sm)', minWidth: '150px' }}
          >
            <option value="ALL">All Categories</option>
            <option value="Raw Material">Raw Materials</option>
            <option value="Finished Good">Finished Goods</option>
            <option value="Service">Services</option>
          </select>
        </div>

        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Showing {filteredProducts.length} of {products.length} products
        </div>
      </div>

      {/* Grid/Table Layout */}
      <div className="card" style={{ padding: 0, overflowX: 'auto', border: '1px solid var(--border-main)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-main)', backgroundColor: 'var(--bg-app)', height: '40px' }}>
              <th
                onClick={() => handleSort('code')}
                style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, cursor: 'pointer', fontSize: 'var(--text-sm)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  SKU Code <ArrowUpDown size={12} />
                </div>
              </th>
              <th
                onClick={() => handleSort('name')}
                style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, cursor: 'pointer', fontSize: 'var(--text-sm)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Product Name <ArrowUpDown size={12} />
                </div>
              </th>
              <th style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                Category
              </th>
              <th
                onClick={() => handleSort('salesPrice')}
                style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, cursor: 'pointer', textAlign: 'right', fontSize: 'var(--text-sm)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                  Sales Price <ArrowUpDown size={12} />
                </div>
              </th>
              <th
                onClick={() => handleSort('costPrice')}
                style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, cursor: 'pointer', textAlign: 'right', fontSize: 'var(--text-sm)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                  Cost Price <ArrowUpDown size={12} />
                </div>
              </th>
              <th style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, textAlign: 'right', fontSize: 'var(--text-sm)' }}>
                On Hand
              </th>
              <th style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, textAlign: 'right', fontSize: 'var(--text-sm)' }}>
                Reserved
              </th>
              <th
                onClick={() => handleSort('freeToUse')}
                style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, cursor: 'pointer', textAlign: 'right', fontSize: 'var(--text-sm)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                  Free-to-Use <ArrowUpDown size={12} />
                </div>
              </th>
              <th style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, textAlign: 'center', fontSize: 'var(--text-sm)' }}>
                Procurement
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: 'var(--space-lg)', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No products found matching the criteria.
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
                      height: '48px',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-app)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontFamily: 'monospace', fontWeight: 500 }}>
                      {p.code}
                    </td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                        {p.name}
                        {isLowStock && (
                          <span
                            title={`Low Stock! Free-to-Use (${p.freeToUse}) < Reorder Point (${p.reorderPoint})`}
                            style={{ color: 'var(--status-danger)', display: 'inline-flex', alignItems: 'center' }}
                          >
                            <AlertTriangle size={14} />
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)' }}>
                      <span
                        className="text-xs"
                        style={{
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          backgroundColor:
                            p.category === 'Raw Material'
                              ? 'rgba(3, 105, 161, 0.1)'
                              : p.category === 'Finished Good'
                              ? 'rgba(56, 161, 105, 0.1)'
                              : 'rgba(113, 128, 150, 0.1)',
                          color:
                            p.category === 'Raw Material'
                              ? 'var(--accent-main)'
                              : p.category === 'Finished Good'
                              ? 'var(--status-success)'
                              : 'var(--text-muted)',
                          fontWeight: 500,
                        }}
                      >
                        {p.category}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', textAlign: 'right', fontFamily: 'monospace' }}>
                      ₹{p.salesPrice.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', textAlign: 'right', fontFamily: 'monospace' }}>
                      ₹{p.costPrice.toLocaleString('en-IN')}
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
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', textAlign: 'center' }}>
                      {p.procureOnDemand ? (
                        <span
                          className="text-xs"
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--accent-soft)',
                            color: 'var(--accent-main)',
                            fontWeight: 600,
                            border: '1px solid var(--accent-main)',
                          }}
                        >
                          MTO ({p.procurementType})
                        </span>
                      ) : (
                        <span
                          className="text-xs"
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--bg-app)',
                            color: 'var(--text-muted)',
                            border: '1px solid var(--border-main)',
                          }}
                        >
                          Stocked
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
  );
}
