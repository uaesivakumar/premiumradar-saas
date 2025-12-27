/**
 * Enhanced Session Service - Sprint S141.3
 *
 * JWT session management with full payload including:
 * - user_id, tenant_id, role
 * - mfa_verified
 * - plan, subscription_status
 *
 * Session lifetime: 1 hour access, refresh on activity, force re-login after 7 days.
 */

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { UserRole, EnhancedSessionPayload, PlanType, SubscriptionStatus } from '../rbac/types';

// ============================================================
// CONFIGURATION
// ============================================================

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default-secret-change-in-production'
);
const JWT_ALGORITHM = 'HS256';
const ACCESS_TOKEN_EXPIRY = '1h'; // 1 hour
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days
const SESSION_COOKIE = 'pr_session';
const REFRESH_COOKIE = 'pr_refresh';

// ============================================================
// TYPES
// ============================================================

export interface CreateSessionInput {
  userId: string;
  email: string;
  name?: string;

  // Enterprise (new - spec v1.1)
  // Either enterpriseId or tenantId must be provided
  enterpriseId?: string;
  enterpriseName?: string;
  workspaceId?: string;
  workspaceName?: string;

  // Legacy tenant fields (for backward compatibility)
  // Either tenantId or enterpriseId must be provided
  /** @deprecated Use enterpriseId instead */
  tenantId?: string;
  /** @deprecated Use enterpriseName instead */
  tenantName?: string;

  role: UserRole;

  // Demo flags (new - spec v1.1)
  isDemo?: boolean;
  demoType?: 'SYSTEM' | 'ENTERPRISE';
  demoExpiresAt?: string;

  mfaEnabled: boolean;
  mfaVerified: boolean;
  plan: PlanType;
  subscriptionStatus: SubscriptionStatus;
  ipAddress?: string;
  userAgent?: string;
}

export interface SessionResult {
  success: boolean;
  session?: EnhancedSessionPayload;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}

export interface SuspiciousLoginEvent {
  userId: string;
  type: 'new_ip' | 'new_user_agent' | 'new_region';
  previousValue?: string;
  newValue: string;
  timestamp: string;
}

// In-memory store for suspicious login events (use database in production)
const suspiciousLoginEvents: SuspiciousLoginEvent[] = [];
const lastLoginInfo = new Map<string, { ip?: string; userAgent?: string; region?: string }>();

// ============================================================
// SESSION CREATION
// ============================================================

/**
 * Create enhanced session with full JWT payload
 */
export async function createSession(input: CreateSessionInput): Promise<SessionResult> {
  const now = Math.floor(Date.now() / 1000);
  // MFA required for admin roles (both legacy and new)
  const mfaRequired = input.role === 'SUPER_ADMIN' ||
    input.role === 'TENANT_ADMIN' ||
    input.role === 'ENTERPRISE_ADMIN';

  // Resolve enterprise ID (prefer new field, fallback to legacy)
  const enterpriseId = input.enterpriseId || input.tenantId || '';
  const enterpriseName = input.enterpriseName || input.tenantName;

  const payload: EnhancedSessionPayload = {
    user_id: input.userId,
    email: input.email,
    name: input.name,

    // Enterprise fields (new)
    enterprise_id: enterpriseId,
    enterprise_name: enterpriseName,
    workspace_id: input.workspaceId,
    workspace_name: input.workspaceName,

    // Tenant fields (legacy - for backward compatibility)
    tenant_id: enterpriseId,  // Mirror enterprise_id for backward compat
    tenant_name: enterpriseName,

    role: input.role,

    // Demo flags
    is_demo: input.isDemo,
    demo_type: input.demoType,
    demo_expires_at: input.demoExpiresAt,

    mfa_enabled: input.mfaEnabled,
    mfa_verified: input.mfaVerified,
    mfa_required: mfaRequired,
    plan: input.plan,
    subscription_status: input.subscriptionStatus,
    iat: now,
    exp: now + 3600, // 1 hour
    last_activity: now,
    ip_address: input.ipAddress,
    user_agent: input.userAgent,
  };

  // Log suspicious login if needed
  checkSuspiciousLogin(input);

  try {
    // Create access token
    const accessToken = await new SignJWT(payload as unknown as Record<string, unknown>)
      .setProtectedHeader({ alg: JWT_ALGORITHM })
      .setIssuedAt()
      .setExpirationTime(ACCESS_TOKEN_EXPIRY)
      .sign(JWT_SECRET);

    // Create refresh token (longer lived, minimal payload)
    const refreshPayload = {
      user_id: input.userId,
      enterprise_id: enterpriseId,
      tenant_id: enterpriseId,  // Legacy field for backward compat
      type: 'refresh',
    };

    const refreshToken = await new SignJWT(refreshPayload)
      .setProtectedHeader({ alg: JWT_ALGORITHM })
      .setIssuedAt()
      .setExpirationTime(REFRESH_TOKEN_EXPIRY)
      .sign(JWT_SECRET);

    return {
      success: true,
      session: payload,
      accessToken,
      refreshToken,
    };
  } catch (error) {
    console.error('Session creation error:', error);
    return {
      success: false,
      error: 'Failed to create session',
    };
  }
}

