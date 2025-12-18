'use client';

/**
 * Super Admin OS Config Dashboard
 *
 * Main dashboard for managing all UPR OS configurations:
 * - LLM Providers & Models (S51)
 * - API Providers (S50)
 * - Verticals (S52)
 * - Territories (S53)
 * - System Config (S55)
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Brain,
  Plug,
  Building2,
  Globe,
  Settings,
  Activity,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Loader2,
  Server,
  TrendingUp,
  DollarSign,
  Zap,
  Search,
} from 'lucide-react';

interface OSStatus {
  llm: {
    total_providers: number;
    status: string;
  } | null;
  providers: {
    total: number;
    byStatus: Record<string, number>;
  } | null;
  verticals: {
    total: number;
    active: number;
  } | null;
  territories: {
    count: number;
  } | null;
}

const OS_SECTIONS = [
  {
    id: 'llm',
    title: 'LLM Engine',
    description: 'Model routing, fallback chains, cost tracking',
    icon: Brain,
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/20',
    href: '/superadmin/os/llm',
    sprint: 'S51',
  },
  {
    id: 'providers',
    title: 'API Providers',
    description: 'Apollo, SERP, OpenAI, and other APIs',
    icon: Plug,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    href: '/superadmin/os/providers',
    sprint: 'S50',
  },
  {
    id: 'verticals',
    title: 'Vertical Packs',
    description: 'Banking, Insurance signals and personas',
    icon: Building2,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    href: '/superadmin/os/verticals',
    sprint: 'S52',
  },
  {
    id: 'territories',
    title: 'Territories',
    description: 'Regional hierarchy and assignments',
    icon: Globe,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    href: '/superadmin/os/territories',
    sprint: 'S53',
  },
  {
    id: 'config',
    title: 'System Config',
    description: 'OS kernel configuration with versioning',
    icon: Settings,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
    href: '/superadmin/os/config',
    sprint: 'S55',
  },
  {
    id: 'discovery',
    title: 'Discovery Templates',
    description: 'Live discovery search queries per vertical/region',
    icon: Search,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/20',
    href: '/superadmin/os/discovery-templates',
    sprint: 'S77',
  },
];

export default function OSConfigDashboard() {
  const [status, setStatus] = useState<OSStatus>({
    llm: null,
    providers: null,
    verticals: null,
    territories: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [osHealth, setOsHealth] = useState<'healthy' | 'degraded' | 'error' | 'loading'>('loading');

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch status from all OS endpoints in parallel
      const [llmRes, providersRes, verticalsRes, territoriesRes] = await Promise.allSettled([
        fetch('/api/superadmin/os/llm?action=health&check_providers=true'),
        fetch('/api/superadmin/os/providers?action=dashboard'),
        fetch('/api/superadmin/os/verticals?action=dashboard'),
        fetch('/api/superadmin/os/territories'),
      ]);

      let healthyCount = 0;
      const newStatus: OSStatus = {
        llm: null,
        providers: null,
        verticals: null,
        territories: null,
      };

      // Process LLM status
      if (llmRes.status === 'fulfilled' && llmRes.value.ok) {
        const data = await llmRes.value.json();
        if (data.success && data.data) {
          newStatus.llm = {
            total_providers: data.data.providers?.length || 0,
            status: data.data.status || 'unknown',
          };
          healthyCount++;
        }
      }

      // Process Providers status
      if (providersRes.status === 'fulfilled' && providersRes.value.ok) {
        const data = await providersRes.value.json();
        if (data.success && data.data) {
          newStatus.providers = {
            total: data.data.summary?.total || 0,
            byStatus: data.data.summary?.byStatus || {},
          };
          healthyCount++;
        }
      }

      // Process Verticals status
      if (verticalsRes.status === 'fulfilled' && verticalsRes.value.ok) {
        const data = await verticalsRes.value.json();
        if (data.success && data.data) {
          newStatus.verticals = {
            total: data.data.summary?.total || 0,
            active: data.data.summary?.active || 0,
          };
          healthyCount++;
        }
      }

      // Process Territories status
      if (territoriesRes.status === 'fulfilled' && territoriesRes.value.ok) {
        const data = await territoriesRes.value.json();
        if (data.success) {
          newStatus.territories = {
            count: data.data?.length || 0,
          };
          healthyCount++;
        }
      }

      setStatus(newStatus);
      setOsHealth(healthyCount >= 3 ? 'healthy' : healthyCount >= 1 ? 'degraded' : 'error');
    } catch (err) {
      console.error('Failed to fetch OS status:', err);
      setError('Failed to connect to UPR OS');
      setOsHealth('error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const getHealthBadge = () => {
    switch (osHealth) {
      case 'healthy':
        return (
          <span className="flex items-center gap-1 text-emerald-400 text-xs">
            <CheckCircle className="w-3.5 h-3.5" />
            Operational
          </span>
        );
      case 'degraded':
        return (
          <span className="flex items-center gap-1 text-amber-400 text-xs">
            <AlertCircle className="w-3.5 h-3.5" />
            Partial
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1 text-red-400 text-xs">
            <AlertCircle className="w-3.5 h-3.5" />
            Issues
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-neutral-500 text-xs">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Checking
          </span>
        );
    }
  };

  const getSectionStats = (section: typeof OS_SECTIONS[0]) => {
    switch (section.id) {
      case 'llm':
        return status.llm ? `${status.llm.total_providers} providers` : 'Loading...';
      case 'providers':
        return status.providers ? `${status.providers.total} APIs` : 'Loading...';
      case 'verticals':
        return status.verticals ? `${status.verticals.active}/${status.verticals.total} active` : 'Loading...';
      case 'territories':
        return status.territories ? `${status.territories.count} regions` : 'Loading...';
      case 'config':
        return 'Namespaced configs';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-400" />
            OS Configuration
          </h1>
          <p className="text-neutral-500 text-sm mt-0.5">
            LLM routing, API providers, verticals, territories
          </p>
        </div>
        <div className="flex items-center gap-3">
          {getHealthBadge()}
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm rounded transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <div className="flex-1">
            <span className="text-red-400 text-sm">{error}</span>
            <p className="text-red-400/70 text-xs mt-0.5">Check UPR OS is running</p>
          </div>
        </div>
      )}

      {/* OS URL Info */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <div>
              <p className="text-sm text-white font-medium">UPR OS</p>
              <p className="text-neutral-600 text-xs font-mono">
                {process.env.NEXT_PUBLIC_UPR_OS_URL || 'https://upr-os-service-191599223867.us-central1.run.app'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="text-center">
              <p className="text-neutral-600">Sprints</p>
              <p className="text-white font-medium">S50-S55</p>
            </div>
            <div className="text-center">
              <p className="text-neutral-600">Configs</p>
              <p className="text-white font-medium">180+</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {OS_SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.id}
              href={section.href}
              className={`group p-4 bg-neutral-900/50 border border-neutral-800 rounded-lg hover:bg-neutral-800/50 transition-all`}
            >
              <div className="flex items-start justify-between mb-2">
                <Icon className={`w-4 h-4 ${section.color}`} />
                <span className="text-[10px] font-mono text-neutral-600">{section.sprint}</span>
              </div>
              <h3 className="text-sm font-medium text-white mb-0.5 group-hover:text-blue-400 transition-colors">
                {section.title}
              </h3>
              <p className="text-neutral-500 text-xs mb-2">{section.description}</p>
              <p className={`text-xs ${section.color}`}>{getSectionStats(section)}</p>
            </Link>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-4 h-4 text-pink-400" />
            <p className="text-neutral-500 text-xs">LLM Models</p>
          </div>
          <p className="text-xl font-semibold text-white">
            {status.llm?.total_providers || '-'}
          </p>
        </div>
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Plug className="w-4 h-4 text-purple-400" />
            <p className="text-neutral-500 text-xs">API Providers</p>
          </div>
          <p className="text-xl font-semibold text-white">
            {status.providers?.total || '-'}
          </p>
        </div>
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-blue-400" />
            <p className="text-neutral-500 text-xs">Verticals</p>
          </div>
          <p className="text-xl font-semibold text-white">
            {status.verticals?.active || '-'}
          </p>
        </div>
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-4 h-4 text-emerald-400" />
            <p className="text-neutral-500 text-xs">Territories</p>
          </div>
          <p className="text-xl font-semibold text-white">
            {status.territories?.count || '-'}
          </p>
        </div>
      </div>

      {/* Architecture Note */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4">
        <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-amber-400" />
          Architecture
        </h3>
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div>
            <p className="text-neutral-500 mb-1">Source of Truth</p>
            <p className="text-neutral-300">UPR OS PostgreSQL with versioning</p>
          </div>
          <div>
            <p className="text-neutral-500 mb-1">Hot Reload</p>
            <p className="text-neutral-300">Cached configs, no restart needed</p>
          </div>
          <div>
            <p className="text-neutral-500 mb-1">API Integration</p>
            <p className="text-neutral-300">SaaS calls OS APIs, no duplication</p>
          </div>
        </div>
      </div>
    </div>
  );
}
