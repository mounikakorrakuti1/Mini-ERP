import { PlaceholderPage } from '@/components/shared/PlaceholderPage';
import { ShoppingCart } from 'lucide-react';

export default function SalesOrderListPage() {
  return (
    <PlaceholderPage
      title="Sales Orders"
      icon={ShoppingCart}
      moduleName="Sales"
      description="View and manage all sales orders. Track order status through Draft → Confirmed → Partially Delivered → Fully Delivered lifecycle. Toggle between list and Kanban views."
    />
  );
}
