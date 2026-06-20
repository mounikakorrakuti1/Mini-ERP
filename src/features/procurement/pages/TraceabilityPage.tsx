import { PlaceholderPage } from '@/components/shared/PlaceholderPage';
import { Workflow } from 'lucide-react';
import { useParams } from 'react-router-dom';

export default function TraceabilityPage() {
  const { soId } = useParams();
  
  return (
    <PlaceholderPage
      title={`Traceability for ${soId}`}
      icon={Workflow}
      moduleName="Procurement"
      description="View the entire supply chain traceability tree for this order. Trace from final delivery back through manufacturing orders, consumed components, and purchase receipts."
    />
  );
}
