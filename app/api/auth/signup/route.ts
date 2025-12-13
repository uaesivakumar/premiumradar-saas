/**
 * VS10.2: Signup API Route
 * Sprint: S1 (VS10)
 *
 * Real user signup with:
 * - Personal email domain blocking (Gmail, Yahoo, etc.)
 * - Company domain extraction
 * - Automatic tenant creation
 * - Profile with vertical selection
 * - Email verification token
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createUser, emailExists, createEmailVerificationToken } from '@/lib/db/users';
import { isPersonalEmailDomain, analyzeEmail } from '@/lib/auth/identity/domain-extractor';
import { createSession, setSessionCookies } from '@/lib/auth/session/enhanced-session';
import { sendEmail } from '@/lib/email/send';

// ============================================================
// TYPES
// ============================================================

interface SignupRequest {
  email: string;
  password: string;
  name?: string;
  vertical?: string;
  subVertical?: string;
  regionCountry?: string;
}

interface SignupResponse {
  success: boolean;
  message?: string;
  error?: string;
  userId?: string;
  requiresVerification?: boolean;
}

// ============================================================
// VALIDATION
// ============================================================

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

function validateSignupInput(data: SignupRequest): { valid: boolean; error?: string } {
  // Email validation
  if (!data.email || !data.email.includes('@')) {
    return { valid: false, error: 'Valid email address is required' };
  }

  const email = data.email.toLowerCase().trim();
  const domain = email.split('@')[1];

  // Block personal email domains (VS10.2)
  if (isPersonalEmailDomain(domain)) {
    return {
      valid: false,
      error: 'Please use your work email address. Personal email providers (Gmail, Yahoo, etc.) are not allowed.',
    };
  }

  // Password validation
  if (!data.password || data.password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` };
  }

  if (!PASSWORD_REGEX.test(data.password)) {
    return {
      valid: false,
      error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    };
  }

  // Vertical validation (only banking is active)
  if (data.vertical && data.vertical !== 'banking') {
    return {
      valid: false,
      error: 'Only Banking vertical is currently available. Other verticals coming soon!',
    };
  }

  return { valid: true };
}

// ============================================================
// HANDLER
// ============================================================

export async function POST(request: NextRequest): Promise<NextResponse<SignupResponse>> {
  try {
    const body = await request.json();
    const { email, password, name, vertical, subVertical, regionCountry } = body as SignupRequest;

    // Validate input
    const validation = validateSignupInput(body);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const exists = await emailExists(normalizedEmail);
    if (exists) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Analyze email domain for company info
    const emailAnalysis = await analyzeEmail(normalizedEmail);

    // Get client info
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               headersList.get('x-real-ip') ||
               'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    // Create user with profile
    const userWithProfile = await createUser({
      email: normalizedEmail,
      password,
      name: name || undefined,
      vertical: vertical || 'banking',
      subVertical: subVertical || 'employee-banking',
      regionCountry: regionCountry || 'UAE',
      companyName: emailAnalysis.companyName || undefined,
      companyDomain: emailAnalysis.domain,
      companyIndustry: undefined, // TODO: Enrich via OS if needed
    });

    // Create email verification token
    const verificationToken = await createEmailVerificationToken(userWithProfile.id);

    // Send verification email
    try {
      await sendEmail({
        to: normalizedEmail,
        subject: 'Verify your PremiumRadar account',
        html: `
          <h1>Welcome to PremiumRadar!</h1>
          <p>Hi ${name || 'there'},</p>
          <p>Thanks for signing up. Please verify your email address by clicking the link below:</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/verify?token=${verificationToken}">
            Verify Email Address
          </a></p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create this account, you can safely ignore this email.</p>
          <p>Best,<br>The PremiumRadar Team</p>
        `,
      });
    } catch (emailError) {
      console.error('[Signup] Failed to send verification email:', emailError);
      // Continue anyway - user can request new verification email
    }

    // Create session
    const sessionResult = await createSession({
      userId: userWithProfile.id,
      email: userWithProfile.email,
      name: userWithProfile.name || undefined,
      tenantId: userWithProfile.tenant_id,
      tenantName: userWithProfile.tenant?.name,
      role: userWithProfile.role,
      mfaEnabled: userWithProfile.mfa_enabled,
      mfaVerified: false,
      plan: (userWithProfile.tenant?.plan as 'free' | 'starter' | 'professional' | 'enterprise') || 'free',
      subscriptionStatus: (userWithProfile.tenant?.subscription_status as 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid') || 'active',
      ipAddress: ip,
      userAgent,
    });

    if (!sessionResult.success || !sessionResult.accessToken || !sessionResult.refreshToken) {
      return NextResponse.json(
        { success: false, error: 'Failed to create session' },
        { status: 500 }
      );
    }

    // Set session cookies
    await setSessionCookies(sessionResult.accessToken, sessionResult.refreshToken);

    console.log('[VS10.2] User created successfully:', {
      userId: userWithProfile.id,
      email: normalizedEmail,
      vertical: userWithProfile.profile?.vertical,
      subVertical: userWithProfile.profile?.sub_vertical,
      tenantId: userWithProfile.tenant_id,
    });

    return NextResponse.json({
      success: true,
      message: 'Account created successfully. Please check your email to verify your account.',
      userId: userWithProfile.id,
      requiresVerification: true,
    });

  } catch (error) {
    console.error('[Signup] Error:', error);

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('duplicate key')) {
        return NextResponse.json(
          { success: false, error: 'An account with this email already exists' },
          { status: 409 }
        );
      }
      if (error.message.includes('tenant')) {
        return NextResponse.json(
          { success: false, error: 'Unable to create organization. Please try again.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create account. Please try again.' },
      { status: 500 }
    );
  }
}
