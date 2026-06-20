import { useNavigate } from 'react-router-dom';
import { Bell, Search, LogOut, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { ROUTES } from '@/routes/routeMap';

export function Topbar() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
        <div className="input-field" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', minWidth: '300px' }}>
          <Search size={16} color="var(--text-muted)" />
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Search... (Cmd+K)</span>
        </div>
      </div>

      <div className="topbar__actions">
        {/* Theme Toggle */}
        <button className="btn btn--icon" onClick={toggleTheme} title="Toggle Theme">
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        {/* Notifications */}
        <button className="btn btn--icon" title="Notifications">
          <Bell size={20} />
        </button>

        <div className="topbar__user">
          <div style={{ textAlign: 'right' }}>
            <div className="text-md">{user?.name ?? 'Guest'}</div>
            <div className="text-xs">{user?.role?.replace(/_/g, ' ') ?? 'No Role'}</div>
          </div>
          
          <button className="btn btn--icon" onClick={handleLogout} title="Logout" style={{ color: 'var(--status-danger)' }}>
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
