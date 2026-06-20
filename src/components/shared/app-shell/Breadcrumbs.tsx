import { Fragment } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const SEGMENT_LABELS: Record<string, string> = {
  products: 'Products',
  new: 'Create',
  inventory: 'Inventory',
  ledger: 'Ledger',
  summary: 'Summary',
  'sales-orders': 'Sales Orders',
  'purchase-orders': 'Purchase Orders',
  'manufacturing-orders': 'Manufacturing Orders',
  kanban: 'Kanban',
  bom: 'Bill of Materials',
  procurement: 'Procurement',
  traceability: 'Traceability',
  'audit-logs': 'Audit Logs',
  analytics: 'Analytics',
  admin: 'Admin',
  users: 'Users',
  profile: 'Profile',
  vendors: 'Vendors',
  customers: 'Customers',
};

export function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = segments.map((segment, i) => {
    const isParam = /^[0-9a-f-]{4,}$/i.test(segment);
    return {
      label: isParam ? `#${segment.substring(0, 8)}…` : (SEGMENT_LABELS[segment] ?? segment),
      path: '/' + segments.slice(0, i + 1).join('/'),
      isLast: i === segments.length - 1,
    };
  });

  return (
    <nav className="breadcrumbs">
      <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
        <Home size={16} />
      </Link>
      {crumbs.map((crumb) => (
        <Fragment key={crumb.path}>
          <ChevronRight size={14} />
          <div className={`breadcrumbs__crumb ${crumb.isLast ? 'breadcrumbs__crumb--active' : ''}`}>
            {crumb.isLast ? (
              <span>{crumb.label}</span>
            ) : (
              <Link to={crumb.path}>{crumb.label}</Link>
            )}
          </div>
        </Fragment>
      ))}
    </nav>
  );
}
