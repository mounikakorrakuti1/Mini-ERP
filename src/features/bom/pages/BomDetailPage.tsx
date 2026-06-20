import { PlaceholderPage } from '@/components/shared/PlaceholderPage';
import { ListTree } from 'lucide-react';

export default function BomDetailPage() {
  return (
    <PlaceholderPage
      title="Bill of Materials Detail"
      icon={ListTree}
      moduleName="BoM"
      description="View BoM details including component tree, operations, work centers, and associated manufacturing orders. Supports cloning for variant creation."
    />
  );
}
