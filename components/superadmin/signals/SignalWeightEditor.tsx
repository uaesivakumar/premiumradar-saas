'use client';

/**
 * Signal Weight Editor (S260-F2)
 *
 * Edit signal weights for scoring.
 */

import { useState, useEffect } from 'react';

interface Signal {
  id: string;
  key: string;
  name: string;
  weight: number;
  is_enabled: boolean;
}

interface SignalWeightEditorProps {
  subVerticalId: string;
  onSave?: () => void;
}

export function SignalWeightEditor({ subVerticalId, onSave }: SignalWeightEditorProps) {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modified, setModified] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSignals();
  }, [subVerticalId]);

  const fetchSignals = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/superadmin/controlplane/sub-verticals/${subVerticalId}/signals?enabled_only=true`
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

  const handleWeightChange = (signalId: string, weight: number) => {
    setSignals(signals.map(s =>
      s.id === signalId ? { ...s, weight: Math.max(0, Math.min(100, weight)) } : s
    ));
    setModified(prev => new Set(prev).add(signalId));
  };

  const handleSaveAll = async () => {
    if (modified.size === 0) return;

    setSaving(true);
    setError(null);

    try {
      const updates = signals
        .filter(s => modified.has(s.id))
        .map(s => ({ id: s.id, weight: s.weight }));

      const response = await fetch(
        `/api/superadmin/controlplane/sub-verticals/${subVerticalId}/signals/bulk-update`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setModified(new Set());
        onSave?.();
      } else {
        setError(data.error || 'Failed to save weights');
      }
    } catch (err) {
      setError('Failed to save weights');
    } finally {
      setSaving(false);
    }
  };

  const totalWeight = signals.reduce((sum, s) => sum + s.weight, 0);

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
          <h3 className="text-lg font-medium text-gray-900">Signal Weights</h3>
          <p className="text-sm text-gray-500">
            Total weight: {totalWeight}
            {totalWeight !== 100 && (
              <span className="ml-1 text-yellow-600">(recommended: 100)</span>
            )}
          </p>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={saving || modified.size === 0}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : `Save Changes (${modified.size})`}
        </button>
      </div>

      {error && (
        <div className="px-6 py-4 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="p-6">
        {signals.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No enabled signals to configure
          </div>
        ) : (
          <div className="space-y-4">
            {signals.map(signal => (
              <div key={signal.id} className="flex items-center">
                <div className="flex-1 min-w-0 mr-4">
                  <p className="text-sm font-medium text-gray-900">{signal.name}</p>
                  <p className="text-xs text-gray-500">{signal.key}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={signal.weight}
                    onChange={(e) => handleWeightChange(signal.id, parseInt(e.target.value))}
                    className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={signal.weight}
                    onChange={(e) => handleWeightChange(signal.id, parseInt(e.target.value) || 0)}
                    className={`w-16 px-2 py-1 text-sm text-center border rounded-md ${
                      modified.has(signal.id)
                        ? 'border-indigo-300 bg-indigo-50'
                        : 'border-gray-300'
                    }`}
                  />
                  <span className="text-xs text-gray-400 w-8 text-right">
                    {totalWeight > 0 ? Math.round((signal.weight / totalWeight) * 100) : 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Visual weight distribution */}
        {signals.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-2">Weight Distribution</p>
            <div className="h-4 rounded-full bg-gray-200 overflow-hidden flex">
              {signals.map((signal, i) => (
                <div
                  key={signal.id}
                  className={`h-full ${
                    ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'][i % 8]
                  }`}
                  style={{ width: `${totalWeight > 0 ? (signal.weight / totalWeight) * 100 : 0}%` }}
                  title={`${signal.name}: ${signal.weight}`}
                />
              ))}
            </div>
            <div className="flex flex-wrap mt-2 gap-2">
              {signals.map((signal, i) => (
                <div key={signal.id} className="flex items-center text-xs">
                  <div className={`w-2 h-2 rounded-full mr-1 ${
                    ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'][i % 8]
                  }`}></div>
                  <span className="text-gray-600">{signal.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
