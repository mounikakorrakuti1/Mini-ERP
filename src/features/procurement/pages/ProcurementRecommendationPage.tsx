import { PlaceholderPage } from '@/components/shared/PlaceholderPage';
import { Workflow } from 'lucide-react';

export default function ProcurementRecommendationPage() {
  return (
    <PlaceholderPage
      title="Procurement Inbox"
      icon={Workflow}
      moduleName="Procurement"
      description="Review and act on auto-generated procurement recommendations to fulfill shortages in Sales and Manufacturing orders."
    />
  );
}
