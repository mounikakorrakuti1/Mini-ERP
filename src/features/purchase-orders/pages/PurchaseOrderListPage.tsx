import { PlaceholderPage } from '@/components/shared/PlaceholderPage';
import { Truck } from 'lucide-react';

export default function PurchaseOrderListPage() {
  return (
    <PlaceholderPage
      title="Purchase Orders"
      icon={Truck}
      moduleName="Purchase"
      description="Manage purchase orders for raw materials and components. Track vendor deliveries through Draft → Confirmed → Partially Received → Fully Received lifecycle."
    />
  );
}
