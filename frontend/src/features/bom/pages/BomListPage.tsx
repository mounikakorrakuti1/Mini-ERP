import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye } from 'lucide-react';
import { ROUTES } from '@/routes/routeMap';
import { useDb } from '@/store/db.store';

export default function BomListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { boms, isLoading } = useDb();

  const filteredBoms = boms.filter(b => {
    const q = searchQuery.toLowerCase();
    const ref = (b.reference || b.id).toLowerCase();
    const product = (b.finishedProduct?.name || '').toLowerCase();
    return ref.includes(q) || product.includes(q);
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="h2">Bill of Materials</h1>
          <p className="text-sm text-muted">Manage product recipes</p>
        </div>
        <div className="page-header__actions">
          <div className="page-header__search">
            <Search size={16} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Search BoMs..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Link to={`${ROUTES.BOM_LIST}/new`} className="btn btn--primary">
            <Plus size={16} /> New BoM
          </Link>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th className="table__th">Ref</th>
              <th className="table__th">Finished Product</th>
              <th className="table__th">Component Count</th>
              <th className="table__th" style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="table__td" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-md)' }}>
                  Loading BoMs...
                </td>
              </tr>
            ) : filteredBoms.length > 0 ? (
              filteredBoms.map((bom) => (
              <tr key={bom.id} className="table__tr">
                <td className="table__td" style={{ fontWeight: 500 }}>{bom.reference || bom.id.slice(0,8)}</td>
                <td className="table__td">{bom.finishedProduct?.name || 'Unknown Product'}</td>
                <td className="table__td">{bom.items?.length || 0} components</td>
                <td className="table__td" style={{ textAlign: 'right' }}>
                  <Link to={`${ROUTES.BOM_LIST}/${bom.id}`} className="btn btn--icon">
                    <Eye size={18} color="var(--text-muted)" />
                  </Link>
                </td>
              </tr>
            ))
            ) : (
              <tr>
                <td colSpan={4} className="table__td" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-md)' }}>
                  No BoMs match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
