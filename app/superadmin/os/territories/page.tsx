'use client';

/**
 * Super Admin Territory Management
 *
 * Manages UPR OS Territories (S53):
 * - Territory hierarchy (Global > Region > Country > City > Zone)
 * - Territory-Vertical assignments
 * - Assignment rules
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Globe,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Loader2,
  MapPin,
  ChevronDown,
  ChevronRight,
  Building2,
  Layers,
  Users,
} from 'lucide-react';

interface Territory {
  id: string;
  slug: string;
  name: string;
  level: 'global' | 'region' | 'country' | 'city' | 'zone';
  parent_id?: string;
  country_code?: string;
  status: string;
  metadata?: Record<string, unknown>;
}

export default function TerritoriesPage() {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTerritory, setExpandedTerritory] = useState<string | null>(null);
  const [territoryHierarchy, setTerritoryHierarchy] = useState<Record<string, Territory[]>>({});
  const [loadingHierarchy, setLoadingHierarchy] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/superadmin/os/territories');
      const data = await response.json();

      if (data.success) {
        setTerritories(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch territories');
      }
    } catch (err) {
      console.error('Failed to fetch territories:', err);
      setError('Failed to connect to UPR OS');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const loadHierarchy = async (identifier: string) => {
    if (territoryHierarchy[identifier]) {
      setExpandedTerritory(expandedTerritory === identifier ? null : identifier);
      return;
    }

    try {
      setLoadingHierarchy(identifier);
      setExpandedTerritory(identifier);

      const response = await fetch(`/api/superadmin/os/territories?action=hierarchy&id=${identifier}`);
      const data = await response.json();

      if (data.success && data.data) {
        setTerritoryHierarchy((prev) => ({
          ...prev,
          [identifier]: data.data.children || [],
        }));
      }
    } catch (err) {
      console.error('Failed to load hierarchy:', err);
    } finally {
      setLoadingHierarchy(null);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'global':
        return 'text-purple-400 bg-purple-500/10';
      case 'region':
        return 'text-blue-400 bg-blue-500/10';
      case 'country':
        return 'text-green-400 bg-green-500/10';
      case 'city':
        return 'text-orange-400 bg-orange-500/10';
      case 'zone':
        return 'text-pink-400 bg-pink-500/10';
      default:
        return 'text-gray-400 bg-gray-500/10';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'global':
        return <Globe className="w-4 h-4" />;
      case 'region':
        return <Layers className="w-4 h-4" />;
      case 'country':
        return <MapPin className="w-4 h-4" />;
      case 'city':
        return <Building2 className="w-4 h-4" />;
      case 'zone':
        return <Users className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  // Group by level
  const byLevel = territories.reduce((acc, t) => {
    const level = t.level || 'unknown';
    if (!acc[level]) acc[level] = [];
    acc[level].push(t);
    return acc;
  }, {} as Record<string, Territory[]>);

  const levelOrder = ['global', 'region', 'country', 'city', 'zone'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-400 mx-auto mb-4" />
          <p className="text-gray-500">Loading territories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/superadmin/os"
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Globe className="w-7 h-7 text-green-400" />
              Territory Management
            </h1>
            <p className="text-gray-400 mt-1">Sprint 53: Regional hierarchy and assignments</p>
          </div>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-400">{error}</span>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-5 gap-4">
        {levelOrder.map((level) => (
          <div key={level} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className={`p-2 rounded ${getLevelColor(level)}`}>
                {getLevelIcon(level)}
              </span>
              <p className="text-gray-500 text-sm capitalize">{level}</p>
            </div>
            <p className="text-2xl font-bold text-white">
              {byLevel[level]?.length || 0}
            </p>
          </div>
        ))}
      </div>

      {/* Territories by Level */}
      <div className="space-y-4">
        {levelOrder.map((level) => {
          const levelTerritories = byLevel[level] || [];
          if (levelTerritories.length === 0) return null;

          return (
            <div key={level} className="bg-gray-900 border border-gray-800 rounded-xl">
              <div className="p-4 border-b border-gray-800 flex items-center gap-3">
                <span className={`p-2 rounded ${getLevelColor(level)}`}>
                  {getLevelIcon(level)}
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-white capitalize">{level} Territories</h2>
                  <p className="text-gray-500 text-sm">{levelTerritories.length} territories</p>
                </div>
              </div>
              <div className="divide-y divide-gray-800">
                {levelTerritories.map((territory) => (
                  <div key={territory.id || territory.slug} className="p-4">
                    <button
                      onClick={() => loadHierarchy(territory.slug)}
                      className="w-full flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-4">
                        {loadingHierarchy === territory.slug ? (
                          <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                        ) : expandedTerritory === territory.slug ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                        <div>
                          <span className="text-white font-medium">{territory.name}</span>
                          <span className="text-gray-500 text-sm ml-2">({territory.slug})</span>
                          {territory.country_code && (
                            <span className="text-gray-500 text-sm ml-2">[{territory.country_code}]</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-xs px-2 py-1 rounded ${
                          territory.status === 'active'
                            ? 'text-green-400 bg-green-500/10'
                            : 'text-gray-400 bg-gray-500/10'
                        }`}>
                          {territory.status}
                        </span>
                      </div>
                    </button>

                    {expandedTerritory === territory.slug && territoryHierarchy[territory.slug] && (
                      <div className="mt-4 ml-8 p-4 bg-gray-800/50 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-400 mb-3">
                          Child Territories ({territoryHierarchy[territory.slug].length})
                        </h4>
                        {territoryHierarchy[territory.slug].length === 0 ? (
                          <p className="text-gray-500 text-sm">No child territories</p>
                        ) : (
                          <div className="grid grid-cols-3 gap-2">
                            {territoryHierarchy[territory.slug].map((child) => (
                              <div
                                key={child.slug}
                                className="p-2 bg-gray-700/50 rounded flex items-center justify-between"
                              >
                                <div className="flex items-center gap-2">
                                  <span className={`p-1 rounded ${getLevelColor(child.level)}`}>
                                    {getLevelIcon(child.level)}
                                  </span>
                                  <span className="text-gray-300 text-sm">{child.name}</span>
                                </div>
                                <span className="text-gray-500 text-xs">{child.level}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {territories.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <Globe className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500">No territories configured. Check UPR OS connection.</p>
        </div>
      )}
    </div>
  );
}
