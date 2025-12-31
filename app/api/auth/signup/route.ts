/**
 * S348-F5: PLG Signup API Route
 * Sprint: S348 - PLG Proof Pack
 *
 * Real user signup with PLG model:
 * - Creates INDIVIDUAL_USER (not enterprise-bound)
 * - Emits USER_CREATED business event (no silent onboarding)
 * - Personal email domain blocking (Gmail, Yahoo, etc.)
 * - User must complete onboarding to bind to workspace
 *
 * Evidence guarantee: Every signup emits a traceable event.
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createIndividualUser, emailExists, createEmailVerificationCode } from '@/lib/db/users';
import { isPersonalEmailDomain, analyzeEmail } from '@/lib/auth/identity/domain-extractor';
import { createSession, setSessionCookies } from '@/lib/auth/session/enhanced-session';
import { sendEmail } from '@/lib/email/send';
import { createIndividualUserContext } from '@/lib/auth/session/session-context';
import { emitBusinessEvent } from '@/lib/events/event-emitter';

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
  email?: string;
  requiresVerification?: boolean;
  redirectTo?: string;
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

    // S348-F5: Create INDIVIDUAL_USER (PLG path)
    // User is NOT bound to enterprise/workspace at signup
    const userWithProfile = await createIndividualUser({
      email: normalizedEmail,
      password,
      name: name || undefined,
      vertical: vertical || 'banking',
      subVertical: subVertical || 'employee-banking',
      regionCountry: regionCountry || 'UAE',
      companyName: emailAnalysis.companyName || undefined,
      companyDomain: emailAnalysis.domain,
    });

    // S348-F5: Emit USER_CREATED business event (NO SILENT ONBOARDING)
    const ctx = createIndividualUserContext(
      userWithProfile.id,
      regionCountry || 'UAE'
    );

    await emitBusinessEvent(ctx, {
      event_type: 'USER_CREATED',
      entity_type: 'USER',
      entity_id: userWithProfile.id,
      metadata: {
        email_domain: emailAnalysis.domain,
        company_name: emailAnalysis.companyName,
        vertical: vertical || 'banking',
        sub_vertical: subVertical || 'employee-banking',
        region: regionCountry || 'UAE',
        role: 'INDIVIDUAL_USER',
        plg_signup: true,
        enterprise_bound: false,
        workspace_bound: false,
        onboarding_step: 'context-selection',
        ip_address: ip,
        user_agent_hash: userAgent.substring(0, 50),
      },
    });

    console.log('[S348-F5] PLG signup event emitted:', {
      userId: userWithProfile.id,
      role: 'INDIVIDUAL_USER',
      enterpriseBound: false,
    });

    // Create email verification code (VS12: 6-digit code)
    const verificationCode = await createEmailVerificationCode(userWithProfile.id);

    // Send verification email with code
    try {
      await sendEmail({
        to: normalizedEmail,
        subject: 'Your PremiumRadar verification code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Welcome to PremiumRadar!</h1>
            <p>Hi ${name || 'there'},</p>
            <p>Thanks for signing up. Enter this verification code to verify your email address:</p>
            <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 24px 0; border-radius: 8px;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">${verificationCode}</span>
            </div>
            <p style="color: #666; font-size: 14px;">This code will expire in 15 minutes.</p>
            <p>If you didn't create this account, you can safely ignore this email.</p>
            <p>Best,<br>The PremiumRadar Team</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('[Signup] Failed to send verification email:', emailError);
      // Continue anyway - user can request new verification email
    }

    // S348-F5: Create session for INDIVIDUAL_USER
    // Note: enterprise_id and workspace_id are NULL (PLG state)
    const sessionResult = await createSession({
      userId: userWithProfile.id,
      email: userWithProfile.email,
      name: userWithProfile.name || undefined,
      tenantId: userWithProfile.tenant_id, // Legacy (minimal tenant for compatibility)
      tenantName: undefined, // No tenant name for PLG
      enterpriseId: undefined, // NOT BOUND (PLG)
      enterpriseName: undefined,
      workspaceId: undefined, // NOT BOUND (PLG)
      role: 'INDIVIDUAL_USER', // Explicit role
      mfaEnabled: userWithProfile.mfa_enabled,
      mfaVerified: false,
      plan: 'free', // PLG users start on free
      subscriptionStatus: 'active',
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

    console.log('[S348-F5] PLG user created successfully:', {
      userId: userWithProfile.id,
      email: normalizedEmail,
      role: 'INDIVIDUAL_USER',
      vertical: userWithProfile.profile?.vertical,
      subVertical: userWithProfile.profile?.sub_vertical,
      enterpriseId: null, // PLG: not bound
      workspaceId: null, // PLG: not bound
      onboardingStep: 'context-selection',
      eventEmitted: true,
    });

    // Build redirect URL with user info for verify-email page
    const redirectTo = `/verify-email?userId=${userWithProfile.id}&email=${encodeURIComponent(normalizedEmail)}`;

    return NextResponse.json({
      success: true,
      message: 'Account created successfully. Please check your email for your verification code.',
      userId: userWithProfile.id,
      email: normalizedEmail,
      requiresVerification: true,
      redirectTo,
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
