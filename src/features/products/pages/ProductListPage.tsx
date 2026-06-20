import { PlaceholderPage } from '@/components/shared/PlaceholderPage';
import { Package } from 'lucide-react';

export default function ProductListPage() {
  return (
    <PlaceholderPage
      title="Products"
      icon={Package}
      moduleName="Products"
      description="Manage your product catalog including raw materials and finished goods. Configure procurement settings, reorder points, and track inventory levels per product."
    />
  );
}
