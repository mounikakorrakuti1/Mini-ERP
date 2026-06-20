import { PlaceholderPage } from '@/components/shared/PlaceholderPage';
import { Truck } from 'lucide-react';

export default function PurchaseOrderCreatePage() {
  return (
    <PlaceholderPage
      title="Create Purchase Order"
      icon={Truck}
      moduleName="Purchase"
      description="Create a new purchase order. Select vendor, add line items with products and quantities, and submit as Draft for review."
    />
  );
}
