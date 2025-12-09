/**
 * Middleware - Sprint S141 + S142 (Auth Hardening + Billing Enforcement)
 *
 * Route protection with:
 * - MFA enforcement for SUPER_ADMIN + TENANT_ADMIN
 * - RBAC enforcement at route level
 * - Subscription enforcement for premium routes
 * - Tenant isolation
 *
 * Rules:
 * - Unauthenticated users → redirect to /login
 * - MFA required but not verified → redirect to /mfa-required
 * - Subscription required but inactive → redirect to /pricing
 * - Insufficient role → redirect to /dashboard
 * - /superadmin/* → requires SUPER_ADMIN + MFA
 * - /dashboard/admin/* → hidden (404)
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// ============================================================
// TYPES (Edge-compatible, no imports from lib)
// ============================================================

type UserRole = 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'TENANT_USER' | 'READ_ONLY';
type PlanType = 'free' | 'starter' | 'professional' | 'enterprise';
type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';

interface SessionPayload {
  user_id: string;
  tenant_id: string;
  role: UserRole;
  mfa_enabled: boolean;
  mfa_verified: boolean;
  mfa_required: boolean;
  plan: PlanType;
  subscription_status: SubscriptionStatus;
}

// ============================================================
// CONFIGURATION
// ============================================================

const SESSION_COOKIE = 'pr_session';
const SUPER_ADMIN_COOKIE = 'pr_superadmin_session';
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default-secret-change-in-production'
);

// Routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/onboarding'];

// Routes that should redirect authenticated users
const AUTH_ROUTES = ['/login', '/signup', '/register'];

// Public routes
const PUBLIC_ROUTES = ['/', '/pricing', '/docs', '/legal', '/api', '/mfa-required'];

// Premium routes requiring active subscription
const PREMIUM_ROUTES: { path: string; allowedPlans: PlanType[] }[] = [
  { path: '/dashboard/intelligence', allowedPlans: ['starter', 'professional', 'enterprise'] },
  { path: '/dashboard/discovery', allowedPlans: ['professional', 'enterprise'] },
  { path: '/dashboard/siva', allowedPlans: ['starter', 'professional', 'enterprise'] },
  { path: '/dashboard/enrichment', allowedPlans: ['professional', 'enterprise'] },
];

// Admin routes requiring TENANT_ADMIN+
const ADMIN_ROUTES = ['/dashboard/settings/team', '/dashboard/settings/billing'];

// Roles that require MFA
const MFA_REQUIRED_ROLES: UserRole[] = ['SUPER_ADMIN', 'TENANT_ADMIN'];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Parse session from JWT cookie (Edge-compatible)
 */
