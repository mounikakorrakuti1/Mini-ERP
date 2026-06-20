import {
  LayoutDashboard, Package, Boxes, ShoppingCart, Truck, Factory,
  ListTree, Workflow, Users, Building2, History, BarChart3,
  ShieldCheck, User, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import { ROUTES } from '@/routes/routeMap';
import { MODULE, PERMISSION_ACTION } from '@/types/enums';
import type { ModuleName } from '@/types/enums';
import { hasPermission } from '@/lib/permissions';
import { useAuthStore } from '@/store/auth.store';
import { SidebarNavItem } from './SidebarNavItem';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  module: ModuleName;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: ROUTES.DASHBOARD, icon: LayoutDashboard, module: MODULE.DASHBOARDS },
  { label: 'Products', path: ROUTES.PRODUCTS, icon: Package, module: MODULE.PRODUCTS },
  { label: 'Inventory', path: ROUTES.INVENTORY_SUMMARY, icon: Boxes, module: MODULE.INVENTORY },
  { label: 'Sales Orders', path: ROUTES.SALES_ORDERS, icon: ShoppingCart, module: MODULE.SALES_ORDERS },
  { label: 'Purchase Orders', path: ROUTES.PURCHASE_ORDERS, icon: Truck, module: MODULE.PURCHASE_ORDERS },
  { label: 'Manufacturing', path: ROUTES.MANUFACTURING_ORDERS, icon: Factory, module: MODULE.MANUFACTURING_ORDERS },
  { label: 'Bill of Materials', path: ROUTES.BOM_LIST, icon: ListTree, module: MODULE.BOM },
  { label: 'Procurement', path: ROUTES.PROCUREMENT_INBOX, icon: Workflow, module: MODULE.PROCUREMENT },
  { label: 'Customers', path: ROUTES.CUSTOMERS, icon: Users, module: MODULE.CUSTOMERS },
  { label: 'Vendors', path: ROUTES.VENDORS, icon: Building2, module: MODULE.VENDORS },
  { label: 'Audit Logs', path: ROUTES.AUDIT_LOGS, icon: History, module: MODULE.AUDIT_LOGS },
  { label: 'Analytics', path: ROUTES.ANALYTICS, icon: BarChart3, module: MODULE.ANALYTICS },
  { label: 'User Management', path: ROUTES.USER_MANAGEMENT, icon: ShieldCheck, module: MODULE.USER_MANAGEMENT },
  { label: 'Profile', path: ROUTES.PROFILE, icon: User, module: MODULE.DASHBOARDS },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onMobileClose?: () => void; // Unused in strict CSS but kept for signature
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user } = useAuthStore();

  const filteredItems = NAV_ITEMS.filter((item) =>
    hasPermission(user?.role, item.module, PERMISSION_ACTION.VIEW)
  );

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : 'sidebar--expanded'}`}>
      <div className="sidebar__header" style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}>
        <div className="sidebar__header-logo">
          <Factory size={20} />
        </div>
        {!collapsed && (
          <div className="sidebar__header-text">
            <div className="h3" style={{ lineHeight: 1 }}>Mini ERP</div>
            <div className="text-xs">Shiv Furniture Works</div>
          </div>
        )}
      </div>

      <nav className="sidebar__nav">
        {filteredItems.map((item) => (
          <SidebarNavItem
            key={item.path}
            label={item.label}
            path={item.path}
            icon={item.icon}
            collapsed={collapsed}
          />
        ))}
      </nav>

      <div className="sidebar__toggle-section">
        <button onClick={onToggle} className="btn w-full" style={{ width: '100%' }}>
          {collapsed ? <ChevronsRight size={20} /> : (
            <>
              <ChevronsLeft size={20} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
