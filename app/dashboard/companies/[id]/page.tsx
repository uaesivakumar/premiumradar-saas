'use client';

/**
 * Company Profile Page
 * VS12.9: Wired to real API (mock data removed)
 *
 * Full company profile with:
 * - Company header (logo, name, QTLE score)
 * - Signal history timeline
 * - Key contacts list
 * - Activity timeline
 * - Quick actions (outreach, SIVA analysis)
 *
 * Authorization Code: VS12-FRONTEND-WIRING-20251213
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  MessageSquare,
  Bot,
  Share2,
  MoreHorizontal,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { CompanyHeader, type CompanyHeaderProps } from '@/components/company/CompanyHeader';
import { SignalHistory, type SignalItem } from '@/components/company/SignalHistory';
import { ContactList, type Contact } from '@/components/company/ContactList';
import { CompanyActivity, type Activity } from '@/components/company/CompanyActivity';

// Tab configuration
type TabId = 'overview' | 'signals' | 'contacts' | 'activity';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'signals', label: 'Signals' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'activity', label: 'Activity' },
];

// VS12.9: Company data interface (replaces deprecated mock function)
interface CompanyData {
  company: CompanyHeaderProps['company'];
  score: CompanyHeaderProps['score'];
  signals: SignalItem[];
  contacts: Contact[];
  activities: Activity[];
}

// VS12.9: Mock data function removed - all data comes from API

export default function CompanyProfilePage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params?.id as string || '';

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CompanyData | null>(null);

  // VS11.2: Fetch company data from REAL API
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // VS11.2: Real API call - no more mock data
        const response = await fetch(`/api/companies/${companyId}`);
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to load company');
        }

        // Transform API response to expected format
        setData({
          company: result.data.company,
          score: result.data.score,
          signals: result.data.signals,
          contacts: result.data.contacts,
          activities: result.data.activities,
        });
      } catch (err) {
        console.error('[CompanyProfile] Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load company data');
      } finally {
        setIsLoading(false);
      }
    };

    if (companyId) {
      fetchData();
    }
  }, [companyId]);

  const handleStartOutreach = (contact: Contact) => {
    // TODO: Navigate to outreach composer with contact pre-filled
    console.log('[Outreach] Starting for:', contact.name);
    router.push(`/dashboard/outreach?companyId=${companyId}&contactId=${contact.id}`);
  };

  const handleSivaAnalysis = () => {
    // TODO: Trigger SIVA analysis
    console.log('[SIVA] Requesting analysis for:', companyId);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-500">Loading company profile...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-gray-900 font-medium mb-2">Failed to load company</p>
        <p className="text-gray-500 mb-4">{error || 'Company not found'}</p>
        <div className="flex gap-3">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button & Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Discovery</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSivaAnalysis}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            <Bot className="w-4 h-4" />
            Ask SIVA
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <MessageSquare className="w-4 h-4" />
            Start Outreach
          </button>
          <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Share2 className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <MoreHorizontal className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Company Header */}
      <CompanyHeader
        company={data.company}
        score={data.score}
        lastUpdated={new Date().toISOString()}
      />

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Signals & Contacts Summary */}
            <div className="space-y-6">
              <SignalHistory signals={data.signals.slice(0, 3)} maxVisible={3} />
              <ContactList
                contacts={data.contacts.slice(0, 3)}
                onStartOutreach={handleStartOutreach}
              />
            </div>

            {/* Right Column - Activity */}
            <div>
              <CompanyActivity activities={data.activities} maxVisible={5} />
            </div>
          </div>
        )}

        {activeTab === 'signals' && <SignalHistory signals={data.signals} maxVisible={20} />}

        {activeTab === 'contacts' && (
          <ContactList contacts={data.contacts} onStartOutreach={handleStartOutreach} />
        )}

        {activeTab === 'activity' && (
          <CompanyActivity activities={data.activities} maxVisible={50} />
        )}
      </motion.div>
    </div>
  );
}
