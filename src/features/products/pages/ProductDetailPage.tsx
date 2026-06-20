import { PlaceholderPage } from '@/components/shared/PlaceholderPage';
import { Package } from 'lucide-react';

export default function ProductDetailPage() {
  return (
    <PlaceholderPage
      title="Product Detail"
      icon={Package}
      moduleName="Products"
      description="View product details including inventory snapshot, stock card timeline, procurement configuration, and associated Bill of Materials."
    />
  );
}
