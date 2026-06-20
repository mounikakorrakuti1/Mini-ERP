import { PlaceholderPage } from '@/components/shared/PlaceholderPage';
import { Factory } from 'lucide-react';

export default function ManufacturingOrderCreatePage() {
  return (
    <PlaceholderPage
      title="Create Manufacturing Order"
      icon={Factory}
      moduleName="Manufacturing"
      description="Create a new manufacturing order. Select product, BoM, quantity, and planned dates. Components are auto-populated from the selected Bill of Materials."
    />
  );
}
