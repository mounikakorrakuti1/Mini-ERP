import { TrendingUp, TrendingDown, Users, ShoppingCart, Truck, Factory } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

export default function DashboardPage() {
  const { user } = useAuthStore();

  const metrics = [
    { label: 'Active Sales Orders', value: '24', trend: '+12%', isPositive: true, icon: ShoppingCart, color: 'var(--accent-main)' },
    { label: 'Pending Purchase', value: '8', trend: '-2%', isPositive: false, icon: Truck, color: 'var(--status-warning)' },
    { label: 'Mfg Orders', value: '15', trend: '+5%', isPositive: true, icon: Factory, color: 'var(--status-success)' },
    { label: 'New Customers', value: '42', trend: '+18%', isPositive: true, icon: Users, color: '#8b5cf6' },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <h1 className="h1">Dashboard</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Welcome back, {user?.name}. Here's what's happening today.
        </p>
      </div>

      <div className="dashboard__grid">
        {metrics.map((metric) => (
          <div key={metric.label} className="dashboard__kpi">
            <div className="dashboard__kpi-icon" style={{ backgroundColor: metric.color }}>
              <metric.icon size={20} />
            </div>
            <div className="dashboard__kpi-content">
              <div className="dashboard__kpi-label">{metric.label}</div>
              <div className="dashboard__kpi-value">{metric.value}</div>
              <div className="dashboard__kpi-trend" style={{ color: metric.isPositive ? 'var(--status-success)' : 'var(--status-danger)' }}>
                {metric.isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                <span>{metric.trend} from last month</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
