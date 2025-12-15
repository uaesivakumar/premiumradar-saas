'use client';

/**
 * Super Admin Discovery Templates Management (Sprint 77)
 *
 * Manage configurable search query templates for live discovery.
 * Templates control what SIVA searches for when a user triggers discovery.
 *
 * Features:
 * - List all templates with filters
 * - Create/edit templates per vertical/sub-vertical/region
 * - Priority ordering
 * - Enable/disable templates
 * - Template preview with {region} placeholder
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Search,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Loader2,
  Filter,
  Save,
  X,
} from 'lucide-react';

interface DiscoveryTemplate {
  id: string;
  vertical_id: string | null;
  sub_vertical_id: string | null;
  region_code: string | null;
  query_template: string;
  query_type: string;
  priority: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

interface FilterState {
  vertical: string;
  sub_vertical: string;
  region: string;
  active_only: boolean;
}

const VERTICALS = [
  { value: '', label: 'All Verticals' },
  { value: 'banking', label: 'Banking' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'recruitment', label: 'Recruitment' },
  { value: 'real_estate', label: 'Real Estate' },
];

const SUB_VERTICALS = {
  banking: [
    { value: '', label: 'All Sub-Verticals' },
    { value: 'employee_banking', label: 'Employee Banking' },
    { value: 'corporate_banking', label: 'Corporate Banking' },
    { value: 'sme_banking', label: 'SME Banking' },
  ],
  insurance: [
    { value: '', label: 'All Sub-Verticals' },
    { value: 'individual', label: 'Individual' },
    { value: 'corporate', label: 'Corporate' },
  ],
  default: [{ value: '', label: 'All Sub-Verticals' }],
};

const REGIONS = [
  { value: '', label: 'All Regions' },
  { value: 'UAE', label: 'UAE' },
  { value: 'India', label: 'India' },
  { value: 'Saudi Arabia', label: 'Saudi Arabia' },
];

export default function DiscoveryTemplatesPage() {
  const [templates, setTemplates] = useState<DiscoveryTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [filters, setFilters] = useState<FilterState>({
    vertical: '',
    sub_vertical: '',
    region: '',
    active_only: true,
  });

  // Edit/Create modal
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<DiscoveryTemplate> | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.vertical) params.set('vertical', filters.vertical);
      if (filters.sub_vertical) params.set('sub_vertical', filters.sub_vertical);
      if (filters.region) params.set('region', filters.region);
      params.set('active_only', filters.active_only.toString());

      const response = await fetch(`/api/superadmin/os/discovery-templates?${params.toString()}`);
      const data = await response.json();

      if (data.success && data.data) {
        setTemplates(data.data.templates || []);
      } else {
        setError(data.error || 'Failed to fetch templates');
      }
    } catch (err) {
      setError('Failed to fetch templates');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSave = async () => {
    if (!editingTemplate?.query_template) {
      setError('Query template is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const isNew = !editingTemplate.id;
      const method = isNew ? 'POST' : 'PATCH';
      const body = isNew
        ? {
            vertical_id: editingTemplate.vertical_id || null,
            sub_vertical_id: editingTemplate.sub_vertical_id || null,
            region_code: editingTemplate.region_code || null,
            query_template: editingTemplate.query_template,
            query_type: editingTemplate.query_type || 'serp',
            priority: editingTemplate.priority || 100,
            description: editingTemplate.description || null,
            is_active: editingTemplate.is_active !== false,
          }
        : {
            id: editingTemplate.id,
            ...editingTemplate,
          };

      const response = await fetch('/api/superadmin/os/discovery-templates', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(isNew ? 'Template created successfully' : 'Template updated successfully');
        setShowModal(false);
        setEditingTemplate(null);
        fetchTemplates();
      } else {
        setError(data.error || 'Failed to save template');
      }
    } catch (err) {
      setError('Failed to save template');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      setError(null);
      const response = await fetch(`/api/superadmin/os/discovery-templates?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Template deleted successfully');
        fetchTemplates();
      } else {
        setError(data.error || 'Failed to delete template');
      }
    } catch (err) {
      setError('Failed to delete template');
      console.error(err);
    }
  };

  const handleToggleActive = async (template: DiscoveryTemplate) => {
    try {
      const response = await fetch('/api/superadmin/os/discovery-templates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: template.id,
          is_active: !template.is_active,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Template ${template.is_active ? 'deactivated' : 'activated'}`);
        fetchTemplates();
      } else {
        setError(data.error || 'Failed to toggle template');
      }
    } catch (err) {
      setError('Failed to toggle template');
      console.error(err);
    }
  };

  const openCreateModal = () => {
    setEditingTemplate({
      vertical_id: filters.vertical || null,
      sub_vertical_id: filters.sub_vertical || null,
      region_code: filters.region || null,
      query_template: '',
      query_type: 'serp',
      priority: 100,
      description: '',
      is_active: true,
    });
    setShowModal(true);
  };

  const openEditModal = (template: DiscoveryTemplate) => {
    setEditingTemplate({ ...template });
    setShowModal(true);
  };

  const getSubVerticals = (vertical: string) => {
    return SUB_VERTICALS[vertical as keyof typeof SUB_VERTICALS] || SUB_VERTICALS.default;
  };

  // Clear success/error after 3 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/superadmin/os"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Discovery Templates</h1>
              <p className="text-slate-400">Manage live discovery search queries per vertical/region</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchTemplates}
              disabled={loading}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Template
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-200">{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-200">{success}</span>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-slate-400" />
            <span className="font-medium">Filters</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={filters.vertical}
              onChange={(e) =>
                setFilters((f) => ({ ...f, vertical: e.target.value, sub_vertical: '' }))
              }
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
            >
              {VERTICALS.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </select>
            <select
              value={filters.sub_vertical}
              onChange={(e) => setFilters((f) => ({ ...f, sub_vertical: e.target.value }))}
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
            >
              {getSubVerticals(filters.vertical).map((sv) => (
                <option key={sv.value} value={sv.value}>
                  {sv.label}
                </option>
              ))}
            </select>
            <select
              value={filters.region}
              onChange={(e) => setFilters((f) => ({ ...f, region: e.target.value }))}
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
            >
              {REGIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.active_only}
                onChange={(e) => setFilters((f) => ({ ...f, active_only: e.target.checked }))}
                className="w-4 h-4 rounded"
              />
              <span className="text-slate-300">Active only</span>
            </label>
          </div>
        </div>

        {/* Templates List */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            </div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
              <Search className="w-12 h-12 mb-4 opacity-50" />
              <p>No templates found</p>
              <p className="text-sm mt-1">Create a new template or adjust filters</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Priority</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Query Template</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Vertical</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Sub-Vertical</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Region</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {templates.map((template) => (
                  <tr key={template.id} className="hover:bg-slate-800/50">
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded bg-slate-700 text-sm font-mono">
                        {template.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-white font-medium">{template.query_template}</p>
                        {template.description && (
                          <p className="text-slate-400 text-sm mt-1">{template.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-sm ${template.vertical_id ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-700 text-slate-400'}`}>
                        {template.vertical_id || 'All'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-sm ${template.sub_vertical_id ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-700 text-slate-400'}`}>
                        {template.sub_vertical_id || 'All'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-sm ${template.region_code ? 'bg-green-500/20 text-green-300' : 'bg-slate-700 text-slate-400'}`}>
                        {template.region_code || 'All'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleActive(template)}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${
                          template.is_active
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {template.is_active ? (
                          <>
                            <ToggleRight className="w-4 h-4" />
                            Active
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4" />
                            Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(template)}
                          className="p-2 rounded hover:bg-slate-700 transition-colors"
                        >
                          <Edit className="w-4 h-4 text-slate-400" />
                        </button>
                        <button
                          onClick={() => handleDelete(template.id)}
                          className="p-2 rounded hover:bg-red-500/20 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
          <h3 className="font-medium text-cyan-300 mb-2">How Discovery Templates Work</h3>
          <ul className="text-sm text-slate-300 space-y-1">
            <li>• Templates define search queries used for live discovery</li>
            <li>• Use <code className="bg-slate-800 px-1 rounded">{'{region}'}</code> placeholder for dynamic region insertion</li>
            <li>• Lower priority numbers = higher ranking (executed first)</li>
            <li>• Specific templates (vertical + sub-vertical + region) override general ones</li>
            <li>• Templates with <code className="bg-slate-800 px-1 rounded">NULL</code> values match all contexts</li>
          </ul>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && editingTemplate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {editingTemplate.id ? 'Edit Template' : 'Create Template'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingTemplate(null);
                  }}
                  className="p-2 rounded hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {/* Query Template */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  Query Template <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={editingTemplate.query_template || ''}
                  onChange={(e) =>
                    setEditingTemplate((t) => t && { ...t, query_template: e.target.value })
                  }
                  placeholder="e.g., {region} companies hiring expansion"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Use {'{region}'} placeholder for dynamic region insertion
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                <input
                  type="text"
                  value={editingTemplate.description || ''}
                  onChange={(e) =>
                    setEditingTemplate((t) => t && { ...t, description: e.target.value })
                  }
                  placeholder="e.g., Universal: Companies hiring/expanding"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                />
              </div>

              {/* Context Filters */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Vertical</label>
                  <select
                    value={editingTemplate.vertical_id || ''}
                    onChange={(e) =>
                      setEditingTemplate((t) =>
                        t && { ...t, vertical_id: e.target.value || null, sub_vertical_id: null }
                      )
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                  >
                    {VERTICALS.map((v) => (
                      <option key={v.value} value={v.value}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Sub-Vertical</label>
                  <select
                    value={editingTemplate.sub_vertical_id || ''}
                    onChange={(e) =>
                      setEditingTemplate((t) =>
                        t && { ...t, sub_vertical_id: e.target.value || null }
                      )
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                  >
                    {getSubVerticals(editingTemplate.vertical_id || '').map((sv) => (
                      <option key={sv.value} value={sv.value}>
                        {sv.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Region</label>
                  <select
                    value={editingTemplate.region_code || ''}
                    onChange={(e) =>
                      setEditingTemplate((t) =>
                        t && { ...t, region_code: e.target.value || null }
                      )
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                  >
                    {REGIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Priority & Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Priority</label>
                  <input
                    type="number"
                    value={editingTemplate.priority || 100}
                    onChange={(e) =>
                      setEditingTemplate((t) =>
                        t && { ...t, priority: parseInt(e.target.value) || 100 }
                      )
                    }
                    min={1}
                    max={1000}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                  />
                  <p className="mt-1 text-xs text-slate-500">Lower = higher priority</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Query Type</label>
                  <select
                    value={editingTemplate.query_type || 'serp'}
                    onChange={(e) =>
                      setEditingTemplate((t) => t && { ...t, query_type: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                  >
                    <option value="serp">SERP (Google Search)</option>
                    <option value="news">News</option>
                    <option value="linkedin">LinkedIn</option>
                  </select>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editingTemplate.is_active !== false}
                  onChange={(e) =>
                    setEditingTemplate((t) => t && { ...t, is_active: e.target.checked })
                  }
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="is_active" className="text-slate-300">
                  Active (template will be used in live discovery)
                </label>
              </div>
            </div>
            <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingTemplate(null);
                }}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
