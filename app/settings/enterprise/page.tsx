/**
 * S309: Enterprise Settings Page
 * Part of User & Enterprise Management Program v1.1
 * Phase D - Frontend & UI
 *
 * Enterprise admin settings page route.
 */

import { EnterpriseDashboard } from '@/components/enterprise';
import { EnterpriseProvider } from '@/lib/providers/EnterpriseContextProvider';

export const metadata = {
  title: 'Enterprise Settings | PremiumRadar',
  description: 'Manage your enterprise settings, users, and workspaces',
};

export default function EnterpriseSettingsPage() {
  return (
    <EnterpriseProvider>
      <EnterpriseDashboard />
    </EnterpriseProvider>
  );
}
