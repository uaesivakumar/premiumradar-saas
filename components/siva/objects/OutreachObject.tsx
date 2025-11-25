'use client';

/**
 * Outreach Object - Sprint S27
 * AI-generated outreach message card
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Linkedin,
  Phone,
  Send,
  Edit3,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  ChevronDown,
  MessageSquare,
} from 'lucide-react';
import { useIndustryStore, getIndustryConfig } from '@/lib/stores/industry-store';

type Channel = 'email' | 'linkedin' | 'phone';

interface OutreachObjectProps {
  company: string;
  contactName?: string;
  contactRole?: string;
  channel: Channel;
  subject?: string;
  body: string;
  signals: string[];
  tone?: 'professional' | 'friendly' | 'urgent';
  onSend?: () => void;
  onEdit?: () => void;
  onRegenerate?: () => void;
}

const CHANNEL_CONFIG: Record<Channel, { icon: typeof Mail; label: string; color: string }> = {
  email: { icon: Mail, label: 'Email', color: '#3B82F6' },
  linkedin: { icon: Linkedin, label: 'LinkedIn', color: '#0A66C2' },
  phone: { icon: Phone, label: 'Phone Script', color: '#10B981' },
};

const TONE_CONFIG = {
  professional: { label: 'Professional', emoji: '💼' },
  friendly: { label: 'Friendly', emoji: '😊' },
  urgent: { label: 'Urgent', emoji: '⚡' },
};

export function OutreachObject({
  company,
  contactName,
  contactRole,
  channel,
  subject,
  body,
  signals,
  tone = 'professional',
  onSend,
  onEdit,
  onRegenerate,
}: OutreachObjectProps) {
  const { detectedIndustry } = useIndustryStore();
  const industryConfig = getIndustryConfig(detectedIndustry);

  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedBody, setEditedBody] = useState(body);
  const [showToneDropdown, setShowToneDropdown] = useState(false);

  const channelConfig = CHANNEL_CONFIG[channel];
  const ChannelIcon = channelConfig.icon;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(subject ? `${subject}\n\n${body}` : body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    setIsEditing(false);
    // In real implementation, would call onEdit with new content
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${channelConfig.color}20` }}
          >
            <ChannelIcon className="w-5 h-5" style={{ color: channelConfig.color }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-white">{company}</span>
              <span
                className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: `${channelConfig.color}20`,
                  color: channelConfig.color,
                }}
              >
                {channelConfig.label}
              </span>
            </div>
            {contactName && (
              <p className="text-sm text-gray-500">
                To: {contactName}
                {contactRole && ` (${contactRole})`}
              </p>
            )}
          </div>
        </div>

        {/* Tone Selector */}
        <div className="relative">
          <button
            onClick={() => setShowToneDropdown(!showToneDropdown)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-400 transition-all"
          >
            <span>{TONE_CONFIG[tone].emoji}</span>
            <span>{TONE_CONFIG[tone].label}</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          <AnimatePresence>
            {showToneDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute right-0 top-full mt-1 bg-slate-800 rounded-lg border border-white/10 overflow-hidden z-10"
              >
                {Object.entries(TONE_CONFIG).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setShowToneDropdown(false);
                      // Would trigger regeneration with new tone
                    }}
                    className="flex items-center gap-2 px-3 py-2 w-full text-left text-sm text-gray-300 hover:bg-white/5 transition-colors"
                  >
                    <span>{config.emoji}</span>
                    <span>{config.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Signal Tags */}
      <div className="flex items-center gap-2 flex-wrap">
        <Sparkles className="w-3 h-3 text-purple-400" />
        <span className="text-xs text-gray-500">Based on:</span>
        {signals.map((signal) => (
          <span
            key={signal}
            className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs"
          >
            {signal}
          </span>
        ))}
      </div>

      {/* Subject (for email) */}
      {channel === 'email' && subject && (
        <div className="p-3 bg-slate-900/50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Subject</p>
          <p className="text-white font-medium">{subject}</p>
        </div>
      )}

      {/* Message Body */}
      <div className="relative">
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editedBody}
              onChange={(e) => setEditedBody(e.target.value)}
              className="w-full p-4 bg-slate-900/50 rounded-xl border border-white/10 text-white text-sm resize-none focus:outline-none focus:border-blue-500/50 transition-colors"
              rows={8}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setEditedBody(body);
                  setIsEditing(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 text-sm hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 text-sm hover:bg-blue-500/30 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-900/50 rounded-xl border border-white/5">
            <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
              {body}
            </p>
          </div>
        )}
      </div>

      {/* Character Count */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{body.length} characters</span>
        {channel === 'linkedin' && body.length > 300 && (
          <span className="text-yellow-400">LinkedIn recommends under 300 chars</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <motion.button
          onClick={onSend}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-medium transition-all"
          style={{
            background: `linear-gradient(135deg, ${industryConfig.primaryColor}, ${industryConfig.secondaryColor})`,
          }}
        >
          <Send className="w-4 h-4" />
          Send Now
        </motion.button>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
          title="Edit"
        >
          <Edit3 className="w-4 h-4" />
        </button>

        <button
          onClick={handleCopy}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
          title="Copy"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
        </button>

        <button
          onClick={onRegenerate}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
          title="Regenerate"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Alternative Versions */}
      <div className="p-3 bg-slate-900/30 rounded-lg border border-white/5">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <MessageSquare className="w-3 h-3" />
          <span>Try a different approach:</span>
        </div>
        <div className="flex gap-2 mt-2">
          <button className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-400 transition-colors">
            Shorter version
          </button>
          <button className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-400 transition-colors">
            More formal
          </button>
          <button className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-400 transition-colors">
            Add CTA
          </button>
        </div>
      </div>
    </div>
  );
}

export default OutreachObject;
