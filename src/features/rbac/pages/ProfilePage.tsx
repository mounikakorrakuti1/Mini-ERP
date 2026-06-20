import { PlaceholderPage } from '@/components/shared/PlaceholderPage';
import { User } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

export default function ProfilePage() {
  const { user } = useAuthStore();
  
  return (
    <PlaceholderPage
      title={`Profile: ${user?.name}`}
      icon={User}
      moduleName="System"
      description="View and edit your personal profile information. Email and role changes are restricted to administrators."
    />
  );
}
