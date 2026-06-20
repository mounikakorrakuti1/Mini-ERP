import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDb } from '@/store/db.store';
import { useAuthStore } from '@/store/auth.store';
import { hasPermission } from '@/lib/permissions';
import { MODULE, PERMISSION_ACTION } from '@/types/enums';
import { Plus, Search, Package, AlertTriangle, ArrowUpDown, Eye, Pencil, Trash2 } from 'lucide-react';
import { ROUTES } from '@/routes/routeMap';
import { api } from '@/lib/api';

export default function ProductListPage() {
  const navigate = useNavigate();
  const { products, refreshData } = useDb();
  const { user } = useAuthStore();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [procurementFilter, setProcurementFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'code' | 'name' | 'salesPrice' | 'costPrice' | 'freeToUse'>('code');
  const [sortAsc, setSortAsc] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const canCreate = hasPermission(user?.permissions, MODULE.PRODUCTS, PERMISSION_ACTION.ADMIN);
  const canEdit = hasPermission(user?.permissions, MODULE.PRODUCTS, PERMISSION_ACTION.ADMIN);

  const filteredProducts = products
    .filter((p) => {
      const query = search.toLowerCase();
      const matchesSearch = p.name.toLowerCase().includes(query) || p.code.toLowerCase().includes(query);
      const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
      const matchesProcurement =
        procurementFilter === 'ALL' ||
        (procurementFilter === 'PURCHASE' && p.procurementType === 'PURCHASE') ||
        (procurementFilter === 'MANUFACTURING' && p.procurementType === 'MANUFACTURING') ||
        (procurementFilter === 'STOCKED' && !p.procureOnDemand);
      const isLow = p.freeToUse < p.reorderPoint;
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'LOW' && isLow && p.freeToUse > 0) ||
        (statusFilter === 'OUT' && p.freeToUse <= 0) ||
        (statusFilter === 'OK' && !isLow);
      return matchesSearch && matchesCategory && matchesProcurement && matchesStatus;
    })
    .sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === 'string' && typeof valB === 'string') return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      if (typeof valA === 'number' && typeof valB === 'number') return sortAsc ? valA - valB : valB - valA;
      return 0;
    });

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this product?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/products/${id}`);
      await refreshData();
    } catch (err) {
      alert('Failed to delete product.');
    } finally {
      setDeletingId(null);
    }
  };

  const getStockStatus = (p: typeof products[0]) => {
    if (p.freeToUse <= 0) return { label: 'Out of Stock', color: 'var(--status-danger)', bg: 'rgba(229,62,62,0.1)' };
    if (p.freeToUse < p.reorderPoint) return { label: 'Low Stock', color: 'var(--status-warning)', bg: 'rgba(221,107,32,0.1)' };
    return { label: 'In Stock', color: 'var(--status-success)', bg: 'rgba(56,161,105,0.1)' };
  };

  const SortTh = ({ field, label, align = 'left' }: { field: typeof sortField; label: string; align?: string }) => (
    <th
      onClick={() => handleSort(field)}
      style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, cursor: 'pointer', fontSize: 'var(--text-sm)', textAlign: align as any, whiteSpace: 'nowrap' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}>
        {label} <ArrowUpDown size={11} color="var(--text-muted)" />
      </div>
    </th>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
        <div>
          <h1 className="h1" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
            <Package size={28} color="var(--accent-main)" /> Product Catalog
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {products.length} products · {products.filter(p => p.freeToUse < p.reorderPoint).length} need attention
          </p>
        </div>
        {canCreate && (
          <button className="btn btn--primary" onClick={() => navigate(ROUTES.PRODUCT_CREATE)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
            <Plus size={16} /> Add Product
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', alignItems: 'center', padding: 'var(--space-sm) var(--space-md)' }}>
        <div className="input-field" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', flex: 1, minWidth: '220px', padding: '0.4rem var(--space-sm)' }}>
          <Search size={16} color="var(--text-muted)" />
          <input type="text" placeholder="Search by code or name..." value={search} onChange={e => setSearch(e.target.value)} style={{ border: 'none', width: '100%', outline: 'none', background: 'transparent' }} />
        </div>
        <select className="input-field" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ appearance: 'auto', padding: '0.4rem var(--space-sm)', minWidth: '140px' }}>
          <option value="ALL">All Categories</option>
          <option value="Raw Material">Raw Materials</option>
          <option value="Finished Good">Finished Goods</option>
          <option value="Service">Services</option>
        </select>
        <select className="input-field" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ appearance: 'auto', padding: '0.4rem var(--space-sm)', minWidth: '130px' }}>
          <option value="ALL">All Status</option>
          <option value="OK">In Stock</option>
          <option value="LOW">Low Stock</option>
          <option value="OUT">Out of Stock</option>
        </select>
        <select className="input-field" value={procurementFilter} onChange={e => setProcurementFilter(e.target.value)} style={{ appearance: 'auto', padding: '0.4rem var(--space-sm)', minWidth: '150px' }}>
          <option value="ALL">All Procurement</option>
          <option value="STOCKED">Stocked</option>
          <option value="PURCHASE">Purchase</option>
          <option value="MANUFACTURING">Manufacturing</option>
        </select>
        <span className="text-xs" style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {filteredProducts.length} / {products.length} shown
        </span>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflowX: 'auto', border: '1px solid var(--border-main)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1100px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-main)', backgroundColor: 'var(--bg-app)' }}>
              <SortTh field="code" label="SKU Code" />
              <SortTh field="name" label="Product Name" />
              <th style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>Category</th>
              <SortTh field="salesPrice" label="Sales Price" align="right" />
              <SortTh field="costPrice" label="Cost Price" align="right" />
              <th style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)', textAlign: 'right', whiteSpace: 'nowrap' }}>On Hand</th>
              <th style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)', textAlign: 'right', whiteSpace: 'nowrap' }}>Reserved</th>
              <SortTh field="freeToUse" label="Free to Use" align="right" />
              <th style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)', textAlign: 'right', whiteSpace: 'nowrap' }}>Reorder Pt.</th>
              <th style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>Procurement</th>
              <th style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>Status</th>
              <th style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)', textAlign: 'right', whiteSpace: 'nowrap' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={12} style={{ padding: 'var(--space-lg)', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No products found matching the criteria.
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => {
                const stockStatus = getStockStatus(p);
                return (
                  <tr
                    key={p.id}
                    style={{ borderBottom: '1px solid var(--border-main)', height: '48px', transition: 'background-color 0.15s ease' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-app)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontFamily: 'monospace', fontWeight: 500, fontSize: 'var(--text-sm)' }}>{p.code}</td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 500, fontSize: 'var(--text-sm)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {p.name}
                        {p.freeToUse < p.reorderPoint && <AlertTriangle size={13} color="var(--status-warning)" />}
                      </div>
                    </td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: 'var(--text-xs)', fontWeight: 500, backgroundColor: p.category === 'Raw Material' ? 'rgba(3,105,161,0.1)' : p.category === 'Finished Good' ? 'rgba(56,161,105,0.1)' : 'rgba(113,128,150,0.1)', color: p.category === 'Raw Material' ? 'var(--accent-main)' : p.category === 'Finished Good' ? 'var(--status-success)' : 'var(--text-muted)' }}>
                        {p.category}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', textAlign: 'right', fontFamily: 'monospace', fontSize: 'var(--text-sm)' }}>₹{p.salesPrice.toLocaleString('en-IN')}</td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', textAlign: 'right', fontFamily: 'monospace', fontSize: 'var(--text-sm)' }}>₹{p.costPrice.toLocaleString('en-IN')}</td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', textAlign: 'right', fontFamily: 'monospace', fontSize: 'var(--text-sm)' }}>{p.onHand}</td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', textAlign: 'right', fontFamily: 'monospace', fontSize: 'var(--text-sm)', color: p.reserved > 0 ? 'var(--status-warning)' : 'inherit' }}>{p.reserved}</td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', textAlign: 'right', fontFamily: 'monospace', fontSize: 'var(--text-sm)', fontWeight: 600, color: p.freeToUse < p.reorderPoint ? 'var(--status-danger)' : 'var(--status-success)' }}>{p.freeToUse}</td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', textAlign: 'right', fontFamily: 'monospace', fontSize: 'var(--text-sm)' }}>{p.reorderPoint}</td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: 'var(--text-xs)', fontWeight: 600, backgroundColor: p.procureOnDemand ? 'var(--sidebar-bg)' : 'var(--bg-app)', color: p.procureOnDemand ? 'var(--sidebar-text)' : 'var(--text-muted)', border: p.procureOnDemand ? '1px solid var(--sidebar-bg)' : '1px solid var(--border-main)' }}>
                        {p.procureOnDemand ? p.procurementType : 'Stocked'}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: 'var(--text-xs)', fontWeight: 600, backgroundColor: stockStatus.bg, color: stockStatus.color }}>
                        {stockStatus.label}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                        <button className="btn btn--icon" title="View" onClick={() => navigate(`${ROUTES.PRODUCTS}/${p.id}`)}>
                          <Eye size={15} color="var(--text-muted)" />
                        </button>
                        {canEdit && (
                          <button className="btn btn--icon" title="Edit" onClick={() => navigate(`${ROUTES.PRODUCTS}/${p.id}/edit`)}>
                            <Pencil size={15} color="var(--accent-main)" />
                          </button>
                        )}
                        {canEdit && (
                          <button className="btn btn--icon" title="Delete" onClick={e => handleDelete(p.id, e)} disabled={deletingId === p.id}>
                            <Trash2 size={15} color="var(--status-danger)" />
                          </button>
                        )}
                      </div>
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
