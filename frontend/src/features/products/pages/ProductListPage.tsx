import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDb } from '@/store/db.store';
import { useAuthStore } from '@/store/auth.store';
import { hasPermission } from '@/lib/permissions';
import { MODULE, PERMISSION_ACTION } from '@/types/enums';
import { Plus, Search, Package, AlertTriangle, ArrowUpDown, Eye, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { ROUTES } from '@/routes/routeMap';
import { api } from '@/lib/api';

export default function ProductListPage() {
  const navigate = useNavigate();
  const { refreshData } = useDb();
  const { user } = useAuthStore();

  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 50;

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [procurementFilter, setProcurementFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'reference' | 'name' | 'salesPrice' | 'costPrice' | 'freeToUse'>('reference');
  const [sortAsc, setSortAsc] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const canCreate = hasPermission(user?.permissions, MODULE.PRODUCTS, PERMISSION_ACTION.ADMIN);
  const canEdit = hasPermission(user?.permissions, MODULE.PRODUCTS, PERMISSION_ACTION.ADMIN);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/products', {
        params: {
          search,
          category: categoryFilter,
          status: statusFilter,
          procurementFilter,
          page,
          limit
        }
      });
      setProducts(res.data.data);
      setTotal(res.data.meta.total);
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setIsLoading(false);
    }
  }, [search, categoryFilter, statusFilter, procurementFilter, page]);

  useEffect(() => {
    // Reset to page 1 when filters change
    setPage(1);
  }, [search, categoryFilter, statusFilter, procurementFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300); // debounce search
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  const sortedProducts = [...products].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    if (typeof valA === 'string' && typeof valB === 'string') return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    if (typeof valA === 'number' && typeof valB === 'number') return sortAsc ? valA - valB : valB - valA;
    return 0;
  });

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this product?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/products/${id}`);
      await refreshData();
      fetchProducts();
    } catch (err) {
      alert('Failed to delete product.');
    } finally {
      setDeletingId(null);
    }
  };

  const getStockStatus = (p: any) => {
    if (p.available <= 0) return { label: 'Out of Stock', color: 'var(--status-danger)', bg: 'rgba(229,62,62,0.1)' };
    if (p.available < p.reorderPoint) return { label: 'Low Stock', color: 'var(--status-warning)', bg: 'rgba(221,107,32,0.1)' };
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
            {total} products total in catalog
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
          <option value="RAW_MATERIAL">Raw Materials</option>
          <option value="FINISHED_GOOD">Finished Goods</option>
          <option value="SERVICE">Services</option>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', marginLeft: 'auto' }}>
          <button className="btn btn--icon" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs" style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            Page {page}
          </span>
          <button className="btn btn--icon" disabled={products.length < limit} onClick={() => setPage(p => p + 1)}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflowX: 'auto', border: '1px solid var(--border-main)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1100px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-main)', backgroundColor: 'var(--bg-app)' }}>
              <th style={{ padding: '0', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                <button type="button" onClick={() => handleSort('reference')} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '4px', padding: 'var(--space-xs) var(--space-sm)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'inherit', color: 'inherit' }}>
                  SKU Code <ArrowUpDown size={12} color={sortField === 'reference' ? 'var(--accent-main)' : 'var(--text-muted)'} />
                </button>
              </th>
              <th style={{ padding: '0', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                <button type="button" onClick={() => handleSort('name')} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '4px', padding: 'var(--space-xs) var(--space-sm)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'inherit', color: 'inherit' }}>
                  Product Name <ArrowUpDown size={12} color={sortField === 'name' ? 'var(--accent-main)' : 'var(--text-muted)'} />
                </button>
              </th>
              <th style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>Category</th>
              <th style={{ padding: '0', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                <button type="button" onClick={() => handleSort('salesPrice')} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', padding: 'var(--space-xs) var(--space-sm)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'inherit', color: 'inherit' }}>
                  <ArrowUpDown size={12} color={sortField === 'salesPrice' ? 'var(--accent-main)' : 'var(--text-muted)'} /> Sales Price
                </button>
              </th>
              <th style={{ padding: '0', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                <button type="button" onClick={() => handleSort('costPrice')} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', padding: 'var(--space-xs) var(--space-sm)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'inherit', color: 'inherit' }}>
                  <ArrowUpDown size={12} color={sortField === 'costPrice' ? 'var(--accent-main)' : 'var(--text-muted)'} /> Cost Price
                </button>
              </th>
              <th style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)', textAlign: 'right', whiteSpace: 'nowrap' }}>On Hand</th>
              <th style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)', textAlign: 'right', whiteSpace: 'nowrap' }}>Reserved</th>
              <th style={{ padding: '0', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                <button type="button" onClick={() => handleSort('freeToUse')} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', padding: 'var(--space-xs) var(--space-sm)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'inherit', color: 'inherit' }}>
                  <ArrowUpDown size={12} color={sortField === 'freeToUse' ? 'var(--accent-main)' : 'var(--text-muted)'} /> Free to Use
                </button>
              </th>
              <th style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)', textAlign: 'right', whiteSpace: 'nowrap' }}>Reorder Pt.</th>
              <th style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>Procurement</th>
              <th style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>Status</th>
              <th style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)', textAlign: 'right', whiteSpace: 'nowrap' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={12} style={{ padding: 'var(--space-lg)', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading products...
                </td>
              </tr>
            ) : sortedProducts.length === 0 ? (
              <tr>
                <td colSpan={12} style={{ padding: 'var(--space-lg)', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No products found matching the criteria.
                </td>
              </tr>
            ) : (
              sortedProducts.map((p) => {
                const stockStatus = getStockStatus(p);
                return (
                  <tr
                    key={p.id}
                    style={{ borderBottom: '1px solid var(--border-main)', height: '48px', transition: 'background-color 0.15s ease' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-app)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontFamily: 'monospace', fontWeight: 500, fontSize: 'var(--text-sm)' }}>{p.reference}</td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 500, fontSize: 'var(--text-sm)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {p.name}
                        {p.available < p.reorderPoint && <AlertTriangle size={13} color="var(--status-warning)" />}
                      </div>
                    </td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: 'var(--text-xs)', fontWeight: 500, backgroundColor: p.category === 'RAW_MATERIAL' ? 'rgba(3,105,161,0.1)' : p.category === 'FINISHED_GOOD' ? 'rgba(56,161,105,0.1)' : 'rgba(113,128,150,0.1)', color: p.category === 'RAW_MATERIAL' ? 'var(--accent-main)' : p.category === 'FINISHED_GOOD' ? 'var(--status-success)' : 'var(--text-muted)' }}>
                        {p.category}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', textAlign: 'right', fontFamily: 'monospace', fontSize: 'var(--text-sm)' }}>₹{p.salesPrice.toLocaleString('en-IN')}</td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', textAlign: 'right', fontFamily: 'monospace', fontSize: 'var(--text-sm)' }}>₹{p.costPrice.toLocaleString('en-IN')}</td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', textAlign: 'right', fontFamily: 'monospace', fontSize: 'var(--text-sm)' }}>{p.onHand}</td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', textAlign: 'right', fontFamily: 'monospace', fontSize: 'var(--text-sm)', color: p.reserved > 0 ? 'var(--status-warning)' : 'inherit' }}>{p.reserved}</td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', textAlign: 'right', fontFamily: 'monospace', fontSize: 'var(--text-sm)', fontWeight: 600, color: p.available < p.reorderPoint ? 'var(--status-danger)' : 'var(--status-success)' }}>{p.available}</td>
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
