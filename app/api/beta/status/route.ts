/**
 * Beta Access Status API
 * Returns beta access status for the authenticated user
 */

import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';
import { getBetaAccessStatus } from '@/lib/beta-access';

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const status = getBetaAccessStatus(session.user.email);

    return NextResponse.json({
      success: true,
      data: {
        email: session.user.email,
        ...status,
      },
    });
  } catch (error) {
    console.error('[Beta Status API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check beta status' },
      { status: 500 }
    );
  }
}
