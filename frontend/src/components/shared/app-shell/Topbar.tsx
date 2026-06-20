import { useNavigate, Link } from 'react-router-dom';
import { Bell, Search, LogOut, Sun, Moon, User } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { ROUTES } from '@/routes/routeMap';

interface TopbarProps {
}

export function Topbar({}: TopbarProps) {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <div className="topbar">
      <div className="search">
        <label>
          <input type="text" placeholder="Search here" />
          <Search className="lucide" size={18} />
        </label>
      </div>

      <div className="topbar__actions" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        {/* Theme Toggle */}
        <button className="btn btn--icon" onClick={toggleTheme} title="Toggle Theme">
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        {/* Notifications */}
        <button className="btn btn--icon" title="Notifications">
          <Bell size={20} />
        </button>

        <div className="topbar__user">
          <Link to={ROUTES.PROFILE} className="btn btn--icon" title="Profile">
            <User size={20} />
          </Link>
        </div>

        <button className="btn btn--icon" onClick={handleLogout} title="Logout">
          <LogOut size={20} />
        </button>
      </div>
    </div>
  );
}
