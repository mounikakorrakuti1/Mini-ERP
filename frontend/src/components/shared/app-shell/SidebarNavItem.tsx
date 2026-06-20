import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

interface SidebarNavItemProps {
  label: string;
  path: string;
  icon: LucideIcon;
  collapsed: boolean;
}

export function SidebarNavItem({ label, path, icon: Icon, collapsed }: SidebarNavItemProps) {
  return (
    <NavLink
      to={path}
      className={({ isActive }) =>
        `sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''}`
      }
      title={collapsed ? label : undefined}
    >
      <Icon className="sidebar__nav-icon" />
      {!collapsed && <span className="sidebar__nav-label">{label}</span>}
    </NavLink>
  );
}
