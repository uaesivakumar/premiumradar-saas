/**
 * VS12: Resend Verification Code API
 * Generates and sends a new 6-digit verification code
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserById, createEmailVerificationCode } from '@/lib/db/users';
import { sendEmail } from '@/lib/email/send';

interface ResendCodeRequest {
  userId: string;
}

interface ResendCodeResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<ResendCodeResponse>> {
  try {
    const body = await request.json();
    const { userId } = body as ResendCodeRequest;

    // Validate input
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user
    const user = await getUserById(userId);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already verified
    if (user.email_verified) {
      return NextResponse.json(
        { success: false, error: 'Email is already verified' },
        { status: 400 }
      );
    }

    // Generate new code
    const verificationCode = await createEmailVerificationCode(userId);

    // Send email
    try {
      await sendEmail({
        to: user.email,
        subject: 'Your new PremiumRadar verification code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">New Verification Code</h1>
            <p>Hi ${user.name || 'there'},</p>
            <p>Here is your new verification code:</p>
            <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 24px 0; border-radius: 8px;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">${verificationCode}</span>
            </div>
            <p style="color: #666; font-size: 14px;">This code will expire in 15 minutes.</p>
            <p>If you didn't request this code, you can safely ignore this email.</p>
            <p>Best,<br>The PremiumRadar Team</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('[Resend Code] Failed to send email:', emailError);
      return NextResponse.json(
        { success: false, error: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      );
    }

    console.log('[VS12] Verification code resent:', {
      userId: user.id,
      email: user.email,
    });

    return NextResponse.json({
      success: true,
      message: 'Verification code sent',
    });
  } catch (error) {
    console.error('[Resend Code] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to resend code. Please try again.' },
      { status: 500 }
    );
  }
}
