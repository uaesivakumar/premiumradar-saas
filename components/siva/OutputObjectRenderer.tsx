'use client';

/**
 * Output Object Renderer - Sprint S26/S27
 * Renders AI-generated output objects in the result surface
 *
 * UX PRINCIPLES:
 * - AI-native: Actions trigger SIVA queries
 * - User-friendly: Click to expand, clear labels
 * - Actionable: Find Contacts, Generate Outreach buttons
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Pin,
  X,
  ChevronDown,
  ChevronUp,
  Search,
  Trophy,
  Send,
  Database,
  Lightbulb,
  Building2,
  TrendingUp,
  Users,
  Copy,
  Check,
  UserPlus,
  Mail,
  Linkedin,
  Phone,
  Briefcase,
} from 'lucide-react';
import { OutputObject, useSIVAStore } from '@/lib/stores/siva-store';
import { useIndustryStore, getIndustryConfig } from '@/lib/stores/industry-store';

interface OutputObjectRendererProps {
  object: OutputObject;
}

export function OutputObjectRenderer({ object }: OutputObjectRendererProps) {
  const { togglePinObject, toggleExpandObject, removeOutputObject } = useSIVAStore();
  const { detectedIndustry } = useIndustryStore();
  const industryConfig = getIndustryConfig(detectedIndustry);

  const getIcon = () => {
    switch (object.type) {
      case 'discovery':
        return <Search className="w-5 h-5" />;
      case 'ranking':
        return <Trophy className="w-5 h-5" />;
      case 'outreach':
        return <Send className="w-5 h-5" />;
      case 'insight':
        return <Lightbulb className="w-5 h-5" />;
      case 'contacts':
        return <UserPlus className="w-5 h-5" />;
      default:
        return <Database className="w-5 h-5" />;
    }
  };

  const getGradient = () => {
    switch (object.type) {
      case 'discovery':
        return 'from-blue-500 to-cyan-500';
      case 'ranking':
        return 'from-amber-500 to-orange-500';
      case 'outreach':
        return 'from-green-500 to-emerald-500';
      case 'insight':
        return 'from-purple-500 to-pink-500';
      case 'contacts':
        return 'from-indigo-500 to-purple-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const renderContent = () => {
    switch (object.type) {
      case 'discovery':
        return <DiscoveryContent data={object.data} />;
      case 'ranking':
        return <RankingContent data={object.data} />;
      case 'outreach':
        return <OutreachContent data={object.data} />;
      case 'insight':
        return <InsightContent data={object.data} />;
      case 'contacts':
        return <ContactsContent data={object.data} />;
      default:
        return <GenericContent data={object.data} />;
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      className={`bg-slate-800/60 backdrop-blur-sm rounded-2xl border overflow-hidden ${
        object.pinned ? 'border-yellow-500/30' : 'border-white/10'
      }`}
      style={{
        boxShadow: object.pinned
          ? '0 0 20px rgba(234, 179, 8, 0.1)'
          : '0 4px 20px rgba(0, 0, 0, 0.2)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getGradient()} flex items-center justify-center text-white`}>
            {getIcon()}
          </div>
          <div>
            <h3 className="font-semibold text-white">{object.title}</h3>
            <p className="text-xs text-gray-500">
              {new Date(object.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Pin */}
          <button
            onClick={() => togglePinObject(object.id)}
            className={`p-2 rounded-lg transition-all ${
              object.pinned
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'hover:bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <Pin className="w-4 h-4" />
          </button>

          {/* Expand/Collapse */}
          <button
            onClick={() => toggleExpandObject(object.id)}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all"
          >
            {object.expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {/* Remove */}
          <button
            onClick={() => removeOutputObject(object.id)}
            className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <motion.div
        initial={false}
        animate={{
          height: object.expanded ? 'auto' : 0,
          opacity: object.expanded ? 1 : 0,
        }}
        className="overflow-hidden"
      >
        <div className="p-4">{renderContent()}</div>
      </motion.div>
    </motion.div>
  );
}

// Discovery Content - AI-Native UX with Progressive Loading
function DiscoveryContent({ data }: { data: Record<string, unknown> }) {
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { submitQuery } = useSIVAStore();

  const companies = data.companies as Array<{
    name: string;
    industry: string;
    score: number;
    grade?: 'hot' | 'warm' | 'cold';
    signal: string;
    signalDescription?: string;
    website?: string;
    size?: string;
    source?: string;
    sourceUrl?: string;
  }>;

  // Enhanced grade display with animations
  const getGradeDisplay = (grade?: string, score?: number): { label: string; color: string; bgColor: string; glow: string; icon: string } => {
    // Use score to determine tier if grade not provided
    const tier = grade || (score && score >= 70 ? 'hot' : score && score >= 45 ? 'warm' : 'cold');

    switch (tier) {
      case 'hot':
        return {
          label: 'Hot Lead',
          color: 'text-red-400',
          bgColor: 'bg-gradient-to-r from-red-500/30 to-orange-500/20',
          glow: 'shadow-[0_0_15px_rgba(239,68,68,0.3)]',
          icon: '🔥'
        };
      case 'warm':
        return {
          label: 'Warm Lead',
          color: 'text-orange-400',
          bgColor: 'bg-gradient-to-r from-orange-500/25 to-yellow-500/15',
          glow: 'shadow-[0_0_10px_rgba(251,146,60,0.2)]',
          icon: '⚡'
        };
      default:
        return {
          label: 'New Lead',
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/20',
          glow: '',
          icon: '💡'
        };
    }
  };

  // Handle live refresh
  const handleLiveRefresh = async () => {
    setIsRefreshing(true);
    try {
      await submitQuery('Find employers with strong hiring signals in UAE using live data');
    } finally {
      setTimeout(() => setIsRefreshing(false), 2000);
    }
  };

  const handleFindContacts = (companyName: string) => {
    submitQuery(`Find HR decision makers at ${companyName} for employee banking`);
  };

  const handleGenerateOutreach = (companyName: string, signal: string) => {
    submitQuery(`Generate outreach email for ${companyName} based on their ${signal.toLowerCase()}`);
  };

  return (
    <div className="space-y-3">
      {companies?.map((company, i) => {
        const gradeDisplay = getGradeDisplay(company.grade, company.score);
        const isExpanded = expandedCompany === company.name;

        return (
          <motion.div
            key={company.name}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              delay: i * 0.15, // Progressive stagger
              duration: 0.4,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
            className={`bg-white/5 rounded-xl overflow-hidden hover:bg-white/[0.07] transition-all ${gradeDisplay.glow}`}
          >
            {/* Company Header - Always Visible */}
            <div
              className="flex items-center justify-between p-3 cursor-pointer"
              onClick={() => setExpandedCompany(isExpanded ? null : company.name)}
            >
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.15 + 0.2, type: 'spring', stiffness: 200 }}
                  className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold"
                >
                  {company.name.charAt(0)}
                </motion.div>
                <div>
                  <p className="font-medium text-white">{company.name}</p>
                  <p className="text-xs text-gray-500">{company.industry}</p>
                </div>
              </div>
              <div className="text-right flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3 h-3 text-green-400" />
                  <span className="text-sm text-gray-400">{company.signal}</span>
                </div>
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 + 0.3 }}
                  className="flex flex-col items-end"
                >
                  <span className={`text-xs px-2 py-0.5 rounded-full ${gradeDisplay.bgColor} ${gradeDisplay.color} font-medium flex items-center gap-1`}>
                    <span>{gradeDisplay.icon}</span>
                    {gradeDisplay.label}
                  </span>
                  <span className="text-xs text-gray-500 mt-0.5">Score: {company.score}</span>
                </motion.div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-white/5"
              >
                {/* Why This Company */}
                <div className="p-3 bg-gradient-to-r from-green-500/10 to-transparent">
                  <p className="text-xs text-green-400 font-medium mb-1">Why this company?</p>
                  <p className="text-sm text-gray-300">
                    {company.signalDescription || `${company.name} shows ${company.signal.toLowerCase()} activity, indicating potential need for employee banking solutions.`}
                  </p>
                  {company.source && (
                    <a
                      href={company.sourceUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:underline mt-1 inline-block"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Source: {company.source}
                    </a>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="p-3 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFindContacts(company.name);
                    }}
                    className="flex-1 py-2 px-3 rounded-lg bg-purple-500/20 text-purple-400 text-sm font-medium hover:bg-purple-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    Find Contacts
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGenerateOutreach(company.name, company.signal);
                    }}
                    className="flex-1 py-2 px-3 rounded-lg bg-green-500/20 text-green-400 text-sm font-medium hover:bg-green-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Generate Outreach
                  </button>
                </div>

                {/* Company Info */}
                <div className="px-3 pb-3 flex items-center gap-3 text-xs text-gray-500">
                  {company.size && (
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {company.size.toUpperCase()}
                    </span>
                  )}
                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Visit Website
                    </a>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        );
      })}

      {/* Summary + Live Refresh */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <p className="text-xs text-gray-500">
          {data.totalResults as number || companies?.length || 0} companies discovered
        </p>
        <div className="flex items-center gap-3">
          <p className="text-xs text-gray-500">
            Click to expand • AI-powered actions
          </p>
          <motion.button
            onClick={handleLiveRefresh}
            disabled={isRefreshing}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isRefreshing
                ? 'bg-blue-500/20 text-blue-400 cursor-wait'
                : 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-400 hover:from-purple-500/30 hover:to-blue-500/30'
            }`}
          >
            {isRefreshing ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full"
                />
                Refreshing...
              </>
            ) : (
              <>
                <Search className="w-3 h-3" />
                Live Refresh
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// EB Label Mapping - Match SIVA brain spec
const EB_SCORE_LABELS: Record<string, { label: string; shortLabel: string; color: string; weight: number }> = {
  T: { label: 'Hiring Intensity', shortLabel: 'Hiring', color: 'bg-purple-500', weight: 0.35 }, // Highest weight - fills first
  Q: { label: 'EB Fit', shortLabel: 'EB Fit', color: 'bg-blue-500', weight: 0.25 },
  L: { label: 'Decision Maker Quality', shortLabel: 'DM Quality', color: 'bg-green-500', weight: 0.20 },
  E: { label: 'Signal Evidence', shortLabel: 'Evidence', color: 'bg-orange-500', weight: 0.20 },
};

// Order by EB weight (Hiring Intensity first)
const EB_SCORE_ORDER = ['T', 'Q', 'L', 'E'];

// Animated Score Bar - Fills progressively
function AnimatedScoreBar({
  value,
  color,
  delay,
}: {
  value: number;
  color: string;
  delay: number;
}) {
  return (
    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
      <motion.div
        className={`h-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{
          duration: 0.8,
          delay,
          ease: [0.25, 0.46, 0.45, 0.94], // Custom easing for smooth fill
        }}
      />
    </div>
  );
}

// Ranking Content - With Animated EB Scores
function RankingContent({ data }: { data: Record<string, unknown> }) {
  const { submitQuery } = useSIVAStore();

  const rankings = data.rankings as Array<{
    rank: number;
    name: string;
    Q: number;
    T: number;
    L: number;
    E: number;
    total: number;
  }>;

  const handleFindContacts = (companyName: string) => {
    submitQuery(`Find HR decision makers at ${companyName}`);
  };

  const handleWhyRanked = (companyName: string, rank: number) => {
    submitQuery(`Why is ${companyName} ranked #${rank}?`);
  };

  return (
    <div className="space-y-4">
      {rankings?.map((item, itemIndex) => (
        <motion.div
          key={item.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: itemIndex * 0.15 }}
          className="p-4 bg-white/5 rounded-xl hover:bg-white/[0.07] transition-all"
        >
          {/* Company Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                  item.rank === 1
                    ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-black'
                    : item.rank === 2
                    ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-black'
                    : item.rank === 3
                    ? 'bg-gradient-to-br from-orange-400 to-amber-600 text-black'
                    : 'bg-white/10 text-white'
                }`}
              >
                #{item.rank}
              </div>
              <div>
                <span className="font-semibold text-white text-lg">{item.name}</span>
                <p className="text-xs text-gray-500">Employee Banking Opportunity</p>
              </div>
            </div>
            <div className="text-right">
              <motion.span
                className="text-3xl font-bold text-white"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: itemIndex * 0.15 + 0.3, type: 'spring' }}
              >
                {item.total}
              </motion.span>
              <p className="text-xs text-gray-500">Opportunity Score</p>
            </div>
          </div>

          {/* EB Scores - Animated with Hiring Intensity first */}
          <div className="space-y-3">
            {EB_SCORE_ORDER.map((letter, scoreIndex) => {
              const config = EB_SCORE_LABELS[letter];
              const value = item[letter as keyof typeof item] as number;
              // Stagger animation: each score bar fills after the previous
              const delay = itemIndex * 0.15 + scoreIndex * 0.2;

              return (
                <div key={letter}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">{config.label}</span>
                    <motion.span
                      className="text-xs font-medium text-white"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: delay + 0.5 }}
                    >
                      {value}
                    </motion.span>
                  </div>
                  <AnimatedScoreBar value={value} color={config.color} delay={delay} />
                </div>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mt-4 pt-3 border-t border-white/5">
            <button
              onClick={() => handleFindContacts(item.name)}
              className="flex-1 py-2 px-3 rounded-lg bg-purple-500/20 text-purple-400 text-sm font-medium hover:bg-purple-500/30 transition-all flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4" />
              Find Contacts
            </button>
            <button
              onClick={() => handleWhyRanked(item.name, item.rank)}
              className="flex-1 py-2 px-3 rounded-lg bg-white/5 text-gray-400 text-sm hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <Lightbulb className="w-4 h-4" />
              Why #{item.rank}?
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Outreach Content - with Edit and Copy functionality
function OutreachContent({ data }: { data: Record<string, unknown> }) {
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedBody, setEditedBody] = useState('');

  const { company, channel, subject, body, signals, contact } = data as {
    company: string;
    channel: string;
    subject: string;
    body: string;
    signals: string[];
    contact?: { name: string; title: string; email?: string };
  };

  // Initialize edited values
  React.useEffect(() => {
    setEditedSubject(subject || '');
    setEditedBody(body || '');
  }, [subject, body]);

  const handleCopy = async () => {
    const textToCopy = `Subject: ${editedSubject}\n\n${editedBody}`;
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentSubject = isEditing ? editedSubject : subject;
  const currentBody = isEditing ? editedBody : body;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs font-medium">
            {channel}
          </span>
          <span className="text-gray-400 text-sm">for</span>
          <span className="font-medium text-white">{company}</span>
        </div>
        {contact && (
          <div className="text-right">
            <p className="text-xs text-gray-400">{contact.name}</p>
            <p className="text-xs text-gray-500">{contact.title}</p>
          </div>
        )}
      </div>

      {/* No contact warning */}
      {!contact && (
        <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-xs text-yellow-400">
            No contact found. Use "Find Contacts" first to get HR decision makers.
          </p>
        </div>
      )}

      {/* Subject */}
      <div>
        <p className="text-xs text-gray-500 mb-1">Subject</p>
        {isEditing ? (
          <input
            type="text"
            value={editedSubject}
            onChange={(e) => setEditedSubject(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
          />
        ) : (
          <p className="text-white font-medium text-sm">{currentSubject}</p>
        )}
      </div>

      {/* Message */}
      <div>
        <p className="text-xs text-gray-500 mb-1">Message</p>
        {isEditing ? (
          <textarea
            value={editedBody}
            onChange={(e) => setEditedBody(e.target.value)}
            rows={6}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-gray-300 text-sm focus:outline-none focus:border-blue-500 resize-none"
          />
        ) : (
          <div className="p-3 bg-white/5 rounded-lg text-sm text-gray-300 whitespace-pre-wrap max-h-32 overflow-y-auto">
            {currentBody}
          </div>
        )}
      </div>

      {/* Signals */}
      {signals && signals.length > 0 && !isEditing && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500">Based on:</span>
          {signals.map((signal) => (
            <span
              key={signal}
              className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs"
            >
              {signal}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className="flex-1 py-2 rounded-lg bg-green-500/20 text-green-400 text-sm font-medium hover:bg-green-500/30 transition-all flex items-center justify-center gap-2"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy to Clipboard
            </>
          )}
        </button>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            isEditing
              ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          {isEditing ? 'Done' : 'Edit'}
        </button>
      </div>
    </div>
  );
}

// Insight Content
// Contacts Content - Shows HR/decision maker contacts for a company
function ContactsContent({ data }: { data: Record<string, unknown> }) {
  const { submitQuery } = useSIVAStore();
  const [copied, setCopied] = useState<string | null>(null);

  const company = data.company as string;
  const contacts = data.contacts as Array<{
    name: string;
    title: string;
    email?: string;
    linkedIn?: string;
    phone?: string;
    department?: string;
    seniority?: string;
  }>;
  const signal = data.signal as string;

  const handleCopyEmail = (email: string, contactName: string) => {
    navigator.clipboard.writeText(email);
    setCopied(contactName);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleGenerateOutreach = (contactName: string, contactTitle: string) => {
    submitQuery(`Write outreach email to ${contactName} (${contactTitle}) at ${company} about their ${signal || 'hiring expansion'}`);
  };

  if (!contacts || contacts.length === 0) {
    return (
      <div className="p-4 text-center">
        <Users className="w-10 h-10 text-gray-500 mx-auto mb-2" />
        <p className="text-gray-400">No contacts found for {company}.</p>
        <p className="text-gray-500 text-sm mt-1">Try searching with a more specific company domain.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Company Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-white/10">
        <Building2 className="w-5 h-5 text-indigo-400" />
        <div>
          <p className="font-medium text-white">{company}</p>
          <p className="text-xs text-gray-500">Decision Makers & Contacts</p>
        </div>
      </div>

      {/* Contacts List */}
      <div className="space-y-3">
        {contacts.map((contact, i) => (
          <motion.div
            key={contact.email || contact.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-3 bg-white/5 rounded-xl hover:bg-white/[0.08] transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                  {contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className="font-medium text-white">{contact.name}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Briefcase className="w-3 h-3" />
                    <span>{contact.title}</span>
                  </div>
                  {contact.department && (
                    <span className="text-xs text-gray-500">{contact.department}</span>
                  )}
                </div>
              </div>

              {/* Seniority Badge */}
              {contact.seniority && (
                <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                  {contact.seniority}
                </span>
              )}
            </div>

            {/* Contact Actions */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
              {contact.email && (
                <button
                  onClick={() => handleCopyEmail(contact.email!, contact.name)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition-all"
                >
                  {copied === contact.name ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-400" />
                      <span className="text-green-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-3.5 h-3.5" />
                      <span>{contact.email}</span>
                    </>
                  )}
                </button>
              )}
              {contact.linkedIn && (
                <a
                  href={contact.linkedIn}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-xs text-blue-400 transition-all"
                >
                  <Linkedin className="w-3.5 h-3.5" />
                  <span>LinkedIn</span>
                </a>
              )}
              {contact.phone && (
                <span className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-400">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{contact.phone}</span>
                </span>
              )}
            </div>

            {/* Generate Outreach Button */}
            <button
              onClick={() => handleGenerateOutreach(contact.name, contact.title)}
              className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 text-green-400 text-sm font-medium transition-all"
            >
              <Send className="w-4 h-4" />
              Generate Outreach for {contact.name.split(' ')[0]}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function InsightContent({ data }: { data: Record<string, unknown> }) {
  const { company, firmographic, decisionMakers, techStack } = data as {
    company: string;
    firmographic: { employees: string; revenue: string; founded: number };
    decisionMakers: string[];
    techStack: string[];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Building2 className="w-5 h-5 text-purple-400" />
        <span className="font-medium text-white">{company}</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-white/5 rounded-lg text-center">
          <p className="text-lg font-bold text-white">{firmographic?.employees}</p>
          <p className="text-xs text-gray-500">Employees</p>
        </div>
        <div className="p-3 bg-white/5 rounded-lg text-center">
          <p className="text-lg font-bold text-white">{firmographic?.revenue}</p>
          <p className="text-xs text-gray-500">Revenue</p>
        </div>
        <div className="p-3 bg-white/5 rounded-lg text-center">
          <p className="text-lg font-bold text-white">{firmographic?.founded}</p>
          <p className="text-xs text-gray-500">Founded</p>
        </div>
      </div>

      {decisionMakers && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Decision Makers</p>
          <div className="space-y-1">
            {decisionMakers.map((dm) => (
              <p key={dm} className="text-sm text-gray-300">
                {dm}
              </p>
            ))}
          </div>
        </div>
      )}

      {techStack && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Tech Stack</p>
          <div className="flex flex-wrap gap-2">
            {techStack.map((tech) => (
              <span
                key={tech}
                className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-400 text-xs"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Generic Content
function GenericContent({ data }: { data: Record<string, unknown> }) {
  return (
    <pre className="text-xs text-gray-400 overflow-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

export default OutputObjectRenderer;
