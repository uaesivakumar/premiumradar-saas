/**
 * S309: Profile Settings Page
 * Part of User & Enterprise Management Program v1.1
 * Phase D - Frontend & UI
 *
 * User profile settings page route.
 */

import { ProfileSettings } from '@/components/enterprise';
import { EnterpriseProvider } from '@/lib/providers/EnterpriseContextProvider';

export const metadata = {
  title: 'Profile Settings | PremiumRadar',
  description: 'Manage your profile settings and preferences',
};

export default function ProfileSettingsPage() {
  return (
    <EnterpriseProvider>
      <ProfileSettings />
    </EnterpriseProvider>
  );
}
