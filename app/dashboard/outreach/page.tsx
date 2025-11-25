'use client';

/**
 * Outreach Page
 *
 * AI-powered outreach message composition for banking prospects.
 */

import { useState } from 'react';
import { OutreachComposer } from '@/components/outreach';
import type { BankingCompanyProfile, BankingSignal } from '@/lib/scoring/types';
import { BANKING_SIGNAL_LIBRARY } from '@/lib/scoring/banking-signals';

// Mock company for demo
const mockCompany: BankingCompanyProfile = {
  id: '1',
  name: 'Emirates NBD',
  industry: 'Banking',
  subIndustry: 'Retail Banking',
  size: 'enterprise',
  region: 'UAE-Dubai',
  country: 'UAE',
  bankingTier: 'tier1',
  regulatoryStatus: 'compliant',
  digitalMaturity: 'leader',
  signals: [
    { ...BANKING_SIGNAL_LIBRARY.legacyModernization, value: 90, timestamp: new Date() },
    { ...BANKING_SIGNAL_LIBRARY.leadershipChange, value: 85, timestamp: new Date() },
    { ...BANKING_SIGNAL_LIBRARY.websiteVisit, value: 70, timestamp: new Date() },
  ] as BankingSignal[],
};

export default function OutreachPage() {
  const [showComposer, setShowComposer] = useState(false);
  const [sentMessages, setSentMessages] = useState<
    { channel: string; subject?: string; body: string; sentAt: Date }[]
  >([]);

  const handleSend = (message: { channel: string; subject?: string; body: string }) => {
    setSentMessages((prev) => [...prev, { ...message, sentAt: new Date() }]);
    setShowComposer(false);
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Outreach</h1>
            <p className="text-gray-500 mt-1">
              Compose personalized outreach messages with AI assistance
            </p>
          </div>
          <button
            onClick={() => setShowComposer(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600"
          >
            + New Outreach
          </button>
        </div>

        {/* Composer Modal */}
        {showComposer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <OutreachComposer
              company={mockCompany}
              signals={mockCompany.signals}
              onSend={handleSend}
              onCancel={() => setShowComposer(false)}
            />
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {sentMessages.length}
            </div>
            <div className="text-sm text-gray-500">Messages Sent</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">0</div>
            <div className="text-sm text-gray-500">Replies Received</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">0%</div>
            <div className="text-sm text-gray-500">Response Rate</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">6</div>
            <div className="text-sm text-gray-500">Templates Available</div>
          </div>
        </div>

        {/* Sent Messages */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">Recent Outreach</h2>
          </div>

          {sentMessages.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {sentMessages.map((msg, idx) => (
                <div key={idx} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 text-xs rounded font-medium ${
                          msg.channel === 'email'
                            ? 'bg-blue-100 text-blue-800'
                            : msg.channel === 'linkedin'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {msg.channel}
                      </span>
                      {msg.subject && (
                        <span className="font-medium text-gray-900 dark:text-white">
                          {msg.subject}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {msg.sentAt.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {msg.body}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500">
              <div className="text-4xl mb-4">📨</div>
              <p>No messages sent yet</p>
              <p className="text-sm mt-1">Click &quot;New Outreach&quot; to compose your first message</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
