'use client';

/**
 * Signal Allow-List Display (S260-F1)
 *
 * Shows allowed signals for a sub-vertical.
 */

import { useState, useEffect } from 'react';

interface Signal {
  id: string;
  key: string;
  name: string;
  description: string;
  category: string;
  is_enabled: boolean;
  weight: number;
}

interface SignalAllowListProps {
  subVerticalId: string;
  onSignalToggle?: (signal: Signal, enabled: boolean) => void;
  onEditSignal?: (signal: Signal) => void;
}

export function SignalAllowList({
  subVerticalId,
  onSignalToggle,
  onEditSignal,
}: SignalAllowListProps) {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    fetchSignals();
  }, [subVerticalId]);

  const fetchSignals = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/superadmin/controlplane/sub-verticals/${subVerticalId}/signals`
      );
      const data = await response.json();

      if (data.success) {
        setSignals(data.signals || []);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch signals');
      }
    } catch (err) {
      setError('Failed to fetch signals');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (signal: Signal) => {
    const newEnabled = !signal.is_enabled;

    // Optimistic update
    setSignals(signals.map(s =>
      s.id === signal.id ? { ...s, is_enabled: newEnabled } : s
    ));

    try {
      const response = await fetch(
        `/api/superadmin/controlplane/sub-verticals/${subVerticalId}/signals/${signal.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_enabled: newEnabled }),
        }
      );

      const data = await response.json();

      if (data.success) {
        onSignalToggle?.(signal, newEnabled);
      } else {
        // Revert on failure
        setSignals(signals.map(s =>
          s.id === signal.id ? { ...s, is_enabled: signal.is_enabled } : s
        ));
        setError(data.error || 'Failed to toggle signal');
      }
    } catch (err) {
      // Revert on failure
      setSignals(signals.map(s =>
        s.id === signal.id ? { ...s, is_enabled: signal.is_enabled } : s
      ));
      setError('Failed to toggle signal');
    }
  };

  const categories = Array.from(new Set(signals.map(s => s.category)));

  const filtered = signals.filter(s => {
    if (filter === 'enabled' && !s.is_enabled) return false;
    if (filter === 'disabled' && s.is_enabled) return false;
    if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;
    return true;
  });

  const enabledCount = signals.filter(s => s.is_enabled).length;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Signal Allow-List</h3>
          <p className="text-sm text-gray-500">
            {enabledCount}/{signals.length} signals enabled
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-2 py-1"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'enabled' | 'disabled')}
            className="text-sm border border-gray-300 rounded-md px-2 py-1"
          >
            <option value="all">All ({signals.length})</option>
            <option value="enabled">Enabled ({enabledCount})</option>
            <option value="disabled">Disabled ({signals.length - enabledCount})</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="px-6 py-4 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No signals found
          </div>
        ) : (
          filtered.map(signal => (
            <div key={signal.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center flex-1 min-w-0">
                  <button
                    onClick={() => handleToggle(signal)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      signal.is_enabled ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        signal.is_enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <div className="ml-4 min-w-0">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">{signal.name}</span>
                      <span className="ml-2 px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                        {signal.key}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{signal.description}</p>
                  </div>
                </div>
                <div className="ml-4 flex items-center space-x-3">
                  <span className="text-xs text-gray-400">{signal.category}</span>
                  <span className="text-xs font-medium text-gray-600">
                    w: {signal.weight}
                  </span>
                  <button
                    onClick={() => onEditSignal?.(signal)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
