import { useNavigate } from 'react-router-dom';
import { Bell, Search, LogOut, Sun, Moon, Menu } from 'lucide-react';
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
          <div className="user">
            <img src="https://ui-avatars.com/api/?name=Admin&background=2a2185&color=fff" alt="User" />
          </div>
        </div>

        <button className="btn btn--icon" onClick={handleLogout} title="Logout" style={{ color: 'var(--status-danger)' }}>
          <LogOut size={20} />
        </button>
      </div>
    </div>
  );
}
