/**
 * Middleware - Sprint S36 + S72 (Super Admin Security)
 * Route protection and onboarding enforcement
 *
 * Rules:
 * - Unauthenticated users → redirect to /login
 * - Incomplete onboarding → redirect to correct onboarding step
 * - Complete onboarding → allow dashboard access
 * - /superadmin/* → requires Super Admin session (founder-only)
 * - /dashboard/admin/* → redirect to /superadmin (hidden)
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/onboarding'];

// Routes that should redirect authenticated users
const AUTH_ROUTES = ['/login', '/signup', '/register'];

// Onboarding steps in order
const ONBOARDING_STEPS = ['welcome', 'identity', 'workspace', 'vertical', 'transition'];

// Public routes that don't require any authentication
const PUBLIC_ROUTES = ['/', '/pricing', '/docs', '/legal', '/api'];

// Super Admin session cookie name
const SUPER_ADMIN_COOKIE = 'pr_superadmin_session';

export function middleware(request: NextRequest) {
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

  // Block access to old /dashboard/admin routes - redirect to 404
  // This prevents hackers from even knowing admin exists
  if (pathname.startsWith('/dashboard/admin')) {
    // Return 404 to hide the existence of admin routes
    return NextResponse.rewrite(new URL('/404', request.url));
  }

  // Protect /superadmin routes (except login page)
  // Note: /superadmin/founder-bible is now protected by this block
  if (pathname.startsWith('/superadmin') && pathname !== '/superadmin/login') {
    const sessionCookie = request.cookies.get(SUPER_ADMIN_COOKIE);

    if (!sessionCookie) {
      // No session - redirect to super admin login
      return NextResponse.redirect(new URL('/superadmin/login', request.url));
    }

    // Session exists - let the page verify it (can't decrypt in edge middleware)
    // The page will handle session validation
    return NextResponse.next();
  }

  // Check for onboarding state from cookie (set by client-side store)
  const onboardingCookie = request.cookies.get('premiumradar-onboarding');
  let onboardingState = null;

  if (onboardingCookie) {
    try {
      onboardingState = JSON.parse(onboardingCookie.value);
    } catch {
      // Invalid cookie, ignore
    }
  }

  const isAuthenticated = onboardingState?.startedAt != null;
  const isOnboardingComplete = onboardingState?.isComplete === true;

  // Handle protected dashboard routes
  if (pathname.startsWith('/dashboard')) {
    // For now, allow access to dashboard (real auth will be added with NextAuth)
    // When auth is implemented, uncomment:
    // if (!isAuthenticated) {
    //   return NextResponse.redirect(new URL('/login', request.url));
    // }

    // Check if onboarding is complete (if user has started onboarding)
    if (onboardingState && !isOnboardingComplete && onboardingState.startedAt) {
      // Redirect to the correct onboarding step
      const currentStep = onboardingState.currentStep || 'welcome';
      const stepPath = getOnboardingPath(currentStep);
      return NextResponse.redirect(new URL(stepPath, request.url));
    }

    return NextResponse.next();
  }

  // Handle onboarding routes
  if (pathname.startsWith('/onboarding')) {
    // Allow onboarding access
    // In the future, we can add step validation here to prevent skipping steps

    // If onboarding is complete, redirect to dashboard
    if (isOnboardingComplete) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
  }

  // Handle auth routes
  if (AUTH_ROUTES.some((route) => pathname === route)) {
    // If user has completed onboarding, redirect to dashboard
    if (isOnboardingComplete) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
  }

  // Allow all other routes
  return NextResponse.next();
}

/**
 * Get the correct path for an onboarding step
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
