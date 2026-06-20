import { PlaceholderPage } from '@/components/shared/PlaceholderPage';
import { Boxes } from 'lucide-react';

export default function InventorySummaryPage() {
  return (
    <PlaceholderPage
      title="Inventory Summary"
      icon={Boxes}
      moduleName="Inventory"
      description="View real-time inventory levels across all products. Monitor On Hand, Reserved, and Free-to-Use quantities with reorder point indicators."
    />
  );
}
