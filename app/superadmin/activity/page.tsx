'use client';

/**
 * S349: Super Admin - Activity Page (Admin Plane v1.1)
 *
 * Displays business events from the immutable business_events table.
 * This is read-only visibility, NOT analytics.
 *
 * Guardrails:
 * - NO derived metrics
 * - Surface raw data + evidence-linked
 * - Uses same contracts from S346 Evidence Pack
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  RefreshCw,
  Loader2,
  User,
  Building2,
  Briefcase,
  Play,
  Filter,
  Clock,
  ChevronDown,
  ChevronRight,
  Database,
  Eye,
} from 'lucide-react';
import EventDetailModal from '@/components/superadmin/EventDetailModal';

// Event types from lib/events/event-emitter.ts
const EVENT_TYPES = [
  // Enterprise
  'ENTERPRISE_CREATED',
  'ENTERPRISE_UPDATED',
  'ENTERPRISE_DELETED',
  'ENTERPRISE_PLAN_CHANGED',
  // User
  'USER_CREATED',
  'USER_UPDATED',
  'USER_DELETED',
  'USER_ROLE_CHANGED',
  'USER_LOGIN',
  'USER_LOGOUT',
  // Workspace
  'WORKSPACE_CREATED',
  'WORKSPACE_UPDATED',
  'WORKSPACE_DELETED',
  // Demo
  'DEMO_STARTED',
  'DEMO_EXTENDED',
  'DEMO_CONVERTED',
  'DEMO_EXPIRED',
  // Admin
  'ADMIN_ACTION',
  'SUPER_ADMIN_ACTION',
] as const;

const ENTITY_TYPES = [
  'ENTERPRISE',
  'USER',
  'WORKSPACE',
  'DEMO_POLICY',
  'SYSTEM',
] as const;

interface BusinessEvent {
  event_id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  workspace_id: string;
  sub_vertical_id: string;
  actor_user_id: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

interface ActivityResponse {
  success: boolean;
  data: {
    events: BusinessEvent[];
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
    source: string;
  };
}

export default function ActivityPage() {
  const [events, setEvents] = useState<BusinessEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Filters
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('');
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);

  // Detail view
  const [selectedEvent, setSelectedEvent] = useState<BusinessEvent | null>(null);
  const [expandedMetadata, setExpandedMetadata] = useState<Set<string>>(new Set());

  const fetchActivity = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (eventTypeFilter) params.set('event_type', eventTypeFilter);
      if (entityTypeFilter) params.set('entity_type', entityTypeFilter);
      params.set('limit', limit.toString());
      params.set('offset', offset.toString());

      const res = await fetch(`/api/superadmin/activity?${params}`);
      const data: ActivityResponse = await res.json();

      if (data.success) {
        setEvents(data.data.events);
        setTotal(data.data.total);
        setHasMore(data.data.has_more);
      }
    } catch (error) {
      console.error('Failed to fetch activity:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [eventTypeFilter, entityTypeFilter, limit, offset]);

  useEffect(() => {
    setOffset(0); // Reset pagination when filters change
    fetchActivity();
  }, [eventTypeFilter, entityTypeFilter, fetchActivity]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchActivity();
  };

  const getEntityIcon = (entityType: string) => {
    const icons: Record<string, React.ReactNode> = {
      ENTERPRISE: <Building2 className="w-4 h-4" />,
      USER: <User className="w-4 h-4" />,
      WORKSPACE: <Briefcase className="w-4 h-4" />,
      DEMO_POLICY: <Play className="w-4 h-4" />,
      SYSTEM: <Database className="w-4 h-4" />,
    };
    return icons[entityType] || <Activity className="w-4 h-4" />;
  };

  const getEventColor = (eventType: string) => {
    if (eventType.includes('CREATED') || eventType.includes('STARTED'))
      return 'text-emerald-400';
    if (eventType.includes('DELETED') || eventType.includes('EXPIRED'))
      return 'text-red-400';
    if (eventType.includes('UPDATED') || eventType.includes('CHANGED'))
      return 'text-blue-400';
    if (eventType.includes('LOGIN') || eventType.includes('LOGOUT'))
      return 'text-violet-400';
    if (eventType.includes('EXTENDED') || eventType.includes('CONVERTED'))
      return 'text-amber-400';
    return 'text-neutral-400';
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString();
  };

  const toggleMetadata = (eventId: string) => {
    setExpandedMetadata((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  const SENTINEL_UUID = '00000000-0000-0000-0000-000000000000';

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-neutral-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-violet-400" />
            Activity
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Business events from immutable audit log
            <span className="ml-2 text-emerald-500 text-xs">
              (source: business_events)
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-500">
            {total} events
          </span>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-neutral-500" />
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="px-3 py-2 bg-neutral-900 border border-neutral-800 rounded text-sm text-white focus:outline-none focus:border-violet-500"
          >
            <option value="">All Event Types</option>
            {EVENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        <select
          value={entityTypeFilter}
          onChange={(e) => setEntityTypeFilter(e.target.value)}
          className="px-3 py-2 bg-neutral-900 border border-neutral-800 rounded text-sm text-white focus:outline-none focus:border-violet-500"
        >
          <option value="">All Entity Types</option>
          {ENTITY_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Events List */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
        {events.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">
            No events found
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/50">
            {events.map((event) => (
              <div
                key={event.event_id}
                className="px-4 py-3 hover:bg-neutral-800/30 transition-colors cursor-pointer"
                onClick={() => setSelectedEvent(event)}
              >
                <div className="flex items-start gap-3">
                  {/* Entity Icon */}
                  <div className="p-2 bg-neutral-800 rounded-lg text-neutral-400">
                    {getEntityIcon(event.entity_type)}
                  </div>

                  {/* Event Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-medium text-sm ${getEventColor(event.event_type)}`}>
                        {event.event_type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-neutral-600">|</span>
                      <span className="text-xs text-neutral-500 font-mono">
                        {event.entity_type}
                      </span>
                    </div>

                    {/* Entity ID */}
                    <p className="text-xs text-neutral-400 mt-1 font-mono">
                      entity: {event.entity_id}
                    </p>

                    {/* Context fields (S347 - highlighted) */}
                    <div className="flex items-center gap-3 mt-2 text-xs flex-wrap">
                      <span className="flex items-center gap-1 text-neutral-500">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(event.timestamp)}
                      </span>
                      {event.actor_user_id !== SENTINEL_UUID && (
                        <span className="text-neutral-500">
                          actor: <span className="font-mono">{event.actor_user_id.slice(0, 8)}...</span>
                        </span>
                      )}
                      {event.workspace_id !== SENTINEL_UUID && (
                        <span className="text-cyan-500/70">
                          ws: <span className="font-mono">{event.workspace_id.slice(0, 8)}...</span>
                        </span>
                      )}
                    </div>

                    {/* Expandable Metadata */}
                    <div className="mt-2">
                      <button
                        onClick={() => toggleMetadata(event.event_id)}
                        className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                      >
                        {expandedMetadata.has(event.event_id) ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                        <Eye className="w-3 h-3" />
                        metadata
                      </button>

                      {expandedMetadata.has(event.event_id) && (
                        <pre className="mt-2 p-3 bg-neutral-950 rounded text-xs text-neutral-400 overflow-x-auto max-h-48">
                          {JSON.stringify(event.metadata, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>

                  {/* Timestamp (absolute) */}
                  <div className="text-xs text-neutral-600 whitespace-nowrap">
                    {new Date(event.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {(hasMore || offset > 0) && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={offset === 0}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-neutral-500">
            Showing {offset + 1} - {Math.min(offset + events.length, total)} of {total}
          </span>
          <button
            onClick={() => setOffset(offset + limit)}
            disabled={!hasMore}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Source Notice */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
        <p className="text-sm text-emerald-300">
          <strong>Immutable Audit Log:</strong> Events are from the business_events table.
          This table has database triggers preventing UPDATE and DELETE operations.
          What you see is the complete, unmodified record.
        </p>
      </div>

      {/* Event Detail Modal (S349-F5) */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}
