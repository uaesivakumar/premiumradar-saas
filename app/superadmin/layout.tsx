'use client';

/**
 * Super Admin Layout - Professional Control Panel
 *
 * Design principles:
 * - Clean, minimal (Linear/Stripe inspired)
 * - Functional, not decorative
 * - Subtle colors, no gradients
 * - Professional credibility
 */

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutGrid,
  Users,
  Building2,
  Settings,
  Activity,
  LogOut,
  ChevronDown,
  AlertCircle,
  Loader2,
  Layers,
  Cpu,
  Server,
  Sparkles,
  DollarSign,
  Box,
  Shield,
  FlaskConical,
  Wand2,
} from 'lucide-react';
import AICommandBar from '@/components/superadmin/AICommandBar';

interface SessionInfo {
  email: string;
  remainingMinutes: number;
}

// Primary navigation items (always visible in top bar)
const primaryNavItems = [
  { label: 'Overview', href: '/superadmin', icon: LayoutGrid },
  { label: 'Command Center', href: '/superadmin/command-center', icon: Sparkles },
  { label: 'Intelligence', href: '/superadmin/siva', icon: Cpu },
  { label: 'Sales-Bench', href: '/superadmin/sales-bench', icon: FlaskConical },
  { label: 'Financials', href: '/superadmin/financials', icon: DollarSign },
];

// Platform dropdown items (Control Plane, Blueprints, OS Config)
const platformItems = [
  { label: 'Control Plane', href: '/superadmin/controlplane', icon: Shield, description: 'Monitor active stacks' },
  { label: 'CP Wizard', href: '/superadmin/controlplane/wizard', icon: Wand2, isMutation: true, description: 'Create & modify stacks' },
  { label: 'Blueprints', href: '/superadmin/verticals', icon: Layers, readOnly: true, description: 'Vertical templates' },
  { label: 'OS Config', href: '/superadmin/os', icon: Server, description: 'OS settings & routing' },
];

