import { PlaceholderPage } from '@/components/shared/PlaceholderPage';
import { ListTree } from 'lucide-react';

export default function BomListPage() {
  return (
    <PlaceholderPage
      title="Bill of Materials"
      icon={ListTree}
      moduleName="BoM"
      description="Manage Bills of Materials defining product recipes. Each BoM specifies components, quantities, and manufacturing operations required to produce a finished good."
    />
  );
}
