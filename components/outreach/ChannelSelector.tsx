'use client';

/**
 * Channel Selector Component
 *
 * Multi-channel selection for outreach (Email, LinkedIn, Phone).
 */

import { motion } from 'framer-motion';
import type { OutreachChannel } from '@/lib/outreach/types';

interface ChannelSelectorProps {
  selected: OutreachChannel | null;
  onSelect: (channel: OutreachChannel) => void;
  disabled?: boolean;
}

const channels: { id: OutreachChannel; icon: string; label: string; description: string }[] = [
  {
    id: 'email',
    icon: '📧',
    label: 'Email',
    description: 'Professional email outreach with detailed messaging',
  },
  {
    id: 'linkedin',
    icon: '💼',
    label: 'LinkedIn',
    description: 'Direct connection via LinkedIn InMail',
  },
  {
    id: 'phone',
    icon: '📞',
    label: 'Phone',
    description: 'Warm phone call with conversation script',
  },
];

export function ChannelSelector({ selected, onSelect, disabled = false }: ChannelSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {channels.map((channel) => (
        <motion.button
          key={channel.id}
          whileHover={{ scale: disabled ? 1 : 1.02 }}
          whileTap={{ scale: disabled ? 1 : 0.98 }}
          onClick={() => !disabled && onSelect(channel.id)}
          disabled={disabled}
          className={`
            p-6 rounded-xl border-2 text-left transition-all
            ${
              selected === channel.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <div className="text-4xl mb-3">{channel.icon}</div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{channel.label}</h3>
          <p className="text-sm text-gray-500 mt-1">{channel.description}</p>

          {selected === channel.id && (
            <div className="mt-3 flex items-center text-blue-600 text-sm font-medium">
              <span className="mr-1">✓</span> Selected
            </div>
          )}
        </motion.button>
      ))}
    </div>
  );
}

export default ChannelSelector;
