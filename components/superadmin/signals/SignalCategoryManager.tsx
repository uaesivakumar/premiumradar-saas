'use client';

/**
 * Signal Category Manager (S260-F3)
 *
 * Manage signal categories and bulk operations.
 */

import { useState, useEffect } from 'react';

interface Signal {
  id: string;
  key: string;
  name: string;
  category: string;
  is_enabled: boolean;
}

interface CategoryStats {
  name: string;
  total: number;
  enabled: number;
}

interface SignalCategoryManagerProps {
  subVerticalId: string;
  onBulkUpdate?: () => void;
}

export function SignalCategoryManager({
  subVerticalId,
  onBulkUpdate,
}: SignalCategoryManagerProps) {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [categories, setCategories] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

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
        const signalList = data.signals || [];
        setSignals(signalList);

        // Calculate category stats
        const categoryMap: Record<string, { total: number; enabled: number }> = {};
        signalList.forEach((s: Signal) => {
          if (!categoryMap[s.category]) {
            categoryMap[s.category] = { total: 0, enabled: 0 };
          }
          categoryMap[s.category].total++;
          if (s.is_enabled) categoryMap[s.category].enabled++;
        });

        setCategories(
          Object.entries(categoryMap)
            .map(([name, stats]) => ({ name, ...stats }))
            .sort((a, b) => a.name.localeCompare(b.name))
        );
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

  const handleBulkEnable = async (category: string, enable: boolean) => {
    setUpdating(category);
    setError(null);

    try {
      const signalIds = signals
        .filter(s => s.category === category)
        .map(s => s.id);

      const response = await fetch(
        `/api/superadmin/controlplane/sub-verticals/${subVerticalId}/signals/bulk-update`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            updates: signalIds.map(id => ({ id, is_enabled: enable })),
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        await fetchSignals();
        onBulkUpdate?.();
      } else {
        setError(data.error || 'Failed to update signals');
      }
    } catch (err) {
      setError('Failed to update signals');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Signal Categories</h3>
        <p className="text-sm text-gray-500">
          {categories.length} categories, {signals.length} total signals
        </p>
      </div>

      {error && (
        <div className="px-6 py-4 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="divide-y divide-gray-200">
        {categories.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No categories found
          </div>
        ) : (
          categories.map(category => (
            <div key={category.name} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{category.name}</p>
                  <div className="flex items-center mt-1">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ width: `${(category.enabled / category.total) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {category.enabled}/{category.total} enabled
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleBulkEnable(category.name, true)}
                    disabled={updating === category.name || category.enabled === category.total}
                    className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updating === category.name ? '...' : 'Enable All'}
                  </button>
                  <button
                    onClick={() => handleBulkEnable(category.name, false)}
                    disabled={updating === category.name || category.enabled === 0}
                    className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updating === category.name ? '...' : 'Disable All'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            Total: {signals.filter(s => s.is_enabled).length}/{signals.length} enabled
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                categories.forEach(c => handleBulkEnable(c.name, true));
              }}
              className="px-3 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200"
            >
              Enable All Categories
            </button>
            <button
              onClick={() => {
                categories.forEach(c => handleBulkEnable(c.name, false));
              }}
              className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Disable All Categories
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
