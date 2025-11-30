/**
 * Billing Overview API
 * Sprint S54: Admin Panel
 *
 * GET /api/admin/settings/billing - Get billing overview
 */

import { NextRequest, NextResponse } from 'next/server';
import { createTenantSettingsService } from '@/lib/admin/tenant-settings';
import { getServerSession } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id || !session?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.user.permissions?.includes('settings:billing')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const service = createTenantSettingsService(session.tenantId, session.user.id);
    const billing = await service.getBillingOverview();

    if (!billing) {
      return NextResponse.json(
        { error: 'Billing information not available' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: billing });
  } catch (error) {
    console.error('Error fetching billing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch billing information' },
      { status: 500 }
    );
  }
}
