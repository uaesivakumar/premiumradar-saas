/**
 * VS12: Verify Email Code API
 * Verifies the 6-digit code entered by user
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailCode } from '@/lib/db/users';

interface VerifyCodeRequest {
  userId: string;
  code: string;
}

interface VerifyCodeResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<VerifyCodeResponse>> {
  try {
    const body = await request.json();
    const { userId, code } = body as VerifyCodeRequest;

    // Validate input
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid 6-digit code' },
        { status: 400 }
      );
    }

    // Verify the code
    const user = await verifyEmailCode(userId, code);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired code. Please request a new one.' },
        { status: 400 }
      );
    }

    console.log('[VS12] Email verified successfully:', {
      userId: user.id,
      email: user.email,
    });

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    console.error('[Verify Code] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify code. Please try again.' },
      { status: 500 }
    );
  }
}
