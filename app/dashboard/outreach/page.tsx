'use client';

/**
 * VS11.3: Outreach Page
 * Sprint: VS11 (Frontend Wiring)
 *
 * AI-powered outreach message composition.
 * Now fetches real company data from API based on URL params.
 *
 * Authorization Code: VS11-FRONTEND-WIRING-20251213
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { OutreachComposer } from '@/components/outreach';
import type { BankingCompanyProfile, BankingSignal } from '@/lib/scoring/types';
import { Loader2, AlertCircle } from 'lucide-react';

export default function OutreachPage() {
  const searchParams = useSearchParams();
  const companyId = searchParams?.get('companyId') || null;
  const contactId = searchParams?.get('contactId') || null;

  const [showComposer, setShowComposer] = useState(false);
  const [company, setCompany] = useState<BankingCompanyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentMessages, setSentMessages] = useState<
    { channel: string; subject?: string; body: string; sentAt: Date; companyName?: string }[]
  >([]);

  // VS11.3: Fetch company data if companyId is provided
  useEffect(() => {
    const fetchCompany = async () => {
      if (!companyId) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/companies/${companyId}`);
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to load company');
        }

        // Transform API response to BankingCompanyProfile format
        const companyData: BankingCompanyProfile = {
          id: result.data.company.id,
          name: result.data.company.name,
          industry: result.data.company.industry || 'Unknown',
          subIndustry: result.data.company.industry || 'General',
          size: result.data.company.size || 'mid-market',
          region: `${result.data.company.region}-${result.data.company.city || 'Main'}`,
          country: result.data.company.region || 'UAE',
          bankingTier: result.data.company.bankingTier || 'tier2',
          regulatoryStatus: 'compliant',
          digitalMaturity: 'fast-follower',
          signals: result.data.signals.map((s: { type: string; title: string; confidence: number; date: string }) => ({
            id: s.type,
            name: s.title,
            category: 'opportunity',
            weight: s.confidence / 100,
            description: s.title,
            value: s.confidence,
            timestamp: new Date(s.date),
          })) as BankingSignal[],
        };

        setCompany(companyData);
        // Auto-open composer if company was pre-selected
        setShowComposer(true);
      } catch (err) {
        console.error('[Outreach] Error fetching company:', err);
        setError(err instanceof Error ? err.message : 'Failed to load company');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompany();
  }, [companyId]);

  const handleSend = async (message: { channel: string; subject?: string; body: string }) => {
    // VS11.3: If we have a company, also call the OS outreach API
    if (company) {
      try {
        await fetch('/api/os/outreach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leads: [{
              id: company.id,
              name: company.name,
              company: company.name,
              industry: company.industry,
            }],
            options: {
              channel: message.channel,
              tone: 'friendly',
              personalization_level: 'high',
            },
          }),
        });
      } catch (osError) {
        console.warn('[Outreach] OS outreach call failed:', osError);
        // Continue anyway - local state still updates
      }
    }

    setSentMessages((prev) => [
      ...prev,
      { ...message, sentAt: new Date(), companyName: company?.name },
    ]);
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
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50"
          >
            + New Outreach
          </button>
        </div>

        {/* Loading state for pre-selected company */}
        {isLoading && (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mr-3" />
            <span className="text-gray-600">Loading company data...</span>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Composer Modal */}
        {showComposer && company && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <OutreachComposer
              company={company}
              signals={company.signals}
              onSend={handleSend}
              onCancel={() => setShowComposer(false)}
            />
          </div>
        )}

        {/* No company selected - show prompt */}
        {showComposer && !company && !isLoading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                Select a Company First
              </h3>
              <p className="text-gray-500 mb-6">
                Go to Discovery or Company Profile to select a company for outreach.
              </p>
              <button
                onClick={() => setShowComposer(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Close
              </button>
            </div>
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
                      {msg.companyName && (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          to {msg.companyName}
                        </span>
                      )}
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
