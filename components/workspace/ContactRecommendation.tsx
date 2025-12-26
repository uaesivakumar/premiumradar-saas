/**
 * Contact Recommendation Component
 * Sprint S273: Action Output Panel
 * Feature F6: Contact Recommendation
 *
 * Displays recommended contacts for outreach:
 * - Priority-ranked contacts
 * - Role relevance
 * - Contact accessibility
 *
 * Architecture: Read-only, derived from signals + org data
 */

'use client';

import React from 'react';
import {
  Users,
  Mail,
  Phone,
  Linkedin,
  Star,
  Building2,
  ChevronRight,
  UserCheck,
  Clock,
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export interface RecommendedContact {
  id: string;
  name: string;
  title: string;
  department?: string;
  priority: 'primary' | 'secondary' | 'tertiary';
  relevanceScore: number; // 0-100
  relevanceReason: string;
  email?: string;
  phone?: string;
  linkedIn?: string;
  lastContactedAt?: string;
  decisionMaker: boolean;
  influencer: boolean;
}

interface ContactRecommendationProps {
  contacts: RecommendedContact[];
  isLoading?: boolean;
  maxDisplay?: number;
  onContactSelect?: (contact: RecommendedContact) => void;
}

// =============================================================================
// Priority Configuration
// =============================================================================

const PRIORITY_CONFIG: Record<string, { bg: string; border: string; badge: string; label: string }> = {
  primary: {
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    badge: 'bg-violet-100 text-violet-700',
    label: 'Primary',
  },
  secondary: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    label: 'Secondary',
  },
  tertiary: {
    bg: 'bg-neutral-50',
    border: 'border-neutral-200',
    badge: 'bg-neutral-100 text-neutral-600',
    label: 'Tertiary',
  },
};

// =============================================================================
// Component
// =============================================================================

export function ContactRecommendation({
  contacts,
  isLoading = false,
  maxDisplay = 4,
  onContactSelect,
}: ContactRecommendationProps) {
  if (isLoading) {
    return <ContactsSkeleton count={3} />;
  }

  if (contacts.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-full bg-neutral-100 mx-auto mb-3 flex items-center justify-center">
            <Users className="w-6 h-6 text-neutral-400" />
          </div>
          <h4 className="font-medium text-neutral-900 mb-1">No Contacts Recommended</h4>
          <p className="text-sm text-neutral-500">
            Insufficient data to recommend contacts.
          </p>
        </div>
      </div>
    );
  }

  // Sort by priority then relevance
  const sortedContacts = [...contacts].sort((a, b) => {
    const priorityOrder = { primary: 0, secondary: 1, tertiary: 2 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.relevanceScore - a.relevanceScore;
  });

  const displayedContacts = sortedContacts.slice(0, maxDisplay);
  const decisionMakerCount = contacts.filter((c) => c.decisionMaker).length;
  const influencerCount = contacts.filter((c) => c.influencer).length;

  return (
    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-violet-600" />
          <h3 className="font-semibold text-neutral-900">Recommended Contacts</h3>
          <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
            {contacts.length}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          {decisionMakerCount > 0 && (
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-500" />
              {decisionMakerCount} DM
            </span>
          )}
          {influencerCount > 0 && (
            <span className="flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-blue-500" />
              {influencerCount} Inf
            </span>
          )}
        </div>
      </div>

      {/* Contacts List */}
      <div className="divide-y divide-neutral-100">
        {displayedContacts.map((contact) => (
          <ContactRow
            key={contact.id}
            contact={contact}
            onClick={onContactSelect ? () => onContactSelect(contact) : undefined}
          />
        ))}
      </div>

      {/* Show More */}
      {contacts.length > maxDisplay && (
        <div className="px-4 py-2 bg-neutral-50 text-center">
          <button className="text-xs text-violet-600 hover:text-violet-800 font-medium">
            View all {contacts.length} contacts
          </button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Contact Row
// =============================================================================

function ContactRow({
  contact,
  onClick,
}: {
  contact: RecommendedContact;
  onClick?: () => void;
}) {
  const priorityConfig = PRIORITY_CONFIG[contact.priority];

  return (
    <div
      onClick={onClick}
      className={`px-4 py-3 ${priorityConfig.bg} ${onClick ? 'cursor-pointer hover:bg-opacity-75' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-neutral-600 font-medium text-sm flex-shrink-0">
          {getInitials(contact.name)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-medium text-neutral-900">{contact.name}</span>
            {contact.decisionMaker && (
              <span title="Decision Maker">
                <Star className="w-3.5 h-3.5 text-amber-500" />
              </span>
            )}
            {contact.influencer && (
              <span title="Influencer">
                <UserCheck className="w-3.5 h-3.5 text-blue-500" />
              </span>
            )}
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${priorityConfig.badge}`}>
              {priorityConfig.label}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-neutral-600 mb-1">
            <span>{contact.title}</span>
            {contact.department && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {contact.department}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 text-[10px] text-neutral-500 mb-2">
            <ChevronRight className="w-3 h-3" />
            <span>{contact.relevanceReason}</span>
            <span>({contact.relevanceScore}% match)</span>
          </div>

          {/* Contact Methods */}
          <div className="flex items-center gap-3">
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
              >
                <Mail className="w-3 h-3" />
                <span>Email</span>
              </a>
            )}
            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800"
              >
                <Phone className="w-3 h-3" />
                <span>Call</span>
              </a>
            )}
            {contact.linkedIn && (
              <a
                href={contact.linkedIn}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-xs text-[#0077b5] hover:text-[#005582]"
              >
                <Linkedin className="w-3 h-3" />
                <span>LinkedIn</span>
              </a>
            )}
            {contact.lastContactedAt && (
              <span className="flex items-center gap-1 text-[10px] text-neutral-400 ml-auto">
                <Clock className="w-3 h-3" />
                Last: {formatDate(contact.lastContactedAt)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Skeleton
// =============================================================================

function ContactsSkeleton({ count }: { count: number }) {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 animate-pulse">
      <div className="px-4 py-3 border-b border-neutral-100">
        <div className="flex items-center justify-between">
          <div className="w-36 h-5 bg-neutral-200 rounded" />
          <div className="w-16 h-4 bg-neutral-200 rounded" />
        </div>
      </div>
      <div className="divide-y divide-neutral-100">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-neutral-200 rounded-full" />
              <div className="flex-1">
                <div className="w-32 h-4 bg-neutral-200 rounded mb-2" />
                <div className="w-48 h-3 bg-neutral-200 rounded mb-2" />
                <div className="w-24 h-3 bg-neutral-200 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Utilities
// =============================================================================

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default ContactRecommendation;
