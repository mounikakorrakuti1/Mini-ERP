import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, Search, Plus, Eye, Layers, Package, Settings } from 'lucide-react';
import { ROUTES } from '@/routes/routeMap';
import { useDb } from '@/store/db.store';

export default function BomListPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { boms, isLoading } = useDb();

  const filteredBoms = boms.filter(b => {
    const q = searchQuery.toLowerCase();
    const ref = (b.name || b.code || b.id).toLowerCase();
    const product = ((b as any).finishedProduct?.name || '').toLowerCase();
    return ref.includes(q) || product.includes(q);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
        <div>
          <h1 className="h1" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
            <Wrench size={28} color="var(--accent-main)" /> Bill of Materials
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Foundational recipes for manufacturing finished goods</p>
        </div>
        <button className="btn btn--primary" onClick={() => navigate(`${ROUTES.BOM_LIST}/new`)} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Plus size={16} /> New BoM
        </button>
      </div>

      {/* Toolbar */}
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', alignItems: 'center', padding: 'var(--space-sm) var(--space-md)' }}>
        <div className="input-field" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', flex: 1, minWidth: '220px', padding: '0.4rem var(--space-sm)' }}>
          <Search size={16} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search by BOM name, finished product, or code..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', width: '100%', outline: 'none', background: 'transparent' }}
          />
        </div>
        <span className="text-xs" style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {filteredBoms.length} recipes defined
        </span>
      </div>

      {/* Grid of BOMs (using cards for a "premium" recipe feel) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-md)' }}>
        {isLoading ? (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--space-xl)' }}>
            <Settings className="spin" size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text-muted)' }}>Loading recipes...</p>
          </div>
        ) : filteredBoms.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--space-xl)' }}>
            <p style={{ color: 'var(--text-muted)' }}>No bills of materials found. Start by creating a recipe for a finished good.</p>
          </div>
        ) : (
          filteredBoms.map((bom) => (
            <div key={bom.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', border: '1px solid var(--border-main)' }} onClick={() => navigate(`${ROUTES.BOM_LIST}/${bom.id}`)} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'var(--accent-soft)', color: 'var(--accent-main)' }}>
                    <Layers size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700 }}>{bom.name || bom.code || 'Standard BOM'}</h3>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Ref: {bom.id.slice(0, 8)}</p>
                  </div>
                </div>
                <div style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-app)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--accent-main)' }}>
                  v1.0
                </div>
              </div>

              <div style={{ marginTop: 'var(--space-xs)', padding: 'var(--space-sm)', backgroundColor: 'var(--bg-app)', borderRadius: '8px' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>FOR FINISHED PRODUCT</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                  <Package size={14} color="var(--status-success)" />
                  {(bom as any).finishedProduct?.name || 'Unknown Product'}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 'var(--space-xs)' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  Contains <strong>{(bom as any).items?.length || 0}</strong> components
                </div>
                <button className="btn btn--icon">
                  <Eye size={18} color="var(--accent-main)" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
