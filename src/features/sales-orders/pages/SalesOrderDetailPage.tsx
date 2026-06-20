import { PlaceholderPage } from '@/components/shared/PlaceholderPage';
import { ShoppingCart } from 'lucide-react';

export default function SalesOrderDetailPage() {
  return (
    <PlaceholderPage
      title="Sales Order Detail"
      icon={ShoppingCart}
      moduleName="Sales"
      description="View sales order details with status-aware actions (Confirm, Deliver, Cancel). Includes line items, reservations, procurement chain, and audit log tabs."
    />
  );
}
