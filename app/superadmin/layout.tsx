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

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutGrid,
  Users,
  Building2,
  Settings,
  Database,
  Activity,
  FileText,
  Bell,
  Plug,
  LogOut,
  ChevronRight,
  AlertCircle,
  Loader2,
  Layers,
  BarChart2,
  Globe,
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

const navItems = [
  { label: 'Overview', href: '/superadmin', icon: LayoutGrid },
  { label: 'Command Center', href: '/superadmin/command-center', icon: Sparkles },
  { label: 'Intelligence', href: '/superadmin/siva', icon: Cpu },
  { label: 'Sales-Bench', href: '/superadmin/sales-bench', icon: FlaskConical },
  { label: 'Financials', href: '/superadmin/financials', icon: DollarSign },
  { type: 'divider' },
  // S274: Control Plane = read-only monitoring, Wizard = mutations
  { label: 'Control Plane', href: '/superadmin/controlplane', icon: Shield },
  { label: 'CP Wizard', href: '/superadmin/controlplane/wizard/new', icon: Wand2, isMutation: true },
  { label: 'Blueprints', href: '/superadmin/verticals', icon: Layers, readOnly: true },
  { label: 'OS Config', href: '/superadmin/os', icon: Server },
  { label: 'Settings', href: '/superadmin/settings', icon: Settings },
  { type: 'divider' },
  { label: 'Users', href: '/superadmin/users', icon: Users },
  { label: 'Tenants', href: '/superadmin/tenants', icon: Building2 },
  { label: 'Activity', href: '/superadmin/activity', icon: Activity },
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

  const isLoginPage = pathname === '/superadmin/login';

  useEffect(() => {
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
          router.push('/superadmin/login');
        }
      } catch {
        router.push('/superadmin/login');
      } finally {
        setIsLoading(false);
      }
    }

    verifySession();
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

          {/* Main Nav */}
          <nav className="flex items-center gap-1">
            {navItems.map((item, i) => {
              if (item.type === 'divider') {
                return <div key={i} className="w-px h-4 bg-neutral-800 mx-2" />;
              }

              const isActive = pathname === item.href ||
                (item.href !== '/superadmin' && pathname?.startsWith(item.href || ''));
              const Icon = item.icon;

              const isMutation = (item as { isMutation?: boolean }).isMutation;
              const isReadOnly = (item as { readOnly?: boolean }).readOnly;

              return (
                <Link
                  key={item.href}
                  href={item.href || '#'}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                    isActive
                      ? isMutation
                        ? 'bg-violet-600 text-white'
                        : 'bg-neutral-800 text-white'
                      : isMutation
                        ? 'text-violet-400 hover:text-violet-300 hover:bg-violet-500/20 border border-violet-500/30'
                        : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                  }`}
                  title={
                    isMutation
                      ? 'Create or modify vertical stacks'
                      : isReadOnly
                        ? 'Read-only view'
                        : undefined
                  }
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span>{item.label}</span>
                  {isReadOnly && (
                    <span className="text-[8px] text-neutral-600 ml-0.5">(R)</span>
                  )}
                </Link>
              );
            })}
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