async function getSessionFromCookie(
  request: NextRequest
): Promise<SessionPayload | null> {
  const sessionCookie = request.cookies.get(SESSION_COOKIE);

  if (!sessionCookie) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(sessionCookie.value, JWT_SECRET, {
      algorithms: ['HS256'],
    });

    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Check if path matches premium route
 */
function getPremiumRouteConfig(
  pathname: string
): { path: string; allowedPlans: PlanType[] } | null {
  for (const route of PREMIUM_ROUTES) {
    if (pathname.startsWith(route.path)) {
      return route;
    }
  }
  return null;
}

/**
 * Check if subscription allows access
 */
function canAccessPremiumRoute(
  session: SessionPayload,
  allowedPlans: PlanType[]
): boolean {
  // Check subscription status
  if (session.subscription_status !== 'active' && session.subscription_status !== 'trialing') {
    return false;
  }

  // Check plan
  return allowedPlans.includes(session.plan);
}

/**
 * Check if MFA is required and verified
 */
function checkMFACompliance(session: SessionPayload): boolean {
  // MFA required for privileged roles
  if (MFA_REQUIRED_ROLES.includes(session.role)) {
    return session.mfa_verified;
  }

  // MFA not required for other roles
  return true;
}

/**
 * Get onboarding path from step
 */
function getOnboardingPath(step: string): string {
  switch (step) {
    case 'welcome':
      return '/onboarding/welcome';
    case 'identity':
      return '/onboarding/welcome?step=identity';
    case 'workspace':
      return '/onboarding/workspace';
    case 'vertical':
      return '/onboarding/vertical';
    case 'transition':
      return '/onboarding/transition';
    default:
      return '/onboarding/welcome';
  }
}

// ============================================================
// MAIN MIDDLEWARE
// ============================================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes and static files
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // ==========================================================================
  // SUPER ADMIN PROTECTION (CRITICAL SECURITY)
  // ==========================================================================

  // Block access to old /dashboard/admin routes - return 404
  if (pathname.startsWith('/dashboard/admin')) {
    return NextResponse.rewrite(new URL('/404', request.url));
  }

  // Protect /superadmin routes (except login page)
  if (pathname.startsWith('/superadmin') && pathname !== '/superadmin/login') {
    const sessionCookie = request.cookies.get(SUPER_ADMIN_COOKIE);

    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/superadmin/login', request.url));
    }

    // Session exists - let the page verify it
    return NextResponse.next();
  }

  // ==========================================================================
  // SESSION-BASED PROTECTION (S141 + S142)
  // ==========================================================================

  // Get session
  const session = await getSessionFromCookie(request);

  // ==========================================================================
  // PREMIUM ROUTE ENFORCEMENT (S142.4)
  // ==========================================================================

  const premiumConfig = getPremiumRouteConfig(pathname);
  if (premiumConfig && session) {
    // Check subscription status
    if (!canAccessPremiumRoute(session, premiumConfig.allowedPlans)) {
      // Redirect to pricing page
      const redirectUrl = new URL('/pricing', request.url);
      redirectUrl.searchParams.set('upgrade', 'required');
      redirectUrl.searchParams.set('feature', pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // ==========================================================================
  // MFA ENFORCEMENT (S141)
  // ==========================================================================

  if (session && !checkMFACompliance(session)) {
    // MFA required but not verified - redirect to MFA page
    // Allow MFA page itself
    if (pathname !== '/mfa-required' && pathname !== '/mfa-verify') {
      return NextResponse.redirect(new URL('/mfa-required', request.url));
    }
  }

  // ==========================================================================
  // ADMIN ROUTE PROTECTION
  // ==========================================================================

  if (ADMIN_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Only TENANT_ADMIN and SUPER_ADMIN can access
    if (session.role !== 'TENANT_ADMIN' && session.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // ==========================================================================
  // SUBSCRIPTION STATUS ENFORCEMENT (S142)
  // ==========================================================================

  if (session && pathname.startsWith('/dashboard')) {
    // Block access if subscription is past_due or canceled
    if (session.subscription_status === 'past_due') {
      // Allow billing page for past_due users to update payment
      if (!pathname.startsWith('/dashboard/settings/billing')) {
        const redirectUrl = new URL('/dashboard/settings/billing', request.url);
        redirectUrl.searchParams.set('status', 'past_due');
        return NextResponse.redirect(redirectUrl);
      }
    }

    if (session.subscription_status === 'canceled') {
      // Redirect to pricing to reactivate
      const redirectUrl = new URL('/pricing', request.url);
      redirectUrl.searchParams.set('reactivate', 'true');
      return NextResponse.redirect(redirectUrl);
    }
  }

  // ==========================================================================
  // ONBOARDING ENFORCEMENT (Legacy)
  // ==========================================================================

  const onboardingCookie = request.cookies.get('premiumradar-onboarding');
  let onboardingState = null;

  if (onboardingCookie) {
    try {
      onboardingState = JSON.parse(onboardingCookie.value);
    } catch {
      // Invalid cookie, ignore
    }
  }

  const isOnboardingComplete = onboardingState?.isComplete === true;

  // Handle protected dashboard routes
  if (pathname.startsWith('/dashboard')) {
    // Check if onboarding is complete (if user has started onboarding)
    if (onboardingState && !isOnboardingComplete && onboardingState.startedAt) {
      const currentStep = onboardingState.currentStep || 'welcome';
      const stepPath = getOnboardingPath(currentStep);
      return NextResponse.redirect(new URL(stepPath, request.url));
    }

    return NextResponse.next();
  }

  // Handle onboarding routes
  if (pathname.startsWith('/onboarding')) {
    if (isOnboardingComplete) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Handle auth routes
  if (AUTH_ROUTES.some((route) => pathname === route)) {
    if (isOnboardingComplete) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Allow all other routes
  return NextResponse.next();
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
