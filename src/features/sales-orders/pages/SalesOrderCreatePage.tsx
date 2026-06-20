import { PlaceholderPage } from '@/components/shared/PlaceholderPage';
import { ShoppingCart } from 'lucide-react';

export default function SalesOrderCreatePage() {
  return (
    <PlaceholderPage
      title="Create Sales Order"
      icon={ShoppingCart}
      moduleName="Sales"
      description="Create a new sales order. Select customer, add line items with products and quantities, and submit as Draft for review before confirmation."
    />
  );
}
