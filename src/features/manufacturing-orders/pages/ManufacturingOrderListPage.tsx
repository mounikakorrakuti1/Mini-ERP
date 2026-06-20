import { PlaceholderPage } from '@/components/shared/PlaceholderPage';
import { Factory } from 'lucide-react';

export default function ManufacturingOrderListPage() {
  return (
    <PlaceholderPage
      title="Manufacturing Orders"
      icon={Factory}
      moduleName="Manufacturing"
      description="Manage manufacturing orders from Draft through production to completion. Track component consumption, work order progress, and output quantities."
    />
  );
}
