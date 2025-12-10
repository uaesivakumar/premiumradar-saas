'use client';

/**
 * ContactList - S139: Company Profiles
 *
 * Displays key contacts/decision makers for a company:
 * - Name, title, department
 * - Contact information (email, phone, LinkedIn)
 * - Role relevance score
 * - Last interaction date
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  Linkedin,
  Star,
  StarOff,
  MessageSquare,
  ChevronRight,
  Building2,
  Crown,
  Shield,
  Briefcase,
} from 'lucide-react';

export interface Contact {
  id: string;
  name: string;
  title: string;
  department?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  avatar?: string;
  role: 'decision-maker' | 'influencer' | 'champion' | 'end-user';
  relevanceScore: number;
  lastInteraction?: string;
  isStarred?: boolean;
}

export interface ContactListProps {
  contacts: Contact[];
  onContactSelect?: (contact: Contact) => void;
  onStartOutreach?: (contact: Contact) => void;
  onToggleStar?: (contactId: string) => void;
}

const ROLE_CONFIG = {
  'decision-maker': {
    label: 'Decision Maker',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    icon: Crown,
  },
  influencer: {
    label: 'Influencer',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: Shield,
  },
  champion: {
    label: 'Champion',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: Star,
  },
  'end-user': {
    label: 'End User',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: Briefcase,
  },
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getRelevanceColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-gray-500';
}

export function ContactList({
  contacts,
  onContactSelect,
  onStartOutreach,
  onToggleStar,
}: ContactListProps) {
  const [filter, setFilter] = useState<string | null>(null);
  const [hoveredContact, setHoveredContact] = useState<string | null>(null);

  // Sort: starred first, then by relevance
  const sortedContacts = [...contacts].sort((a, b) => {
    if (a.isStarred && !b.isStarred) return -1;
    if (!a.isStarred && b.isStarred) return 1;
    return b.relevanceScore - a.relevanceScore;
  });

  const filteredContacts = filter
    ? sortedContacts.filter((c) => c.role === filter)
    : sortedContacts;

  // Group contacts by role for summary
  const roleGroups = contacts.reduce(
    (acc, c) => {
      acc[c.role] = (acc[c.role] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <User className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Key Contacts</h3>
              <p className="text-sm text-gray-500">{contacts.length} contacts identified</p>
            </div>
          </div>
        </div>

        {/* Role Filter Pills */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => setFilter(null)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              filter === null
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All ({contacts.length})
          </button>
          {Object.entries(ROLE_CONFIG).map(([role, config]) => {
            const count = roleGroups[role] || 0;
            if (count === 0) return null;
            return (
              <button
                key={role}
                onClick={() => setFilter(filter === role ? null : role)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                  filter === role ? config.color : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {config.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Contact List */}
      <div className="divide-y divide-gray-100">
        {filteredContacts.map((contact, index) => {
          const role = ROLE_CONFIG[contact.role];
          const RoleIcon = role.icon;
          const isHovered = hoveredContact === contact.id;

          return (
            <motion.div
              key={contact.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className="relative"
              onMouseEnter={() => setHoveredContact(contact.id)}
              onMouseLeave={() => setHoveredContact(null)}
            >
              <div
                className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onContactSelect?.(contact)}
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="relative">
                    {contact.avatar ? (
                      <img
                        src={contact.avatar}
                        alt={contact.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium">
                        {getInitials(contact.name)}
                      </div>
                    )}
                    {contact.isStarred && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                        <Star className="w-3 h-3 text-white fill-white" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{contact.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${role.color}`}>
                        <RoleIcon className="w-3 h-3 inline mr-1" />
                        {role.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{contact.title}</p>
                    {contact.department && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3" />
                        {contact.department}
                      </p>
                    )}
                  </div>

                  {/* Relevance Score */}
                  <div className="text-right">
                    <div className={`text-lg font-semibold ${getRelevanceColor(contact.relevanceScore)}`}>
                      {contact.relevanceScore}%
                    </div>
                    <div className="text-xs text-gray-500">Relevance</div>
                  </div>

                  {/* Actions (visible on hover) */}
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : 10 }}
                    className="flex items-center gap-2"
                  >
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Send Email"
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    )}
                    {contact.phone && (
                      <a
                        href={`tel:${contact.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Call"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                    {contact.linkedin && (
                      <a
                        href={contact.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="LinkedIn Profile"
                      >
                        <Linkedin className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStar?.(contact.id);
                      }}
                      className="p-2 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 rounded-lg transition-colors"
                      title={contact.isStarred ? 'Remove from starred' : 'Add to starred'}
                    >
                      {contact.isStarred ? (
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ) : (
                        <StarOff className="w-4 h-4" />
                      )}
                    </button>
                  </motion.div>

                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </div>

                {/* Contact Channels */}
                {isHovered && (contact.email || contact.phone) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500"
                  >
                    {contact.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {contact.email}
                      </span>
                    )}
                    {contact.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {contact.phone}
                      </span>
                    )}
                    {contact.lastInteraction && (
                      <span className="ml-auto">
                        Last contact: {new Date(contact.lastInteraction).toLocaleDateString()}
                      </span>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Start Outreach Button */}
              {isHovered && onStartOutreach && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-6 bottom-4"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartOutreach(contact);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Start Outreach
                  </button>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {contacts.length === 0 && (
        <div className="px-6 py-12 text-center">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No contacts identified for this company yet.</p>
          <p className="text-sm text-gray-400 mt-1">
            Contacts will appear here as they are enriched from data sources.
          </p>
        </div>
      )}

      {/* Filtered Empty State */}
      {contacts.length > 0 && filteredContacts.length === 0 && (
        <div className="px-6 py-8 text-center">
          <p className="text-gray-500">No contacts match the selected filter.</p>
          <button
            onClick={() => setFilter(null)}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700"
          >
            Clear filter
          </button>
        </div>
      )}
    </div>
  );
}

export default ContactList;
