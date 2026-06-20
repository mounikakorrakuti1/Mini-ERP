import { PlaceholderPage } from '@/components/shared/PlaceholderPage';
import { Boxes } from 'lucide-react';

export default function InventoryLedgerPage() {
  return (
    <PlaceholderPage
      title="Inventory Ledger"
      icon={Boxes}
      moduleName="Inventory"
      description="Track every stock movement with full audit trail. View purchase receipts, sales deliveries, manufacturing consumption, and production output entries."
    />
  );
}
