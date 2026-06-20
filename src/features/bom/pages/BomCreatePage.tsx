import { PlaceholderPage } from '@/components/shared/PlaceholderPage';
import { ListTree } from 'lucide-react';

export default function BomCreatePage() {
  return (
    <PlaceholderPage
      title="Create Bill of Materials"
      icon={ListTree}
      moduleName="BoM"
      description="Define a new Bill of Materials. Add component products with required quantities, and specify manufacturing operations with work centers and durations."
    />
  );
}
