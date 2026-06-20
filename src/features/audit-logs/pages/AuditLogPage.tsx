import { PlaceholderPage } from '@/components/shared/PlaceholderPage';
import { History } from 'lucide-react';

export default function AuditLogPage() {
  return (
    <PlaceholderPage
      title="System Audit Logs"
      icon={History}
      moduleName="System"
      description="System-wide audit trail of all record mutations, status changes, and access events. Filterable by module, user, and date range."
    />
  );
}