// ============================================================
// SESSION VERIFICATION
// ============================================================

/**
 * Verify and decode session token
 */
export async function verifySession(token: string): Promise<SessionResult> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM],
    });

    const session = payload as unknown as EnhancedSessionPayload;

    return {
      success: true,
      session,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Invalid session: ${errorMessage}`,
    };
  }
}

/**
 * Get session from cookies
 */
export async function getSessionFromCookies(): Promise<SessionResult> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);

  if (!sessionCookie) {
    return {
      success: false,
      error: 'No session cookie found',
    };
  }

  return verifySession(sessionCookie.value);
}

// ============================================================
// SESSION REFRESH
// ============================================================

/**
 * Refresh session using refresh token
 */
export async function refreshSession(
  refreshToken: string,
  getCurrentUserData: (userId: string) => Promise<CreateSessionInput | null>
): Promise<SessionResult> {
  try {
    // Verify refresh token
    const { payload } = await jwtVerify(refreshToken, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM],
    });

    const refreshPayload = payload as { user_id: string; tenant_id: string; type: string };

    if (refreshPayload.type !== 'refresh') {
      return { success: false, error: 'Invalid refresh token type' };
    }

    // Get current user data to create fresh session
    const userData = await getCurrentUserData(refreshPayload.user_id);

    if (!userData) {
      return { success: false, error: 'User not found' };
    }

    // Create new session
    return createSession(userData);
  } catch (error) {
    return {
      success: false,
      error: 'Invalid or expired refresh token',
    };
  }
}

// ============================================================
// SESSION UPDATE
// ============================================================

/**
 * Update session after MFA verification
 */
export async function updateSessionMFA(
  currentToken: string,
  mfaVerified: boolean
): Promise<SessionResult> {
  const result = await verifySession(currentToken);

  if (!result.success || !result.session) {
    return result;
  }

  // Create new session with MFA status updated
  const sessionInput: CreateSessionInput = {
    userId: result.session.user_id,
    email: result.session.email,
    name: result.session.name,
    // Enterprise fields (new)
    enterpriseId: result.session.enterprise_id || result.session.tenant_id,
    enterpriseName: result.session.enterprise_name || result.session.tenant_name,
    workspaceId: result.session.workspace_id,
    workspaceName: result.session.workspace_name,
    role: result.session.role,
    // Demo flags
    isDemo: result.session.is_demo,
    demoType: result.session.demo_type,
    demoExpiresAt: result.session.demo_expires_at,
    mfaEnabled: result.session.mfa_enabled,
    mfaVerified,
    plan: result.session.plan,
    subscriptionStatus: result.session.subscription_status,
    ipAddress: result.session.ip_address,
    userAgent: result.session.user_agent,
  };

  return createSession(sessionInput);
}

/**
 * Update session after subscription change
 */
export async function updateSessionSubscription(
  currentToken: string,
  plan: PlanType,
  status: SubscriptionStatus
): Promise<SessionResult> {
  const result = await verifySession(currentToken);

  if (!result.success || !result.session) {
    return result;
  }

  const sessionInput: CreateSessionInput = {
    userId: result.session.user_id,
    email: result.session.email,
    name: result.session.name,
    // Enterprise fields (new)
    enterpriseId: result.session.enterprise_id || result.session.tenant_id,
    enterpriseName: result.session.enterprise_name || result.session.tenant_name,
    workspaceId: result.session.workspace_id,
    workspaceName: result.session.workspace_name,
    role: result.session.role,
    // Demo flags
    isDemo: result.session.is_demo,
    demoType: result.session.demo_type,
    demoExpiresAt: result.session.demo_expires_at,
    mfaEnabled: result.session.mfa_enabled,
    mfaVerified: result.session.mfa_verified,
    plan,
    subscriptionStatus: status,
    ipAddress: result.session.ip_address,
    userAgent: result.session.user_agent,
  };

  return createSession(sessionInput);
}

// ============================================================
// SUSPICIOUS LOGIN DETECTION
// ============================================================

/**
 * Check for suspicious login activity
 */
function checkSuspiciousLogin(input: CreateSessionInput): void {
  const lastLogin = lastLoginInfo.get(input.userId);

  if (!lastLogin) {
    // First login, store info
    lastLoginInfo.set(input.userId, {
      ip: input.ipAddress,
      userAgent: input.userAgent,
    });
    return;
  }

  // Check for IP change
  if (input.ipAddress && lastLogin.ip && input.ipAddress !== lastLogin.ip) {
    logSuspiciousEvent({
      userId: input.userId,
      type: 'new_ip',
      previousValue: lastLogin.ip,
      newValue: input.ipAddress,
      timestamp: new Date().toISOString(),
    });
  }

  // Check for user agent change
  if (input.userAgent && lastLogin.userAgent && input.userAgent !== lastLogin.userAgent) {
    logSuspiciousEvent({
      userId: input.userId,
      type: 'new_user_agent',
      previousValue: lastLogin.userAgent,
      newValue: input.userAgent,
      timestamp: new Date().toISOString(),
    });
  }

  // Update last login info
  lastLoginInfo.set(input.userId, {
    ip: input.ipAddress,
    userAgent: input.userAgent,
  });
}

/**
 * Log suspicious login event
 */
function logSuspiciousEvent(event: SuspiciousLoginEvent): void {
  suspiciousLoginEvents.push(event);
  console.warn('[SECURITY] Suspicious login detected:', event);

  // In production, send to security monitoring service
}

/**
 * Get suspicious login events for user
 */
export function getSuspiciousEvents(
  userId?: string,
  limit: number = 100
): SuspiciousLoginEvent[] {
  let events = [...suspiciousLoginEvents];

  if (userId) {
    events = events.filter((e) => e.userId === userId);
  }

  return events.slice(-limit);
}

// ============================================================
// COOKIE MANAGEMENT
// ============================================================

/**
 * Set session cookies
 */
export async function setSessionCookies(
  accessToken: string,
  refreshToken: string
): Promise<void> {
  const cookieStore = await cookies();

  // Access token cookie
  cookieStore.set(SESSION_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 3600, // 1 hour
    path: '/',
  });

  // Refresh token cookie
  cookieStore.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 3600, // 7 days
    path: '/',
  });
}

/**
 * Clear session cookies
 */
export async function clearSessionCookies(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
}

export default {
  createSession,
  verifySession,
  getSessionFromCookies,
  refreshSession,
  updateSessionMFA,
  updateSessionSubscription,
  getSuspiciousEvents,
  setSessionCookies,
  clearSessionCookies,
};
