import { NextRequest, NextResponse } from 'next/server';
import { osClient } from '@/lib/os-client';
import { getServerSession } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    // VS12: Security Fix - Require authenticated session
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Log audit trail
    console.log(`[OS Outreach] tenant=${session.tenantId} user=${session.user.id}`);

    const result = await osClient.outreach(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API /os/outreach] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Outreach request failed' },
      { status: 500 }
    );
  }
}
