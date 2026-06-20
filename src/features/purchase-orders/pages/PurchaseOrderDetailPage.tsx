import { PlaceholderPage } from '@/components/shared/PlaceholderPage';
import { Truck } from 'lucide-react';

export default function PurchaseOrderDetailPage() {
  return (
    <PlaceholderPage
      title="Purchase Order Detail"
      icon={Truck}
      moduleName="Purchase"
      description="View purchase order details with status-aware actions (Confirm, Receive, Cancel). Includes line items with received quantities and audit log."
    />
  );
}
