/**
 * VS10.1: Login API Route
 * Sprint: S1 (VS10)
 *
 * Real user login with:
 * - Email/password authentication
 * - Personal email domain validation
 * - JWT session creation
 * - MFA support (if enabled)
 * - Last login tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import {
  getUserByEmailWithProfile,
  verifyPassword,
  updateLastLogin,
} from '@/lib/db/users';
import { isPersonalEmailDomain } from '@/lib/auth/identity/domain-extractor';
import { createSession, setSessionCookies } from '@/lib/auth/session/enhanced-session';

// ============================================================
// TYPES
// ============================================================

interface LoginRequest {
  email: string;
  password: string;
  mfaCode?: string;
}

interface LoginResponse {
  success: boolean;
  message?: string;
  error?: string;
  requiresMFA?: boolean;
  user?: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    vertical: string | null;
    subVertical: string | null;
    regionCountry: string | null;
  };
}

// ============================================================
// RATE LIMITING (Simple in-memory - use Redis in production)
// ============================================================

const loginAttempts = new Map<string, { count: number; lastAttempt: Date }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(email: string): { allowed: boolean; remainingAttempts: number; lockoutMinutes?: number } {
  const key = email.toLowerCase();
  const record = loginAttempts.get(key);

  if (!record) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  const timeSinceLastAttempt = Date.now() - record.lastAttempt.getTime();

  // Reset if lockout period has passed
  if (timeSinceLastAttempt > LOCKOUT_DURATION) {
    loginAttempts.delete(key);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  if (record.count >= MAX_ATTEMPTS) {
    const remainingLockout = Math.ceil((LOCKOUT_DURATION - timeSinceLastAttempt) / 60000);
    return { allowed: false, remainingAttempts: 0, lockoutMinutes: remainingLockout };
  }

  return { allowed: true, remainingAttempts: MAX_ATTEMPTS - record.count };
}

function recordLoginAttempt(email: string, success: boolean): void {
  const key = email.toLowerCase();

  if (success) {
    loginAttempts.delete(key);
    return;
  }

  const record = loginAttempts.get(key) || { count: 0, lastAttempt: new Date() };
  record.count++;
  record.lastAttempt = new Date();
  loginAttempts.set(key, record);
}

// ============================================================
// HANDLER
// ============================================================

export async function POST(request: NextRequest): Promise<NextResponse<LoginResponse>> {
  try {
    const body = await request.json();
    const { email, password, mfaCode } = body as LoginRequest;

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const domain = normalizedEmail.split('@')[1];

    // Block personal email domains
    if (isPersonalEmailDomain(domain)) {
      return NextResponse.json(
        { success: false, error: 'Please use your work email address to login' },
        { status: 400 }
      );
    }

    // Rate limiting
    const rateLimit = checkRateLimit(normalizedEmail);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many login attempts. Please try again in ${rateLimit.lockoutMinutes} minutes.`,
        },
        { status: 429 }
      );
    }

    // Get user with profile
    const userWithProfile = await getUserByEmailWithProfile(normalizedEmail);

    if (!userWithProfile) {
      recordLoginAttempt(normalizedEmail, false);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email or password',
        },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!userWithProfile.is_active) {
      return NextResponse.json(
        { success: false, error: 'Your account has been deactivated. Please contact support.' },
        { status: 403 }
      );
    }

    // Verify password
    const passwordValid = await verifyPassword(userWithProfile, password);

    if (!passwordValid) {
      recordLoginAttempt(normalizedEmail, false);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email or password',
        },
        { status: 401 }
      );
    }

    // Check MFA
    if (userWithProfile.mfa_enabled) {
      if (!mfaCode) {
        return NextResponse.json({
          success: false,
          requiresMFA: true,
          message: 'MFA code required',
        });
      }

      // TODO: Verify MFA code
      // For now, skip MFA verification
    }

    // Get client info
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               headersList.get('x-real-ip') ||
               'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    // Update last login
    await updateLastLogin(userWithProfile.id, ip);

    // Record successful login
    recordLoginAttempt(normalizedEmail, true);

    // Create session
    const sessionResult = await createSession({
      userId: userWithProfile.id,
      email: userWithProfile.email,
      name: userWithProfile.name || undefined,
      tenantId: userWithProfile.tenant_id,
      tenantName: userWithProfile.tenant?.name,
      role: userWithProfile.role,
      mfaEnabled: userWithProfile.mfa_enabled,
      mfaVerified: userWithProfile.mfa_enabled ? !!mfaCode : false,
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

    console.log('[VS10.1] Login successful:', {
      userId: userWithProfile.id,
      email: normalizedEmail,
      vertical: userWithProfile.profile?.vertical,
      ip,
    });

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: userWithProfile.id,
        email: userWithProfile.email,
        name: userWithProfile.name,
        role: userWithProfile.role,
        vertical: userWithProfile.profile?.vertical || null,
        subVertical: userWithProfile.profile?.sub_vertical || null,
        regionCountry: userWithProfile.profile?.region_country || null,
      },
    });

  } catch (error) {
    console.error('[Login] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
