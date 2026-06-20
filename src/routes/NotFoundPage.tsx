import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { ROUTES } from '@/routes/routeMap';

export function NotFoundPage() {
  return (
    <div className="notfound">
      <div className="notfound__content">
        <div className="notfound__icon">
          <AlertTriangle size={48} />
        </div>
        <div className="h1" style={{ fontSize: '72px', marginBottom: 'var(--space-xs)' }}>404</div>
        <div className="h2" style={{ marginBottom: 'var(--space-sm)' }}>Page Not Found</div>
        <div className="text-sm" style={{ marginBottom: 'var(--space-lg)', color: 'var(--text-muted)' }}>
          The page you're looking for doesn't exist or has been moved.
        </div>
        <Link to={ROUTES.DASHBOARD} className="btn btn--primary">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
