import { PlaceholderPage } from '@/components/shared/PlaceholderPage';
import { Package } from 'lucide-react';

export default function ProductFormPage() {
  return (
    <PlaceholderPage
      title="Create Product"
      icon={Package}
      moduleName="Products"
      description="Add a new product to the catalog. Configure name, type, unit of measure, procurement settings, and reorder point thresholds."
    />
  );
}
