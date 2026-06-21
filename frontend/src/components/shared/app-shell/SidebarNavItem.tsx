import { NavLink, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

interface SidebarNavItemProps {
  label: string;
  path: string;
  icon: LucideIcon;
  collapsed: boolean;
}

export function SidebarNavItem({ label, path, icon: Icon, collapsed }: SidebarNavItemProps) {
  const location = useLocation();
  const isActive = path === '/app' 
    ? location.pathname === '/app' || location.pathname === '/app/'
    : location.pathname.startsWith(path) && (path !== '/' || location.pathname === '/');

  return (
    <li className={`sidebar__nav-li ${isActive ? 'isActive' : ''}`}>
      <NavLink
        to={path}
        className="sidebar__nav-item"
        title={collapsed ? label : undefined}
      >
        <span className="icon">
          <Icon size={20} />
        </span>
        {!collapsed && <span className="title">{label}</span>}
      </NavLink>
    </li>
  );
}
