'use client';

/**
 * S349-F5: Event Detail Modal
 * S349-F4: Evidence Pack Viewer Integration
 *
 * Displays full business event data in a modal.
 * Raw display only - no narrative rewriting.
 *
 * Guardrails:
 * - Raw display only
 * - No narrative rewriting
 * - Context fields from S347 visible
 * - Evidence Pack uses same contracts from S344/S346
 */

import { useState, useCallback } from 'react';
import {
  X,
  Clock,
  User,
  Building2,
  Briefcase,
  Database,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  ExternalLink,
  FileText,
  Loader2,
  AlertCircle,
} from 'lucide-react';

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

/**
 * S349-F4: Evidence Pack types (matching S344/S346 contracts)
 */
interface EventEntry {
  timestamp: Date | string;
  event_type: string;
  description: string;
  actor?: string;
  metadata?: Record<string, unknown>;
}

interface DerivedSignal {
  signal_type: string;
  strength: 'high' | 'medium' | 'low';
  source: string;
  detected_at: Date | string;
}

interface EvidencePack {
  summary: string;
  timeline: EventEntry[];
  signals: DerivedSignal[];
  counterfactuals: string[];
  confidence: 'High' | 'Medium' | 'Low';
  narrator_version: string;
}

interface EvidenceResponse {
  success: boolean;
  data?: {
    entity_type: string;
    entity_id: string;
    entity_name: string;
    evidence_pack: EvidencePack;
    generated_at: string;
  };
  error?: string;
}

interface EventDetailModalProps {
  event: BusinessEvent;
  onClose: () => void;
}

