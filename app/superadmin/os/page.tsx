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
          <span className="flex items-center gap-1.5 text-green-400">
            <CheckCircle className="w-4 h-4" />
            All Systems Operational
          </span>
        );
      case 'degraded':
        return (
          <span className="flex items-center gap-1.5 text-yellow-400">
            <AlertCircle className="w-4 h-4" />
            Partial Connectivity
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1.5 text-red-400">
            <AlertCircle className="w-4 h-4" />
            Connection Issues
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Checking...
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Server className="w-7 h-7 text-blue-400" />
            UPR OS Configuration
          </h1>
          <p className="text-gray-400 mt-1">
            Manage LLM routing, API providers, verticals, territories, and system config
          </p>
        </div>
        <div className="flex items-center gap-4">
          {getHealthBadge()}
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <div className="flex-1">
            <span className="text-red-400">{error}</span>
            <p className="text-red-400/70 text-sm mt-1">
              Make sure UPR OS is running and UPR_OS_URL is configured correctly.
            </p>
          </div>
        </div>
      )}

      {/* OS URL Info */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-white font-medium">Connected to UPR OS</p>
              <p className="text-gray-500 text-sm font-mono">
                {process.env.NEXT_PUBLIC_UPR_OS_URL || 'https://upr-os-service-191599223867.us-central1.run.app'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
              <p className="text-gray-500">Sprints</p>
              <p className="text-white font-medium">S50-S55</p>
            </div>
            <div className="text-center">
              <p className="text-gray-500">Configs</p>
              <p className="text-white font-medium">180+</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {OS_SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.id}
              href={section.href}
              className={`group p-6 ${section.bgColor} border ${section.borderColor} rounded-xl hover:scale-[1.02] transition-all`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${section.bgColor}`}>
                  <Icon className={`w-6 h-6 ${section.color}`} />
                </div>
                <span className="text-xs font-mono text-gray-500">{section.sprint}</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">
                {section.title}
              </h3>
              <p className="text-gray-400 text-sm mb-3">{section.description}</p>
              <p className={`text-sm ${section.color}`}>{getSectionStats(section)}</p>
            </Link>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="w-5 h-5 text-pink-400" />
            <p className="text-gray-500 text-sm">LLM Models</p>
          </div>
          <p className="text-2xl font-bold text-white">
            {status.llm?.total_providers || '-'}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Plug className="w-5 h-5 text-purple-400" />
            <p className="text-gray-500 text-sm">API Providers</p>
          </div>
          <p className="text-2xl font-bold text-white">
            {status.providers?.total || '-'}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            <p className="text-gray-500 text-sm">Active Verticals</p>
          </div>
          <p className="text-2xl font-bold text-white">
            {status.verticals?.active || '-'}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="w-5 h-5 text-green-400" />
            <p className="text-gray-500 text-sm">Territories</p>
          </div>
          <p className="text-2xl font-bold text-white">
            {status.territories?.count || '-'}
          </p>
        </div>
      </div>

      {/* Architecture Note */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          Architecture
        </h3>
        <div className="grid grid-cols-3 gap-6 text-sm">
          <div>
            <p className="text-gray-400 mb-2">Source of Truth</p>
            <p className="text-white">All configs stored in UPR OS PostgreSQL database with versioning and audit trails.</p>
          </div>
          <div>
            <p className="text-gray-400 mb-2">Hot Reload</p>
            <p className="text-white">Config changes are cached and can be hot-reloaded without restart.</p>
          </div>
          <div>
            <p className="text-gray-400 mb-2">API Integration</p>
            <p className="text-white">SaaS calls OS APIs for all config reads/writes. No duplication.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
