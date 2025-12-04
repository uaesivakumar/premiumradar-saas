'use client';

/**
 * Super Admin Layout
 *
 * World-class admin panel with:
 * - Left sidebar navigation (always visible)
 * - Session info header
 * - All admin modules accessible
 */

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Building2,
  Settings,
  Database,
  Activity,
  Shield,
  FileText,
  Bell,
  Plug,
  TestTube,
  LogOut,
  ChevronRight,
  Clock,
  AlertCircle,
  Loader2,
  UserCog,
  Layers,
  Zap,
  BarChart3,
  Globe,
} from 'lucide-react';

interface SessionInfo {
  email: string;
  remainingMinutes: number;
}

const navSections = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/superadmin', icon: LayoutDashboard },
      { label: 'Activity Feed', href: '/superadmin/activity', icon: Activity },
      { label: 'System Health', href: '/superadmin/health', icon: Zap },
    ]
  },
  {
    title: 'Users & Access',
    items: [
      { label: 'All Users', href: '/superadmin/users', icon: Users },
      { label: 'Demo Users', href: '/superadmin/users/demo', icon: TestTube },
      { label: 'Roles & Permissions', href: '/superadmin/roles', icon: UserCog },
      { label: 'Access Logs', href: '/superadmin/logs', icon: FileText },
    ]
  },
  {
    title: 'Tenants & Workspaces',
    items: [
      { label: 'All Tenants', href: '/superadmin/tenants', icon: Building2 },
      { label: 'Workspaces', href: '/superadmin/workspaces', icon: Layers },
      { label: 'Subscriptions', href: '/superadmin/billing', icon: BarChart3 },
    ]
  },
  {
    title: 'Configuration',
    items: [
      { label: 'Verticals & Personas', href: '/superadmin/verticals', icon: Globe },
      { label: 'API Integrations', href: '/superadmin/integrations', icon: Plug },
      { label: 'Feature Flags', href: '/superadmin/flags', icon: Shield },
      { label: 'System Settings', href: '/superadmin/settings', icon: Settings },
    ]
  },
  {
    title: 'Data & Reports',
    items: [
      { label: 'Database', href: '/superadmin/database', icon: Database },
      { label: 'Reports', href: '/superadmin/reports', icon: FileText },
      { label: 'Notifications', href: '/superadmin/notifications', icon: Bell },
    ]
  },
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

  // Check if this is the login page
  const isLoginPage = pathname === '/superadmin/login';

  // Verify session on mount (skip for login page)
  useEffect(() => {
    // Skip session verification for login page
    if (isLoginPage) {
      setIsLoading(false);
      return;
    }

    async function verifySession() {
      try {
        const response = await fetch('/api/superadmin/session');
        const data = await response.json();

        if (data.valid) {
          setSession({
            email: data.session.email,
            remainingMinutes: data.session.remainingMinutes
          });
        } else {
          // Invalid session - redirect to login
          router.push('/superadmin/login');
        }
      } catch (error) {
        router.push('/superadmin/login');
      } finally {
        setIsLoading(false);
      }
    }

    verifySession();

    // Refresh session info every minute
    const interval = setInterval(verifySession, 60000);
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

  // For login page, render children directly without admin layout
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Show loading state while verifying session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-gray-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Verifying session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col fixed h-full">
        {/* Logo */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white">Super Admin</h1>
              <p className="text-xs text-gray-500">PremiumRadar</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {navSections.map((section) => (
            <div key={section.title} className="mb-6">
              <h2 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {section.title}
              </h2>
              <div className="space-y-1 px-2">
                {section.items.map((item) => {
                  const isActive = pathname === item.href ||
                    (item.href !== '/superadmin' && pathname?.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                        isActive
                          ? 'bg-blue-600/20 text-blue-400'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{item.label}</span>
                      {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Session Info & Logout */}
        <div className="p-4 border-t border-gray-800">
          {session && (
            <div className="mb-3 p-3 bg-gray-800/50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Logged in as</p>
              <p className="text-sm text-gray-300 truncate">{session.email}</p>
              <div className="flex items-center gap-1 mt-2">
                <Clock className="w-3 h-3 text-gray-500" />
                <span className={`text-xs ${
                  session.remainingMinutes < 30 ? 'text-yellow-500' : 'text-gray-500'
                }`}>
                  {session.remainingMinutes} min remaining
                </span>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-lg transition-colors"
          >
            {isLoggingOut ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        {/* Top Bar */}
        <div className="bg-gray-900/50 border-b border-gray-800 px-6 py-4 sticky top-0 z-10 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Super Admin</span>
              {pathname && pathname !== '/superadmin' && (
                <>
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                  <span className="text-gray-300">
                    {pathname.split('/').pop()?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </>
              )}
            </div>

            {/* Session Warning */}
            {session && session.remainingMinutes < 30 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                <span className="text-xs text-yellow-500">
                  Session expires in {session.remainingMinutes} minutes
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
