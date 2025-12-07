/**
 * AI-Powered Super Admin
 * Sprint 56: AI Super Admin
 *
 * Natural language command interface + Smart Dashboard
 * One interface to manage everything with AI assistance.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// Types
interface SystemStatus {
  apiProviders: { active: number; disabled: number; total: number; items: Array<{ slug: string; name: string; description: string }> };
  llmProviders: { active: number; disabled: number; total: number; items: Array<{ slug: string; name: string }> };
  verticalPacks: { active: number; disabled: number; total: number; items: Array<{ slug: string; name: string }> };
  territories: { active: number; disabled: number; total: number };
  configNamespaces: number;
  taskMappings: number;
}

interface Insight {
  type: 'info' | 'warning' | 'success' | 'error';
  category: string;
  title: string;
  message: string;
  action: string | null;
  command: string | null;
}

interface CommandResult {
  command: string;
  parsedAction: Record<string, unknown>;
  result: {
    message: string;
    [key: string]: unknown;
  };
}

interface SecretStatus {
  provider: string;
  secretName: string;
  configured: boolean;
  providerName: string;
  providerStatus: string;
}

const OS_URL = process.env.NEXT_PUBLIC_OS_URL || 'https://upr-os-service-191599223867.us-central1.run.app';

export default function AISuperAdminPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [secrets, setSecrets] = useState<SecretStatus[]>([]);
  const [command, setCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<CommandResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const commandInputRef = useRef<HTMLInputElement>(null);

  // Fetch system status
  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`${OS_URL}/api/os/ai-admin/status`);
      const data = await response.json();
      if (data.success) {
        setStatus(data.data.summary);
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
    }
  }, []);

  // Fetch insights
  const fetchInsights = useCallback(async () => {
    try {
      const response = await fetch(`${OS_URL}/api/os/ai-admin/insights`);
      const data = await response.json();
      if (data.success) {
        setInsights(data.data.insights);
      }
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    }
  }, []);

  // Fetch secrets status
  const fetchSecrets = useCallback(async () => {
    try {
      const response = await fetch(`${OS_URL}/api/os/ai-admin/secrets`);
      const data = await response.json();
      if (data.success) {
        setSecrets(data.data.secrets);
      }
    } catch (error) {
      console.error('Failed to fetch secrets:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchStatus(), fetchInsights(), fetchSecrets()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchStatus, fetchInsights, fetchSecrets]);

  // Execute command
  const executeCommand = async () => {
    if (!command.trim() || isExecuting) return;

    setIsExecuting(true);
    try {
      const response = await fetch(`${OS_URL}/api/os/ai-admin/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: command.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setCommandHistory(prev => [data.data, ...prev]);
        setCommand('');
        // Refresh status after command
        await fetchStatus();
        await fetchInsights();
      } else {
        setCommandHistory(prev => [{
          command: command.trim(),
          parsedAction: { action: 'error' },
          result: { message: data.error || 'Command failed' }
        }, ...prev]);
      }
    } catch (error) {
      setCommandHistory(prev => [{
        command: command.trim(),
        parsedAction: { action: 'error' },
        result: { message: 'Failed to connect to server' }
      }, ...prev]);
    } finally {
      setIsExecuting(false);
      commandInputRef.current?.focus();
    }
  };

  // Quick toggle
  const quickToggle = async (type: 'provider' | 'llm' | 'vertical', slug: string, currentEnabled: boolean) => {
    try {
      await fetch(`${OS_URL}/api/os/ai-admin/toggle/${type}/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentEnabled }),
      });
      await fetchStatus();
    } catch (error) {
      console.error('Toggle failed:', error);
    }
  };

  // Execute suggestion command
  const executeSuggestion = (cmd: string | null) => {
    if (cmd) {
      setCommand(cmd);
      commandInputRef.current?.focus();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">AI</div>
          <p className="text-slate-400">Loading AI Super Admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* AI Command Bar - The Main Interface */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="text-2xl">AI</div>
            <div className="flex-1 relative">
              <input
                ref={commandInputRef}
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && executeCommand()}
                placeholder='Try: "enable apollo", "disable openai", "show active providers", "status"'
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isExecuting}
              />
              {isExecuting && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="animate-spin text-blue-400">...</div>
                </div>
              )}
            </div>
            <button
              onClick={executeCommand}
              disabled={isExecuting || !command.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Execute
            </button>
          </div>

          {/* Quick Commands */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {['status', 'show active providers', 'show active llms', 'show verticals'].map((cmd) => (
              <button
                key={cmd}
                onClick={() => { setCommand(cmd); commandInputRef.current?.focus(); }}
                className="px-3 py-1 text-xs bg-slate-700 text-slate-300 rounded-full hover:bg-slate-600 transition-colors"
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Command History */}
        {commandHistory.length > 0 && (
          <div className="mb-6 bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
            <div className="px-4 py-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-300">Command History</h3>
              <button
                onClick={() => setCommandHistory([])}
                className="text-xs text-slate-500 hover:text-slate-300"
              >
                Clear
              </button>
            </div>
            <div className="divide-y divide-slate-700 max-h-64 overflow-y-auto">
              {commandHistory.map((result, i) => (
                <div key={i} className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    <span className="text-blue-400 font-mono">{'>'}</span>
                    <div className="flex-1">
                      <code className="text-white">{result.command}</code>
                      <p className="text-sm text-slate-400 mt-1">{result.result.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* API Providers Card */}
          <DashboardCard
            title="API Providers"
            icon="API"
            count={status?.apiProviders.active || 0}
            total={status?.apiProviders.total || 0}
            items={status?.apiProviders.items || []}
            onToggle={(slug, enabled) => quickToggle('provider', slug, enabled)}
            activeColor="green"
          />

          {/* LLM Providers Card */}
          <DashboardCard
            title="LLM Providers"
            icon="LLM"
            count={status?.llmProviders.active || 0}
            total={status?.llmProviders.total || 0}
            items={status?.llmProviders.items || []}
            onToggle={(slug, enabled) => quickToggle('llm', slug, enabled)}
            activeColor="purple"
          />

          {/* Verticals Card */}
          <DashboardCard
            title="Verticals"
            icon="VRT"
            count={status?.verticalPacks.active || 0}
            total={status?.verticalPacks.total || 0}
            items={status?.verticalPacks.items || []}
            onToggle={(slug, enabled) => quickToggle('vertical', slug, enabled)}
            activeColor="blue"
          />
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Territories" value={status?.territories.active || 0} total={status?.territories.total} />
          <StatCard label="Config Namespaces" value={status?.configNamespaces || 0} />
          <StatCard label="Task Mappings" value={status?.taskMappings || 0} />
          <StatCard label="System Health" value="OK" isText />
        </div>

        {/* API Keys / Secrets */}
        <div className="mb-6 bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
          <button
            onClick={() => setShowSecrets(!showSecrets)}
            className="w-full px-4 py-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
          >
            <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <span className="text-yellow-400">KEY</span> API Keys (GCP Secrets)
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">
                {secrets.filter(s => s.configured).length}/{secrets.length} configured
              </span>
              <span className={`transform transition-transform ${showSecrets ? 'rotate-180' : ''}`}>
                v
              </span>
            </div>
          </button>
          {showSecrets && (
            <div className="divide-y divide-slate-700/50">
              {secrets.map((secret) => (
                <div key={secret.secretName} className="px-4 py-3 flex items-center justify-between hover:bg-slate-700/30">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${secret.configured ? 'bg-green-500' : 'bg-red-500'}`} />
                      <p className="text-sm text-white">{secret.providerName}</p>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{secret.secretName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      secret.configured
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      {secret.configured ? 'Configured' : 'Missing'}
                    </span>
                  </div>
                </div>
              ))}
              {secrets.length === 0 && (
                <div className="px-4 py-6 text-center text-slate-500 text-sm">
                  No API keys configured
                </div>
              )}
              <div className="px-4 py-3 bg-slate-900/50 text-xs text-slate-500">
                Manage secrets in GCP Console: <a href="https://console.cloud.google.com/security/secret-manager" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Secret Manager</a>
              </div>
            </div>
          )}
        </div>

        {/* AI Insights */}
        {insights.length > 0 && (
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
            <div className="px-4 py-3 bg-slate-800 border-b border-slate-700">
              <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <span>AI</span> AI Insights & Suggestions
              </h3>
            </div>
            <div className="divide-y divide-slate-700">
              {insights.map((insight, i) => (
                <InsightRow key={i} insight={insight} onExecute={executeSuggestion} />
              ))}
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 p-6 bg-slate-800/30 rounded-xl border border-slate-700">
          <h3 className="text-lg font-medium text-white mb-4">Available Commands</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <CommandHelp cmd="enable [provider]" desc="Enable a provider (apollo, openai, etc.)" />
            <CommandHelp cmd="disable [provider]" desc="Disable a provider" />
            <CommandHelp cmd="show active providers" desc="List all active API providers" />
            <CommandHelp cmd="show active llms" desc="List all active LLM providers" />
            <CommandHelp cmd="show verticals" desc="List all verticals" />
            <CommandHelp cmd="status" desc="Get system status summary" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Dashboard Card Component
function DashboardCard({
  title,
  icon,
  count,
  total,
  items,
  onToggle,
  activeColor = 'green',
}: {
  title: string;
  icon: string;
  count: number;
  total: number;
  items: Array<{ slug: string; name: string; description?: string }>;
  onToggle: (slug: string, currentEnabled: boolean) => void;
  activeColor?: 'green' | 'blue' | 'purple';
}) {
  const colorClasses = {
    green: 'bg-green-500/10 text-green-400 border-green-500/30',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  };

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold ${colorClasses[activeColor]}`}>
            {icon}
          </span>
          <div>
            <h3 className="font-medium text-white">{title}</h3>
            <p className="text-xs text-slate-400">{count}/{total} active</p>
          </div>
        </div>
      </div>
      <div className="divide-y divide-slate-700/50">
        {items.map((item) => (
          <div key={item.slug} className="px-4 py-2 flex items-center justify-between hover:bg-slate-700/30">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-white truncate">{item.name}</p>
              {item.description && (
                <p className="text-xs text-slate-500 truncate">{item.description}</p>
              )}
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-3">
              <input
                type="checkbox"
                checked={true}
                onChange={() => onToggle(item.slug, true)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-green-500 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
            </label>
          </div>
        ))}
        {items.length === 0 && (
          <div className="px-4 py-6 text-center text-slate-500 text-sm">
            No active items
          </div>
        )}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  total,
  isText = false,
}: {
  label: string;
  value: number | string;
  total?: number;
  isText?: boolean;
}) {
  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
      <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">
        {isText ? value : `${value}${total ? `/${total}` : ''}`}
      </p>
    </div>
  );
}

// Insight Row Component
function InsightRow({
  insight,
  onExecute,
}: {
  insight: Insight;
  onExecute: (cmd: string | null) => void;
}) {
  const typeStyles = {
    info: 'bg-blue-500/10 text-blue-400',
    warning: 'bg-yellow-500/10 text-yellow-400',
    success: 'bg-green-500/10 text-green-400',
    error: 'bg-red-500/10 text-red-400',
  };

  const typeIcons = {
    info: 'i',
    warning: '!',
    success: 'OK',
    error: 'X',
  };

  return (
    <div className="px-4 py-3 flex items-start gap-3">
      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${typeStyles[insight.type]}`}>
        {typeIcons[insight.type]}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium">{insight.title}</p>
        <p className="text-xs text-slate-400 mt-0.5">{insight.message}</p>
        {insight.command && (
          <button
            onClick={() => onExecute(insight.command)}
            className="mt-2 text-xs text-blue-400 hover:text-blue-300"
          >
            Run: {insight.command} {'->'}
          </button>
        )}
      </div>
    </div>
  );
}

// Command Help Component
function CommandHelp({ cmd, desc }: { cmd: string; desc: string }) {
  return (
    <div className="p-3 bg-slate-800/30 rounded-lg">
      <code className="text-blue-400 text-xs">{cmd}</code>
      <p className="text-slate-500 text-xs mt-1">{desc}</p>
    </div>
  );
}
