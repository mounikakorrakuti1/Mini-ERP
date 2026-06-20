import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bell, Search, LogOut, Sun, Moon, User, X, Check } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { ROUTES } from '@/routes/routeMap';
import { api } from '@/lib/api';

interface TopbarProps {}

export function Topbar({}: TopbarProps) {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications/unread');
      setNotifications(res.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // poll every minute
    return () => clearInterval(interval);
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

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
        <div style={{ position: 'relative' }}>
          <button 
            className="btn btn--icon" 
            title="Notifications"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <Bell size={20} />
            {notifications.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                backgroundColor: 'var(--status-danger)',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 'bold',
                padding: '2px 6px',
                borderRadius: '10px',
              }}>
                {notifications.length}
              </span>
            )}
          </button>

          {showDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 'var(--space-xs)',
              width: '320px',
              backgroundColor: 'var(--bg-app)',
              border: '1px solid var(--border-main)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow-md)',
              zIndex: 50,
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              <div style={{ padding: 'var(--space-sm)', borderBottom: '1px solid var(--border-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 600 }}>Notifications</h4>
                <button className="btn btn--icon" onClick={() => setShowDropdown(false)} style={{ padding: '4px' }}>
                  <X size={16} />
                </button>
              </div>
              {notifications.length === 0 ? (
                <div style={{ padding: 'var(--space-md)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                  No new notifications
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {notifications.map(n => (
                    <div key={n.id} style={{
                      padding: 'var(--space-sm)',
                      borderBottom: '1px solid var(--border-main)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontWeight: 600, fontSize: 'var(--text-xs)' }}>{n.title}</span>
                        <button 
                          onClick={() => markAsRead(n.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--accent-main)', cursor: 'pointer', padding: 0 }}
                          title="Mark as read"
                        >
                          <Check size={14} />
                        </button>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{n.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

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
