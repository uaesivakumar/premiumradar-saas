/**
 * Email Signatures API
 * Sprint S54: Admin Panel
 *
 * GET /api/admin/settings/signatures - List signatures
 * POST /api/admin/settings/signatures - Create signature
 */

import { NextRequest, NextResponse } from 'next/server';
import { createTenantSettingsService } from '@/lib/admin/tenant-settings';
import { getServerSession } from '@/lib/auth/session';
import { EmailSignatureSchema } from '@/lib/admin/tenant-settings/types';
import { z } from 'zod';

const CreateSignatureSchema = EmailSignatureSchema.omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id || !session?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || session.user.id;

    const service = createTenantSettingsService(session.tenantId, session.user.id);
    const signatures = await service.getEmailSignatures(userId);

    return NextResponse.json({ success: true, data: signatures });
  } catch (error) {
    console.error('Error fetching signatures:', error);
    return NextResponse.json(
      { error: 'Failed to fetch signatures' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id || !session?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = CreateSignatureSchema.parse({
      ...body,
      userId: body.userId || session.user.id,
    });

    const service = createTenantSettingsService(session.tenantId, session.user.id);
    const signature = await service.createEmailSignature(validated);

    return NextResponse.json({ success: true, data: signature }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error creating signature:', error);
    return NextResponse.json(
      { error: 'Failed to create signature' },
      { status: 500 }
    );
  }
}
