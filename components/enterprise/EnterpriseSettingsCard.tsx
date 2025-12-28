'use client';

/**
 * S300: Enterprise Settings Card
 * Part of User & Enterprise Management Program v1.1
 * Phase D - Frontend & UI
 *
 * Displays enterprise settings and allows admins to edit.
 */

import React, { useState } from 'react';
import { useEnterprise } from '@/lib/providers/EnterpriseContextProvider';

interface EnterpriseSettingsCardProps {
  onUpdate?: () => void;
}

export function EnterpriseSettingsCard({ onUpdate }: EnterpriseSettingsCardProps) {
  const { enterprise, isEnterpriseAdmin, isLoading, refreshContext } = useEnterprise();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(enterprise?.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
      </div>
    );
  }

  if (!enterprise) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-gray-500 dark:text-gray-400">
          No enterprise associated with your account.
        </p>
      </div>
    );
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Enterprise name is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/enterprise', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update enterprise');
      }

      setIsEditing(false);
      await refreshContext();
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Enterprise Settings
        </h3>
      </div>

      <div className="p-6 space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Enterprise Name
          </label>
          {isEditing ? (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter enterprise name"
            />
          ) : (
            <p className="text-gray-900 dark:text-white">{enterprise.name}</p>
          )}
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Type
          </label>
          <p className="text-gray-900 dark:text-white capitalize">{enterprise.type || 'Standard'}</p>
        </div>

        {/* Plan */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Plan
          </label>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 capitalize">
            {enterprise.plan || 'Free'}
          </span>
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {/* Actions */}
        {isEnterpriseAdmin && (
          <div className="flex justify-end space-x-3 pt-4">
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setName(enterprise.name);
                    setError(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                Edit
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default EnterpriseSettingsCard;
