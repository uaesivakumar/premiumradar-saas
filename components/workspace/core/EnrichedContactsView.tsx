'use client';

/**
 * EnrichedContactsView - S396
 *
 * Displays ranked contacts from enrichment pipeline.
 * Shows QTLE-scored contacts with explanations.
 *
 * RULES (LOCKED):
 * - Show top 3-5 contacts first
 * - Label: Role, Seniority, Why recommended, Confidence
 * - No auto-outreach, no auto-email
 * - This is READINESS, not EXECUTION
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// =============================================================================
// TYPES
// =============================================================================

interface EnrichedContact {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  title: string;
  email?: string;
  linkedinUrl?: string;
  phone?: string;
  role: 'decision_maker' | 'influencer' | 'champion' | 'end_user';
  seniority: 'c_suite' | 'vp' | 'director' | 'manager' | 'individual';
  department: string;
  priority: 'primary' | 'secondary' | 'tertiary';
  priorityRank: number;
  score: number;
  scoreBreakdown: {
    quality: number;
    timing: number;
    likelihood: number;
    engagement: number;
  };
  whyRecommended: string;
  confidence: 'high' | 'medium' | 'low';
}

interface EnrichedContactsViewProps {
  sessionId: string;
  companyName: string;
  onBack: () => void;
  onContactSelect?: (contact: EnrichedContact) => void;
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

function RoleBadge({ role }: { role: EnrichedContact['role'] }) {
  const styles: Record<string, string> = {
    decision_maker: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    influencer: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    champion: 'bg-green-500/20 text-green-300 border-green-500/30',
    end_user: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  const labels: Record<string, string> = {
    decision_maker: 'Decision Maker',
    influencer: 'Influencer',
    champion: 'Champion',
    end_user: 'End User',
  };

  return (
    <span className={`px-2 py-0.5 text-xs rounded border ${styles[role]}`}>
      {labels[role]}
    </span>
  );
}

function SeniorityBadge({ seniority }: { seniority: EnrichedContact['seniority'] }) {
  const labels: Record<string, string> = {
    c_suite: 'C-Suite',
    vp: 'VP',
    director: 'Director',
    manager: 'Manager',
    individual: 'IC',
  };

  return (
    <span className="px-2 py-0.5 text-xs rounded bg-white/5 text-gray-400">
      {labels[seniority]}
    </span>
  );
}

function ConfidenceDot({ confidence }: { confidence: EnrichedContact['confidence'] }) {
  const colors: Record<string, string> = {
    high: 'bg-green-500',
    medium: 'bg-yellow-500',
    low: 'bg-gray-500',
  };

  return (
    <span className={`w-2 h-2 rounded-full ${colors[confidence]}`} title={`${confidence} confidence`} />
  );
}

function ScoreBar({ score, label }: { score: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-16">{label}</span>
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs text-gray-400 w-8 text-right">{score}</span>
    </div>
  );
}

// =============================================================================
// CONTACT CARD
// =============================================================================

function ContactCard({
  contact,
  isExpanded,
  onToggle,
  onSelect,
}: {
  contact: EnrichedContact;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect?: () => void;
}) {
  const isPrimary = contact.priority === 'primary';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        rounded-xl border transition-colors cursor-pointer
        ${isPrimary
          ? 'bg-white/5 border-white/20'
          : 'bg-white/[0.02] border-white/10 hover:border-white/15'
        }
      `}
      onClick={onToggle}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Name and badges */}
            <div className="flex items-center gap-2 mb-1">
              <ConfidenceDot confidence={contact.confidence} />
              <h3 className="font-medium text-white truncate">
                {contact.fullName}
              </h3>
              {isPrimary && (
                <span className="text-xs text-yellow-500">★</span>
              )}
            </div>

            {/* Title */}
            <p className="text-sm text-gray-400 truncate mb-2">
              {contact.title}
            </p>

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <RoleBadge role={contact.role} />
              <SeniorityBadge seniority={contact.seniority} />
              <span className="text-xs text-gray-500">{contact.department}</span>
            </div>
          </div>

          {/* Score */}
          <div className="text-right">
            <div className="text-2xl font-light text-white">{contact.score}</div>
            <div className="text-xs text-gray-500">QTLE</div>
          </div>
        </div>

        {/* Why recommended */}
        <p className="mt-3 text-sm text-gray-400">
          {contact.whyRecommended}
        </p>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-white/5 pt-4">
              {/* Score breakdown */}
              <div className="space-y-2 mb-4">
                <ScoreBar score={contact.scoreBreakdown.quality} label="Quality" />
                <ScoreBar score={contact.scoreBreakdown.timing} label="Timing" />
                <ScoreBar score={contact.scoreBreakdown.likelihood} label="Likelihood" />
                <ScoreBar score={contact.scoreBreakdown.engagement} label="Engagement" />
              </div>

              {/* Contact info */}
              <div className="space-y-2 text-sm">
                {contact.email && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <span className="text-gray-600">Email:</span>
                    <span>{contact.email}</span>
                  </div>
                )}
                {contact.linkedinUrl && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <span className="text-gray-600">LinkedIn:</span>
                    <a
                      href={contact.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Profile
                    </a>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <span className="text-gray-600">Phone:</span>
                    <span>{contact.phone}</span>
                  </div>
                )}
              </div>

              {/* Action button */}
              {onSelect && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect();
                  }}
                  className="mt-4 w-full py-2 bg-white text-slate-950 font-medium rounded-lg
                             hover:bg-gray-100 transition-colors text-sm"
                >
                  Select for Outreach
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function EnrichedContactsView({
  sessionId,
  companyName,
  onBack,
  onContactSelect,
}: EnrichedContactsViewProps) {
  const [contacts, setContacts] = useState<EnrichedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fetch contacts on mount
  useEffect(() => {
    async function fetchContacts() {
      try {
        const response = await fetch(`/api/enrichment/start?sessionId=${sessionId}`);
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch contacts');
        }

        setContacts(data.contacts || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load contacts');
      } finally {
        setLoading(false);
      }
    }

    fetchContacts();
  }, [sessionId]);

  // Separate primary and secondary contacts
  const primaryContacts = contacts.filter(c => c.priority === 'primary');
  const otherContacts = contacts.filter(c => c.priority !== 'primary');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        <p className="mt-4 text-sm text-gray-500">Finding decision makers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={onBack}
          className="text-sm text-gray-400 hover:text-white"
        >
          Go back
        </button>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-gray-400 mb-4">No contacts found for {companyName}</p>
        <button
          onClick={onBack}
          className="text-sm text-gray-400 hover:text-white"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={onBack}
            className="text-xs text-gray-500 hover:text-gray-300 mb-1"
          >
            ← Back to review
          </button>
          <h2 className="text-lg font-medium text-white">
            Contacts at {companyName}
          </h2>
          <p className="text-sm text-gray-500">
            {contacts.length} contacts found • Ranked by QTLE score
          </p>
        </div>
      </div>

      {/* Primary contacts */}
      {primaryContacts.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-3">
            Recommended Contacts
          </h3>
          <div className="space-y-3">
            {primaryContacts.map(contact => (
              <ContactCard
                key={contact.id}
                contact={contact}
                isExpanded={expandedId === contact.id}
                onToggle={() => setExpandedId(expandedId === contact.id ? null : contact.id)}
                onSelect={onContactSelect ? () => onContactSelect(contact) : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* Other contacts */}
      {otherContacts.length > 0 && (
        <div>
          <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-3">
            Other Contacts
          </h3>
          <div className="space-y-3">
            {otherContacts.map(contact => (
              <ContactCard
                key={contact.id}
                contact={contact}
                isExpanded={expandedId === contact.id}
                onToggle={() => setExpandedId(expandedId === contact.id ? null : contact.id)}
                onSelect={onContactSelect ? () => onContactSelect(contact) : undefined}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default EnrichedContactsView;
