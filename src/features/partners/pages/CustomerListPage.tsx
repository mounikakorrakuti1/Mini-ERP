import { PlaceholderPage } from '@/components/shared/PlaceholderPage';
import { Users } from 'lucide-react';

export default function CustomerListPage() {
  return (
    <PlaceholderPage
      title="Customers"
      icon={Users}
      moduleName="Partners"
      description="Manage customer profiles, addresses, and view their sales order history."
    />
  );
}