// Admin dropdown items (Users, Tenants, Settings)
const adminItems = [
  { label: 'Users', href: '/superadmin/users', icon: Users, description: 'User management' },
  { label: 'Tenants', href: '/superadmin/tenants', icon: Building2, description: 'Tenant accounts' },
  { label: 'Activity', href: '/superadmin/activity', icon: Activity, description: 'Audit logs' },
  { label: 'Settings', href: '/superadmin/settings', icon: Settings, description: 'System settings' },
];

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'platform' | 'admin' | null>(null);
  const navRef = useRef<HTMLElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setOpenDropdown(null);
  }, [pathname]);

  // Check if current path is within a dropdown group
  const isPlatformActive = platformItems.some(item =>
    pathname === item.href || (item.href !== '/superadmin' && pathname?.startsWith(item.href || ''))
  );
  const isAdminActive = adminItems.some(item =>
    pathname === item.href || (item.href !== '/superadmin' && pathname?.startsWith(item.href || ''))
  );

  const isLoginPage = pathname === '/superadmin/login';

  // Track if we've verified session at least once (don't logout on subsequent failures)
  const hasVerifiedOnce = useRef(false);

  useEffect(() => {
    if (isLoginPage) {
      setIsLoading(false);
      return;
    }

    async function verifySession(isInitial = false) {
      try {
        const response = await fetch('/api/superadmin/session');
        const data = await response.json();

        if (data.valid) {
          setSession({
            email: data.session.email,
            remainingMinutes: data.session.remainingMinutes
          });
          hasVerifiedOnce.current = true;
        } else {
          // Only redirect if session is explicitly invalid (not just network error)
          // AND this is the initial verification OR we've never verified successfully
          if (isInitial || !hasVerifiedOnce.current) {
            router.push('/superadmin/login');
          }
          // If we've verified once before, log the error but don't logout on interval check
          // This prevents logout due to transient network issues
        }
      } catch (error) {
        // Only redirect on initial load if we've never verified
        // Don't logout on transient network errors during interval checks
        if (isInitial && !hasVerifiedOnce.current) {
          router.push('/superadmin/login');
        }
        console.error('[SuperAdmin Layout] Session verification failed:', error);
      } finally {
        setIsLoading(false);
      }
    }

    verifySession(true); // Initial verification
    const interval = setInterval(() => verifySession(false), 60000);
    return () => clearInterval(interval);
  }, [router, isLoginPage]);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await fetch('/api/superadmin/auth', { method: 'DELETE' });
      router.push('/superadmin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-neutral-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-200">
      {/* Top Navigation Bar */}
      <header className="h-12 border-b border-neutral-800 flex items-center justify-between px-4 fixed top-0 left-0 right-0 bg-[#0a0a0a]/95 backdrop-blur-sm z-50">
        <div className="flex items-center gap-6">
          {/* Logo */}
          <Link href="/superadmin" className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
              <Box className="w-3.5 h-3.5 text-black" />
            </div>
            <span className="font-medium text-sm text-white">PremiumRadar</span>
          </Link>

          {/* Main Nav - Primary Items */}
          <nav ref={navRef} className="flex items-center gap-1">
            {primaryNavItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/superadmin' && pathname?.startsWith(item.href || ''));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-white text-black'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="w-px h-4 bg-neutral-800 mx-2" />

            {/* Platform Dropdown */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'platform' ? null : 'platform')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                  isPlatformActive
                    ? 'bg-white text-black'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Platform</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${openDropdown === 'platform' ? 'rotate-180' : ''}`} />
              </button>
              {openDropdown === 'platform' && (
                <div className="absolute top-full mt-1 left-0 w-56 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl overflow-hidden z-50">
                  {platformItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href ||
                      (item.href !== '/superadmin' && pathname?.startsWith(item.href || ''));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpenDropdown(null)}
                        className={`flex items-start gap-3 px-3 py-2.5 transition-colors ${
                          isActive
                            ? item.isMutation
                              ? 'bg-violet-600/20 text-violet-300'
                              : 'bg-neutral-800 text-white'
                            : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                        }`}
                      >
                        <Icon className={`w-4 h-4 mt-0.5 ${item.isMutation ? 'text-violet-400' : ''}`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium">{item.label}</span>
                            {item.isMutation && (
                              <span className="text-[9px] px-1 py-0.5 bg-violet-500/30 text-violet-300 rounded">WRITE</span>
                            )}
                            {item.readOnly && (
                              <span className="text-[9px] text-neutral-600">(R)</span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-500 mt-0.5">{item.description}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Admin Dropdown */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'admin' ? null : 'admin')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                  isAdminActive
                    ? 'bg-white text-black'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Admin</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${openDropdown === 'admin' ? 'rotate-180' : ''}`} />
              </button>
              {openDropdown === 'admin' && (
                <div className="absolute top-full mt-1 left-0 w-48 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl overflow-hidden z-50">
                  {adminItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href ||
                      (item.href !== '/superadmin' && pathname?.startsWith(item.href || ''));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpenDropdown(null)}
                        className={`flex items-start gap-3 px-3 py-2.5 transition-colors ${
                          isActive
                            ? 'bg-neutral-800 text-white'
                            : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                        }`}
                      >
                        <Icon className="w-4 h-4 mt-0.5" />
                        <div className="flex-1">
                          <span className="text-sm font-medium">{item.label}</span>
                          <p className="text-xs text-neutral-500 mt-0.5">{item.description}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {/* AI Command Bar */}
          <AICommandBar />

          {session && session.remainingMinutes < 30 && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-400">
              <AlertCircle className="w-3 h-3" />
              <span>{session.remainingMinutes}m left</span>
            </div>
          )}

          {session && (
            <span className="text-xs text-neutral-500">{session.email}</span>
          )}

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-1.5 px-2 py-1 text-xs text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
          >
            {isLoggingOut ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <LogOut className="w-3 h-3" />
            )}
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-12 min-h-screen">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
