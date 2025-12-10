/**
 * Invitation Table Component
 * S149: Tenant Admin MVP
 *
 * Displays pending workspace invitations with:
 * - Status tracking (pending, accepted, expired)
 * - Expiry countdown
 * - Resend/Revoke actions
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { TeamRole } from '@/lib/workspace/types';

interface Invitation {
  id: string;
  email: string;
  role: TeamRole;
  workspaceId: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
  token: string;
}

interface InvitationTableProps {
  workspaceId?: string;
  onInvitationUpdate?: () => void;
}

const roleLabels: Record<TeamRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  analyst: 'Analyst',
  viewer: 'Viewer',
};

const roleColors: Record<TeamRole, string> = {
  owner: 'bg-purple-100 text-purple-700',
  admin: 'bg-blue-100 text-blue-700',
  analyst: 'bg-green-100 text-green-700',
  viewer: 'bg-gray-100 text-gray-700',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  accepted: 'bg-green-100 text-green-700',
  expired: 'bg-gray-100 text-gray-500',
  revoked: 'bg-red-100 text-red-700',
};

export function InvitationTable({
  workspaceId = 'ws-default',
  onInvitationUpdate,
}: InvitationTableProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadInvitations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ workspaceId });
      if (statusFilter) params.set('status', statusFilter);

      const response = await fetch(`/api/admin/invitations?${params}`);
      const data = await response.json();

      if (data.success) {
        setInvitations(data.data);
      }
    } catch (error) {
      console.error('Failed to load invitations:', error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, statusFilter]);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  const handleResend = async (invitationId: string) => {
    setActionLoading(invitationId);
    try {
      // Resend creates a new invitation with the same details
      const invitation = invitations.find(i => i.id === invitationId);
      if (!invitation) return;

      const response = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: invitation.email,
          role: invitation.role,
          workspaceId: invitation.workspaceId,
        }),
      });

      if (response.ok) {
        // Revoke the old invitation
        await fetch(`/api/admin/invitations?id=${invitationId}`, {
          method: 'DELETE',
        });

        loadInvitations();
        onInvitationUpdate?.();
      }
    } catch (error) {
      console.error('Failed to resend invitation:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoke = async (invitationId: string) => {
    setActionLoading(invitationId);
    try {
      const response = await fetch(`/api/admin/invitations?id=${invitationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setInvitations(prev =>
          prev.map(i => (i.id === invitationId ? { ...i, status: 'revoked' as const } : i))
        );
        onInvitationUpdate?.();
      }
    } catch (error) {
      console.error('Failed to revoke invitation:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getExpiryInfo = (expiresAt: string) => {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) {
      return { text: 'Expired', color: 'text-red-600' };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return { text: `${days}d ${hours}h`, color: days > 2 ? 'text-gray-500' : 'text-orange-600' };
    }
    if (hours > 0) {
      return { text: `${hours}h`, color: 'text-orange-600' };
    }
    return { text: 'Soon', color: 'text-red-600' };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(link);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">Pending Invitations</h3>
            <p className="text-sm text-gray-500">Manage workspace invitation links</p>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="expired">Expired</option>
            <option value="revoked">Revoked</option>
            <option value="">All</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sent
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expires
              </th>
              <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                  <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
                  Loading invitations...
                </td>
              </tr>
            ) : invitations.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                  <div className="text-4xl mb-2">📨</div>
                  <p>No {statusFilter || ''} invitations</p>
                </td>
              </tr>
            ) : (
              invitations.map((invitation) => {
                const expiryInfo = getExpiryInfo(invitation.expiresAt);

                return (
                  <tr key={invitation.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                          @
                        </div>
                        <span className="font-medium text-gray-900">{invitation.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${roleColors[invitation.role]}`}>
                        {roleLabels[invitation.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${statusColors[invitation.status]}`}>
                        {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(invitation.invitedAt)}
                    </td>
                    <td className="px-4 py-3">
                      {invitation.status === 'pending' ? (
                        <span className={`text-sm font-medium ${expiryInfo.color}`}>
                          {expiryInfo.text}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {invitation.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copyInviteLink(invitation.token)}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                            title="Copy invite link"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleResend(invitation.id)}
                            disabled={actionLoading === invitation.id}
                            className="p-1.5 rounded hover:bg-blue-50 text-blue-600 disabled:opacity-50"
                            title="Resend invitation"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleRevoke(invitation.id)}
                            disabled={actionLoading === invitation.id}
                            className="p-1.5 rounded hover:bg-red-50 text-red-600 disabled:opacity-50"
                            title="Revoke invitation"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}
                      {invitation.status === 'expired' && (
                        <button
                          onClick={() => handleResend(invitation.id)}
                          disabled={actionLoading === invitation.id}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                        >
                          {actionLoading === invitation.id ? 'Sending...' : 'Resend'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {invitations.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
          {invitations.length} invitation{invitations.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