export default function EventDetailModal({
  event,
  onClose,
}: EventDetailModalProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['context', 'metadata'])
  );
  const [copied, setCopied] = useState<string | null>(null);

  // S349-F4: Evidence Pack state
  const [evidencePack, setEvidencePack] = useState<EvidencePack | null>(null);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);
  const [evidenceEntityName, setEvidenceEntityName] = useState<string | null>(null);

  const SENTINEL_UUID = '00000000-0000-0000-0000-000000000000';

  // S349-F4: Fetch Evidence Pack (uses S344/S346 contracts)
  const fetchEvidencePack = useCallback(async () => {
    // Only fetch for entity types that support evidence packs
    if (!['USER', 'ENTERPRISE', 'WORKSPACE'].includes(event.entity_type)) {
      setEvidenceError('Evidence packs only available for USER, ENTERPRISE, WORKSPACE');
      return;
    }

    setEvidenceLoading(true);
    setEvidenceError(null);

    try {
      const params = new URLSearchParams({
        entity_type: event.entity_type,
        entity_id: event.entity_id,
      });
      const res = await fetch(`/api/superadmin/evidence?${params}`);
      const data: EvidenceResponse = await res.json();

      if (data.success && data.data) {
        setEvidencePack(data.data.evidence_pack);
        setEvidenceEntityName(data.data.entity_name);
      } else {
        setEvidenceError(data.error || 'Failed to generate evidence pack');
      }
    } catch (error) {
      setEvidenceError('Network error fetching evidence pack');
      console.error('Evidence pack fetch error:', error);
    } finally {
      setEvidenceLoading(false);
    }
  }, [event.entity_type, event.entity_id]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const getEventColor = (eventType: string) => {
    if (eventType.includes('CREATED') || eventType.includes('STARTED'))
      return 'text-emerald-400 bg-emerald-400/10';
    if (eventType.includes('DELETED') || eventType.includes('EXPIRED'))
      return 'text-red-400 bg-red-400/10';
    if (eventType.includes('UPDATED') || eventType.includes('CHANGED'))
      return 'text-blue-400 bg-blue-400/10';
    if (eventType.includes('LOGIN') || eventType.includes('LOGOUT'))
      return 'text-violet-400 bg-violet-400/10';
    if (eventType.includes('EXTENDED') || eventType.includes('CONVERTED'))
      return 'text-amber-400 bg-amber-400/10';
    return 'text-neutral-400 bg-neutral-400/10';
  };

  // Extract resolved_context from metadata (S347)
  const resolvedContext = event.metadata?.resolved_context as Record<
    string,
    unknown
  > | undefined;

  // Get entity navigation link
  const getEntityLink = () => {
    switch (event.entity_type) {
      case 'ENTERPRISE':
        return `/superadmin/enterprises?id=${event.entity_id}`;
      case 'USER':
        return `/superadmin/users?id=${event.entity_id}`;
      case 'WORKSPACE':
        return `/superadmin/workspaces?id=${event.entity_id}`;
      default:
        return null;
    }
  };

  const entityLink = getEntityLink();

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-neutral-900 border border-neutral-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <span
              className={`px-2 py-1 rounded text-sm font-medium ${getEventColor(event.event_type)}`}
            >
              {event.event_type.replace(/_/g, ' ')}
            </span>
            <span className="text-xs text-neutral-500 font-mono">
              {event.entity_type}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-800 rounded transition-colors"
          >
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Event Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">Event ID</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-300 font-mono">
                  {event.event_id}
                </span>
                <button
                  onClick={() => copyToClipboard(event.event_id, 'event_id')}
                  className="p-1 hover:bg-neutral-800 rounded"
                >
                  {copied === 'event_id' ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-neutral-500" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">Entity ID</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-300 font-mono">
                  {event.entity_id}
                </span>
                {entityLink && (
                  <a
                    href={entityLink}
                    className="p-1 hover:bg-neutral-800 rounded text-violet-400"
                    title="View entity"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                <button
                  onClick={() => copyToClipboard(event.entity_id, 'entity_id')}
                  className="p-1 hover:bg-neutral-800 rounded"
                >
                  {copied === 'entity_id' ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-neutral-500" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">Timestamp</span>
              <span className="text-xs text-neutral-300 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(event.timestamp).toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">Actor</span>
              <span className="text-xs text-neutral-300 font-mono flex items-center gap-1">
                <User className="w-3 h-3" />
                {event.actor_user_id === SENTINEL_UUID
                  ? 'SYSTEM'
                  : event.actor_user_id}
              </span>
            </div>
          </div>

          {/* S347 Context Section */}
          <div className="border border-neutral-800 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('context')}
              className="w-full flex items-center justify-between p-3 bg-neutral-800/50 hover:bg-neutral-800 transition-colors"
            >
              <span className="text-sm font-medium text-cyan-400 flex items-center gap-2">
                <Database className="w-4 h-4" />
                Resolved Context (S347)
              </span>
              {expandedSections.has('context') ? (
                <ChevronDown className="w-4 h-4 text-neutral-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-neutral-500" />
              )}
            </button>

            {expandedSections.has('context') && (
              <div className="p-3 space-y-2 bg-cyan-950/20">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-neutral-500">enterprise_id</span>
                    <p className="text-neutral-300 font-mono truncate">
                      {event.workspace_id === SENTINEL_UUID ? (
                        <span className="text-neutral-600">NULL (system)</span>
                      ) : (
                        resolvedContext?.enterprise_id?.toString() || (
                          <span className="text-amber-500">not set</span>
                        )
                      )}
                    </p>
                  </div>
                  <div>
                    <span className="text-neutral-500">workspace_id</span>
                    <p className="text-neutral-300 font-mono truncate">
                      {event.workspace_id === SENTINEL_UUID ? (
                        <span className="text-neutral-600">NULL (system)</span>
                      ) : (
                        event.workspace_id
                      )}
                    </p>
                  </div>
                  <div>
                    <span className="text-neutral-500">sub_vertical_id</span>
                    <p className="text-neutral-300 font-mono truncate">
                      {event.sub_vertical_id === SENTINEL_UUID ? (
                        <span className="text-neutral-600">NULL (system)</span>
                      ) : (
                        event.sub_vertical_id
                      )}
                    </p>
                  </div>
                  <div>
                    <span className="text-neutral-500">region_code</span>
                    <p className="text-neutral-300 font-mono">
                      {resolvedContext?.region_code?.toString() || (
                        <span className="text-neutral-600">NULL</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <span className="text-neutral-500">is_demo</span>
                    <p className="text-neutral-300">
                      {resolvedContext?.is_demo ? 'true' : 'false'}
                    </p>
                  </div>
                  <div>
                    <span className="text-neutral-500">role</span>
                    <p className="text-neutral-300">
                      {resolvedContext?.role?.toString() || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Metadata Section */}
          <div className="border border-neutral-800 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('metadata')}
              className="w-full flex items-center justify-between p-3 bg-neutral-800/50 hover:bg-neutral-800 transition-colors"
            >
              <span className="text-sm font-medium text-neutral-300">
                Full Metadata
              </span>
              {expandedSections.has('metadata') ? (
                <ChevronDown className="w-4 h-4 text-neutral-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-neutral-500" />
              )}
            </button>

            {expandedSections.has('metadata') && (
              <div className="p-3">
                <pre className="text-xs text-neutral-400 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(event.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Raw Event Section */}
          <div className="border border-neutral-800 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('raw')}
              className="w-full flex items-center justify-between p-3 bg-neutral-800/50 hover:bg-neutral-800 transition-colors"
            >
              <span className="text-sm font-medium text-neutral-500">
                Raw Event JSON
              </span>
              {expandedSections.has('raw') ? (
                <ChevronDown className="w-4 h-4 text-neutral-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-neutral-500" />
              )}
            </button>

            {expandedSections.has('raw') && (
              <div className="p-3">
                <pre className="text-xs text-neutral-500 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(event, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* S349-F4: Evidence Pack Section */}
          {['USER', 'ENTERPRISE', 'WORKSPACE'].includes(event.entity_type) && (
            <div className="border border-violet-500/30 rounded-lg overflow-hidden bg-violet-950/10">
              <button
                onClick={() => {
                  if (!evidencePack && !evidenceLoading) {
                    fetchEvidencePack();
                  }
                  toggleSection('evidence');
                }}
                className="w-full flex items-center justify-between p-3 bg-violet-900/20 hover:bg-violet-900/30 transition-colors"
              >
                <span className="text-sm font-medium text-violet-300 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Evidence Pack (S344/S346)
                  {evidenceLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                </span>
                {expandedSections.has('evidence') ? (
                  <ChevronDown className="w-4 h-4 text-violet-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-violet-400" />
                )}
              </button>

              {expandedSections.has('evidence') && (
                <div className="p-3 space-y-3">
                  {evidenceLoading && (
                    <div className="flex items-center gap-2 text-sm text-neutral-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating deterministic evidence pack...
                    </div>
                  )}

                  {evidenceError && (
                    <div className="flex items-center gap-2 text-sm text-red-400">
                      <AlertCircle className="w-4 h-4" />
                      {evidenceError}
                    </div>
                  )}

                  {evidencePack && (
                    <div className="space-y-3">
                      {/* Entity Name */}
                      {evidenceEntityName && (
                        <div className="text-xs text-neutral-500">
                          Entity: <span className="text-neutral-300">{evidenceEntityName}</span>
                        </div>
                      )}

                      {/* Summary (deterministic, template-based) */}
                      <div className="bg-neutral-900/50 p-3 rounded">
                        <div className="text-xs text-neutral-500 mb-1">Summary</div>
                        <p className="text-sm text-neutral-200">{evidencePack.summary}</p>
                      </div>

                      {/* Confidence */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-500">Confidence:</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          evidencePack.confidence === 'High' ? 'bg-emerald-500/20 text-emerald-400' :
                          evidencePack.confidence === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {evidencePack.confidence}
                        </span>
                        <span className="text-xs text-neutral-600 ml-2">
                          ({evidencePack.narrator_version})
                        </span>
                      </div>

                      {/* Timeline */}
                      {evidencePack.timeline.length > 0 && (
                        <div>
                          <div className="text-xs text-neutral-500 mb-2">
                            Timeline ({evidencePack.timeline.length} events)
                          </div>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {evidencePack.timeline.slice(0, 10).map((entry, i) => (
                              <div key={i} className="text-xs flex gap-2">
                                <span className="text-neutral-600 font-mono">
                                  {new Date(entry.timestamp).toLocaleDateString()}
                                </span>
                                <span className="text-neutral-400">{entry.event_type}</span>
                              </div>
                            ))}
                            {evidencePack.timeline.length > 10 && (
                              <div className="text-xs text-neutral-600">
                                ... and {evidencePack.timeline.length - 10} more
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Counterfactuals (Missed Opportunities) */}
                      {evidencePack.counterfactuals.length > 0 && (
                        <div>
                          <div className="text-xs text-amber-500 mb-1">
                            Missed Opportunities
                          </div>
                          <ul className="text-xs text-neutral-400 list-disc list-inside">
                            {evidencePack.counterfactuals.map((cf, i) => (
                              <li key={i}>{cf}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Raw Evidence Pack JSON (collapsible) */}
                      <div className="border-t border-neutral-800 pt-2 mt-2">
                        <button
                          onClick={() => toggleSection('evidence-raw')}
                          className="text-xs text-neutral-500 hover:text-neutral-300 flex items-center gap-1"
                        >
                          {expandedSections.has('evidence-raw') ? (
                            <ChevronDown className="w-3 h-3" />
                          ) : (
                            <ChevronRight className="w-3 h-3" />
                          )}
                          Raw Evidence Pack JSON
                        </button>
                        {expandedSections.has('evidence-raw') && (
                          <pre className="mt-2 text-xs text-neutral-500 overflow-x-auto max-h-40 whitespace-pre-wrap">
                            {JSON.stringify(evidencePack, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  )}

                  {!evidencePack && !evidenceLoading && !evidenceError && (
                    <button
                      onClick={fetchEvidencePack}
                      className="text-sm text-violet-400 hover:text-violet-300"
                    >
                      Click to generate evidence pack
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 flex justify-between items-center">
          <span className="text-xs text-neutral-600">
            Immutable record from business_events table
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
