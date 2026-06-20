import { PlaceholderPage } from '@/components/shared/PlaceholderPage';
import { ShieldCheck } from 'lucide-react';

export default function UserManagementPage() {
  return (
    <PlaceholderPage
      title="User Management"
      icon={ShieldCheck}
      moduleName="RBAC"
      description="Manage system users, assign roles (Admin, Sales, Purchase, Manufacturing, Inventory), and control system access."
    />
  );
}
